import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Heart, MapPin, Phone, Mail, 
  AlertCircle, Check, ArrowLeft, Share2, Info,
  User, CheckCircle, X
} from 'lucide-react';
import TabNavigation from '../../components/TabNavigation';
import UserMenu from '../../components/UserMenu';
import Footer from '../../components/Footer';

const AdoptionDetail = () => {
  const { dogId } = useParams();
  const { user } = useAuth() || {};  // ← Permet undefined sans crash
  const navigate = useNavigate();
  
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [dogProfiles, setDogProfiles] = useState([]);

  useEffect(() => {
    fetchDog();
    if (user?.id) {
      fetchDogProfiles();
    }
  }, [dogId, user?.id]);

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

  const fetchDog = async () => {
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
            postal_code,
            phone,
            email,
            website,
            description,
            is_verified,
            logo_url,
            cover_photo_url
          )
        `)
        .eq('id', dogId)
        .single();

      if (error) throw error;
      setDog(data);
    } catch (error) {
      console.error('Erreur chargement chien:', error);
      navigate('/adoption');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('currentDogProfile', JSON.stringify(profile));
  };

  const handleAdoptClick = () => {
    if (user) {
      setShowApplicationModal(true);
    } else {
      navigate('/login');
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Âge inconnu';
    const age = Math.floor((new Date() - new Date(birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 1) return 'Moins d\'1 an';
    return `${age} an${age > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!dog) return null;

  const org = dog.professional_accounts;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/adoption')}
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
            
            {dog.is_urgent && (
              <div className="absolute top-6 left-6 bg-red-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
                <AlertCircle size={20} />
                ADOPTION URGENTE
              </div>
            )}

            {org?.is_verified && (
              <div className="absolute top-6 right-6 bg-blue-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
                <Check size={20} />
                Refuge Vérifié
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

                {dog.adoption_story && (
                  <div className="mb-6">
                    <h2 className="text-xl font-heading font-semibold text-gray-900 mb-3">
                      📖 Son histoire
                    </h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {dog.adoption_story}
                    </p>
                  </div>
                )}

                {dog.adoption_requirements && (
                  <div>
                    <h2 className="text-xl font-heading font-semibold text-gray-900 mb-3">
                      ✅ Conditions d'adoption
                    </h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {dog.adoption_requirements}
                    </p>
                  </div>
                )}
              </div>

              {/* Informations complémentaires */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-heading font-semibold text-gray-900 mb-4">
                  ℹ️ Informations complémentaires
                </h2>
                <div className="space-y-3">
                  {dog.sterilized !== null && (
                    <div className="flex items-center gap-2">
                      <CheckCircle size={20} className={dog.sterilized ? 'text-green-600' : 'text-gray-400'} />
                      <span className="text-gray-700">
                        {dog.sterilized ? 'Stérilisé' : 'Non stérilisé'}
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
              
              {/* Bouton adopter */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
                <button
                  onClick={handleAdoptClick}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition-smooth flex items-center justify-center gap-2"
                >
                  <Heart size={24} />
                  {user ? 'Je veux l\'adopter' : 'Se connecter pour adopter'}
                </button>
                
                {!user && (
                  <p className="text-xs text-center text-gray-600 mt-3">
                    Vous devez être connecté pour postuler à une adoption
                  </p>
                )}
              </div>

              {/* Informations du refuge */}
              {org && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt={org.organization_name} className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                        {org.organization_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-heading font-semibold text-gray-900">
                        {org.organization_name}
                      </h3>
                      {org.is_verified && (
                        <span className="text-xs text-blue-600 flex items-center gap-1">
                          <Check size={12} />
                          Refuge Vérifié
                        </span>
                      )}
                    </div>
                  </div>

                  {org.description && (
                    <p className="text-sm text-gray-700 mb-4">
                      {org.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    {org.city && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPin size={16} className="text-gray-400" />
                        <span>{org.city} {org.postal_code}</span>
                      </div>
                    )}
                    {org.phone && (
                      <a href={`tel:${org.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                        <Phone size={16} />
                        <span>{org.phone}</span>
                      </a>
                    )}
                    {org.email && (
                      <a href={`mailto:${org.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                        <Mail size={16} />
                        <span>{org.email}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Partager */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
                <button className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-smooth flex items-center justify-center gap-2">
                  <Share2 size={18} />
                  Partager ce chien
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Modal candidature - Seulement si connecté */}
      {showApplicationModal && user && (
        <ApplicationModal
          dog={dog}
          onClose={() => setShowApplicationModal(false)}
        />
      )}
    </div>
  );
};

// Modal de candidature (inchangé)
const ApplicationModal = ({ dog, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    has_garden: false,
    has_other_pets: false,
    other_pets_details: '',
    family_composition: '',
    experience_with_dogs: '',
    motivation: '',
    availability: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('adoption_applications')
        .insert({
          dog_id: dog.id,
          user_id: user.id,
          professional_account_id: dog.professional_account_id,
          ...formData
        });

      if (error) throw error;

      alert('✅ Votre candidature a été envoyée avec succès ! Le refuge vous contactera bientôt.');
      onClose();
    } catch (error) {
      console.error('Erreur envoi candidature:', error);
      alert('Erreur lors de l\'envoi de votre candidature');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-2xl font-heading font-bold text-gray-900">
            Candidature pour adopter {dog.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-smooth"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div>
            <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
              📋 Vos coordonnées
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nom complet *"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email *"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="Téléphone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Ville"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
              🏡 Votre situation
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.has_garden}
                  onChange={(e) => setFormData({...formData, has_garden: e.target.checked})}
                  className="w-5 h-5 rounded text-blue-500"
                />
                <span className="text-gray-700">J'ai un jardin</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.has_other_pets}
                  onChange={(e) => setFormData({...formData, has_other_pets: e.target.checked})}
                  className="w-5 h-5 rounded text-blue-500"
                />
                <span className="text-gray-700">J'ai d'autres animaux</span>
              </label>

              {formData.has_other_pets && (
                <textarea
                  placeholder="Précisez (type, nombre, âge...)"
                  value={formData.other_pets_details}
                  onChange={(e) => setFormData({...formData, other_pets_details: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              )}

              <textarea
                placeholder="Pourquoi souhaitez-vous adopter ce chien ? *"
                required
                value={formData.motivation}
                onChange={(e) => setFormData({...formData, motivation: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-smooth"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-smooth disabled:bg-gray-300"
            >
              {loading ? 'Envoi...' : 'Envoyer ma candidature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdoptionDetail;
