import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TabNavigation from '../../components/TabNavigation';
import UserMenu from '../../components/UserMenu';
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
import Footer from '../../components/Footer';

const DogProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('vaccinations');
  const [loading, setLoading] = useState(true);

  // États pour les données
  const [dogProfiles, setDogProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
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
            notes: dog.notes,
            cover_photo_url: dog.cover_photo_url || null  // ✅ AJOUTÉ: Mapping cover photo
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

  // Charger les vaccinations
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

  // Charger les traitements
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
          type: treat.treatment_type
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

  // ✅ NOUVEAU : Charger la galerie photos
  useEffect(() => {
    if (!currentProfile?.id) return;

    const fetchPhotos = async () => {
      try {
        const { data, error } = await supabase
          .from('dog_photos')
          .select('*')
          .eq('dog_id', currentProfile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setPhotoGallery(data || []);
      } catch (err) {
        console.error('Erreur chargement photos:', err);
      }
    };

    fetchPhotos();
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

  // ✅ NOUVEAU : Définir une photo comme photo de profil
  const handleSetProfilePhoto = async (photoUrl) => {
    try {
      // Mettre à jour dans la base de données
      const { error } = await supabase
        .from('dogs')
        .update({ photo_url: photoUrl })
        .eq('id', currentProfile.id);

      if (error) throw error;

      // Mettre à jour l'état local
      setCurrentProfile({
        ...currentProfile,
        image: photoUrl
      });

      // Mettre à jour dans la liste des profils
      setDogProfiles(dogProfiles.map(dog => 
        dog.id === currentProfile.id 
          ? { ...dog, image: photoUrl }
          : dog
      ));

    } catch (err) {
      console.error('Erreur mise à jour photo de profil:', err);
      alert('❌ Erreur lors de la mise à jour de la photo de profil');
    }
  };

  // ✅ NOUVEAU : Upload cover photo pour le chien
  const handleCoverPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      console.log('Aucun fichier sélectionné');
      return;
    }

    // Validation
    if (!file.name || typeof file.name !== 'string') {
      alert('⚠️ Fichier invalide');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('⚠️ L\'image est trop volumineuse (max 5MB)');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('⚠️ Format non supporté. Utilisez JPG, PNG ou WEBP');
      return;
    }

    setIsUploadingCover(true);

    try {
      // 1. Upload vers Storage
      const fileExt = file.name.split('.').pop().toLowerCase();
      const fileName = `${user.id}/${currentProfile.id}/cover_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('dog-photos')
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          alert('⚠️ Le bucket de stockage n\'existe pas.\n\n📋 Instructions:\n1. Va dans Supabase > Storage\n2. Crée un bucket "dog-photos"\n3. Coche "Public bucket"\n4. Réessaye');
          return;
        }
        throw uploadError;
      }

      // 2. Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('dog-photos')
        .getPublicUrl(fileName);

      // 3. Mettre à jour dans la DB
      const { error: dbError } = await supabase
        .from('dogs')
        .update({ cover_photo_url: publicUrl })
        .eq('id', currentProfile.id);

      if (dbError) throw dbError;

      // 4. Mettre à jour l'état local
      setCurrentProfile({
        ...currentProfile,
        cover_photo_url: publicUrl
      });

      // 5. Mettre à jour dans la liste des profils
      setDogProfiles(dogProfiles.map(dog => 
        dog.id === currentProfile.id 
          ? { ...dog, cover_photo_url: publicUrl }
          : dog
      ));
      
      alert('✅ Photo de couverture mise à jour !');
      e.target.value = '';
    } catch (err) {
      console.error('Erreur upload cover:', err);
      alert('❌ Erreur lors de l\'upload: ' + err.message);
    } finally {
      setIsUploadingCover(false);
    }
  };

  // ✅ CORRIGÉ : Upload photo fonctionnel avec gestion d'erreurs
  const handleAddPhoto = async (file) => {
    // Vérifications de sécurité
    if (!file) {
      alert('⚠️ Aucun fichier sélectionné');
      return;
    }

    if (!file.name || typeof file.name !== 'string') {
      alert('⚠️ Fichier invalide');
      return;
    }

    // Vérifier taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('⚠️ L\'image est trop volumineuse (max 5MB)');
      return;
    }

    // Vérifier type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('⚠️ Format non supporté. Utilisez JPG, PNG ou WEBP');
      return;
    }

    try {
      // 1. Upload vers Storage
      const fileExt = file.name.split('.').pop().toLowerCase();
      const fileName = `${user.id}/${currentProfile.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('dog-photos')
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // Si le bucket n'existe pas
        if (uploadError.message.includes('Bucket not found')) {
          alert('⚠️ Le bucket de stockage n\'existe pas.\n\n📋 Instructions:\n1. Va dans Supabase > Storage\n2. Crée un bucket "dog-photos"\n3. Coche "Public bucket"\n4. Réessaye');
          return;
        }
        throw uploadError;
      }

      // 2. Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('dog-photos')
        .getPublicUrl(fileName);

      // 3. Enregistrer dans la DB
      const { data: newPhoto, error: dbError } = await supabase
        .from('dog_photos')
        .insert([{
          dog_id: currentProfile.id,
          photo_url: publicUrl,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (dbError) {
        // Si la table n'existe pas
        if (dbError.message.includes('relation "dog_photos" does not exist')) {
          alert('⚠️ La table dog_photos n\'existe pas.\n\n📋 Exécute le SQL:\n' + 
                'CREATE TABLE dog_photos (\n' +
                '  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n' +
                '  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,\n' +
                '  photo_url TEXT NOT NULL,\n' +
                '  created_at TIMESTAMP DEFAULT NOW()\n' +
                ');');
          return;
        }
        throw dbError;
      }

      // 4. Mettre à jour la galerie
      setPhotoGallery([newPhoto, ...photoGallery]);
      
      alert('✅ Photo ajoutée avec succès !');
    } catch (err) {
      console.error('Erreur upload photo:', err);
      alert('❌ Erreur lors de l\'upload: ' + err.message);
    }
  };

  // ✅ NOUVEAU : Export PDF avec nom du chien
  const handleExportPDF = () => {
    alert(`📄 Export PDF en développement\n\nLe fichier "${currentProfile.name}_fiche_sante.pdf" sera généré avec:\n\n✅ Vaccinations\n✅ Traitements\n✅ Courbe de poids\n✅ Notes médicales\n✅ Informations du chien`);
  };

  const handleProfileChange = (profile) => {
    setCurrentProfile(profile);
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header avec UserMenu + Export PDF */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-heading font-semibold text-foreground">
              Profil de {currentProfile.name}
            </h1>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                iconName="Download"
                iconPosition="left"
                onClick={handleExportPDF}
                className="hidden sm:flex"
              >
                Exporter fiche
              </Button>
              <UserMenu
                dogProfiles={dogProfiles}
                currentDog={currentProfile}
                onDogChange={handleProfileChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ✅ NOUVEAU : Bandeau Cover Photo style Facebook */}
      <div className="relative">
        {/* Cover Photo */}
        <div className="relative h-80 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
          {currentProfile.cover_photo_url ? (
            <img
              src={currentProfile.cover_photo_url}
              alt={`Couverture de ${currentProfile.name}`}
              className="w-full h-full object-cover object-center"
              style={{ objectPosition: 'center 30%' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30">
              <Icon name="Image" size={64} />
            </div>
          )}
          
          {/* Bouton modifier cover */}
          <label 
            htmlFor="cover-photo-upload-input"
            className="absolute bottom-4 right-4 z-10 bg-white/90 hover:bg-white px-4 py-2 rounded-lg cursor-pointer shadow-lg transition-smooth flex items-center gap-2"
          >
            <Icon name="Camera" size={18} />
            <span className="font-medium text-sm">
              {isUploadingCover ? 'Upload...' : 'Modifier la couverture'}
            </span>
            <input
              id="cover-photo-upload-input"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleCoverPhotoUpload}
              className="hidden"
              disabled={isUploadingCover}
            />
          </label>
        </div>

        {/* Avatar + Infos chien (par-dessus le bandeau) */}
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="flex items-end gap-4 -mt-16 pb-6">
            {/* Avatar du chien */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-card bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden shadow-xl">
                {currentProfile.image ? (
                  <img
                    src={currentProfile.image}
                    alt={currentProfile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                    {currentProfile.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Bouton modifier photo profil */}
              <button
                onClick={() => openModal('gallery')}
                className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 text-white p-3 rounded-full cursor-pointer shadow-lg transition-smooth"
              >
                <Icon name="Camera" size={20} />
              </button>
            </div>

            {/* Infos chien */}
            <div className="flex-1 pb-2">
              <h2 className="text-3xl font-heading font-bold text-foreground">
                {currentProfile.name}
              </h2>
              <div className="flex items-center gap-4 text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Icon name="Dog" size={16} />
                  {currentProfile.breed}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="Calendar" size={16} />
                  {currentProfile.age || calculateAge(currentProfile.birthdate)}
                </span>
                <span className="flex items-center gap-1">
                  {currentProfile.gender === 'male' ? (
                    <>
                      <Icon name="Mars" size={16} />
                      Mâle
                    </>
                  ) : (
                    <>
                      <Icon name="Venus" size={16} />
                      Femelle
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TabNavigation />
      
      <main className="main-content flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
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
        profile={currentProfile}
      />
     
      {/* ✅ CORRIGÉ: PhotoGalleryModal avec sélection de photo de profil */}
      <PhotoGalleryModal
        isOpen={modals.gallery}
        onClose={() => closeModal('gallery')}
        photos={photoGallery}
        onAddPhoto={handleAddPhoto}
        currentProfilePhotoUrl={currentProfile?.image}
        onSetProfilePhoto={handleSetProfilePhoto}
      />

      <Footer />
    </div>
  );
};

export default DogProfile;
