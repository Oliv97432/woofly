import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Building2, Heart, Mail, TrendingUp, Plus, Settings,
  Eye, CheckCircle, Clock, ArrowRight, AlertCircle
} from 'lucide-react';
import TabNavigation from '../../components/TabNavigation';
import UserMenu from '../../components/UserMenu';
import Footer from '../../components/Footer';

const ProDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [proAccount, setProAccount] = useState(null);
  const [stats, setStats] = useState({
    totalDogs: 0,
    adoptedDogs: 0,
    pendingApplications: 0,
    totalViews: 0
  });
  const [recentDogs, setRecentDogs] = useState([]);

  useEffect(() => {
    if (user) {
      fetchProAccount();
    }
  }, [user]);

  const fetchProAccount = async () => {
    try {
      // Récupérer le compte pro
      const { data: account, error: accountError } = await supabase
        .from('professional_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (accountError) {
        if (accountError.code === 'PGRST116') {
          // Pas de compte pro → rediriger vers inscription
          navigate('/pro/register');
          return;
        }
        throw accountError;
      }

      setProAccount(account);

      // Récupérer les stats
      await fetchStats(account.id);
      await fetchRecentDogs(account.id);

    } catch (error) {
      console.error('Erreur chargement compte pro:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (proAccountId) => {
    try {
      // Nombre total de chiens
      const { count: totalDogs } = await supabase
        .from('dogs')
        .select('*', { count: 'exact', head: true })
        .eq('professional_account_id', proAccountId)
        .eq('is_for_adoption', true);

      // Chiens adoptés
      const { count: adoptedDogs } = await supabase
        .from('dogs')
        .select('*', { count: 'exact', head: true })
        .eq('professional_account_id', proAccountId)
        .eq('adoption_status', 'adopted');

      // Candidatures en attente
      const { count: pendingApplications } = await supabase
        .from('adoption_applications')
        .select('*', { count: 'exact', head: true })
        .eq('professional_account_id', proAccountId)
        .eq('status', 'pending');

      setStats({
        totalDogs: totalDogs || 0,
        adoptedDogs: adoptedDogs || 0,
        pendingApplications: pendingApplications || 0,
        totalViews: Math.floor(Math.random() * 1000) + 500 // Simulation
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const fetchRecentDogs = async (proAccountId) => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('professional_account_id', proAccountId)
        .eq('is_for_adoption', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentDogs(data || []);
    } catch (error) {
      console.error('Erreur chargement chiens:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!proAccount) {
    return null; // Redirection en cours
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Building2 size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold text-gray-900">
                  {proAccount.organization_name}
                </h1>
                <p className="text-sm text-gray-500">
                  {proAccount.is_verified ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle size={14} />
                      Compte vérifié
                    </span>
                  ) : (
                    <span className="text-orange-600 flex items-center gap-1">
                      <Clock size={14} />
                      En attente de vérification
                    </span>
                  )}
                </p>
              </div>
            </div>

            <UserMenu />
          </div>
        </div>
      </header>

      <TabNavigation />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        
        {/* Alerte si compte non vérifié */}
        {!proAccount.is_verified && (
          <div className="bg-orange-50 border border-orange-200 rounded-3xl p-6 mb-6 flex items-start gap-4">
            <AlertCircle size={24} className="text-orange-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-2">
                Compte en attente de vérification
              </h3>
              <p className="text-orange-800 text-sm">
                Notre équipe vérifie actuellement votre demande. Vous serez notifié par email
                une fois votre compte validé. En attendant, vous pouvez préparer vos fiches
                d'adoption.
              </p>
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total chiens */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Heart size={24} className="text-blue-600" />
              </div>
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Chiens à l'adoption</p>
            <p className="text-3xl font-heading font-bold text-gray-900">
              {stats.totalDogs}
            </p>
          </div>

          {/* Adoptés */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Adoptions réussies</p>
            <p className="text-3xl font-heading font-bold text-gray-900">
              {stats.adoptedDogs}
            </p>
          </div>

          {/* Candidatures */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Mail size={24} className="text-purple-600" />
              </div>
              {stats.pendingApplications > 0 && (
                <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                  {stats.pendingApplications}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">Candidatures en attente</p>
            <p className="text-3xl font-heading font-bold text-gray-900">
              {stats.pendingApplications}
            </p>
          </div>

          {/* Vues */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Eye size={24} className="text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Vues totales</p>
            <p className="text-3xl font-heading font-bold text-gray-900">
              {stats.totalViews}
            </p>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Ajouter un chien */}
          <button
            onClick={() => navigate('/pro/dogs/new')}
            className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 text-white hover:from-blue-600 hover:to-purple-700 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Plus size={32} />
              </div>
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-2xl font-heading font-bold mb-2">
              Ajouter un chien
            </h3>
            <p className="text-white/90">
              Créez une nouvelle fiche d'adoption
            </p>
          </button>

          {/* Gérer les candidatures */}
          <button
            onClick={() => navigate('/pro/applications')}
            className="bg-white border-2 border-gray-200 rounded-3xl p-8 hover:border-purple-500 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Mail size={32} className="text-purple-600" />
              </div>
              <ArrowRight size={24} className="text-gray-400 group-hover:translate-x-1 group-hover:text-purple-600 transition-all" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2">
              Candidatures
            </h3>
            <p className="text-gray-600">
              {stats.pendingApplications} en attente de réponse
            </p>
          </button>
        </div>

        {/* Chiens récents */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-bold text-gray-900">
              Vos chiens à l'adoption
            </h2>
            <button
              onClick={() => navigate('/pro/dogs')}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
            >
              Voir tout
              <ArrowRight size={18} />
            </button>
          </div>

          {recentDogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4">
                Vous n'avez pas encore ajouté de chien
              </p>
              <button
                onClick={() => navigate('/pro/dogs/new')}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
              >
                Ajouter votre premier chien
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentDogs.map((dog) => (
                <div
                  key={dog.id}
                  onClick={() => navigate(`/pro/dogs/${dog.id}`)}
                  className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="aspect-square relative">
                    {dog.photo_url ? (
                      <img
                        src={dog.photo_url}
                        alt={dog.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <span className="text-6xl text-white font-bold">
                          {dog.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        dog.adoption_status === 'available' ? 'bg-green-500 text-white' :
                        dog.adoption_status === 'pending' ? 'bg-orange-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {dog.adoption_status === 'available' ? 'Disponible' :
                         dog.adoption_status === 'pending' ? 'En cours' : 'Adopté'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                      {dog.name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {dog.breed}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProDashboard;
