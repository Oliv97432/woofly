import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TabNavigationPro from '../../components/TabNavigationPro';
import UserMenuPro from '../../components/UserMenuPro';
import Icon from '../../components/AppIcon';
import VaccinationCard from '../dog-profile/components/VaccinationCard';
import TreatmentCard from '../dog-profile/components/TreatmentCard';
import WeightChart from '../dog-profile/components/WeightChart';
import HealthNotesSection from '../dog-profile/components/HealthNotesSection';
import AddVaccinationModal from '../dog-profile/components/AddVaccinationModal';
import AddTreatmentModal from '../dog-profile/components/AddTreatmentModal';
import AddWeightModal from '../dog-profile/components/AddWeightModal';
import EditProfileModal from '../dog-profile/components/EditProfileModal';
import PhotoGalleryModal from '../dog-profile/components/PhotoGalleryModal';
import PlaceFAModal from '../../components/pro/PlaceFAModal';
import TransferToAdopterModal from '../../components/pro/TransferToAdopterModal';
import { ArrowLeft, Home, User, ArrowRight } from 'lucide-react';

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
  
  // États pour le système de placement
  const [showPlaceFAModal, setShowPlaceFAModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [fosterFamily, setFosterFamily] = useState(null);

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
        console.log('✅ Compte pro chargé:', data.id);
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

        console.log('🐕 Chien chargé:', data.name);
        console.log('📍 foster_family_contact_id:', data.foster_family_contact_id);
        console.log('👤 foster_family_user_id:', data.foster_family_user_id);

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
          is_for_adoption: data.is_for_adoption,
          foster_family_user_id: data.foster_family_user_id,
          foster_family_contact_id: data.foster_family_contact_id
        });

        // ✅ CORRECTION : Passer proAccount.id en paramètre
        if (data.foster_family_contact_id) {
          fetchFosterFamily(data.foster_family_contact_id, proAccount.id);
        } else {
          setFosterFamily(null);
        }
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
            allergies: note.allergies || '',
            medications: note.medications || '',
            veterinaryNotes: note.veterinary_notes || '',
            veterinarian: note.veterinarian || '',
            veterinarianPhone: note.veterinarian_phone || ''
          });
        }
      } catch (err) {
        console.error('Erreur chargement notes médicales:', err);
      }
    };

    fetchHealthNotes();
  }, [dogId]);

  useEffect(() => {
    if (!dogId) return;

    const fetchPhotoGallery = async () => {
      try {
        const { data, error } = await supabase
          .from('dog_photos')
          .select('*')
          .eq('dog_id', dogId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPhotoGallery(data || []);
      } catch (err) {
        console.error('Erreur chargement galerie:', err);
      }
    };

    fetchPhotoGallery();
  }, [dogId]);

  const openModal = (modalName, editData = null) => {
    setEditingItem(editData);
    setModals({ ...modals, [modalName]: true });
  };

  const closeModal = (modalName) => {
    setModals({ ...modals, [modalName]: false });
    setEditingItem(null);
  };

  const handleSaveVaccination = async (vaccinationData) => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('vaccinations')
          .update({
            vaccine_name: vaccinationData.name,
            vaccination_date: vaccinationData.lastDate,
            next_due_date: vaccinationData.nextDate,
            veterinarian: vaccinationData.veterinarian,
            notes: vaccinationData.notes
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        alert('✅ Vaccination mise à jour !');
      } else {
        const { error } = await supabase
          .from('vaccinations')
          .insert([{
            dog_id: dogId,
            vaccine_name: vaccinationData.name,
            vaccination_date: vaccinationData.lastDate,
            next_due_date: vaccinationData.nextDate,
            veterinarian: vaccinationData.veterinarian,
            notes: vaccinationData.notes
          }]);

        if (error) throw error;
        alert('✅ Vaccination ajoutée !');
      }

      closeModal('vaccination');
      window.location.reload();
    } catch (err) {
      console.error('Erreur sauvegarde vaccination:', err);
      alert('❌ Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteVaccination = async (id) => {
    if (!confirm('Supprimer cette vaccination ?')) return;

    try {
      const { error } = await supabase
        .from('vaccinations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('✅ Vaccination supprimée');
      window.location.reload();
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const handleSaveTreatment = async (treatmentData, type) => {
    try {
      const dbType = type === 'vermifuge' ? 'worm' : type === 'flea' ? 'flea' : 'tick';

      if (editingItem) {
        const { error } = await supabase
          .from('treatments')
          .update({
            product_name: treatmentData.product,
            treatment_date: treatmentData.lastDate,
            next_due_date: treatmentData.nextDate,
            notes: treatmentData.notes,
            treatment_type: dbType
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        alert('✅ Traitement mis à jour !');
      } else {
        const { error } = await supabase
          .from('treatments')
          .insert([{
            dog_id: dogId,
            product_name: treatmentData.product,
            treatment_date: treatmentData.lastDate,
            next_due_date: treatmentData.nextDate,
            notes: treatmentData.notes,
            treatment_type: dbType
          }]);

        if (error) throw error;
        alert('✅ Traitement ajouté !');
      }

      closeModal(type);
      window.location.reload();
    } catch (err) {
      console.error('Erreur sauvegarde traitement:', err);
      alert('❌ Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteTreatment = async (id) => {
    if (!confirm('Supprimer ce traitement ?')) return;

    try {
      const { error } = await supabase
        .from('treatments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('✅ Traitement supprimé');
      window.location.reload();
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const handleSaveWeight = async (weightData) => {
    try {
      const { error } = await supabase
        .from('weight_records')
        .insert([{
          dog_id: dogId,
          weight: parseFloat(weightData.weight),
          measurement_date: weightData.date
        }]);

      if (error) throw error;

      await supabase
        .from('dogs')
        .update({ weight: parseFloat(weightData.weight) })
        .eq('id', dogId);

      alert('✅ Poids ajouté !');
      closeModal('weight');
      window.location.reload();
    } catch (err) {
      console.error('Erreur sauvegarde poids:', err);
      alert('❌ Erreur lors de la sauvegarde');
    }
  };

  const handleSaveProfile = async (profileData) => {
    try {
      const { error } = await supabase
        .from('dogs')
        .update({
          name: profileData.name,
          breed: profileData.breed,
          birth_date: profileData.birthDate,
          gender: profileData.gender,
          is_sterilized: profileData.sterilized === 'Stérilisé',
          microchip_number: profileData.microchipNumber,
          notes: profileData.notes
        })
        .eq('id', dogId);

      if (error) throw error;
      alert('✅ Profil mis à jour !');
      closeModal('editProfile');
      window.location.reload();
    } catch (err) {
      console.error('Erreur mise à jour profil:', err);
      alert('❌ Erreur lors de la mise à jour');
    }
  };

  const handleSetProfilePhoto = async (photoUrl) => {
    try {
      const { error } = await supabase
        .from('dogs')
        .update({ photo_url: photoUrl })
        .eq('id', dogId);

      if (error) throw error;
      alert('✅ Photo de profil mise à jour !');
      window.location.reload();
    } catch (err) {
      console.error('Erreur mise à jour photo:', err);
      alert('❌ Erreur lors de la mise à jour');
    }
  };

  const handleCoverPhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      alert('⚠️ Format non supporté. Utilisez JPG, PNG ou WebP');
      return;
    }

    if (file.size > maxSize) {
      alert('⚠️ Fichier trop volumineux (max 5 MB)');
      return;
    }

    try {
      setIsUploadingCover(true);

      const fileExt = file.name.split('.').pop().toLowerCase();
      const fileName = `${user.id}/${dogId}/cover_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('dog-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('dog-photos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('dogs')
        .update({ cover_photo_url: publicUrl })
        .eq('id', dogId);

      if (updateError) throw updateError;

      setDog({ ...dog, cover_photo_url: publicUrl });
      alert('✅ Photo de couverture mise à jour !');
    } catch (err) {
      console.error('Erreur upload couverture:', err);
      alert('❌ Erreur lors de l\'upload: ' + err.message);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleAddPhoto = async (file) => {
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type) || file.size > maxSize) {
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

  // ✅ FONCTION CORRIGÉE : Prend professionalAccountId en paramètre
  const fetchFosterFamily = async (fosterFamilyContactId, professionalAccountId) => {
    if (!fosterFamilyContactId || !professionalAccountId) {
      console.log('❌ Impossible de charger FA - paramètres manquants');
      console.log('   - fosterFamilyContactId:', fosterFamilyContactId);
      console.log('   - professionalAccountId:', professionalAccountId);
      setFosterFamily(null);
      return;
    }
    
    console.log('🔍 Chargement FA:', fosterFamilyContactId, 'pour pro:', professionalAccountId);
    
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', fosterFamilyContactId)
        .eq('professional_account_id', professionalAccountId)
        .single();
      
      if (error) throw error;
      
      console.log('✅ FA chargée:', data.full_name);
      setFosterFamily(data);
    } catch (err) {
      console.error('❌ Erreur chargement FA:', err);
      setFosterFamily(null);
    }
  };

  // Retirer le chien de la famille d'accueil
  const handleReturnFromFA = async () => {
    if (!confirm(`Retirer ${dog.name} de chez ${fosterFamily?.full_name} ?`)) {
      return;
    }

    try {
      console.log('🔄 Début retour au refuge pour chien:', dog.id);
      console.log('📋 FA actuelle (contact):', dog.foster_family_contact_id);
      console.log('📋 FA actuelle (user):', dog.foster_family_user_id);

      // 1. Chercher le placement actif
      const { data: activePlacement, error: findError } = await supabase
        .from('placement_history')
        .select('*')
        .eq('dog_id', dog.id)
        .eq('status', 'active')
        .eq('placement_type', 'foster')
        .maybeSingle();

      if (findError) {
        console.error('❌ Erreur recherche placement:', findError);
        throw findError;
      }

      console.log('📍 Placement actif trouvé:', activePlacement);

      if (activePlacement) {
        // Fermer le placement
        const { error: closeError } = await supabase
          .from('placement_history')
          .update({
            end_date: new Date().toISOString(),
            status: 'completed',
            end_reason: 'returned'
          })
          .eq('id', activePlacement.id);

        if (closeError) {
          console.error('❌ Erreur fermeture placement:', closeError);
          throw closeError;
        }

        console.log('✅ Placement fermé avec succès');

        // Décrémenter le compteur de la FA
        const { data: contact } = await supabase
          .from('contacts')
          .select('current_dogs_count')
          .eq('id', activePlacement.contact_id)
          .single();

        const newCount = Math.max(0, (contact?.current_dogs_count || 1) - 1);

        const { error: decrementError } = await supabase
          .from('contacts')
          .update({ current_dogs_count: newCount })
          .eq('id', activePlacement.contact_id);

        if (decrementError) {
          console.error('❌ Erreur décrémentation compteur:', decrementError);
          throw decrementError;
        }

        console.log('✅ Compteur FA décrémenté:', newCount);
      }

      // 2. Retirer la FA du chien
      const { error: updateError } = await supabase
        .from('dogs')
        .update({ 
          foster_family_user_id: null,
          foster_family_contact_id: null
        })
        .eq('id', dog.id);

      if (updateError) {
        console.error('❌ Erreur mise à jour chien:', updateError);
        throw updateError;
      }

      console.log('✅ Chien mis à jour - retour au refuge');

      alert(`✅ ${dog.name} a été retiré de la famille d'accueil`);
      window.location.reload();
    } catch (err) {
      console.error('💥 Erreur retour FA:', err);
      alert('❌ Erreur lors du retour: ' + err.message);
    }
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
          <button
            onClick={() => navigate('/pro/dashboard')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth"
          >
            Retour au dashboard
          </button>
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
              <button
                onClick={handleExportPDF}
                className="hidden sm:flex px-4 py-2 border-2 border-border rounded-xl font-medium hover:bg-muted items-center gap-2 min-h-[44px]"
              >
                <Icon name="Download" size={16} />
                Exporter fiche
              </button>
              <UserMenuPro />
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
                
                <button
                  onClick={() => openModal('editProfile')}
                  className="px-4 py-2 border-2 border-border rounded-xl font-medium hover:bg-muted flex items-center gap-2 min-h-[44px]"
                >
                  <Icon name="Edit" size={16} />
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Gestion du placement - SECTION CORRIGÉE */}
      {dog && dog.adoption_status !== 'adopted' && proAccount?.id && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-6">
          <div className="bg-card rounded-xl shadow-soft p-6 border border-border">
            
            {/* SI le chien est en FA */}
            {dog.foster_family_contact_id && fosterFamily ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center text-xl font-bold">
                    {fosterFamily.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-purple-700 font-medium">Actuellement en famille d'accueil</p>
                    <p className="text-lg font-bold text-purple-900">{fosterFamily.full_name}</p>
                    {fosterFamily.city && (
                      <p className="text-sm text-purple-600">{fosterFamily.city}</p>
                    )}
                  </div>
                  <Home size={24} className="text-purple-600" />
                </div>

                <button
                  onClick={handleReturnFromFA}
                  className="w-full px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-smooth flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <ArrowRight size={20} className="rotate-180" />
                  Retour du chien au refuge
                </button>
              </div>
            ) : (
              // SI le chien est disponible au refuge
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center">
                    <Home size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-green-700 font-medium">Chien disponible au refuge</p>
                    <p className="text-lg font-bold text-green-900">Prêt pour placement ou transfert</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowPlaceFAModal(true)}
                    className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-smooth flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <Home size={20} />
                    Placer en famille d'accueil
                  </button>

                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="px-6 py-3 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transition-smooth flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <User size={20} />
                    Transférer à un adoptant
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <TabNavigationPro />

      <main className="main-content flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
          <div className="bg-card rounded-xl shadow-soft border border-border">
            <div className="border-b border-border">
              <div className="flex overflow-x-auto">
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
                    <button
                      onClick={() => openModal('vaccination')}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 flex items-center gap-2 min-h-[44px]"
                    >
                      <Icon name="Plus" size={16} />
                      Ajouter
                    </button>
                  </div>

                  {vaccinations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="Syringe" size={32} color="var(--color-muted-foreground)" />
                      </div>
                      <p className="text-muted-foreground mb-4">Aucune vaccination enregistrée</p>
                      <button
                        onClick={() => openModal('vaccination')}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 inline-flex items-center gap-2 min-h-[44px]"
                      >
                        <Icon name="Plus" size={16} />
                        Ajouter une vaccination
                      </button>
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
                    <button
                      onClick={() => openModal('vermifuge')}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 flex items-center gap-2 min-h-[44px]"
                    >
                      <Icon name="Plus" size={16} />
                      Ajouter
                    </button>
                  </div>

                  {vermifuges.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="Pill" size={32} color="var(--color-muted-foreground)" />
                      </div>
                      <p className="text-muted-foreground mb-4">Aucun traitement vermifuge enregistré</p>
                      <button
                        onClick={() => openModal('vermifuge')}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 inline-flex items-center gap-2 min-h-[44px]"
                      >
                        <Icon name="Plus" size={16} />
                        Ajouter un traitement
                      </button>
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
                    <button
                      onClick={() => openModal('flea')}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 flex items-center gap-2 min-h-[44px]"
                    >
                      <Icon name="Plus" size={16} />
                      Ajouter
                    </button>
                  </div>

                  {fleaTreatments.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="Bug" size={32} color="var(--color-muted-foreground)" />
                      </div>
                      <p className="text-muted-foreground mb-4">Aucun traitement anti-puces enregistré</p>
                      <button
                        onClick={() => openModal('flea')}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 inline-flex items-center gap-2 min-h-[44px]"
                      >
                        <Icon name="Plus" size={16} />
                        Ajouter un traitement
                      </button>
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

      {/* Modals de placement */}
      <PlaceFAModal
        isOpen={showPlaceFAModal}
        onClose={() => setShowPlaceFAModal(false)}
        dog={dog}
        proAccount={proAccount}
        onSuccess={() => window.location.reload()}
      />

      <TransferToAdopterModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        dog={dog}
        proAccount={proAccount}
        onSuccess={() => navigate('/pro/dashboard')}
      />
    </div>
  );
};

export default ProDogDetail;
