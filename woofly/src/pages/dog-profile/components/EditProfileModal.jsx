import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const EditProfileModal = ({ isOpen, onClose, onSave, profile }) => {
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    gender: '',
    weight: '',
    sterilized: '',
    microchip_number: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        breed: profile.breed || '',
        gender: profile.gender || '',
        weight: profile.weight || '',
        sterilized: profile.sterilized || '',
        microchip_number: profile.microchip_number || '',
        notes: profile.notes || ''
      });
    }
  }, [profile]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.breed.trim()) {
      newErrors.breed = 'La race est requise';
    }

    if (!formData.gender) {
      newErrors.gender = 'Le sexe est requis';
    }

    if (formData.weight && (isNaN(parseFloat(formData.weight)) || parseFloat(formData.weight) <= 0)) {
      newErrors.weight = 'Le poids doit être un nombre positif';
    }

    // Validation numéro de puce (15 chiffres) ou tatouage (lettres + chiffres)
    if (formData.microchip_number) {
      const cleaned = formData.microchip_number.trim();
      // Puce électronique : 15 chiffres
      const isMicrochip = /^\d{15}$/.test(cleaned);
      // Tatouage : 3 lettres + 3-4 chiffres (ex: ABC123 ou ABC1234)
      const isTattoo = /^[A-Z]{3}\d{3,4}$/i.test(cleaned);
      
      if (!isMicrochip && !isTattoo) {
        newErrors.microchip_number = 'Format invalide. Puce: 15 chiffres. Tatouage: 3 lettres + 3-4 chiffres (ex: ABC123)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        ...profile,
        ...formData
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-2xl font-heading font-semibold text-foreground">
            Modifier le profil
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-smooth"
          >
            <Icon name="X" size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Nom du chien <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Rex, Bella, Max..."
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Race */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Race <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Labrador, Berger Allemand, Croisé..."
            />
            {errors.breed && (
              <p className="text-red-500 text-sm mt-1">{errors.breed}</p>
            )}
          </div>

          {/* Grid 2 colonnes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sexe */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sexe <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Sélectionner</option>
                <option value="male">Mâle</option>
                <option value="female">Femelle</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
              )}
            </div>

            {/* Poids */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Poids (kg)
              </label>
              <input
                type="number"
                step="0.1"
                name="weight"
                value={formData.weight.toString().replace(' kg', '')}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="15.5"
              />
              {errors.weight && (
                <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
              )}
            </div>
          </div>

          {/* Stérilisation */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Statut
            </label>
            <select
              name="sterilized"
              value={formData.sterilized}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="Non stérilisé">Non stérilisé</option>
              <option value="Stérilisé">Stérilisé</option>
            </select>
          </div>

          {/* ✅ NOUVEAU : Numéro de puce ou tatouage */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Numéro de puce électronique ou tatouage
            </label>
            <input
              type="text"
              name="microchip_number"
              value={formData.microchip_number}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
              placeholder="250268500123456 ou ABC1234"
              maxLength="15"
            />
            {errors.microchip_number && (
              <p className="text-red-500 text-sm mt-1">{errors.microchip_number}</p>
            )}
            <p className="text-muted-foreground text-xs mt-1">
              <Icon name="Info" size={12} className="inline mr-1" />
              Puce: 15 chiffres • Tatouage: 3 lettres + 3-4 chiffres (ex: ABC123)
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Informations supplémentaires, particularités..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="default"
              className="flex-1"
            >
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
