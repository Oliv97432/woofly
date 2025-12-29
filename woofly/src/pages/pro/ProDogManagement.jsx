import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Plus, Search, Filter, Heart, Edit, Trash2, Eye, 
  ArrowLeft, Upload, Save, X
} from 'lucide-react';

import TransferDogButton from '../../components/TransferDogButton';

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
        .eq('is_for_adoption', true)
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dogData = {
        ...formData,
        user_id: user.id,
        professional_account_id: proAccount.id,
        is_for_adoption: true,
        adoption_status: 'available'
      };

      if (editingDog) {
        // Mise à jour
        const { error } = await supabase
          .from('dogs')
          .update(dogData)
          .eq('id', editingDog.id);

        if (error) throw error;
      } else {
        // Création
        const { error } = await supabase
          .from('dogs')
          .insert([dogData]);

        if (error) throw error;
      }

      // Rafraîchir la liste
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
  };

  const filteredDogs = dogs.filter(dog => {
    const matchesSearch = dog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dog.breed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || dog.adoption_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading && !proAccount) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Formulaire d'ajout/édition
  if (showForm) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => {
                setShowForm(false);
                setEditingDog(null);
                resetForm();
                navigate('/pro/dogs');
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <X size={20} />
              <span className="font-medium">Annuler</span>
            </button>
            <h1 className="text-xl font-heading font-bold text-gray-900">
              {editingDog ? 'Modifier' : 'Nouveau chien'}
            </h1>
            <div className="w-20"></div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm">
            <div className="space-y-6">
              {/* Nom */}
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Race */}
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Sexe & Date de naissance */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sexe *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Taille & Poids */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taille
                  </label>
                  <input
                    type="text"
                    name="size"
                    value={formData.size}
                    onChange={handleChange}
                    placeholder="Ex: Moyen"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Photo URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de la photo
                </label>
                <input
                  type="url"
                  name="photo_url"
                  value={formData.photo_url}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Histoire */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Son histoire *
                </label>
                <textarea
                  name="adoption_story"
                  value={formData.adoption_story}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Racontez l'histoire de ce chien..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Conditions d'adoption */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conditions d'adoption
                </label>
                <textarea
                  name="adoption_requirements"
                  value={formData.adoption_requirements}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Maison avec jardin, expérience avec les chiens..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Frais d'adoption */}
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="sterilized"
                    checked={formData.sterilized}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Stérilisé(e)</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="is_urgent"
                    checked={formData.is_urgent}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-gray-700">Adoption urgente</span>
                </label>
              </div>

              {/* Boutons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingDog(null);
                    resetForm();
                    navigate('/pro/dogs');
                  }}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>

              {/* Bouton de transfert - NOUVEAU */}
              {editingDog && editingDog.adoption_status !== 'adopted' && (
                <div className="pt-6 border-t border-gray-200 mt-6">
                  <TransferDogButton
                    dog={editingDog}
                    professionalAccountId={proAccount?.id}
                    onTransferComplete={() => {
                      // Recharger les chiens après transfert
                      fetchDogs(proAccount.id);
                      // Fermer le formulaire
                      setShowForm(false);
                      setEditingDog(null);
                      resetForm();
                      navigate('/pro/dogs');
                    }}
                  />
                </div>
              )}
            </div>
          </form>
        </main>
      </div>
    );
  }

  // Liste des chiens
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/pro/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => {
                setShowForm(true);
                navigate('/pro/dogs/new');
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus size={20} />
              Ajouter un chien
            </button>
          </div>

          {/* Recherche & Filtres */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un chien..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous</option>
              <option value="available">Disponibles</option>
              <option value="pending">En cours</option>
              <option value="adopted">Adoptés</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {filteredDogs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center">
            <Heart size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Aucun chien trouvé</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
            >
              Ajouter votre premier chien
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDogs.map((dog) => (
              <div key={dog.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200">
                <div className="aspect-square relative">
                  {dog.photo_url ? (
                    <img src={dog.photo_url} alt={dog.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-6xl text-white font-bold">
                        {dog.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {dog.is_urgent && (
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        URGENT
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      dog.adoption_status === 'available' ? 'bg-green-500 text-white' :
                      dog.adoption_status === 'pending' ? 'bg-orange-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}>
                      {dog.adoption_status === 'available' ? 'Disponible' :
                       dog.adoption_status === 'pending' ? 'En cours' : 'Adopté'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{dog.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{dog.breed}</p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/adoption/${dog.id}`)}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 text-sm"
                    >
                      <Eye size={16} />
                      Voir
                    </button>
                    <button
                      onClick={() => {
                        setEditingDog(dog);
                        setFormData(dog);
                        setShowForm(true);
                        navigate(`/pro/dogs/${dog.id}`);
                      }}
                      className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 text-sm"
                    >
                      <Edit size={16} />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(dog.id)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      <Trash2 size={16} />
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
