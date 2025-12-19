import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Phone, MapPin, Clock, AlertCircle, Sparkles, 
  Stethoscope, PhoneCall, Plus, Edit, ChefHat, GraduationCap, 
  Activity, Scissors, Timer, TrendingUp, Share2, Bell
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import TabNavigation from '../../components/TabNavigation';
import UserMenu from '../../components/UserMenu';
import Footer from '../../components/Footer';

const DailyTip = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  
  const [todayTip, setTodayTip] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);
  const [loadingTip, setLoadingTip] = useState(true);
  
  const [streakData, setStreakData] = useState({
    current_streak: 0,
    longest_streak: 0,
    total_tips_read: 0
  });
  
  const [timeUntilNext, setTimeUntilNext] = useState('');
  
  const [userVet, setUserVet] = useState(null);
  const [showVetForm, setShowVetForm] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [vetForm, setVetForm] = useState({
    name: '',
    phone: '',
    address: '',
    hours: ''
  });

  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    name: '',
    phone: '',
    description: ''
  });

  const [dogProfiles, setDogProfiles] = useState([]);

  const categoryImages = {
    health: 'https://i.ibb.co/bjrCnNkY/health-golden-doctor.png',
    nutrition: 'https://i.ibb.co/vCC7CYXp/nutrition-golden-food.png',
    education: 'https://i.ibb.co/XfH5sVFq/education-golden-training.png',
    care: 'https://i.ibb.co/q3JjBNP1/care-golden-grooming.png',
    wellness: 'https://i.ibb.co/twjS8qyY/wellness-golden-peace.png'
  };

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
    fetchTodayTip();
    if (user?.id) {
      fetchUserVet();
      fetchStreakData();
      fetchEmergencyContacts();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user && todayTip) {
      checkIfAlreadyRead();
    }
  }, [user, todayTip]);

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
    const text = `🐕 ${todayTip.title}\n\nDécouvrez ce conseil sur Doogybook !`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Conseil Doogybook',
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

  const fetchEmergencyContacts = async () => {
    try {
      const { data } = await supabase
        .from('user_emergency_numbers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (data) {
        setEmergencyContacts(data);
      }
    } catch (error) {
      console.error('Erreur contacts urgence:', error);
    }
  };

  const saveEmergencyContact = async () => {
    if (!emergencyForm.name || !emergencyForm.phone) {
      alert('❌ Nom et téléphone requis');
      return;
    }

    try {
      await supabase
        .from('user_emergency_numbers')
        .insert({
          user_id: user.id,
          name: emergencyForm.name,
          phone: emergencyForm.phone,
          description: emergencyForm.description
        });

      await fetchEmergencyContacts();
      setShowEmergencyForm(false);
      setEmergencyForm({ name: '', phone: '', description: '' });
      alert('✅ Contact d\'urgence ajouté !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la sauvegarde');
    }
  };

  const deleteEmergencyContact = async (id) => {
    if (!confirm('Supprimer ce contact ?')) return;

    try {
      await supabase
        .from('user_emergency_numbers')
        .delete()
        .eq('id', id);

      await fetchEmergencyContacts();
      alert('✅ Contact supprimé !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la suppression');
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

  const getCategoryData = () => {
    return todayTip ? categories[todayTip.category] : categories.health;
  };

  const categoryData = getCategoryData();
  const Icon = categoryData.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-heading font-semibold text-foreground">
              Conseils & Contacts
            </h1>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/notifications')}
                className="relative p-2 hover:bg-muted rounded-full transition-smooth"
              >
                <Bell size={24} className="text-foreground" />
                {unreadCount > 0 && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
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
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
          
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
                <div className="relative h-64 md:h-80 overflow-hidden">
                  <img
                    src={categoryImages[todayTip.category]}
                    alt={categoryData.name}
                    className={`w-full h-full object-cover transition-all duration-1000 ${
                      isRevealed ? 'blur-0 scale-100' : 'blur-md scale-110'
                    }`}
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                  
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
                      <Icon className="w-5 h-5" />
                      <span className="font-bold text-gray-800">
                        {categoryData.emoji} {categoryData.name}
                      </span>
                    </div>
                  </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-5 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Timer className="w-6 h-6" />
                  <span className="font-bold">Prochain conseil</span>
                </div>
                <p className="text-3xl font-heading font-bold">{timeUntilNext}</p>
                <p className="text-sm text-blue-100 mt-1">Revenez demain !</p>
              </div>

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

          <section className="bg-gray-100 rounded-lg p-6 text-center border-2 border-dashed border-gray-300">
            <p className="text-sm text-gray-500 mb-2">Publicité</p>
            <div className="bg-white h-32 flex items-center justify-center rounded">
              <p className="text-gray-400">Espace réservé pour AdSense</p>
            </div>
          </section>

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
                    <label className="block text-sm font-medium text-foreground mb-2">Nom du cabinet *</label>
                    <input
                      type="text"
                      value={vetForm.name}
                      onChange={(e) => setVetForm({...vetForm, name: e.target.value})}
                      placeholder="Dr. Martin"
                      className="w-full px-4 py-3 border border-border rounded-xl bg-card focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Téléphone *</label>
                    <input
                      type="tel"
                      value={vetForm.phone}
                      onChange={(e) => setVetForm({...vetForm, phone: e.target.value})}
                      placeholder="01 42 56 78 90"
                      className="w-full px-4 py-3 border border-border rounded-xl bg-card focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Adresse</label>
                    <input
                      type="text"
                      value={vetForm.address}
                      onChange={(e) => setVetForm({...vetForm, address: e.target.value})}
                      placeholder="15 Rue de la Santé, 75014 Paris"
                      className="w-full px-4 py-3 border border-border rounded-xl bg-card focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Horaires</label>
                    <input
                      type="text"
                      value={vetForm.hours}
                      onChange={(e) => setVetForm({...vetForm, hours: e.target.value})}
                      placeholder="Lun-Ven: 9h-19h"
                      className="w-full px-4 py-3 border border-border rounded-xl bg-card focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={saveVet}
                      disabled={!vetForm.name || !vetForm.phone}
                      className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-smooth disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setShowVetForm(false)}
                      className="px-6 py-3 border-2 border-border rounded-xl hover:bg-muted transition-smooth font-medium"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            ) : userVet ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3">
                    <Stethoscope size={20} className="text-blue-500" />
                    <span className="font-semibold text-gray-900">{userVet.name}</span>
                  </div>
                  {userVet.phone && (
                    <div className="flex items-center gap-3">
                      <Phone size={20} className="text-green-500" />
                      <span className="text-gray-900 font-semibold">{userVet.phone}</span>
                    </div>
                  )}
                  {userVet.address && (
                    <div className="flex items-center gap-3">
                      <MapPin size={20} className="text-gray-400" />
                      <span className="text-gray-700">{userVet.address}</span>
                    </div>
                  )}
                  {userVet.hours && (
                    <div className="flex items-center gap-3">
                      <Clock size={20} className="text-gray-400" />
                      <span className="text-gray-700">{userVet.hours}</span>
                    </div>
                  )}
                </div>
                
                
                  href={`tel:${userVet.phone}`}
                  className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium text-center hover:bg-blue-600 transition-smooth flex items-center justify-center gap-2"
                >
                  <Phone size={18} />
                  Appeler mon vétérinaire
                </a>
              </div>
            ) : (
              <button
                onClick={() => setShowVetForm(true)}
                className="w-full bg-white border-2 border-dashed border-gray-300 rounded-3xl p-8 hover:border-blue-500 transition-smooth"
              >
                <Plus size={32} className="text-gray-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-900">Ajouter mon vétérinaire</p>
                <p className="text-sm text-gray-600 font-caption mt-1">
                  Gardez les coordonnées à portée de main
                </p>
              </button>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-heading font-semibold text-foreground mb-1">
                  Mes Contacts d'Urgence
                </h2>
                <p className="text-muted-foreground font-caption">
                  Ajoutez vos numéros d'urgence personnalisés
                </p>
              </div>
              {!showEmergencyForm && (
                <button
                  onClick={() => setShowEmergencyForm(true)}
                  className="text-red-500 text-sm font-medium hover:underline flex items-center gap-1"
                >
                  <Plus size={16} />
                  Ajouter
                </button>
              )}
            </div>

            {showEmergencyForm && (
              <div className="bg-white border border-gray-200 rounded-3xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Nouveau contact d'urgence</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                    <input
                      type="text"
                      value={emergencyForm.name}
                      onChange={(e) => setEmergencyForm({...emergencyForm, name: e.target.value})}
                      placeholder="SOS Vétérinaire"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                    <input
                      type="tel"
                      value={emergencyForm.phone}
                      onChange={(e) => setEmergencyForm({...emergencyForm, phone: e.target.value})}
                      placeholder="01 43 11 80 00"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description (optionnel)</label>
                    <input
                      type="text"
                      value={emergencyForm.description}
                      onChange={(e) => setEmergencyForm({...emergencyForm, description: e.target.value})}
                      placeholder="Urgences 24h/24"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={saveEmergencyContact}
                      disabled={!emergencyForm.name || !emergencyForm.phone}
                      className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-smooth disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => {
                        setShowEmergencyForm(false);
                        setEmergencyForm({ name: '', phone: '', description: '' });
                      }}
                      className="px-6 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-smooth font-medium"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            {emergencyContacts.length > 0 ? (
              <div className="space-y-3">
                {emergencyContacts.map((contact) => (
                  <div key={contact.id} className="bg-white border-2 border-red-200 rounded-3xl p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-red-500 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                        <AlertCircle size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                            {contact.description && (
                              <p className="text-sm text-gray-600 mt-1">{contact.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteEmergencyContact(contact.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Supprimer
                          </button>
                        </div>
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-red-600 font-semibold hover:underline">
                          <Phone size={18} />
                          {contact.phone}
                        </a>
                      </div>
                    </div>

                    
                      href={`tel:${contact.phone.replace(/\s/g, '')}`}
                      className="w-full bg-red-500 text-white py-3 rounded-xl font-medium text-center hover:bg-red-600 transition-smooth flex items-center justify-center gap-2"
                    >
                      <Phone size={18} />
                      Appeler maintenant
                    </a>
                  </div>
                ))}
              </div>
            ) : !showEmergencyForm && (
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-8 text-center">
                <AlertCircle size={32} className="text-gray-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-900 mb-1">Aucun contact d'urgence</p>
                <p className="text-sm text-gray-600">
                  Cliquez sur "Ajouter" pour enregistrer vos numéros d'urgence
                </p>
              </div>
            )}
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DailyTip;
