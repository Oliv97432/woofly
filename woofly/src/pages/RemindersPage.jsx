import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Plus, ChevronLeft, Calendar } from 'lucide-react';
import TabNavigation from '../components/TabNavigation';
import UserMenu from '../components/UserMenu';
import Footer from '../components/Footer';
import PremiumModal from '../components/PremiumModal';
import ReminderCard from '../components/reminders/ReminderCard';

const RemindersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [dogs, setDogs] = useState([]);
  const [reminders, setReminders] = useState([]);

  // Vérifier statut Premium
  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user?.id) return;

      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();

        const premiumTiers = ['premium', 'professional'];
        const userIsPremium = premiumTiers.includes(profile?.subscription_tier);

        if (!userIsPremium) {
          setShowPremiumModal(true);
          setLoading(false);
          return;
        }

        setIsPremium(userIsPremium);
      } catch (error) {
        console.error('Erreur vérification premium:', error);
      }
    };

    checkPremiumStatus();
  }, [user?.id]);

  // Charger les chiens
  useEffect(() => {
    if (!user?.id || !isPremium) return;

    const fetchDogs = async () => {
      try {
        const { data, error } = await supabase
          .from('dogs')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (error) throw error;

        setDogs(data || []);
      } catch (err) {
        console.error('Erreur chargement chiens:', err);
      }
    };

    fetchDogs();
  }, [user?.id, isPremium]);

  // Charger les rappels depuis vaccinations et traitements
  useEffect(() => {
    if (!dogs.length || !isPremium) {
      setLoading(false);
      return;
    }

    const fetchReminders = async () => {
      setLoading(true);
      try {
        const dogIds = dogs.map(d => d.id);

        // Charger les vaccinations
        const { data: vaccinations, error: vacError } = await supabase
          .from('vaccinations')
          .select('*, dogs(name, breed, profile_image_url)')
          .in('dog_id', dogIds)
          .not('next_due_date', 'is', null)
          .order('next_due_date', { ascending: true });

        if (vacError) throw vacError;

        // Charger les traitements
        const { data: treatments, error: treatError } = await supabase
          .from('treatments')
          .select('*, dogs(name, breed, profile_image_url)')
          .in('dog_id', dogIds)
          .not('next_due_date', 'is', null)
          .order('next_due_date', { ascending: true });

        if (treatError) throw treatError;

        // Formater les vaccinations comme rappels
        const vaccinationReminders = (vaccinations || []).map(vac => ({
          id: `vac_${vac.id}`,
          original_id: vac.id,
          dog_id: vac.dog_id,
          reminder_type: 'vaccin',
          title: vac.vaccine_name,
          description: vac.notes,
          due_date: vac.next_due_date,
          is_completed: false,
          dogs: vac.dogs,
          source: 'vaccination'
        }));

        // Formater les traitements comme rappels
        const treatmentReminders = (treatments || []).map(treat => ({
          id: `treat_${treat.id}`,
          original_id: treat.id,
          dog_id: treat.dog_id,
          reminder_type: treat.treatment_type === 'worm' ? 'vermifuge' : 'antiparasitaire',
          title: treat.product_name,
          description: treat.notes,
          due_date: treat.next_due_date,
          is_completed: false,
          dogs: treat.dogs,
          source: 'treatment'
        }));

        // Combiner et trier par date
        const allReminders = [...vaccinationReminders, ...treatmentReminders]
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

        setReminders(allReminders);
      } catch (err) {
        console.error('Erreur chargement rappels:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReminders();
  }, [dogs, isPremium]);

  const handleCompleted = async (reminderId, newCompletedState) => {
    // Pour l'instant, on peut juste mettre à jour l'affichage local
    // Si tu veux persister l'état "complété", il faudrait ajouter une colonne dans les tables
    setReminders(reminders.map(r => 
      r.id === reminderId ? { ...r, is_completed: newCompletedState } : r
    ));
  };

  const handleDeleted = (reminderId) => {
    // Filtrer le rappel supprimé
    setReminders(reminders.filter(r => r.id !== reminderId));
  };

  const handleAddReminder = () => {
    // Rediriger vers la page du profil du chien pour ajouter une vaccination/traitement
    navigate('/dog-profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Chargement des rappels...</p>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <>
        <div className="min-h-screen bg-background">
          <TabNavigation />
        </div>
        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => {
            setShowPremiumModal(false);
            navigate('/dog-profile');
          }}
          reason="reminders"
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-smooth py-2 min-h-[44px]"
          >
            <ChevronLeft size={20} />
            <span className="text-base font-medium">Retour</span>
          </button>
          
          <UserMenu />
        </div>
      </header>

      <TabNavigation />

      <main className="flex-1 pb-20">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Header page */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Bell className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
                  Mes Rappels
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gérez les rappels de santé de vos chiens
                </p>
              </div>
            </div>
          </div>

          {/* Empty state - Pas de chiens */}
          {dogs.length === 0 && (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={24} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Aucun chien enregistré
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Créez d'abord un profil de chien pour gérer ses rappels
              </p>
              <button
                onClick={() => navigate('/multi-profile-management')}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-smooth"
              >
                Créer un profil
              </button>
            </div>
          )}

          {/* Empty state - Pas de rappels */}
          {dogs.length > 0 && reminders.length === 0 && (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={24} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Aucun rappel à venir
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ajoutez des vaccinations ou des traitements depuis le profil de votre chien
              </p>
              <button
                onClick={handleAddReminder}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-smooth inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Aller au profil
              </button>
            </div>
          )}

          {/* Liste des rappels */}
          {reminders.length > 0 && (
            <div className="space-y-4">
              {/* Bouton ajouter en haut sur mobile */}
              <div className="sm:hidden">
                <button
                  onClick={handleAddReminder}
                  className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-smooth flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Ajouter une vaccination/traitement
                </button>
              </div>

              {/* Bouton ajouter sur desktop */}
              <div className="hidden sm:flex justify-end">
                <button
                  onClick={handleAddReminder}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-smooth inline-flex items-center gap-2"
                >
                  <Plus size={20} />
                  Ajouter une vaccination/traitement
                </button>
              </div>

              {/* Cards des rappels */}
              {reminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onDeleted={handleDeleted}
                  onCompleted={handleCompleted}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RemindersPage;
