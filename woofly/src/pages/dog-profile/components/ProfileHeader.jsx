import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ProfileHeader = ({ profile, onEdit, vaccinations = [], treatments = [], weightData = [] }) => {
  // Calculer les stats santé
  const totalVaccinations = vaccinations.length;
  const upcomingVaccinations = vaccinations.filter(v => {
    if (!v.nextDate || v.nextDate === 'Non défini') return false;
    const nextDate = new Date(v.nextDate.split('/').reverse().join('-'));
    const today = new Date();
    return nextDate > today;
  }).length;

  const totalTreatments = treatments.length;
  const recentTreatments = treatments.filter(t => {
    if (!t.lastDate) return false;
    const lastDate = new Date(t.lastDate.split('/').reverse().join('-'));
    const today = new Date();
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  }).length;

  // Calculer prochains RDV (tous les traitements/vaccins avec date future)
  const upcomingEvents = [];
  
  vaccinations.forEach(v => {
    if (v.nextDate && v.nextDate !== 'Non défini') {
      try {
        const nextDate = new Date(v.nextDate.split('/').reverse().join('-'));
        const today = new Date();
        const diffDays = Math.floor((nextDate - today) / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays <= 60) {
          upcomingEvents.push({
            type: 'vaccination',
            name: v.name,
            days: diffDays,
            icon: '💉'
          });
        }
      } catch (e) {
        console.error('Date parsing error:', e);
      }
    }
  });

  treatments.forEach(t => {
    if (t.nextDate && t.nextDate !== 'Non défini') {
      try {
        const nextDate = new Date(t.nextDate.split('/').reverse().join('-'));
        const today = new Date();
        const diffDays = Math.floor((nextDate - today) / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays <= 60) {
          upcomingEvents.push({
            type: t.type === 'worm' ? 'vermifuge' : 'anti-puces',
            name: t.product,
            days: diffDays,
            icon: t.type === 'worm' ? '🐛' : '🦟'
          });
        }
      } catch (e) {
        console.error('Date parsing error:', e);
      }
    }
  });

  // Trier par date la plus proche
  upcomingEvents.sort((a, b) => a.days - b.days);

  // Prendre les 3 prochains
  const nextThreeEvents = upcomingEvents.slice(0, 3);

  // Calculer évolution poids (dernières 5 pesées)
  const recentWeights = weightData.slice(-5);
  const firstWeight = recentWeights[0]?.weight;
  const lastWeight = recentWeights[recentWeights.length - 1]?.weight;
  const weightTrend = firstWeight && lastWeight ? (lastWeight > firstWeight ? '↗️' : lastWeight < firstWeight ? '↘️' : '➡️') : '➡️';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CARTE 1 : Infos Chien (25%) */}
      <div className="bg-card rounded-2xl shadow-soft p-4 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon name="Dog" size={20} color="var(--color-primary)" />
          </div>
          <h3 className="font-heading font-semibold text-foreground">Informations</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <span className="text-xl">🐕</span>
            <div className="flex-1">
              <p className="text-muted-foreground text-xs">Race</p>
              <p className="font-medium text-foreground">{profile?.breed || 'Non renseignée'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <span className="text-xl">{profile?.gender === 'Mâle' || profile?.gender === 'male' ? '♂️' : '♀️'}</span>
            <div className="flex-1">
              <p className="text-muted-foreground text-xs">Sexe</p>
              <p className="font-medium text-foreground">{profile?.gender || 'Non renseigné'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <span className="text-xl">📅</span>
            <div className="flex-1">
              <p className="text-muted-foreground text-xs">Âge</p>
              <p className="font-medium text-foreground">{profile?.age || 'Non renseigné'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <span className="text-xl">⚖️</span>
            <div className="flex-1">
              <p className="text-muted-foreground text-xs">Poids</p>
              <p className="font-medium text-foreground">{profile?.weight || 'Non renseigné'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <span className="text-xl">💚</span>
            <div className="flex-1">
              <p className="text-muted-foreground text-xs">Statut</p>
              <p className="font-medium text-foreground">{profile?.sterilized || 'Non renseigné'}</p>
            </div>
          </div>
        </div>

        {onEdit && (
          <Button
            variant="outline"
            iconName="Edit"
            iconPosition="left"
            onClick={onEdit}
            className="w-full mt-4"
            size="sm"
          >
            Modifier
          </Button>
        )}
      </div>

      {/* CARTE 2 : Résumé Santé (25%) */}
      <div className="bg-card rounded-2xl shadow-soft p-4 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <Icon name="Heart" size={20} color="#10b981" />
          </div>
          <h3 className="font-heading font-semibold text-foreground">Résumé santé</h3>
        </div>

        <div className="space-y-3">
          {/* Vaccinations */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💉</span>
              <div>
                <p className="text-xs text-muted-foreground">Vaccinations</p>
                <p className="text-sm font-semibold text-foreground">{totalVaccinations} enregistré{totalVaccinations > 1 ? 's' : ''}</p>
              </div>
            </div>
            {upcomingVaccinations > 0 && (
              <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {upcomingVaccinations}
              </div>
            )}
          </div>

          {/* Vermifuge */}
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐛</span>
              <div>
                <p className="text-xs text-muted-foreground">Vermifuge</p>
                <p className="text-sm font-semibold text-foreground">
                  {treatments.filter(t => t.type === 'worm').length} traitement{treatments.filter(t => t.type === 'worm').length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Anti-puces */}
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦟</span>
              <div>
                <p className="text-xs text-muted-foreground">Anti-puces</p>
                <p className="text-sm font-semibold text-foreground">
                  {treatments.filter(t => t.type === 'flea' || t.type === 'tick').length} traitement{treatments.filter(t => t.type === 'flea' || t.type === 'tick').length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Statut global */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {recentTreatments > 0 || upcomingVaccinations > 0 ? '✅' : '⚠️'}
              </span>
              <p className="text-sm font-medium text-foreground">
                {recentTreatments > 0 || upcomingVaccinations > 0 ? 'Carnet à jour' : 'Vérifier carnet'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CARTE 3 : Prochains RDV (25%) */}
      <div className="bg-card rounded-2xl shadow-soft p-4 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Icon name="Calendar" size={20} color="#f97316" />
          </div>
          <h3 className="font-heading font-semibold text-foreground">Prochains RDV</h3>
        </div>

        {nextThreeEvents.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-2 block">📅</span>
            <p className="text-sm text-muted-foreground">Aucun RDV prévu</p>
            <p className="text-xs text-muted-foreground mt-1">dans les 60 prochains jours</p>
          </div>
        ) : (
          <div className="space-y-3">
            {nextThreeEvents.map((event, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-background rounded-xl">
                <span className="text-2xl">{event.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {event.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {event.days === 0 
                      ? "Aujourd'hui" 
                      : event.days === 1 
                        ? "Demain" 
                        : `Dans ${event.days} jour${event.days > 1 ? 's' : ''}`
                    }
                  </p>
                </div>
                {event.days <= 7 && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
            ))}

            {upcomingEvents.length > 3 && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                +{upcomingEvents.length - 3} autre{upcomingEvents.length - 3 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </div>

      {/* CARTE 4 : Poids (25%) */}
      <div className="bg-card rounded-2xl shadow-soft p-4 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Icon name="TrendingUp" size={20} color="#3b82f6" />
          </div>
          <h3 className="font-heading font-semibold text-foreground">Évolution poids</h3>
        </div>

        {recentWeights.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-2 block">⚖️</span>
            <p className="text-sm text-muted-foreground">Aucune pesée</p>
            <p className="text-xs text-muted-foreground mt-1">enregistrée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mini graphique ASCII style */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 h-24 flex items-end justify-around gap-1">
              {recentWeights.map((w, i) => {
                const maxWeight = Math.max(...recentWeights.map(x => x.weight));
                const minWeight = Math.min(...recentWeights.map(x => x.weight));
                const range = maxWeight - minWeight || 1;
                const height = ((w.weight - minWeight) / range) * 80 + 20;
                
                return (
                  <div 
                    key={i} 
                    className="flex-1 bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                    style={{ height: `${height}%` }}
                    title={`${w.weight} kg`}
                  />
                );
              })}
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Actuel</span>
                <span className="font-bold text-foreground text-lg">{lastWeight} kg</span>
              </div>
              
              {firstWeight && lastWeight && firstWeight !== lastWeight && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tendance</span>
                  <span className="font-medium text-foreground flex items-center gap-1">
                    {weightTrend} 
                    {firstWeight.toFixed(1)} → {lastWeight.toFixed(1)} kg
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pesées</span>
                <span className="font-medium text-foreground">{weightData.length}</span>
              </div>
            </div>

            {/* Bouton voir détails */}
            <div className="pt-2 border-t border-border">
              <button 
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1 mx-auto"
                onClick={() => {/* Scroll vers onglet poids */}}
              >
                Voir le graphique complet
                <Icon name="ArrowRight" size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
