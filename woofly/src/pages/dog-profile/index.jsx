import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TabNavigation from '../../components/TabNavigation';
import ProfileSwitcher from '../../components/ProfileSwitcher';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import ProfileHeader from './components/ProfileHeader';
import VaccinationCard from './components/VaccinationCard';
import TreatmentCard from './components/TreatmentCard';
import WeightChart from './components/WeightChart';
import HealthNotesSection from './components/HealthNotesSection';
import AddVaccinationModal from './components/AddVaccinationModal';
import AddTreatmentModal from './components/AddTreatmentModal';
import AddWeightModal from './components/AddWeightModal';
import EditProfileModal from './components/EditProfileModal';
import PhotoGalleryModal from './components/PhotoGalleryModal';

const DogProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('vaccinations');
  const [loading, setLoading] = useState(true);

  // États pour les données
  const [dogProfiles, setDogProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [vaccinations, setVaccinations] = useState([]);
  const [treatments, setTreatments] = useState([]); // Pour vermifuge et anti-puces
  const [weightData, setWeightData] = useState([]);
  const [healthNotes, setHealthNotes] = useState({
    allergies: '',
    medications: '',
    veterinaryNotes: '',
    veterinarian: '',
    veterinarianPhone: ''
  });
  const [photoGallery, setPhotoGallery] = useState([]);

  const [modals, setModals] = useState({
    vaccination: false,
    vermifuge: false,
    flea: false,
    weight: false,
    editProfile: false,
    gallery: false
  });

  const [editingItem, setEditingItem] = useState(null);

  // Charger les chiens de l'utilisateur
  useEffect(() => {
    if (!user?.id) return;

    const fetchDogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('dogs')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedProfiles = data.map(dog => {
          const birthDate = new Date(dog.birth_date);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }

          return {
            id: dog.id,
            name: dog.name,
            breed: dog.breed || 'Race inconnue',
            age: age > 0 ? `${age} an${age > 1 ? 's' : ''}` : 'Moins d\'un an',
            weight: dog.weight ? `${dog.weight} kg` : 'Non renseigné',
            gender: dog.gender || 'Non renseigné',
            sterilized: dog.is_sterilized ? 'Stérilisé' : 'Non stérilisé',
            image: dog.photo_url || 'https://images.pexels.com/photos/1490908/pexels-photo-1490908.jpeg',
            imageAlt: `${dog.name} - ${dog.breed}`,
            microchip_number: dog.microchip_number,
            notes: dog.notes
          };
        });

        setDogProfiles(formattedProfiles);
        if (formattedProfiles.length > 0) {
          setCurrentProfile(formattedProfiles[0]);
        }
      } catch (err) {
        console.error('Erreur chargement chiens:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDogs();
  }, [user?.id]);

  // Charger les vaccinations du chien actuel
  useEffect(() => {
    if (!currentProfile?.id) return;

    const fetchVaccinations = async () => {
      try {
        const { data, error } = await supabase
          .from('vaccinations')
          .select('*')
          .eq('dog_id', currentProfile.id)
          .order('next_due_date', { ascending: true });

        if (error) throw error;

        const formatted = data.map(vac => ({
          id: vac.id,
          name: vac.vaccine_name,
          lastDate: new Date(vac.vaccination_date).toLocaleDateString('fr-FR'),
          nextDate: vac.next_due_date ? new Date(vac.next_due_date).toLocaleDateString('fr-FR') : 'Non défini',
          veterinarian: vac.veterinarian,
          notes: vac.notes
        }));

        setVaccinations(formatted);
      } catch (err) {
        console.error('Erreur chargement vaccinations:', err);
      }
    };

    fetchVaccinations();
  }, [currentProfile?.id]);

  // Charger les traitements (vermifuge et anti-puces)
  useEffect(() => {
    if (!currentProfile?.id) return;

    const fetchTreatments = async () => {
      try {
        const { data, error } = await supabase
          .from('treatments')
          .select('*')
          .eq('dog_id', currentProfile.id)
          .order('next_due_date', { ascending: true });

        if (error) throw error;

        const formatted = data.map(treat => ({
          id: treat.id,
          product: treat.product_name,
          lastDate: new Date(treat.treatment_date).toLocaleDateString('fr-FR'),
          nextDate: treat.next_due_date ? new Date(treat.next_due_date).toLocaleDateString('fr-FR') : 'Non défini',
          notes: treat.notes,
          type: treat.treatment_type // 'worm', 'flea', 'tick', 'other'
        }));

        setTreatments(formatted);
      } catch (err) {
        console.error('Erreur chargement traitements:', err);
      }
    };

    fetchTreatments();
  }, [currentProfile?.id]);

  // Charger le poids
  useEffect(() => {
    if (!currentProfile?.id) return;

    const fetchWeight = async () => {
      try {
        const { data, error } = await supabase
          .from('weight_records')
          .select('*')
          .eq('dog_id', currentProfile.id)
          .order('measurement_date', { ascending: true });

        if (error) throw error;

        const formatted = data.map(record => ({
          date: new Date(record.measurement_date).toLocaleDateString('fr-FR'),
          weight: parseFloat(record.weight)
        }));

        setWeightData(formatted);
      } catch (err) {
        console.error('Erreur chargement poids:', err);
      }
    };

    fetchWeight();
  }, [currentProfile?.id]);

  // Charger les notes de santé
  useEffect(() => {
    if (!currentProfile?.id) return;

    const fetchHealthNotes = async () => {
      try {
        const { data, error } = await supabase
          .from('health_notes')
          .select('*')
          .eq('dog_id', currentProfile.id)
          .order('note_date', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const note = data[0];
          setHealthNotes({
            allergies: note.tags?.includes('allergies') ? note.description : '',
            medications: note.tags?.includes('medications') ? note.description : '',
            veterinaryNotes: note.description || '',
            veterinarian: note.tags?.includes('vet') ? note.title : '',
            veterinarianPhone: ''
          });
        }
      } catch (err) {
        console.error('Erreur chargement notes santé:', err);
      }
    };

    fetchHealthNotes();
  }, [currentProfile?.id]);

  const openModal = (modalName, item = null) => {
    setEditingItem(item);
    setModals({ ...modals, [modalName]: true });
  };

  const closeModal = (modalName) => {
    setModals({ ...modals, [modalName]: false });
    setEditingItem(null);
  };

  // Sauvegarder vaccination
  const handleSaveVaccination = async (data) => {
    try {
      if (editingItem) {
        // Mise à jour
        const { error } = await supabase
          .from('vaccinations')
          .update({
            vaccine_name: data.name,
            vaccination_date: new Date(data.lastDate).toISOString().split('T')[0],
            next_due_date: data.nextDate ? new Date(data.nextDate).toISOString().split('T')[0] : null,
            veterinarian: data.veterinarian,
            notes: data.notes
          })
          .eq('id', editingItem.id);

        if (error) throw error;

        setVaccinations(vaccinations.map(v => 
          v.id === editingItem.id ? { ...data, id: v.id } : v
        ));
      } else {
        // Création
        const { data: newVac, error } = await supabase
          .from('vaccinations')
          .insert([{
            dog_id: currentProfile.id,
            vaccine_name: data.name,
            vaccination_date: new Date(data.lastDate).toISOString().split('T')[0],
            next_due_date: data.nextDate ? new Date(data.nextDate).toISOString().split('T')[0] : null,
            veterinarian: data.veterinarian,
            notes: data.notes
          }])
          .select()
          .single();

        if (error) throw error;

        setVaccinations([...vaccinations, {
          id: newVac.id,
          name: data.name,
          lastDate: new Date(data.lastDate).toLocaleDateString('fr-FR'),
          nextDate: data.nextDate ? new Date(data.nextDate).toLocaleDateString('fr-FR') : 'Non défini',
          veterinarian: data.veterinarian,
          notes: data.notes
        }]);
      }

      closeModal('vaccination');
    } catch (err) {
      console.error('Erreur sauvegarde vaccination:', err);
      alert('Erreur lors de la sauvegarde de la vaccination');
    }
  };

  const handleDeleteVaccination = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette vaccination ?')) return;

    try {
      const { error } = await supabase
        .from('vaccinations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVaccinations(vaccinations.filter(v => v.id !== id));
    } catch (err) {
      console.error('Erreur suppression vaccination:', err);
      alert('Erreur lors de la suppression');
    }
  };

  // Sauvegarder traitement
  const handleSaveTreatment = async (data, type) => {
    try {
      const treatmentType = type === 'vermifuge' ? 'worm' : 'flea';

      if (editingItem) {
        // Mise à jour
        const { error } = await supabase
          .from('treatments')
          .update({
            product_name: data.product,
            treatment_date: new Date(data.lastDate).toISOString().split('T')[0],
            next_due_date: data.nextDate ? new Date(data.nextDate).toISOString().split('T')[0] : null,
            notes: data.notes,
            treatment_type: treatmentType
          })
          .eq('id', editingItem.id);

        if (error) throw error;

        setTreatments(treatments.map(t => 
          t.id === editingItem.id ? { ...data, id: t.id, type: treatmentType } : t
        ));
      } else {
        // Création
        const { data: newTreat, error } = await supabase
          .from('treatments')
          .insert([{
            dog_id: currentProfile.id,
            product_name: data.product,
            treatment_date: new Date(data.lastDate).toISOString().split('T')[0],
            next_due_date: data.nextDate ? new Date(data.nextDate).toISOString().split('T')[0] : null,
            notes: data.notes,
            treatment_type: treatmentType
          }])
          .select()
          .single();

        if (error) throw error;

        setTreatments([...treatments, {
          id: newTreat.id,
          product: data.product,
          lastDate: new Date(data.lastDate).toLocaleDateString('fr-FR'),
          nextDate: data.nextDate ? new Date(data.nextDate).toLocaleDateString('fr-FR') : 'Non défini',
          notes: data.notes,
          type: treatmentType
        }]);
      }

      closeModal(type);
    } catch (err) {
      console.error('Erreur sauvegarde traitement:', err);
      alert('Erreur lors de la sauvegarde du traitement');
    }
  };

  const handleDeleteTreatment = async (id, type) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce traitement ?')) return;

    try {
      const { error } = await supabase
        .from('treatments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTreatments(treatments.filter(t => t.id !== id));
    } catch (err) {
      console.error('Erreur suppression traitement:', err);
      alert('Erreur lors de la suppression');
    }
  };

  // Sauvegarder poids
  const handleSaveWeight = async (data) => {
    try {
      const { data: newWeight, error } = await supabase
        .from('weight_records')
        .insert([{
          dog_id: currentProfile.id,
          weight: parseFloat(data.weight),
          measurement_date: new Date(data.date).toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (error) throw error;

      setWeightData([...weightData, {
        date: new Date(data.date).toLocaleDateString('fr-FR'),
        weight: parseFloat(data.weight)
      }]);

      closeModal('weight');
    } catch (err) {
      console.error('Erreur sauvegarde poids:', err);
      alert('Erreur lors de la sauvegarde du poids');
    }
  };

  // Sauvegarder profil
  const handleSaveProfile = async (data) => {
    try {
      const { error } = await supabase
        .from('dogs')
        .update({
          name: data.name,
          breed: data.breed,
          gender: data.gender,
          weight: parseFloat(data.weight.replace(' kg', '')),
          is_sterilized: data.sterilized === 'Stérilisé',
          notes: data.notes,
          microchip_number: data.microchip_number
        })
        .eq('id', currentProfile.id);

      if (error) throw error;

      setCurrentProfile(data);
      setDogProfiles(dogProfiles.map(dog => 
        dog.id === currentProfile.id ? data : dog
      ));

      closeModal('editProfile');
    } catch (err) {
      console.error('Erreur sauvegarde profil:', err);
      alert('Erreur lors de la sauvegarde du profil');
    }
  };

  const handleExportPDF = () => {
    alert('Fonctionnalité d\'export PDF en cours de développement. Le fichier PDF sera généré avec toutes les informations de santé de ' + currentProfile?.name + '.');
  };

  const tabs = [
    { id: 'vaccinations', label: 'Vaccinations', icon: 'Syringe' },
    { id: 'vermifuge', label: 'Vermifuge', icon: 'Pill' },
    { id: 'flea', label: 'Anti-puces', icon: 'Bug' },
    { id: 'weight', label: 'Poids', icon: 'TrendingUp' },
    { id: 'notes', label: 'Notes médicales', icon: 'FileText' }
  ];

  // Filtrer les traitements par type
  const vermifuges = treatments.filter(t => t.type === 'worm');
  const fleaTreatments = treatments.filter(t => t.type === 'flea' || t.type === 'tick');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-background">
        <TabNavigation />
        <div className="main-content">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
                <span className="text-3xl">🐕</span>
              </div>
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                Aucun chien enregistré
              </h3>
              <p className="text-muted-foreground mb-4">
                Ajoutez votre premier chien pour commencer
              </p>
              <Button
                variant="default"
                onClick={() => navigate('/multi-profile-management')}
              >
                Ajouter un chien
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TabNavigation />
      <div className="main-content">
        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
          <div className="flex items-center justify-between mb-6">
            <ProfileSwitcher
              profiles={dogProfiles}
              currentProfile={currentProfile}
              onProfileChange={setCurrentProfile}
            />

            <Button
              variant="outline"
              iconName="Download"
              iconPosition="left"
              onClick={handleExportPDF}
            >
              Exporter PDF
            </Button>
          </div>

          <ProfileHeader
            profile={currentProfile}
            onEdit={() => openModal('editProfile')}
            onGallery={() => openModal('gallery')}
          />

          <div className="mt-6">
            <div className="bg-card rounded-lg shadow-soft overflow-hidden">
              <div className="border-b border-border overflow-x-auto">
                <div className="flex min-w-max">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-4 font-medium transition-smooth border-b-2 ${
                        activeTab === tab.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon name={tab.icon} size={20} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'vaccinations' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-heading font-semibold text-foreground mb-1">
                          Vaccinations
                        </h3>
                        <p className="text-sm text-muted-foreground font-caption">
                          Gérez le calendrier vaccinal de {currentProfile.name}
                        </p>
                      </div>
                      <Button
                        variant="default"
                        iconName="Plus"
                        iconPosition="left"
                        onClick={() => openModal('vaccination')}
                      >
                        Ajouter
                      </Button>
                    </div>

                    {vaccinations.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <Icon name="Syringe" size={32} color="var(--color-muted-foreground)" />
                        </div>
                        <p className="text-muted-foreground font-caption mb-4">
                          Aucune vaccination enregistrée
                        </p>
                        <Button
                          variant="default"
                          iconName="Plus"
                          iconPosition="left"
                          onClick={() => openModal('vaccination')}
                        >
                          Ajouter une vaccination
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {vaccinations.map((vaccination) => (
                          <VaccinationCard
                            key={vaccination.id}
                            vaccination={vaccination}
                            onEdit={(item) => openModal('vaccination', item)}
                            onDelete={handleDeleteVaccination}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'vermifuge' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-heading font-semibold text-foreground mb-1">
                          Vermifuge
                        </h3>
                        <p className="text-sm text-muted-foreground font-caption">
                          Suivez les traitements antiparasitaires internes
                        </p>
                      </div>
                      <Button
                        variant="default"
                        iconName="Plus"
                        iconPosition="left"
                        onClick={() => openModal('vermifuge')}
                      >
                        Ajouter
                      </Button>
                    </div>

                    {vermifuges.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <Icon name="Pill" size={32} color="var(--color-muted-foreground)" />
                        </div>
                        <p className="text-muted-foreground font-caption mb-4">
                          Aucun traitement vermifuge enregistré
                        </p>
                        <Button
                          variant="default"
                          iconName="Plus"
                          iconPosition="left"
                          onClick={() => openModal('vermifuge')}
                        >
                          Ajouter un traitement
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {vermifuges.map((treatment) => (
                          <TreatmentCard
                            key={treatment.id}
                            treatment={treatment}
                            type="vermifuge"
                            onEdit={(item) => openModal('vermifuge', item)}
                            onDelete={(id) => handleDeleteTreatment(id, 'vermifuge')}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'flea' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-heading font-semibold text-foreground mb-1">
                          Anti-puces et tiques
                        </h3>
                        <p className="text-sm text-muted-foreground font-caption">
                          Gérez les traitements antiparasitaires externes
                        </p>
                      </div>
                      <Button
                        variant="default"
                        iconName="Plus"
                        iconPosition="left"
                        onClick={() => openModal('flea')}
                      >
                        Ajouter
                      </Button>
                    </div>

                    {fleaTreatments.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <Icon name="Bug" size={32} color="var(--color-muted-foreground)" />
                        </div>
                        <p className="text-muted-foreground font-caption mb-4">
                          Aucun traitement anti-puces enregistré
                        </p>
                        <Button
                          variant="default"
                          iconName="Plus"
                          iconPosition="left"
                          onClick={() => openModal('flea')}
                        >
                          Ajouter un traitement
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {fleaTreatments.map((treatment) => (
                          <TreatmentCard
                            key={treatment.id}
                            treatment={treatment}
                            type="flea"
                            onEdit={(item) => openModal('flea', item)}
                            onDelete={(id) => handleDeleteTreatment(id, 'flea')}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'weight' && (
                  <WeightChart
                    data={weightData}
                    onAddWeight={() => openModal('weight')}
                  />
                )}

                {activeTab === 'notes' && (
                  <HealthNotesSection
                    notes={healthNotes}
                    onSave={setHealthNotes}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddVaccinationModal
        isOpen={modals.vaccination}
        onClose={() => closeModal('vaccination')}
        onSave={handleSaveVaccination}
        editData={editingItem}
      />

      <AddTreatmentModal
        isOpen={modals.vermifuge}
        onClose={() => closeModal('vermifuge')}
        onSave={(data) => handleSaveTreatment(data, 'vermifuge')}
        editData={editingItem}
        type="vermifuge"
      />

      <AddTreatmentModal
        isOpen={modals.flea}
        onClose={() => closeModal('flea')}
        onSave={(data) => handleSaveTreatment(data, 'flea')}
        editData={editingItem}
        type="flea"
      />

      <AddWeightModal
        isOpen={modals.weight}
        onClose={() => closeModal('weight')}
        onSave={handleSaveWeight}
      />

      <EditProfileModal
        isOpen={modals.editProfile}
        onClose={() => closeModal('editProfile')}
        onSave={handleSaveProfile}
        profile={currentProfile}
      />

      <PhotoGalleryModal
        isOpen={modals.gallery}
        onClose={() => closeModal('gallery')}
        photos={photoGallery}
        onAddPhoto={() => alert('Fonctionnalité d\'ajout de photo en cours de développement')}
      />
    </div>
  );
};

export default DogProfile;
