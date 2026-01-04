import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Search, Home, Star, MapPin, Users } from 'lucide-react';

const PlaceFAModal = ({ isOpen, onClose, dog, proAccount, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFA, setSelectedFA] = useState(null);

  useEffect(() => {
    if (isOpen && proAccount) {
      fetchAvailableFAs();
    }
  }, [isOpen, proAccount]);

  const fetchAvailableFAs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('professional_account_id', proAccount.id)
        .in('type', ['foster_family', 'both'])
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;

      // Filtrer les FA qui ont encore de la place
      const available = data.filter(fa => 
        fa.availability === 'available' && 
        fa.current_dogs_count < fa.max_dogs
      );

      setContacts(available);
    } catch (err) {
      console.error('Erreur chargement FA:', err);
      alert('Erreur lors du chargement des familles d\'accueil');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(fa =>
    fa.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fa.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePlace = async () => {
    if (!selectedFA) {
      alert('Veuillez sélectionner une famille d\'accueil');
      return;
    }

    if (!confirm(`Placer ${dog.name} chez ${selectedFA.full_name} ?`)) {
      return;
    }

    try {
      setLoading(true);

      // 0. VÉRIFIER si le chien n'est pas déjà placé
      const { data: existingPlacement } = await supabase
        .from('placement_history')
        .select('*')
        .eq('dog_id', dog.id)
        .eq('status', 'active')
        .eq('placement_type', 'foster')
        .single();

      if (existingPlacement) {
        alert(`❌ ${dog.name} est déjà placé en famille d'accueil !\n\nVeuillez d'abord le retirer de sa FA actuelle.`);
        return;
      }

      // 1. Créer l'historique de placement
      const { error: historyError } = await supabase
        .from('placement_history')
        .insert([{
          contact_id: selectedFA.id,
          dog_id: dog.id,
          professional_account_id: proAccount.id,
          placement_type: 'foster',
          start_date: new Date().toISOString(),
          status: 'active'
        }]);

      if (historyError) throw historyError;

      // 2. Mettre à jour le chien
      const { error: dogError } = await supabase
        .from('dogs')
        .update({ 
          foster_family_contact_id: selectedFA.id,
          foster_family_user_id: selectedFA.user_id || null
        })
        .eq('id', dog.id);

      if (dogError) throw dogError;

      // 3. Incrémenter le compteur de la FA
      const { error: contactError } = await supabase
        .from('contacts')
        .update({ 
          current_dogs_count: selectedFA.current_dogs_count + 1
        })
        .eq('id', selectedFA.id);

      if (contactError) throw contactError;

      alert(`✅ ${dog.name} a été placé chez ${selectedFA.full_name} !`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erreur placement:', err);
      alert('❌ Erreur lors du placement: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground">
              Placer {dog.name} en famille d'accueil
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {contacts.length} famille{contacts.length > 1 ? 's' : ''} d'accueil disponible{contacts.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-smooth min-h-[44px] min-w-[44px]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Recherche */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une famille d'accueil..."
              className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            />
          </div>

          {/* Liste des FA */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <Home size={48} className="text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground font-medium mb-2">Aucune famille d'accueil disponible</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm 
                  ? 'Essayez avec d\'autres mots-clés'
                  : 'Toutes les familles d\'accueil sont actuellement complètes'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredContacts.map((fa) => (
                <button
                  key={fa.id}
                  onClick={() => setSelectedFA(fa)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedFA?.id === fa.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 bg-background'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold flex-shrink-0">
                      {fa.full_name?.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{fa.full_name}</h3>
                        {fa.rating && (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={i < fa.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-2">
                        {fa.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {fa.city}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {fa.current_dogs_count}/{fa.max_dogs} chien{fa.max_dogs > 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Home size={14} />
                          {fa.total_dogs_fostered} total accueillis
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {fa.housing_type && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                            {fa.housing_type.replace('_', ' ')}
                          </span>
                        )}
                        {fa.has_garden && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Jardin
                          </span>
                        )}
                        {fa.preferred_size !== 'all' && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full capitalize">
                            Préfère {fa.preferred_size}
                          </span>
                        )}
                      </div>

                      {fa.preferences_notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          "{fa.preferences_notes}"
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-border">
            <button
              onClick={onClose}
              className="flex-1 py-3 border-2 border-border rounded-xl font-medium hover:bg-muted transition-smooth min-h-[44px]"
            >
              Annuler
            </button>
            <button
              onClick={handlePlace}
              disabled={!selectedFA || loading}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth min-h-[44px]"
            >
              {loading ? 'Placement en cours...' : 'Placer en famille d\'accueil'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceFAModal;
