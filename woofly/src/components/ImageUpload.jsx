import React, { useState, useRef } from 'react';
import Icon from './AppIcon';
import useUpload from '../hooks/useUpload';

/**
 * Composant d'upload d'image simple
 * Avec preview, drag & drop, et gestion des erreurs
 * 
 * @param {Object} props
 * @param {string} props.bucket - Nom du bucket Supabase
 * @param {string} props.folder - Dossier de destination
 * @param {string} props.currentImage - URL de l'image actuelle (optionnel)
 * @param {Function} props.onUploadComplete - Callback après upload (url)
 * @param {number} props.maxSizeMB - Taille max en MB (défaut: 5)
 * @param {string} props.label - Label du champ (optionnel)
 * @param {string} props.className - Classes CSS additionnelles (optionnel)
 */
const ImageUpload = ({
  bucket = 'dog-photos',
  folder,
  currentImage = null,
  onUploadComplete,
  maxSizeMB = 5,
  label = 'Photo',
  className = ''
}) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(currentImage);
  const [isDragging, setIsDragging] = useState(false);

  const { uploadFile, uploading, progress, error, reset } = useUpload({
    bucket,
    maxSizeMB
  });

  /**
   * Gérer la sélection de fichier
   */
  const handleFileSelect = async (file) => {
    if (!file) return;

    // Créer un preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload vers Supabase
    try {
      const url = await uploadFile(file, folder);
      if (onUploadComplete) {
        onUploadComplete(url);
      }
    } catch (err) {
      console.error('Erreur upload:', err);
      // Remettre l'image précédente en cas d'erreur
      setPreview(currentImage);
    }
  };

  /**
   * Gérer le changement via input file
   */
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Gérer le drag & drop
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Ouvrir le sélecteur de fichier
   */
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  /**
   * Supprimer l'image
   */
  const handleRemove = () => {
    setPreview(null);
    if (onUploadComplete) {
      onUploadComplete(null);
    }
    reset();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      {/* Zone d'upload */}
      <div
        className={`relative border-2 border-dashed rounded-lg transition-all ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Image preview */}
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg"
            />
            
            {/* Overlay avec actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={openFileDialog}
                disabled={uploading}
                className="px-4 py-2 bg-white text-foreground rounded-lg font-medium hover:bg-gray-100 transition-smooth flex items-center gap-2"
              >
                <Icon name="Upload" size={20} />
                Changer
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-smooth flex items-center gap-2"
              >
                <Icon name="Trash2" size={20} />
                Supprimer
              </button>
            </div>

            {/* Progress bar */}
            {uploading && (
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200 rounded-b-lg overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          // Zone d'upload vide
          <button
            type="button"
            onClick={openFileDialog}
            disabled={uploading}
            className="w-full h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground hover:text-foreground transition-smooth"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Icon name="Upload" size={32} />
            </div>
            <div className="text-center">
              <p className="font-medium">
                {uploading ? 'Upload en cours...' : 'Cliquez ou glissez une image'}
              </p>
              <p className="text-sm">
                {uploading
                  ? `${progress}%`
                  : `PNG, JPG, WEBP jusqu'à ${maxSizeMB}MB`}
              </p>
            </div>
          </button>
        )}

        {/* Input file caché */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <Icon name="AlertCircle" size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Erreur d'upload</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Indication d'état */}
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin">
            <Icon name="Loader2" size={16} />
          </div>
          <span>Upload en cours... {progress}%</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
