import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

// VERSION DEBUG SIMPLIFIÉE - Pour tester rapidement
const ProfileHeader = ({ profile, onEdit, vaccinations = [], treatments = [], weightData = [] }) => {
  
  // 🐛 DEBUG - Affiche tout dans la console
  React.useEffect(() => {
    console.clear();
    console.log('╔════════════════════════════════════╗');
    console.log('║   DEBUG PROFILEHEADER             ║');
    console.log('╚════════════════════════════════════╝');
    console.log('');
    console.log('📊 DONNÉES REÇUES:');
    console.log('- vaccinations:', vaccinations);
    console.log('- treatments:', treatments);
    console.log('- weightData:', weightData);
    console.log('');
    
    if (treatments.length > 0) {
      console.log('🔍 DÉTAIL TREATMENTS:');
      treatments.forEach((t, i) => {
        console.log(`  [${i}]`, {
          id: t.id,
          product: t.product,
          type: t.type,
          lastDate: t.lastDate
        });
      });
      console.log('');
    }
    
    const vermifuges = treatments.filter(t => t.type === 'worm');
    const fleaTreatments = treatments.filter(t => t.type === 'flea' || t.type === 'tick');
    
    console.log('📈 STATISTIQUES:');
    console.log('- Total vaccinations:', vaccinations.length);
    console.log('- Total treatments:', treatments.length);
    console.log('- Vermifuges (type=worm):', vermifuges.length);
    console.log('- Anti-puces (type=flea/tick):', fleaTreatments.length);
    console.log('- Pesées:', weightData.length);
    console.log('');
    console.log('════════════════════════════════════');
  }, [vaccinations, treatments, weightData]);

  // Calculs simples
  const totalVaccinations = vaccinations.length;
  const vermifuges = treatments.filter(t => t.type === 'worm');
  const fleaTreatments = treatments.filter(t => t.type === 'flea' || t.type === 'tick');
  const totalPesees = weightData.length;

  return (
    <div className="space-y-4">
      {/* BANDEAU DEBUG EN HAUT */}
      <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-4">
        <p className="font-bold text-yellow-800 mb-2">🐛 MODE DEBUG - Ouvre la console (F12)</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div className="bg-white rounded p-2">
            <p className="text-gray-600">Vaccinations</p>
            <p className="text-xl font-bold">{totalVaccinations}</p>
          </div>
          <div className="bg-white rounded p-2">
            <p className="text-gray-600">Vermifuges</p>
            <p className="text-xl font-bold">{vermifuges.length}</p>
          </div>
          <div className="bg-white rounded p-2">
            <p className="text-gray-600">Anti-puces</p>
            <p className="text-xl font-bold">{fleaTreatments.length}</p>
          </div>
          <div className="bg-white rounded p-2">
            <p className="text-gray-600">Pesées</p>
            <p className="text-xl font-bold">{totalPesees}</p>
          </div>
        </div>
      </div>

      {/* 4 CARTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARTE 1 : Infos Chien */}
        <div className="bg-card rounded-2xl shadow-soft p-4 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="Dog" size={20} color="var(--color-primary)" />
            </div>
            <h3 className="font-heading font-semibold text-foreground">Informations</h3>
          </div>

          <div className="space-y-3">
            <div className="text-sm">
              <p className="text-gray-600 text-xs">Race</p>
              <p className="font-medium">🐕 {profile?.breed || 'Non renseignée'}</p>
            </div>
            
            <div className="text-sm">
              <p className="text-gray-600 text-xs">Sexe</p>
              <p className="font-medium">
                {profile?.gender === 'Mâle' || profile?.gender === 'male' ? '♂️' : '♀️'} {profile?.gender || 'Non renseigné'}
              </p>
            </div>
            
            <div className="text-sm">
              <p className="text-gray-600 text-xs">Âge</p>
              <p className="font-medium">📅 {profile?.age || 'Non renseigné'}</p>
            </div>
            
            <div className="text-sm">
              <p className="text-gray-600 text-xs">Poids</p>
              <p className="font-medium">⚖️ {profile?.weight || 'Non renseigné'}</p>
            </div>
            
            <div className="text-sm">
              <p className="text-gray-600 text-xs">Statut</p>
              <p className="font-medium">💚 {profile?.sterilized || 'Non renseigné'}</p>
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

        {/* CARTE 2 : Résumé Santé */}
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
                  <p className="text-xs text-gray-600">Vaccinations</p>
                  <p className="text-sm font-semibold">{totalVaccinations} enregistré{totalVaccinations > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Vermifuge */}
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐛</span>
                <div>
                  <p className="text-xs text-gray-600">Vermifuge</p>
                  <p className="text-sm font-semibold">{vermifuges.length} traitement{vermifuges.length > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Anti-puces */}
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🦟</span>
                <div>
                  <p className="text-xs text-gray-600">Anti-puces</p>
                  <p className="text-sm font-semibold">{fleaTreatments.length} traitement{fleaTreatments.length > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Statut global */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="text-xl">{treatments.length > 0 ? '✅' : '⚠️'}</span>
                <p className="text-sm font-medium">{treatments.length > 0 ? 'Carnet à jour' : 'Vérifier carnet'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CARTE 3 : Prochains RDV */}
        <div className="bg-card rounded-2xl shadow-soft p-4 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Icon name="Calendar" size={20} color="#f97316" />
            </div>
            <h3 className="font-heading font-semibold text-foreground">Prochains RDV</h3>
          </div>

          <div className="text-center py-8">
            <span className="text-4xl mb-2 block">📅</span>
            <p className="text-sm text-gray-600">Aucun RDV prévu</p>
            <p className="text-xs text-gray-500 mt-1">dans les 60 prochains jours</p>
          </div>
        </div>

        {/* CARTE 4 : Poids */}
        <div className="bg-card rounded-2xl shadow-soft p-4 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Icon name="TrendingUp" size={20} color="#3b82f6" />
            </div>
            <h3 className="font-heading font-semibold text-foreground">Évolution poids</h3>
          </div>

          <div className="text-center py-8">
            <span className="text-4xl mb-2 block">⚖️</span>
            <p className="text-sm text-gray-600">{totalPesees} pesée{totalPesees > 1 ? 's' : ''}</p>
            <p className="text-xs text-gray-500 mt-1">enregistrée{totalPesees > 1 ? 's' : ''}</p>
          </div>
        </div>

      </div>

      {/* BANDEAU DEBUG EN BAS */}
      <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4">
        <p className="font-bold text-red-800 mb-2">⚠️ TESTS À FAIRE:</p>
        <ol className="text-sm text-red-900 space-y-1 list-decimal list-inside">
          <li>Ouvre la console (F12) et lis les logs détaillés</li>
          <li>Vérifie que les nombres ci-dessus correspondent à tes données</li>
          <li>Si vermifuges = 0, vérifie dans Supabase que treatment_type = 'worm'</li>
          <li>Si tout est correct ici, le problème vient d'ailleurs</li>
        </ol>
      </div>
    </div>
  );
};

export default ProfileHeader;
