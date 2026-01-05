import React from "react";
import Icon from "./AppIcon";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    error.__ErrorBoundary = true;
    window.__COMPONENT_ERROR__?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state?.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md w-full">
            {/* Illustration */}
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-orange-100 rounded-full animate-pulse"></div>
                <div className="absolute inset-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                  <svg 
                    className="w-12 h-12 text-white" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5"
                  >
                    <path 
                      d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Message d'erreur */}
            <div className="space-y-3 mb-8">
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Oups ! 😅
              </h1>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-muted-foreground text-sm">
                  Une erreur inattendue s'est produite. Ne vous inquiétez pas, notre équipe technique a été notifiée.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-smooth flex items-center justify-center gap-2 min-h-[44px] active:scale-[0.98]"
              >
                <Icon name="RefreshCw" size={18} />
                Réessayer
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full border-2 border-border bg-card py-3 rounded-xl font-medium hover:bg-muted transition-smooth flex items-center justify-center gap-2 min-h-[44px] active:scale-[0.98]"
              >
                <Icon name="Home" size={18} />
                Retour à l'accueil
              </button>

              {/* Assistance */}
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  Besoin d'aide ?
                </p>
                <div className="flex justify-center gap-4">
                  <a 
                    href="mailto:support@doogybook.com"
                    className="text-xs text-primary hover:underline flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center"
                  >
                    <Icon name="Mail" size={14} />
                    Support
                  </a>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-xs text-primary hover:underline flex items-center gap-1 min-h-[44px] min-w-[44px] justify-center"
                  >
                    <Icon name="RefreshCcw" size={14} />
                    Recharger
                  </button>
                </div>
              </div>
            </div>

            {/* Information technique */}
            <div className="mt-8">
              <details className="text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground mb-2">
                  Information technique
                </summary>
                <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground overflow-auto">
                  <p>Erreur capturée par ErrorBoundary</p>
                  <p className="mt-1 text-xs">Essayez de :</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Rafraîchir la page</li>
                    <li>Vérifier votre connexion internet</li>
                    <li>Effacer le cache du navigateur</li>
                    <li>Contacter le support si le problème persiste</li>
                  </ul>
                </div>
              </details>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Doogybook v1.0.0
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props?.children;
  }
}

export default ErrorBoundary;
