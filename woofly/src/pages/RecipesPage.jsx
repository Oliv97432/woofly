import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import TabNavigation from '../components/TabNavigation';
import UserMenu from '../components/UserMenu';
import Footer from '../components/Footer';
import PremiumModal from '../components/PremiumModal';
import RecipeGenerator from '../components/recipes/RecipeGenerator';
import RecipeHistory from '../components/recipes/RecipeHistory';

const RecipesPage = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [dogProfiles, setDogProfiles] = useState([]);

  useEffect(() => {
    const savedProfile = localStorage.getItem('currentDogProfile');
    if (savedProfile) {
      setCurrentProfile(JSON.parse(savedProfile));
    }
  }, []);

  useEffect(() => {
    const fetchDogProfiles = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('dogs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setDogProfiles(data);
          
          if (!currentProfile) {
            setCurrentProfile(data[0]);
            localStorage.setItem('currentDogProfile', JSON.stringify(data[0]));
          }
        }
      } catch (error) {
        console.error('Erreur chargement chiens:', error);
      }
    };
    
    fetchDogProfiles();
  }, [user?.id]);

  useEffect(() => {
    checkPremiumStatus();
  }, [user?.id]);

  const checkPremiumStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      const premiumTiers = ['premium', 'professional'];
      const userIsPremium = premiumTiers.includes(profile?.subscription_tier);
      
      setIsPremium(userIsPremium);
      
      if (!userIsPremium) {
        setShowPremiumModal(true);
      }
    } catch (error) {
      console.error('Erreur vérification premium:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('currentDogProfile', JSON.stringify(profile));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
          <div className="max-w-screen-xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg sm:text-2xl font-heading font-semibold text-foreground">
                Recettes Personnalisées
              </h1>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <button 
                  onClick={() => navigate('/notifications')}
                  className="relative p-1.5 sm:p-2 hover:bg-muted rounded-full transition-smooth"
                >
                  <Bell size={20} className="sm:w-6 sm:h-6 text-foreground" />
                  {unreadCount > 0 && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full min-w-[16px] h-4 sm:min-w-[20px] sm:h-5 flex items-center justify-center px-0.5 sm:px-1 text-[10px] sm:text-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </button>
                
                <UserMenu
                  dogProfiles={dogProfiles}
                  currentDog={currentProfile}
                  onDogChange={handleProfileChange}
                />
              </div>
            </div>
          </div>
        </div>

        <TabNavigation />

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header avec notifications et UserMenu */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-2xl font-heading font-semibold text-foreground">
              Recettes Personnalisées
            </h1>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => navigate('/notifications')}
                className="relative p-1.5 sm:p-2 hover:bg-muted rounded-full transition-smooth"
              >
                <Bell size={20} className="sm:w-6 sm:h-6 text-foreground" />
                {unreadCount > 0 && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full min-w-[16px] h-4 sm:min-w-[20px] sm:h-5 flex items-center justify-center px-0.5 sm:px-1 text-[10px] sm:text-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </button>
              
              <UserMenu
                dogProfiles={dogProfiles}
                currentDog={currentProfile}
                onDogChange={handleProfileChange}
              />
            </div>
          </div>
        </div>
      </div>

      <TabNavigation />

      <main className="main-content flex-1">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-1 sm:mb-2">
              🍽️ Recettes Personnalisées
            </h2>
            <p className="text-muted-foreground font-caption text-sm sm:text-base">
              Créez des recettes équilibrées et sécurisées pour votre chien
            </p>
          </div>

          {isPremium ? (
            <>
              <RecipeGenerator />
              
              <div className="mt-8">
                <RecipeHistory />
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                Cette fonctionnalité est réservée aux membres Premium
              </p>
              <button
                onClick={() => setShowPremiumModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Découvrir Premium
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        reason="recipes"
      />
    </div>
  );
};

export default RecipesPage;
