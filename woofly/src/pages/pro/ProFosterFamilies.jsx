import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TabNavigationPro from '../../components/TabNavigationPro';
import UserMenuPro from '../../components/UserMenuPro';
import { 
  ArrowLeft, Home, Mail, Phone, Calendar, Dog, 
  Plus, Search, X, Check, MapPin, User
} from 'lucide-react';

const ProFosterFamilies = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [proAccount, setProAccount] = useState(null);
  const [fosterFamilies, setFosterFamilies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFamilyEmail, setNewFamilyEmail] = useState('');
  const [addingFamily, setAddingFamily] = useState(false);

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
      await fetchFosterFamilies(account.id);
    } catch (error) {
      console.error('Erreur:', error);
      navigate('/pro/register');
    } finally {
      setLoading(false);
    }
  };

  const fetchFosterFamilies = async (proAccountId) => {
    try {
      const { data: families, error } = await supabase
        .from('contacts_with_current_dogs')
        .select('*')
        .eq('professional_account_id', proAccountId)
        .in('type', ['foster_family', 'both'])
        .not('user_id', 'is', null)
        .eq('status', 'active');

      if (error) {
        console.error('Erreur contacts:', error);
        throw error;
      }

      if (!families || families.length === 0) {
        setFosterFamilies([]);
        return;
      }

      const formattedFamilies = families.map(family => {
        const currentCount = family.current_dogs_count || 0;
        const maxCount = family.max_dogs || 1;
        
        const availability = currentCount >= maxCount ? 'complet' : 'disponible';
        
        return {
          id: family.user_id,
          full_name: family.full_name,
          email: family.email || '',
          phone: family.phone || '',
          address: family.address || '',
          created_at: family.created_at,
          status: availability,
          current_dogs_count: currentCount,
          max_dogs: maxCount,
          dogs: Array.isArray(family.current_dogs) 
            ? family.current_dogs.map(dog => ({
                id: dog.dog_id,
                name: dog.dog_name,
                breed: dog.dog_breed,
                photo_url: dog.dog_photo_url
              }))
            : []
        };
      });

      setFosterFamilies(formattedFamilies);

    } catch (error) {
      console.error('Erreur chargement familles:', error);
      setFosterFamilies([]);
    }
  };

  const handleAddFamily = async () => {
    if (!newFamilyEmail.trim()) {
      alert('Veuillez entrer un email');
      return;
    }

    setAddingFamily(true);
    try {
      const { data: userProfile, error: findError } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, phone')
        .eq('email', newFamilyEmail.toLowerCase().trim())
        .maybeSingle();

      if (findError) {
        console.error('Erreur recherche user:', findError);
        alert('Erreur lors de la recherche de l\'utilisateur');
        return;
      }

      if (!userProfile) {
        alert('Aucun utilisateur trouvé avec cet email. La personne doit d\'abord créer un compte Doogybook.');
        return;
      }

      const { data: existingContact, error: checkError } = await supabase
        .from('contacts')
        .select('id')
        .eq('professional_account_id', proAccount.id)
        .eq('user_id', userProfile.id)
        .maybeSingle();

      if (checkError) {
        console.error('Erreur vérification contact:', checkError);
        alert('Erreur lors de la vérification');
        return;
      }

      if (existingContact) {
        alert('Cette famille d\'accueil est déjà enregistrée.');
        return;
      }

      const { error: insertError } = await supabase
        .from('contacts')
        .insert({
          professional_account_id: proAccount.id,
          user_id: userProfile.id,
          full_name: userProfile.full_name,
          email: userProfile.email,
          phone: userProfile.phone || null,
          type: 'foster_family',
          status: 'active'
        });

      if (insertError) {
        console.error('Erreur insertion:', insertError);
        alert('Erreur lors de l\'ajout de la famille d\'accueil');
        return;
      }

      alert(`${userProfile.full_name || userProfile.email} a été ajouté(e) comme famille d'accueil sur Doogybook.`);
      
      setShowAddModal(false);
      setNewFamilyEmail('');
      
      await fetchFosterFamilies(proAccount.id);
      
    } catch (error) {
      console.error('Erreur ajout famille:', error);
      alert('Erreur lors de l\'ajout de la famille d\'accueil');
    } finally {
      setAddingFamily(false);
    }
  };

  const filteredFamilies = fosterFamilies.filter(family => 
    family.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    family.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    family.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/pro/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Familles d'accueil
                </h1>
                <p className="text-sm text-gray-600">
                  {fosterFamilies.length} famille{fosterFamilies.length > 1 ? 's' : ''} active{fosterFamilies.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                <span>Ajouter</span>
              </button>
              <UserMenuPro />
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une famille..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {filteredFamilies.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home size={40} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchTerm ? 'Aucune famille trouvée' : 'Aucune famille d\'accueil active'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Essayez avec d\'autres mots-clés'
                : 'Les familles d\'accueil apparaîtront ici une fois ajoutées'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Ajouter une famille d'accueil
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFamilies.map((family) => (
              <div
                key={family.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                      {family.full_name?.charAt(0).toUpperCase() || 'F'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">
                        {family.full_name || 'Famille d\'accueil'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Dog size={12} />
                          <span>{family.current_dogs_count}/{family.max_dogs}</span>
                        </div>
                        {family.status === 'disponible' && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                            Disponible
                          </span>
                        )}
                        {family.status === 'complet' && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                            Complet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    {family.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={14} className="text-gray-400 flex-shrink-0" />
                        <a 
                          href={`mailto:${family.email}`}
                          className="text-blue-600 hover:underline truncate"
                        >
                          {family.email}
                        </a>
                      </div>
                    )}
                    
                    {family.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={14} className="text-gray-400 flex-shrink-0" />
                        <a 
                          href={`tel:${family.phone}`}
                          className="text-gray-700 hover:text-blue-600 truncate"
                        >
                          {family.phone}
                        </a>
                      </div>
                    )}
                    
                    {family.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600 truncate">
                          {family.address}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dogs Section */}
                  {family.dogs.length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Chiens accueillis :
                      </p>
                      <div className="space-y-1">
                        {family.dogs.slice(0, 2).map((dog) => (
                          <div
                            key={dog.id}
                            onClick={() => navigate(`/pro/dogs/${dog.id}`)}
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center text-xs font-bold text-green-700">
                              {dog.name?.charAt(0).toUpperCase() || 'C'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {dog.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {dog.breed || 'Non spécifié'}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {family.dogs.length > 2 && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500">
                              +{family.dogs.length - 2} autre{family.dogs.length - 2 > 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {family.dogs.length === 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-500 text-center italic">
                        Aucun chien actuellement
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Family Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Ajouter une famille d'accueil
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Entrez l'email d'un utilisateur Doogybook existant pour l'ajouter comme famille d'accueil.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de la famille d'accueil
                </label>
                <input
                  type="email"
                  value={newFamilyEmail}
                  onChange={(e) => setNewFamilyEmail(e.target.value)}
                  placeholder="famille@doogybook.fr"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFamily()}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddFamily}
                  disabled={addingFamily || !newFamilyEmail.trim()}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {addingFamily ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Vérification...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Ajouter
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProFosterFamilies;
