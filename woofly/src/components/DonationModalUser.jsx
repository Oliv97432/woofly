import React from 'react';
import { X, Heart, Check, Sparkles, Coffee } from 'lucide-react';

const DonationModalUser = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleDonate = () => {
    // À REMPLACER par ton vrai lien PayPal ou Buy Me a Coffee
    // Exemple PayPal : https://www.paypal.com/paypalme/tonpseudo
    // Exemple Buy Me a Coffee : https://www.buymeacoffee.com/tonpseudo
    window.open('https://www.buymeacoffee.com/TONPSEUDO', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header avec dégradé */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-20">
            <Sparkles size={120} />
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-smooth"
          >
            <X size={20} />
          </button>
          
          <div className="relative">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <Coffee size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-heading font-bold mb-2">
              Offrez-nous un café ☕
            </h2>
            <p className="text-amber-100 text-sm">
              Soutenez le développement de Woofly
            </p>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-foreground mb-4 leading-relaxed">
              Woofly vous aide à <strong>gérer la santé</strong> de votre chien, suivre ses <strong>vaccins</strong> et <strong>traitements</strong> gratuitement. 🐕
            </p>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mb-4 border border-amber-100">
              <p className="text-sm text-amber-900 font-medium mb-3">
                Votre café nous permet de :
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Check size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-amber-800">
                    Améliorer l'application
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-amber-800">
                    Ajouter de nouvelles fonctionnalités
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-amber-800">
                    Garder Woofly gratuit pour vous
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-amber-800">
                    Aider plus de propriétaires de chiens
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900">
                <strong>💡 100% volontaire !</strong><br/>
                Aucune obligation. Si Woofly vous est utile, un petit café nous motive énormément ! ☕
              </p>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDonate}
              className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 min-h-[44px]"
            >
              <Coffee size={20} />
              Offrir un café (3€)
            </button>

            <button
              onClick={onClose}
              className="w-full px-6 py-3 border-2 border-border rounded-xl font-medium hover:bg-muted transition-smooth min-h-[44px]"
            >
              Peut-être plus tard
            </button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Merci pour votre soutien ! Chaque café compte. 🙏
          </p>
        </div>
      </div>
    </div>
  );
};

export default DonationModalUser;
