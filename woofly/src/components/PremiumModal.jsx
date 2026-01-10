import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, X, Sparkles, Dog, Camera, ChefHat } from 'lucide-react';

const PremiumModal = ({ isOpen, onClose, reason = 'dogs' }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const content = {
    dogs: {
      icon: <Dog size={48} className="text-primary" />,
      title: 'Limite atteinte : 1 chien',
      description: 'Vous avez atteint la limite du compte gratuit. Passez Premium pour ajouter des chiens illimités !',
      features: [
        'Chiens illimités ♾️',
        'Photos illimitées 📸',
        'Badge Premium 👑'
      ]
    },
    photos: {
      icon: <Camera size={48} className="text-primary" />,
      title: 'Limite atteinte : 10 photos',
      description: 'Vous avez atteint la limite de 10 photos. Passez Premium pour un album photo illimité !',
      features: [
        'Photos illimitées 📸',
        'Chiens illimités ♾️',
        'Badge Premium 👑'
      ]
    },
    recipes: {
      icon: <ChefHat size={48} className="text-primary" />,
      title: 'Recettes Premium',
      description: 'Créez des recettes personnalisées et équilibrées pour votre chien avec notre générateur intelligent.',
      features: [
        'Recettes sur mesure 🍽️',
        'Calcul nutritionnel automatique 📊',
        'Ingrédients 100% sécurisés ✅',
        'Historique illimité 📚',
        'Export PDF 📄'
      ]
    }
  };

  const currentContent = content[reason] || content.dogs;

  const handleUpgrade = () => {
    onClose();
    navigate('/premium');
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-card rounded-3xl max-w-md w-full shadow-2xl animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-smooth"
          >
            <X size={20} className="text-muted-foreground" />
          </button>

          {/* Content */}
          <div className="p-8 text-center">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
              {currentContent.icon}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-foreground mb-3">
              {currentContent.title}
            </h2>

            {/* Description */}
            <p className="text-muted-foreground mb-6">
              {currentContent.description}
            </p>

            {/* Features */}
            <div className="bg-gradient-to-br from-primary/5 to-purple-50 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Crown size={24} className="text-primary" />
                <span className="font-bold text-lg text-foreground">Woofly Premium</span>
              </div>

              <div className="space-y-3">
                {currentContent.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-left">
                    <Sparkles size={16} className="text-primary flex-shrink-0" />
                    <span className="text-foreground font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-3xl font-bold text-primary mb-1">
                  3,99€
                  <span className="text-base font-normal text-muted-foreground">/mois</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  ou 39€/an (économisez 9€)
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleUpgrade}
                className="w-full px-6 py-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-smooth flex items-center justify-center gap-2"
              >
                <Crown size={20} />
                <span>Passer Premium</span>
              </button>

              <button
                onClick={onClose}
                className="w-full px-6 py-2 text-muted-foreground hover:text-foreground transition-smooth"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default PremiumModal;
