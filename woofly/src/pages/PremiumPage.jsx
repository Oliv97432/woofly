import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Crown, Check, X, Camera, Dog, Heart, 
  Sparkles, ArrowRight, Star
} from 'lucide-react';

const PremiumPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubscribe = (plan) => {
    if (!user) {
      navigate('/login', { 
        state: { 
          returnTo: '/premium',
          message: 'Connectez-vous pour passer Premium' 
        } 
      });
      return;
    }

    // TODO: Intégrer système de paiement (Stripe, PayPal, etc.)
    alert(`Redirection vers paiement : ${plan}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
          <Sparkles size={20} className="text-primary" />
          <span className="text-sm font-medium text-primary">Passez Premium</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-heading font-bold text-foreground mb-4">
          Profitez pleinement de Woofly
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
          Chiens illimités, photos illimitées et bien plus encore
        </p>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Gratuit */}
          <div className="bg-card rounded-3xl p-8 border-2 border-border shadow-soft">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Gratuit
              </h3>
              <div className="flex items-baseline justify-center gap-2 mb-4">
                <span className="text-5xl font-bold text-foreground">0€</span>
                <span className="text-muted-foreground">/mois</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Pour découvrir Woofly
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">1 chien</p>
                  <p className="text-sm text-muted-foreground">Gérez le profil d'un seul chien</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">10 photos maximum</p>
                  <p className="text-sm text-muted-foreground">Album photo limité</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Communauté</p>
                  <p className="text-sm text-muted-foreground">Accès aux forums et posts</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Conseils quotidiens</p>
                  <p className="text-sm text-muted-foreground">Tips pour votre chien</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X size={14} className="text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-muted-foreground line-through">Chiens illimités</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X size={14} className="text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-muted-foreground line-through">Photos illimitées</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X size={14} className="text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-muted-foreground line-through">Badge Premium</p>
                </div>
              </div>
            </div>

            {user ? (
              // Si connecté : afficher badge "Plan actuel"
              <div className="w-full px-6 py-3 bg-primary/10 border-2 border-primary/20 text-primary rounded-xl font-medium flex items-center justify-center gap-2">
                <Check size={20} />
                <span>Votre plan actuel</span>
              </div>
            ) : (
              // Si non connecté : afficher bouton inscription
              <button
                onClick={() => navigate('/register')}
                className="w-full px-6 py-3 bg-card border-2 border-border text-foreground rounded-xl font-medium hover:bg-muted transition-smooth"
              >
                Créer un compte gratuit
              </button>
            )}
          </div>

          {/* Premium */}
          <div className="bg-gradient-to-br from-primary to-purple-600 rounded-3xl p-8 shadow-xl relative overflow-hidden">
            {/* Badge Popular */}
            <div className="absolute top-6 right-6">
              <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white flex items-center gap-1">
                <Star size={12} fill="white" />
                Populaire
              </div>
            </div>

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-2">
                <Crown size={28} className="text-yellow-300" />
                <h3 className="text-2xl font-bold text-white">
                  Premium
                </h3>
              </div>
              
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-5xl font-bold text-white">3,99€</span>
                <span className="text-white/80">/mois</span>
              </div>
              
              <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                <span className="text-sm text-white font-medium">
                  ou 39€/an (économisez 9€ !)
                </span>
              </div>
              
              <p className="text-sm text-white/90">
                Pour les propriétaires passionnés
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white flex items-center gap-2">
                    <Dog size={16} />
                    Chiens illimités ♾️
                  </p>
                  <p className="text-sm text-white/80">Gérez autant de chiens que vous voulez</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white flex items-center gap-2">
                    <Camera size={16} />
                    Photos illimitées 📸
                  </p>
                  <p className="text-sm text-white/80">Albums photo sans limite</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white flex items-center gap-2">
                    <Crown size={16} />
                    Badge Premium 👑
                  </p>
                  <p className="text-sm text-white/80">Visible sur votre profil et vos posts</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white flex items-center gap-2">
                    <Heart size={16} />
                    Communauté
                  </p>
                  <p className="text-sm text-white/80">Accès complet aux forums</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white flex items-center gap-2">
                    <Sparkles size={16} />
                    Conseils quotidiens
                  </p>
                  <p className="text-sm text-white/80">Tips personnalisés</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={14} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">Fonctionnalités futures</p>
                  <p className="text-sm text-white/80">Accès prioritaire aux nouveautés</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSubscribe('monthly')}
              className="w-full px-6 py-4 bg-white text-primary rounded-xl font-bold text-lg hover:bg-gray-50 transition-smooth flex items-center justify-center gap-2 mb-3 shadow-lg"
            >
              <span>Passer Premium</span>
              <ArrowRight size={20} />
            </button>

            <button
              onClick={() => handleSubscribe('yearly')}
              className="w-full px-6 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white rounded-xl font-medium hover:bg-white/20 transition-smooth"
            >
              39€/an (économisez 9€)
            </button>
          </div>
        </div>

        {/* FAQ / Infos */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8">
            Questions fréquentes
          </h2>

          <div className="space-y-6 text-left">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold text-foreground mb-2">
                Puis-je annuler à tout moment ?
              </h3>
              <p className="text-muted-foreground">
                Oui ! Vous pouvez annuler votre abonnement Premium à tout moment depuis vos paramètres. Vous conserverez l'accès Premium jusqu'à la fin de votre période payée.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold text-foreground mb-2">
                Que se passe-t-il si j'annule ?
              </h3>
              <p className="text-muted-foreground">
                Vos chiens et photos restent sauvegardés. Si vous dépassez les limites du compte gratuit (1 chien, 10 photos), vous devrez choisir quel chien garder et quelles photos conserver.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold text-foreground mb-2">
                L'offre annuelle est-elle avantageuse ?
              </h3>
              <p className="text-muted-foreground">
                Oui ! Avec l'offre annuelle à 39€, vous économisez 9€ par rapport au paiement mensuel (48€/an). C'est l'équivalent de 2 mois offerts !
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-semibold text-foreground mb-2">
                Quels moyens de paiement acceptez-vous ?
              </h3>
              <p className="text-muted-foreground">
                Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) via notre partenaire de paiement sécurisé Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;
