import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const EmergencyBanner = ({ onEmergencyCall }) => {
  const { user } = useAuth();
  const [veterinarianInfo, setVeterinarianInfo] = useState({
    name: '',
    address: '',
    phone: ''
  });
  const [emergencyNumbers, setEmergencyNumbers] = useState({
    sos_animals: '01 43 11 80 00', // Numéro par défaut (Paris)
    poison_center: '04 78 87 10 40'  // Numéro par défaut (Lyon)
  });
  const [showVetModal, setShowVetModal] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showPoisonModal, setShowPoisonModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Formulaires temporaires
  const [tempVet, setTempVet] = useState({ name: '', address: '', phone: '' });
  const [tempSOS, setTempSOS] = useState('');
  const [tempPoison, setTempPoison] = useState('');

  // Charger les données depuis Supabase
  useEffect(() => {
    if (user?.id) {
      loadEmergencyContacts();
    }
  }, [user?.id]);

  const loadEmergencyContacts = async () => {
    try {
      setLoading(true);

      // Charger les contacts d'urgence de l'utilisateur
      const { data, error } = await supabase
        .from('user_emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignorer l'erreur "pas de résultat"
        console.error('Error loading emergency contacts:', error);
      }

      if (data) {
        setVeterinarianInfo({
          name: data.veterinarian_name || '',
          address: data.veterinarian_address || '',
          phone: data.veterinarian_phone || ''
        });
        setEmergencyNumbers({
          sos_animals: data.sos_animals_number || '01 43 11 80 00',
          poison_center: data.poison_center_number || '04 78 87 10 40'
        });
      }
    } catch (error) {
      console.error('Error in loadEmergencyContacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEmergencyContacts = async (updates) => {
    try {
      const { error } = await supabase
        .from('user_emergency_contacts')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      
      await loadEmergencyContacts();
      return true;
    } catch (error) {
      console.error('Error saving emergency contacts:', error);
      alert('❌ Erreur lors de la sauvegarde');
      return false;
    }
  };

  const handleSaveVeterinarian = async () => {
    const success = await saveEmergencyContacts({
      veterinarian_name: tempVet.name,
      veterinarian_address: tempVet.address,
      veterinarian_phone: tempVet.phone
    });
    if (success) {
      setShowVetModal(false);
      alert('✅ Vétérinaire enregistré !');
    }
  };

  const handleSaveSOS = async () => {
    const success = await saveEmergencyContacts({
      sos_animals_number: tempSOS
    });
    if (success) {
      setShowSOSModal(false);
      alert('✅ Numéro SOS enregistré !');
    }
  };

  const handleSavePoison = async () => {
    const success = await saveEmergencyContacts({
      poison_center_number: tempPoison
    });
    if (success) {
      setShowPoisonModal(false);
      alert('✅ Numéro Centre Anti-Poison enregistré !');
    }
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Mon Vétérinaire */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Icon name="Stethoscope" size={24} className="text-blue-500" />
            Mon Vétérinaire
          </h2>
          <Button
            variant="outline"
            size="sm"
            iconName="Edit"
            iconPosition="left"
            onClick={() => {
              setTempVet(veterinarianInfo);
              setShowVetModal(true);
            }}
          >
            Modifier
          </Button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Gardez les coordonnées de votre vétérinaire à portée de main
        </p>

        {veterinarianInfo.name ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Icon name="Stethoscope" size={20} className="text-blue-500" />
              <span className="font-semibold text-gray-900">{veterinarianInfo.name}</span>
            </div>
            {veterinarianInfo.address && (
              <div className="flex items-center gap-3">
                <Icon name="MapPin" size={20} className="text-gray-400" />
                <span className="text-gray-700">{veterinarianInfo.address}</span>
              </div>
            )}
            {veterinarianInfo.phone && (
              <div className="flex items-center gap-3">
                <Icon name="Phone" size={20} className="text-green-500" />
                <span className="text-gray-900 font-semibold">{veterinarianInfo.phone}</span>
              </div>
            )}
            {veterinarianInfo.phone && (
              <Button
                variant="default"
                size="lg"
                iconName="Phone"
                iconPosition="left"
                onClick={() => window.location.href = `tel:${veterinarianInfo.phone}`}
                className="w-full mt-4"
              >
                Appeler mon vétérinaire
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-4">Aucun vétérinaire enregistré</p>
            <Button
              variant="default"
              iconName="Plus"
              iconPosition="left"
              onClick={() => {
                setTempVet({ name: '', address: '', phone: '' });
                setShowVetModal(true);
              }}
            >
              Ajouter mon vétérinaire
            </Button>
          </div>
        )}
      </div>

      {/* SOS Animaux en Danger */}
      <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6">
        <h2 className="text-xl font-bold text-red-900 mb-2">
          SOS Animaux en Danger
        </h2>
        <p className="text-sm text-red-700 mb-4">
          Contacts d'urgence disponibles 24h/24
        </p>

        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-start gap-3">
            <Icon name="AlertCircle" size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900 mb-1">Urgence vitale :</p>
              <p className="text-sm text-red-800">
                Contactez immédiatement un vétérinaire. Ne perdez pas de temps.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SOS Animaux */}
          <div className="bg-white rounded-2xl border-2 border-red-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <Icon name="Phone" size={24} color="white" />
              </div>
              <button
                onClick={() => {
                  setTempSOS(emergencyNumbers.sos_animals);
                  setShowSOSModal(true);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
              >
                ✏️ Modifier
              </button>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">SOS Animaux en Danger</h3>
            <p className="text-sm text-gray-600 mb-3">Urgences vitales 24h/24</p>
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Phone" size={18} className="text-green-600" />
              <span className="font-bold text-lg text-gray-900">{emergencyNumbers.sos_animals}</span>
            </div>
            <Button
              variant="destructive"
              size="lg"
              iconName="Phone"
              iconPosition="left"
              onClick={() => window.location.href = `tel:${emergencyNumbers.sos_animals}`}
              className="w-full"
            >
              Appeler maintenant
            </Button>
          </div>

          {/* Centre Anti-Poison */}
          <div className="bg-white rounded-2xl border-2 border-red-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <Icon name="AlertCircle" size={24} color="white" />
              </div>
              <button
                onClick={() => {
                  setTempPoison(emergencyNumbers.poison_center);
                  setShowPoisonModal(true);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
              >
                ✏️ Modifier
              </button>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Centre Anti-Poison Animal</h3>
            <p className="text-sm text-gray-600 mb-3">Intoxications 24h/24</p>
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Phone" size={18} className="text-green-600" />
              <span className="font-bold text-lg text-gray-900">{emergencyNumbers.poison_center}</span>
            </div>
            <Button
              variant="destructive"
              size="lg"
              iconName="Phone"
              iconPosition="left"
              onClick={() => window.location.href = `tel:${emergencyNumbers.poison_center}`}
              className="w-full"
            >
              Appeler maintenant
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Vétérinaire */}
      {showVetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Mon Vétérinaire</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom du vétérinaire *
                </label>
                <input
                  type="text"
                  value={tempVet.name}
                  onChange={(e) => setTempVet({ ...tempVet, name: e.target.value })}
                  placeholder="Dr. Martin"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  value={tempVet.address}
                  onChange={(e) => setTempVet({ ...tempVet, address: e.target.value })}
                  placeholder="15 Rue de la Santé, 75014 Paris"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={tempVet.phone}
                  onChange={(e) => setTempVet({ ...tempVet, phone: e.target.value })}
                  placeholder="01 42 56 78 90"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowVetModal(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="default"
                onClick={handleSaveVeterinarian}
                disabled={!tempVet.name || !tempVet.phone}
                className="flex-1"
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal SOS */}
      {showSOSModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Numéro SOS Animaux en Danger
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Le numéro varie selon votre région. Renseignez le numéro de votre département.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                value={tempSOS}
                onChange={(e) => setTempSOS(e.target.value)}
                placeholder="01 43 11 80 00"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSOSModal(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="default"
                onClick={handleSaveSOS}
                disabled={!tempSOS}
                className="flex-1"
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Centre Anti-Poison */}
      {showPoisonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Numéro Centre Anti-Poison Animal
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Le numéro varie selon votre région. Renseignez le numéro de votre centre local.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                value={tempPoison}
                onChange={(e) => setTempPoison(e.target.value)}
                placeholder="04 78 87 10 40"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPoisonModal(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="default"
                onClick={handleSavePoison}
                disabled={!tempPoison}
                className="flex-1"
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyBanner;
