import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Heart, MapPin, Search, AlertCircle, Check
} from 'lucide-react';
import TabNavigation from '../../components/TabNavigation';
import UserMenu from '../../components/UserMenu';
import Footer from '../../components/Footer';

const AdoptionPage = () => {
  const { user } = useAuth() || {};  // ← Permet undefined sans crash
  const navigate = useNavigate();
  
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBreed, setSelectedBreed] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [selectedAge, setSelectedAge] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [dogProfiles, setDogProfiles] = useState([]);

  useEffect(() => {
    fetchDogs();
    if (user?.id) {
      fetchDogProfiles();
    }
  }, [user?.id]);

  const fetchDogProfiles = async () => {
    if (!user?.id) {
      setDogProfiles([]);
      setCurrentProfile(null);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setDogProfiles(data);
        const savedProfile = localStorage.getItem('currentDogProfile');
        if (savedProfile) {
          setCurrentProfile(JSON.parse(savedProfile));
        } else {
          setCurrentProfile(data[0]);
        }
      }
    } catch (error) {
      console.error('Erreur chargement profils:', error);
    }
  };

  const fetchDogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select(`
          *,
          professional_accounts:professional_account_id (
            id,
            organization_name,
            organization_type,
            city,
            phone,
            email,
            is_verified,
            logo_url
          )
        `)
        .eq('is_for_adoption', true)
        .eq('adoption_status', 'available')
        .order('is_urgent', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDogs(data || []);
    } catch (error) {
      console.error('Erreur chargement chiens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('currentDogProfile', JSON.stringify(profile));
  };

  // Filtrer les chiens
  const filteredDogs = dogs.filter(dog => {
    const matchSearch = dog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       dog.breed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBreed = selectedBreed === 'all' || dog.breed === selectedBreed;
    const matchSize = selectedSize === 'all' || dog.size === selectedSize;
    
    let matchAge = true;
    if (selectedAge !== 'all') {
      const age = dog.birth_date ? 
        Math.floor((new Date() - new Date(dog.birth_date)) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
      
      if (selectedAge === 'young') matchAge = age < 2;
      if (selectedAge === 'adult') matchAge = age >= 2 && age < 8;
      if (selectedAge === 'senior') matchAge = age >= 8;
    }
    
    const matchCity = selectedCity === 'all' || 
                     dog.professional_accounts?.city === selectedCity;
    const matchUrgent = !showUrgentOnly || dog.is_urgent;
    
    return matchSearch && matchBreed && matchSize && matchAge && matchCity && matchUrgent;
  });

  const breeds = [...new Set(dogs.map(d => d.breed))].sort();
  const cities = [...new Set(dogs.map(d => d.professional_accounts?.city).filter(Boolean))].sort();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-semibold text-foreground">
                🏠 Adoption
              </h1>
              <p className="text-sm text-muted-foreground">
                {filteredDogs.length} chien{filteredDogs.length > 1 ? 's' : ''} disponible{filteredDogs.length > 1 ? 's' : ''}
              </p>
            </div>
            
            {/* Afficher UserMenu si connecté, sinon bouton connexion */}
            {user ? (
              <UserMenu
                dogProfiles={dogProfiles}
                currentDog={currentProfile}
                onDogChange={handleProfileChange}
              />
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-smooth"
              >
                Se connecter
              </button>
            )}
          </div>
        </div>
      </div>

      <TabNavigation />

      {/* Main content */}
      <main className="main-content flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          
          {/* Bannière info */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-6 mb-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-heading font-semibold mb-2">
                  Adoptez un compagnon
                </h2>
                <p className="text-white/90 text-sm">
                  Tous ces chiens sont pris en charge par des refuges et associations partenaires. 
                  En adoptant, vous sauvez une vie et gagnez un ami fidèle ! 💙
                </p>
              </div>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par nom ou race..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={selectedBreed}
                onChange={(e) => setSelectedBreed(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les races</option>
                {breeds.map(breed => (
                  <option key={breed} value={breed}>{breed}</option>
                ))}
              </select>

              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les tailles</option>
                <option value="petit">Petit (&lt; 10kg)</option>
                <option value="moyen">Moyen (10-25kg)</option>
                <option value="grand">Grand (&gt; 25kg)</option>
              </select>

              <select
                value={selectedAge}
                onChange={(e) => setSelectedAge(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les âges</option>
                <option value="young">Jeune (&lt; 2 ans)</option>
                <option value="adult">Adulte (2-8 ans)</option>
                <option value="senior">Senior (&gt; 8 ans)</option>
              </select>

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les villes</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={showUrgentOnly}
                  onChange={(e) => setShowUrgentOnly(e.target.checked)}
                  className="w-5 h-5 rounded text-red-500 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  🚨 Adoptions urgentes uniquement
                </span>
              </label>
            </div>
          </div>

          {/* Liste des chiens */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : filteredDogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDogs.map((dog) => (
                <DogCard key={dog.id} dog={dog} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-gray-900 mb-2">
                Aucun chien trouvé
              </h3>
              <p className="text-gray-600">
                Essayez de modifier vos filtres pour voir plus de résultats
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

const DogCard = ({ dog }) => {
  const navigate = useNavigate();
  
  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Âge inconnu';
    const age = Math.floor((new Date() - new Date(birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 1) return 'Moins d\'1 an';
    return `${age} an${age > 1 ? 's' : ''}`;
  };

  const org = dog.professional_accounts;

  return (
    <div 
      onClick={() => navigate(`/adoption/${dog.id}`)}
      className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="relative aspect-square">
        {dog.photo_url ? (
          <img
            src={dog.photo_url}
            alt={dog.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-6xl text-white font-bold">
              {dog.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {dog.is_urgent && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <AlertCircle size={14} />
            URGENT
          </div>
        )}

        {org?.is_verified && (
          <div className="absolute top-3 right-3 bg-blue-500 text-white p-2 rounded-full">
            <Check size={16} />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-xl font-heading font-semibold text-gray-900 mb-1">
          {dog.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          {dog.breed} • {dog.gender === 'male' ? 'Mâle' : 'Femelle'} • {calculateAge(dog.birth_date)}
        </p>

        {org && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-xl">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.organization_name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                {org.organization_name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {org.organization_name}
              </p>
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <MapPin size={10} />
                {org.city}
              </p>
            </div>
          </div>
        )}

        {dog.adoption_story && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {dog.adoption_story}
          </p>
        )}

        <button className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-smooth flex items-center justify-center gap-2">
          <Heart size={18} />
          Voir le profil
        </button>
      </div>
    </div>
  );
};

export default AdoptionPage;
