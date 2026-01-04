import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TabNavigationPro from '../../components/TabNavigationPro';
import UserMenuPro from '../../components/UserMenuPro';
import { 
  Search, Home, MapPin, Calendar, ArrowLeft, Heart,
  AlertCircle, ChevronRight
} from 'lucide-react';

const ProDogsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [proAccount, setProAccount] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

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
      fetchDogs(account.id);
    } catch (error) {
      console.error('Erreur:', error);
      navigate('/pro/register');
    }
  };

  const fetchDogs = async (proAccountId) => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select(`
          *,
          foster_family:contacts!dogs_foster_family_contact_id_fkey(
            id,
            full_name,
            email,
            city
          ),
          placement_history!placement_history_dog_id_fkey(
            id,
            start_date,
            status,
            placement_type
          )
        `)
        .eq('professional_account_id', proAccountId)
        .neq('adoption_status', 'adopted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDogs(data || []);
    } catch (error) {
      console.error('Erreur chargement chiens:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const age = Math.floor((new Date() - new Date(birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 1) return 'Moins d\'1 an';
    return `${age} an${age > 1 ? 's' : ''}`;
  };

  const getPlacementDate = (dog) => {
    if (!dog.placement_history || dog.placement_history.length === 0) return null;
    
    const activePlacement = dog.placement_history.find(
      p => p.status === 'active' && p.placement_type === 'foster'
    );
    
    return activePlacement?.start_date;
  };

  const filteredDogs = dogs.filter(dog => {
    const matchesSearch = 
      dog.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dog.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dog.foster_family?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filterStatus === 'foster') {
      matchesFilter = !!dog.foster_family_contact_id;
    } else if (filterStatus === 'available') {
      matchesFilter = !dog.foster_family_contact_id;
    }
    
    return matchesSearch && matchesFilter;
  });

  const dogsInFoster = filteredDogs.filter(d => d.foster_family_contact_id);
  const dogsAvailable = filteredDogs.filter(d => !d.foster_family_contact_id);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <button
              onClick={() => navigate('/pro/dashboard')}
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 min-h-[44px] min-w-[44px]"
            >
              <ArrowLeft size={18} className="sm:size-5" />
              <span className="font-medium text-sm sm:text-base hidden xs:inline">Dashboard</span>
            </button>
            <h1 className="text-lg sm:text-xl font-heading font-bold text-foreground">
              Liste des chiens
            </h1>
            <UserMenuPro />
          </div>

          {/* Barre de recherche et filtres */}
          <div className="flex flex-col xs:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un chien ou une FA..."
                className="w-full pl-9 sm:pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-sm"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 xs:pb-0">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-smooth ${
                  filterStatus === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilterStatus('foster')}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-smooth ${
                  filterStatus === 'foster'
                    ? 'bg-purple-500 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                En FA
              </button>
              <button
                onClick={() => setFilterStatus('available')}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-smooth ${
                  filterStatus === 'available'
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Disponibles
              </button>
            </div>
          </div>
        </div>
      </div>

      <TabNavigationPro />

      {/* Main content */}
      <main className="main-content flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
          
          {filteredDogs.length === 0 ? (
            <div className="bg-card rounded-xl shadow-soft p-12 text-center">
              <Heart size={40} className="text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Aucun chien trouvé' : 'Aucun chien à afficher'}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Chiens en FA */}
              {(filterStatus === 'all' || filterStatus === 'foster') && dogsInFoster.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Home size={20} className="text-purple-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground">
                      En famille d'accueil
                    </h2>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                      {dogsInFoster.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {dogsInFoster.map((dog) => {
                      const placementDate = getPlacementDate(dog);
                      
                      return (
                        <div
                          key={dog.id}
                          className="bg-card rounded-xl shadow-soft border border-border p-4 hover:shadow-lg transition-all"
                        >
                          <div className="flex items-start gap-3 sm:gap-4">
                            {/* Photo du chien */}
                            <div
                              onClick={() => navigate(`/pro/dogs/${dog.id}`)}
                              className="cursor-pointer flex-shrink-0"
                            >
                              {dog.photo_url ? (
                                <img
                                  src={dog.photo_url}
                                  alt={dog.name}
                                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-2 ring-purple-200"
                                />
                              ) : (
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center ring-2 ring-purple-200">
                                  <span className="text-xl sm:text-2xl font-bold text-white">
                                    {dog.name?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Infos chien */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <button
                                  onClick={() => navigate(`/pro/dogs/${dog.id}`)}
                                  className="text-base sm:text-lg font-bold text-foreground hover:text-primary transition-colors truncate"
                                >
                                  {dog.name}
                                  {dog.is_urgent && (
                                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                      URGENT
                                    </span>
                                  )}
                                </button>
                                <ChevronRight size={20} className="text-muted-foreground flex-shrink-0 hidden sm:block" />
                              </div>

                              <p className="text-sm text-muted-foreground mb-3">
                                {dog.breed}
                                {calculateAge(dog.birth_date) && ` • ${calculateAge(dog.birth_date)}`}
                                {dog.gender && ` • ${dog.gender === 'male' ? 'Mâle' : 'Femelle'}`}
                              </p>

                              {/* Infos FA */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <button
                                  onClick={() => navigate(`/pro/crm/contacts/${dog.foster_family.id}`)}
                                  className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                                >
                                  <Home size={16} className="flex-shrink-0" />
                                  <span className="truncate">{dog.foster_family.full_name}</span>
                                </button>

                                {dog.foster_family.city && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <MapPin size={14} className="flex-shrink-0" />
                                    <span className="truncate">{dog.foster_family.city}</span>
                                  </div>
                                )}

                                {placementDate && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Calendar size={14} className="flex-shrink-0" />
                                    <span className="whitespace-nowrap">
                                      Depuis le {new Date(placementDate).toLocaleDateString('fr-FR')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Chiens disponibles */}
              {(filterStatus === 'all' || filterStatus === 'available') && dogsAvailable.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Heart size={20} className="text-green-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground">
                      Disponibles au refuge
                    </h2>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                      {dogsAvailable.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {dogsAvailable.map((dog) => (
                      <div
                        key={dog.id}
                        className="bg-card rounded-xl shadow-soft border border-border p-4 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          {/* Photo du chien */}
                          <div
                            onClick={() => navigate(`/pro/dogs/${dog.id}`)}
                            className="cursor-pointer flex-shrink-0"
                          >
                            {dog.photo_url ? (
                              <img
                                src={dog.photo_url}
                                alt={dog.name}
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-2 ring-green-200"
                              />
                            ) : (
                              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center ring-2 ring-green-200">
                                <span className="text-xl sm:text-2xl font-bold text-white">
                                  {dog.name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Infos chien */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <button
                                onClick={() => navigate(`/pro/dogs/${dog.id}`)}
                                className="text-base sm:text-lg font-bold text-foreground hover:text-primary transition-colors truncate"
                              >
                                {dog.name}
                                {dog.is_urgent && (
                                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                    URGENT
                                  </span>
                                )}
                              </button>
                              <ChevronRight size={20} className="text-muted-foreground flex-shrink-0 hidden sm:block" />
                            </div>

                            <p className="text-sm text-muted-foreground mb-3">
                              {dog.breed}
                              {calculateAge(dog.birth_date) && ` • ${calculateAge(dog.birth_date)}`}
                              {dog.gender && ` • ${dog.gender === 'male' ? 'Mâle' : 'Femelle'}`}
                            </p>

                            {/* Statut */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
                                <Heart size={16} className="flex-shrink-0" />
                                <span>Disponible au refuge</span>
                              </div>

                              {dog.arrival_date && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Calendar size={14} className="flex-shrink-0" />
                                  <span className="whitespace-nowrap">
                                    Depuis le {new Date(dog.arrival_date).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProDogsList;
