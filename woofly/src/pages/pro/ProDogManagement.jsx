import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Plus, Search, Filter, Heart, Edit, Trash2, Eye, 
  ArrowLeft, Upload, Save, X, Camera, Loader,
  ChevronDown, ChevronUp, Home
} from 'lucide-react';

import TransferDogButton from '../../components/TransferDogButton';
import UserMenuPro from '../../components/UserMenuPro';

const ProDogManagement = () => {
  const { dogId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [proAccount, setProAccount] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingDog, setEditingDog] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    gender: 'male',
    birth_date: '',
    size: '',
    weight: '',
    sterilized: false,
    photo_url: '',
    adoption_story: '',
    adoption_requirements: '',
    adoption_fee: '',
    is_urgent: false
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [showHealthSection, setShowHealthSection] = useState(false);
  const [vaccinations, setVaccinations] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [healthNotes, setHealthNotes] = useState('');

  useEffect(() => {
    if (user) {
      fetchProAccount();
    }
  }, [user]);

  useEffect(() => {
    if (dogId && dogs.length > 0) {
      const dog = dogs.find(d => d.id === dogId);
      if (dog) {
        setEditingDog(dog);
        setFormData(dog);
        setPhotoPreview(dog.photo_url);
        setShowForm(true);
      }
    }
  }, [dogId, dogs]);

  const fetchProAccount = async () => {
    try {
      const { data: account, error } = await supabase
        .from('professional_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProAccount(account);
      fetchDogs(account.id);
    } catch (error) {
      console.error('Erreur:', error);
      navigate('/pro/register');
    }
  };

  const fetchDogs = async (proAccountId) => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('professional_account_id', proAccountId)
        .neq('adoption_status', 'adopted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDogs(data || []);
    } catch (error) {
      console.error('Erreur chargement chiens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La photo ne doit pas dépasser 5 MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `dog-photos/${fileName}`;

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const { data, error } = await supabase.storage
        .from('dog-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('dog-photos')
        .getPublicUrl(filePath);

      setUploadProgress(100);
      setPhotoPreview(publicUrl);
      setFormData(prev => ({ ...prev, photo_url: publicUrl }));

      setTimeout(() => {
        setUploadProgress(0);
        setUploading(false);
      }, 500);

    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload de la photo');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const addVaccination = () => {
    setVaccinations([...vaccinations, { vaccine_name: '', vaccination_date: '', next_due_date: '' }]);
  };

  const removeVaccination = (index) => {
    setVaccinations(vaccinations.filter((_, i) => i !== index));
  };

  const updateVaccination = (index, field, value) => {
    const updated = [...vaccinations];
    updated[index][field] = value;
    setVaccinations(updated);
  };

  const addTreatment = () => {
    setTreatments([...treatments, { product_name: '', treatment_type: 'worm', treatment_date: '', next_due_date: '' }]);
  };

  const removeTreatment = (index) => {
    setTreatments(treatments.filter((_, i) => i !== index));
  };

  const updateTreatment = (index, field, value) => {
    const updated = [...treatments];
    updated[index][field] = value;
    setTreatments(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dogData = {
        ...formData,
        user_id: null,
        professional_account_id: proAccount.id,
        is_for_adoption: true,
        adoption_status: 'available'
      };

      let dogId;

      if (editingDog) {
        const { error } = await supabase
          .from('dogs')
          .update(dogData)
          .eq('id', editingDog.id);

        if (error) throw error;
        dogId = editingDog.id;
      } else {
        const { data: newDog, error } = await supabase
          .from('dogs')
          .insert([dogData])
          .select()
          .single();

        if (error) throw error;
        dogId = newDog.id;

        if (vaccinations.length > 0) {
          const vaccsToInsert = vaccinations
            .filter(v => v.vaccine_name && v.vaccination_date)
            .map(v => ({
              dog_id: dogId,
              vaccine_name: v.vaccine_name,
              vaccination_date: v.vaccination_date,
              next_due_date: v.next_due_date || null
            }));

          if (vaccsToInsert.length > 0) {
            await supabase.from('vaccinations').insert(vaccsToInsert);
          }
        }

        if (treatments.length > 0) {
          const treatsToInsert = treatments
            .filter(t => t.product_name && t.treatment_date)
            .map(t => ({
              dog_id: dogId,
              product_name: t.product_name,
              treatment_type: t.treatment_type,
              treatment_date: t.treatment_date,
              next_due_date: t.next_due_date || null
            }));

          if (treatsToInsert.length > 0) {
            await supabase.from('treatments').insert(treatsToInsert);
          }
        }

        if (formData.weight) {
          await supabase.from('weight_records').insert([{
            dog_id: dogId,
            weight: parseFloat(formData.weight),
            measurement_date: new Date().toISOString().split('T')[0]
          }]);
        }

        if (healthNotes) {
          await supabase.from('health_notes').insert([{
            dog_id: dogId,
            description: healthNotes,
            note_date: new Date().toISOString()
          }]);
        }
      }

      await fetchDogs(proAccount.id);
      setShowForm(false);
      setEditingDog(null);
      resetForm();
      
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (dogId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce chien ?')) return;

    try {
      const { error } = await supabase
        .from('dogs')
        .delete()
        .eq('id', dogId);

      if (error) throw error;
      
      await fetchDogs(proAccount.id);
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      breed: '',
      gender: 'male',
      birth_date: '',
      size: '',
      weight: '',
      sterilized: false,
      photo_url: '',
      adoption_story: '',
      adoption_requirements: '',
      adoption_fee: '',
      is_urgent: false
    });
    setPhotoPreview(null);
    setVaccinations([]);
    setTreatments([]);
    setHealthNotes('');
    setShowHealthSection(false);
  };

  const filteredDogs = dogs.filter(dog => {
    const matchesSearch = dog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dog.breed.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    
    if (filterStatus === 'all') {
      matchesStatus = true;
    } else if (filterStatus === 'available') {
      matchesStatus = !dog.foster_family_contact_id && 
                     dog.adoption_status === 'available';
    } else if (filterStatus === 'foster') {
      matchesStatus = !!dog.foster_family_contact_id;
    } else if (filterStatus === 'pending') {
      matchesStatus = dog.adoption_status === 'pending';
    }
    
    return matchesSearch && matchesStatus;
  });

  if (loading && !proAccount) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
            <button
              onClick={() => {
                setShowForm(false);
                setEditingDog(null);
                resetForm();
                navigate('/pro/dogs');
              }}
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 min-h-[44px] min-w-[44px]"
            >
              <X size={18} className="sm:size-5" />
              <span className="font-medium text-sm sm:text-base hidden xs:inline">Annuler</span>
            </button>
            <h1 className="text-lg sm:text-xl font-heading font-bold text-gray-900 truncate px-2">
              {editingDog ? 'Modifier' : 'Nouveau chien'}
            </h1>
            <div className="w-10 sm:w-20"></div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Photo du chien
              </label>
              
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-40 h-40 sm:w-48 sm:h-48">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Aperçu"
                      className="w-full h-full object-cover rounded-2xl shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center">
                      <Camera size={48} className="text-white opacity-50" />
                    </div>
                  )}
                  
                  {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-2xl flex items-center justify-center">
                      <div className="text-center">
                        <Loader className="animate-spin h-8 w-8 text-white mx-auto mb-2" />
                        <p className="text-white text-sm font-medium">{uploadProgress}%</p>
                      </div>
                    </div>
                  )}
                </div>

                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <div className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 min-h-[44px]">
                    <Upload size={20} />
                    {photoPreview ? 'Changer la photo' : 'Choisir une photo'}
                  </div>
                </label>

                {uploading && (
                  <div className="w-full max-w-xs">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 text-center">
                  JPG, PNG ou GIF • Max 5 MB
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du chien *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Race *
              </label>
              <input
                type="text"
                name="breed"
                value={formData.breed}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sexe *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value="male">Mâle</option>
                  <option value="female">Femelle</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de naissance
                </label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taille
                </label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  placeholder="Ex: moyen"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poids (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Son histoire *
              </label>
              <textarea
                name="adoption_story"
                value={formData.adoption_story}
                onChange={handleChange}
                required
                rows={3}
                placeholder="Racontez l'histoire de ce chien..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conditions d'adoption
              </label>
              <textarea
                name="adoption_requirements"
                value={formData.adoption_requirements}
                onChange={handleChange}
                rows={2}
                placeholder="Maison avec jardin, expérience avec les chiens..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frais d'adoption (€)
              </label>
              <input
                type="number"
                name="adoption_fee"
                value={formData.adoption_fee}
                onChange={handleChange}
                placeholder="150"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  name="sterilized"
                  checked={formData.sterilized}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-gray-700 text-sm sm:text-base">Stérilisé(e)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  name="is_urgent"
                  checked={formData.is_urgent}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <span className="text-gray-700 text-sm sm:text-base">Adoption urgente</span>
              </label>
            </div>

            {!editingDog && (
              <div className="border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={() => setShowHealthSection(!showHealthSection)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                >
                  <span className="font-medium text-gray-900">Informations de santé (optionnel)</span>
                  {showHealthSection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {showHealthSection && (
                  <div className="mt-4 space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Vaccinations
                        </label>
                        <button
                          type="button"
                          onClick={addVaccination}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                        >
                          <Plus size={16} />
                          Ajouter
                        </button>
                      </div>

                      {vaccinations.map((vacc, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="Nom du vaccin"
                            value={vacc.vaccine_name}
                            onChange={(e) => updateVaccination(index, 'vaccine_name', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                          <input
                            type="date"
                            value={vacc.vaccination_date}
                            onChange={(e) => updateVaccination(index, 'vaccination_date', e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                          <input
                            type="date"
                            placeholder="Rappel"
                            value={vacc.next_due_date}
                            onChange={(e) => updateVaccination(index, 'next_due_date', e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeVaccination(index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Traitements
                        </label>
                        <button
                          type="button"
                          onClick={addTreatment}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                        >
                          <Plus size={16} />
                          Ajouter
                        </button>
                      </div>

                      {treatments.map((treat, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <select
                            value={treat.treatment_type}
                            onChange={(e) => updateTreatment(index, 'treatment_type', e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          >
                            <option value="worm">Vermifuge</option>
                            <option value="flea">Anti-puces</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Produit"
                            value={treat.product_name}
                            onChange={(e) => updateTreatment(index, 'product_name', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                          <input
                            type="date"
                            value={treat.treatment_date}
                            onChange={(e) => updateTreatment(index, 'treatment_date', e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeTreatment(index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes médicales
                      </label>
                      <textarea
                        value={healthNotes}
                        onChange={(e) => setHealthNotes(e.target.value)}
                        rows={3}
                        placeholder="Allergies, médicaments, notes vétérinaires..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingDog(null);
                  resetForm();
                  navigate('/pro/dogs');
                }}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 text-sm sm:text-base min-h-[44px]"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px]"
              >
                <Save size={18} className="sm:size-5" />
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>

            {editingDog && editingDog.adoption_status !== 'adopted' && (
              <div className="pt-4 sm:pt-6 border-t border-gray-200 mt-4 sm:mt-6">
                <TransferDogButton
                  dog={editingDog}
                  professionalAccountId={proAccount?.id}
                  onTransferComplete={() => {
                    fetchDogs(proAccount.id);
                    setShowForm(false);
                    setEditingDog(null);
                    resetForm();
                    navigate('/pro/dogs');
                  }}
                />
              </div>
            )}
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <button
              onClick={() => navigate('/pro/dashboard')}
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 min-h-[44px] min-w-[44px]"
            >
              <ArrowLeft size={18} className="sm:size-5" />
              <span className="font-medium text-sm sm:text-base hidden xs:inline">Dashboard</span>
            </button>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowForm(true);
                  navigate('/pro/dogs/new');
                }}
                className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 flex items-center gap-1 sm:gap-2 min-h-[44px] text-sm sm:text-base"
              >
                <Plus size={18} className="sm:size-5" />
                <span className="hidden xs:inline">Ajouter un chien</span>
                <span className="xs:hidden">Ajouter</span>
              </button>
              <UserMenuPro />
            </div>
          </div>

          <div className="flex flex-col xs:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un chien..."
                className="w-full pl-9 sm:pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 sm:px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-h-[44px]"
            >
              <option value="all">Tous</option>
              <option value="available">Disponibles</option>
              <option value="foster">En FA</option>
              <option value="pending">En cours d'adoption</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        {filteredDogs.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
            <Heart size={40} className="text-gray-300 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-600 mb-4 text-sm sm:text-base">Aucun chien trouvé</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 text-sm sm:text-base min-h-[44px]"
            >
              Ajouter votre premier chien
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredDogs.map((dog) => (
              <div key={dog.id} className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-gray-200">
                <div className="aspect-square relative">
                  {dog.photo_url ? (
                    <img src={dog.photo_url} alt={dog.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-4xl sm:text-5xl md:text-6xl text-white font-bold">
                        {dog.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {dog.is_urgent && (
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                      <span className="px-2 py-1 sm:px-3 sm:py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        URGENT
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                    <span className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                      dog.foster_family_contact_id ? 'bg-purple-500 text-white' :
                      dog.adoption_status === 'pending' ? 'bg-orange-500 text-white' :
                      'bg-green-500 text-white'
                    }`}>
                      {dog.foster_family_contact_id && <Home size={12} />}
                      {dog.foster_family_contact_id ? 'En FA' :
                       dog.adoption_status === 'pending' ? 'En cours' : 
                       'Disponible'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 sm:p-6">
                  <h3 className="font-bold text-base sm:text-lg md:text-xl text-gray-900 mb-1 truncate">{dog.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 truncate">{dog.breed}</p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/adoption/${dog.id}`)}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm min-h-[44px]"
                    >
                      <Eye size={14} className="sm:size-4" />
                      <span className="truncate">Voir</span>
                    </button>
                    <button
                      onClick={() => navigate(`/pro/dogs/${dog.id}`)}
                      className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm min-h-[44px]"
                    >
                      <Edit size={14} className="sm:size-4" />
                      <span className="truncate">Gérer</span>
                    </button>
                    <button
                      onClick={() => handleDelete(dog.id)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Trash2 size={14} className="sm:size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProDogManagement;
