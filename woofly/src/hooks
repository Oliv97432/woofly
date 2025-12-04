import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook réutilisable pour l'upload d'images vers Supabase Storage
 * 
 * @param {Object} options - Configuration de l'upload
 * @param {string} options.bucket - Nom du bucket ('dog-photos', 'user-avatars', 'health-notes-photos')
 * @param {number} options.maxSizeMB - Taille max en MB (défaut: 5)
 * @param {string[]} options.allowedTypes - Types MIME autorisés (défaut: ['image/jpeg', 'image/png', 'image/webp'])
 * 
 * @returns {Object} - État et fonctions d'upload
 */
export const useUpload = (options = {}) => {
  const {
    bucket = 'dog-photos',
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  } = options;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  /**
   * Valide un fichier avant upload
   */
  const validateFile = (file) => {
    // Vérifier que c'est bien un fichier
    if (!file) {
      throw new Error('Aucun fichier sélectionné');
    }

    // Vérifier le type
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Type de fichier non autorisé. Formats acceptés : ${allowedTypes.join(', ')}`);
    }

    // Vérifier la taille
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      throw new Error(`Fichier trop volumineux. Taille max : ${maxSizeMB}MB (taille actuelle : ${sizeMB.toFixed(2)}MB)`);
    }

    return true;
  };

  /**
   * Génère un nom de fichier unique
   */
  const generateFileName = (originalName) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${random}.${extension}`;
  };

  /**
   * Upload un fichier vers Supabase Storage
   * 
   * @param {File} file - Fichier à uploader
   * @param {string} folder - Dossier de destination (ex: 'user_id/dog_id')
   * @param {string} fileName - Nom du fichier (optionnel, auto-généré si absent)
   * 
   * @returns {Promise<string>} - URL publique du fichier uploadé
   */
  const uploadFile = async (file, folder, fileName = null) => {
    setUploading(true);
    setProgress(0);
    setError(null);
    setUploadedUrl(null);

    try {
      // Valider le fichier
      validateFile(file);

      // Générer le nom si non fourni
      const finalFileName = fileName || generateFileName(file.name);

      // Construire le chemin complet
      const filePath = folder ? `${folder}/${finalFileName}` : finalFileName;

      // Simuler la progression (Supabase ne fournit pas de vraie progression)
      setProgress(30);

      // Upload vers Supabase
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Remplace si existe déjà
        });

      if (uploadError) throw uploadError;

      setProgress(70);

      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setProgress(100);
      setUploadedUrl(urlData.publicUrl);
      
      return urlData.publicUrl;

    } catch (err) {
      console.error('Erreur upload:', err);
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Upload multiple fichiers
   * 
   * @param {File[]} files - Tableau de fichiers à uploader
   * @param {string} folder - Dossier de destination
   * 
   * @returns {Promise<string[]>} - Tableau des URLs publiques
   */
  const uploadMultiple = async (files, folder) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const urls = [];
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        
        // Valider chaque fichier
        validateFile(file);

        const fileName = generateFileName(file.name);
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        // Upload
        const { data, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // URL publique
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        urls.push(urlData.publicUrl);

        // Mettre à jour la progression
        setProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      return urls;

    } catch (err) {
      console.error('Erreur upload multiple:', err);
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Supprimer un fichier
   * 
   * @param {string} filePath - Chemin du fichier dans le bucket
   * 
   * @returns {Promise<void>}
   */
  const deleteFile = async (filePath) => {
    try {
      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (deleteError) throw deleteError;

    } catch (err) {
      console.error('Erreur suppression:', err);
      throw err;
    }
  };

  /**
   * Redimensionner une image avant upload (optionnel)
   * 
   * @param {File} file - Fichier image
   * @param {number} maxWidth - Largeur max en pixels
   * @param {number} maxHeight - Hauteur max en pixels
   * 
   * @returns {Promise<Blob>} - Image redimensionnée
   */
  const resizeImage = (file, maxWidth = 1200, maxHeight = 1200) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Calculer les nouvelles dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = height * (maxWidth / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = width * (maxHeight / height);
              height = maxHeight;
            }
          }

          // Créer le canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir en blob
          canvas.toBlob((blob) => {
            resolve(blob);
          }, file.type, 0.9);
        };

        img.onerror = reject;
      };

      reader.onerror = reject;
    });
  };

  /**
   * Reset l'état
   */
  const reset = () => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setUploadedUrl(null);
  };

  return {
    // État
    uploading,
    progress,
    error,
    uploadedUrl,
    
    // Fonctions
    uploadFile,
    uploadMultiple,
    deleteFile,
    resizeImage,
    reset
  };
};

export default useUpload;
