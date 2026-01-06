import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, Heart, Calendar, MapPin, Info, 
  Shield, Home, Phone, Mail, AlertCircle 
} from 'lucide-react';

const PublicDogDetail = () => {
  const { dogId } = useParams(); // Changé de 'id' à 'dogId' pour cohérence avec Routes.js
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDogDetails();
  }, [dogId]);

  const fetchDogDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select(`
          *,
          professional_accounts!dogs_professional_account_id_fkey(
            id,
            organization_name,
            phone,
            email,
            address,
            city,
            postal_code
          )
        `)
        .eq('id', dogId) // Utilise dogId au lieu de id
        .eq('adoption_status', 'available')
        .eq('is_published', true)
        .single();

      if (error) throw error;

      setDog({
        ...data,
        organization: data.professional_accounts
      });
    } catch (error) {
      console.error('Erreur chargement chien:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const years = new Date().getFullYear() - new Date(birthDate).getFullYear();
    const months = new Date().getMonth() - new Date(birthDate).getMonth();
    if (years === 0) return `${months} mois`;
    return `${years} an${years > 1 ? 's' : ''}`;
  };

  const handleAdoptClick = () => {
    if (user) {
      // Si connecté, aller au formulaire de candidature
      navigate(`/adoption-application/${dogId}`);
    } else {
      // Si pas connecté, aller à l'inscription avec retour
      navigate('/register', { 
        state: { 
          returnTo: `/adoption/${dogId}`,
          message: `Créez un compte pour adopter ${dog?.name} 🐕`
        } 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!dog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={64} className="text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Chien non trouvé</h2>
          <p className="text-muted-foreground mb-6">Ce chien n'est plus disponible à l'adoption</p>
          <button
            onClick={() => navigate('/adoption')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth"
          >
            Retour aux chiens disponibles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec retour */}
      <header className="bg-card border-b border-border shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/adoption')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Retour aux chiens</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonne gauche - Photo */}
          <div>
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg">
              {dog.photo_url ? (
                <img
                  src={dog.photo_url}
                  alt={dog.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-9xl font-bold text-primary/30">
                    {dog.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Badges */}
              {dog.is_urgent && (
                <div className="absolute top-4 left-4">
                  <span className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-full shadow-lg animate-pulse">
                    URGENT - À adopter rapidement
                  </span>
                </div>
              )}

              <div className="absolute top-4 right-4">
                <span className="px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-full shadow-lg backdrop-blur-sm">
                  ✓ Disponible
                </span>
              </div>
            </div>
          </div>

          {/* Colonne droite - Infos */}
          <div>
            {/* Titre */}
            <div className="mb-6">
              <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
                {dog.name}
              </h1>
              <p className="text-xl text-muted-foreground">{dog.breed}</p>
            </div>

            {/* Infos principales */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-card rounded-xl p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-1">Sexe</p>
                <p className="text-lg font-semibold text-foreground">
                  {dog.gender === 'male' ? '♂️ Mâle' : '♀️ Femelle'}
                </p>
              </div>

              {dog.birth_date && (
                <div className="bg-card rounded-xl p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Âge</p>
                  <p className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Calendar size={18} />
                    {calculateAge(dog.birth_date)}
                  </p>
                </div>
              )}

              {dog.size && (
                <div className="bg-card rounded-xl p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Taille</p>
                  <p className="text-lg font-semibold text-foreground capitalize">
                    {dog.size}
                  </p>
                </div>
              )}

              {dog.weight && (
                <div className="bg-card rounded-xl p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Poids</p>
                  <p className="text-lg font-semibold text-foreground">
                    {dog.weight} kg
                  </p>
                </div>
              )}
            </div>

            {/* Caractère */}
            {dog.character && (
              <div className="bg-card rounded-xl p-4 border border-border mb-6">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Heart size={18} />
                  Caractère
                </h3>
                <p className="text-muted-foreground">{dog.character}</p>
              </div>
            )}

            {/* Description */}
            {dog.description && (
              <div className="bg-card rounded-xl p-4 border border-border mb-6">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Info size={18} />
                  Description
                </h3>
                <p className="text-muted-foreground whitespace-pre-line">{dog.description}</p>
              </div>
            )}

            {/* Santé */}
            <div className="bg-card rounded-xl p-4 border border-border mb-6">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield size={18} />
                Santé
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  {dog.is_sterilized ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-red-500">✗</span>
                  )}
                  <span className="text-sm text-muted-foreground">Stérilisé</span>
                </div>
                <div className="flex items-center gap-2">
                  {dog.is_vaccinated ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-red-500">✗</span>
                  )}
                  <span className="text-sm text-muted-foreground">Vacciné</span>
                </div>
                <div className="flex items-center gap-2">
                  {dog.is_microchipped ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-red-500">✗</span>
                  )}
                  <span className="text-sm text-muted-foreground">Pucé</span>
                </div>
              </div>
            </div>

            {/* Frais d'adoption */}
            {dog.adoption_fee && (
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20 mb-6">
                <h3 className="font-semibold text-foreground mb-2">
                  Participation aux frais vétérinaires
                </h3>
                <p className="text-3xl font-bold text-primary mb-2">
                  {dog.adoption_fee}€
                </p>
                <p className="text-sm text-muted-foreground">
                  Couvre les frais de stérilisation, vaccination et identification
                </p>
              </div>
            )}

            {/* Informations refuge */}
            {dog.organization && (
              <div className="bg-card rounded-xl p-4 border border-border mb-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Home size={18} />
                  Refuge
                </h3>
                <p className="font-medium text-foreground mb-2">
                  {dog.organization.organization_name}
                </p>
                {dog.organization.city && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                    <MapPin size={14} />
                    {dog.organization.city}
                    {dog.organization.postal_code && ` (${dog.organization.postal_code})`}
                  </p>
                )}
                {dog.organization.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                    <Phone size={14} />
                    {dog.organization.phone}
                  </p>
                )}
                {dog.organization.email && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail size={14} />
                    {dog.organization.email}
                  </p>
                )}
              </div>
            )}

            {/* Bouton CTA principal */}
            <button
              onClick={handleAdoptClick}
              className="w-full px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 transition-smooth flex items-center justify-center gap-3 shadow-lg"
            >
              <Heart size={24} />
              <span>Je veux adopter {dog.name}</span>
            </button>

            {!user && (
              <p className="text-center text-sm text-muted-foreground mt-3">
                Vous serez redirigé vers la création de compte
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicDogDetail;
