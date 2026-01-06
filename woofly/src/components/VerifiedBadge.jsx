import React from 'react';
import { CheckCircle } from 'lucide-react';

/**
 * Badge de vérification pour les refuges et professionnels
 * @param {string} size - 'sm', 'md', 'lg'
 */
const VerifiedBadge = ({ size = 'md' }) => {
  const sizes = {
    sm: {
      container: 'px-2 py-0.5 text-[10px] gap-1',
      icon: 12
    },
    md: {
      container: 'px-2.5 py-1 text-xs gap-1.5',
      icon: 14
    },
    lg: {
      container: 'px-4 py-1.5 text-sm gap-2',
      icon: 16
    }
  };

  const currentSize = sizes[size];

  return (
    <div className={`
      inline-flex items-center font-bold rounded-full
      bg-green-50 text-green-700 border border-green-200
      shadow-sm
      ${currentSize.container}
    `}>
      <CheckCircle 
        size={currentSize.icon} 
        className="text-green-500 fill-green-500/10" 
      />
      <span className="uppercase tracking-wider">Vérifié</span>
    </div>
  );
};

export default VerifiedBadge;
