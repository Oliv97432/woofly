import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Icon from '../../components/AppIcon';
import Footer from '../../components/Footer';
import SubscriptionBadge from '../../components/SubscriptionBadge';

const UserProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    zipcode: '',
    avatarUrl: ''
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Charger les données utilisateur
  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Récupérer les données depuis user_profiles
      // La colonne s'appelle 'id' (pas 'user_id')
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setFormData({
        fullName: data?.full_name || user?.user_metadata?.full_name || '',
        email: user?.email || '',
        phone: data?.phone || user?.user_metadata?.phone || '',
        zipcode: data?.location || user?.user_metadata?.location || '',
        avatarUrl: data?.avatar_url || ''
      });

      setPhotoPreview(data?.avatar_url || null);
      setSubscriptionTier(data?.subscription_tier || 'free');
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      setFormData({
        fullName: user?.user_metadata?.full_name || '',
        email: user?.email || '',
        phone: user?.user_metadata?.phone || '',
        zipcode: user?.user_metadata?.location || '',
        avatarUrl: ''
      });
      setSubscriptionTier('free');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Gérer la sélection de photo
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide.');
      return;
    }

    // Vérifier la taille (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5 MB.');
      return;
    }

    setPhotoFile(file);

    // Créer une preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result);
    };
    reader.readAsDataURL(file);
  };

  // Supprimer la photo
  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(formData.avatarUrl || null);
  };

  // Upload de la photo vers Supabase Storage
  const uploadPhoto = async () => {
    if (!photoFile) return formData.avatarUrl;

    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('user-avatars')
        .upload(fileName, photoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erreur upload photo:', error);
      alert('Erreur lors de l\'upload de la photo.');
      return formData.avatarUrl;
    }
  };

  // Sauvegarder le profil
  const handleSave = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName.trim()) {
      alert('Le nom complet est requis.');
      return;
    }

    try {
      setSaving(true);
      setUploading(!!photoFile);

      // Upload de la photo si présente
      const avatarUrl = await uploadPhoto();

      // Mettre à jour dans user_profiles
      // Utiliser 'id' comme clé (pas 'user_id')
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.fullName.trim(),
          phone: formData.phone.trim() || null,
          location: formData.zipcode.trim() || null,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Mettre à jour les métadonnées auth (pour UserMenu)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName.trim(),
          avatar_url: avatarUrl || null
        }
      });

      if (authError) throw authError;

      alert('✅ Profil mis à jour avec succès !');
      setPhotoFile(null);
      
      // Recharger les données
      await loadUserData();
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  // Initiales pour l'avatar par défaut
  const initials = formData.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg pb-20 pt-4 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-full transition-smooth"
          >
            <Icon name="ArrowLeft" size={24} className="text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Mon profil
            </h1>
            <SubscriptionBadge tier={subscriptionTier} size="sm" />
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Photo de profil */}
          <div className="bg-card rounded-3xl p-6 shadow-soft border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Photo de profil
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profil"
                    className="w-32 h-32 rounded-full object-cover border-4 border-border"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-border">
                    {initials}
                  </div>
                )}

                {/* Bouton supprimer */}
                {photoFile && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90 transition-smooth"
                  >
                    <Icon name="X" size={16} />
                  </button>
                )}
              </div>

              {/* Upload */}
              <div className="flex-1 text-center sm:text-left">
                <label className="inline-block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <div className="px-4 py-2 bg-primary text-primary-foreground rounded-xl cursor-pointer hover:bg-primary/90 transition-smooth inline-flex items-center gap-2">
                    <Icon name="Upload" size={20} />
                    <span className="font-medium">
                      {photoFile ? 'Changer la photo' : 'Choisir une photo'}
                    </span>
                  </div>
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, PNG ou GIF - Max 5 MB
                </p>
              </div>
            </div>
          </div>

          {/* Informations personnelles */}
          <div className="bg-card rounded-3xl p-6 shadow-soft border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Informations personnelles
            </h2>

            <div className="space-y-4">
              {/* Nom complet */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Nom complet <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Jean Dupont"
                  required
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-smooth"
                />
              </div>

              {/* Email (non modifiable) */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  L'email ne peut pas être modifié
                </p>
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="06 12 34 56 78"
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-smooth"
                />
              </div>

              {/* Code postal */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Code postal
                </label>
                <input
                  type="text"
                  value={formData.zipcode}
                  onChange={(e) => handleChange('zipcode', e.target.value)}
                  placeholder="75001"
                  pattern="[0-9]{5}"
                  maxLength={5}
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-smooth"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Pour trouver des services vétérinaires près de chez vous
                </p>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 border border-border rounded-xl font-medium text-foreground hover:bg-muted transition-smooth"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Upload...</span>
                </>
              ) : saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Icon name="Check" size={20} />
                  <span>Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default UserProfile;
