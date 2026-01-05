import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import TabNavigationPro from '../../../components/TabNavigationPro';
import UserMenuPro from '../../../components/UserMenuPro';
import ContactListModal from '../../../components/ContactListModal';
import Icon from '../../../components/AppIcon';
import { 
  Plus, Search, Filter, Users, Home, Heart,
  Star, Phone, Mail, MapPin, TrendingUp,
  Calendar, AlertCircle, CheckCircle
} from 'lucide-react';

const CRMContacts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [proAccount, setProAccount] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({
    totalContacts: 0,
    activeFosterFamilies: 0,
    totalAdopters: 0,
    dogsInFoster: 0,
    availableCapacity: 0
  });

  // États pour le modal
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalItems, setModalItems] = useState([]);
  const [modalType, setModalType] = useState('contacts'); // 'contacts' ou 'dogs'

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');

  useEffect(() => {
    if (user) {
      fetchProAccount();
    }
  }, [user]);

  const fetchProAccount = async () => {
    try {
      const { data: account, error } = await supabase
        .from('professional_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProAccount(account);
      await fetchContacts(account.id);
    } catch (error) {
      console.error('Erreur:', error);
      navigate('/pro/register');
    }
  };

  const fetchContacts = async (proAccountId) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          contact_notes(count),
          placement_history!placement_history_contact_id_fkey(
            id,
            dog_id,
            status,
            placement_type,
            start_date,
            dogs(id, name, breed, photo_url)
          )
        `)
        .eq('professional_account_id', proAccountId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedContacts = data.map(contact => ({
        ...contact,
        current_dogs: contact.placement_history
          ?.filter(ph => ph.status === 'active')
          ?.map(ph => ph.dogs)
          || [],
        notes_count: contact.contact_notes?.[0]?.count || 0
      }));

      setContacts(formattedContacts);

      const totalContacts = formattedContacts.length;
      const activeFosterFamilies = formattedContacts.filter(
        c => (c.type === 'foster_family' || c.type === 'both') && c.status === 'active'
      ).length;
      const totalAdopters = formattedContacts.filter(
        c => (c.type === 'adopter' || c.type === 'both')
      ).length;
      const dogsInFoster = formattedContacts.reduce(
        (sum, c) => sum + c.current_dogs.length, 0
      );
      const availableCapacity = formattedContacts
        .filter(c => c.availability === 'available')
        .reduce((sum, c) => sum + (c.max_dogs - c.current_dogs_count), 0);

      setStats({
        totalContacts,
        activeFosterFamilies,
        totalAdopters,
        dogsInFoster,
        availableCapacity
      });

    } catch (error) {
      console.error('Erreur chargement contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonctions pour ouvrir le modal avec différents filtres
  const handleTotalContactsClick = () => {
    setModalTitle(`Total contacts (${stats.totalContacts})`);
    setModalItems(contacts);
    setModalType('contacts');
    setShowModal(true);
  };

  const handleActiveFAClick = () => {
    const activeFAs = contacts.filter(
      c => (c.type === 'foster_family' || c.type === 'both') && c.status === 'active'
    );
    setModalTitle(`FA actives (${activeFAs.length})`);
    setModalItems(activeFAs);
    setModalType('contacts');
    setShowModal(true);
  };

  const handleAdoptersClick = () => {
    const adopters = contacts.filter(
      c => (c.type === 'adopter' || c.type === 'both')
    );
    setModalTitle(`Adoptants (${adopters.length})`);
    setModalItems(adopters);
    setModalType('contacts');
    setShowModal(true);
  };

  const handleDogsInFosterClick = async () => {
    // Récupérer tous les chiens actuellement en FA
    try {
      const { data: dogs, error } = await supabase
        .from('dogs')
        .select(`
          *,
          contacts!dogs_foster_family_contact_id_fkey(full_name)
        `)
        .eq('professional_account_id', proAccount.id)
        .not('foster_family_contact_id', 'is', null);

      if (error) throw error;

      const formattedDogs = dogs.map(dog => ({
        ...dog,
        foster_family_name: dog.contacts?.full_name
      }));

      setModalTitle(`Chiens en FA (${formattedDogs.length})`);
      setModalItems(formattedDogs);
      setModalType('dogs');
      setShowModal(true);
    } catch (error) {
      console.error('Erreur chargement chiens:', error);
    }
  };

  const handleAvailablePlacesClick = () => {
    const availableFAs = contacts.filter(c => c.availability === 'available');
    setModalTitle(`Places disponibles (${stats.availableCapacity})`);
    setModalItems(availableFAs);
    setModalType('contacts');
    setShowModal(true);
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone?.includes(searchTerm);

    let matchesType = true;
    if (filterType !== 'all') {
      matchesType = contact.type === filterType || contact.type === 'both';
    }

    let matchesStatus = true;
    if (filterStatus !== 'all') {
      matchesStatus = contact.status === filterStatus;
    }

    let matchesAvailability = true;
    if (filterAvailability !== 'all') {
      matchesAvailability = contact.availability === filterAvailability;
    }

    return matchesSearch && matchesType && matchesStatus && matchesAvailability;
  });

  const getAvailabilityBadge = (contact) => {
    if (contact.type === 'adopter') {
      return null;
    }

    switch (contact.availability) {
      case 'available':
        return {
          text: 'Disponible',
          color: 'bg-green-100 text-green-700 border-green-200'
        };
      case 'full':
        return {
          text: 'Complet',
          color: 'bg-orange-100 text-orange-700 border-orange-200'
        };
      case 'temporarily_unavailable':
        return {
          text: 'Indisponible',
          color: 'bg-gray-100 text-gray-700 border-gray-200'
        };
      case 'inactive':
        return {
          text: 'Inactif',
          color: 'bg-red-100 text-red-700 border-red-200'
        };
      default:
        return null;
    }
  };

  const getTypeIcon = (type) => {
    if (type === 'foster_family' || type === 'both') return Home;
    if (type === 'adopter') return Heart;
    return Users;
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'foster_family': return 'Famille d\'accueil';
      case 'adopter': return 'Adoptant';
      case 'both': return 'FA & Adoptant';
      default: return 'Contact';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-1">
                Gestion des contacts
              </h1>
              <p className="text-sm text-muted-foreground">
                Familles d'accueil et adoptants
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/pro/crm/contacts/new')}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth flex items-center gap-2 shadow-soft min-h-[44px]"
              >
                <Plus size={20} />
                <span className="hidden xs:inline">Nouveau contact</span>
                <span className="xs:hidden">Nouveau</span>
              </button>
              <UserMenuPro />
            </div>
          </div>

          {/* Cartes statistiques - MAINTENANT CLIQUABLES */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <button
              onClick={handleTotalContactsClick}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Users size={20} className="text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900">{stats.totalContacts}</p>
              <p className="text-xs sm:text-sm text-blue-700">Total contacts</p>
            </button>

            <button
              onClick={handleActiveFAClick}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Home size={20} className="text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-purple-900">{stats.activeFosterFamilies}</p>
              <p className="text-xs sm:text-sm text-purple-700">FA actives</p>
            </button>

            <button
              onClick={handleAdoptersClick}
              className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-pink-500 rounded-lg">
                  <Heart size={20} className="text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-pink-900">{stats.totalAdopters}</p>
              <p className="text-xs sm:text-sm text-pink-700">Adoptants</p>
            </button>

            <button
              onClick={handleDogsInFosterClick}
              className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <TrendingUp size={20} className="text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-orange-900">{stats.dogsInFoster}</p>
              <p className="text-xs sm:text-sm text-orange-700">Chiens en FA</p>
            </button>

            <button
              onClick={handleAvailablePlacesClick}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <CheckCircle size={20} className="text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-green-900">{stats.availableCapacity}</p>
              <p className="text-xs sm:text-sm text-green-700">Places dispo</p>
            </button>
          </div>
        </div>
      </div>

      <TabNavigationPro />

      <main className="main-content flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
          <div className="bg-card rounded-xl shadow-soft p-4 mb-6">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un contact..."
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-sm"
                >
                  <option value="all">Tous les types</option>
                  <option value="foster_family">Familles d'accueil</option>
                  <option value="adopter">Adoptants</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-sm"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                </select>

                <select
                  value={filterAvailability}
                  onChange={(e) => setFilterAvailability(e.target.value)}
                  className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-sm"
                >
                  <option value="all">Toutes disponibilités</option>
                  <option value="available">Disponibles</option>
                  <option value="full">Complets</option>
                  <option value="temporarily_unavailable">Indisponibles</option>
                </select>
              </div>
            </div>
          </div>

          {filteredContacts.length === 0 ? (
            <div className="bg-card rounded-xl shadow-soft p-12 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={40} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-heading font-bold text-foreground mb-2">
                Aucun contact trouvé
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Essayez avec d\'autres mots-clés'
                  : 'Commencez par ajouter votre premier contact'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate('/pro/crm/contacts/new')}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth inline-flex items-center gap-2"
                >
                  <Plus size={20} />
                  Ajouter un contact
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredContacts.map((contact) => {
                const TypeIcon = getTypeIcon(contact.type);
                const availabilityBadge = getAvailabilityBadge(contact);

                return (
                  <div
                    key={contact.id}
                    onClick={() => navigate(`/pro/crm/contacts/${contact.id}`)}
                    className="group bg-card rounded-2xl shadow-soft border border-border hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 border-b border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TypeIcon size={18} className="text-primary" />
                          <span className="text-sm font-medium text-muted-foreground">
                            {getTypeLabel(contact.type)}
                          </span>
                        </div>
                        {availabilityBadge && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${availabilityBadge.color}`}>
                            {availabilityBadge.text}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-heading font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                            {contact.full_name}
                          </h3>
                          {contact.rating && (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={i < contact.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail size={14} />
                          <span className="truncate">{contact.email}</span>
                        </div>
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone size={14} />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.city && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin size={14} />
                            <span className="truncate">{contact.city}</span>
                          </div>
                        )}
                      </div>

                      {(contact.type === 'foster_family' || contact.type === 'both') && (
                        <div className="bg-purple-50 rounded-lg p-3 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-purple-700 font-medium">
                              Chiens actuels : {contact.current_dogs_count}/{contact.max_dogs}
                            </span>
                            <span className="text-purple-600">
                              Total : {contact.total_dogs_fostered}
                            </span>
                          </div>
                        </div>
                      )}

                      {contact.current_dogs.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Chiens actuellement en garde :
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {contact.current_dogs.map((dog) => (
                              <div
                                key={dog.id}
                                className="flex items-center gap-2 bg-background rounded-lg px-2 py-1 border border-border"
                              >
                                {dog.photo_url ? (
                                  <img
                                    src={dog.photo_url}
                                    alt={dog.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-xs font-bold text-primary">
                                      {dog.name?.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <span className="text-xs font-medium">{dog.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(contact.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        {contact.notes_count > 0 && (
                          <span className="flex items-center gap-1">
                            <AlertCircle size={12} />
                            {contact.notes_count} note{contact.notes_count > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal de liste */}
      <ContactListModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalTitle}
        items={modalItems}
        type={modalType}
      />
    </div>
  );
};

export default CRMContacts;
