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
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Building2 size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-heading font-semibold text-foreground truncate">
                  {proAccount?.organization_name}
                </h1>
                <div className="flex items-center gap-2">
                  {proAccount?.is_verified ? (
                    <span className="text-xs flex items-center gap-1 text-blue-600">
                      <Check size={12} />
                      Vérifié
                    </span>
                  ) : (
                    <span className="text-xs flex items-center gap-1 text-orange-600">
                      <Clock size={12} />
                      En attente de vérification
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
          
          {/* Bannière de bienvenue */}
          <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-2">
              Bienvenue sur votre dashboard professionnel ! 👋
            </h2>
            <p className="text-white/90 mb-4">
              Gérez vos chiens à l'adoption, suivez les candidatures et touchez des milliers de familles.
            </p>
            <button
              onClick={() => navigate('/pro/dogs/new')}
              className="px-6 py-3 bg-white text-green-600 rounded-xl font-medium hover:bg-gray-100 transition-smooth flex items-center gap-2"
            >
              <Plus size={20} />
              Ajouter un chien
            </button>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Heart}
              label="Chiens disponibles"
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
              label="Total chiens"
              value={stats.totalDogs}
              color="orange"
            />
          </div>

          {/* Chiens récents */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-heading font-semibold text-gray-900">
                Vos derniers chiens
              </h3>
              <button
                onClick={() => navigate('/pro/dogs')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Voir tous
                <ArrowRight size={16} />
              </button>
            </div>

            {recentDogs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentDogs.map(dog => (
                  <DogCard key={dog.id} dog={dog} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Vous n'avez pas encore ajouté de chien</p>
                <button
                  onClick={() => navigate('/pro/dogs/new')}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-smooth inline-flex items-center gap-2"
                >
                  <Plus size={20} />
                  Ajouter votre premier chien
                </button>
              </div>
            )}
          </div>

          {/* Candidatures récentes */}
          {recentApplications.length > 0 && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-heading font-semibold text-gray-900">
                  Candidatures récentes
                </h3>
                <button
                  onClick={() => navigate('/pro/applications')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  Voir toutes
                  <ArrowRight size={16} />
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
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-3 sm:mb-4`}>
        <Icon size={20} className="sm:w-6 sm:h-6 text-white" />
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
        {value}
      </div>
      <div className="text-xs sm:text-sm text-gray-600">
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
      className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-smooth cursor-pointer"
    >
      <div className="flex items-center gap-3">
        {dog.photo_url ? (
          <img
            src={dog.photo_url}
            alt={dog.name}
            className="w-16 h-16 rounded-xl object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
            {dog.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{dog.name}</h4>
          <p className="text-sm text-gray-600">{dog.breed}</p>
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
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{application.applicant_name}</p>
          <p className="text-sm text-gray-600">{application.applicant_email}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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
