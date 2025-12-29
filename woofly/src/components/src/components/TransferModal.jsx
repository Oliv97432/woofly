import React, { useState } from 'react';
import { X, Mail, AlertCircle, CheckCircle, Loader, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const TransferModal = ({ dog, professionalAccountId, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('input'); // 'input', 'confirm', 'success'
  const [userExists, setUserExists] = useState(false);

  // Valider l'email
  const validateEmail = (email) => {
    const re = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return re.test(email);
  };

  // Vérifier si l'email existe dans Doogybook
  const checkEmailExists = async () => {
    if (!validateEmail(email)) {
      setError('Veuillez saisir une adresse email valide');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Vérifier si l'email existe dans user_profiles
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .limit(1);

      if (profileError) throw profileError;

      if (profiles && profiles.length > 0) {
        // User existe déjà
        setUserExists(true);
        setStep('confirm');
      } else {
        // User n'existe pas encore
        setUserExists(false);
        setStep('confirm');
      }
    } catch (err) {
      console.error('Erreur vérification email:', err);
      setError('Erreur lors de la vérification de l\'email');
    } finally {
      setIsLoading(false);
    }
  };

  // Générer un token unique
  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 12; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  // Transférer le chien immédiatement (si user existe)
  const transferImmediately = async () => {
    setIsLoading(true);
    setError('');

    try {
      // 1. Trouver le user_id depuis l'email
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (profileError) throw profileError;

      const targetUserId = profiles.id;

      // 2. Mettre à jour le chien
      const { error: dogError } = await supabase
        .from('dogs')
        .update({
          user_id: targetUserId,
          professional_account_id: null,
          is_for_adoption: false,
          adoption_status: 'adopted',
          updated_at: new Date().toISOString()
        })
        .eq('id', dog.id);

      if (dogError) throw dogError;

      // 3. Créer une notification pour l'adoptant
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          type: 'dog_received',
          title: `🎉 Vous avez reçu ${dog.name} !`,
          message: `Le chien ${dog.name} a été transféré sur votre compte. Vous pouvez maintenant gérer son profil.`,
          data: { dog_id: dog.id, dog_name: dog.name },
          created_at: new Date().toISOString()
        });

      if (notifError) console.error('Erreur création notification:', notifError);

      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err) {
      console.error('Erreur transfert:', err);
      setError('Erreur lors du transfert du chien');
    } finally {
      setIsLoading(false);
    }
  };

  // Créer un transfert en attente (si user n'existe pas encore)
  const createPendingTransfer = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = generateToken();
      const dogData = {
        name: dog.name,
        breed: dog.breed,
        age: dog.age,
        sex: dog.sex,
        photo_url: dog.photo_url,
        description: dog.description
      };

      // 1. Créer le pending_transfer
      const { error: transferError } = await supabase
        .from('pending_transfers')
        .insert({
          dog_id: dog.id,
          from_professional_account_id: professionalAccountId,
          to_email: email.toLowerCase().trim(),
          transfer_token: token,
          dog_data: dogData,
          status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (transferError) throw transferError;

      // 2. Appeler l'Edge Function pour envoyer l'email
      const { error: emailError } = await supabase.functions.invoke('send-transfer-email', {
        body: {
          to_email: email.toLowerCase().trim(),
          dog_name: dog.name,
          dog_photo: dog.photo_url,
          transfer_token: token,
          expires_days: 7
        }
      });

      if (emailError) {
        console.error('Erreur envoi email:', emailError);
        // Ne pas bloquer le transfert si l'email échoue
      }

      // 3. Marquer le chien comme en attente de transfert
      const { error: dogError } = await supabase
        .from('dogs')
        .update({
          adoption_status: 'pending_transfer',
          updated_at: new Date().toISOString()
        })
        .eq('id', dog.id);

      if (dogError) throw dogError;

      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 3000);

    } catch (err) {
      console.error('Erreur création transfert:', err);
      setError('Erreur lors de la création du transfert');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmer le transfert
  const handleConfirm = () => {
    if (userExists) {
      transferImmediately();
    } else {
      createPendingTransfer();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-heading font-bold text-gray-900">
            Transférer {dog.name}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-smooth"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Étape 1 : Saisie de l'email */}
        {step === 'input' && (
          <div className="space-y-6">
            {/* Photo du chien */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              {dog.photo_url ? (
                <img
                  src={dog.photo_url}
                  alt={dog.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                  {dog.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-900 text-lg">{dog.name}</h4>
                <p className="text-sm text-gray-600">{dog.breed}</p>
              </div>
            </div>

            {/* Explication */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
              <div className="flex gap-3">
                <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Comment ça marche ?</p>
                  <ul className="space-y-1 text-blue-800">
                    <li>• Si la personne a un compte Doogybook, le transfert est immédiat</li>
                    <li>• Sinon, elle recevra un email pour s'inscrire et récupérer {dog.name}</li>
                    <li>• Toutes les données du chien seront transférées (photos, vaccins, notes)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Champ email */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email de l'adoptant
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="exemple@email.com"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={16} />
                  {error}
                </p>
              )}
            </div>

            {/* Bouton suivant */}
            <button
              onClick={checkEmailExists}
              disabled={!email || isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Vérification...
                </>
              ) : (
                <>
                  Continuer
                  <Send size={20} />
                </>
              )}
            </button>
          </div>
        )}

        {/* Étape 2 : Confirmation */}
        {step === 'confirm' && (
          <div className="space-y-6">
            {userExists ? (
              // User existe déjà
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl">
                <div className="flex gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                  <div className="text-sm text-green-900">
                    <p className="font-semibold mb-2">✅ Utilisateur trouvé !</p>
                    <p>
                      L'adresse <strong>{email}</strong> possède déjà un compte Doogybook.
                    </p>
                    <p className="mt-2">
                      Le chien <strong>{dog.name}</strong> sera transféré immédiatement sur son compte.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // User n'existe pas encore
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl">
                <div className="flex gap-3">
                  <Mail className="text-orange-600 flex-shrink-0" size={24} />
                  <div className="text-sm text-orange-900">
                    <p className="font-semibold mb-2">📧 Invitation par email</p>
                    <p>
                      L'adresse <strong>{email}</strong> n'a pas encore de compte Doogybook.
                    </p>
                    <p className="mt-2">
                      Un email d'invitation sera envoyé avec un lien pour s'inscrire et récupérer <strong>{dog.name}</strong>.
                    </p>
                    <p className="mt-2 text-xs text-orange-800">
                      ⏰ Le lien sera valide pendant 7 jours.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Récapitulatif */}
            <div className="bg-gray-50 p-4 rounded-xl space-y-2">
              <h4 className="font-semibold text-gray-900 mb-3">Récapitulatif du transfert</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Chien :</span>
                <span className="font-medium text-gray-900">{dog.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Race :</span>
                <span className="font-medium text-gray-900">{dog.breed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Adoptant :</span>
                <span className="font-medium text-gray-900">{email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mode :</span>
                <span className="font-medium text-gray-900">
                  {userExists ? 'Transfert immédiat' : 'Invitation par email'}
                </span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={16} />
                {error}
              </p>
            )}

            {/* Boutons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('input')}
                disabled={isLoading}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-smooth disabled:opacity-50"
              >
                Retour
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Transfert...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Confirmer
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Étape 3 : Succès */}
        {step === 'success' && (
          <div className="space-y-6 text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="text-green-600" size={40} />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-gray-900 mb-2">
                {userExists ? 'Transfert réussi !' : 'Email envoyé !'}
              </h4>
              <p className="text-gray-600">
                {userExists
                  ? `${dog.name} a été transféré avec succès à ${email}`
                  : `Un email d'invitation a été envoyé à ${email}`}
              </p>
            </div>
            {!userExists && (
              <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-900">
                <p>
                  Dès que la personne s'inscrira et cliquera sur le lien dans l'email,
                  elle récupérera automatiquement <strong>{dog.name}</strong> sur son compte.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default TransferModal;
