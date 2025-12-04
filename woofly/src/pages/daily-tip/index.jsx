import React, { useState, useEffect } from 'react';
import {
  ChefHat, Heart, GraduationCap, Activity,
  Phone, MapPin, Clock, AlertCircle, Search,
  Sparkles, Stethoscope, PhoneCall, Plus, Edit
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TabNavigation from '../../components/TabNavigation';
import ProfileSwitcher from '../../components/ProfileSwitcher';
import Footer from '../../components/Footer';

/**
 * Page Daily Tip - Conseils & Contacts
 * Images mises à jour pour mieux correspondre au contexte.
 */
const DailyTip = () => {
  const { user } = useAuth();
  const [selectedTipCategory, setSelectedTipCategory] = useState('all');
  const [tips, setTips] = useState([]);
  const [loadingTips, setLoadingTips] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userVet, setUserVet] = useState(null);
  const [showVetForm, setShowVetForm] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [vetForm, setVetForm] = useState({
    name: '',
    phone: '',
    address: '',
    hours: ''
  });

  // Profils de chiens (Images mises à jour)
  const dogProfiles = [
    {
      id: 1,
      name: "Max",
      breed: "Malinois",
      // Nouvelle image de Malinois
      image: "https://images.unsplash.com/photo-1623068919897-3564734a3c4b?w=400&h=400&fit=crop",
      imageAlt: "Malinois dog outdoors"
    },
    {
      id: 2,
      name: "Luna",
      breed: "Shih-Tzu",
      // Nouvelle image de Shih-Tzu
      image: "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=400&h=400&fit=crop",
      imageAlt: "Shih-Tzu dog looking up"
    }
  ];

  // Catégories avec NOUVELLES photos Unsplash contextuelles
  const tipCategories = [
    {
      id: 'all',
      name: 'Tous',
      icon: Sparkles,
      color: 'blue',
      gradient: 'from-purple-500 to-pink-500',
      // Image générale : un chien heureux de race mixte
      unsplash: 'photo-1552053831-71594a27632d'
    },
    {
      id: 'health',
      name: 'Santé',
      icon: Heart,
      color: 'red',
      gradient: 'from-green-500 to-emerald-600',
      // Image santé : un vétérinaire auscultant un chien
      unsplash: 'photo-1628009368231-760335a2a9ba'
    },
    {
      id: 'nutrition',
      name: 'Nutrition',
      icon: ChefHat,
      color: 'orange',
      gradient: 'from-orange-500 to-red-500',
      // Image nutrition : un chien regardant un bol de nourriture saine
      unsplash: 'photo-1518893063132-36e465be779c'
    },
    {
      id: 'care',
      name: 'Soins',
      icon: Heart,
      color: 'pink',
      gradient: 'from-pink-500 to-rose-600',
      // Image soins : un chien recevant un bain/toilettage
      unsplash: 'photo-1583337130417-3346a1be7dee'
    },
    {
      id: 'education',
      name: 'Éducation',
      icon: GraduationCap,
      color: 'purple',
      gradient: 'from-blue-500 to-indigo-600',
      // Image éducation : une séance de dressage active
      unsplash: 'photo-1535930749574-1399327ce78f'
    },
    {
      id: 'wellness',
      name: 'Bien-être',
      icon: Activity,
      color: 'green',
      gradient: 'from-purple-500 to-violet-600',
      // Image bien-être : un chien très détendu, dormant paisiblement
      unsplash: 'photo-1544568100-847a948585b9'
    }
  ];

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

  useEffect(() => {
    const savedProfile = localStorage.getItem('currentDogProfile');
    if (savedProfile) {
      setCurrentProfile(JSON.parse(savedProfile));
    } else if (dogProfiles?.length > 0) {
      setCurrentProfile(dogProfiles[0]);
      localStorage.setItem('currentDogProfile', JSON.stringify(dogProfiles[0]));
    }

    // Charger les favoris
    const savedFavorites = localStorage.getItem('woofly_favorite_tips');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  useEffect(() => {
    fetchTips();
    if (user?.id) {
      fetchUserVet();
    }
  }, [selectedTipCategory, searchQuery, user?.id]);

  const fetchTips = async () => {
    try {
      setLoadingTips(true);

      let query = supabase
        .from('tips')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(9);

      if (selectedTipCategory !== 'all') {
        query = query.eq('category', selectedTipCategory);
      }

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTips(data || []);
    } catch (error) {
      console.error('Erreur tips:', error);
      setTips([]);
    } finally {
      setLoadingTips(false);
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

  const getCategoryInfo = (categoryId) => {
    return tipCategories.find(c => c.id === categoryId) || tipCategories[0];
  };

  const toggleFavorite = (tipId) => {
    const newFavorites = favorites.includes(tipId)
      ? favorites.filter(id => id !== tipId)
      : [...favorites, tipId];

    setFavorites(newFavorites);
    localStorage.setItem('woofly_favorite_tips', JSON.stringify(newFavorites));
  };

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
        <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-8">

          {/* ========== CONSEILS PRATIQUES AVEC PHOTOS ========== */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-heading font-semibold text-foreground mb-1">
                  Conseils Pratiques
                </h2>
                <p className="text-muted-foreground font-caption">
                  Recettes, soins, éducation et bien-être pour votre chien
                </p>
              </div>
            </div>

            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                placeholder="Rechercher un conseil..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-card"
              />
            </div>

            {/* Catégories */}
            <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar">
              {tipCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedTipCategory(cat.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-smooth ${
                      selectedTipCategory === cat.id
                        ? 'bg-primary text-primary-foreground shadow-soft'
                        : 'bg-card border border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon size={18} />
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Liste tips avec photos */}
            {loadingTips ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : tips.length === 0 ? (
              <div className="bg-card rounded-lg p-8 text-center border border-border">
                <Sparkles size={48} className="text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-caption">
                  {searchQuery ? 'Aucun conseil trouvé pour votre recherche' : 'Aucun conseil disponible pour le moment'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tips.map((tip) => {
                  const catInfo = getCategoryInfo(tip.category);
                  const Icon = catInfo?.icon || Sparkles;
                  const isFavorite = favorites.includes(tip.id);

                  return (
                    <div
                      key={tip.id}
                      className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                    >
                      {/* Image cover avec gradient */}
                      <div className="relative h-40 overflow-hidden">
                        <img
                          // Utilisation de la nouvelle structure d'URL Unsplash
                          src={`https://images.unsplash.com/${catInfo.unsplash}?w=600&h=400&fit=crop&q=80`}
                          alt={catInfo.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />

                        {/* Gradient overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-t ${catInfo.gradient} opacity-50`} />

                        {/* Badge catégorie */}
                        <div className="absolute top-3 left-3">
                          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                            <Icon className="w-4 h-4 text-gray-700" />
                            <span className="text-xs font-bold text-gray-700">
                              {catInfo.name}
                            </span>
                          </div>
                        </div>

                        {/* Bouton favori */}
                        <button
                          onClick={() => toggleFavorite(tip.id)}
                          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform"
                        >
                          <Heart
                            className={`w-5 h-5 transition-colors ${
                              isFavorite
                                ? 'fill-red-500 text-red-500'
                                : 'text-gray-600'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Contenu */}
                      <div className="p-5">
                        <h3 className="font-heading font-semibold text-foreground mb-2 line-clamp-2">
                          {tip.title}
                        </h3>
                        <p className="text-sm text-muted-foreground font-caption leading-relaxed line-clamp-3">
                          {tip.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
              // Formulaire
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
              // Affichage vétérinaire
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
              // Bouton ajouter
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
                const Icon = contact.icon;
                return (
                  <div key={contact.id} className="bg-card border-2 border-red-200 rounded-lg p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-red-500 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon size={24} />
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

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default DailyTip;
