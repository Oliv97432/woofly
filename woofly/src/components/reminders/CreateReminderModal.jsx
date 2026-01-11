import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Calendar, Syringe, Bug, Shield, Cake, AlertCircle } from 'lucide-react';

const CreateReminderModal = ({ dogs, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    dog_id: dogs[0]?.id || '',
    reminder_type: 'vaccin',
    title: '',
    description: '',
    due_date: ''
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const reminderTypes = [
    { value: 'vaccin', label: 'Vaccin', icon: Syringe, color: 'red' },
    { value: 'vermifuge', label: 'Vermifuge', icon: Bug, color: 'orange' },
    { value: 'antiparasitaire', label: 'Antiparasitaire', icon: Shield, color: 'green' },
    { value: 'anniversaire', label: 'Anniversaire', icon: Cake, color: 'pink' },
    { value: 'autre', label: 'Autre', icon: Calendar, color: 'blue' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.dog_id) {
      setError('Veuillez sélectionner un chien');
      return;
    }

    if (!formData.title.trim()) {
      setError('Veuillez entrer un titre');
      return;
    }

    if (!formData.due_date) {
      setError('Veuillez sélectionner une date');
      return;
    }

    setCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error: insertError } = await supabase
        .from('reminders')
        .insert([
          {
            dog_id: formData.dog_id,
            reminder_type: formData.reminder_type,
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            due_date: formData.due_date,
            is_completed: false
          }
        ]);

      if (insertError) throw insertError;

      onCreated();
    } catch (err) {
      console.error('Erreur création rappel:', err);
      setError('Erreur lors de la création du rappel');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            🔔 Nouveau rappel
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-smooth"
          >
            <X size={24} />
          </button>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection du chien */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pour quel chien ? *
            </label>
            <select
              value={formData.dog_id}
              onChange={(e) => setFormData({ ...formData, dog_id: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              {dogs.map((dog) => (
                <option key={dog.id} value={dog.id}>
                  {dog.name} - {dog.breed}
                </option>
              ))}
            </select>
          </div>

          {/* Type de rappel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de rappel *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {reminderTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.reminder_type === type.value;
                
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, reminder_type: type.value })}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      isSelected
                        ? `border-${type.color}-500 bg-${type.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={24} className={isSelected ? `text-${type.color}-600` : 'text-gray-400'} />
                    <span className={`text-sm font-medium ${isSelected ? `text-${type.color}-900` : 'text-gray-600'}`}>
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Rappel vaccin rage"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optionnel)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Détails supplémentaires..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date d'échéance *
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-smooth"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {creating ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReminderModal;
