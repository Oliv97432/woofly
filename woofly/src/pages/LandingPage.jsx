import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Heart, Stethoscope, Users, Calendar, ArrowRight,
  Check, Sparkles, Shield, MapPin
} from 'lucide-react';
import Footer from '../components/Footer';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featuredDogs, setFeaturedDogs] = useState([]);

  useEffect(() => {
    // Si l'utilisateur est déjà connecté, rediriger vers son dashboard
    if (user) {
      navigate('/dashboard');
    } else {
      fetchFeaturedDogs();
    }
  }, [user, navigate]);

  const fetchFeaturedDogs = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('is_for_adoption', true)
        .eq('adoption_status', 'available')
        .limit(3);

      if (error) throw error;
      setFeaturedDogs(data || []);
    } catch (error) {
      console.error('Erreur chargement chiens:', error);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Âge inconnu';
    const age = Math.floor((new Date() - new Date(birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 1) return 'Moins d\'1 an';
    return `${age} an${age > 1 ? 's' : ''}`;
  };

  return (
    <div className="min-h-screen bg-background">
      
      {/* Header Simple */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">🐕</span>
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-gray-900 truncate">
              Doogybook
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/adoption')}
              className="px-3 sm:px-4 py-2 text-gray-700 hover:text-gray-900 font-medium text-sm sm:text-base min-h-[44px]"
            >
              <span className="hidden xs:inline">Adoption</span>
              <Heart size={18} className="xs:hidden sm:size-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-3 sm:px-6 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-smooth text-sm sm:text-base min-h-[44px] whitespace-nowrap"
            >
              Se connecter
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-16 md:py-20 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6">
              <Sparkles size={14} className="sm:size-5" />
              <span className="text-xs sm:text-sm font-medium">La plateforme dédiée aux chiens</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-heading font-bold mb-4 sm:mb-6 leading-tight">
              Prenez soin de votre chien,
              <br />
              du premier jour à toujours
            </h2>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-6 sm:mb-8 leading-relaxed">
              Suivi santé, communauté, adoption responsable.
              <br className="hidden sm:block" />
              Tout ce dont vous avez besoin pour votre compagnon.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/adoption')}
                className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-white text-purple-600 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:bg-gray-100 transition-smooth flex items-center justify-center gap-2 shadow-xl min-h-[52px]"
              >
                <Heart size={20} className="sm:size-6" />
                <span className="text-sm sm:text-base">Voir les chiens à adopter</span>
                <ArrowRight size={18} className="sm:size-5" />
              </button>
              
              <button
                onClick={() => navigate('/register')}
                className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:bg-white/20 transition-smooth min-h-[52px]"
              >
                <span className="text-sm sm:text-base">Créer un compte gratuit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Section Professionnels */}
      <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-r from-green-500 to-teal-600">
        <div className="max-w-5xl mx-auto px-3 sm:px-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center">
                  <Shield size={32} className="sm:size-10 md:size-12 text-white" />
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-heading font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
                  🏢 Vous êtes un refuge ou une association ?
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-4 sm:mb-6 leading-relaxed">
                  Rejoignez notre réseau de professionnels vérifiés ! Publiez vos chiens à adopter, 
                  gérez les candidatures et touchez des milliers de familles prêtes à adopter.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
                  <button
                    onClick={() => navigate('/pro/register')}
                    className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg hover:from-green-600 hover:to-teal-700 transition-smooth shadow-lg flex items-center justify-center gap-2 min-h-[52px]"
                  >
                    <Shield size={18} className="sm:size-5" />
                    <span className="text-sm sm:text-base">Inscription Professionnelle</span>
                    <ArrowRight size={16} className="sm:size-5" />
                  </button>
                  <button
                    onClick={() => navigate('/adoption')}
                    className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gray-100 text-gray-700 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg hover:bg-gray-200 transition-smooth min-h-[52px]"
                  >
                    <span className="text-sm sm:text-base">Voir les chiens à adopter</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Avantages */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">✅</div>
                <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Badge Vérifié</h4>
                <p className="text-xs sm:text-sm text-gray-600">Gagnez la confiance des adoptants</p>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">📊</div>
                <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Gestion Simplifiée</h4>
                <p className="text-xs sm:text-sm text-gray-600">Tableau de bord complet</p>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🎯</div>
                <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Visibilité Maximale</h4>
                <p className="text-xs sm:text-sm text-gray-600">Milliers de visiteurs par mois</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="py-8 sm:py-12 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
              Une plateforme complète pour votre chien
            </h3>
            <p className="text-sm sm:text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour prendre soin de votre compagnon au quotidien
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 hover:shadow-xl transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <Stethoscope size={24} className="sm:size-6 md:size-8 text-white" />
              </div>
              <h4 className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-gray-900 mb-3 sm:mb-4">
                Suivi santé complet
              </h4>
              <ul className="space-y-2 sm:space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <Check size={16} className="sm:size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base">Carnet de vaccinations digital</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="sm:size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base">Rappels automatiques</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="sm:size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base">Historique des traitements</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 hover:shadow-xl transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <Users size={24} className="sm:size-6 md:size-8 text-white" />
              </div>
              <h4 className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-gray-900 mb-3 sm:mb-4">
                Communauté active
              </h4>
              <ul className="space-y-2 sm:space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <Check size={16} className="sm:size-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base">Partagez vos moments</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="sm:size-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base">Conseils d'experts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="sm:size-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base">Groupes par race</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 hover:shadow-xl transition-all">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <Heart size={24} className="sm:size-6 md:size-8 text-white" />
              </div>
              <h4 className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-gray-900 mb-3 sm:mb-4">
                Adoption responsable
              </h4>
              <ul className="space-y-2 sm:space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <Check size={16} className="sm:size-5 text-pink-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base">Refuges vérifiés</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="sm:size-5 text-pink-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base">Profils détaillés</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="sm:size-5 text-pink-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm sm:text-base">Candidature simplifiée</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section Adoption */}
      {featuredDogs.length > 0 && (
        <section className="py-8 sm:py-12 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <div className="text-center mb-8 sm:mb-12">
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-3 sm:mb-4">
                🏠 Chiens à adopter
              </h3>
              <p className="text-sm sm:text-base md:text-xl text-gray-600">
                Donnez une seconde chance à un compagnon fidèle
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12">
              {featuredDogs.map((dog) => (
                <div
                  key={dog.id}
                  onClick={() => navigate(`/adoption/${dog.id}`)}
                  className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group active:scale-[0.98]"
                >
                  <div className="aspect-square relative overflow-hidden">
                    {dog.photo_url ? (
                      <img
                        src={dog.photo_url}
                        alt={dog.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <span className="text-4xl sm:text-5xl md:text-6xl text-white font-bold">
                          {dog.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-6">
                    <h4 className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-gray-900 mb-2 truncate">
                      {dog.name}
                    </h4>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 truncate">
                      {dog.breed} • {calculateAge(dog.birth_date)}
                    </p>
                    <button className="w-full py-2 sm:py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-smooth flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base">
                      <Heart size={16} className="sm:size-5" />
                      Voir le profil
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate('/adoption')}
                className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg hover:from-blue-600 hover:to-purple-700 transition-smooth inline-flex items-center justify-center gap-2 min-h-[52px]"
              >
                <span className="text-sm sm:text-base">Voir tous les chiens à adopter</span>
                <ArrowRight size={18} className="sm:size-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Final */}
      <section className="py-8 sm:py-12 md:py-20 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 text-center">
          <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-heading font-bold mb-4 sm:mb-6 leading-tight">
            Prêt à rejoindre Doogybook ?
          </h3>
          <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-white/90 mb-6 sm:mb-8">
            Créez votre compte gratuit et commencez à prendre soin de votre chien dès aujourd'hui
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-white text-purple-600 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg hover:bg-gray-100 transition-smooth min-h-[52px]"
            >
              <span className="text-sm sm:text-base">Créer un compte gratuit</span>
            </button>
            <button
              onClick={() => navigate('/adoption')}
              className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg hover:bg-white/20 transition-smooth flex items-center justify-center gap-2 min-h-[52px]"
            >
              <Heart size={18} className="sm:size-5" />
              <span className="text-sm sm:text-base">Voir les adoptions</span>
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
