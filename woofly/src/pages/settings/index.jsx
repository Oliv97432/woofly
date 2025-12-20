import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Crown, Trash2, ChevronLeft, Mail, Phone, 
  MapPin, Save, AlertCircle, Lock, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TabNavigation from '../../components/TabNavigation';
import Footer from '../../components/Footer';

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // États pour le profil utilisateur
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');

  // Charger le profil utilisateur
  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setProfile({
        full_name: data?.full_name || user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: data?.phone || user.user_metadata?.phone || '',
        location: data?.location || user.user_metadata?.location || ''
      });
    } catch (err) {
      console.error('Erreur chargement profil:', err);
      setProfile({
        full_name: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        location: user.user_metadata?.location || ''
      });
    }
  };

  // Sauvegarder le profil
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      // Mettre à jour user_metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          phone: profile.phone,
          location: profile.location
        }
      });
      
      if (authError) throw authError;

      // Mettre à jour user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          phone: profile.phone,
          location: profile.location,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (profileError) throw profileError;
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  // Supprimer le compte
  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== user?.email) {
      alert('⚠️ L\'email ne correspond pas');
      return;
    }

    if (!window.confirm('⚠️ DERNIÈRE CONFIRMATION\n\nToutes vos données seront supprimées définitivement.\n\nContinuer ?')) {
      return;
    }

    try {
      const { error: dogsError } = await supabase
        .from('dogs')
        .delete()
        .eq('user_id', user.id);

      if (dogsError) throw dogsError;

      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      await signOut();
      navigate('/login');
      
      alert('✅ Votre compte a été supprimé avec succès');
    } catch (err) {
      console.error('Erreur suppression compte:', err);
      alert('❌ Erreur lors de la suppression du compte: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TabNavigation />

      <main className="main-content flex-1">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
          
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 sm:mb-4 transition-smooth text-sm sm:text-base"
            >
              <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
              <span>Retour</span>
            </button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-foreground">
              Paramètres
            </h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
              Gérez votre compte et vos préférences
            </p>
          </div>

          {/* Success message */}
          {saveSuccess && (
            <div className="bg-green-50 border-l-4 border-green-500 p-3 sm:p-4 rounded-r-lg">
              <div className="flex items-center gap-2">
                <div className="text-green-500">✓</div>
                <p className="text-green-900 font-medium text-sm sm:text-base">Modifications enregistrées avec succès !</p>
              </div>
            </div>
          )}

          {/* Carte utilisateur */}
          <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6 shadow-soft">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg sm:text-2xl font-bold">
                {profile.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-heading font-semibold text-foreground truncate">
                  {profile.full_name || 'Utilisateur'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{profile.email}</p>
              </div>
            </div>
          </div>

          {/* Section Modifier profil */}
          <section className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="text-blue-600" size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-heading font-semibold text-foreground">
                  Modifier mon profil
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Nom, email, téléphone, localisation
                </p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Nom complet */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1 sm:mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Votre nom"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                />
              </div>

              {/* Email (lecture seule) */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1 sm:mb-2">
                  Email
                </label>
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-muted border border-border rounded-lg">
                  <Mail size={16} className="sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="flex-1 bg-transparent outline-none text-muted-foreground cursor-not-allowed text-sm sm:text-base"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  L'email ne peut pas être modifié pour des raisons de sécurité
                </p>
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1 sm:mb-2">
                  Téléphone
                </label>
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border border-border rounded-lg bg-card">
                  <Phone size={16} className="sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="06 12 34 56 78"
                    className="flex-1 bg-transparent outline-none focus:ring-0 text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Localisation */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1 sm:mb-2">
                  Localisation
                </label>
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border border-border rounded-lg bg-card">
                  <MapPin size={16} className="sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="Ville, Pays"
                    className="flex-1 bg-transparent outline-none focus:ring-0 text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Bouton sauvegarder */}
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full bg-primary text-primary-foreground py-2 sm:py-3 rounded-lg font-medium hover:bg-primary/90 transition-smooth flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={16} className="sm:w-5 sm:h-5" />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Passer à Premium (grisé) */}
          <section className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6 opacity-50 cursor-not-allowed">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center flex-shrink-0">
                  <Crown className="text-amber-500" size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-heading font-semibold text-foreground flex items-center gap-1 sm:gap-2">
                    Passer à Premium
                    <span className="text-xs bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium whitespace-nowrap">
                      Bientôt
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Sans pub + fonctionnalités avancées
                  </p>
                </div>
              </div>
              <Lock size={20} className="sm:w-6 sm:h-6 text-muted-foreground flex-shrink-0" />
            </div>
          </section>

          {/* Supprimer compte */}
          <section className="bg-card rounded-xl sm:rounded-2xl border border-red-200 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-white" size={16} className="sm:w-5 sm:h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-heading font-semibold text-red-900">
                  Supprimer mon compte
                </h3>
                <p className="text-xs sm:text-sm text-red-700">
                  Action irréversible - Toutes vos données seront perdues
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full bg-red-600 text-white py-2 sm:py-3 rounded-lg font-medium hover:bg-red-700 transition-smooth flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Trash2 size={16} className="sm:w-5 sm:h-5" />
              Supprimer mon compte
            </button>
          </section>

          {/* Info version */}
          <div className="text-center text-xs sm:text-sm text-muted-foreground">
            <p>Doogybook v1.0.0</p>
            <p className="mt-1">© 2024 Doogybook. Tous droits réservés.</p>
          </div>

        </div>
      </main>

      {/* Modal suppression compte */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50">
          <div className="bg-card rounded-xl sm:rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-heading font-bold text-foreground">
                Supprimer mon compte
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmEmail('');
                }}
                className="p-1 sm:p-2 hover:bg-muted rounded-full"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <h4 className="font-semibold text-red-900 mb-1 sm:mb-2 flex items-center gap-2 text-sm sm:text-base">
                <AlertCircle size={14} className="sm:w-4 sm:h-4 text-red-900" />
                Données qui seront supprimées :
              </h4>
              <ul className="text-xs sm:text-sm text-red-800 space-y-0.5 sm:space-y-1">
                <li>• Tous vos chiens et leurs profils</li>
                <li>• Toutes les photos</li>
                <li>• Toutes les vaccinations et traitements</li>
                <li>• Toutes les notes médicales</li>
                <li>• Votre compte utilisateur</li>
              </ul>
            </div>

            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-foreground mb-1 sm:mb-2">
                Confirmez votre email pour continuer :
              </label>
              <input
                type="email"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                placeholder={user?.email}
                className="w-full px-3 sm:px-4 py-1.5 sm:py-2 border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmEmail('');
                }}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-border rounded-lg hover:bg-muted transition-smooth text-sm sm:text-base"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmEmail !== user?.email}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-smooth text-sm sm:text-base"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Settings;
