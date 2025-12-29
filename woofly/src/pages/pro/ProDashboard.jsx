import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Building2, Heart, Mail, Phone, 
  Eye, Check, Clock, ArrowRight, Plus,
  TrendingUp, Users, Calendar
} from 'lucide-react';
import TabNavigationPro from '../../components/TabNavigationPro';
import UserMenu from '../../components/UserMenu';
import Footer from '../../components/Footer';

const ProDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [proAccount, setProAccount] = useState(null);
  const [stats, setStats] = useState({
    totalDogs: 0,
    availableDogs: 0,
    adoptedDogs: 0,
    pendingApplications: 0
  });
  const [recentDogs, setRecentDogs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);

  useEffect(() => {
    if (user) {
      loadProData();
    }
  }, [user]);

  const loadProData = async () => {
    setLoading(true);
    try {
      // Charger le compte professionnel
      const { data: proData, error: proError } = await supabase
        .from('professional_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (proError) throw proError;
      setProAccount(proData);

      // Charger les statistiques des chiens
      const { data: dogsData, error: dogsError } = await supabase
        .from('dogs')
        .select('*')
        .eq('professional_account_id', proData.id);

      if (dogsError) throw dogsError;

      const totalDogs = dogsData?.length || 0;
      const availableDogs = dogsData?.filter(d => d.adoption_status === 'available').length || 0;
      const adoptedDogs = dogsData?.filter(d => d.adoption_status === 'adopted').length || 0;

      setStats(prev => ({
        ...prev,
        totalDogs,
        availableDogs,
        adoptedDogs
      }));

      // Charger les 3 derniers chiens
      setRecentDogs(dogsData?.slice(0, 3) || []);

      // Charger les candidatures
      const dogIds = dogsData?.map(d => d.id) || [];
      
      if (dogIds.length > 0) {
        const { data: appsData, error: appsError } = await supabase
          .from('adoption_applications')
          .select('*')
          .in('dog_id', dogIds)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!appsError) {
          const pendingApps = appsData?.filter(a => a.status === 'pending').length || 0;
          setStats(prev => ({ ...prev, pendingApplications: pendingApps }));
          setRecentApplications(appsData || []);
        }
      }

    } catch (error) {
      console.error('Erreur chargement données pro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 size={18} className="sm:size-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg md:text-xl font-heading font-semibold text-foreground truncate">
                  {proAccount?.organization_name}
                </h1>
                <div className="flex items-center gap-1 sm:gap-2 mt-0.5">
                  {proAccount?.is_verified ? (
                    <span className="text-[10px] xs:text-xs flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      <Check size={10} className="sm:size-3" />
                      <span className="truncate">Vérifié</span>
                    </span>
                  ) : (
                    <span className="text-[10px] xs:text-xs flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                      <Clock size={10} className="sm:size-3" />
                      <span className="truncate">En vérification</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <UserMenu />
          </div>
        </div>
      </div>

      <TabNavigationPro />

      {/* Main content */}
      <main className="main-content flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
          
          {/* Bannière de bienvenue */}
          <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-white">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-heading font-bold mb-2 leading-tight">
              Bienvenue sur votre dashboard professionnel ! 👋
            </h2>
            <p className="text-white/90 mb-4 text-sm sm:text-base">
              Gérez vos chiens à l'adoption, suivez les candidatures et touchez des milliers de familles.
            </p>
            <button
              onClick={() => navigate('/pro/dogs/new')}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-white text-green-600 rounded-xl font-medium hover:bg-gray-100 transition-smooth flex items-center gap-2 min-h-[44px] w-full sm:w-auto"
            >
              <Plus size={18} className="sm:size-5" />
              <span className="text-sm sm:text-base">Ajouter un chien</span>
            </button>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <StatCard
              icon={Heart}
              label="Disponibles"
              value={stats.availableDogs}
              color="blue"
            />
            <StatCard
              icon={Check}
              label="Adoptés"
              value={stats.adoptedDogs}
              color="green"
            />
            <StatCard
              icon={Mail}
              label="Candidatures"
              value={stats.pendingApplications}
              color="purple"
            />
            <StatCard
              icon={Eye}
              label="Total"
              value={stats.totalDogs}
              color="orange"
            />
          </div>

          {/* Chiens récents */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg md:text-xl font-heading font-semibold text-gray-900">
                Vos derniers chiens
              </h3>
              <button
                onClick={() => navigate('/pro/dogs')}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 min-h-[44px]"
              >
                <span className="hidden xs:inline">Voir tous</span>
                <ArrowRight size={14} className="sm:size-4" />
              </button>
            </div>

            {recentDogs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {recentDogs.map(dog => (
                  <DogCard key={dog.id} dog={dog} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 md:py-12">
                <Heart size={40} className="sm:size-12 md:size-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-600 mb-4 text-sm sm:text-base">Vous n'avez pas encore ajouté de chien</p>
                <button
                  onClick={() => navigate('/pro/dogs/new')}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-smooth inline-flex items-center gap-2 min-h-[44px]"
                >
                  <Plus size={18} className="sm:size-5" />
                  <span className="text-sm sm:text-base">Ajouter votre premier chien</span>
                </button>
              </div>
            )}
          </div>

          {/* Candidatures récentes */}
          {recentApplications.length > 0 && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg md:text-xl font-heading font-semibold text-gray-900">
                  Candidatures récentes
                </h3>
                <button
                  onClick={() => navigate('/pro/applications')}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 min-h-[44px]"
                >
                  <span className="hidden xs:inline">Voir toutes</span>
                  <ArrowRight size={14} className="sm:size-4" />
                </button>
              </div>

              <div className="space-y-3">
                {recentApplications.slice(0, 3).map(app => (
                  <ApplicationCard key={app.id} application={app} />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

// Composant Carte Statistique
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
      <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-2 sm:mb-3 md:mb-4`}>
        <Icon size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
      </div>
      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-0.5 sm:mb-1">
        {value}
      </div>
      <div className="text-xs sm:text-sm text-gray-600 truncate">
        {label}
      </div>
    </div>
  );
};

// Composant Carte Chien
const DogCard = ({ dog }) => {
  const navigate = useNavigate();
  
  return (
    <div
      onClick={() => navigate(`/pro/dogs/${dog.id}`)}
      className="bg-gray-50 rounded-xl p-3 sm:p-4 hover:bg-gray-100 transition-smooth cursor-pointer active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        {dog.photo_url ? (
          <img
            src={dog.photo_url}
            alt={dog.name}
            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg sm:text-xl font-bold flex-shrink-0">
            {dog.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{dog.name}</h4>
          <p className="text-xs sm:text-sm text-gray-600 truncate">{dog.breed}</p>
          <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${
            dog.adoption_status === 'available' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {dog.adoption_status === 'available' ? 'Disponible' : 'Adopté'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Composant Carte Candidature
const ApplicationCard = ({ application }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{application.applicant_name}</p>
          <p className="text-xs sm:text-sm text-gray-600 truncate">{application.applicant_email}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
          application.status === 'pending' 
            ? 'bg-yellow-100 text-yellow-700'
            : application.status === 'approved'
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {application.status === 'pending' ? 'En attente' : 
           application.status === 'approved' ? 'Approuvée' : 'Refusée'}
        </span>
      </div>
    </div>
  );
};

export default ProDashboard;
