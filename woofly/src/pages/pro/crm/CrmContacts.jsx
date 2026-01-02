import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TabNavigationPro from '../../components/TabNavigationPro';
import UserMenuPro from '../../components/UserMenuPro';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { 
  ArrowLeft, Edit, Trash2, Plus, Phone, Mail, MapPin,
  Home, Star, Calendar, FileText, Dog, AlertCircle,
  CheckCircle, Clock, User
} from 'lucide-react';

const CRMContactDetail = () => {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [proAccount, setProAccount] = useState(null);
  const [contact, setContact] = useState(null);
  const [placementHistory, setPlacementHistory] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('info');

  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({
    note_type: 'general',
    title: '',
    description: '',
    is_important: false
  });

  useEffect(() => {
    if (user) {
      fetchProAccount();
    }
  }, [user]);

  useEffect(() => {
    if (proAccount && contactId) {
      fetchContact();
      fetchPlacementHistory();
      fetchNotes();
    }
  }, [proAccount, contactId]);

  const fetchProAccount = async () => {
    try {
      const { data, error } = await supabase
        .from('professional_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProAccount(data);
    } catch (err) {
      console.error('Erreur:', err);
      navigate('/pro/register');
    }
  };

  const fetchContact = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .eq('professional_account_id', proAccount.id)
        .single();

      if (error) throw error;
      setContact(data);
    } catch (err) {
      console.error('Erreur chargement contact:', err);
      navigate('/pro/crm/contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlacementHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('placement_history')
        .select(`
          *,
          dogs(id, name, breed, photo_url)
        `)
        .eq('contact_id', contactId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setPlacementHistory(data || []);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    }
  };

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_notes')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error('Erreur chargement notes:', err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('contact_notes')
        .insert([{
          contact_id: contactId,
          professional_account_id: proAccount.id,
          created_by_user_id: user.id,
          ...noteForm
        }]);

      if (error) throw error;

      // Rafraîchir les notes
      await fetchNotes();

      // Réinitialiser le formulaire
      setNoteForm({
        note_type: 'general',
        title: '',
        description: '',
        is_important: false
      });
      setShowAddNoteModal(false);

      alert('✅ Note ajoutée avec succès !');
    } catch (err) {
      console.error('Erreur ajout note:', err);
      alert('❌ Erreur lors de l\'ajout de la note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) return;

    try {
      const { error } = await supabase
        .from('contact_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      await fetchNotes();
      alert('✅ Note supprimée');
    } catch (err) {
      console.error('Erreur suppression note:', err);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${contact.full_name} ?`)) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      alert('✅ Contact supprimé');
      navigate('/pro/crm/contacts');
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'foster_family': return 'Famille d\'accueil';
      case 'adopter': return 'Adoptant';
      case 'both': return 'FA & Adoptant';
      default: return 'Contact';
    }
  };

  const getNoteTypeLabel = (type) => {
    switch (type) {
      case 'visit': return 'Visite';
      case 'placement': return 'Placement';
      case 'removal': return 'Retrait';
      case 'adoption': return 'Adoption';
      case 'issue': return 'Problème';
      case 'followup': return 'Suivi';
      case 'general': return 'Général';
      default: return type;
    }
  };

  const getNoteTypeColor = (type) => {
    switch (type) {
      case 'visit': return 'bg-blue-100 text-blue-700';
      case 'placement': return 'bg-green-100 text-green-700';
      case 'removal': return 'bg-orange-100 text-orange-700';
      case 'adoption': return 'bg-purple-100 text-purple-700';
      case 'issue': return 'bg-red-100 text-red-700';
      case 'followup': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPlacementStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return { text: 'En cours', color: 'bg-green-100 text-green-700', icon: CheckCircle };
      case 'completed':
        return { text: 'Terminé', color: 'bg-gray-100 text-gray-700', icon: CheckCircle };
      case 'cancelled':
        return { text: 'Annulé', color: 'bg-red-100 text-red-700', icon: AlertCircle };
      default:
        return { text: status, color: 'bg-gray-100 text-gray-700', icon: Clock };
    }
  };

  const tabs = [
    { id: 'info', label: 'Informations', icon: User },
    { id: 'dogs', label: 'Historique chiens', icon: Dog },
    { id: 'notes', label: 'Notes & Suivi', icon: FileText }
  ];

  const activePlacements = placementHistory.filter(p => p.status === 'active');
  const completedPlacements = placementHistory.filter(p => p.status !== 'active');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Contact non trouvé</p>
          <Button onClick={() => navigate('/pro/crm/contacts')}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/pro/crm/contacts')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-smooth"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-lg sm:text-2xl font-heading font-semibold text-foreground">
                  {contact.full_name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {getTypeLabel(contact.type)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                iconName="Edit"
                onClick={() => navigate(`/pro/crm/contacts/${contactId}/edit`)}
                size="sm"
              >
                <span className="hidden sm:inline">Modifier</span>
              </Button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-smooth"
              >
                <Trash2 size={18} />
              </button>
              <UserMenuPro />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {contact.full_name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-heading font-bold text-foreground">
                  {contact.full_name}
                </h2>
                {contact.rating && (
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < contact.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={16} />
                  <a href={`mailto:${contact.email}`} className="hover:text-primary">
                    {contact.email}
                  </a>
                </div>
                {contact.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone size={16} />
                    <a href={`tel:${contact.phone}`} className="hover:text-primary">
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.city && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin size={16} />
                    <span>{contact.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar size={16} />
                  <span>Depuis {new Date(contact.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              {/* Stats rapides */}
              {(contact.type === 'foster_family' || contact.type === 'both') && (
                <div className="flex flex-wrap gap-3">
                  <div className="bg-card rounded-lg px-4 py-2 border border-border">
                    <span className="text-sm text-muted-foreground">Actuellement :</span>
                    <span className="ml-2 font-bold text-primary">
                      {contact.current_dogs_count}/{contact.max_dogs}
                    </span>
                  </div>
                  <div className="bg-card rounded-lg px-4 py-2 border border-border">
                    <span className="text-sm text-muted-foreground">Total accueillis :</span>
                    <span className="ml-2 font-bold text-purple-600">
                      {contact.total_dogs_fostered}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TabNavigationPro />

      {/* Tabs */}
      <div className="bg-card border-b border-border sticky top-[calc(4rem)] z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-smooth border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations personnelles */}
              <div className="bg-card rounded-xl shadow-soft p-6 border border-border">
                <h3 className="text-lg font-heading font-semibold mb-4">Informations personnelles</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-foreground">{contact.email}</p>
                  </div>
                  {contact.phone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                      <p className="text-foreground">{contact.phone}</p>
                    </div>
                  )}
                  {contact.address && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Adresse</label>
                      <p className="text-foreground">{contact.address}</p>
                    </div>
                  )}
                  {contact.city && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ville</label>
                      <p className="text-foreground">{contact.city}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations logement (pour FA) */}
              {(contact.type === 'foster_family' || contact.type === 'both') && (
                <div className="bg-card rounded-xl shadow-soft p-6 border border-border">
                  <h3 className="text-lg font-heading font-semibold mb-4">Informations logement</h3>
                  <div className="space-y-3">
                    {contact.housing_type && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Type de logement</label>
                        <p className="text-foreground capitalize">{contact.housing_type.replace('_', ' ')}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Jardin</label>
                      <p className="text-foreground">{contact.has_garden ? 'Oui' : 'Non'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Autres animaux</label>
                      <p className="text-foreground">{contact.has_other_pets ? 'Oui' : 'Non'}</p>
                      {contact.other_pets_details && (
                        <p className="text-sm text-muted-foreground mt-1">{contact.other_pets_details}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Capacité d'accueil</label>
                      <p className="text-foreground">{contact.max_dogs} chien(s)</p>
                    </div>
                    {contact.preferences_notes && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Préférences</label>
                        <p className="text-foreground">{contact.preferences_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dogs' && (
            <div className="space-y-6">
              {/* Chiens actuels */}
              {activePlacements.length > 0 && (
                <div>
                  <h3 className="text-xl font-heading font-semibold mb-4">
                    Chiens actuellement en garde ({activePlacements.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activePlacements.map((placement) => {
                      const badge = getPlacementStatusBadge(placement.status);
                      const StatusIcon = badge.icon;
                      
                      return (
                        <div key={placement.id} className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
                          <div className="flex items-center gap-4 p-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex-shrink-0">
                              {placement.dogs?.photo_url ? (
                                <img
                                  src={placement.dogs.photo_url}
                                  alt={placement.dogs.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary/30">
                                  {placement.dogs?.name?.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground truncate">{placement.dogs?.name}</h4>
                              <p className="text-sm text-muted-foreground truncate">{placement.dogs?.breed}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Depuis le {new Date(placement.start_date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>

                            <div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${badge.color}`}>
                                <StatusIcon size={12} />
                                {badge.text}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Historique */}
              {completedPlacements.length > 0 && (
                <div>
                  <h3 className="text-xl font-heading font-semibold mb-4">
                    Historique ({completedPlacements.length})
                  </h3>
                  <div className="space-y-3">
                    {completedPlacements.map((placement) => {
                      const badge = getPlacementStatusBadge(placement.status);
                      const StatusIcon = badge.icon;
                      
                      return (
                        <div key={placement.id} className="bg-card rounded-lg border border-border p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {placement.dogs?.photo_url ? (
                                <img
                                  src={placement.dogs.photo_url}
                                  alt={placement.dogs.name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-bold text-primary/30">
                                  {placement.dogs?.name?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              
                              <div>
                                <h4 className="font-medium text-foreground">{placement.dogs?.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(placement.start_date).toLocaleDateString('fr-FR')} - 
                                  {placement.end_date ? ` ${new Date(placement.end_date).toLocaleDateString('fr-FR')}` : ' En cours'}
                                </p>
                              </div>
                            </div>

                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${badge.color}`}>
                              <StatusIcon size={12} />
                              {badge.text}
                            </span>
                          </div>

                          {placement.end_notes && (
                            <p className="mt-3 text-sm text-muted-foreground bg-background rounded-lg p-3">
                              {placement.end_notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {placementHistory.length === 0 && (
                <div className="text-center py-12 bg-card rounded-xl">
                  <Dog size={48} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Aucun historique de placement</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-heading font-semibold">
                  Notes & Suivi ({notes.length})
                </h3>
                <Button
                  iconName="Plus"
                  onClick={() => setShowAddNoteModal(true)}
                >
                  Ajouter une note
                </Button>
              </div>

              {notes.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl">
                  <FileText size={48} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Aucune note enregistrée</p>
                  <Button
                    iconName="Plus"
                    onClick={() => setShowAddNoteModal(true)}
                  >
                    Ajouter la première note
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className={`bg-card rounded-xl border p-4 ${
                        note.is_important ? 'border-yellow-400 bg-yellow-50/50' : 'border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getNoteTypeColor(note.note_type)}`}>
                              {getNoteTypeLabel(note.note_type)}
                            </span>
                            {note.is_important && (
                              <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-medium">
                                Important
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.created_at).toLocaleDateString('fr-FR')} à{' '}
                              {new Date(note.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h4 className="font-semibold text-foreground">{note.title}</h4>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                        {note.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal Ajouter Note */}
      {showAddNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-heading font-bold">Ajouter une note</h3>
                <button
                  onClick={() => setShowAddNoteModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Icon name="X" size={20} />
                </button>
              </div>

              <form onSubmit={handleAddNote} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Type de note
                  </label>
                  <select
                    value={noteForm.note_type}
                    onChange={(e) => setNoteForm({ ...noteForm, note_type: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                    required
                  >
                    <option value="general">Général</option>
                    <option value="visit">Visite</option>
                    <option value="placement">Placement</option>
                    <option value="removal">Retrait</option>
                    <option value="adoption">Adoption</option>
                    <option value="issue">Problème</option>
                    <option value="followup">Suivi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                    placeholder="Ex: Visite de contrôle"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={noteForm.description}
                    onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
                    placeholder="Détails de la note..."
                    rows={4}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-background resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noteForm.is_important}
                      onChange={(e) => setNoteForm({ ...noteForm, is_important: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="text-sm font-medium text-muted-foreground">
                      Marquer comme important
                    </span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddNoteModal(false)}
                    className="flex-1 py-3 border-2 border-border rounded-xl font-medium hover:bg-muted"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90"
                  >
                    Ajouter
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMContactDetail;
