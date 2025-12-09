import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ImagePlus, X, Send, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TabNavigation from '../../components/TabNavigation';
import Footer from '../../components/Footer';

/**
 * Page CreateDiscussion - Créer un nouveau post dans la communauté
 */
const CreateDiscussion = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // États du formulaire
  const [formData, setFormData] = useState({
    forumId: '',
    title: '',
    content: '',
    category: '',
    isQuestion: false
  });
  
  const [forums, setForums] = useState([]);
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Catégories disponibles
  const categories = [
    { value: '', label: 'Choisir une catégorie' },
    { value: 'Santé', label: '🏥 Santé' },
    { value: 'Nutrition', label: '🍖 Nutrition' },
    { value: 'Comportement', label: '🐾 Comportement' },
    { value: 'Education', label: '🎓 Éducation' },
    { value: 'Toilettage', label: '✂️ Toilettage' },
    { value: 'Activités', label: '⚽ Activités' },
    { value: 'Voyages', label: '✈️ Voyages' },
    { value: 'Adoption', label: '❤️ Adoption' },
    { value: 'Autre', label: '💬 Autre' }
  ];

  // Charger les forums disponibles
  useEffect(() => {
    const fetchForums = async () => {
      const { data, error } = await supabase
        .from('forums')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');
      
      if (!error && data) {
        setForums(data);
      }
    };
    
    fetchForums();
  }, []);

  // Gestion du changement des champs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Gestion de l'upload d'images
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Limiter à 5 images
    if (images.length + files.length > 5) {
      alert('⚠️ Maximum 5 images par post');
      return;
    }
    
    // Limiter la taille (5MB par image)
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`⚠️ ${file.name} est trop volumineux (max 5MB)`);
        return false;
      }
      return true;
    });
    
    setImages(prev => [...prev, ...validFiles]);
  };

  // Supprimer une image
  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.forumId) {
      newErrors.forumId = 'Veuillez sélectionner un forum';
    }
    
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Le titre doit contenir au moins 10 caractères';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Le titre ne peut pas dépasser 255 caractères';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Le contenu est requis';
    } else if (formData.content.length < 20) {
      newErrors.content = 'Le contenu doit contenir au moins 20 caractères';
    }
    
    if (!formData.category) {
      newErrors.category = 'Veuillez sélectionner une catégorie';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Upload d'une image vers Supabase Storage
  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('community-images')
      .upload(fileName, file);
    
    if (error) throw error;
    
    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('community-images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. Créer le post
      const { data: post, error: postError } = await supabase
        .from('forum_posts')
        .insert([{
          forum_id: formData.forumId,
          user_id: user.id,
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category,
          is_question: formData.isQuestion
        }])
        .select()
        .single();
      
      if (postError) throw postError;
      
      // 2. Upload des images si présentes
      if (images.length > 0) {
        const imageUrls = await Promise.all(
          images.map(img => uploadImage(img))
        );
        
        // 3. Enregistrer les URLs des images
        const imageRecords = imageUrls.map((url, index) => ({
          post_id: post.id,
          image_url: url,
          display_order: index
        }));
        
        const { error: imagesError } = await supabase
          .from('forum_post_images')
          .insert(imageRecords);
        
        if (imagesError) throw imagesError;
      }
      
      // 4. Succès ! Redirection
      alert('✅ Votre discussion a été publiée avec succès !');
      navigate(`/discussion/${post.id}`);
      
    } catch (error) {
      console.error('Erreur création post:', error);
      alert('❌ Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-muted rounded-lg transition-smooth"
            >
              <ArrowLeft size={24} className="text-foreground" />
            </button>
            <h1 className="text-2xl font-heading font-semibold text-foreground">
              Créer une discussion
            </h1>
          </div>
        </div>
      </div>

      <TabNavigation />

      {/* Main content */}
      <main className="main-content flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6">
          
          {/* Info box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="text-blue-900 font-medium mb-1">
                  Partagez avec la communauté
                </p>
                <p className="text-blue-800 text-sm">
                  Posez vos questions, partagez vos expériences et conseils avec d'autres propriétaires de chiens.
                  Soyez respectueux et bienveillant dans vos échanges.
                </p>
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Forum */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Forum <span className="text-red-500">*</span>
              </label>
              <select
                name="forumId"
                value={formData.forumId}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.forumId ? 'border-red-500' : 'border-border'
                }`}
              >
                <option value="">Choisir un forum</option>
                {forums.map(forum => (
                  <option key={forum.id} value={forum.id}>
                    {forum.name}
                  </option>
                ))}
              </select>
              {errors.forumId && (
                <p className="text-red-500 text-sm mt-1">{errors.forumId}</p>
              )}
            </div>

            {/* Titre */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ex: Comment gérer l'anxiété de séparation ?"
                maxLength={255}
                className={`w-full px-4 py-3 border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.title ? 'border-red-500' : 'border-border'
                }`}
              />
              <div className="flex items-center justify-between mt-2">
                {errors.title && (
                  <p className="text-red-500 text-sm">{errors.title}</p>
                )}
                <p className="text-xs text-muted-foreground ml-auto">
                  {formData.title.length}/255
                </p>
              </div>
            </div>

            {/* Catégorie */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.category ? 'border-red-500' : 'border-border'
                }`}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>

            {/* Contenu */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Votre message <span className="text-red-500">*</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Décrivez votre question ou partagez votre expérience en détail..."
                rows={10}
                className={`w-full px-4 py-3 border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
                  errors.content ? 'border-red-500' : 'border-border'
                }`}
              />
              {errors.content && (
                <p className="text-red-500 text-sm mt-1">{errors.content}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Minimum 20 caractères - {formData.content.length} caractères
              </p>
            </div>

            {/* Images */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Photos (optionnel)
              </label>
              <p className="text-xs text-muted-foreground mb-4">
                Maximum 5 images • 5MB par image • Formats: JPG, PNG, WEBP
              </p>
              
              {/* Preview des images */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Bouton upload */}
              {images.length < 5 && (
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg hover:border-primary cursor-pointer transition-smooth">
                  <ImagePlus size={20} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    Ajouter des photos
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Checkbox question */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isQuestion"
                  checked={formData.isQuestion}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-medium text-foreground">
                    Marquer comme question
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Votre post sera marqué comme une question nécessitant une réponse
                  </p>
                </div>
              </label>
            </div>

            {/* Boutons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 border border-border rounded-lg font-medium text-foreground hover:bg-muted transition-smooth"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-smooth flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Publication...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Publier
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreateDiscussion;
