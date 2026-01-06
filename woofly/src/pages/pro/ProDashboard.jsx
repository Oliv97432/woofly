import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TabNavigationPro from '../../components/TabNavigationPro';
import UserMenuPro from '../../components/UserMenuPro';
import ContactListModal from '../../components/ContactListModal';
import { 
  Plus, Search, Heart, Users, CheckCircle, Clock, 
  TrendingUp, Calendar, Home, AlertCircle
} from 'lucide-react';

const ProDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [proAccount, setProAccount] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [fosterFamilies, setFosterFamilies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // États pour les modals
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalItems, setModalItems] = useState([]);
  const [modalType, setModalType] = useState('dogs');

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
      await Promise.all([
        fetchDogs(account.id),
        fetchApplications(account.id),
        fetchFosterFamilies(account.id)
      ]);
    } catch (error) {
      console.error('Erreur:', error);
      navigate('/pro/register');
    } finally {
      setLoading(false);
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
          )
        `)
        .eq('professional_account_id', proAccountId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedDogs = data?.map(dog => ({
        ...dog,
        foster_family_name: dog.foster_family?.full_name
      })) || [];
      
      setDogs(formattedDogs);
    } catch (error) {
      console.error('Erreur chargement chiens:', error);
    }
  };

  const fetchApplications = async (proAccountId) => {
    try {
      // ÉTAPE 1 : Récupérer les candidatures avec les chiens
      const { data: applicationsData, error: appsError } = await supabase
        .from('adoption_applications')
        .select(`
          *,
          dogs!adoption_applications_dog_id_fkey(id, name, breed, photo_url)
        `)
        .eq('professional_account_id', proAccountId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      // ÉTAPE 2 : Récupérer les user_profiles séparément
      if (applicationsData && applicationsData.length > 0) {
        const userIds = applicationsData.map(app => app.user_id);
        
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (profilesError) {
          console.error('Erreur chargement profils:', profilesError);
        }

        // ÉTAPE 3 : Combiner les données
        const formattedData = applicationsData.map(app => {
          const profile = profiles?.find(p => p.id === app.user_id);
          return {
            ...app,
            dog: app.dogs,
            applicant: profile || { 
              id: app.user_id, 
              full_name: 'Utilisateur inconnu', 
              email: 'N/A' 
            }
          };
        });

        setApplications(formattedData);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('Erreur chargement candidatures:', error);
      setApplications([]);
    }
  };

  const fetchFosterFamilies = async (proAccountId) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('professional_account_id', proAccountId)
        .or('type.eq.foster_family,type.eq.both')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setFosterFamilies(data || []);
    } catch (error) {
      console.error('Erreur chargement familles:', error);
    }
  };

  // Fonctions pour ouvrir le modal avec différents filtres
  const handleTotalDogsClick = () => {
    setModalTitle(`Total chiens (${stats.total})`);
    setModalItems(dogs);
    setModalType('dogs');
    setShowModal(true);
  };

  const handleAvailableDogsClick = () => {
    const availableDogs = dogs.filter(d => d.adoption_status === 'available' && !d.foster_family_contact_id);
    setModalTitle(`Chiens disponibles (${availableDogs.length})`);
    setModalItems(availableDogs);
    setModalType('dogs');
    setShowModal(true);
  };

  const handleInFosterClick = () => {
    const inFosterDogs = dogs.filter(d => d.foster_family_contact_id);
    setModalTitle(`Chiens en famille d'accueil (${inFosterDogs.length})`);
    setModalItems(inFosterDogs);
    setModalType('dogs');
    setShowModal(true);
  };

  const handlePendingClick = () => {
    const pendingDogs = dogs.filter(d => d.adoption_status === 'pending');
    setModalTitle(`Chiens en cours d'adoption (${pendingDogs.length})`);
    setModalItems(pendingDogs);
    setModalType('dogs');
    setShowModal(true);
  };

  const handleApplicationsClick = () => {
    navigate('/pro/applications');
  };

  const handleFACardClick = () => {
    setModalTitle(`Familles d'accueil (${stats.totalFosterFamilies})`);
    setModalItems(fosterFamilies);
    setModalType('contacts');
    setShowModal(true);
  };

  const stats = {
    total: dogs.length,
    available: dogs.filter(d => d.adoption_status === 'available' && !d.foster_family_contact_id).length,
    inFoster: dogs.filter(d => d.foster_family_contact_id).length,
    pending: dogs.filter(d => d.adoption_status === 'pending').length,
    applications: applications.length,
    totalFosterFamilies: fosterFamilies.length,
    availablePlaces: fosterFamilies
      .filter(fa => fa.availability === 'available')
      .reduce((sum, fa) => sum + (fa.max_dogs - (fa.current_dogs_count || 0)), 0)
  };

  const filteredDogs = dogs.filter(dog => {
    const matchesSearch = dog.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dog.breed?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filterStatus === 'available') {
      matchesFilter = dog.adoption_status === 'available' && !dog.foster_family_contact_id;
    } else if (filterStatus === 'foster') {
      matchesFilter = !!dog.foster_family_contact_id;
    } else if (filterStatus === 'pending') {
      matchesFilter = dog.adoption_status === 'pending';
    }
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (dog) => {
    if (dog.foster_family_contact_id) {
      return {
        text: 'En famille d\'accueil',
        icon: Home,
        color: 'bg-purple-100 text-purple-700 border-purple-200'
      };
    }
    
    switch (dog.adoption_status) {
      case 'available':
        return {
          text: 'Disponible',
          icon: Heart,
          color: 'bg-green-100 text-green-700 border-green-200'
        };
      case 'pending':
        return {
          text: 'Candidature en cours',
          icon: Clock,
          color: 'bg-orange-100 text-orange-700 border-orange-200'
        };
      case 'adopted':
        return {
          text: 'Adopté',
          icon: CheckCircle,
          color: 'bg-gray-100 text-gray-700 border-gray-200'
        };
      default:
        return {
          text: 'Inconnu',
          icon: AlertCircle,
          color: 'bg-gray-100 text-gray-500 border-gray-200'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de votre espace professionnel...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-1">
                {proAccount?.organization_name || 'Mon Refuge'}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                Compte vérifié
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/pro/dogs/new')}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth flex items-center gap-2 shadow-soft min-h-[44px]"
              >
                <Plus size={20} />
                <span className="hidden xs:inline">Nouveau chien</span>
                <span className="xs:hidden">Nouveau</span>
              </button>
              <UserMenuPro />
            </div>
          </div>

          {/* TOUTES LES CARTES CLIQUABLES */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Total chiens - CLIQUABLE */}
            <button
              onClick={handleTotalDogsClick}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Heart size={20} className="text-white" />
                </div>
                <TrendingUp size={16} className="text-blue-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900">{stats.total}</p>
              <p className="text-xs sm:text-sm text-blue-700">Total chiens</p>
            </button>

            {/* Disponibles - CLIQUABLE */}
            <button
              onClick={handleAvailableDogsClick}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Heart size={20} className="text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-green-900">{stats.available}</p>
              <p className="text-xs sm:text-sm text-green-700">Disponibles</p>
            </button>

            {/* En FA - CLIQUABLE */}
            <button
              onClick={handleInFosterClick}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Home size={20} className="text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-purple-900">{stats.inFoster}</p>
              <p className="text-xs sm:text-sm text-purple-700">En FA</p>
            </button>

            {/* En cours - CLIQUABLE */}
            <button
              onClick={handlePendingClick}
              className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Clock size={20} className="text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-orange-900">{stats.pending}</p>
              <p className="text-xs sm:text-sm text-orange-700">En cours</p>
            </button>

            {/* Candidatures - CLIQUABLE (navigation) */}
            <button
              onClick={handleApplicationsClick}
              className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-pink-500 rounded-lg">
                  <Users size={20} className="text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-pink-900">{stats.applications}</p>
              <p className="text-xs sm:text-sm text-pink-700">Candidatures</p>
            </button>

            {/* Familles d'accueil - CLIQUABLE */}
            <button
              onClick={handleFACardClick}
              className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-teal-500 rounded-lg">
                  <Home size={20} className="text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-teal-900">{stats.totalFosterFamilies}</p>
              <p className="text-xs sm:text-sm text-teal-700 mb-1">Familles FA</p>
              <p className="text-xs text-teal-600 font-medium">
                {stats.availablePlaces} places dispo
              </p>
            </button>
          </div>
        </div>
      </div>

      <TabNavigationPro />

      <main className="main-content flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
          <div className="bg-card rounded-xl shadow-soft p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un chien..."
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-sm"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
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
                  onClick={() => setFilterStatus('available')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-smooth ${
                    filterStatus === 'available'
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Disponibles
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
                  onClick={() => setFilterStatus('pending')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-smooth ${
                    filterStatus === 'pending'
                      ? 'bg-orange-500 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  En cours
                </button>
              </div>
            </div>
          </div>

          {filteredDogs.length === 0 ? (
            <div className="bg-card rounded-xl shadow-soft p-12 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart size={40} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-heading font-bold text-foreground mb-2">
                Aucun chien trouvé
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Essayez avec d\'autres mots-clés'
                  : 'Commencez par ajouter votre premier chien'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate('/pro/dogs/new')}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth inline-flex items-center gap-2"
                >
                  <Plus size={20} />
                  Ajouter un chien
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredDogs.map((dog) => {
                const badge = getStatusBadge(dog);
                const StatusIcon = badge.icon;

                return (
                  <div
                    key={dog.id}
                    onClick={() => navigate(`/pro/dogs/${dog.id}`)}
                    className="group bg-card rounded-2xl overflow-hidden shadow-soft border border-border hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1"
                  >
                    <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                      {dog.photo_url ? (
                        <img
                          src={dog.photo_url}
                          alt={dog.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-6xl font-bold text-primary/30">
                            {dog.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}

                      {dog.is_urgent && (
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                            URGENT
                          </span>
                        </div>
                      )}

                      <div className="absolute top-3 right-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border shadow-lg backdrop-blur-sm ${badge.color}`}>
                          <div className="flex items-center gap-1">
                            <StatusIcon size={14} />
                            <span className="hidden sm:inline">{badge.text}</span>
                          </div>
                        </div>
                      </div>

                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>

                    <div className="p-4">
                      <h3 className="font-heading font-bold text-lg text-foreground mb-1 truncate group-hover:text-primary transition-colors">
                        {dog.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 truncate">
                        {dog.breed}
                      </p>

                      {dog.foster_family_contact_id && dog.foster_family && (
                        <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 rounded-lg p-2 mb-3">
                          <Home size={14} />
                          <span className="truncate">Chez {dog.foster_family.full_name}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {dog.gender && (
                          <div className="flex items-center gap-1">
                            <span>{dog.gender === 'male' ? '♂️' : '♀️'}</span>
                            <span>{dog.gender === 'male' ? 'Mâle' : 'Femelle'}</span>
                          </div>
                        )}
                        {dog.birth_date && (
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{new Date().getFullYear() - new Date(dog.birth_date).getFullYear()} an(s)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {applications.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-heading font-bold text-foreground">
                  Candidatures récentes
                </h2>
                <button
                  onClick={() => navigate('/pro/applications')}
                  className="text-primary hover:text-primary/80 font-medium text-sm"
                >
                  Voir tout →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {applications.slice(0, 4).map((app) => (
                  <div
                    key={app.id}
                    className="bg-card rounded-xl shadow-soft border border-border p-4 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => navigate(`/pro/applications/${app.id}`)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0">
                        {app.dog?.photo_url ? (
                          <img
                            src={app.dog.photo_url}
                            alt={app.dog.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary/30">
                            {app.dog?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate mb-1">
                          {app.applicant?.full_name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          Pour {app.dog?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(app.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                          En attente
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal pour afficher les listes */}
      <ContactListModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalTitle}
        items={modalItems}
        type={modalType}
      />
    </div>
  );
};

export default ProDashboard;
