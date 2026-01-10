import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import PremiumModal from '../components/PremiumModal';
import RecipeGenerator from '../components/recipes/RecipeGenerator';
import RecipeHistory from '../components/recipes/RecipeHistory';

const RecipesPage = () => {
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      const premiumTiers = ['premium', 'professional'];
      const userIsPremium = premiumTiers.includes(profile?.subscription_tier);
      
      setIsPremium(userIsPremium);
      
      // Afficher le modal si non-premium
      if (!userIsPremium) {
        setShowPremiumModal(true);
      }
    } catch (error) {
      console.error('Erreur vérification premium:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🍽️ Recettes Personnalisées
          </h1>
          <p className="text-gray-600">
            Créez des recettes équilibrées et sécurisées pour votre chien
          </p>
        </div>

        {isPremium ? (
          <>
            {/* Générateur de recettes */}
            <RecipeGenerator />
            
            {/* Historique */}
            <div className="mt-8">
              <RecipeHistory />
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              Cette fonctionnalité est réservée aux membres Premium
            </p>
            <button
              onClick={() => setShowPremiumModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Découvrir Premium
            </button>
          </div>
        )}
      </div>

      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        reason="recipes"
      />
    </div>
  );
};

export default RecipesPage;
