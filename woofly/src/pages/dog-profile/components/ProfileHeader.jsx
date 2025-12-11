import { useState, useEffect } from 'react';
import { Stethoscope, Syringe, Bug, Edit2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function ProfileHeader({ profile, onEdit }) {
  const [healthStats, setHealthStats] = useState({
    vaccinations: [],
    treatments: [],
    weightData: [],
    totalVaccinations: 0,
    totalTreatments: 0,
    totalVermifuges: 0,
    totalAntiPuces: 0,
    totalPesees: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadHealthData();
    }
  }, [profile?.id]);

  const loadHealthData = async () => {
    try {
      setLoading(true);

      // ✅ CHARGER LES VACCINATIONS depuis la table "vaccinations"
      const { data: vaccinations, error: vaccinationsError } = await supabase
        .from('vaccinations')
        .select('*')
        .eq('dog_id', profile.id)
        .order('vaccination_date', { ascending: false });

      if (vaccinationsError) {
        console.error('❌ Error loading vaccinations:', vaccinationsError);
      }

      // ✅ CHARGER LES TRAITEMENTS depuis la table "treatments"
      const { data: treatments, error: treatmentsError } = await supabase
        .from('treatments')
        .select('*')
        .eq('dog_id', profile.id)
        .order('treatment_date', { ascending: false });

      if (treatmentsError) {
        console.error('❌ Error loading treatments:', treatmentsError);
      }

      // ✅ CHARGER LES PESÉES depuis la table "weight_records"
      const { data: weightRecords, error: weightError } = await supabase
        .from('weight_records')
        .select('*')
        .eq('dog_id', profile.id)
        .order('measurement_date', { ascending: true });

      if (weightError) {
        console.error('❌ Error loading weight records:', weightError);
      }

      // Filtrer les traitements par type
      const vermifuges = treatments?.filter(t => 
        t.treatment_type === 'worm' || t.treatment_type === 'vermifuge'
      ) || [];

      const antiPuces = treatments?.filter(t => 
        t.treatment_type === 'flea' || t.treatment_type === 'tick'
      ) || [];

      const allTreatments = [...vermifuges, ...antiPuces];

      // Calculer les statistiques
      const stats = {
        vaccinations: vaccinations || [],
        treatments: treatments || [],
        weightData: weightRecords || [],
        totalVaccinations: vaccinations?.length || 0,
        totalTreatments: allTreatments.length,
        totalVermifuges: vermifuges.length,
        totalAntiPuces: antiPuces.length,
        totalPesees: weightRecords?.length || 0
      };

      setHealthStats(stats);

      // DEBUG - Afficher dans la console
      console.log('🐕 DEBUG PROFILEHEADER');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📌 Dog ID:', profile.id);
      console.log('📌 Dog Name:', profile.name);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📦 VACCINATIONS (' + (vaccinations?.length || 0) + '):', vaccinations);
      console.log('📦 TREATMENTS (' + (treatments?.length || 0) + '):', treatments);
      console.log('📦 WEIGHT RECORDS (' + (weightRecords?.length || 0) + '):', weightRecords);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 DONNÉES FILTRÉES:');
      console.log('  💉 Vaccinations (' + stats.totalVaccinations + '):', vaccinations);
      console.log('  🐛 Vermifuges (' + vermifuges.length + '):', vermifuges);
      console.log('  🦟 Anti-puces (' + antiPuces.length + '):', antiPuces);
      console.log('  ⚖️ Pesées (' + stats.totalPesees + '):', weightRecords);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📈 STATISTIQUES FINALES:');
      console.log('  Total vaccinations:', stats.totalVaccinations);
      console.log('  Total treatments:', stats.totalTreatments);
      console.log('  Total vermifuges:', stats.totalVermifuges);
      console.log('  Total anti-puces:', stats.totalAntiPuces);
      console.log('  Total pesées:', stats.totalPesees);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Si aucune donnée n'est trouvée
      if ((!vaccinations || vaccinations.length === 0) && 
          (!treatments || treatments.length === 0) &&
          (!weightRecords || weightRecords.length === 0)) {
        console.warn('⚠️ AUCUNE DONNÉE TROUVÉE POUR CE CHIEN !');
        console.log('Tables vérifiées : vaccinations, treatments, weight_records');
        console.log('Dog ID :', profile.id);
      }

    } catch (error) {
      console.error('💥 Error in loadHealthData:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculer l'âge du chien
  const calculateAge = (birthday) => {
    if (!birthday) return 'N/A';
    const today = new Date();
    const birthDate = new Date(birthday);
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years === 0) {
      return `${months} mois`;
    } else if (months === 0) {
      return `${years} an${years > 1 ? 's' : ''}`;
    } else {
      return `${years} an${years > 1 ? 's' : ''} et ${months} mois`;
    }
  };

  if (!profile) {
    return (
      <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
        <p className="text-gray-500">Sélectionnez un chien</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm overflow-hidden mb-6">
      {/* MODE DEBUG - Affichage des stats en haut */}
      <div className="bg-yellow-50 border-b-2 border-yellow-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Stethoscope className="w-5 h-5 text-yellow-600" />
          <h3 className="font-bold text-yellow-800">🐞 MODE DEBUG - Ouvre la console (F12)</h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-3 border border-yellow-200">
            <p className="text-sm text-gray-600">Vaccinations</p>
            <p className="text-2xl font-bold text-gray-900">{healthStats.totalVaccinations}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-yellow-200">
            <p className="text-sm text-gray-600">Vermifuges</p>
            <p className="text-2xl font-bold text-gray-900">{healthStats.totalVermifuges}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-yellow-200">
            <p className="text-sm text-gray-600">Anti-puces</p>
            <p className="text-2xl font-bold text-gray-900">{healthStats.totalAntiPuces}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-yellow-200">
            <p className="text-sm text-gray-600">Pesées</p>
            <p className="text-2xl font-bold text-gray-900">{healthStats.totalPesees}</p>
          </div>
        </div>
      </div>

      {/* Header avec gradient */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Photo du chien */}
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
              {profile.image ? (
                <img 
                  src={profile.image} 
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl">🐕</span>
              )}
            </div>

            {/* Infos du chien */}
            <div>
              <h1 className="text-3xl font-bold mb-1">{profile.name}</h1>
              <p className="text-blue-100">
                {profile.breed || 'Race non spécifiée'} • {profile.gender === 'male' ? '♂ Mâle' : '♀ Femelle'}
              </p>
            </div>
          </div>

          {/* Bouton modifier */}
          <button
            onClick={onEdit}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
          >
            <Edit2 className="w-4 h-4" />
            <span>Modifier</span>
          </button>
        </div>
      </div>

      {/* Grille d'informations */}
      <div className="grid grid-cols-2 gap-6 p-6">
        {/* Colonne gauche - Informations */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-blue-500" />
            Informations
          </h3>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Race</p>
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                🐕 {profile.breed || 'Non spécifiée'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Sexe</p>
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                {profile.gender === 'male' ? '♂' : '♀'} {profile.gender === 'male' ? 'Mâle' : 'Femelle'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Âge</p>
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                🎂 {profile.age || calculateAge(profile.birthday)}
              </p>
            </div>

            {profile.weight && (
              <div>
                <p className="text-sm text-gray-500">Poids</p>
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  ⚖️ {profile.weight}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                {profile.sterilized === 'Stérilisé' ? '💚 Stérilisé' : '🔵 Non stérilisé'}
              </p>
            </div>
          </div>
        </div>

        {/* Colonne droite - Résumé santé */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <Syringe className="w-5 h-5 text-green-500" />
            Résumé santé
          </h3>

          <div className="space-y-3">
            {/* Vaccinations */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Syringe className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Vaccinations</p>
                  <p className="font-bold text-gray-900">
                    {healthStats.totalVaccinations} enregistré{healthStats.totalVaccinations > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Vermifuge */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Bug className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Vermifuge</p>
                  <p className="font-bold text-gray-900">
                    {healthStats.totalVermifuges} traitement{healthStats.totalVermifuges > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Anti-puces */}
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Bug className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Anti-puces</p>
                  <p className="font-bold text-gray-900">
                    {healthStats.totalAntiPuces} traitement{healthStats.totalAntiPuces > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Message de vérification */}
            {(healthStats.totalVaccinations > 0 || healthStats.totalVermifuges > 0 || healthStats.totalAntiPuces > 0) && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                <p className="text-sm text-orange-800 flex items-center gap-2">
                  ⚠️ Vérifier carnet
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
