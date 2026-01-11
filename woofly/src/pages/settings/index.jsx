import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Crown, Trash2, ChevronLeft, Mail, Phone, 
  MapPin, Save, AlertCircle, X, Check, Moon, Sun
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import UserMenu from '../../components/UserMenu';
import UserMenuPro from '../../components/UserMenuPro';
import Footer from '../../components/Footer';
import SubscriptionBadge from '../../components/SubscriptionBadge';

const Settings = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme, isPremium: isThemePremium } = useTheme();
  const navigate = useNavigate();
  
  const [isProAccount, setIsProAccount] = useState(false);
  const [checkingAccountType, setCheckingAccountType] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  
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

  useEffect(() => {
    checkAccountType();
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const checkAccountType = async () => {
    if (!user) return;
    
    setCheckingAccountType(true);
    try {
      const { data: proAccount } = await supabase
        .from('professional_accounts')
        .select('id, is_active')
        .eq('user_id', user.id)
        .single();
      
      setIsProAccount(proAccount && proAccount.is_active);
    } catch (error) {
      console.log('No pro account found');
      setIsProAccount(false);
    } finally {
      setCheckingAccountType(false);
    }
  };

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setProfile({
        full_name: data?.full_name || user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: data?.phone || user.user_metadata?.phone || '',
        location: data?.location || user.user_metadata?.location || ''
      });
      
      setSubscriptionTier(data?.subscription_tier || 'free');
    } catch (err) {
      console.error('Erreur chargement profil:', err);
      setProfile({
        full_name: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        location: user.user_metadata?.location || ''
      });
      setSubscriptionTier('free');
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          phone: profile.phone,
          location: profile.location
        }
      });
      
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          location: profile.location,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
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
        .eq('id', user.id);

      if (profileError) throw profileError;

      await signOut();
      navigate('/login');
      
      alert('✅ Votre compte a été supprimé avec succès');
    } catch (err) {
      console.error('Erreur suppression compte:', err);
      alert('❌ Erreur lors de la suppression du compte: ' + err.message);
    }
  };

  const handleThemeToggle = () => {
    if (!isThemePremium) {
      navigate('/premium');
      return;
    }
    setTheme(); // Toggle le thème
  };

  // Vérifier si l'utilisateur est Premium ou Professional
  const isPremiumUser = subscriptionTier === 'premium' || subscriptionTier === 'professional';

  if (checkingAccountType) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header avec UserMenu */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-smooth py-2 min-h-[44px]"
          >
            <ChevronLeft size={20} />
            <span className="text-base font-medium">Retour</span>
          </button>
          
          {isProAccount ? <UserMenuPro /> : <UserMenu />}
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          
          {/* Header page */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
              Paramètres
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez votre compte et vos préférences
            </p>
          </div>

          {/* Success message */}
          {saveSuccess && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg mx-4">
              <div className="flex items-center gap-2">
                <div className="text-green-500">✓</div>
                <p className="text-green-900 font-medium">Modifications enregistrées avec succès !</p>
              </div>
            </div>
          )}

          {/* Carte utilisateur */}
          <div className="bg-card rounded-xl border border-border p-6 mx-4 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {profile.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-heading font-semibold text-foreground truncate">
                  {profile.full_name || 'Utilisateur'}
                </h2>
                <p className="text-sm text-muted-foreground truncate mb-2">{profile.email}</p>
                <SubscriptionBadge tier={subscriptionTier} size="sm" />
              </div>
            </div>
          </div>

          {/* Section Modifier profil */}
          <section className="bg-card rounded-xl border border-border p-6 mx-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-heading font-semibold text-foreground">
                  Modifier mon profil
                </h3>
                <p className="text-sm text-muted-foreground">
                  Nom, email, téléphone, localisation
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Nom complet */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Votre nom"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Email (lecture seule) */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <div className="flex items-center gap-2 px-4 py-3 bg-muted border border-border rounded-lg">
                  <Mail size={20} className="text-muted-foreground flex-shrink-0" />
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="flex-1 bg-transparent outline-none text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  L'email ne peut pas être modifié pour des raisons de sécurité
                </p>
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Téléphone
                </label>
                <div className="flex items-center gap-2 px-4 py-3 border border-border rounded-lg bg-card">
                  <Phone size={20} className="text-muted-foreground flex-shrink-0" />
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="06 12 34 56 78"
                    className="flex-1 bg-transparent text-foreground outline-none focus:ring-0"
                  />
                </div>
              </div>

              {/* Localisation */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Localisation
                </label>
                <div className="flex items-center gap-2 px-4 py-3 border border-border rounded-lg bg-card">
                  <MapPin size={20} className="text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="Ville, Pays"
                    className="flex-1 bg-transparent text-foreground outline-none focus:ring-0"
                  />
                </div>
              </div>

              {/* Bouton sauvegarder */}
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-smooth flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Section Apparence - MODE SOMBRE (Premium) */}
          <section className="bg-card rounded-xl border border-border p-6 mx-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                {theme === 'dark' ? (
                  <Moon className="text-purple-600" size={24} />
                ) : (
                  <Sun className="text-purple-600" size={24} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-heading font-semibold text-foreground">
                    Apparence
                  </h3>
                  {isThemePremium && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold rounded-full">
                      👑 PREMIUM
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isThemePremium ? 'Mode sombre disponible' : 'Réservé aux membres Premium'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  {theme === 'dark' ? (
                    <Moon className="text-gray-300" size={20} />
                  ) : (
                    <Sun className="text-gray-600" size={20} />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {theme === 'dark' ? 'Mode sombre' : 'Mode clair'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {theme === 'dark' ? 'Repose tes yeux 🌙' : 'Lumineux et clair ☀️'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={handleThemeToggle}
                disabled={!isThemePremium}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  theme === 'dark' 
                    ? 'bg-purple-600' 
                    : isThemePremium 
                      ? 'bg-gray-300' 
                      : 'bg-gray-200'
                } ${!isThemePremium ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {!isThemePremium && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  💡 <strong>Passez à Premium</strong> pour débloquer le mode sombre et bien plus encore !
                </p>
              </div>
            )}
          </section>

          {/* Section Premium - CONDITIONNEL */}
          {isPremiumUser ? (
            // SI PREMIUM : Badge actif (vert)
            <section className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-700 p-6 mx-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Crown className="text-white" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-heading font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                    Compte Premium actif
                    <Check size={20} className="text-green-600 dark:text-green-400" />
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                    Chiens illimités • Photos illimitées • Recettes personnalisées
                  </p>
                </div>
              </div>
            </section>
          ) : (
            // SI GRATUIT : Bouton Passer à Premium (jaune/ambre)
            <section 
              onClick={() => navigate('/premium')}
              className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-700 p-6 mx-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Crown className="text-white" size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-heading font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                      Passer à Premium
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                      Chiens et photos illimités • 3,99€/mois
                    </p>
                  </div>
                </div>
                <ChevronLeft size={24} className="text-amber-600 dark:text-amber-400 flex-shrink-0 rotate-180" />
              </div>
            </section>
          )}

          {/* Supprimer compte */}
          <section className="bg-card rounded-xl border border-red-200 dark:border-red-800 p-6 mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="text-white" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-heading font-semibold text-red-900 dark:text-red-100">
                  Supprimer mon compte
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Action irréversible - Toutes vos données seront perdues
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-smooth flex items-center justify-center gap-2"
            >
              <Trash2 size={20} />
              Supprimer mon compte
            </button>
          </section>

          {/* Info version */}
          <div className="text-center text-sm text-muted-foreground px-4">
            <p>Doogybook v1.0.0</p>
            <p className="mt-1">© 2025 Doogybook. Tous droits réservés.</p>
          </div>

        </div>
      </main>

      {/* Modal suppression compte */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-heading font-bold text-foreground">
                Supprimer mon compte
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmEmail('');
                }}
                className="p-2 hover:bg-muted rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                <AlertCircle size={20} className="text-red-900 dark:text-red-100" />
                Données qui seront supprimées :
              </h4>
              <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                <li>• Tous vos chiens et leurs profils</li>
                <li>• Toutes les photos</li>
                <li>• Toutes les vaccinations et traitements</li>
                <li>• Toutes les notes médicales</li>
                <li>• Votre compte utilisateur</li>
              </ul>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirmez votre email pour continuer :
              </label>
              <input
                type="email"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                placeholder={user?.email}
                className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmEmail('');
                }}
                className="px-4 py-3 border border-border rounded-lg hover:bg-muted transition-smooth"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmEmail !== user?.email}
                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-smooth"
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
