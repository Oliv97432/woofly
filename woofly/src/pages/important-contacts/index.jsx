import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TabNavigation from '../../components/TabNavigation';
import UserMenu from '../../components/UserMenu';
import ContactCard from './components/ContactCard';
import ContactCategory from './components/ContactCategory';
import EmergencyBanner from './components/EmergencyBanner';
import SearchBar from './components/SearchBar';
import MapModal from './components/MapModal';
import Icon from '../../components/AppIcon';
import Footer from '../../components/Footer';

const ImportantContacts = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedMapContact, setSelectedMapContact] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  
  // Profils de chiens (chargés depuis Supabase)
  const [dogProfiles, setDogProfiles] = useState([]);

  const contacts = [
    {
      id: 1,
      category: 'personal',
      name: "Dr. Sophie Martin",
      specialization: "Vétérinaire généraliste",
      phone: "+33 1 42 56 78 90",
      address: "15 Rue de la Santé, 75014 Paris",
      hours: "Lun-Ven: 9h-19h, Sam: 9h-13h",
      status: "Ouvert",
      rating: 4.8,
      reviewCount: 156,
      website: "https://example.com",
      certification: "Ordre National des Vétérinaires"
    },
    {
      id: 4,
      category: 'clinic',
      name: "Clinique Vétérinaire du Parc",
      specialization: "Chirurgie et médecine générale",
      phone: "+33 1 45 67 89 12",
      address: "23 Boulevard Voltaire, 75011 Paris",
      hours: "Lun-Sam: 8h30-19h30",
      status: "Ouvert",
      rating: 4.7,
      reviewCount: 198,
      website: "https://example.com",
      certification: "Certifié ISO 9001"
    },
    {
      id: 5,
      category: 'clinic',
      name: "Centre Vétérinaire Spécialisé",
      specialization: "Cardiologie et dermatologie",
      phone: "+33 1 53 24 68 90",
      address: "45 Rue du Faubourg Saint-Antoine, 75012 Paris",
      hours: "Lun-Ven: 9h-18h",
      status: "Fermé",
      rating: 4.9,
      reviewCount: 124,
      website: "https://example.com"
    },
    {
      id: 6,
      category: 'association',
      name: "SPA de Paris",
      specialization: "Protection animale",
      phone: "+33 1 43 80 40 66",
      address: "39 Boulevard Berthier, 75017 Paris",
      hours: "Lun-Dim: 11h-18h",
      status: "Ouvert",
      website: "https://example.com",
      certification: "Reconnue d'utilité publique"
    },
    {
      id: 7,
      category: 'association',
      name: "Fondation 30 Millions d'Amis",
      specialization: "Défense des animaux",
      phone: "+33 1 56 59 04 44",
      address: "40 Cours Albert 1er, 75008 Paris",
      hours: "Lun-Ven: 9h-17h",
      status: "Ouvert",
      website: "https://example.com",
      certification: "Fondation reconnue"
    }
  ];

  const categories = [
    {
      id: 'all',
      title: "Tous les contacts",
      description: "Afficher tous les contacts disponibles",
      icon: "List",
      count: contacts?.length
    },
    {
      id: 'personal',
      title: "Mon vétérinaire",
      description: "Vétérinaire personnel de confiance",
      icon: "Stethoscope",
      count: contacts?.filter((c) => c?.category === 'personal')?.length
    },
    {
      id: 'clinic',
      title: "Cliniques locales",
      description: "Cliniques vétérinaires à proximité",
      icon: "Building2",
      count: contacts?.filter((c) => c?.category === 'clinic')?.length
    },
    {
      id: 'association',
      title: "Associations",
      description: "Organisations de protection animale",
      icon: "Heart",
      count: contacts?.filter((c) => c?.category === 'association')?.length
    }
  ];

  // Charger les profils de chiens depuis Supabase
  useEffect(() => {
    const fetchDogProfiles = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('dog_profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setDogProfiles(data);
          
          // Si pas de profil actuel, sélectionner le premier
          if (!currentProfile) {
            setCurrentProfile(data[0]);
          }
        }
      } catch (error) {
        console.error('Erreur chargement chiens:', error);
      }
    };
    
    fetchDogProfiles();
  }, [user?.id]);

  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    if (activeCategory !== 'all') {
      filtered = filtered?.filter((contact) => contact?.category === activeCategory);
    }

    if (searchQuery?.trim()) {
      const query = searchQuery?.toLowerCase();
      filtered = filtered?.filter((contact) =>
        contact?.name?.toLowerCase()?.includes(query) ||
        contact?.specialization?.toLowerCase()?.includes(query) ||
        contact?.address?.toLowerCase()?.includes(query)
      );
    }

    return filtered;
  }, [activeCategory, searchQuery]);

  const handleCall = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleMap = (contact) => {
    setSelectedMapContact(contact);
  };

  const handleEmergencyCall = (number) => {
    window.location.href = `tel:${number}`;
  };

  const handleProfileChange = (profile) => {
    setCurrentProfile(profile);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-heading font-semibold text-foreground">
              Contacts Importants
            </h1>
            <UserMenu
              dogProfiles={dogProfiles}
              currentDog={currentProfile}
              onDogChange={handleProfileChange}
            />
          </div>
        </div>
        <TabNavigation />
      </div>
      
      <main className="main-content">
        <div className="max-w-screen-xl mx-auto px-4 py-8">
          <EmergencyBanner onEmergencyCall={handleEmergencyCall} />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <aside className="lg:col-span-1">
              <div className="bg-card rounded-lg p-4 shadow-soft border border-border sticky top-[180px]">
                <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
                  Catégories
                </h2>
                <div className="space-y-2">
                  {categories?.map((category) => (
                    <ContactCategory
                      key={category?.id}
                      title={category?.title}
                      description={category?.description}
                      icon={category?.icon}
                      count={category?.count}
                      isActive={activeCategory === category?.id}
                      onClick={() => setActiveCategory(category?.id)}
                    />
                  ))}
                </div>
              </div>
            </aside>

            <div className="lg:col-span-3">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Rechercher un vétérinaire, une clinique..."
              />

              {filteredContacts?.length === 0 ? (
                <div className="bg-card rounded-lg p-12 text-center shadow-soft border border-border">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Icon name="Search" size={32} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                    Aucun contact trouvé
                  </h3>
                  <p className="text-muted-foreground font-caption">
                    Essayez de modifier vos critères de recherche ou de sélectionner une autre catégorie.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredContacts?.map((contact) => (
                    <ContactCard
                      key={contact?.id}
                      contact={contact}
                      onCall={handleCall}
                      onMap={handleMap}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {selectedMapContact && (
        <MapModal
          contact={selectedMapContact}
          onClose={() => setSelectedMapContact(null)}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default ImportantContacts;
