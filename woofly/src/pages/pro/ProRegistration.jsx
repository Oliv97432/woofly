import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Building2, Mail, Lock, Phone, MapPin, ArrowRight } from 'lucide-react';

const ProRegistration = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    organizationType: 'refuge',
    phone: '',
    city: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Email
    if (!formData.email) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    // Password
    if (!formData.password) {
      newErrors.password = 'Mot de passe requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Minimum 8 caractères';
    }
    
    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    // Organization name
    if (!formData.organizationName) {
      newErrors.organizationName = 'Nom de l\'organisation requis';
    }
    
    // Phone
    if (!formData.phone) {
      newErrors.phone = 'Téléphone requis';
    }
    
    // City
    if (!formData.city) {
      newErrors.city = 'Ville requise';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      console.log('🔵 Step 1: Creating user account...');
      
      // 1. Créer le compte utilisateur
      const { data: authData, error: authError } = await signUp(
        formData.email,
        formData.password,
        {
          full_name: formData.organizationName,
          phone: formData.phone
        }
      );
      
      if (authError) {
        console.error('🔴 Auth error:', authError);
        throw authError;
      }
      
      if (!authData?.user) {
        throw new Error('Erreur lors de la création du compte');
      }
      
      console.log('🟢 Step 1 complete: User created:', authData.user.id);
      console.log('🔵 Step 2: Creating professional account...');
      
      // 2. Créer le compte professionnel
      const { data: proData, error: proError } = await supabase
        .from('professional_accounts')
        .insert({
          user_id: authData.user.id,
          organization_name: formData.organizationName,
          organization_type: formData.organizationType,
          phone: formData.phone,
          city: formData.city,
          email: formData.email,
          is_active: true,
          is_verified: false
        })
        .select()
        .single();
      
      if (proError) {
        console.error('🔴 Pro account error:', proError);
        throw proError;
      }
      
      console.log('🟢 Step 2 complete: Professional account created:', proData.id);
      console.log('🎉 Registration complete! Redirecting to login...');
      
      // 3. Rediriger vers login avec message de succès
      alert('✅ Compte professionnel créé avec succès !\n\nConnectez-vous pour accéder à votre dashboard.');
      navigate('/login');
      
    } catch (error) {
      console.error('🔴 Registration error:', error);
      setErrors({
        general: error.message || 'Erreur lors de la création du compte. Veuillez réessayer.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">🐕</span>
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-gray-900 truncate">
              Doogybook
            </h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 text-sm sm:text-base min-h-[44px]"
            aria-label="Retour à l'accueil"
          >
            ← Retour
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Shield className="size-7 sm:size-10 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
            Inscription Professionnelle
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 px-2">
            Créez votre compte refuge/association et commencez à publier vos chiens à adopter
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-12">
          
          {/* Error message */}
          {errors.general && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email professionnel *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4 sm:size-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 sm:pl-12 pr-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base`}
                  placeholder="contact@refuge.fr"
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4 sm:size-5" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 sm:pl-12 pr-4 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base`}
                  placeholder="Minimum 8 caractères"
                  disabled={loading}
                />
              </div>
              {errors.password && <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4 sm:size-5" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 sm:pl-12 pr-4 py-3 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base`}
                  placeholder="Confirmez votre mot de passe"
                  disabled={loading}
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>

            <div className="border-t border-gray-200 my-4 sm:my-8"></div>

            {/* Organization Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du refuge / association *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4 sm:size-5" />
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  className={`w-full pl-10 sm:pl-12 pr-4 py-3 border ${errors.organizationName ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base`}
                  placeholder="Refuge les Amis des Animaux"
                  disabled={loading}
                />
              </div>
              {errors.organizationName && <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.organizationName}</p>}
            </div>

            {/* Organization Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'organisation *
              </label>
              <select
                name="organizationType"
                value={formData.organizationType}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                disabled={loading}
              >
                <option value="refuge">Refuge</option>
                <option value="spa">SPA</option>
                <option value="association">Association</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4 sm:size-5" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full pl-10 sm:pl-12 pr-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base`}
                  placeholder="01 23 45 67 89"
                  disabled={loading}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.phone}</p>}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4 sm:size-5" />
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full pl-10 sm:pl-12 pr-4 py-3 border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base`}
                  placeholder="Paris"
                  disabled={loading}
                />
              </div>
              {errors.city && <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.city}</p>}
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                ℹ️ Votre compte sera en attente de vérification. Une fois vérifié par notre équipe, 
                vous recevrez un badge "Vérifié" qui rassurera les adoptants.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-bold text-base sm:text-lg hover:from-green-600 hover:to-teal-700 transition-smooth flex items-center justify-center gap-2 disabled:opacity-50 min-h-[52px]"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  <span className="text-sm sm:text-base">Création en cours...</span>
                </>
              ) : (
                <>
                  <Shield className="size-5 sm:size-6" />
                  <span className="text-sm sm:text-base">Créer mon compte professionnel</span>
                  <ArrowRight className="size-4 sm:size-5" />
                </>
              )}
            </button>

            {/* Login link */}
            <div className="text-center pt-3 sm:pt-4 border-t border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-green-600 font-medium hover:text-green-700"
                  disabled={loading}
                >
                  Se connecter
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-600">
          <p>En créant un compte, vous acceptez nos conditions d'utilisation</p>
        </div>
      </div>
    </div>
  );
};

export default ProRegistration;

