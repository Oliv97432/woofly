import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Dog, FileText, Instagram, Settings } from 'lucide-react';

const TabNavigationPro = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      path: '/pro/dashboard',
      color: 'blue'
    },
    {
      id: 'dogs',
      label: 'Mes Chiens',
      icon: Dog,
      path: '/pro/dogs',
      color: 'purple'
    },
    {
      id: 'applications',
      label: 'Candidatures',
      icon: FileText,
      path: '/pro/applications',
      color: 'green'
    },
    {
      id: 'instagram',
      label: 'Instagram',
      icon: Instagram,
      path: '/pro/instagram',
      color: 'pink'
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: Settings,
      path: '/settings',
      color: 'gray'
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getColorClasses = (color, active) => {
    const colors = {
      blue: active ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50',
      purple: active ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50',
      green: active ? 'text-green-600 bg-green-50' : 'text-gray-600 hover:text-green-600 hover:bg-green-50',
      pink: active ? 'text-pink-600 bg-pink-50' : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50',
      gray: active ? 'text-gray-900 bg-gray-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    };
    return colors[color] || colors.gray;
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-around sm:justify-start sm:gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`
                  flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 
                  px-3 sm:px-4 py-3 sm:py-3 rounded-xl transition-all
                  flex-1 sm:flex-none
                  ${getColorClasses(tab.color, active)}
                  ${active ? 'font-semibold' : 'font-medium'}
                `}
                style={{
                  minHeight: '64px',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <Icon 
                  size={20} 
                  className="sm:w-5 sm:h-5" 
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="text-xs sm:text-sm whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default TabNavigationPro;
