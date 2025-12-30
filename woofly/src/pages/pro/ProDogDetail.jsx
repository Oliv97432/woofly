import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TabNavigationPro from '../../components/TabNavigationPro';
import UserMenu from '../../components/UserMenu';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import VaccinationCard from '../dog-profile/components/VaccinationCard';
import TreatmentCard from '../dog-profile/components/TreatmentCard';
import WeightChart from '../dog-profile/components/WeightChart';
import HealthNotesSection from '../dog-profile/components/HealthNotesSection';
import AddVaccinationModal from '../dog-profile/components/AddVaccinationModal';
import AddTreatmentModal from '../dog-profile/components/AddTreatmentModal';
import AddWeightModal from '../dog-profile/components/AddWeightModal';
import EditProfileModal from '../dog-profile/components/EditProfileModal';
import PhotoGalleryModal from '../dog-profile/components/PhotoGalleryModal';
import Footer from '../../components/Footer';
import { ArrowLeft } from 'lucide-react';

const ProDogDetail = () => {
  const { dogId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('vaccinations');
  const [loading, setLoading] = useState(true);
  const [proAccount, setProAccount] = useState(null);

  const [dog, setDog] = useState(null);
  const [vaccinations, setVaccinations] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [weightData, setWeightData] = useState([]);
  const [healthNotes, setHealthNotes] = useState({
    allergies: '',
    medications: '',
    veterinaryNotes: '',
    veterinarian: '',
    veterinarianPhone: ''
  });
  const [photoGallery, setPhotoGallery] = useState([]);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [modals, setModals] = useState({
    vaccination: false,
    vermifuge: false,
    flea: false,
    weight: false,
    editProfile: false,
    gallery: false
  });

  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

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
        console.error('Erreur chargement compte pro:', err);
      }
    };

    fetchProAccount();
  }, [user?.id]);

  useEffect(() => {
    if (!dogId || !proAccount?.id) return;

    const fetchDog = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('dogs')
          .select('*')
          .eq('id', dogId)
          .eq('professional_account_id', proAccount.id)
          .single();

        if (error) throw error;

        const birthDate = new Date(data.birth_date);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        setDog({
          id: data.id,
          name: data.name,
          breed: data.breed || 'Race inconnue',
          age: age > 0 ? `${age} an${age > 1 ? 's' : ''}` : 'Moins d\'un an',
          weight: data.weight ? `${data.weight} kg` : 'Non renseigné',
          gender: data.gender || 'Non renseigné',
          sterilized: data.is_sterilized ? 'Stérilisé' : 'Non stérilisé',
          image: data.photo_url || 'https://images.pexels.com/photos/1490908/pexels-photo-1490908.jpeg',
          imageAlt: `${data.name} - ${data.breed}`,
          microchip_number: data.microchip_number,
          notes: data.notes,
          cover_photo_url: data.cover_photo_url || null,
          adoption_status: data.adoption_status,
          is_for_adoption: data.is_for_adoption
        });
      } catch (err) {
        console.error('Erreur chargement chien:', err);
        alert('Erreur lors du chargement du chien');
        navigate('/pro/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDog();
  }, [dogId, proAccount?.id, navigate]);

  useEffect(() => {
    if (!dogId) return;

    const fetchVaccinations = async () => {
      try {
        const { data, error } = await supabase
          .from('vaccinations')
          .select('*')
          .eq('dog_id', dogId)
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
  }, [dogId]);

  useEffect(() => {
    if (!dogId) return;

    const fetchTreatments = async () => {
      try {
        const { data, error } = await supabase
          .from('treatments')
          .select('*')
          .eq('dog_id', dogId)
          .order('next_due_date', { ascending: true });

        if (error) throw error;

        const formatted = data.map(treat => ({
          id: treat.id,
          product: treat.product_name,
          lastDate: new Date(treat.treatment_date).toLocaleDateString('fr-FR'),
          nextDate: treat.next_due_date ? new Date(treat.next_due_date).toLocaleDateString('fr-FR') : 'Non défini',
          notes: treat.notes,
          type: treat.treatment_type
        }));

        setTreatments(formatted);
      } catch (err) {
        console.error('Erreur chargement traitements:', err);
      }
    };

    fetchTreatments();
  }, [dogId]);

  useEffect(() => {
    if (!dogId) return;

    const fetchWeight = async () => {
      try {
        const { data, error } = await supabase
          .from('weight_records')
          .select('*')
          .eq('dog_id', dogId)
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
  }, [dogId]);

  useEffect(() => {
    if (!dogId) return;

    const fetchHealthNotes = async () => {
      try {
        const { data, error } = await supabase
          .from('health_notes')
          .select('*')
          .eq('dog_id', dogId)
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
  }, [dogId]);

  useEffect(() => {
    if (!dogId) return;

    const fetchPhotos = async () => {
      try {
        const { data, error } = await supabase
          .from('dog_photos')
          .select('*')
          .eq('dog_id', dogId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setPhotoGallery(data || []);
      } catch (err) {
        console.error('Erreur chargement photos:', err);
      }
    };

    fetchPhotos();
  }, [dogId]);

  const openModal = (modalName, item = null) => {
    setEditingItem(item);
    setModals({ ...modals, [modalName]: true });
  };

  const closeModal = (modalName) => {
    setModals({ ...modals, [modalName]: false });
    setEditingItem(null);
  };

  const handleSaveVaccination = async (data) => {
    try {
      if (editingItem) {
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
        const { data: newVac, error } = await supabase
          .from('vaccinations')
          .insert([{
            dog_id: dogId,
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

  const handleSaveTreatment = async (data, type) => {
    try {
      const treatmentType = type === 'vermifuge' ? 'worm' : 'flea';

      if (editingItem) {
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
        const { data: newTreat, error } = await supabase
          .from('treatments')
          .insert([{
            dog_id: dogId,
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

  const handleDeleteTreatment = async (id) => {
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

  const handleSaveWeight = async (data) => {
    try {
      const { data: newWeight, error } = await supabase
        .from('weight_records')
        .insert([{
          dog_id: dogId,
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
        .eq('id', dogId);

      if (error) throw error;

      setDog(data);
      closeModal('editProfile');
      alert('✅ Profil mis à jour !');
    } catch (err) {
      console.error('Erreur sauvegarde profil:', err);
      alert('Erreur lors de la sauvegarde du profil');
    }
  };

  const handleSetProfilePhoto = async (photoUrl) => {
    try {
      const { error } = await supabase
        .from('dogs')
        .update({ photo_url: photoUrl })
        .eq('id', dogId);

      if (error) throw error;

      setDog({ ...dog, image: photoUrl });
      alert('✅ Photo de profil mise à jour !');
    } catch (err) {
      console.error('Erreur mise à jour photo de profil:', err);
      alert('❌ Erreur lors de la mise à jour de la photo de profil');
    }
  };

  const handleCoverPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('⚠️ L\'image est trop volumineuse (max 5MB)');
      return;
    }

    setIsUploadingCover(true);

    try {
      const fileExt = file.name.split('.').pop().toLowerCase();
      const fileName = `${user.id}/${dogId}/cover_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('dog-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('dog-photos')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('dogs')
        .update({ cover_photo_url: publicUrl })
        .eq('id', dogId);

      if (dbError) throw dbError;

      setDog({ ...dog, cover_photo_url: publicUrl });
      alert('✅ Photo de couverture mise à jour !');
      e.target.value = '';
    } catch (err) {
      console.error('Erreur upload cover:', err);
      alert('❌ Erreur lors de l\'upload: ' + err.message);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleAddPhoto = async (file) => {
    if (!file || file.size > 5 * 1024 * 1024) {
      alert('⚠️ Fichier invalide ou trop volumineux');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop().toLowerCase();
      const fileName = `${user.id}/${dogId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('dog-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('dog-photos')
        .getPublicUrl(fileName);

      const { data: newPhoto, error: dbError } = await supabase
        .from('dog_photos')
        .insert([{
          dog_id: dogId,
          photo_url: publicUrl,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      setPhotoGallery([newPhoto, ...photoGallery]);
      alert('✅ Photo ajoutée avec succès !');
    } catch (err) {
      console.error('Erreur upload photo:', err);
      alert('❌ Erreur lors de l\'upload: ' + err.message);
    }
  };

  const handleExportPDF = () => {
    alert(`📄 Export PDF en développement\n\nLe fichier "${dog?.name}_fiche_sante.pdf" sera généré`);
  };

  const tabs = [
    { id: 'vaccinations', label: 'Vaccinations', icon: 'Syringe' },
    { id: 'vermifuge', label: 'Vermifuge', icon: 'Pill' },
    { id: 'flea', label: 'Anti-puces', icon: 'Bug' },
    { id: 'weight', label: 'Poids', icon: 'TrendingUp' },
    { id: 'notes', label: 'Notes médicales', icon: 'FileText' }
  ];

  const vermifuges = treatments.filter(t => t.type === 'worm');
  const fleaTreatments = treatments.filter(t => t.type === 'flea' || t.type === 'tick');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!dog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Chien non trouvé</p>
          <Button onClick={() => navigate('/pro/dashboard')}>
            Retour au dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/pro/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-smooth"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-lg sm:text-2xl font-heading font-semibold text-foreground truncate">
                {dog.name}
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                iconName="Download"
                onClick={handleExportPDF}
                className="hidden sm:flex"
                size="sm"
              >
                Exporter fiche
              </Button>
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="relative h-48 sm:h-64 md:h-80 bg-gradient-to-br from-green-500 to-teal-600 overflow-hidden">
          {dog.cover_photo_url ? (
            <img
              src={dog.cover_photo_url}
              alt={`Couverture de ${dog.name}`}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30">
              <Icon name="Image" size={48} />
            </div>
          )}
          
          <label 
            htmlFor="cover-photo-upload"
            className="absolute bottom-4 right-4 bg-white/90 hover:bg-white px-4 py-2 rounded-lg cursor-pointer shadow-lg transition-smooth flex items-center gap-2"
          >
            <Icon name="Camera" size={16} />
            <span className="font-medium text-sm">
              {isUploadingCover ? 'Upload...' : 'Modifier couverture'}
            </span>
            <input
              id="cover-photo-upload"
              type="file"
              accept="image/*"
              onChange={handleCoverPhotoUpload}
              className="hidden"
              disabled={isUploadingCover}
            />
          </label>
        </div>

        <div className="relative max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-end gap-4 -mt-16 pb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-card bg-gradient-to-br from-green-500 to-teal-600 overflow-hidden shadow-xl">
                {dog.image ? (
                  <img src={dog.image} alt={dog.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                    {dog.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => openModal('gallery')}
                className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 text-white p-3 rounded-full shadow-lg transition-smooth"
              >
                <Icon name="Camera" size={20} />
              </button>
            </div>

            <div className="flex-1 pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-heading font-bold text-foreground">{dog.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm mt-1">
                    <span className="flex items-center gap-1">
                      <Icon name="Dog" size={16} />
                      {dog.breed}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Icon name="Calendar" size={16} />
                      {dog.age}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {dog.gender === 'male' ? (
                        <><Icon name="Mars" size={16} /> Mâle</>
                      ) : (
                        <><Icon name="Venus" size={16} /> Femelle</>
                      )}
                    </span>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  iconName="Edit"
                  onClick={() => openModal('editProfile')}
                  size="sm"
                >
                  Modifier
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TabNavigationPro />
      
      <main className="main-content flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
          <div className="bg-card rounded-xl shadow-soft overflow-hidden">
            <div className="border-b border-border overflow-x-auto">
              <div className="flex min-w-max">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-smooth border-b-2 ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon name={tab.icon} size={20} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'vaccinations' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-heading font-semibold">Vaccinations</h3>
                      <p className="text-sm text-muted-foreground">
                        Gérez le calendrier vaccinal de {dog.name}
                      </p>
                    </div>
                    <Button
                      variant="default"
                      iconName="Plus"
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
                      <p className="text-muted-foreground mb-4">Aucune vaccination enregistrée</p>
                      <Button
                        variant="default"
                        iconName="Plus"
                        onClick={() => openModal('vaccination')}
                      >
                        Ajouter une vaccination
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <h3 className="text-xl font-heading font-semibold">Vermifuge</h3>
                      <p className="text-sm text-muted-foreground">
                        Suivez les traitements antiparasitaires internes
                      </p>
                    </div>
                    <Button
                      variant="default"
                      iconName="Plus"
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
                      <p className="text-muted-foreground mb-4">Aucun traitement vermifuge enregistré</p>
                      <Button
                        variant="default"
                        iconName="Plus"
                        onClick={() => openModal('vermifuge')}
                      >
                        Ajouter un traitement
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vermifuges.map((treatment) => (
                        <TreatmentCard
                          key={treatment.id}
                          treatment={treatment}
                          type="vermifuge"
                          onEdit={(item) => openModal('vermifuge', item)}
                          onDelete={handleDeleteTreatment}
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
                      <h3 className="text-xl font-heading font-semibold">Anti-puces et tiques</h3>
                      <p className="text-sm text-muted-foreground">
                        Gérez les traitements antiparasitaires externes
                      </p>
                    </div>
                    <Button
                      variant="default"
                      iconName="Plus"
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
                      <p className="text-muted-foreground mb-4">Aucun traitement anti-puces enregistré</p>
                      <Button
                        variant="default"
                        iconName="Plus"
                        onClick={() => openModal('flea')}
                      >
                        Ajouter un traitement
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {fleaTreatments.map((treatment) => (
                        <TreatmentCard
                          key={treatment.id}
                          treatment={treatment}
                          type="flea"
                          onEdit={(item) => openModal('flea', item)}
                          onDelete={handleDeleteTreatment}
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
      </main>

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
        profile={dog}
      />
     
      <PhotoGalleryModal
        isOpen={modals.gallery}
        onClose={() => closeModal('gallery')}
        photos={photoGallery}
        onAddPhoto={handleAddPhoto}
        currentProfilePhotoUrl={dog?.image}
        onSetProfilePhoto={handleSetProfilePhoto}
      />

      <Footer />
    </div>
  );
};

export default ProDogDetail;
