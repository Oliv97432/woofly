import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Image as ImageIcon, Video, Loader } from 'lucide-react';

const CreatePostModal = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  
  const AVAILABLE_TAGS = ['santé', 'chiot', 'alimentation', 'comportement', 'balade', 'astuce'];
  const MAX_PHOTOS = 2;
  const MAX_VIDEO_DURATION = 30; // secondes
  const MIN_VIDEO_DURATION = 10; // secondes
  
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      if (selectedTags.length < 2) {
        setSelectedTags([...selectedTags, tag]);
      } else {
        alert('Maximum 2 tags par post');
      }
    }
  };
  
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + photos.length > MAX_PHOTOS) {
      alert(`Maximum ${MAX_PHOTOS} photos par post`);
      return;
    }
    
    // Valider taille et type
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert('Seules les images sont acceptées');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        alert('Taille maximum : 5MB par photo');
        return;
      }
    }
    
    // Créer les previews
    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setPhotos([...photos, ...newPhotos]);
  };
  
  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Valider type
    if (!file.type.startsWith('video/')) {
      alert('Seules les vidéos sont acceptées');
      return;
    }
    
    // Valider taille (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      alert('Taille maximum : 50MB pour les vidéos');
      return;
    }
    
    // Vérifier la durée
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = Math.floor(video.duration);
      
      if (duration < MIN_VIDEO_DURATION) {
        alert(`Durée minimum : ${MIN_VIDEO_DURATION} secondes`);
        return;
      }
      
      if (duration > MAX_VIDEO_DURATION) {
        alert(`Durée maximum : ${MAX_VIDEO_DURATION} secondes`);
        return;
      }
      
      setVideoDuration(duration);
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    };
    
    video.src = URL.createObjectURL(file);
  };
  
  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    URL.revokeObjectURL(photos[index].preview);
    setPhotos(newPhotos);
  };
  
  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview(null);
    setVideoDuration(0);
  };
  
  const uploadPhotos = async (postId) => {
    const uploadedUrls = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const fileExt = photo.file.name.split('.').pop();
      const fileName = `${user.id}/posts/${postId}_${i + 1}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('SOCIAL-FEED-MEDIA')
        .upload(fileName, photo.file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('SOCIAL-FEED-MEDIA')
        .getPublicUrl(fileName);
      
      uploadedUrls.push(publicUrl);
    }
    
    return uploadedUrls;
  };
  
  const uploadVideo = async (postId) => {
    const fileExt = videoFile.name.split('.').pop();
    const fileName = `${user.id}/shorts/${postId}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('SOCIAL-FEED-MEDIA')
      .upload(fileName, videoFile, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('SOCIAL-FEED-MEDIA')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('❌ Le contenu est requis');
      return;
    }
    
    // Ne peut pas avoir photos ET vidéo
    if (photos.length > 0 && videoFile) {
      alert('❌ Vous ne pouvez pas publier à la fois des photos et une vidéo');
      return;
    }
    
    setSubmitting(true);
    setUploadProgress(10);
    
    try {
      // 1. Créer le post
      const { data: post, error: postError } = await supabase
        .from('forum_posts')
        .insert({
          user_id: user.id,
          title: title.trim() || null,
          content: content.trim(),
          tags: selectedTags.length > 0 ? selectedTags : null,
          is_short: !!videoFile,
          video_duration: videoFile ? videoDuration : null,
          forum_id: null
        })
        .select()
        .single();
      
      if (postError) throw postError;
      
      setUploadProgress(30);
      
      // 2. Upload photos si présentes
      if (photos.length > 0) {
        const photoUrls = await uploadPhotos(post.id);
        setUploadProgress(60);
        
        // Créer les entrées dans forum_post_images
        const imageInserts = photoUrls.map((url, index) => ({
          post_id: post.id,
          image_url: url,
          display_order: index + 1
        }));
        
        const { error: imagesError } = await supabase
          .from('forum_post_images')
          .insert(imageInserts);
        
        if (imagesError) throw imagesError;
      }
      
      // 3. Upload vidéo si présente
      if (videoFile) {
        const videoUrl = await uploadVideo(post.id);
        setUploadProgress(60);
        
        // Mettre à jour le post avec l'URL de la vidéo
        const { error: updateError } = await supabase
          .from('forum_posts')
          .update({ video_url: videoUrl })
          .eq('id', post.id);
        
        if (updateError) throw updateError;
      }
      
      setUploadProgress(100);
      alert('✅ Post publié avec succès !');
      onSuccess();
      
    } catch (error) {
      console.error('Erreur:', error);
      alert(`❌ Erreur lors de la publication : ${error.message}`);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl shadow-elevated max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading font-bold">Créer un post</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-muted-foreground hover:text-foreground text-2xl disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium mb-2">Titre (optionnel)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Donnez un titre à votre post..."
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary"
              disabled={submitting}
            />
          </div>
          
          {/* Contenu */}
          <div>
            <label className="block text-sm font-medium mb-2">Contenu *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Quoi de neuf avec ton chien ?..."
              rows={6}
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary resize-none"
              required
              disabled={submitting}
            />
          </div>
          
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">Tags (max 2)</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  disabled={submitting}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-smooth disabled:opacity-50 ${
                    selectedTags.includes(tag)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
          
          {/* Photos */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Photos (max {MAX_PHOTOS})
            </label>
            
            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-40 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      disabled={submitting}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {photos.length < MAX_PHOTOS && !videoFile && (
              <>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-xl hover:bg-muted transition-smooth disabled:opacity-50"
                >
                  <ImageIcon size={20} />
                  <span>Ajouter des photos</span>
                </button>
              </>
            )}
          </div>
          
          {/* Vidéo (Short) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Vidéo courte ({MIN_VIDEO_DURATION}-{MAX_VIDEO_DURATION} secondes)
            </label>
            
            {videoPreview ? (
              <div className="relative">
                <video
                  src={videoPreview}
                  controls
                  className="w-full rounded-xl"
                  style={{ maxHeight: '300px' }}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">
                    Durée : {videoDuration}s
                  </span>
                  <button
                    type="button"
                    onClick={removeVideo}
                    disabled={submitting}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ) : photos.length === 0 && (
              <>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-xl hover:bg-muted transition-smooth disabled:opacity-50"
                >
                  <Video size={20} />
                  <span>Ajouter une vidéo</span>
                </button>
              </>
            )}
            
            <p className="text-xs text-muted-foreground mt-2">
              💡 Vidéo verticale recommandée • Max 50MB
            </p>
          </div>
          
          {/* Barre de progression */}
          {submitting && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Publication en cours... {uploadProgress}%
              </p>
            </div>
          )}
          
          {/* Boutons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-smooth disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Publication...
                </>
              ) : (
                'Publier'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-3 border-2 border-border rounded-xl font-medium hover:bg-muted transition-smooth disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
