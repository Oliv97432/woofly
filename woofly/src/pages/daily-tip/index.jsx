import React, { useState, useEffect } from 'react';
import { 
  Heart, Phone, MapPin, Clock, AlertCircle, Sparkles, 
  Stethoscope, PhoneCall, Plus, Edit, ChefHat, GraduationCap, 
  Activity, Scissors, Timer, TrendingUp, Share2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TabNavigation from '../../components/TabNavigation';
import ProfileSwitcher from '../../components/ProfileSwitcher';
import Footer from '../../components/Footer';

/**
 * Page Daily Tip - Conseil du Jour Unique
 * Concept: 1 conseil par jour avec révélation progressive + gamification
 */
const DailyTip = () => {
  const { user } = useAuth();
  
  // États pour le conseil du jour
  const [todayTip, setTodayTip] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);
  const [loadingTip, setLoadingTip] = useState(true);
  
  // États pour le streak
  const [streakData, setStreakData] = useState({
    current_streak: 0,
    longest_streak: 0,
    total_tips_read: 0
  });
  
  // États pour le countdown
  const [timeUntilNext, setTimeUntilNext] = useState('');
  
  // États vétérinaire
  const [userVet, setUserVet] = useState(null);
  const [showVetForm, setShowVetForm] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [vetForm, setVetForm] = useState({
    name: '',
    phone: '',
    address: '',
    hours: ''
  });

  // Profils de chiens
  const dogProfiles = [
    {
      id: 1,
      name: "Max",
      breed: "Malinois",
      image: "https://images.unsplash.com/photo-1713917032646-4703f3feffde",
      imageAlt: "Malinois dog with alert expression"
    },
    {
      id: 2,
      name: "Luna",
      breed: "Shih-Tzu",
      image: "https://images.unsplash.com/photo-1579466420284-ad894bf675c8",
      imageAlt: "Small Shih-Tzu dog"
    }
  ];

  // ⚠️ IMPORTANT : Remplace 'TON_PROJECT_ID_ICI' par ton vrai Supabase Project ID
  const SUPABASE_PROJECT_ID = 'TON_PROJECT_ID_ICI';
  
  // URLs des photos (automatiquement générées avec ton Project ID)
  const categoryImages = {
    health: `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/daily-tips-images/health-golden-doctor.jpg`,
    nutrition: `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/daily-tips-images/nutrition-golden-food.jpg`,
    education: `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/daily-tips-images/education-golden-training.jpg`,
    care: `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/daily-tips-images/care-golden-grooming.jpg`,
    wellness: `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/daily-tips-images/wellness-golden-peace.jpg`
  };

  // Catégories avec icons et couleurs
  const categories = {
    health: { 
      name: 'Santé', 
      icon: Stethoscope, 
      color: 'green',
      gradient: 'from-green-500 to-emerald-600',
      emoji: '🏥'
    },
    nutrition: { 
      name: 'Nutrition', 
      icon: ChefHat, 
      color: 'orange',
      gradient: 'from-orange-500 to-red-500',
      emoji: '🍖'
    },
    education: { 
      name: 'Éducation', 
      icon: GraduationCap, 
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-600',
      emoji: '🎓'
    },
    care: { 
      name: 'Soins', 
      icon: Scissors, 
      color: 'pink',
      gradient: 'from-pink-500 to-rose-600',
      emoji: '✂️'
    },
    wellness: { 
      name: 'Bien-être', 
      icon: Activity, 
      color: 'purple',
      gradient: 'from-purple-500 to-violet-600',
      emoji: '🧠'
    }
  };

  // Contacts SOS
  const sosContacts = [
    {
      id: 1,
      name: 'SOS Animaux en Danger',
      phone: '01 43 11 80 00',
      description: 'Urgences vitales 24h/24',
      icon: PhoneCall
    },
    {
      id: 2,
      name: 'Centre Anti-Poison Animal',
      phone: '04 78 87 10 40',
      description: 'Intoxications 24h/24',
      icon: AlertCircle
    }
  ];

  // ========== EFFETS ==========

  useEffect(() => {
    const savedProfile = localStorage.getItem('currentDogProfile');
    if (savedProfile) {
      setCurrentProfile(JSON.parse(savedProfile));
    } else if (dogProfiles?.length > 0) {
      setCurrentProfile(dogProfiles[0]);
      localStorage.setItem('currentDogProfile', JSON.stringify(dogProfiles[0]));
    }
  }, []);

  useEffect(() => {
    fetchTodayTip();
    if (user?.id) {
      fetchUserVet();
      fetchStreakData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user && todayTip) {
      checkIfAlreadyRead();
    }
  }, [user, todayTip]);

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeUntilNext(`${hours}h${minutes < 10 ? '0' : ''}${minutes}`);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // ========== FONCTIONS ==========

  const fetchTodayTip = async () => {
    try {
      setLoadingTip(true);
      
      const { data, error } = await supabase
        .rpc('get_today_tip');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setTodayTip(data[0]);
        setTotalLikes(parseInt(data[0].total_likes) || 0);
      }
    } catch (error) {
      console.error('Erreur fetch tip:', error);
    } finally {
      setLoadingTip(false);
    }
  };

  const checkIfAlreadyRead = async () => {
    if (!user || !todayTip) return;
    
    try {
      const { data } = await supabase
        .from('user_tip_reads')
        .select('liked')
        .eq('user_id', user.id)
        .eq('tip_id', todayTip.tip_id)
        .maybeSingle();
      
      if (data) {
        setIsRevealed(true);
        setIsLiked(data.liked || false);
      }
    } catch (error) {
      console.error('Erreur check read:', error);
    }
  };

  const fetchStreakData = async () => {
    try {
      const { data } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setStreakData(data);
      }
    } catch (error) {
      console.error('Erreur streak:', error);
    }
  };

  const handleReveal = async () => {
    if (!user) {
      alert('Connectez-vous pour découvrir le conseil !');
      return;
    }
    
    try {
      await supabase
        .from('user_tip_reads')
        .insert({
          user_id: user.id,
          tip_id: todayTip.tip_id,
          liked: false
        });
      
      await supabase.rpc('update_user_streak', { p_user_id: user.id });
      
      setIsRevealed(true);
      
      await fetchStreakData();
      
    } catch (error) {
      console.error('Erreur reveal:', error);
      setIsRevealed(true);
    }
  };

  const toggleLike = async () => {
    if (!user) return;
    
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setTotalLikes(prev => newLikedState ? prev + 1 : prev - 1);
    
    try {
      await supabase
        .from('user_tip_reads')
        .update({ liked: newLikedState })
        .eq('user_id', user.id)
        .eq('tip_id', todayTip.tip_id);
    } catch (error) {
      console.error('Erreur like:', error);
      setIsLiked(!newLikedState);
      setTotalLikes(prev => newLikedState ? prev - 1 : prev + 1);
    }
  };

  const handleShare = async () => {
    const text = `🐕 ${todayTip.title}\n\nDécouvrez ce conseil sur Woofly !`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Conseil Woofly',
          text: text,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(text + '\n' + window.location.href);
      alert('✅ Lien copié !');
    }
  };

  const fetchUserVet = async () => {
    try {
      const { data } = await supabase
        .from('user_veterinarians')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setUserVet(data);
        setVetForm({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
          hours: data.hours || ''
        });
      }
    } catch (error) {
      console.error('Erreur vét:', error);
    }
  };

  const saveVet = async () => {
    try {
      if (userVet) {
        await supabase
          .from('user_veterinarians')
          .update(vetForm)
          .eq('id', userVet.id);
      } else {
        await supabase
          .from('user_veterinarians')
          .insert({ ...vetForm, user_id: user.id });
      }
      await fetchUserVet();
      setShowVetForm(false);
      alert('✅ Vétérinaire enregistré !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la sauvegarde');
    }
  };

  const handleProfileChange = (profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('currentDogProfile', JSON.stringify(profile));
  };

  // ========== RENDER ==========

  const getCategoryData = () => {
    return todayTip ? categories[todayTip.category] : categories.health;
  };

  const categoryData = getCategoryData();
  const Icon = categoryData.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header sticky */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-heading font-semibold text-foreground">
                Conseils & Contacts
              </h1>
            </div>
            <ProfileSwitcher
              profiles={dogProfiles}
              currentProfile={currentProfile}
              onProfileChange={handleProfileChange}
            />
          </div>
        </div>
      </div>

      {/* TabNavigation */}
      <TabNavigation />

      {/* Main content */}
      <main className="main-content flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
          
          {/* ========== CONSEIL DU JOUR ========== */}
          <section className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                💡 Conseil du Jour
              </h2>
              <p className="text-muted-foreground font-caption">
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </p>
            </div>

            {loadingTip ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : !todayTip ? (
              <div className="bg-card rounded-lg p-8 text-center border border-border">
                <Sparkles size={48} className="text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-caption">
                  Aucun conseil disponible pour aujourd'hui
                </p>
              </div>
            ) : (
              <div className="bg-card rounded-2xl overflow-hidden shadow-lg">
                {/* Image avec effet blur ou révélée */}
                <div className="relative h-64 md:h-80 overflow-hidden">
                  <img
                    src={categoryImages[todayTip.category]}
                    alt={categoryData.name}
                    className={`w-full h-full object-cover transition-all duration-1000 ${
                      isRevealed ? 'blur-0 scale-100' : 'blur-md scale-110'
                    }`}
                  />
                  
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${categoryData.gradient} opacity-40`} />
                  
                  {/* Badge catégorie */}
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
                      <Icon className="w-5 h-5" />
                      <span className="font-bold text-gray-800">
                        {categoryData.emoji} {categoryData.name}
                      </span>
                    </div>
                  </div>

                  {/* Bouton révéler (si pas encore révélé) */}
                  {!isRevealed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                      <button
                        onClick={handleReveal}
                        className="bg-white text-gray-900 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                      >
                        <Sparkles className="w-6 h-6" />
                        Découvrir le conseil
                      </button>
                    </div>
                  )}
                </div>

                {/* Contenu (visible uniquement si révélé) */}
                {isRevealed && (
                  <div className="p-6 space-y-4">
                    <h3 className="text-2xl font-heading font-bold text-foreground">
                      {todayTip.title}
                    </h3>
                    
                    <p className="text-base text-foreground leading-relaxed">
                      {todayTip.content}
                    </p>

                    {todayTip.pro_tip && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                        <p className="text-sm text-blue-900 font-caption">
                          <strong>💡 Astuce Pro :</strong> {todayTip.pro_tip}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={toggleLike}
                          className="flex items-center gap-2 hover:scale-110 transition-transform"
                        >
                          <Heart
                            className={`w-6 h-6 ${
                              isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'
                            }`}
                          />
                          <span className="text-sm font-medium text-muted-foreground">
                            {totalLikes}
                          </span>
                        </button>
                        
                        <button
                          onClick={handleShare}
                          className="flex items-center gap-2 text-gray-600 hover:text-primary hover:scale-110 transition-all"
                        >
                          <Share2 className="w-5 h-5" />
                          <span className="text-sm font-medium">Partager</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Countdown et Streak */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Countdown */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-5 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Timer className="w-6 h-6" />
                  <span className="font-bold">Prochain conseil</span>
                </div>
                <p className="text-3xl font-heading font-bold">{timeUntilNext}</p>
                <p className="text-sm text-blue-100 mt-1">Revenez demain !</p>
              </div>

              {/* Streak */}
              {user && (
                <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-5 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-6 h-6" />
                    <span className="font-bold">Votre série</span>
                  </div>
                  <p className="text-3xl font-heading font-bold">
                    🔥 {streakData.current_streak} jour{streakData.current_streak > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-orange-100 mt-1">
                    {streakData.total_tips_read}/365 conseils lus
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ========== PUB ADSENSE ========== */}
          <section className="bg-gray-100 rounded-lg p-6 text-center border-2 border-dashed border-gray-300">
            <p className="text-sm text-gray-500 mb-2">Publicité</p>
            {/* TODO: Insérer le code AdSense ici */}
            <div className="bg-white h-32 flex items-center justify-center rounded">
              <p className="text-gray-400">Espace réservé pour AdSense</p>
            </div>
          </section>

          {/* ========== MON VÉTÉRINAIRE ========== */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-heading font-semibold text-foreground mb-1">
                  Mon Vétérinaire
                </h2>
                <p className="text-muted-foreground font-caption">
                  Gardez les coordonnées de votre vétérinaire à portée de main
                </p>
              </div>
              {userVet && !showVetForm && (
                <button
                  onClick={() => setShowVetForm(true)}
                  className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                >
                  <Edit size={16} />
                  Modifier
                </button>
              )}
            </div>

            {showVetForm ? (
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Nom du cabinet</label>
                    <input
                      type="text"
                      value={vetForm.name}
                      onChange={(e) => setVetForm({...vetForm, name: e.target.value})}
                      placeholder="Clinique Vétérinaire..."
                      className="w-full px-4 py-2 border border-border rounded-lg bg-card"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={vetForm.phone}
                      onChange={(e) => setVetForm({...vetForm, phone: e.target.value})}
                      placeholder="01 23 45 67 89"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-card"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Adresse</label>
                    <input
                      type="text"
                      value={vetForm.address}
                      onChange={(e) => setVetForm({...vetForm, address: e.target.value})}
                      placeholder="123 rue..."
                      className="w-full px-4 py-2 border border-border rounded-lg bg-card"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Horaires</label>
                    <input
                      type="text"
                      value={vetForm.hours}
                      onChange={(e) => setVetForm({...vetForm, hours: e.target.value})}
                      placeholder="Lun-Ven: 9h-19h"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-card"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={saveVet}
                      className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-smooth"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setShowVetForm(false)}
                      className="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-smooth"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            ) : userVet ? (
              <div className="bg-card border-2 border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="text-blue-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold text-foreground mb-3">{userVet.name}</h3>
                    <div className="space-y-2">
                      <a href={`tel:${userVet.phone}`} className="flex items-center gap-2 text-primary font-semibold hover:underline">
                        <Phone size={18} />
                        {userVet.phone}
                      </a>
                      {userVet.address && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin size={16} />
                          {userVet.address}
                        </div>
                      )}
                      {userVet.hours && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock size={16} />
                          {userVet.hours}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <a
                  href={`tel:${userVet.phone}`}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium text-center block hover:bg-blue-600 transition-smooth"
                >
                  <Phone size={18} className="inline mr-2" />
                  Appeler mon vétérinaire
                </a>
              </div>
            ) : (
              <button
                onClick={() => setShowVetForm(true)}
                className="w-full bg-card border-2 border-dashed border-border rounded-lg p-8 hover:border-primary transition-smooth"
              >
                <Plus size={32} className="text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-foreground">Ajouter mon vétérinaire</p>
                <p className="text-sm text-muted-foreground font-caption mt-1">
                  Gardez les coordonnées à portée de main
                </p>
              </button>
            )}
          </section>

          {/* ========== SOS ANIMAUX ========== */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-heading font-semibold text-foreground mb-1">
                SOS Animaux en Danger
              </h2>
              <p className="text-muted-foreground font-caption">
                Contacts d'urgence disponibles 24h/24
              </p>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
                <p className="text-sm text-red-900 font-caption">
                  <strong>Urgence vitale :</strong> Contactez immédiatement un vétérinaire. Ne perdez pas de temps.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sosContacts.map((contact) => {
                const ContactIcon = contact.icon;
                return (
                  <div key={contact.id} className="bg-card border-2 border-red-200 rounded-lg p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-red-500 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <ContactIcon size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-heading font-semibold text-foreground mb-1">{contact.name}</h3>
                        <p className="text-sm text-muted-foreground font-caption mb-3">{contact.description}</p>
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-primary font-semibold hover:underline">
                          <Phone size={18} />
                          {contact.phone}
                        </a>
                      </div>
                    </div>
                    <a
                      href={`tel:${contact.phone.replace(/\s/g, '')}`}
                      className="w-full bg-red-500 text-white py-3 rounded-lg font-medium text-center block hover:bg-red-600 transition-smooth"
                    >
                      <Phone size={18} className="inline mr-2" />
                      Appeler maintenant
                    </a>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default DailyTip;
