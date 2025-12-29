import React, { useState } from 'react';
import { X, Send, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TransferModal = ({ dog, professionalAccountId, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: Confirmation, 3: Success
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transferMode, setTransferMode] = useState(null); // 'immediate' ou 'pending'

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Vérifier si l'email existe dans user_profiles
      const { data: existingUser, error: userError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      if (existingUser) {
        // L'utilisateur existe déjà
        setTransferMode('immediate');
      } else {
        // L'utilisateur n'existe pas, on va créer un pending_transfer
        setTransferMode('pending');
      }

      setStep(2);
    } catch (err) {
      console.error('Erreur vérification email:', err);
      setError('Erreur lors de la vérification de l\'email');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      if (transferMode === 'immediate') {
        // Transfert immédiat
        await handleImmediateTransfer();
      } else {
        // Transfert avec invitation
        await handlePendingTransfer();
      }

      setStep(3);
      
      // Fermer et callback après 2 secondes
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);

    } catch (err) {
      console.error('Erreur transfert:', err);
      setError(err.message || 'Erreur lors du transfert');
    } finally {
      setLoading(false);
    }
  };

  const handleImmediateTransfer = async () => {
    // Récupérer l'utilisateur
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (userError) throw userError;

    // Transférer le chien
    const { error: updateError } = await supabase
      .from('dogs')
      .update({
        user_id: userProfile.id,
        professional_account_id: null,
        is_for_adoption: false,
        adoption_status: 'adopted',
        updated_at: new Date().toISOString()
      })
      .eq('id', dog.id);

    if (updateError) throw updateError;

    // Créer une notification
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: userProfile.id,
        type: 'dog_received',
        title: `🎉 ${dog.name} a été transféré sur votre compte !`,
        message: `${dog.name} a été transféré avec succès. Vous pouvez maintenant gérer son profil de santé.`,
        data: { dog_id: dog.id, dog_name: dog.name },
        created_at: new Date().toISOString()
      });

    if (notifError) console.error('Erreur notification:', notifError);
  };

  const handlePendingTransfer = async () => {
    // Générer un token aléatoire
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const token12 = token.substring(0, 12).toUpperCase();

    // Créer le pending_transfer
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours

    const { data: transfer, error: transferError } = await supabase
      .from('pending_transfers')
      .insert({
        dog_id: dog.id,
        from_professional_account_id: professionalAccountId,
        to_email: email.toLowerCase(),
        transfer_token: token12,
        status: 'pending',
        dog_data: dog, // Backup des données du chien
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (transferError) throw transferError;

    // Mettre à jour le statut du chien
    const { error: updateError } = await supabase
      .from('dogs')
      .update({
        adoption_status: 'pending_transfer',
        updated_at: new Date().toISOString()
      })
      .eq('id', dog.id);

    if (updateError) throw updateError;

    // Appeler l'Edge Function pour envoyer l'email
    const { error: emailError } = await supabase.functions.invoke('send-transfer-email', {
      body: {
        to_email: email.toLowerCase(),
        dog_name: dog.name,
        dog_photo: dog.photo_url,
        transfer_token: token12,
        expires_days: 7
      }
    });

    if (emailError) {
      console.error('Erreur envoi email:', emailError);
      // On ne bloque pas le transfert si l'email échoue
    }
  };

  return (
    <>
      {/* Overlay noir */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div 
          className="bg-white rounded-3xl max-w-md w-full p-8 relative"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Bouton fermer */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>

          {/* Étape 1 : Saisie email */}
          {step === 1 && (
            <>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                Transférer {dog.name}
              </h2>
              <p className="text-gray-600 mb-6">
                Entrez l'adresse email de la personne qui adopte {dog.name}
              </p>

              <form onSubmit={handleEmailSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de l'adoptant
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="exemple@email.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin" size={20} />
                        Vérification...
                      </>
                    ) : (
                      <>
                        Continuer
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Étape 2 : Confirmation */}
          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="text-blue-600" size={32} />
                </div>
                <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                  Confirmer le transfert
                </h2>
              </div>

              {transferMode === 'immediate' ? (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r mb-6">
                  <p className="text-sm text-green-900">
                    <strong>✓ Transfert immédiat</strong><br />
                    L'utilisateur <strong>{email}</strong> possède déjà un compte. {dog.name} sera transféré immédiatement sur son compte.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r mb-6">
                  <p className="text-sm text-blue-900">
                    <strong>📧 Invitation par email</strong><br />
                    Un email sera envoyé à <strong>{email}</strong> avec un lien pour récupérer {dog.name}. Le lien sera valide pendant 7 jours.
                  </p>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-xl mb-6">
                <p className="text-sm text-gray-700">
                  <strong>Ce qui sera transféré :</strong>
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• Toutes les informations de {dog.name}</li>
                  <li>• Historique des vaccinations</li>
                  <li>• Dossier médical complet</li>
                  <li>• Photos et documents</li>
                </ul>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Transfert...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Confirmer
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Étape 3 : Succès */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600" size={40} />
              </div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                Transfert réussi !
              </h2>
              
              {transferMode === 'immediate' ? (
                <p className="text-gray-600 mb-6">
                  {dog.name} a été transféré avec succès sur le compte de <strong>{email}</strong>.
                </p>
              ) : (
                <p className="text-gray-600 mb-6">
                  Un email a été envoyé à <strong>{email}</strong> avec les instructions pour récupérer {dog.name}.
                </p>
              )}

              <button
                onClick={onClose}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
              >
                Fermer
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default TransferModal;
