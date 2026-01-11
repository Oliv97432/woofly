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
import PremiumModal from '../../components/PremiumModal';
import jsPDF from 'jspdf';

const DogProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('vaccinations');
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

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

  // Vérifier statut Premium
  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user?.id) return;

      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();

        const premiumTiers = ['premium', 'professional'];
        setIsPremium(premiumTiers.includes(profile?.subscription_tier));
      } catch (error) {
        console.error('Erreur vérification premium:', error);
      }
    };

    checkPremiumStatus();
  }, [user?.id]);

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
            cover_photo_url: dog.cover_photo_url || null,
            birth_date: dog.birth_date
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

  // Charger la galerie photos
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

  // Définir une photo comme photo de profil
  const handleSetProfilePhoto = async (photoUrl) => {
    try {
      const { error } = await supabase
        .from('dogs')
        .update({ photo_url: photoUrl })
        .eq('id', currentProfile.id);

      if (error) throw error;

      setCurrentProfile({
        ...currentProfile,
        image: photoUrl
      });

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

  // Upload cover photo pour le chien
  const handleCoverPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      console.log('Aucun fichier sélectionné');
      return;
    }

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

      const { data: { publicUrl } } = supabase.storage
        .from('dog-photos')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('dogs')
        .update({ cover_photo_url: publicUrl })
        .eq('id', currentProfile.id);

      if (dbError) throw dbError;

      setCurrentProfile({
        ...currentProfile,
        cover_photo_url: publicUrl
      });

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

  // Upload photo fonctionnel avec gestion d'erreurs
  const handleAddPhoto = async (file) => {
    if (!file) {
      alert('⚠️ Aucun fichier sélectionné');
      return;
    }

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

    try {
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
        if (uploadError.message.includes('Bucket not found')) {
          alert('⚠️ Le bucket de stockage n\'existe pas.\n\n📋 Instructions:\n1. Va dans Supabase > Storage\n2. Crée un bucket "dog-photos"\n3. Coche "Public bucket"\n4. Réessaye');
          return;
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('dog-photos')
        .getPublicUrl(fileName);

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

      setPhotoGallery([newPhoto, ...photoGallery]);
      
      alert('✅ Photo ajoutée avec succès !');
    } catch (err) {
      console.error('Erreur upload photo:', err);
      alert('❌ Erreur lors de l\'upload: ' + err.message);
    }
  };

  // Fonction pour enlever les accents - AMÉLIORÉE
  const removeAccents = (str) => {
    if (!str) return '';
    
    // Étape 1: Normalisation NFD pour séparer les accents
    let normalized = str.normalize('NFD');
    
    // Étape 2: Supprimer les caractères diacritiques (accents)
    normalized = normalized.replace(/[\u0300-\u036f]/g, '');
    
    // Étape 3: Remplacer les caractères spéciaux français
    normalized = normalized
      .replace(/œ/g, 'oe')
      .replace(/æ/g, 'ae')
      .replace(/Œ/g, 'OE')
      .replace(/Æ/g, 'AE')
      .replace(/[€£$¥]/g, '')  // Supprimer les symboles monétaires
      .replace(/[«»]/g, '')     // Supprimer les guillemets français
      .replace(/[^a-zA-Z0-9\s.,;:!?()\-'"\/&@#%+=_]/g, ' ');  // Garder les caractères alphanumériques et ponctuation basique
    
    // Étape 4: Remplacer les espaces multiples par un seul espace
    normalized = normalized.replace(/\s+/g, ' ');
    
    // Étape 5: Nettoyer les espaces en début et fin
    normalized = normalized.trim();
    
    return normalized;
  };

  // Export PDF du carnet de santé - PREMIUM (AVEC FONCTION AMÉLIORÉE)
  const handleExportPDF = async () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    setGeneratingPDF(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Header bleu avec logo
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('WOOFLY', margin, 25);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Carnet de Sante', margin, 38);

      yPos = 60;

      // Infos du chien (avec fonction améliorée)
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text(removeAccents(currentProfile.name), margin, yPos);
      yPos += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      const gender = currentProfile.gender === 'male' ? 'Male' : 'Femelle';
      pdf.text(`${removeAccents(currentProfile.breed)} - ${removeAccents(currentProfile.age)} - ${gender}`, margin, yPos);
      yPos += 6;
      
      if (currentProfile.weight !== 'Non renseigne') {
        pdf.text(`Poids: ${removeAccents(currentProfile.weight)}`, margin, yPos);
        yPos += 6;
      }
      
      if (currentProfile.microchip_number) {
        pdf.text(`Puce: ${removeAccents(currentProfile.microchip_number)}`, margin, yPos);
        yPos += 6;
      }

      pdf.text(`Sterilisation: ${removeAccents(currentProfile.sterilized)}`, margin, yPos);
      yPos += 15;

      // Section Vaccinations
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('vaccinations', margin, yPos);
      yPos += 8;

      if (vaccinations.length === 0) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(150, 150, 150);
        pdf.text('Aucune vaccination enregistree', margin + 5, yPos);
        yPos += 10;
      } else {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        vaccinations.forEach((vac) => {
          if (yPos > pageHeight - 40) {
            pdf.addPage();
            yPos = margin;
          }

          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text(`- ${removeAccents(vac.name)}`, margin + 5, yPos);
          yPos += 5;
          
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(80, 80, 80);
          pdf.text(`  Derniere date: ${vac.lastDate}`, margin + 5, yPos);
          yPos += 5;
          pdf.text(`  Prochaine date: ${vac.nextDate}`, margin + 5, yPos);
          yPos += 5;
          
          if (vac.veterinarian) {
            pdf.text(`  Veterinaire: ${removeAccents(vac.veterinarian)}`, margin + 5, yPos);
            yPos += 5;
          }
          
          yPos += 3;
        });
      }
      yPos += 8;

      // Section Traitements
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = margin;
      }

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('traitements', margin, yPos);
      yPos += 8;

      if (treatments.length === 0) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(150, 150, 150);
        pdf.text('Aucun traitement enregistre', margin + 5, yPos);
        yPos += 10;
      } else {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        treatments.forEach((treat) => {
          if (yPos > pageHeight - 40) {
            pdf.addPage();
            yPos = margin;
          }

          const typeLabel = treat.type === 'worm' ? 'Vermifuge' : 'Anti-puces/tiques';
          
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text(`- ${removeAccents(treat.product)} (${typeLabel})`, margin + 5, yPos);
          yPos += 5;
          
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(80, 80, 80);
          pdf.text(`  Derniere date: ${treat.lastDate}`, margin + 5, yPos);
          yPos += 5;
          pdf.text(`  Prochaine date: ${treat.nextDate}`, margin + 5, yPos);
          yPos += 8;
        });
      }
      yPos += 8;

      // Section Poids
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = margin;
      }

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('EVOLUTION DU POIDS', margin, yPos);
      yPos += 8;

      if (weightData.length === 0) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(150, 150, 150);
        pdf.text('Aucune pesee enregistree', margin + 5, yPos);
        yPos += 10;
      } else {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(80, 80, 80);
        
        // Afficher les 5 dernières pesées
        const recentWeights = weightData.slice(-5);
        recentWeights.forEach((weight) => {
          pdf.text(`- ${weight.date}: ${weight.weight} kg`, margin + 5, yPos);
          yPos += 5;
        });
        
        if (weightData.length > 5) {
          yPos += 3;
          pdf.setFont('helvetica', 'italic');
          pdf.text(`(${weightData.length - 5} autres pesees non affichees)`, margin + 5, yPos);
        }
      }
      yPos += 12;

      // Section Notes médicales
      if (yPos > pageHeight - 80) {
        pdf.addPage();
        yPos = margin;
      }

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('notes médicales', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);

      if (healthNotes.allergies) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Allergies:', margin + 5, yPos);
        yPos += 5;
        pdf.setFont('helvetica', 'normal');
        const allergiesText = pdf.splitTextToSize(removeAccents(healthNotes.allergies), pageWidth - margin * 2 - 10);
        pdf.text(allergiesText, margin + 5, yPos);
        yPos += (allergiesText.length * 5) + 5;
      }

      if (healthNotes.medications) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Medicaments:', margin + 5, yPos);
        yPos += 5;
        pdf.setFont('helvetica', 'normal');
        const medsText = pdf.splitTextToSize(removeAccents(healthNotes.medications), pageWidth - margin * 2 - 10);
        pdf.text(medsText, margin + 5, yPos);
        yPos += (medsText.length * 5) + 5;
      }

      if (healthNotes.veterinarian) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Veterinaire:', margin + 5, yPos);
        yPos += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.text(removeAccents(healthNotes.veterinarian), margin + 5, yPos);
        yPos += 5;
      }

      if (healthNotes.veterinarianPhone) {
        pdf.text(`Telephone: ${removeAccents(healthNotes.veterinarianPhone)}`, margin + 5, yPos);
        yPos += 5;
      }

      if (!healthNotes.allergies && !healthNotes.medications && !healthNotes.veterinarian) {
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(150, 150, 150);
        pdf.text('Aucune note medicale enregistree', margin + 5, yPos);
      }

      // Footer
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(8);
      pdf.text('Genere avec Woofly - www.doogybook.com', pageWidth / 2, pageHeight - 10, { align: 'center' });
      pdf.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

      // Télécharger
      const fileName = `carnet-sante-${removeAccents(currentProfile.name).toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      alert('Carnet de sante telecharge avec succes !');
    } catch (error) {
      console.error('Erreur generation PDF:', error);
      alert('Erreur lors de la generation du PDF');
    } finally {
      setGeneratingPDF(false);
    }
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
              <p className="text-muted-foreground text-sm mb-4">
                Ajoutez votre premier chien pour commencer
              </p>
              <Button
                variant="default"
                size="sm"
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
      {/* Header mobile optimisé avec bouton PDF */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-heading font-semibold text-foreground truncate flex-1">
            {currentProfile.name}
          </h1>
          
          {/* Bouton Export PDF - Desktop */}
          <button
            onClick={handleExportPDF}
            disabled={generatingPDF}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >
            {generatingPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-sm">Export...</span>
              </>
            ) : (
              <>
                <Icon name="Download" size={16} />
                <span className="text-sm">Carnet PDF</span>
              </>
            )}
          </button>

          <UserMenu
            dogProfiles={dogProfiles}
            currentDog={currentProfile}
            onDogChange={handleProfileChange}
          />
        </div>
      </div>

      {/* Bandeau Cover Photo - mobile optimisé */}
      <div className="relative">
        {/* Cover Photo */}
        <div className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
          {currentProfile.cover_photo_url ? (
            <img
              src={currentProfile.cover_photo_url}
              alt={`Couverture de ${currentProfile.name}`}
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 30%' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30">
              <Icon name="Image" size={24} />
            </div>
          )}
          
          {/* Bouton modifier cover */}
          <label 
            htmlFor="cover-photo-upload-input"
            className="absolute bottom-3 right-3 z-10 bg-white/90 hover:bg-white px-3 py-2 rounded-lg cursor-pointer shadow-lg transition-smooth flex items-center gap-2"
          >
            <Icon name="Camera" size={16} />
            <span className="font-medium text-sm">
              {isUploadingCover ? 'Upload...' : 'Modifier'}
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

        {/* Avatar + Infos chien */}
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="flex items-end gap-4 -mt-12 pb-4">
            {/* Avatar du chien */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-card bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden shadow-xl">
                {currentProfile.image ? (
                  <img
                    src={currentProfile.image}
                    alt={currentProfile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                    {currentProfile.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Bouton modifier photo profil */}
              <button
                onClick={() => openModal('gallery')}
                className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 text-white p-2 rounded-full cursor-pointer shadow-lg transition-smooth"
              >
                <Icon name="Camera" size={16} />
              </button>
            </div>

            {/* Infos chien */}
            <div className="flex-1 pb-1">
              <h2 className="text-2xl font-heading font-bold text-foreground truncate">
                {currentProfile.name}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground text-xs mt-1">
                <span className="flex items-center gap-1">
                  <Icon name="Dog" size={12} />
                  <span className="truncate max-w-[80px]">{currentProfile.breed}</span>
                </span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1">
                  <Icon name="Calendar" size={12} />
                  {currentProfile.age}
                </span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1">
                  {currentProfile.gender === 'male' ? (
                    <>
                      <Icon name="Mars" size={12} />
                      <span>Mâle</span>
                    </>
                  ) : (
                    <>
                      <Icon name="Venus" size={12} />
                      <span>Femelle</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TabNavigation />
      
      <main className="main-content flex-1 pb-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="mt-4">
            <div className="bg-card rounded-lg shadow-soft overflow-hidden">
              {/* Tabs mobile avec scroll */}
              <div className="border-b border-border overflow-x-auto">
                <div className="flex min-w-max px-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 font-medium transition-smooth border-b-2 text-sm ${
                        activeTab === tab.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon name={tab.icon} size={18} />
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4">
                {activeTab === 'vaccinations' && (
                  <div className="space-y-4">
                    <div className="flex flex-col items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-lg font-heading font-semibold text-foreground mb-1">
                          Vaccinations
                        </h3>
                        <p className="text-xs text-muted-foreground font-caption">
                          Gérez le calendrier vaccinal de {currentProfile.name}
                        </p>
                      </div>
                      <Button
                        variant="default"
                        iconName="Plus"
                        iconPosition="left"
                        onClick={() => openModal('vaccination')}
                        size="sm"
                        className="w-full"
                      >
                        Ajouter une vaccination
                      </Button>
                    </div>

                    {vaccinations.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <Icon name="Syringe" size={24} color="var(--color-muted-foreground)" />
                        </div>
                        <p className="text-muted-foreground font-caption text-sm mb-4">
                          Aucune vaccination enregistrée
                        </p>
                        <Button
                          variant="default"
                          iconName="Plus"
                          iconPosition="left"
                          onClick={() => openModal('vaccination')}
                          size="sm"
                          className="w-full"
                        >
                          Ajouter une vaccination
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
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
                    <div className="flex flex-col items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-lg font-heading font-semibold text-foreground mb-1">
                          Vermifuge
                        </h3>
                        <p className="text-xs text-muted-foreground font-caption">
                          Suivez les traitements antiparasitaires internes
                        </p>
                      </div>
                      <Button
                        variant="default"
                        iconName="Plus"
                        iconPosition="left"
                        onClick={() => openModal('vermifuge')}
                        size="sm"
                        className="w-full"
                      >
                        Ajouter un traitement
                      </Button>
                    </div>

                    {vermifuges.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <Icon name="Pill" size={24} color="var(--color-muted-foreground)" />
                        </div>
                        <p className="text-muted-foreground font-caption text-sm mb-4">
                          Aucun traitement vermifuge enregistré
                        </p>
                        <Button
                          variant="default"
                          iconName="Plus"
                          iconPosition="left"
                          onClick={() => openModal('vermifuge')}
                          size="sm"
                          className="w-full"
                        >
                          Ajouter un traitement
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
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
                    <div className="flex flex-col items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-lg font-heading font-semibold text-foreground mb-1">
                          Anti-puces et tiques
                        </h3>
                        <p className="text-xs text-muted-foreground font-caption">
                          Gérez les traitements antiparasitaires externes
                        </p>
                      </div>
                      <Button
                        variant="default"
                        iconName="Plus"
                        iconPosition="left"
                        onClick={() => openModal('flea')}
                        size="sm"
                        className="w-full"
                      >
                        Ajouter un traitement
                      </Button>
                    </div>

                    {fleaTreatments.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <Icon name="Bug" size={24} color="var(--color-muted-foreground)" />
                        </div>
                        <p className="text-muted-foreground font-caption text-sm mb-4">
                          Aucun traitement anti-puces enregistré
                        </p>
                        <Button
                          variant="default"
                          iconName="Plus"
                          iconPosition="left"
                          onClick={() => openModal('flea')}
                          size="sm"
                          className="w-full"
                        >
                          Ajouter un traitement
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
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

      {/* Bouton flottant Export PDF sur mobile */}
      <button
        onClick={handleExportPDF}
        disabled={generatingPDF}
        className="sm:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center disabled:opacity-50"
      >
        {generatingPDF ? (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        ) : (
          <Icon name="Download" size={24} />
        )}
      </button>

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
        onAddPhoto={handleAddPhoto}
        currentProfilePhotoUrl={currentProfile?.image}
        onSetProfilePhoto={handleSetProfilePhoto}
      />

      {/* Modal Premium */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        reason="health-pdf"
      />

      <Footer />
    </div>
  );
};

export default DogProfile;
