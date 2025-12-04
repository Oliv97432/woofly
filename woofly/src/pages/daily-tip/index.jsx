import React, { useState, useEffect } from 'react';
import { 
  ChefHat, Heart, GraduationCap, Activity, 
  Phone, MapPin, Clock, AlertCircle, Search,
  Sparkles, Stethoscope, Building2, PhoneCall
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Footer from '../../components/Footer';

/**
 * Page Daily Tip - Conseils & Contacts
 * Tips pratiques + Contacts d'urgence pour les chiens
 */
const DailyTip = () => {
  const [selectedTipCategory, setSelectedTipCategory] = useState('all');
  const [tips, setTips] = useState([]);
  const [loadingTips, setLoadingTips] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Catégories de tips (correspondent à la table tips)
  const tipCategories = [
    { id: 'all', name: 'Tous', icon: Sparkles, color: 'blue' },
    { id: 'health', name: 'Santé', icon: Heart, color: 'red' },
    { id: 'nutrition', name: 'Nutrition', icon: ChefHat, color: 'orange' },
    { id: 'care', name: 'Soins', icon: Heart, color: 'pink' },
    { id: 'education', name: 'Éducation', icon: GraduationCap, color: 'purple' },
    { id: 'wellness', name: 'Bien-être', icon: Activity, color: 'green' }
  ];

  // Contacts d'urgence
  const emergencyContacts = [
    {
      id: 1,
      type: 'urgence',
      name: 'Clinique Vétérinaire 24/7',
      phone: '01 40 00 00 00',
      address: 'Paris 15ème',
      hours: 'Ouvert 24h/24, 7j/7',
      icon: Stethoscope,
      color: 'red'
    },
    {
      id: 2,
      type: 'veterinaire',
      name: 'Vétérinaire de garde',
      phone: '01 41 11 11 11',
      address: 'Paris 16ème',
      hours: 'Lun-Sam: 9h-19h',
      icon: Building2,
      color: 'blue'
    },
    {
      id: 3,
      type: 'urgence',
      name: 'SOS Vétérinaires Paris',
      phone: '01 47 55 47 00',
      address: 'Paris 8ème',
      hours: '24h/24, urgences uniquement',
      icon: PhoneCall,
      color: 'red'
    },
    {
      id: 4,
      type: 'poison',
      name: 'Centre Anti-Poison Animal',
      phone: '04 78 87 10 40',
      address: 'Lyon',
      hours: '24h/24, 7j/7',
      icon: AlertCircle,
      color: 'orange'
    }
  ];

  useEffect(() => {
    fetchTips();
  }, [selectedTipCategory, searchQuery]);

  const fetchTips = async () => {
    try {
      setLoadingTips(true);
      
      // Utilise la table "tips" (correspond à ton SQL)
      let query = supabase
        .from('tips')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(9);
      
      // Filtre par catégorie si pas "all"
      if (selectedTipCategory !== 'all') {
        query = query.eq('category', selectedTipCategory);
      }
      
      // Filtre par recherche
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Erreur chargement tips:', error);
        throw error;
      }

      setTips(data || []);
    } catch (error) {
      console.error('Erreur chargement tips:', error);
      // Si la table n'existe pas encore, afficher un message
      setTips([]);
    } finally {
      setLoadingTips(false);
    }
  };

  const getCategoryInfo = (categoryId) => {
    return tipCategories.find(c => c.id === categoryId) || tipCategories[0];
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Conseils & Contacts</h1>
          <p className="text-lg text-white/90">
            Tous nos conseils pratiques + contacts d'urgence pour votre chien 🐕
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        
        {/* ========================================
            SECTION 1 : CONSEILS PRATIQUES (TIPS)
        ======================================== */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="text-yellow-500" size={32} />
            <h2 className="text-3xl font-bold text-foreground">
              Conseils Pratiques
            </h2>
          </div>

          {/* Barre de recherche */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                placeholder="Rechercher un conseil..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Catégories de tips */}
          <div className="flex flex-wrap gap-3 mb-8">
            {tipCategories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedTipCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedTipCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-card border border-border text-foreground hover:shadow-md'
                  }`}
                >
                  <Icon size={18} />
                  {category.name}
                </button>
              );
            })}
          </div>

          {/* Liste des tips */}
          {loadingTips ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : tips.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Sparkles size={48} className="text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                {searchQuery 
                  ? 'Aucun conseil trouvé pour cette recherche.'
                  : 'Aucun conseil disponible pour le moment.'
                }
              </p>
              <p className="text-sm text-muted-foreground">
                Les conseils seront chargés depuis la table "tips" de Supabase.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tips.map((tip) => {
                const categoryInfo = getCategoryInfo(tip.category);
                const Icon = categoryInfo?.icon || Sparkles;
                
                return (
                  <div
                    key={tip.id}
                    className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${categoryInfo?.color}-100`}>
                        <Icon className={`text-${categoryInfo?.color}-600`} size={20} />
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium bg-${categoryInfo?.color}-100 text-${categoryInfo?.color}-700`}>
                        {categoryInfo?.name}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                      {tip.title}
                    </h3>

                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {tip.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Séparateur */}
        <div className="border-t border-border mb-16" />

        {/* ========================================
            SECTION 2 : CONTACTS D'URGENCE
        ======================================== */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <PhoneCall className="text-red-500" size={32} />
            <h2 className="text-3xl font-bold text-foreground">
              Contacts d'Urgence
            </h2>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <p className="font-semibold text-red-900 mb-1">
                  En cas d'urgence vitale
                </p>
                <p className="text-sm text-red-700">
                  Contactez immédiatement votre vétérinaire ou une clinique d'urgence 24h/24.
                  Ne perdez pas de temps sur Internet.
                </p>
              </div>
            </div>
          </div>

          {/* Liste des contacts */}
          <div className="grid md:grid-cols-2 gap-6">
            {emergencyContacts.map((contact) => {
              const Icon = contact.icon;
              
              return (
                <div
                  key={contact.id}
                  className={`bg-card border-2 rounded-xl p-6 hover:shadow-lg transition-all ${
                    contact.type === 'urgence' 
                      ? 'border-red-200 bg-red-50/50' 
                      : 'border-border'
                  }`}
                >
                  {/* En-tête */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      contact.type === 'urgence'
                        ? 'bg-red-500 text-white'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      <Icon size={24} />
                    </div>
                    
                    {contact.type === 'urgence' && (
                      <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-bold animate-pulse">
                        URGENCE
                      </span>
                    )}
                  </div>

                  {/* Informations */}
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    {contact.name}
                  </h3>

                  <div className="space-y-3">
                    {/* Téléphone */}
                    <a
                      href={`tel:${contact.phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-primary/5 transition-all group"
                    >
                      <Phone className="text-primary group-hover:scale-110 transition-transform" size={20} />
                      <span className="font-semibold text-primary">
                        {contact.phone}
                      </span>
                    </a>

                    {/* Adresse */}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <MapPin size={18} />
                      <span>{contact.address}</span>
                    </div>

                    {/* Horaires */}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Clock size={18} />
                      <span>{contact.hours}</span>
                    </div>
                  </div>

                  {/* Bouton appel direct */}
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, '')}`}
                    className={`mt-4 w-full py-3 rounded-lg font-semibold text-center block transition-all ${
                      contact.type === 'urgence'
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    <Phone size={18} className="inline mr-2" />
                    Appeler maintenant
                  </a>
                </div>
              );
            })}
          </div>

          {/* Information supplémentaire */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <AlertCircle className="text-blue-500" size={20} />
              Bon à savoir
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Gardez toujours le numéro de votre vétérinaire à portée de main</li>
              <li>• En cas de doute, contactez un professionnel plutôt que d'attendre</li>
              <li>• Les urgences vétérinaires sont souvent payantes et plus chères la nuit</li>
              <li>• Pensez à souscrire une assurance santé pour votre animal</li>
            </ul>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default DailyTip;
