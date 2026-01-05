import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook pour gérer le statut Premium et les limitations
 */
export const usePremium = () => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [loading, setLoading] = useState(true);
  const [dogsCount, setDogsCount] = useState(0);
  const [photosCount, setPhotosCount] = useState(0);

  // Limites
  const LIMITS = {
    free: {
      dogs: 1,
      photos: 10
    },
    premium: {
      dogs: Infinity,
      photos: Infinity
    },
    professional: {
      dogs: Infinity,
      photos: Infinity
    }
  };

  useEffect(() => {
    if (user) {
      fetchPremiumStatus();
      fetchCounts();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchPremiumStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('subscription_tier, subscription_end_date')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const tier = data?.subscription_tier || 'free';
      setSubscriptionTier(tier);
      
      // Vérifier si l'abonnement est actif
      if (tier === 'premium') {
        const endDate = data?.subscription_end_date;
        if (endDate) {
          const isActive = new Date(endDate) > new Date();
          setIsPremium(isActive);
          if (!isActive) {
            // Abonnement expiré, repasser en free
            await downgradeToFree();
          }
        } else {
          setIsPremium(true);
        }
      } else if (tier === 'professional') {
        // Les professionnels ont accès illimité gratuit
        setIsPremium(true);
      } else {
        setIsPremium(false);
      }
    } catch (error) {
      console.error('Erreur récupération statut Premium:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      // Compter les chiens
      const { count: dogsTotal } = await supabase
        .from('dogs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true);

      setDogsCount(dogsTotal || 0);

      // Compter les photos (à adapter selon ta structure)
      // Si tu stockes les photos dans une table séparée
      const { count: photosTotal } = await supabase
        .from('dog_photos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setPhotosCount(photosTotal || 0);
    } catch (error) {
      console.error('Erreur comptage:', error);
    }
  };

  const downgradeToFree = async () => {
    try {
      await supabase
        .from('user_profiles')
        .update({ 
          subscription_tier: 'free',
          subscription_end_date: null 
        })
        .eq('id', user.id);

      setSubscriptionTier('free');
      setIsPremium(false);
    } catch (error) {
      console.error('Erreur downgrade:', error);
    }
  };

  /**
   * Vérifier si l'utilisateur peut ajouter un chien
   */
  const canAddDog = () => {
    if (isPremium) return { allowed: true };
    
    const limit = LIMITS.free.dogs;
    if (dogsCount >= limit) {
      return {
        allowed: false,
        reason: 'dogs',
        message: `Limite atteinte : ${limit} chien maximum en version gratuite`
      };
    }
    
    return { allowed: true };
  };

  /**
   * Vérifier si l'utilisateur peut ajouter une photo
   */
  const canAddPhoto = () => {
    if (isPremium) return { allowed: true };
    
    const limit = LIMITS.free.photos;
    if (photosCount >= limit) {
      return {
        allowed: false,
        reason: 'photos',
        message: `Limite atteinte : ${limit} photos maximum en version gratuite`
      };
    }
    
    return { allowed: true };
  };

  /**
   * Obtenir les limites actuelles
   */
  const getLimits = () => {
    let tier = 'free';
    if (subscriptionTier === 'premium' || subscriptionTier === 'professional') {
      tier = isPremium ? subscriptionTier : 'free';
    }
    
    return {
      dogs: {
        current: dogsCount,
        max: LIMITS[tier].dogs,
        remaining: LIMITS[tier].dogs === Infinity ? Infinity : LIMITS[tier].dogs - dogsCount
      },
      photos: {
        current: photosCount,
        max: LIMITS[tier].photos,
        remaining: LIMITS[tier].photos === Infinity ? Infinity : LIMITS[tier].photos - photosCount
      }
    };
  };

  /**
   * Rafraîchir les compteurs
   */
  const refreshCounts = () => {
    if (user) {
      fetchCounts();
    }
  };

  return {
    isPremium,
    subscriptionTier,
    loading,
    dogsCount,
    photosCount,
    canAddDog,
    canAddPhoto,
    getLimits,
    refreshCounts
  };
};
