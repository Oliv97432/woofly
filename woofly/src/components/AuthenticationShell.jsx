import React from 'react';

const AuthenticationShell = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      {/* Logo et marque */}
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Doogybook" 
              className="w-12 h-12"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/%3E%3C/svg%3E";
              }}
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Doogybook</h1>
        </div>

        {/* Contenu principal */}
        <div className="bg-card rounded-xl border border-border shadow-soft p-6 w-full">
          {title && (
            <div className="text-center mb-4">
              <h2 className="text-xl font-heading font-semibold text-foreground mb-1">
                {title}
              </h2>
              {subtitle && (
                <p className="text-muted-foreground text-sm">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Enfants (formulaire, etc.) */}
          <div className="space-y-4">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 Doogybook. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationShell;
