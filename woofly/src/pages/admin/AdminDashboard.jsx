import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Shield, Users, Building2, Heart, TrendingUp, TrendingDown,
  Clock, Check, AlertCircle, Calendar, Activity, Award,
  MapPin, Eye, Mail, Phone, ArrowRight, X
} from 'lucide-react';
import UserMenu from '../../components/UserMenu';
import Footer from '../../components/Footer';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);
  
  // Stats globales
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPros: 0,
    totalDogs: 0,
    totalAdoptions: 0,
    pendingPros: 0,
    newUsersToday: 0,
    newUsersWeek: 0,
    newUsersMonth: 0,
    newProsWeek: 0,
    newDogsWeek: 0,
    conversionRate: 0,
    adoptionRate: 0,
    avgDogsPerPro: 0
  });
  
  // Activité récente
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentPros, setRecentPros] = useState([]);
  const [recentDogs, setRecentDogs] = useState([]);
  const [recentAdoptions, setRecentAdoptions] = useState([]);
  const [topRefuges, setTopRefuges] = useState([]);
  const [selectedPro, setSelectedPro] = useState(null);

  useEffect(() => {
    checkAdminAndLoadData();
  }, [user]);

  const checkAdminAndLoadData = async () => {
    if (!user) {
      console.log('❌ Admin Check: Pas d\'utilisateur connecté');
      navigate('/login');
      return;
    }

    console.log('🔵 Admin Check: Utilisateur connecté:', user.id);
    setLoading(true);
    setError(null);

    try {
      // Vérifier si admin
      console.log('🔵 Vérification admin pour user:', user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_admin, email')
        .eq('id', user.id)
        .single();

      console.log('🔵 Résultat query admin:', { profile, profileError });

      if (profileError) {
        console.error('❌ Erreur query admin:', profileError);
        setError('Erreur de connexion à la base de données');
        setLoading(false);
        return;
      }

      if (!profile) {
        console.error('❌ Profil non trouvé pour user:', user.id);
        alert('⛔ Profil utilisateur non trouvé');
        navigate('/dashboard');
        return;
      }

      // Vérifier si is_admin existe et est true
      if (!profile.hasOwnProperty('is_admin')) {
        console.error('❌ Colonne is_admin n\'existe pas dans user_profiles !');
        setError('Configuration base de données incorrecte - Colonne is_admin manquante');
        setLoading(false);
        return;
      }

      if (!profile.is_admin) {
        console.error('❌ User n\'est pas admin:', profile.email);
        alert('⛔ Accès refusé - Vous n\'êtes pas administrateur');
        navigate('/dashboard');
        return;
      }

      console.log('✅ User est admin !');
      setIsAdmin(true);
      await loadAllStats();
    } catch (error) {
      console.error('❌ Erreur vérification admin:', error);
      setError('Erreur inattendue: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAllStats = async () => {
    console.log('🔵 Chargement des stats...');
    
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // USERS
      console.log('🔵 Chargement users...');
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('❌ Erreur chargement users:', usersError);
      } else {
        console.log('✅ Users chargés:', users?.length || 0);
      }

      const totalUsers = users?.length || 0;
      const newUsersToday = users?.filter(u => 
        new Date(u.created_at) >= today
      ).length || 0;
      const newUsersWeek = users?.filter(u => 
        new Date(u.created_at) >= weekAgo
      ).length || 0;
      const newUsersMonth = users?.filter(u => 
        new Date(u.created_at) >= monthAgo
      ).length || 0;

      setRecentUsers(users?.slice(0, 10) || []);

      // PROS
      console.log('🔵 Chargement pros...');
      const { data: pros, error: prosError } = await supabase
        .from('professional_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (prosError) {
        console.error('❌ Erreur chargement pros:', prosError);
      } else {
        console.log('✅ Pros chargés:', pros?.length || 0);
      }

      const totalPros = pros?.length || 0;
      const pendingPros = pros?.filter(p => !p.is_verified).length || 0;
      const newProsWeek = pros?.filter(p => 
        new Date(p.created_at) >= weekAgo
      ).length || 0;

      setRecentPros(pros?.slice(0, 5) || []);

      // Top refuges
      console.log('🔵 Calcul top refuges...');
      const prosWithDogs = await Promise.all(
        (pros || []).map(async (pro) => {
          const { data: dogs } = await supabase
            .from('dogs')
            .select('id')
            .eq('professional_account_id', pro.id);
          return { ...pro, dogCount: dogs?.length || 0 };
        })
      );
      
      const topRefuges = prosWithDogs
        .sort((a, b) => b.dogCount - a.dogCount)
        .slice(0, 5);
      
      setTopRefuges(topRefuges);
      console.log('✅ Top refuges calculés:', topRefuges.length);

      // DOGS - RÉCUPÉRER TOUS LES CHIENS
      console.log('🔵 Chargement dogs...');
      const { data: allDogs, error: dogsError } = await supabase
        .from('dogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (dogsError) {
        console.error('❌ Erreur chargement dogs:', dogsError);
      } else {
        console.log('✅ Dogs chargés:', allDogs?.length || 0);
        console.log('🔵 Dogs adoptés:', allDogs?.filter(d => d.adoption_status === 'adopted').length || 0);
      }

      // Chiens à l'adoption (pour affichage récent)
      const dogs = allDogs?.filter(d => d.is_for_adoption === true) || [];

      // STATS sur TOUS les chiens
      const totalDogs = allDogs?.length || 0;
      const adoptedDogs = allDogs?.filter(d => d.adoption_status === 'adopted').length || 0;
      const newDogsWeek = allDogs?.filter(d => 
        new Date(d.created_at) >= weekAgo
      ).length || 0;

      setRecentDogs(dogs?.slice(0, 10) || []);

      // Chiens récemment adoptés
      const adoptedRecently = allDogs?.filter(d => 
        d.adoption_status === 'adopted'
      ).slice(0, 5) || [];
      setRecentAdoptions(adoptedRecently);

      // CALCULS MÉTRIQUES
      const conversionRate = totalUsers > 0 
        ? Math.round((totalPros / totalUsers) * 100) 
        : 0;
      
      const adoptionRate = totalDogs > 0 
        ? Math.round((adoptedDogs / totalDogs) * 100) 
        : 0;
      
      const avgDogsPerPro = totalPros > 0 
        ? Math.round(totalDogs / totalPros * 10) / 10 
        : 0;

      // UPDATE STATE
      const newStats = {
        totalUsers,
        totalPros,
        totalDogs,
        totalAdoptions: adoptedDogs,
        pendingPros,
        newUsersToday,
        newUsersWeek,
        newUsersMonth,
        newProsWeek,
        newDogsWeek,
        conversionRate,
        adoptionRate,
        avgDogsPerPro
      };

      console.log('✅ Stats calculées:', newStats);
      setStats(newStats);

    } catch (error) {
      console.error('❌ Erreur chargement stats:', error);
      setError('Erreur lors du chargement des statistiques: ' + error.message);
    }
  };

  const handleVerifyPro = async (proId) => {
    console.log('🔵 Vérification compte pro:', proId);
    
    if (!window.confirm('Vérifier et activer ce compte professionnel ?')) {
      console.log('❌ Vérification annulée par l\'utilisateur');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('professional_accounts')
        .update({ 
          is_verified: true, 
          is_active: true 
        })
        .eq('id', proId)
        .select();

      console.log('🔵 Résultat update pro:', { data, error });

      if (error) {
        console.error('❌ Erreur update pro:', error);
        alert('❌ Erreur lors de la vérification: ' + error.message);
        return;
      }

      console.log('✅ Compte vérifié avec succès !');
      alert('✅ Compte vérifié !');
      await loadAllStats();
      setSelectedPro(null);
    } catch (error) {
      console.error('❌ Erreur vérification:', error);
      alert('❌ Erreur lors de la vérification: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du dashboard admin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-md">
          <h3 className="text-xl font-bold text-red-900 mb-2">Erreur</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Admin */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-red-600 to-red-700 border-b border-red-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <Shield size={24} className="text-red-600" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold text-white">
                  Dashboard Administrateur
                </h1>
                <p className="text-xs text-red-100">
                  Vue d'ensemble complète de Doogybook
                </p>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Alertes */}
        {stats.pendingPros > 0 && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-orange-600" size={24} />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900">
                  {stats.pendingPros} compte(s) professionnel(s) en attente de vérification
                </h3>
                <p className="text-sm text-orange-700">
                  Ces comptes attendent votre validation
                </p>
              </div>
              <button
                onClick={() => window.scrollTo({ top: 999999, behavior: 'smooth' })}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-smooth flex items-center gap-2"
              >
                Voir <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Stats Principales */}
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
            📊 Statistiques Globales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <BigStatCard
              icon={Users}
              label="Utilisateurs"
              value={stats.totalUsers}
              change={`+${stats.newUsersWeek} cette semaine`}
              color="blue"
            />
            <BigStatCard
              icon={Building2}
              label="Comptes Pro"
              value={stats.totalPros}
              change={`+${stats.newProsWeek} cette semaine`}
              color="green"
            />
            <BigStatCard
              icon={Heart}
              label="Chiens"
              value={stats.totalDogs}
              change={`+${stats.newDogsWeek} cette semaine`}
              color="purple"
            />
            <BigStatCard
              icon={Check}
              label="Adoptions"
              value={stats.totalAdoptions}
              change={`${stats.adoptionRate}% taux d'adoption`}
              color="pink"
            />
          </div>
        </div>

        {/* Activité Aujourd'hui */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-heading font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="text-blue-600" size={24} />
            Activité Aujourd'hui
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MiniStatCard
              label="Nouveaux utilisateurs"
              value={stats.newUsersToday}
              icon={Users}
              color="blue"
            />
            <MiniStatCard
              label="Nouveaux cette semaine"
              value={stats.newUsersWeek}
              icon={TrendingUp}
              color="green"
            />
            <MiniStatCard
              label="Nouveaux ce mois"
              value={stats.newUsersMonth}
              icon={Calendar}
              color="purple"
            />
          </div>
        </div>

        {/* Métriques Clés */}
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
            🎯 Métriques d'Engagement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              icon={Award}
              label="Taux de conversion"
              value={`${stats.conversionRate}%`}
              description="Users qui deviennent pros"
              color="blue"
            />
            <MetricCard
              icon={Heart}
              label="Taux d'adoption"
              value={`${stats.adoptionRate}%`}
              description="Chiens qui trouvent un foyer"
              color="pink"
            />
            <MetricCard
              icon={TrendingUp}
              label="Moyenne chiens/pro"
              value={stats.avgDogsPerPro}
              description="Chiens par refuge"
              color="green"
            />
          </div>
        </div>

        {/* Top Refuges */}
        {topRefuges.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="text-yellow-500" size={24} />
              Top 5 Refuges les Plus Actifs
            </h3>
            <div className="space-y-3">
              {topRefuges.map((refuge, index) => (
                <div key={refuge.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{refuge.organization_name || 'N/A'}</h4>
                    <p className="text-sm text-gray-600">{refuge.city || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{refuge.dogCount}</div>
                    <div className="text-xs text-gray-600">chiens</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activité Récente - 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Derniers Utilisateurs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
              👥 Derniers Utilisateurs ({stats.totalUsers})
            </h3>
            <div className="space-y-2">
              {recentUsers.slice(0, 5).map(user => (
                <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                    {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user.full_name || 'N/A'}</p>
                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Derniers Chiens */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">
              🐕 Derniers Chiens Ajoutés ({stats.totalDogs})
            </h3>
            <div className="space-y-2">
              {recentDogs.slice(0, 5).map(dog => (
                <div key={dog.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {dog.photo_url ? (
                    <img src={dog.photo_url} alt={dog.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
                      {dog.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{dog.name}</p>
                    <p className="text-xs text-gray-600 truncate">{dog.breed}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    dog.adoption_status === 'available' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {dog.adoption_status === 'available' ? 'Dispo' : 'Adopté'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Comptes Pro En Attente */}
        {recentPros.filter(p => !p.is_verified).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-200 p-6">
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="text-orange-600" size={24} />
              Comptes Professionnels En Attente ({stats.pendingPros})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentPros.filter(p => !p.is_verified).map(pro => (
                <ProPendingCard
                  key={pro.id}
                  pro={pro}
                  onVerify={() => handleVerifyPro(pro.id)}
                  onViewDetails={() => setSelectedPro(pro)}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Modal Détails Pro */}
      {selectedPro && (
        <ProDetailsModal
          pro={selectedPro}
          onClose={() => setSelectedPro(null)}
          onVerify={handleVerifyPro}
        />
      )}

      <Footer />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// COMPOSANTS
// ═══════════════════════════════════════════════════════════════════

const BigStatCard = ({ icon: Icon, label, value, change, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-4`}>
        <Icon size={24} className="text-white" />
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm font-medium text-gray-600 mb-2">{label}</div>
      <div className="text-xs text-green-600 flex items-center gap-1">
        <TrendingUp size={12} />
        {change}
      </div>
    </div>
  );
};

const MiniStatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center`}>
          <Icon size={20} />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-600">{label}</div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, description, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    pink: 'from-pink-500 to-pink-600'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-4`}>
        <Icon size={24} className="text-white" />
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm font-semibold text-gray-900 mb-1">{label}</div>
      <div className="text-xs text-gray-600">{description}</div>
    </div>
  );
};

const ProPendingCard = ({ pro, onVerify, onViewDetails }) => {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{pro.organization_name || 'N/A'}</h4>
          <p className="text-sm text-gray-600">{pro.organization_type || 'N/A'}</p>
        </div>
        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
          En attente
        </span>
      </div>
      <div className="space-y-1 mb-3 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Mail size={14} />
          {pro.email || 'N/A'}
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={14} />
          {pro.city || 'N/A'}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onVerify}
          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-smooth text-sm font-medium flex items-center justify-center gap-1"
        >
          <Check size={16} />
          Vérifier
        </button>
        <button
          onClick={onViewDetails}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-smooth"
        >
          <Eye size={16} />
        </button>
      </div>
    </div>
  );
};

const ProDetailsModal = ({ pro, onClose, onVerify }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-heading font-bold text-gray-900">
            Détails du compte professionnel
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Organisation</label>
            <p className="text-lg font-semibold text-gray-900">{pro.organization_name || 'N/A'}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Type</label>
              <p className="text-gray-900">{pro.organization_type || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Ville</label>
              <p className="text-gray-900">{pro.city || 'N/A'}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-gray-900">{pro.email || 'N/A'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Téléphone</label>
            <p className="text-gray-900">{pro.phone || 'N/A'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Date d'inscription</label>
            <p className="text-gray-900">{new Date(pro.created_at).toLocaleString('fr-FR')}</p>
          </div>
        </div>

        {!pro.is_verified && (
          <button
            onClick={() => onVerify(pro.id)}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-smooth flex items-center justify-center gap-2 font-medium"
          >
            <Check size={20} />
            Vérifier et activer ce compte
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
