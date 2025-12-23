import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Heart, MapPin, Calendar, Share2, ArrowLeft, Check,
  Info, CheckCircle, Mail, Phone, User
} from 'lucide-react';
import TabNavigation from '../../components/TabNavigation';
import UserMenu from '../../components/UserMenu';
import Footer from '../../components/Footer';

/**
 * Fiche publique d'un chien
 * Affichée quand un visiteur non-propriétaire consulte /chien/:id
 */
const PublicDogProfile = ({ dog }) => {
  const { user } = useAuth() || {};
  const navigate = useNavigate();
  
  const [currentProfile, setCurrentProfile] = useState(null);
  const [dogProfiles, setDogProfiles] = useState([]);
  const [owner, setOwner] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchDogProfiles();
    }
    fetchOwner();
  }, [user?.id, dog.user_id]);

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

  const fetchOwner = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar_url, city')
        .eq('id', dog.user_id)
        .single();

      if (error) throw error;
      setOwner(data);
    } catch (error) {
      console.error('Erreur chargement propriétaire:', error);
    }
  };

  const handleProfileChange = (profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('currentDogProfile', JSON.stringify(profile));
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Âge inconnu';
    const age = Math.floor((new Date() - new Date(birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 1) return 'Moins d\'1 an';
    return `${age} an${age > 1 ? 's' : ''}`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${dog.name} - Doogybook`,
        text: `Découvrez ${dog.name}, ${dog.breed} de ${calculateAge(dog.birth_date)}`,
        url: window.location.href
      });
    } else {
      // Fallback : copier le lien
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié !');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Retour</span>
            </button>
            
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
        <div className="max-w-5xl mx-auto px-4 py-6">
          
          {/* Bannière info : Fiche publique */}
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4 mb-6 flex items-center gap-3">
            <Info size={20} className="text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-900">
              Vous consultez la fiche publique de <strong>{dog.name}</strong>. 
              Seul le propriétaire peut voir les informations de santé complètes.
            </p>
          </div>

          {/* Image principale */}
          <div className="relative aspect-[16/9] rounded-3xl overflow-hidden mb-6">
            {dog.photo_url ? (
              <img
                src={dog.photo_url}
                alt={dog.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-9xl text-white font-bold">
                  {dog.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Infos principales */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
                <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
                  {dog.name}
                </h1>
                <div className="flex flex-wrap gap-3 text-gray-600 mb-6">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                    {dog.breed}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                    {dog.gender === 'male' ? 'Mâle' : 'Femelle'}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                    {calculateAge(dog.birth_date)}
                  </span>
                  {dog.size && (
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                      Taille : {dog.size}
                    </span>
                  )}
                </div>

                {/* Description/Bio du chien */}
                {dog.bio && (
                  <div className="mb-6">
                    <h2 className="text-xl font-heading font-semibold text-gray-900 mb-3">
                      📖 À propos
                    </h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {dog.bio}
                    </p>
                  </div>
                )}

                {/* Caractère / Personnalité */}
                {dog.personality && (
                  <div>
                    <h2 className="text-xl font-heading font-semibold text-gray-900 mb-3">
                      ✨ Personnalité
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      {dog.personality}
                    </p>
                  </div>
                )}
              </div>

              {/* Informations complémentaires */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-heading font-semibold text-gray-900 mb-4">
                  ℹ️ Informations
                </h2>
                <div className="space-y-3">
                  {dog.birth_date && (
                    <div className="flex items-center gap-2">
                      <Calendar size={20} className="text-blue-600" />
                      <span className="text-gray-700">
                        Né(e) le {new Date(dog.birth_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                  {dog.sterilized !== null && (
                    <div className="flex items-center gap-2">
                      <CheckCircle size={20} className={dog.sterilized ? 'text-green-600' : 'text-gray-400'} />
                      <span className="text-gray-700">
                        {dog.sterilized ? 'Stérilisé(e)' : 'Non stérilisé(e)'}
                      </span>
                    </div>
                  )}
                  {dog.weight && (
                    <div className="flex items-center gap-2">
                      <Info size={20} className="text-blue-600" />
                      <span className="text-gray-700">
                        Poids : {dog.weight} kg
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Colonne sidebar */}
            <div className="space-y-6">
              
              {/* Informations du propriétaire */}
              {owner && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-heading font-semibold text-gray-900 mb-4">
                    Propriétaire
                  </h3>
                  <div className="flex items-center gap-3 mb-4">
                    {owner.avatar_url ? (
                      <img 
                        src={owner.avatar_url} 
                        alt={owner.name} 
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                        {owner.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{owner.name}</p>
                      {owner.city && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin size={14} />
                          {owner.city}
                        </p>
                      )}
                    </div>
                  </div>

                  {user ? (
                    <button
                      onClick={() => navigate(`/profile/${owner.id}`)}
                      className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-smooth"
                    >
                      Voir le profil
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-smooth"
                    >
                      Se connecter pour contacter
                    </button>
                  )}
                </div>
              )}

              {/* Partager */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
                <button 
                  onClick={handleShare}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-smooth flex items-center justify-center gap-2"
                >
                  <Share2 size={18} />
                  Partager ce profil
                </button>
              </div>

              {/* Badge Doogybook */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-6 text-white">
                <h3 className="font-bold text-lg mb-2">
                  🐕 Profil vérifié Doogybook
                </h3>
                <p className="text-sm text-white/90">
                  Ce chien fait partie de la communauté Doogybook
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PublicDogProfile;
