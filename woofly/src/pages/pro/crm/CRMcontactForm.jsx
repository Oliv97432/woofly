import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/AppIcon';
import { ArrowLeft, Save, X } from 'lucide-react';

const CRMContactForm = () => {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [proAccount, setProAccount] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const [formData, setFormData] = useState({
    type: 'foster_family',
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    housing_type: 'house',
    has_garden: false,
    has_other_pets: false,
    other_pets_details: '',
    max_dogs: 1,
    preferred_size: 'all',
    preferred_age: 'all',
    preferences_notes: '',
    availability: 'available',
    availability_notes: '',
    rating: null,
    status: 'active'
  });

  useEffect(() => {
    if (user) {
      fetchProAccount();
    }
  }, [user]);

  useEffect(() => {
    if (contactId && proAccount) {
      setIsEdit(true);
      fetchContact();
    }
  }, [contactId, proAccount]);

  const fetchProAccount = async () => {
    try {
      const { data, error } = await supabase
        .from('professional_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProAccount(data);
    } catch (err) {
      console.error('Erreur:', err);
      navigate('/pro/register');
    }
  };

  const fetchContact = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error) throw error;
      setFormData(data);
    } catch (err) {
      console.error('Erreur chargement contact:', err);
      navigate('/pro/crm/contacts');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        professional_account_id: proAccount.id,
        max_dogs: parseInt(formData.max_dogs),
        rating: formData.rating ? parseInt(formData.rating) : null
      };

      if (isEdit) {
        const { error } = await supabase
          .from('contacts')
          .update(dataToSave)
          .eq('id', contactId);

        if (error) throw error;
        alert('✅ Contact mis à jour !');
        navigate(`/pro/crm/contacts/${contactId}`);
      } else {
        const { data, error } = await supabase
          .from('contacts')
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;
        alert('✅ Contact créé !');
        navigate(`/pro/crm/contacts/${data.id}`);
      }
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      alert('❌ Erreur lors de la sauvegarde: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(isEdit ? `/pro/crm/contacts/${contactId}` : '/pro/crm/contacts')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground min-h-[44px]"
          >
            <X size={20} />
            <span className="font-medium hidden sm:inline">Annuler</span>
          </button>
          <h1 className="text-lg sm:text-xl font-heading font-bold text-foreground truncate px-2">
            {isEdit ? 'Modifier le contact' : 'Nouveau contact'}
          </h1>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-soft space-y-6">
          
          {/* Type de contact */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Type de contact *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            >
              <option value="foster_family">Famille d'accueil</option>
              <option value="adopter">Adoptant</option>
              <option value="both">Les deux</option>
            </select>
          </div>

          {/* Informations personnelles */}
          <div className="space-y-4">
            <h3 className="text-lg font-heading font-semibold text-foreground border-b pb-2">
              Informations personnelles
            </h3>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Nom complet *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Adresse
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Code postal
                </label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                />
              </div>
            </div>
          </div>

          {/* Informations logement (pour FA) */}
          {(formData.type === 'foster_family' || formData.type === 'both') && (
            <div className="space-y-4">
              <h3 className="text-lg font-heading font-semibold text-foreground border-b pb-2">
                Informations logement
              </h3>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Type de logement
                </label>
                <select
                  name="housing_type"
                  value={formData.housing_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                >
                  <option value="apartment">Appartement</option>
                  <option value="house">Maison</option>
                  <option value="house_with_garden">Maison avec jardin</option>
                  <option value="farm">Ferme</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    name="has_garden"
                    checked={formData.has_garden}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-muted-foreground">Dispose d'un jardin</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    name="has_other_pets"
                    checked={formData.has_other_pets}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-muted-foreground">A d'autres animaux</span>
                </label>
              </div>

              {formData.has_other_pets && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Détails sur les autres animaux
                  </label>
                  <textarea
                    name="other_pets_details"
                    value={formData.other_pets_details}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Ex: 2 chats, 1 chien..."
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background resize-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Capacité d'accueil (nombre max de chiens)
                </label>
                <input
                  type="number"
                  name="max_dogs"
                  value={formData.max_dogs}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Taille préférée
                  </label>
                  <select
                    name="preferred_size"
                    value={formData.preferred_size}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                  >
                    <option value="all">Toutes tailles</option>
                    <option value="small">Petits</option>
                    <option value="medium">Moyens</option>
                    <option value="large">Grands</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Âge préféré
                  </label>
                  <select
                    name="preferred_age"
                    value={formData.preferred_age}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                  >
                    <option value="all">Tous âges</option>
                    <option value="puppy">Chiots</option>
                    <option value="adult">Adultes</option>
                    <option value="senior">Seniors</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Notes sur les préférences
                </label>
                <textarea
                  name="preferences_notes"
                  value={formData.preferences_notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Ex: Préfère les chiens calmes..."
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Disponibilité
                </label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                >
                  <option value="available">Disponible</option>
                  <option value="full">Complet</option>
                  <option value="temporarily_unavailable">Temporairement indisponible</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>

              {formData.availability !== 'available' && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Notes sur la disponibilité
                  </label>
                  <textarea
                    name="availability_notes"
                    value={formData.availability_notes}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Ex: En vacances jusqu'au..."
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background resize-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Évaluation */}
          <div className="space-y-4">
            <h3 className="text-lg font-heading font-semibold text-foreground border-b pb-2">
              Évaluation
            </h3>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Note (1-5 étoiles)
              </label>
              <select
                name="rating"
                value={formData.rating || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              >
                <option value="">Pas de note</option>
                <option value="1">⭐ 1 étoile</option>
                <option value="2">⭐⭐ 2 étoiles</option>
                <option value="3">⭐⭐⭐ 3 étoiles</option>
                <option value="4">⭐⭐⭐⭐ 4 étoiles</option>
                <option value="5">⭐⭐⭐⭐⭐ 5 étoiles</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Statut
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="blocked">Bloqué</option>
              </select>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => navigate(isEdit ? `/pro/crm/contacts/${contactId}` : '/pro/crm/contacts')}
              className="flex-1 py-3 border-2 border-border rounded-xl font-medium hover:bg-muted min-h-[44px]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Save size={20} />
              {loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer le contact'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CRMContactForm;
