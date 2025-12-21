import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Heart, MapPin, Calendar, DollarSign, Search, Filter,
  AlertCircle, Check, Star, Phone, Mail, ExternalLink
} from 'lucide-react';
import TabNavigation from '../../components/TabNavigation';
import UserMenu from '../../components/UserMenu';
import Footer from '../../components/Footer';

const AdoptionPage = () => {
  const { user } = useAuth();
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
    fetchDogProfiles();
  }, []);

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
      // Récupérer les chiens à adopter avec les infos du refuge
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

  // Extraire les valeurs uniques pour les filtres
  const breeds = [...new Set(dogs.map(d => d.breed))].sort();
  const cities = [...new Set(dogs.map(d => d.professional_accounts?.city).filter(Boolean))].sort();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-heading font-semibold text-foreground truncate">
                🏠 Adoption
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {filteredDogs.length} chien{filteredDogs.length > 1 ? 's' : ''} disponible{filteredDogs.length > 1 ? 's' : ''}
              </p>
            </div>
            
            <UserMenu
              dogProfiles={dogProfiles}
              currentDog={currentProfile}
              onDogChange={handleProfileChange}
            />
          </div>
        </div>
      </div>

      <TabNavigation />

      {/* Main content */}
      <main className="main-content flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          
          {/* Bannière info */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6 text-white">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart size={20} className="sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-xl font-heading font-semibold mb-1 sm:mb-2">
                  Adoptez un compagnon
                </h2>
                <p className="text-white/90 text-xs sm:text-sm">
                  Tous ces chiens sont pris en charge par des refuges et associations partenaires. 
                  En adoptant, vous sauvez une vie et gagnez un ami fidèle ! 💙
                </p>
              </div>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            {/* Recherche */}
            <div className="relative mb-3 sm:mb-4">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} className="sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Rechercher par nom ou race..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            {/* Filtres */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <select
                value={selectedBreed}
                onChange={(e) => setSelectedBreed(e.target.value)}
                className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              >
                <option value="all">Toutes les races</option>
                {breeds.map(breed => (
                  <option key={breed} value={breed}>{breed}</option>
                ))}
              </select>

              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              >
                <option value="all">Toutes les tailles</option>
                <option value="petit">Petit (&lt; 10kg)</option>
                <option value="moyen">Moyen (10-25kg)</option>
                <option value="grand">Grand (&gt; 25kg)</option>
              </select>

              <select
                value={selectedAge}
                onChange={(e) => setSelectedAge(e.target.value)}
                className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              >
                <option value="all">Tous les âges</option>
                <option value="young">Jeune (&lt; 2 ans)</option>
                <option value="adult">Adulte (2-8 ans)</option>
                <option value="senior">Senior (&gt; 8 ans)</option>
              </select>

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              >
                <option value="all">Toutes les villes</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Toggle Urgent */}
            <div className="mt-3 sm:mt-4">
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={showUrgentOnly}
                  onChange={(e) => setShowUrgentOnly(e.target.checked)}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded text-red-500 focus:ring-red-500"
                />
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  🚨 Adoptions urgentes uniquement
                </span>
              </label>
            </div>
          </div>

          {/* Liste des chiens */}
          {loading ? (
            <div className="flex justify-center py-12 sm:py-20">
              <div className="animate-spin h-8 w-8 sm:h-12 sm:w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : filteredDogs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredDogs.map((dog) => (
                <DogCard key={dog.id} dog={dog} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center border border-gray-200">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Search size={24} className="sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-xl font-heading font-semibold text-gray-900 mb-1 sm:mb-2">
                Aucun chien trouvé
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
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

// Composant carte de chien
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
      className="bg-white rounded-xl sm:rounded-3xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
    >
      {/* Image */}
      <div className="relative aspect-square">
        {dog.photo_url ? (
          <img
            src={dog.photo_url}
            alt={dog.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-4xl sm:text-6xl text-white font-bold">
              {dog.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Badge urgent */}
        {dog.is_urgent && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <AlertCircle size={12} className="sm:w-3 sm:h-3" />
            <span className="hidden xs:inline">URGENT</span>
            <span className="xs:hidden text-xs">URG</span>
          </div>
        )}

        {/* Badge vérifié */}
        {org?.is_verified && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-blue-500 text-white p-1.5 sm:p-2 rounded-full">
            <Check size={12} className="sm:w-4 sm:h-4" />
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-3 sm:p-4">
        <h3 className="text-base sm:text-xl font-heading font-semibold text-gray-900 mb-1 truncate">
          {dog.name}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 truncate">
          {dog.breed} • {dog.gender === 'male' ? 'Mâle' : 'Femelle'} • {calculateAge(dog.birth_date)}
        </p>

        {/* Organisation */}
        {org && (
          <div className="flex items-center gap-2 mb-2 sm:mb-3 p-1.5 sm:p-2 bg-gray-50 rounded-lg sm:rounded-xl">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.organization_name} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {org.organization_name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {org.organization_name}
              </p>
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <MapPin size={10} className="sm:w-3 sm:h-3" />
                <span className="truncate">{org.city}</span>
              </p>
            </div>
          </div>
        )}

        {/* Histoire courte */}
        {dog.adoption_story && (
          <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3 line-clamp-2">
            {dog.adoption_story}
          </p>
        )}

        {/* Prix adoption */}
        {dog.adoption_fee && dog.adoption_fee > 0 && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3">
            <DollarSign size={14} className="sm:w-4 sm:h-4 text-green-600" />
            <span className="font-medium">{dog.adoption_fee}€ de frais d'adoption</span>
          </div>
        )}

        {/* Bouton */}
        <button className="w-full py-2 sm:py-3 bg-blue-500 text-white rounded-lg sm:rounded-xl font-medium hover:bg-blue-600 transition-smooth flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base">
          <Heart size={16} className="sm:w-5 sm:h-5" />
          Voir le profil
        </button>
      </div>
    </div>
  );
};

export default AdoptionPage;
