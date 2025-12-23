import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Mail, Check, X, Clock, ArrowLeft, User, Phone, 
  MapPin, Home, Heart, AlertCircle, FileText
} from 'lucide-react';

const ProApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [proAccount, setProAccount] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [selectedApp, setSelectedApp] = useState(null);

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
      fetchApplications(account.id);
    } catch (error) {
      console.error('Erreur:', error);
      navigate('/pro/register');
    }
  };

  const fetchApplications = async (proAccountId) => {
    try {
      const { data, error } = await supabase
        .from('adoption_applications')
        .select(`
          *,
          dog:dogs(*)
        `)
        .eq('professional_account_id', proAccountId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Erreur chargement candidatures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const { error } = await supabase
        .from('adoption_applications')
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id
        })
        .eq('id', applicationId);

      if (error) throw error;
      
      // Rafraîchir la liste
      await fetchApplications(proAccount.id);
      setSelectedApp(null);
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'En attente' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approuvée' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Refusée' },
      withdrawn: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Retirée' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-3 py-1 ${badge.bg} ${badge.text} text-xs font-bold rounded-full`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Vue détaillée d'une candidature
  if (selectedApp) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setSelectedApp(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Retour</span>
            </button>
            <h1 className="text-xl font-heading font-bold text-gray-900">
              Candidature
            </h1>
            {getStatusBadge(selectedApp.status)}
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Info chien */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-6 text-white mb-6">
            <div className="flex items-center gap-4">
              {selectedApp.dog.photo_url ? (
                <img
                  src={selectedApp.dog.photo_url}
                  alt={selectedApp.dog.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center text-3xl font-bold">
                  {selectedApp.dog.name?.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-heading font-bold">
                  {selectedApp.dog.name}
                </h2>
                <p className="text-white/90">
                  {selectedApp.dog.breed}
                </p>
              </div>
            </div>
          </div>

          {/* Informations du candidat */}
          <div className="bg-white rounded-3xl p-8 shadow-sm mb-6">
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-6">
              Informations du candidat
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Nom complet</p>
                  <p className="font-semibold text-gray-900">{selectedApp.full_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{selectedApp.email}</p>
                </div>
              </div>

              {selectedApp.phone && (
                <div className="flex items-start gap-3">
                  <Phone size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <p className="font-semibold text-gray-900">{selectedApp.phone}</p>
                  </div>
                </div>
              )}

              {(selectedApp.address || selectedApp.city) && (
                <div className="flex items-start gap-3">
                  <MapPin size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Adresse</p>
                    <p className="font-semibold text-gray-900">
                      {selectedApp.address}
                      {selectedApp.city && `, ${selectedApp.city}`}
                      {selectedApp.postal_code && ` ${selectedApp.postal_code}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Situation */}
          <div className="bg-white rounded-3xl p-8 shadow-sm mb-6">
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-6">
              Situation
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Jardin</p>
                <p className="font-semibold text-gray-900">
                  {selectedApp.has_garden ? '✅ Oui' : '❌ Non'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Autres animaux</p>
                <p className="font-semibold text-gray-900">
                  {selectedApp.has_other_pets ? '✅ Oui' : '❌ Non'}
                </p>
              </div>
            </div>

            {selectedApp.other_pets_details && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Détails animaux</p>
                <p className="text-gray-900">{selectedApp.other_pets_details}</p>
              </div>
            )}

            {selectedApp.family_composition && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Composition du foyer</p>
                <p className="text-gray-900">{selectedApp.family_composition}</p>
              </div>
            )}

            {selectedApp.experience_with_dogs && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Expérience avec les chiens</p>
                <p className="text-gray-900">{selectedApp.experience_with_dogs}</p>
              </div>
            )}

            {selectedApp.availability && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Disponibilité</p>
                <p className="text-gray-900">{selectedApp.availability}</p>
              </div>
            )}
          </div>

          {/* Motivation */}
          <div className="bg-white rounded-3xl p-8 shadow-sm mb-6">
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-4">
              Motivation
            </h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {selectedApp.motivation}
            </p>
          </div>

          {/* Actions */}
          {selectedApp.status === 'pending' && (
            <div className="flex gap-4">
              <button
                onClick={() => handleStatusChange(selectedApp.id, 'rejected')}
                className="flex-1 py-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 flex items-center justify-center gap-2"
              >
                <X size={20} />
                Refuser
              </button>
              <button
                onClick={() => handleStatusChange(selectedApp.id, 'approved')}
                className="flex-1 py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Approuver
              </button>
            </div>
          )}

          {selectedApp.status !== 'pending' && (
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-gray-600">
                Candidature {selectedApp.status === 'approved' ? 'approuvée' : 'refusée'} le{' '}
                {new Date(selectedApp.reviewed_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Liste des candidatures
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
            <h1 className="text-xl font-heading font-bold text-gray-900">
              Candidatures
            </h1>
            <div className="w-20"></div>
          </div>

          {/* Filtres */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl font-medium transition-smooth ${
                filter === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-xl font-medium transition-smooth ${
                filter === 'pending' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-xl font-medium transition-smooth ${
                filter === 'approved' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approuvées
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-xl font-medium transition-smooth ${
                filter === 'rejected' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Refusées
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center">
            <Mail size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Aucune candidature pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {/* Photo chien */}
                  {app.dog.photo_url ? (
                    <img
                      src={app.dog.photo_url}
                      alt={app.dog.name}
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                      {app.dog.name?.charAt(0)}
                    </div>
                  )}

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-gray-900">
                        {app.full_name}
                      </h3>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-gray-600 mb-2">
                      Souhaite adopter <strong>{app.dog.name}</strong>
                    </p>
                    <p className="text-sm text-gray-500">
                      Candidature envoyée le {new Date(app.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  {/* Actions rapides */}
                  {app.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(app.id, 'rejected');
                        }}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 font-medium"
                      >
                        Refuser
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(app.id, 'approved');
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 font-medium"
                      >
                        Approuver
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProApplications;
