import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Mail, User, AlertCircle } from 'lucide-react';

const TransferToAdopterModal = ({ isOpen, onClose, dog, proAccount, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [adopterUser, setAdopterUser] = useState(null);
  const [step, setStep] = useState('email'); // 'email' ou 'confirm'

  const searchAdopter = async (e) => {
    e.preventDefault();

    if (!email) {
      alert('Veuillez saisir un email');
      return;
    }

    try {
      setLoading(true);

      // Chercher l'utilisateur dans auth.users
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (userError || !userData) {
        alert('❌ Aucun utilisateur trouvé avec cet email.\nAssurez-vous que la personne a créé un compte sur Woofly.');
        return;
      }

      setAdopterUser(userData);
      setStep('confirm');
    } catch (err) {
      console.error('Erreur recherche adoptant:', err);
      alert('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!adopterUser) return;

    if (!confirm(`Transférer définitivement ${dog.name} à ${adopterUser.full_name || adopterUser.email} ?\n\n⚠️ Cette action est irréversible. Le refuge perdra l'accès à ce chien.`)) {
      return;
    }

    try {
      setLoading(true);

      // 1. Si le chien était en FA, fermer le placement
      if (dog.foster_family_contact_id) {
        // Trouver le placement actif
        const { data: activePlacement } = await supabase
          .from('placement_history')
          .select('*')
          .eq('dog_id', dog.id)
          .eq('status', 'active')
          .eq('placement_type', 'foster')
          .single();

        if (activePlacement) {
          // Fermer le placement FA
          await supabase
            .from('placement_history')
            .update({
              end_date: new Date().toISOString(),
              status: 'completed',
              end_reason: 'adopted'
            })
            .eq('id', activePlacement.id);

          // Décrémenter le compteur de la FA
          await supabase
            .from('contacts')
            .update({
              current_dogs_count: supabase.raw('current_dogs_count - 1')
            })
            .eq('id', activePlacement.contact_id);
        }
      }

      // 2. Créer l'historique d'adoption
      const { error: historyError } = await supabase
        .from('placement_history')
        .insert([{
          contact_id: null, // Pas de contact car adoption directe
          dog_id: dog.id,
          professional_account_id: proAccount.id,
          placement_type: 'adoption',
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
          status: 'completed',
          end_reason: 'adopted'
        }]);

      if (historyError) throw historyError;

      // 3. TRANSFERT : Changer le propriétaire du chien
      const { error: transferError } = await supabase
        .from('dogs')
        .update({
          professional_account_id: null,        // Le refuge perd la propriété
          user_id: adopterUser.id,              // L'adoptant devient propriétaire
          foster_family_user_id: null,          // Plus en FA
          foster_family_contact_id: null,       // Plus en FA
          adoption_status: 'adopted'            // Statut adopté
        })
        .eq('id', dog.id);

      if (transferError) throw transferError;

      alert(`✅ ${dog.name} a été transféré avec succès à ${adopterUser.full_name || adopterUser.email} !\n\nLe chien apparaît maintenant dans le compte de l'adoptant.`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erreur transfert:', err);
      alert('❌ Erreur lors du transfert: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setAdopterUser(null);
    setStep('email');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-lg w-full">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold text-foreground">
            Transférer {dog.name} à un adoptant
          </h2>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-2 hover:bg-muted rounded-lg transition-smooth min-h-[44px] min-w-[44px]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 'email' && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">⚠️ Transfert définitif</p>
                    <p>L'adoptant deviendra propriétaire du chien. Vous perdrez l'accès à cette fiche.</p>
                  </div>
                </div>
              </div>

              <form onSubmit={searchAdopter} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Email de l'adoptant *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="exemple@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    L'adoptant doit avoir créé un compte sur Woofly
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      onClose();
                    }}
                    className="flex-1 py-3 border-2 border-border rounded-xl font-medium hover:bg-muted transition-smooth min-h-[44px]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth min-h-[44px]"
                  >
                    {loading ? 'Recherche...' : 'Rechercher'}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 'confirm' && adopterUser && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                    {adopterUser.full_name?.charAt(0).toUpperCase() || adopterUser.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 mb-1">
                      Utilisateur trouvé !
                    </h3>
                    <div className="space-y-1 text-sm text-green-800">
                      {adopterUser.full_name && (
                        <div className="flex items-center gap-2">
                          <User size={14} />
                          <span>{adopterUser.full_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Mail size={14} />
                        <span>{adopterUser.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">Ce qui va se passer :</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <span>{dog.name} sera transféré dans le compte de {adopterUser.full_name || 'l\'adoptant'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <span>L'adoptant aura un accès complet à la fiche (modification, vaccins, rappels...)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <span>Votre refuge perdra l'accès à cette fiche</span>
                  </li>
                  {dog.foster_family_user_id && (
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">4.</span>
                      <span>Le placement en famille d'accueil sera automatiquement fermé</span>
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('email')}
                  className="flex-1 py-3 border-2 border-border rounded-xl font-medium hover:bg-muted transition-smooth min-h-[44px]"
                >
                  Retour
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={loading}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth min-h-[44px]"
                >
                  {loading ? 'Transfert...' : 'Confirmer le transfert'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferToAdopterModal;
