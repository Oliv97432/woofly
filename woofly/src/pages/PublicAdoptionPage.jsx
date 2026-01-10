import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Calendar, Lock, ArrowRight, ArrowUp, ArrowLeft } from 'lucide-react';

const PublicAdoptionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dogs, setDogs] = useState([]);
  const [totalDogs, setTotalDogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    fetchPublicDogs();
  }, [user]);

  // Détecter le scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fonction scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Fonction retour intelligent
  const handleBack = () => {
    if (user) {
      // Si connecté, retourner à la page précédente
      navigate(-1);
    } else {
      // Si invité, retourner à la landing page
      navigate('/');
    }
  };

  const fetchPublicDogs = async () => {
    try {
      // Compter les chiens disponibles avec un refuge associé
      const { count } = await supabase
        .from('dogs')
        .select('*', { count: 'exact', head: true })
        .eq('adoption_status', 'available')
        .eq('is_published', true)
        .not('professional_account_id', 'is', null);

      setTotalDogs(count || 0);

      // Charger les chiens avec leur refuge
      const query = supabase
        .from('dogs')
        .select(`
          id,
          name,
          breed,
          gender,
          birth_date,
          photo_url,
          is_urgent,
          adoption_fee,
          professional_account_id,
          professional_accounts!dogs_professional_account_id_fkey(
            organization_name
          )
        `)
        .eq('adoption_status', 'available')
        .eq('is_published', true)
        .not('professional_account_id', 'is', null)
        .order('created_at', { ascending: false });

      // Limiter à 6 seulement si NON connecté
      if (!user) {
        query.limit(6);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Formater les données
      const formattedDogs = data?.map(dog => ({
        ...dog,
        organization_name: dog.professional_accounts?.organization_name
      })) || [];

      setDogs(formattedDogs);
    } catch (error) {
      console.error('Erreur chargement chiens publics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const years = new Date().getFullYear() - new Date(birthDate).getFullYear();
    return years;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des chiens à adopter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec bouton retour */}
      <header className="bg-card border-b border-border shadow-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="relative">
            {/* Bouton Retour - En haut à gauche */}
            <button
              onClick={handleBack}
              className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2 text-foreground hover:text-primary transition-smooth group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline font-medium">Retour</span>
            </button>

            {/* Titre centré */}
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">
                🏠 Chiens à adopter
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
                Donnez une seconde chance à un compagnon fidèle
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Compteur */}
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-primary mb-2">
            {totalDogs} chiens recherchent une famille
          </p>
          <p className="text-muted-foreground">
            Découvrez nos compagnons et trouvez celui qui vous correspond
          </p>
        </div>

        {/* Message si aucun chien */}
        {dogs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={48} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Aucun chien disponible pour le moment
            </h3>
            <p className="text-muted-foreground mb-8">
              Revenez bientôt pour découvrir de nouveaux compagnons à adopter
            </p>
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth"
            >
              Retour
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tous les chiens */}
            {dogs.map((dog) => (
              <div
                key={dog.id}
                onClick={() => navigate(`/adoption/${dog.id}`)}
                className="group bg-card rounded-2xl overflow-hidden shadow-soft border border-border hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1"
              >
                {/* Photo */}
                <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                  {dog.photo_url ? (
                    <img
                      src={dog.photo_url}
                      alt={dog.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl font-bold text-primary/30">
                        {dog.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Badge Urgent */}
                  {dog.is_urgent && (
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                        URGENT
                      </span>
                    </div>
                  )}

                  {/* Badge Disponible */}
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm">
                      Disponible
                    </span>
                  </div>

                  {/* Overlay hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>

                {/* Infos */}
                <div className="p-4">
                  <h3 className="font-heading font-bold text-xl text-foreground mb-1 group-hover:text-primary transition-colors">
                    {dog.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {dog.breed}
                  </p>

                  {/* Détails */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    {dog.gender && (
                      <span>{dog.gender === 'male' ? '♂️ Mâle' : '♀️ Femelle'}</span>
                    )}
                    {dog.birth_date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {calculateAge(dog.birth_date)} an(s)
                      </span>
                    )}
                  </div>

                  {/* Organisation */}
                  {dog.organization_name && (
                    <p className="text-xs text-muted-foreground mb-3">
                      📍 {dog.organization_name}
                    </p>
                  )}

                  {/* Frais d'adoption */}
                  {dog.adoption_fee && (
                    <div className="bg-primary/10 rounded-lg p-2 mb-3">
                      <p className="text-sm font-medium text-primary">
                        Participation aux frais : {dog.adoption_fee}€
                      </p>
                    </div>
                  )}

                  {/* Bouton CTA */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/adoption/${dog.id}`);
                    }}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth flex items-center justify-center gap-2"
                  >
                    <Heart size={16} />
                    <span>Voir le profil</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Carte Teaser visible UNIQUEMENT si NON connecté */}
            {!user && totalDogs > 6 && (
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border-2 border-dashed border-primary/30 p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-all duration-300">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <Lock size={40} className="text-primary" />
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  +{totalDogs - 6} autres chiens
                </h3>
                
                <p className="text-muted-foreground mb-6">
                  Découvrez les autres chiens à l'adoption
                </p>

                <button
                  onClick={() => navigate('/register')}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth flex items-center gap-2 shadow-lg"
                >
                  <span>Créer un compte gratuit</span>
                  <ArrowRight size={20} />
                </button>

                <p className="text-xs text-muted-foreground mt-4">
                  Inscription en 30 secondes • Gratuit
                </p>
              </div>
            )}
          </div>
        )}

        {/* Section CTA visible UNIQUEMENT si NON connecté */}
        {!user && dogs.length > 0 && (
          <div className="mt-16 bg-gradient-to-br from-primary/10 to-purple-100 rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Prêt à adopter ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Créez votre compte gratuitement et accédez à tous nos chiens disponibles.
              Trouvez votre compagnon idéal en quelques clics !
            </p>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 transition-smooth inline-flex items-center gap-3 shadow-lg"
            >
              <Heart size={24} />
              <span>Créer mon compte</span>
              <ArrowRight size={24} />
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2025 Woofly • Plateforme d'adoption responsable</p>
        </div>
      </footer>

      {/* Bouton Scroll To Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl hover:bg-primary/90 transition-all duration-300 flex items-center justify-center hover:scale-110 animate-in fade-in slide-in-from-bottom-4"
          aria-label="Retour en haut"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
};

export default PublicAdoptionPage;
