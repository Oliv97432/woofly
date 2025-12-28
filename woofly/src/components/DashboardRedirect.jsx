import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const DashboardRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    console.log('🔵 DashboardRedirect: Component mounted!');
    
    const checkAccountType = async () => {
      console.log('🔵 DashboardRedirect: Checking account type...');
      console.log('🔵 User:', user);
      
      if (!user) {
        console.log('🔴 DashboardRedirect: No user, redirecting to login');
        navigate('/login');
        return;
      }

      console.log('🟢 DashboardRedirect: User found:', user.id);
      console.log('🟢 DashboardRedirect: User email:', user.email);

      try {
        console.log('🔵 DashboardRedirect: Step 1 - Checking if admin BY EMAIL...');
        
        // ÉTAPE 1 : Vérifier si l'utilisateur est admin PAR EMAIL
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('is_admin, email, id')
          .eq('email', user.email)  // ✅ CHERCHER PAR EMAIL !
          .single();

        console.log('🔵 DashboardRedirect: Admin check result:', { profile, profileError });

        if (profile && profile.is_admin === true) {
          // Est un admin → Dashboard Admin
          console.log('🟣 DashboardRedirect: User is ADMIN! Redirecting to /admin/dashboard');
          navigate('/admin/dashboard');
          return;
        }

        console.log('🔵 DashboardRedirect: Step 2 - Checking if professional account...');
        
        // ÉTAPE 2 : Vérifier si l'utilisateur a un compte pro
        const { data: proAccount, error: proError } = await supabase
          .from('professional_accounts')
          .select('id, is_active')
          .eq('user_id', user.id)
          .single();

        console.log('🔵 DashboardRedirect: Pro account result:', { proAccount, proError });

        if (proAccount && proAccount.is_active) {
          // A un compte pro → Dashboard Pro
          console.log('🟢 DashboardRedirect: Pro account found! Redirecting to /pro/dashboard');
          navigate('/pro/dashboard');
        } else {
          // Pas de compte pro → Dashboard User
          console.log('🟡 DashboardRedirect: Regular user. Redirecting to /dog-profile');
          navigate('/dog-profile');
        }
      } catch (error) {
        // En cas d'erreur → Dashboard User
        console.log('🔴 DashboardRedirect: Error occurred:', error);
        console.log('🟡 DashboardRedirect: Redirecting to /dog-profile');
        navigate('/dog-profile');
      } finally {
        setChecking(false);
      }
    };

    checkAccountType();
  }, [user, navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default DashboardRedirect;
