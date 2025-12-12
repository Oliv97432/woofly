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
  const [showVetModal, setShowVetModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [tempVet, setTempVet] = useState({ name: '', address: '', phone: '' });

  useEffect(() => {
    if (user?.id) {
      loadEmergencyContacts();
    }
  }, [user?.id]);

  const loadEmergencyContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading emergency contacts:', error);
      }

      if (data) {
        setVeterinarianInfo({
          name: data.veterinarian_name || '',
          address: data.veterinarian_address || '',
          phone: data.veterinarian_phone || ''
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

  return (
    <div className="mb-8">
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
    </div>
  );
};

export default EmergencyBanner;
