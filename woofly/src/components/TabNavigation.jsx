import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import Icon from './AppIcon';

const TabNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const { unreadCount } = useNotifications();

  const tabs = [
    {
      id: 'profile',
      label: 'Mon Chien',
      icon: 'Dog',
      path: '/dog-profile',
      tooltip: 'Gérer le profil de votre chien'
    },
    {
      id: 'community',
      label: 'Communauté',
      icon: 'Users',
      path: '/social-feed',
      tooltip: 'Rejoindre la communauté'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: 'Bell',
      path: '/notifications',
      tooltip: 'Vos notifications',
      badge: unreadCount
    },
    {
      id: 'resources',
      label: 'Conseils & Contacts',
      icon: 'BookOpen',
      path: '/daily-tip',
      tooltip: 'Accéder aux ressources'
    }
  ];

  useEffect(() => {
    const currentPath = location?.pathname;
    
    if (currentPath?.includes('/dog-profile') || currentPath?.includes('/multi-profile-management')) {
      setActiveTab('profile');
    } else if (currentPath?.includes('/social-feed') || currentPath?.includes('/forum-hub') || currentPath?.includes('/forum-discussion')) {
      setActiveTab('community');
    } else if (currentPath?.includes('/notifications')) {
      setActiveTab('notifications');
    } else if (currentPath?.includes('/daily-tip') || currentPath?.includes('/important-contacts')) {
      setActiveTab('resources');
    }
  }, [location?.pathname]);

  const handleTabClick = (tab) => {
    setActiveTab(tab?.id);
    navigate(tab?.path);
  };

  return (
    <nav className="tab-navigation tab-navigation-desktop" role="navigation" aria-label="Navigation principale">
      <div className="flex items-center justify-around h-full max-w-screen-xl mx-auto">
        {tabs?.map((tab) => (
          <button
            key={tab?.id}
            onClick={() => handleTabClick(tab)}
            className={`tab-item tab-item-desktop ${activeTab === tab?.id ? 'active' : ''} relative`}
            aria-label={tab?.tooltip}
            aria-current={activeTab === tab?.id ? 'page' : undefined}
            title={tab?.tooltip}
          >
            <div className="relative">
              <Icon 
                name={tab?.icon} 
                size={24} 
                strokeWidth={activeTab === tab?.id ? 2.5 : 2}
              />
              {/* Badge notifications */}
              {tab?.badge > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </div>
              )}
            </div>
            <span className="text-sm font-medium lg:text-base">
              {tab?.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default TabNavigation;
