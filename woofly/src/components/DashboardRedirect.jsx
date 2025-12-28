import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const DashboardRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkProAccount = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Vérifier si l'utilisateur a un compte pro
        const { data: proAccount, error } = await supabase
          .from('professional_accounts')
          .select('id, is_active')
          .eq('user_id', user.id)
          .single();

        if (proAccount && proAccount.is_active) {
          // A un compte pro → Dashboard Pro
          navigate('/pro/dashboard');
        } else {
          // Pas de compte pro → Dashboard User
          navigate('/dog-profile');
        }
      } catch (error) {
        // En cas d'erreur ou pas de compte pro → Dashboard User
        console.log('No pro account found, redirecting to user dashboard');
        navigate('/dog-profile');
      } finally {
        setChecking(false);
      }
    };

    checkProAccount();
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
