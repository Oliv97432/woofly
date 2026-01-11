import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import TabNavigation from '../components/TabNavigation';
import UserMenu from '../components/UserMenu';
import Footer from '../components/Footer';
import PremiumModal from '../components/PremiumModal';
import ReminderCard from '../components/reminders/ReminderCard';
import CreateReminderModal from '../components/reminders/CreateReminderModal';

const RemindersPage = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    checkPremiumStatus();
  }, [user?.id]);

  useEffect(() => {
    if (isPremium) {
      loadDogs();
      loadReminders();
    }
  }, [isPremium]);

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

  const loadDogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, breed, profile_image_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setDogs(data || []);
    } catch (error) {
      console.error('Erreur chargement chiens:', error);
    }
  };

  const loadReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          dogs (
            name,
            breed,
            profile_image_url
          )
        `)
        .in('dog_id', dogs.map(d => d.id))
        .order('due_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Erreur chargement rappels:', error);
    }
  };

  const handleReminderCreated = () => {
    loadReminders();
    setShowCreateModal(false);
  };

  const handleReminderDeleted = (id) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const handleReminderCompleted = (id, completed) => {
    setReminders(reminders.map(r => 
      r.id === id ? { ...r, is_completed: completed, completed_at: completed ? new Date().toISOString() : null } : r
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
          <div className="max-w-screen-xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg sm:text-2xl font-heading font-semibold text-foreground">
                Rappels
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
                
                <UserMenu />
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
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-2xl font-heading font-semibold text-foreground">
              Rappels
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
              
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      <TabNavigation />

      <main className="main-content flex-1">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6 sm:space-y-8">
          {isPremium ? (
            <>
              {/* Header avec bouton ajouter */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-1 sm:mb-2">
                    🔔 Mes Rappels
                  </h2>
                  <p className="text-muted-foreground font-caption text-sm sm:text-base">
                    Gérez les rappels de santé de vos chiens
                  </p>
                </div>

                {dogs.length > 0 && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Plus size={20} />
                    <span className="hidden sm:inline">Ajouter</span>
                  </button>
                )}
              </div>

              {/* Liste des rappels */}
              {dogs.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-3xl border border-border">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={40} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Aucun chien enregistré
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Créez d'abord un profil de chien pour gérer ses rappels
                  </p>
                  <button
                    onClick={() => navigate('/multi-profile-management')}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-smooth"
                  >
                    Créer un profil
                  </button>
                </div>
              ) : reminders.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-3xl border border-border">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={40} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Aucun rappel programmé
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Créez votre premier rappel pour ne rien oublier
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-smooth flex items-center gap-2 mx-auto"
                  >
                    <Plus size={20} />
                    Créer un rappel
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {reminders.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onDeleted={handleReminderDeleted}
                      onCompleted={handleReminderCompleted}
                    />
                  ))}
                </div>
              )}
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

      {/* Modal création rappel */}
      {showCreateModal && (
        <CreateReminderModal
          dogs={dogs}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleReminderCreated}
        />
      )}

      {/* Modal Premium */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        reason="reminders"
      />
    </div>
  );
};

export default RemindersPage;
