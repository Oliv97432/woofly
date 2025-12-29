import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const ClaimDogPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [transfer, setTransfer] = useState(null);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token manquant');
      setLoading(false);
      return;
    }

    loadTransfer();
  }, [token]);

  useEffect(() => {
    // Si l'utilisateur se connecte/inscrit, on essaie de récupérer le chien automatiquement
    if (user && transfer && !claiming && !success) {
      handleClaimDog();
    }
  }, [user, transfer]);

  const loadTransfer = async () => {
    setLoading(true);
    setError('');

    try {
      // Charger le pending_transfer
      const { data, error: transferError } = await supabase
        .from('pending_transfers')
        .select('*')
        .eq('transfer_token', token)
        .single();

      if (transferError) throw transferError;

      if (!data) {
        setError('Transfert introuvable');
        return;
      }

      // Vérifier le statut
      if (data.status === 'completed') {
        setError('Ce transfert a déjà été effectué');
        return;
      }

      if (data.status === 'expired') {
        setError('Ce lien de transfert a expiré (>7 jours)');
        return;
      }

      if (data.status === 'cancelled') {
        setError('Ce transfert a été annulé');
        return;
      }

      // Vérifier la date d'expiration
      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        setError('Ce lien de transfert a expiré');
        
        // Marquer comme expiré
        await supabase
          .from('pending_transfers')
          .update({ status: 'expired' })
          .eq('id', data.id);
        
        return;
      }

      setTransfer(data);

    } catch (err) {
      console.error('Erreur chargement transfert:', err);
      setError('Erreur lors du chargement du transfert');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimDog = async () => {
    if (!user) {
      // Rediriger vers l'inscription/connexion
      navigate(`/login?redirect=/claim-dog?token=${token}`);
      return;
    }

    setClaiming(true);
    setError('');

    try {
      // Vérifier que l'email correspond
      const userEmail = user.email?.toLowerCase();
      const transferEmail = transfer.to_email.toLowerCase();

      if (userEmail !== transferEmail) {
        setError(`Ce transfert est destiné à ${transfer.to_email}, pas à ${user.email}`);
        return;
      }

      // 1. Charger le chien
      const { data: dog, error: dogError } = await supabase
        .from('dogs')
        .select('*')
        .eq('id', transfer.dog_id)
        .single();

      if (dogError) throw dogError;

      if (!dog) {
        setError('Le chien n\'existe plus');
        return;
      }

      // 2. Trouver le user_id depuis user_profiles
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (profileError) {
        // Créer le profil s'il n'existe pas
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            email: userEmail,
            full_name: user.user_metadata?.full_name || null,
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (createError) throw createError;
        
        var targetUserId = newProfile.id;
      } else {
        var targetUserId = profile.id;
      }

      // 3. Transférer le chien
      const { error: updateError } = await supabase
        .from('dogs')
        .update({
          user_id: targetUserId,
          professional_account_id: null,
          is_for_adoption: false,
          adoption_status: 'adopted',
          updated_at: new Date().toISOString()
        })
        .eq('id', transfer.dog_id);

      if (updateError) throw updateError;

      // 4. Marquer le transfert comme complété
      const { error: completeError } = await supabase
        .from('pending_transfers')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', transfer.id);

      if (completeError) console.error('Erreur marquage transfert:', completeError);

      // 5. Créer une notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          type: 'dog_received',
          title: `🎉 Bienvenue ${dog.name} !`,
          message: `${dog.name} a été transféré avec succès sur votre compte. Vous pouvez maintenant gérer son profil de santé.`,
          data: { dog_id: dog.id, dog_name: dog.name },
          created_at: new Date().toISOString()
        });

      if (notifError) console.error('Erreur notification:', notifError);

      setSuccess(true);

      // Rediriger vers le profil du chien après 3 secondes
      setTimeout(() => {
        navigate(`/dog-profile/${dog.id}`);
      }, 3000);

    } catch (err) {
      console.error('Erreur récupération chien:', err);
      setError('Erreur lors de la récupération du chien');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-600" size={32} className="sm:size-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-gray-900 mb-2 leading-tight">
            Oups !
          </h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base break-words">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 sm:px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-smooth min-h-[44px] text-sm sm:text-base"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} className="sm:size-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-gray-900 mb-2 leading-tight">
            🎉 Félicitations !
          </h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            {transfer.dog_data?.name} a été transféré avec succès sur votre compte !
          </p>
          <div className="bg-blue-50 p-3 sm:p-4 rounded-xl text-xs sm:text-sm text-blue-900 mb-6">
            <p>Redirection vers le profil de {transfer.dog_data?.name}...</p>
          </div>
          <div className="animate-pulse text-blue-500 text-sm">
            <Loader className="inline animate-spin h-4 w-4 mr-2" />
            Patientez un instant...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Utilisateur pas connecté
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 md:p-8">
          
          {/* Photo du chien */}
          {transfer.dog_data && (
            <div className="text-center mb-6">
              {transfer.dog_data.photo_url ? (
                <img
                  src={transfer.dog_data.photo_url}
                  alt={transfer.dog_data.name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl object-cover mx-auto mb-4 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mx-auto mb-4 text-white text-3xl sm:text-4xl font-bold">
                  {transfer.dog_data.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <h2 className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-gray-900 mb-2 leading-tight">
                {transfer.dog_data.name} vous attend ! 🐕
              </h2>
              <p className="text-gray-600 text-sm sm:text-base truncate">
                {transfer.dog_data.breed} • {transfer.dog_data.age}
              </p>
            </div>
          )}

          {/* Message */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded-r-xl mb-4 sm:mb-6">
            <div className="flex gap-3">
              <Heart className="text-blue-600 flex-shrink-0" size={20} className="sm:size-6" />
              <div className="text-xs sm:text-sm text-blue-900">
                <p className="font-semibold mb-1">Un chien a été transféré pour vous !</p>
                <p className="break-words">
                  Connectez-vous ou créez un compte avec l'adresse <strong className="break-all">{transfer.to_email}</strong> pour récupérer {transfer.dog_data?.name}.
                </p>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/login?redirect=/claim-dog?token=${token}`)}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 sm:px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all min-h-[52px] text-sm sm:text-base"
            >
              Se connecter
            </button>
            <button
              onClick={() => navigate(`/register?redirect=/claim-dog?token=${token}`)}
              className="w-full border-2 border-blue-500 text-blue-600 px-4 sm:px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-smooth min-h-[52px] text-sm sm:text-base"
            >
              Créer un compte
            </button>
          </div>

          {/* Info expiration */}
          <p className="text-xs text-gray-500 text-center mt-4 sm:mt-6">
            ⏰ Ce lien expire le {new Date(transfer.expires_at).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>
      </div>
    );
  }

  // Utilisateur connecté, on récupère automatiquement le chien
  if (claiming) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">Transfert en cours...</p>
          <p className="text-gray-500 text-xs mt-2">Patientez, {transfer?.dog_data?.name} arrive bientôt !</p>
        </div>
      </div>
    );
  }

  return null;
};

export default ClaimDogPage;
