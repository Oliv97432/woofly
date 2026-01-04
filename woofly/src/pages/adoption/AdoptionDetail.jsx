import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Heart, MapPin, Calendar, DollarSign, Phone, Mail, 
  AlertCircle, Check, ArrowLeft, Share2, Info, Home,
  User, CheckCircle, X
} from 'lucide-react';
import TabNavigation from '../../components/TabNavigation';
import UserMenu from '../../components/UserMenu';
import Footer from '../../components/Footer';

const AdoptionDetail = () => {
  const { dogId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [dogProfiles, setDogProfiles] = useState([]);

  useEffect(() => {
    fetchDog();
    fetchDogProfiles();
  }, [dogId]);

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

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Âge inconnu';
    const age = Math.floor((new Date() - new Date(birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 1) return 'Moins d\'1 an';
    return `${age} an${age > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 sm:h-12 sm:w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!dog) return null;

  const org = dog.professional_accounts;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/adoption')}
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 text-sm sm:text-base"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              <span className="font-medium">Retour</span>
            </button>
            
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
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          
          {/* Image principale */}
          <div className="relative aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden mb-4 sm:mb-6">
            {dog.photo_url ? (
              <img
                src={dog.photo_url}
                alt={dog.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-6xl sm:text-9xl text-white font-bold">
                  {dog.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            {/* Badge statut : FA ou Disponible */}
            <div className="absolute top-3 right-3 sm:top-6 sm:right-6">
              {dog.foster_family_contact_id ? (
                <div className="bg-purple-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold flex items-center gap-1 sm:gap-2 text-xs sm:text-sm shadow-lg">
                  <Home size={14} className="sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">En famille d'accueil</span>
                  <span className="xs:hidden">En FA</span>
                </div>
              ) : (
                <div className="bg-green-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold flex items-center gap-1 sm:gap-2 text-xs sm:text-sm shadow-lg">
                  <CheckCircle size={14} className="sm:w-5 sm:h-5" />
                  <span>Disponible</span>
                </div>
              )}
            </div>

            {dog.is_urgent && (
              <div className="absolute top-3 left-3 sm:top-6 sm:left-6 bg-red-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full font-bold flex items-center gap-1 sm:gap-2 text-xs sm:text-sm shadow-lg">
                <AlertCircle size={14} className="sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">ADOPTION URGENTE</span>
                <span className="xs:hidden">URGENT</span>
              </div>
            )}

            {org?.is_verified && (
              <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 bg-blue-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full font-bold flex items-center gap-1 sm:gap-2 text-xs sm:text-sm shadow-lg">
                <Check size={14} className="sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Refuge Vérifié</span>
                <span className="xs:hidden">Vérifié</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              
              {/* Infos principales */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2">
                  {dog.name}
                </h1>
                <div className="flex flex-wrap gap-2 sm:gap-3 text-gray-600 mb-4 sm:mb-6">
                  <span className="px-2 sm:px-3 py-1 bg-gray-100 rounded-full text-xs sm:text-sm font-medium">
                    {dog.breed}
                  </span>
                  <span className="px-2 sm:px-3 py-1 bg-gray-100 rounded-full text-xs sm:text-sm font-medium">
                    {dog.gender === 'male' ? 'Mâle' : 'Femelle'}
                  </span>
                  <span className="px-2 sm:px-3 py-1 bg-gray-100 rounded-full text-xs sm:text-sm font-medium">
                    {calculateAge(dog.birth_date)}
                  </span>
                  {dog.size && (
                    <span className="px-2 sm:px-3 py-1 bg-gray-100 rounded-full text-xs sm:text-sm font-medium">
                      Taille : {dog.size}
                    </span>
                  )}
                </div>

                {dog.adoption_fee && dog.adoption_fee > 0 && (
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-green-50 rounded-xl mb-4 sm:mb-6">
                    <DollarSign size={20} className="sm:w-6 sm:h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">Frais d'adoption</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{dog.adoption_fee}€</p>
                    </div>
                  </div>
                )}

                {/* Histoire */}
                {dog.adoption_story && (
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-heading font-semibold text-gray-900 mb-2 sm:mb-3">
                      📖 Son histoire
                    </h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                      {dog.adoption_story}
                    </p>
                  </div>
                )}

                {/* Conditions d'adoption */}
                {dog.adoption_requirements && (
                  <div>
                    <h2 className="text-lg sm:text-xl font-heading font-semibold text-gray-900 mb-2 sm:mb-3">
                      ✅ Conditions d'adoption
                    </h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                      {dog.adoption_requirements}
                    </p>
                  </div>
                )}
              </div>

              {/* Informations complémentaires */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-heading font-semibold text-gray-900 mb-3 sm:mb-4">
                  ℹ️ Informations complémentaires
                </h2>
                <div className="space-y-2 sm:space-y-3">
                  {dog.sterilized !== null && (
                    <div className="flex items-center gap-2">
                      <CheckCircle size={18} className={`sm:w-5 sm:h-5 ${dog.sterilized ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className="text-gray-700 text-sm sm:text-base">
                        {dog.sterilized ? 'Stérilisé' : 'Non stérilisé'}
                      </span>
                    </div>
                  )}
                  {dog.weight && (
                    <div className="flex items-center gap-2">
                      <Info size={18} className="sm:w-5 sm:h-5 text-blue-600" />
                      <span className="text-gray-700 text-sm sm:text-base">
                        Poids : {dog.weight} kg
                      </span>
                    </div>
                  )}
                  {dog.arrival_date && (
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="sm:w-5 sm:h-5 text-blue-600" />
                      <span className="text-gray-700 text-sm sm:text-base">
                        Au refuge depuis le {new Date(dog.arrival_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Colonne sidebar */}
            <div className="space-y-4 sm:space-y-6">
              
              {/* Bouton adopter */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <button
                  onClick={() => setShowApplicationModal(true)}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold text-base sm:text-lg hover:from-blue-600 hover:to-purple-700 transition-smooth flex items-center justify-center gap-2"
                >
                  <Heart size={20} className="sm:w-6 sm:h-6" />
                  Je veux l'adopter
                </button>
              </div>

              {/* Informations du refuge */}
              {org && (
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt={org.organization_name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg sm:text-2xl font-bold flex-shrink-0">
                        {org.organization_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {org.organization_name}
                      </h3>
                      {org.is_verified && (
                        <span className="text-xs text-blue-600 flex items-center gap-1">
                          <Check size={10} className="sm:w-3 sm:h-3" />
                          Refuge Vérifié
                        </span>
                      )}
                    </div>
                  </div>

                  {org.description && (
                    <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4">
                      {org.description}
                    </p>
                  )}

                  <div className="space-y-1 sm:space-y-2">
                    {org.city && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                        <MapPin size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{org.city} {org.postal_code}</span>
                      </div>
                    )}
                    {org.phone && (
                      <a href={`tel:${org.phone}`} className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 hover:underline">
                        <Phone size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>{org.phone}</span>
                      </a>
                    )}
                    {org.email && (
                      <a href={`mailto:${org.email}`} className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 hover:underline">
                        <Mail size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{org.email}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Partager */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <button className="w-full py-2 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-smooth flex items-center justify-center gap-2 text-sm sm:text-base">
                  <Share2 size={16} className="sm:w-5 sm:h-5" />
                  Partager ce chien
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Modal candidature */}
      {showApplicationModal && (
        <ApplicationModal
          dog={dog}
          onClose={() => setShowApplicationModal(false)}
        />
      )}
    </div>
  );
};

// Modal de candidature
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-gray-900 truncate pr-2">
            Candidature pour {dog.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1 sm:p-2 hover:bg-gray-100 rounded-full transition-smooth flex-shrink-0"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* Coordonnées */}
          <div>
            <h3 className="text-base sm:text-lg font-heading font-semibold text-gray-900 mb-3 sm:mb-4">
              📋 Vos coordonnées
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <input
                type="text"
                placeholder="Nom complet *"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
              <input
                type="email"
                placeholder="Email *"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
              <input
                type="tel"
                placeholder="Téléphone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
              <input
                type="text"
                placeholder="Ville"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Questions */}
          <div>
            <h3 className="text-base sm:text-lg font-heading font-semibold text-gray-900 mb-3 sm:mb-4">
              🏡 Votre situation
            </h3>
            
            <div className="space-y-3 sm:space-y-4">
              <label className="flex items-center gap-2 text-sm sm:text-base">
                <input
                  type="checkbox"
                  checked={formData.has_garden}
                  onChange={(e) => setFormData({...formData, has_garden: e.target.checked})}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded text-blue-500"
                />
                <span className="text-gray-700">J'ai un jardin</span>
              </label>

              <label className="flex items-center gap-2 text-sm sm:text-base">
                <input
                  type="checkbox"
                  checked={formData.has_other_pets}
                  onChange={(e) => setFormData({...formData, has_other_pets: e.target.checked})}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded text-blue-500"
                />
                <span className="text-gray-700">J'ai d'autres animaux</span>
              </label>

              {formData.has_other_pets && (
                <textarea
                  placeholder="Précisez (type, nombre, âge...)"
                  value={formData.other_pets_details}
                  onChange={(e) => setFormData({...formData, other_pets_details: e.target.value})}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  rows={2}
                />
              )}

              <textarea
                placeholder="Composition de votre foyer (adultes, enfants...)"
                value={formData.family_composition}
                onChange={(e) => setFormData({...formData, family_composition: e.target.value})}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                rows={2}
              />

              <textarea
                placeholder="Votre expérience avec les chiens"
                value={formData.experience_with_dogs}
                onChange={(e) => setFormData({...formData, experience_with_dogs: e.target.value})}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                rows={3}
              />

              <textarea
                placeholder="Pourquoi souhaitez-vous adopter ce chien ? *"
                required
                value={formData.motivation}
                onChange={(e) => setFormData({...formData, motivation: e.target.value})}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                rows={4}
              />

              <textarea
                placeholder="Vos disponibilités pour venir rencontrer le chien"
                value={formData.availability}
                onChange={(e) => setFormData({...formData, availability: e.target.value})}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                rows={2}
              />
            </div>
          </div>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-smooth text-sm sm:text-base"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 sm:py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-smooth disabled:bg-gray-300 text-sm sm:text-base"
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
