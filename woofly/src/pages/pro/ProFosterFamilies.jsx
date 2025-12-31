import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TabNavigationPro from '../../components/TabNavigationPro';
import UserMenuPro from '../../components/UserMenuPro';
import { 
  ArrowLeft, Home, Mail, Phone, Calendar, Dog, 
  Plus, Search, X, Check
} from 'lucide-react';

const ProFosterFamilies = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [proAccount, setProAccount] = useState(null);
  const [fosterFamilies, setFosterFamilies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFamilyEmail, setNewFamilyEmail] = useState('');
  const [addingFamily, setAddingFamily] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProAccount();
    }
  }, [user]);

  const fetchProAccount = async () => {
    try {
      const { data: account, error } = await supabase
        .from('professional_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProAccount(account);
      await fetchFosterFamilies(account.id);
    } catch (error) {
      console.error('Erreur:', error);
      navigate('/pro/register');
    } finally {
      setLoading(false);
    }
  };

  const fetchFosterFamilies = async (proAccountId) => {
    try {
      const { data: dogsInFoster, error } = await supabase
        .from('dogs')
        .select(`
          id,
          name,
          breed,
          photo_url,
          foster_family_user_id,
          foster_family:user_profiles!dogs_foster_family_user_id_fkey(
            id,
            full_name,
            email,
            phone,
            created_at
          )
        `)
        .eq('professional_account_id', proAccountId)
        .not('foster_family_user_id', 'is', null);

      if (error) throw error;

      const familiesMap = new Map();
      dogsInFoster?.forEach(dog => {
        if (dog.foster_family) {
          const familyId = dog.foster_family.id;
          if (!familiesMap.has(familyId)) {
            familiesMap.set(familyId, {
              ...dog.foster_family,
              dogs: []
            });
          }
          familiesMap.get(familyId).dogs.push({
            id: dog.id,
            name: dog.name,
            breed: dog.breed,
            photo_url: dog.photo_url
          });
        }
      });

      setFosterFamilies(Array.from(familiesMap.values()));
    } catch (error) {
      console.error('Erreur chargement familles:', error);
    }
  };

  const handleAddFamily = async () => {
    if (!newFamilyEmail.trim()) {
      alert('Veuillez entrer un email');
      return;
    }

    setAddingFamily(true);
    try {
      const { data: userProfile, error: findError } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('email', newFamilyEmail.toLowerCase().trim())
        .single();

      if (findError || !userProfile) {
        alert('Aucun utilisateur trouvé avec cet email. La personne doit d\'abord créer un compte.');
        return;
      }

      const isAlreadyFoster = fosterFamilies.some(f => f.id === userProfile.id);
      if (isAlreadyFoster) {
        alert('Cette famille d\'accueil est déjà enregistrée.');
        return;
      }

      alert(`${userProfile.full_name || userProfile.email} peut maintenant être ajouté(e) comme famille d'accueil lors de la gestion d'un chien.`);
      
      setShowAddModal(false);
      setNewFamilyEmail('');
      
    } catch (error) {
      console.error('Erreur ajout famille:', error);
      alert('Erreur lors de l\'ajout de la famille d\'accueil');
    } finally {
      setAddingFamily(false);
    }
  };

  const filteredFamilies = fosterFamilies.filter(family => 
    family.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    family.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/pro/dashboard')}
                className="p-2 hover:bg-muted rounded-lg transition-smooth min-h-[44px] min-w-[44px]"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
                  Familles d'accueil
                </h1>
                <p className="text-sm text-muted-foreground">
                  {fosterFamilies.length} famille{fosterFamilies.length > 1 ? 's' : ''} active{fosterFamilies.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth flex items-center gap-2 min-h-[44px]"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Ajouter</span>
              </button>
              <UserMenuPro />
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une famille..."
              className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            />
          </div>
        </div>
      </div>

      <TabNavigationPro />

      {/* Main Content */}
      <main className="main-content flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
          {filteredFamilies.length === 0 ? (
            <div className="bg-card rounded-xl shadow-soft p-12 text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home size={40} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-heading font-bold text-foreground mb-2">
                {searchTerm ? 'Aucune famille trouvée' : 'Aucune famille d\'accueil active'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Essayez avec d\'autres mots-clés'
                  : 'Les familles d\'accueil apparaîtront ici une fois qu\'un chien leur sera confié'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth inline-flex items-center gap-2"
                >
                  <Plus size={20} />
                  Ajouter une famille d'accueil
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredFamilies.map((family) => (
                <div
                  key={family.id}
                  className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden hover:shadow-lg transition-all"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-bold">
                        {family.full_name?.charAt(0).toUpperCase() || 'F'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate">
                          {family.full_name || 'Famille d\'accueil'}
                        </h3>
                        <div className="flex items-center gap-1 text-white/80 text-xs">
                          <Home size={12} />
                          <span>{family.dogs.length} chien{family.dogs.length > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="p-4 space-y-2">
                    {family.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={16} className="text-muted-foreground flex-shrink-0" />
                        <a 
                          href={`mailto:${family.email}`}
                          className="text-primary hover:underline truncate"
                        >
                          {family.email}
                        </a>
                      </div>
                    )}
                    {family.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={16} className="text-muted-foreground flex-shrink-0" />
                        <a 
                          href={`tel:${family.phone}`}
                          className="text-foreground hover:text-primary truncate"
                        >
                          {family.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Dogs List */}
                  <div className="px-4 pb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Chiens accueillis :
                    </p>
                    <div className="space-y-2">
                      {family.dogs.map((dog) => (
                        <div
                          key={dog.id}
                          onClick={() => navigate(`/pro/dogs/${dog.id}`)}
                          className="flex items-center gap-3 p-2 bg-muted rounded-lg hover:bg-muted/80 transition-smooth cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0">
                            {dog.photo_url ? (
                              <img
                                src={dog.photo_url}
                                alt={dog.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg font-bold text-primary/30">
                                {dog.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">
                              {dog.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {dog.breed}
                            </p>
                          </div>
                          <Dog size={16} className="text-muted-foreground flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Family Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-heading font-bold text-foreground">
                Ajouter une famille d'accueil
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-smooth"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Entrez l'email d'un utilisateur existant pour l'ajouter comme famille d'accueil.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email de la famille d'accueil
                </label>
                <input
                  type="email"
                  value={newFamilyEmail}
                  onChange={(e) => setNewFamilyEmail(e.target.value)}
                  placeholder="famille@example.com"
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFamily()}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-border rounded-xl font-medium hover:bg-muted transition-smooth"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddFamily}
                  disabled={addingFamily || !newFamilyEmail.trim()}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {addingFamily ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Vérification...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Ajouter
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProFosterFamilies;
