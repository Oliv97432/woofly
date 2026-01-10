import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from './AppIcon';
import DonationModalUser from './DonationModalUser';

const UserMenu = ({ dogProfiles = [], currentDog, onDogChange }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showDogsSubmenu, setShowDogsSubmenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
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

  const handleSettings = () => {
    navigate('/settings');
    setIsOpen(false);
  };

  const handleAdoption = () => {
    navigate('/adoption');
    setIsOpen(false);
  };

  const handleTips = () => {
    navigate('/daily-tip');
    setIsOpen(false);
  };

  const handleRecipes = () => {
    navigate('/recipes');
    setIsOpen(false);
  };

  const handleShare = () => {
    setIsOpen(false);
    
    // Utiliser l'API Web Share si disponible (mobile)
    if (navigator.share) {
      navigator.share({
        title: 'Doogybook - Gestion de votre chien',
        text: 'Découvrez Doogybook, l\'application complète pour gérer la santé et le bien-être de votre chien !',
        url: 'https://www.doogybook.com'
      }).catch((error) => {
        console.log('Erreur partage:', error);
      });
    } else {
      // Sinon, afficher le modal avec lien à copier
      setShowShareModal(true);
    }
  };

  const handleDonation = () => {
    setIsOpen(false);
    setShowDonationModal(true);
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
    navigator.clipboard.writeText('https://www.doogybook.com');
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
        {/* Bouton principal - ajusté pour mobile */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 bg-card border border-border rounded-full hover:bg-muted transition-smooth"
        >
          {/* Avatar utilisateur - taille réduite sur mobile */}
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold">
              {initials}
            </div>
          )}
          
          {/* Nom caché sur très petit mobile, visible sur tablette+ */}
          <span className="font-medium text-foreground hidden xs:inline text-xs sm:text-sm">
            {userName}
          </span>
          
          <Icon 
            name={isOpen ? "ChevronUp" : "ChevronDown"} 
            size={14} 
            className="sm:w-4 sm:h-4 text-muted-foreground"
          />
        </button>

        {/* Dropdown - ajusté pour mobile */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-card border border-border rounded-xl sm:rounded-2xl shadow-elevated z-[100] max-h-[80vh] overflow-y-auto">
            {/* En-tête utilisateur */}
            <div className="p-3 sm:p-4 border-b border-border">
              <div className="flex items-center gap-2 sm:gap-3">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-base sm:text-lg font-bold">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate text-sm sm:text-base">
                    {userName}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {userEmail}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-1 sm:p-2">
              {/* Mes chiens (avec sous-menu) */}
              <div className="relative">
                <button
                  onClick={() => setShowDogsSubmenu(!showDogsSubmenu)}
                  className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-muted transition-smooth text-foreground"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-green-100 rounded-full flex-shrink-0">
                    <Icon name="Dog" size={16} className="sm:w-4 sm:h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium flex-1 text-left">Mes chiens</span>
                  <Icon 
                    name={showDogsSubmenu ? "ChevronUp" : "ChevronDown"} 
                    size={14} 
                    className="sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0"
                  />
                </button>

                {/* Sous-menu chiens */}
                {showDogsSubmenu && (
                  <div className="ml-10 sm:ml-12 mt-1 space-y-1">
                    {dogProfiles.length > 0 ? (
                      <>
                        {dogProfiles.map((dog) => (
                          <button
                            key={dog.id}
                            onClick={() => handleDogSelect(dog)}
                            className={`w-full flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-smooth text-xs sm:text-sm ${
                              currentDog?.id === dog.id
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            {dog.photo_url ? (
                              <img
                                src={dog.photo_url}
                                alt={dog.name}
                                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {dog.name?.charAt(0)?.toUpperCase()}
                              </div>
                            )}
                            <span className="flex-1 text-left truncate">{dog.name}</span>
                            {currentDog?.id === dog.id && (
                              <Icon name="Check" size={12} className="sm:w-3 sm:h-3 text-primary flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="px-2 sm:px-3 py-1.5 text-xs text-muted-foreground">
                        Aucun chien enregistré
                      </div>
                    )}
                    <button
                      onClick={() => {
                        navigate('/multi-profile-management');
                        setIsOpen(false);
                        setShowDogsSubmenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-muted transition-smooth text-xs sm:text-sm text-muted-foreground"
                    >
                      <Icon name="Plus" size={14} className="sm:w-4 sm:h-4" />
                      <span>Gérer mes chiens</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Paramètres */}
              <button
                onClick={handleSettings}
                className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-muted transition-smooth text-foreground"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-gray-100 rounded-full flex-shrink-0">
                  <Icon name="Settings" size={16} className="sm:w-4 sm:h-4 text-gray-600" />
                </div>
                <span className="text-sm font-medium">Paramètres</span>
              </button>
            </div>

            <div className="border-t border-border"></div>

            {/* NOUVELLES OPTIONS */}
            <div className="p-1 sm:p-2">
              {/* Adoption */}
              <button
                onClick={handleAdoption}
                className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-muted transition-smooth text-foreground"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-pink-100 rounded-full flex-shrink-0">
                  <Icon name="Heart" size={16} className="sm:w-4 sm:h-4 text-pink-600" />
                </div>
                <span className="text-sm font-medium">Adoption</span>
              </button>

              {/* Conseils quotidiens */}
              <button
                onClick={handleTips}
                className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-muted transition-smooth text-foreground"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-blue-100 rounded-full flex-shrink-0">
                  <Icon name="BookOpen" size={16} className="sm:w-4 sm:h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium">Conseils quotidiens</span>
              </button>

              {/* Recettes */}
              <button
                onClick={handleRecipes}
                className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-muted transition-smooth text-foreground"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-orange-100 rounded-full flex-shrink-0">
                  <Icon name="ChefHat" size={16} className="sm:w-4 sm:h-4 text-orange-600" />
                </div>
                <span className="text-sm font-medium">Recettes</span>
              </button>
            </div>

            <div className="border-t border-border"></div>

            {/* Partager l'app */}
            <div className="p-1 sm:p-2">
              <button
                onClick={handleShare}
                className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-muted transition-smooth text-foreground"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-purple-100 rounded-full flex-shrink-0">
                  <Icon name="Share2" size={16} className="sm:w-4 sm:h-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium">Partager l'app</span>
              </button>
            </div>

            <div className="border-t border-border"></div>

            {/* Offrir un café */}
            <div className="p-1 sm:p-2">
              <button
                onClick={handleDonation}
                className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-amber-50 transition-smooth text-foreground group"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-amber-100 rounded-full flex-shrink-0">
                  <Icon name="Coffee" size={16} className="sm:w-4 sm:h-4 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-amber-700 group-hover:text-amber-800">Offrir un café</span>
              </button>
            </div>

            <div className="border-t border-border"></div>

            {/* Déconnexion */}
            <div className="p-1 sm:p-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-destructive/10 transition-smooth text-destructive"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-destructive/10 rounded-full flex-shrink-0">
                  <Icon name="LogOut" size={16} className="sm:w-4 sm:h-4 text-destructive" />
                </div>
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de partage (fallback pour desktop) - ajusté pour mobile */}
      {showShareModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card rounded-xl sm:rounded-2xl shadow-elevated max-w-sm sm:max-w-md w-full p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-heading font-semibold text-foreground">
                Partager Doogybook
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-muted-foreground hover:text-foreground transition-smooth"
              >
                <Icon name="X" size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Partagez Doogybook avec d'autres propriétaires de chiens !
            </p>

            <div className="flex items-center gap-2 p-2 sm:p-3 bg-muted rounded-lg sm:rounded-xl mb-3 sm:mb-4">
              <input
                type="text"
                value="https://www.doogybook.com"
                readOnly
                className="flex-1 bg-transparent text-xs sm:text-sm text-foreground outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="px-2 sm:px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm font-medium hover:bg-primary/90 transition-smooth whitespace-nowrap"
              >
                Copier
              </button>
            </div>

            <div className="flex gap-2">
              
                href={`https://www.facebook.com/sharer/sharer.php?u=https://www.doogybook.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1877F2] text-white rounded-lg sm:rounded-xl hover:bg-[#1877F2]/90 transition-smooth"
              >
                <span className="text-xs sm:text-sm font-medium">Facebook</span>
              </a>
              
                href={`https://twitter.com/intent/tweet?text=Découvrez Doogybook, l'application pour gérer votre chien !&url=https://www.doogybook.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1DA1F2] text-white rounded-lg sm:rounded-xl hover:bg-[#1DA1F2]/90 transition-smooth"
              >
                <span className="text-xs sm:text-sm font-medium">Twitter</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal de don */}
      <DonationModalUser
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
      />
    </>
  );
};

export default UserMenu;
```

---

## ✅ CHANGEMENTS EFFECTUÉS

**3 nouvelles options ajoutées entre "Paramètres" et "Partager l'app" :**

1. **💗 Adoption** (rose)
   - Icône : Heart
   - Navigation : `/adoption`

2. **📖 Conseils quotidiens** (bleu)
   - Icône : BookOpen
   - Navigation : `/daily-tip`

3. **🍽️ Recettes** (orange)
   - Icône : ChefHat
   - Navigation : `/recipes`

---

## 📋 ORDRE FINAL DU MENU
```
👤 olivier avril
   inbyoliver@gmail.com
─────────────────────
🐕 Mes chiens ▼
⚙️ Paramètres
─────────────────────
💗 Adoption
📖 Conseils quotidiens
🍽️ Recettes
─────────────────────
🔗 Partager l'app
─────────────────────
☕ Offrir un café
─────────────────────
🚪 Déconnexion
