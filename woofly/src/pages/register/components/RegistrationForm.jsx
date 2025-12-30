import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const RegistrationForm = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [ownerData, setOwnerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [dogData, setDogData] = useState({
    dogName: '',
    breed: '',
    age: '',
    ageUnit: 'years' // 'years' or 'months'
  });

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [skipDog, setSkipDog] = useState(false); // ✅ NOUVEAU : Permet de skip le chien

  const [errors, setErrors] = useState({});

  const breedOptions = [
    { value: 'malinois', label: 'Malinois' },
    { value: 'shih-tzu', label: 'Shih-Tzu' },
    { value: 'american-bully', label: 'American Bully' },
    { value: 'golden-retriever', label: 'Golden Retriever' },
    { value: 'labrador', label: 'Labrador' },
    { value: 'berger-allemand', label: 'Berger Allemand' },
    { value: 'bouledogue-francais', label: 'Bouledogue Français' },
    { value: 'chihuahua', label: 'Chihuahua' },
    { value: 'husky', label: 'Husky Sibérien' },
    { value: 'beagle', label: 'Beagle' },
    { value: 'mixed', label: 'Race Mixte' },
    { value: 'other', label: 'Autre' }
  ];

  const ageUnitOptions = [
    { value: 'months', label: 'Mois' },
    { value: 'years', label: 'Ans' }
  ];

  const validateStep1 = () => {
    const newErrors = {};

    if (!ownerData?.firstName?.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }

    if (!ownerData?.lastName?.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }

    if (!ownerData?.email?.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(ownerData?.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!ownerData?.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (ownerData?.password?.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/?.test(ownerData?.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }

    if (!ownerData?.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (ownerData?.password !== ownerData?.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  // ✅ MODIFIÉ : Validation optionnelle si skipDog est true
  const validateStep2 = () => {
    const newErrors = {};

    // Si on skip le chien, on vérifie juste les conditions
    if (skipDog) {
      if (!acceptTerms) {
        newErrors.terms = 'Vous devez accepter les conditions d\'utilisation';
      }
      setErrors(newErrors);
      return Object.keys(newErrors)?.length === 0;
    }

    // Sinon, validation complète
    if (!dogData?.dogName?.trim()) {
      newErrors.dogName = 'Le nom du chien est requis';
    }

    if (!dogData?.breed) {
      newErrors.breed = 'Veuillez sélectionner une race';
    }

    if (!dogData?.age) {
      newErrors.age = 'L\'âge est requis';
    } else if (isNaN(dogData?.age) || dogData?.age < 0) {
      newErrors.age = 'Veuillez entrer un âge valide';
    } else if (dogData?.ageUnit === 'years' && dogData?.age > 30) {
      newErrors.age = 'Veuillez entrer un âge valide (0-30 ans)';
    } else if (dogData?.ageUnit === 'months' && dogData?.age > 360) {
      newErrors.age = 'Veuillez entrer un âge valide (0-360 mois)';
    }

    if (!acceptTerms) {
      newErrors.terms = 'Vous devez accepter les conditions d\'utilisation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleOwnerChange = (field, value) => {
    setOwnerData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDogChange = (field, value) => {
    setDogData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
    setErrors({});
    setSkipDog(false); // Reset skip
  };

  // ✅ NOUVEAU : Fonction pour skip le chien
  const handleSkipDog = () => {
    setSkipDog(true);
    // Effacer les erreurs sur les champs du chien
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.dogName;
      delete newErrors.breed;
      delete newErrors.age;
      return newErrors;
    });
  };

  // Calcul de la date de naissance basée sur l'âge
  const calculateBirthDate = (age, ageUnit) => {
    const today = new Date();
    let birthDate = new Date(today);
    
    if (ageUnit === 'years') {
      birthDate.setFullYear(today.getFullYear() - parseInt(age));
    } else {
      birthDate.setMonth(today.getMonth() - parseInt(age));
    }
    
    return birthDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateStep2()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Étape 1 : Créer le compte utilisateur avec Supabase Auth
      const { data: authData, error: authError } = await signUp(
        ownerData?.email,
        ownerData?.password
      );

      if (authError) {
        setErrors({
          general: authError?.message || 'Échec de l\'inscription. Veuillez réessayer.'
        });
        setLoading(false);
        return;
      }

      const userId = authData?.user?.id;

      if (!userId) {
        setErrors({
          general: 'Erreur lors de la création du compte'
        });
        setLoading(false);
        return;
      }

      // Étape 2 : Créer le profil utilisateur dans la table users
      const { error: userProfileError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email: ownerData?.email,
          full_name: `${ownerData?.firstName} ${ownerData?.lastName}`
        }]);

      if (userProfileError) {
        console.error('Erreur création profil utilisateur:', userProfileError);
        // On continue quand même car le user auth est créé
      }

      // ✅ MODIFIÉ : Créer le chien SEULEMENT si skipDog est false
      if (!skipDog && dogData?.dogName?.trim()) {
        const birthDate = calculateBirthDate(dogData?.age, dogData?.ageUnit);
        
        const { error: dogError } = await supabase
          .from('dogs')
          .insert([{
            user_id: userId,
            name: dogData?.dogName,
            breed: dogData?.breed,
            birth_date: birthDate,
            is_active: true
          }]);

        if (dogError) {
          console.error('Erreur création profil chien:', dogError);
          // On continue quand même, le user peut ajouter le chien plus tard
        }
      }

      // Étape 4 : Rediriger vers le dashboard
      navigate('/multi-profile-management');

    } catch (err) {
      console.error('Erreur inscription:', err);
      setErrors({
        general: 'Une erreur inattendue s\'est produite. Veuillez réessayer.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4 flex-1">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {currentStep > 1 ? <Icon name="Check" size={20} /> : <span className="font-semibold">1</span>}
          </div>
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div className={`h-full bg-primary transition-all duration-300 ${currentStep >= 2 ? 'w-full' : 'w-0'}`} />
          </div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <span className="font-semibold">2</span>
          </div>
        </div>
      </div>

      {/* Afficher les erreurs générales */}
      {errors?.general && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4">
          <p className="text-sm font-medium">{errors.general}</p>
        </div>
      )}

      {/* Step 1: Owner Information */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
              Vos informations
            </h3>
            <p className="text-sm text-muted-foreground font-caption">
              Créez votre compte pour commencer
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Prénom"
              type="text"
              placeholder="Entrez votre prénom"
              value={ownerData?.firstName}
              onChange={(e) => handleOwnerChange('firstName', e?.target?.value)}
              error={errors?.firstName}
              required
            />

            <Input
              label="Nom"
              type="text"
              placeholder="Entrez votre nom"
              value={ownerData?.lastName}
              onChange={(e) => handleOwnerChange('lastName', e?.target?.value)}
              error={errors?.lastName}
              required
            />
          </div>

          <Input
            label="Adresse email"
            type="email"
            placeholder="votre.email@exemple.fr"
            value={ownerData?.email}
            onChange={(e) => handleOwnerChange('email', e?.target?.value)}
            error={errors?.email}
            description="Nous ne partagerons jamais votre email"
            required
          />

          <Input
            label="Mot de passe"
            type="password"
            placeholder="Créez un mot de passe sécurisé"
            value={ownerData?.password}
            onChange={(e) => handleOwnerChange('password', e?.target?.value)}
            error={errors?.password}
            description="Au moins 8 caractères avec majuscule, minuscule et chiffre"
            required
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            placeholder="Confirmez votre mot de passe"
            value={ownerData?.confirmPassword}
            onChange={(e) => handleOwnerChange('confirmPassword', e?.target?.value)}
            error={errors?.confirmPassword}
            required
          />

          <Button
            type="button"
            variant="default"
            fullWidth
            onClick={handleNextStep}
            iconName="ArrowRight"
            iconPosition="right"
          >
            Continuer
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground font-caption">
              Vous avez déjà un compte ?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-primary hover:underline font-medium"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Dog Information */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
              {skipDog ? 'Finaliser votre inscription' : 'Informations sur votre chien'}
            </h3>
            <p className="text-sm text-muted-foreground font-caption">
              {skipDog ? 'Vous pourrez ajouter votre chien plus tard' : 'Parlez-nous de votre compagnon (optionnel)'}
            </p>
          </div>

          {/* ✅ NOUVEAU : Message si on skip */}
          {skipDog && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
              <p className="text-sm text-blue-900">
                <strong>✓ Aucun problème !</strong><br />
                Vous pourrez ajouter votre chien depuis votre profil après l'inscription.
              </p>
            </div>
          )}

          {/* ✅ MODIFIÉ : Afficher les champs SEULEMENT si on ne skip pas */}
          {!skipDog && (
            <>
              <Input
                label="Nom du chien"
                type="text"
                placeholder="Ex: Max, Bella, Rex..."
                value={dogData?.dogName}
                onChange={(e) => handleDogChange('dogName', e?.target?.value)}
                error={errors?.dogName}
              />

              <Select
                label="Race"
                placeholder="Sélectionnez la race"
                options={breedOptions}
                value={dogData?.breed}
                onChange={(value) => handleDogChange('breed', value)}
                error={errors?.breed}
                searchable
              />

              {/* Âge avec sélecteur mois/ans */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Âge
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Ex: 2"
                    value={dogData?.age}
                    onChange={(e) => handleDogChange('age', e?.target?.value)}
                    error={errors?.age}
                    min="0"
                    max={dogData?.ageUnit === 'years' ? "30" : "360"}
                  />
                  <Select
                    options={ageUnitOptions}
                    value={dogData?.ageUnit}
                    onChange={(value) => handleDogChange('ageUnit', value)}
                  />
                </div>
                {errors?.age && (
                  <p className="text-xs text-destructive mt-1">{errors.age}</p>
                )}
              </div>
            </>
          )}

          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <Checkbox
              label="J'accepte les conditions d'utilisation et la politique de confidentialité"
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e?.target?.checked);
                if (errors?.terms) {
                  setErrors(prev => ({ ...prev, terms: '' }));
                }
              }}
              error={errors?.terms}
              required
            />
          </div>

          {/* ✅ MODIFIÉ : Afficher différents boutons selon skipDog */}
          {!skipDog ? (
            <>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousStep}
                  iconName="ArrowLeft"
                  iconPosition="left"
                  className="flex-1"
                >
                  Retour
                </Button>

                <Button
                  type="submit"
                  variant="default"
                  loading={loading}
                  iconName="Check"
                  iconPosition="right"
                  className="flex-1"
                >
                  Créer mon compte
                </Button>
              </div>

              {/* ✅ NOUVEAU : Bouton pour skip */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSkipDog}
                  className="text-sm text-muted-foreground hover:text-foreground underline font-medium"
                >
                  Je n'ai pas encore de chien
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSkipDog(false);
                  setErrors({});
                }}
                className="flex-1"
              >
                Ajouter mon chien maintenant
              </Button>

              <Button
                type="submit"
                variant="default"
                loading={loading}
                iconName="Check"
                iconPosition="right"
                className="flex-1"
              >
                Terminer l'inscription
              </Button>
            </div>
          )}
        </div>
      )}
    </form>
  );
};

export default RegistrationForm;
