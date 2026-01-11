import React, { useState, useEffect } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Download, AlertTriangle, Camera } from 'lucide-react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PremiumModal from '../../../components/PremiumModal';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

const WeightChart = ({ data, onAddWeight }) => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Vérifier statut Premium
  useEffect(() => {
    const checkPremium = async () => {
      if (!user?.id) return;

      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();

        const premiumTiers = ['premium', 'professional'];
        setIsPremium(premiumTiers.includes(profile?.subscription_tier));
      } catch (error) {
        console.error('Erreur vérification premium:', error);
      }
    };

    checkPremium();
  }, [user?.id]);

  // Calculer les statistiques
  const calculateStats = () => {
    if (!data || data.length === 0) {
      return {
        current: 0,
        initial: 0,
        min: 0,
        max: 0,
        average: 0,
        variation: 0,
        trend: 'stable'
      };
    }

    const weights = data.map(d => d.weight);
    const current = weights[weights.length - 1];
    const initial = weights[0];
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const average = weights.reduce((a, b) => a + b, 0) / weights.length;
    const variation = current - initial;

    // Calculer la tendance (sur les 3 dernières mesures)
    let trend = 'stable';
    if (data.length >= 3) {
      const recent = weights.slice(-3);
      const recentVariation = recent[recent.length - 1] - recent[0];
      
      if (recentVariation > 0.5) trend = 'hausse';
      else if (recentVariation < -0.5) trend = 'baisse';
    }

    return { current, initial, min, max, average, variation, trend };
  };

  // Détecter les alertes santé
  const getHealthAlert = () => {
    if (!data || data.length < 2) return null;

    const stats = calculateStats();
    
    // Perte de poids rapide (>10% en peu de temps)
    if (data.length >= 2) {
      const percentLoss = ((stats.initial - stats.current) / stats.initial) * 100;
      if (percentLoss > 10) {
        return {
          type: 'warning',
          message: `Perte de poids significative détectée (${percentLoss.toFixed(1)}%). Consultez votre vétérinaire.`,
          icon: AlertTriangle,
          color: 'text-orange-600'
        };
      }
    }

    // Prise de poids rapide
    if (data.length >= 2) {
      const percentGain = ((stats.current - stats.initial) / stats.initial) * 100;
      if (percentGain > 15) {
        return {
          type: 'warning',
          message: `Prise de poids importante détectée (+${percentGain.toFixed(1)}%). Surveillez l'alimentation.`,
          icon: AlertTriangle,
          color: 'text-orange-600'
        };
      }
    }

    return null;
  };

  // Export graphique (Premium)
  const handleExportChart = async () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    setExporting(true);

    try {
      // Utiliser html2canvas pour capturer le graphique
      const chartElement = document.getElementById('weight-chart-container');
      
      if (!chartElement) {
        alert('❌ Erreur: Impossible de trouver le graphique');
        return;
      }

      // Import dynamique de html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2
      });

      // Convertir en blob et télécharger
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `graphique-poids-${new Date().toISOString().split('T')[0]}.png`;
        link.click();
        URL.revokeObjectURL(url);
        
        alert('✅ Graphique exporté avec succès !');
      });
    } catch (error) {
      console.error('Erreur export:', error);
      alert('❌ Erreur lors de l\'export du graphique');
    } finally {
      setExporting(false);
    }
  };

  const stats = calculateStats();
  const healthAlert = getHealthAlert();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-elevated">
          <p className="text-sm font-semibold text-foreground mb-1">
            {payload?.[0]?.payload?.date}
          </p>
          <p className="text-sm text-muted-foreground font-caption">
            Poids: {payload?.[0]?.value} kg
          </p>
        </div>
      );
    }
    return null;
  };

  const getTrendIcon = () => {
    switch (stats.trend) {
      case 'hausse':
        return <TrendingUp size={20} className="text-green-600" />;
      case 'baisse':
        return <TrendingDown size={20} className="text-red-600" />;
      default:
        return <Minus size={20} className="text-gray-600" />;
    }
  };

  const getTrendLabel = () => {
    switch (stats.trend) {
      case 'hausse':
        return 'En hausse';
      case 'baisse':
        return 'En baisse';
      default:
        return 'Stable';
    }
  };

  const getTrendColor = () => {
    switch (stats.trend) {
      case 'hausse':
        return 'text-green-600';
      case 'baisse':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow-soft p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="TrendingUp" size={20} color="var(--color-primary)" />
            </div>
            <div>
              <h3 className="text-xl font-heading font-semibold text-foreground">
                Évolution du poids
              </h3>
              <p className="text-sm text-muted-foreground font-caption">
                Suivi sur les 6 derniers mois
              </p>
            </div>
          </div>
        </div>

        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="TrendingUp" size={24} color="var(--color-muted-foreground)" />
          </div>
          <p className="text-muted-foreground font-caption text-sm mb-4">
            Aucune pesée enregistrée
          </p>
          <Button
            variant="default"
            iconName="Plus"
            iconPosition="left"
            onClick={onAddWeight}
            size="sm"
          >
            Ajouter une pesée
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-soft p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Icon name="TrendingUp" size={20} color="#ffffff" />
          </div>
          <div>
            <h3 className="text-xl font-heading font-semibold text-foreground">
              Évolution du poids
            </h3>
            <p className="text-sm text-muted-foreground font-caption">
              {data.length} pesée{data.length > 1 ? 's' : ''} enregistrée{data.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton Export (Premium) */}
          <button
            onClick={handleExportChart}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-sm">Export...</span>
              </>
            ) : (
              <>
                <Camera size={16} />
                <span className="text-sm">Exporter</span>
                {!isPremium && (
                  <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-bold">
                    👑
                  </span>
                )}
              </>
            )}
          </button>

          <Button
            variant="outline"
            iconName="Plus"
            iconPosition="left"
            onClick={onAddWeight}
            size="sm"
          >
            Ajouter
          </Button>
        </div>
      </div>

      {/* Alerte santé */}
      {healthAlert && (
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 rounded-r-lg">
          <div className="flex items-start gap-3">
            <healthAlert.icon size={20} className={healthAlert.color} />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                Alerte santé
              </p>
              <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                {healthAlert.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Graphique */}
      <div 
        id="weight-chart-container" 
        className="w-full h-80 bg-background/50 rounded-lg p-4" 
        aria-label="Graphique d'évolution du poids"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              stroke="var(--color-muted-foreground)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'var(--color-muted-foreground)' }}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'var(--color-muted-foreground)' }}
              label={{ 
                value: 'Poids (kg)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'var(--color-muted-foreground)' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="weight" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fill="url(#colorWeight)"
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {/* Poids actuel */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
            Poids actuel
          </p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {stats.current.toFixed(1)} kg
          </p>
        </div>

        {/* Variation */}
        <div className={`bg-gradient-to-br rounded-xl p-4 border ${
          stats.variation > 0 
            ? 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700'
            : stats.variation < 0
              ? 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700'
              : 'from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20 border-gray-200 dark:border-gray-700'
        }`}>
          <p className={`text-xs font-medium mb-1 ${
            stats.variation > 0 
              ? 'text-green-600 dark:text-green-400'
              : stats.variation < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400'
          }`}>
            Variation
          </p>
          <p className={`text-2xl font-bold ${
            stats.variation > 0 
              ? 'text-green-900 dark:text-green-100'
              : stats.variation < 0
                ? 'text-red-900 dark:text-red-100'
                : 'text-gray-900 dark:text-gray-100'
          }`}>
            {stats.variation > 0 ? '+' : ''}{stats.variation.toFixed(1)} kg
          </p>
        </div>

        {/* Moyenne */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
            Moyenne
          </p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {stats.average.toFixed(1)} kg
          </p>
        </div>

        {/* Tendance */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">
            Tendance
          </p>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <p className={`text-lg font-bold ${getTrendColor()}`}>
              {getTrendLabel()}
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques supplémentaires */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="bg-background/80 rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Poids minimum</p>
          <p className="text-lg font-semibold text-foreground">{stats.min.toFixed(1)} kg</p>
        </div>
        <div className="bg-background/80 rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Poids maximum</p>
          <p className="text-lg font-semibold text-foreground">{stats.max.toFixed(1)} kg</p>
        </div>
      </div>

      {/* Modal Premium */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        reason="weight-export"
      />
    </div>
  );
};

export default WeightChart;
