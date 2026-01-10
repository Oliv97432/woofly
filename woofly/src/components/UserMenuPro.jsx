import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, 
  Dog, 
  Users, 
  Home,
  List,  // ✅ AJOUTÉ
  Settings, 
  LogOut, 
  ChevronDown,
  CheckCircle,
  Heart
} from 'lucide-react';
import DonationModal from './DonationModal';

const UserMenuPro = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [proAccount, setProAccount] = useState(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchProAccount();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProAccount = async () => {
    try {
      const { data, error } = await supabase
        .from('professional_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProAccount(data);
    } catch (error) {
      console.error('Erreur chargement compte pro:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  const handleDonation = () => {
    setIsOpen(false);
    setShowDonationModal(true);
  };

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      onClick: () => {
        navigate('/pro/dashboard');
        setIsOpen(false);
      }
    },
    {
      icon: Dog,
      label: 'Mes chiens',
      onClick: () => {
        navigate('/pro/dogs');
        setIsOpen(false);
      }
    },
    // ✅ NOUVEAU : LISTE
    {
      icon: List,
      label: 'Liste',
      onClick: () => {
        navigate('/pro/adoption-list');
        setIsOpen(false);
      }
    },
    {
      icon: Home,
      label: 'Familles d\'accueil',
      onClick: () => {
        navigate('/pro/foster-families');
        setIsOpen(false);
      }
    },
    {
      icon: Users,
      label: 'Candidatures',
      onClick: () => {
        navigate('/pro/applications');
        setIsOpen(false);
      }
    },
    {
      icon: Settings,
      label: 'Paramètres',
      onClick: () => {
        navigate('/pro/settings');
        setIsOpen(false);
      }
    }
  ];

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-card border border-border rounded-xl hover:bg-muted transition-smooth min-h-[44px]"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
            {proAccount?.organization_name?.charAt(0).toUpperCase() || 'P'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="font-medium text-sm text-foreground truncate max-w-[150px]">
              {proAccount?.organization_name || 'Mon Refuge'}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle size={12} className="text-green-500" />
              Compte vérifié
            </p>
          </div>
          <ChevronDown 
            size={16} 
            className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg py-2 z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border">
              <p className="font-medium text-sm text-foreground truncate">
                {proAccount?.organization_name || 'Mon Refuge'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {proAccount?.email || user?.email}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle size={12} className="text-green-500" />
                <span className="text-xs text-green-600">Compte vérifié</span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted transition-smooth text-left min-h-[44px]"
                  >
                    <Icon size={18} className="text-muted-foreground" />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Donation Button */}
            <div className="border-t border-border py-2">
              <button
                onClick={handleDonation}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-pink-50 transition-smooth text-left group min-h-[44px]"
              >
                <Heart size={18} className="text-pink-500 group-hover:fill-pink-500 transition-all" />
                <span className="text-sm text-pink-600 font-medium">Faire un don</span>
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-border pt-2">
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 text-red-600 transition-smooth text-left min-h-[44px]"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <DonationModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
      />
    </>
  );
};

export default UserMenuPro;
