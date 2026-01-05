import React from 'react';
import { Crown, Building2 } from 'lucide-react';

/**
 * Badge pour afficher le statut utilisateur
 * @param {string} tier - 'premium' ou 'professional'
 * @param {string} size - 'sm', 'md', 'lg'
 * @param {string} variant - 'default', 'minimal'
 */
const SubscriptionBadge = ({ tier, size = 'md', variant = 'default' }) => {
  if (!tier || tier === 'free') return null;

  const sizes = {
    sm: {
      container: 'px-2 py-0.5 text-xs gap-1',
      icon: 12
    },
    md: {
      container: 'px-3 py-1 text-sm gap-1.5',
      icon: 14
    },
    lg: {
      container: 'px-4 py-1.5 text-base gap-2',
      icon: 16
    }
  };

  const currentSize = sizes[size];

  // Badge Professional (Refuges)
  if (tier === 'professional') {
    if (variant === 'minimal') {
      return (
        <div className="inline-flex items-center justify-center">
          <Building2 
            size={currentSize.icon} 
            className="text-blue-600" 
            aria-label="Refuge vérifié"
          />
        </div>
      );
    }

    return (
      <div className={`
        inline-flex items-center font-medium rounded-full
        bg-gradient-to-r from-blue-500 to-blue-600 
        text-white shadow-sm
        ${currentSize.container}
      `}>
        <Building2 
          size={currentSize.icon} 
          className="fill-current" 
        />
        <span>Refuge</span>
      </div>
    );
  }

  // Badge Premium (Particuliers payants)
  if (tier === 'premium') {
    if (variant === 'minimal') {
      return (
        <div className="inline-flex items-center justify-center">
          <Crown 
            size={currentSize.icon} 
            className="text-yellow-500 fill-yellow-500" 
            aria-label="Premium"
          />
        </div>
      );
    }

    return (
      <div className={`
        inline-flex items-center font-medium rounded-full
        bg-gradient-to-r from-yellow-400 to-yellow-500 
        text-yellow-900 shadow-sm
        ${currentSize.container}
      `}>
        <Crown 
          size={currentSize.icon} 
          className="fill-current" 
        />
        <span>Premium</span>
      </div>
    );
  }

  return null;
};

export default SubscriptionBadge;
