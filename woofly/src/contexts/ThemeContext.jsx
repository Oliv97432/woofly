import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé dans ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  // Charger le thème depuis localStorage au démarrage
  useEffect(() => {
    const checkPremiumAndLoadTheme = async () => {
      try {
        // Vérifier le statut Premium
        const { data: { user } } = await supabase.auth.getUser();
        console.log('🔍 User ID:', user?.id);
        
        if (user) {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('subscription_tier')
            .eq('id', user.id)
            .single();

          console.log('🔍 Profile data:', profile);
          console.log('🔍 Error:', error);
          console.log('🔍 Subscription tier:', profile?.subscription_tier);

          const premiumTiers = ['premium', 'professional'];
          const userIsPremium = premiumTiers.includes(profile?.subscription_tier);
          
          console.log('🔍 Is Premium?', userIsPremium);
          
          setIsPremium(userIsPremium);

          // Charger le thème seulement si Premium
          if (userIsPremium) {
            const savedTheme = localStorage.getItem('woofly-theme') || 'light';
            console.log('🔍 Saved theme:', savedTheme);
            setTheme(savedTheme);
            
            // Appliquer la classe au HTML
            if (savedTheme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          } else {
            console.log('⚠️ Pas Premium - forçage mode clair');
            // Forcer le mode clair si pas Premium
            setTheme('light');
            document.documentElement.classList.remove('dark');
            localStorage.removeItem('woofly-theme');
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement thème:', error);
      } finally {
        setLoading(false);
      }
    };

    checkPremiumAndLoadTheme();
  }, []);

  const toggleTheme = () => {
    if (!isPremium) {
      console.log('⚠️ Toggle bloqué - pas Premium');
      return; // Ne rien faire si pas Premium
    }

    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log('🔄 Toggle theme:', theme, '->', newTheme);
    setTheme(newTheme);
    
    // Sauvegarder dans localStorage
    localStorage.setItem('woofly-theme', newTheme);
    
    // Appliquer la classe au HTML
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const value = {
    theme,
    setTheme: toggleTheme,
    isPremium,
    loading
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
