import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// Import du dashboard privé (existant)
import DogProfile from '../dog-profile';

// Import de la fiche publique
import PublicDogProfile from './PublicDogProfile';

/**
 * Route hybride /chien/:id
 * 
 * Logique de décision :
 * - Si utilisateur connecté ET propriétaire du chien → Dashboard privé complet
 * - Sinon (visiteur ou utilisateur connecté non-propriétaire) → Fiche publique
 */
const HybridDogProfile = () => {
  const { id } = useParams();
  const { user } = useAuth() || {};
  const navigate = useNavigate();
  
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetchDog();
  }, [id, user?.id]);

  const fetchDog = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setDog(data);
      
      // Vérifier si l'utilisateur connecté est le propriétaire
      if (user?.id && data.user_id === user.id) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }
      
    } catch (error) {
      console.error('Erreur chargement chien:', error);
      navigate('/adoption');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!dog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Chien introuvable
          </h2>
          <button
            onClick={() => navigate('/adoption')}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Retour à l'adoption
          </button>
        </div>
      </div>
    );
  }

  // DÉCISION : Afficher dashboard privé ou fiche publique
  if (isOwner) {
    // L'utilisateur est le propriétaire → Dashboard santé complet
    return <DogProfile />;
  } else {
    // Visiteur ou utilisateur non-propriétaire → Fiche publique
    return <PublicDogProfile dog={dog} />;
  }
};

export default HybridDogProfile;
