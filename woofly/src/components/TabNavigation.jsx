import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Dog, Users, Heart, BookOpen, ChefHat, Bell } from 'lucide-react';
import PremiumBadge from './PremiumBadge';

const TabNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { 
      path: '/dog-profile',
      label: 'Mon Chien', 
      icon: Dog 
    },
    { 
      path: '/social-feed',
      label: 'Communauté', 
      icon: Users 
    },
    { 
      path: '/adoption',
      label: 'Adoption', 
      icon: Heart 
    },
    { 
      path: '/daily-tip',
      label: 'Conseils', 
      icon: BookOpen 
    },
    { 
      path: '/recipes',
      label: 'Recettes', 
      icon: ChefHat,
      premium: true
    },
    { 
      path: '/reminders',
      label: 'Rappels', 
      icon: Bell,
      premium: true // Badge premium
    }
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="sticky top-[73px] z-40 bg-white border-b border-gray-200">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`
                  flex-shrink-0 flex items-center justify-center gap-2 py-4 px-4
                  font-medium text-sm transition-all relative
                  ${active 
                    ? 'text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <Icon size={20} />
                <span className="whitespace-nowrap">{tab.label}</span>
                
                {/* Badge Premium */}
                {tab.premium && (
                  <PremiumBadge size="sm" variant="minimal" />
                )}
                
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;
