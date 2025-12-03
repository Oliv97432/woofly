import React from 'react';

const AdSensePlaceholder = () => {
  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-soft">
      <div className="text-center space-y-4">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full">
          <span className="text-3xl">📢</span>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
            Espace publicitaire
          </h3>
          <p className="text-sm text-muted-foreground">
            En attente de validation Google AdSense
          </p>
        </div>

        {/* Placeholder dimensions */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border-2 border-dashed border-gray-300">
            <div className="space-y-2 text-center">
              <div className="text-xs text-gray-400 font-mono">
                Format: 300×250
              </div>
              <div className="text-xs text-gray-400">
                Rectangle moyen
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground italic">
          Cet espace sera remplacé par une publicité Google AdSense une fois votre compte approuvé.
        </p>
      </div>
    </div>
  );
};

export default AdSensePlaceholder;
