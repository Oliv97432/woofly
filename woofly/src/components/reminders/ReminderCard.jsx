import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Trash2, Check, X, Clock, Syringe, Bug, Shield } from 'lucide-react';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const ReminderCard = ({ reminder, onDeleted, onCompleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);

  const getReminderIcon = (type) => {
    switch (type) {
      case 'vaccin':
        return <Syringe className="text-red-500" size={20} />;
      case 'vermifuge':
        return <Bug className="text-orange-500" size={20} />;
      case 'antiparasitaire':
        return <Shield className="text-green-500" size={20} />;
      default:
        return <Calendar className="text-blue-500" size={20} />;
    }
  };

  const getReminderLabel = (type) => {
    switch (type) {
      case 'vaccin':
        return 'Vaccin';
      case 'vermifuge':
        return 'Vermifuge';
      case 'antiparasitaire':
        return 'Antiparasitaire';
      default:
        return 'Rappel';
    }
  };

  const getUrgencyColor = (dueDate, isCompleted) => {
    if (isCompleted) return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    
    const date = new Date(dueDate);
    const daysUntil = differenceInDays(date, new Date());

    if (isPast(date) && !isToday(date)) return 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700';
    if (isToday(date)) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700';
    if (daysUntil <= 7) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700';
    return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  };

  const getDateText = (dueDate) => {
    const date = new Date(dueDate);
    
    if (isPast(date) && !isToday(date)) {
      const daysAgo = Math.abs(differenceInDays(date, new Date()));
      return `En retard de ${daysAgo} jour${daysAgo > 1 ? 's' : ''}`;
    }
    if (isToday(date)) return "Aujourd'hui";
    if (isTomorrow(date)) return 'Demain';
    
    const daysUntil = differenceInDays(date, new Date());
    if (daysUntil <= 7) return `Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`;
    
    return format(date, 'dd MMMM yyyy', { locale: fr });
  };

  const handleComplete = async () => {
    setCompleting(true);
    
    try {
      // Marquer comme complété localement
      onCompleted(reminder.id, !reminder.is_completed);
      
      // Note: Si tu veux persister l'état, il faudrait ajouter une colonne
      // "is_completed" dans les tables vaccinations et treatments
    } catch (error) {
      console.error('Erreur marquage rappel:', error);
    } finally {
      setCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ce rappel ?\n\nNote: Cela supprimera la ${reminder.source === 'vaccination' ? 'vaccination' : 'traitement'} associé(e).`)) {
      return;
    }

    setDeleting(true);

    try {
      // Supprimer depuis la table source
      const tableName = reminder.source === 'vaccination' ? 'vaccinations' : 'treatments';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', reminder.original_id);

      if (error) throw error;

      onDeleted(reminder.id);
    } catch (error) {
      console.error('Erreur suppression rappel:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`rounded-3xl p-4 sm:p-6 border-2 transition-all ${getUrgencyColor(reminder.due_date, reminder.is_completed)}`}>
      <div className="flex items-start justify-between gap-4">
        {/* Contenu principal */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {/* Icône du type */}
            <div className="flex-shrink-0">
              {getReminderIcon(reminder.reminder_type)}
            </div>

            {/* Infos chien */}
            <div className="flex items-center gap-2">
              {reminder.dogs?.profile_image_url && (
                <img
                  src={reminder.dogs.profile_image_url}
                  alt={reminder.dogs.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{reminder.dogs?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{getReminderLabel(reminder.reminder_type)}</p>
              </div>
            </div>
          </div>

          {/* Titre */}
          <h3 className={`text-lg font-bold mb-2 ${reminder.is_completed ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
            {reminder.title}
          </h3>

          {/* Description */}
          {reminder.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {reminder.description}
            </p>
          )}

          {/* Date */}
          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-gray-500 dark:text-gray-400" />
            <span className={`font-medium ${reminder.is_completed ? 'text-gray-500' : isPast(new Date(reminder.due_date)) && !isToday(new Date(reminder.due_date)) ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {getDateText(reminder.due_date)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleComplete}
            disabled={completing}
            className={`p-2 rounded-lg transition-smooth ${
              reminder.is_completed
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
            title={reminder.is_completed ? 'Marquer comme non complété' : 'Marquer comme complété'}
          >
            {reminder.is_completed ? <X size={20} /> : <Check size={20} />}
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-smooth"
            title="Supprimer"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderCard;
