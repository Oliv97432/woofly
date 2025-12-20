import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from './AppIcon';

const UserMenu = ({ dogProfiles = [], currentDog, onDogChange }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showDogsSubmenu, setShowDogsSubmenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const dropdownRef = useRef(null);

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowDogsSubmenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDogSelect = (dog) => {
    // Naviguer vers la page du profil du chien
    navigate(`/dog-profile/${dog.id}`);
    setIsOpen(false);
    setShowDogsSubmenu(false);
    
    // Mettre à jour le chien actuel si onDogChange est fourni
    if (onDogChange) {
      onDogChange(dog);
    }
  };

  const handleProfile = () => {
  navigate(`/profile/${user.id}`);
  setIsOpen(false);
  };

  const handleSettings = () => {
    navigate('/settings');
    setIsOpen(false);
  };

  const handleShare = () => {
    setIsOpen(false);
    
    // Utiliser l'API Web Share si disponible (mobile)
    if (navigator.share) {
      navigator.share({
        title: 'Doogybook - Gestion de votre chien',
        text: 'Découvrez Doogybook, l\'application complète pour gérer la santé et le bien-être de votre chien !',
        url: 'https://app.Doogybookapp.com'
      }).catch((error) => {
        console.log('Erreur partage:', error);
      });
    } else {
      // Sinon, afficher le modal avec lien à copier
      setShowShareModal(true);
    }
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    
    const confirmed = window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
    if (!confirmed) return;

    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      alert('Erreur lors de la déconnexion. Veuillez réessayer.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText('https://app.Doogybookapp.com');
    alert('✅ Lien copié dans le presse-papier !');
    setShowShareModal(false);
  };

  // Récupérer les infos utilisateur
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilisateur';
  const userEmail = user?.email || '';
  const userAvatar = user?.user_metadata?.avatar_url || null;

  // Initiales pour l'avatar par défaut
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Bouton principal */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 px-3 py-2 bg-card border border-border rounded-full hover:bg-muted transition-smooth"
        >
          {/* Avatar utilisateur */}
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {initials}
            </div>
          )}
          
          <span className="font-medium text-foreground hidden sm:inline text-sm">
            {userName}
          </span>
          
          <Icon 
            name={isOpen ? "ChevronUp" : "ChevronDown"} 
            size={16} 
            className="text-muted-foreground"
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-2xl shadow-elevated z-[100]">
            {/* En-tête utilisateur */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">
                    {userName}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {userEmail}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-2">
              {/* Mon profil */}
              <button
                onClick={handleProfile}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-smooth text-foreground"
              >
                <div className="w-9 h-9 flex items-center justify-center bg-blue-100 rounded-full">
                  <Icon name="User" size={18} className="text-blue-600" />
                </div>
                <span className="text-sm font-medium">Mon profil</span>
              </button>

              {/* Mes chiens (avec sous-menu) */}
              <div className="relative">
                <button
                  onClick={() => setShowDogsSubmenu(!showDogsSubmenu)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-smooth text-foreground"
                >
                  <div className="w-9 h-9 flex items-center justify-center bg-green-100 rounded-full">
                    <Icon name="Dog" size={18} className="text-green-600" />
                  </div>
                  <span className="text-sm font-medium flex-1 text-left">Mes chiens</span>
                  <Icon 
                    name={showDogsSubmenu ? "ChevronUp" : "ChevronDown"} 
                    size={16} 
                    className="text-muted-foreground"
                  />
                </button>

                {/* Sous-menu chiens - CORRIGÉ: S'affiche toujours */}
                {showDogsSubmenu && (
                  <div className="ml-12 mt-1 space-y-1">
                    {dogProfiles.length > 0 ? (
                      <>
                        {dogProfiles.map((dog) => (
                          <button
                            key={dog.id}
                            onClick={() => handleDogSelect(dog)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-smooth text-sm ${
                              currentDog?.id === dog.id
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            {dog.photo_url ? (
                              <img
                                src={dog.photo_url}
                                alt={dog.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                {dog.name?.charAt(0)?.toUpperCase()}
                              </div>
                            )}
                            <span className="flex-1 text-left">{dog.name}</span>
                            {currentDog?.id === dog.id && (
                              <Icon name="Check" size={14} className="text-primary" />
                            )}
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        Aucun chien enregistré
                      </div>
                    )}
                    <button
                      onClick={() => {
                        navigate('/multi-profile-management');
                        setIsOpen(false);
                        setShowDogsSubmenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-smooth text-sm text-muted-foreground"
                    >
                      <Icon name="Plus" size={16} />
                      <span>Gérer mes chiens</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Paramètres */}
              <button
                onClick={handleSettings}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-smooth text-foreground"
              >
                <div className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-full">
                  <Icon name="Settings" size={18} className="text-gray-600" />
                </div>
                <span className="text-sm font-medium">Paramètres</span>
              </button>
            </div>

            <div className="border-t border-border"></div>

            {/* Partager l'app */}
            <div className="p-2">
              <button
                onClick={handleShare}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-smooth text-foreground"
              >
                <div className="w-9 h-9 flex items-center justify-center bg-purple-100 rounded-full">
                  <Icon name="Share2" size={18} className="text-purple-600" />
                </div>
                <span className="text-sm font-medium">Partager l'app</span>
              </button>
            </div>

            <div className="border-t border-border"></div>

            {/* Déconnexion */}
            <div className="p-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 transition-smooth text-destructive"
              >
                <div className="w-9 h-9 flex items-center justify-center bg-destructive/10 rounded-full">
                  <Icon name="LogOut" size={18} className="text-destructive" />
                </div>
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de partage (fallback pour desktop) */}
      {showShareModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-elevated max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold text-foreground">
                Partager Doogybook
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-muted-foreground hover:text-foreground transition-smooth"
              >
                <Icon name="X" size={24} />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Partagez Doogybook avec d'autres propriétaires de chiens !
            </p>

            <div className="flex items-center gap-2 p-3 bg-muted rounded-xl mb-4">
              <input
                type="text"
                value="https://app.Doogybookapp.com"
                readOnly
                className="flex-1 bg-transparent text-sm text-foreground outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-smooth"
              >
                Copier
              </button>
            </div>

            <div className="flex gap-2">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=https://app.Doogybookapp.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1877F2] text-white rounded-xl hover:bg-[#1877F2]/90 transition-smooth"
              >
                <span className="text-sm font-medium">Facebook</span>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=Découvrez Doogybook, l'application pour gérer votre chien !&url=https://app.Doogybookapp.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1DA1F2] text-white rounded-xl hover:bg-[#1DA1F2]/90 transition-smooth"
              >
                <span className="text-sm font-medium">Twitter</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserMenu;
