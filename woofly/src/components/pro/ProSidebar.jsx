import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Dog, 
  List, 
  Users, 
  Mail,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const ProSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // État de la sidebar sauvegardé dans localStorage
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('pro-sidebar-open');
    return saved ? JSON.parse(saved) : false; // Fermée par défaut
  });

  // Mobile drawer state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Sauvegarder l'état
  useEffect(() => {
    localStorage.setItem('pro-sidebar-open', JSON.stringify(isOpen));
  }, [isOpen]);

  const navItems = [
    {
      icon: LayoutDashboard,
      label: 'Tableau de bord',
      path: '/pro/dashboard',
      badge: null
    },
    {
      icon: Dog,
      label: 'Mes Chiens',
      path: '/pro/dogs',
      badge: null
    },
    {
      icon: List,
      label: 'Liste',
      path: '/pro/adoption-list',
      badge: null
    },
    {
      icon: Users,
      label: 'Familles',
      path: '/pro/foster-families',
      badge: null
    },
    {
      icon: Mail,
      label: 'Candidatures',
      path: '/pro/adoption-applications',
      badge: null
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileOpen(false); // Ferme le drawer mobile
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Overlay mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Bouton hamburger mobile (visible seulement sur mobile) */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50"
      >
        <ChevronRight size={20} />
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64' : 'w-16'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header avec toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {isOpen && (
            <span className="font-bold text-lg text-gray-900">Menu</span>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden lg:block"
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
          {/* Bouton fermer sur mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <div key={item.path} className="relative group">
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-lg
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-green-50 text-green-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                    ${!isOpen && 'justify-center'}
                  `}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  
                  {isOpen && (
                    <span className="font-medium truncate flex-1 text-left">
                      {item.label}
                    </span>
                  )}

                  {item.badge && isOpen && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Tooltip quand sidebar fermée */}
                {!isOpen && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                    {item.label}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Spacer pour le contenu principal (desktop only) */}
      <div 
        className={`
          hidden lg:block
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64' : 'w-16'}
        `}
      />
    </>
  );
};

export default ProSidebar;
```

---

## 🔧 **INSTALLATION**

**1. Crée le fichier :**
```
src/components/pro/ProSidebar.jsx
