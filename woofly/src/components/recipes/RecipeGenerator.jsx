import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ChefHat, Sparkles } from 'lucide-react';
import IngredientSelector from './IngredientSelector';
import RecipeResult from './RecipeResult';

const RecipeGenerator = () => {
  const [activeDog, setActiveDog] = useState(null);
  const [weight, setWeight] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState({
    protein: null,
    carb: null,
    veggies: [],
    fat: 'huile_colza' // Par défaut
  });
  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadActiveDog();
  }, []);

  const loadActiveDog = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: dog } = await supabase
        .from('dogs')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (dog) {
        setActiveDog(dog);
        setWeight(dog.weight || '');
      }
    } catch (error) {
      console.error('Erreur chargement chien:', error);
    }
  };

  const generateRecipe = async () => {
    // Validation
    if (!weight || weight <= 0) {
      alert('Veuillez entrer un poids valide');
      return;
    }

    if (!selectedIngredients.protein) {
      alert('Veuillez sélectionner au moins une protéine');
      return;
    }

    if (selectedIngredients.veggies.length === 0) {
      alert('Veuillez sélectionner au moins un légume');
      return;
    }

    if (selectedIngredients.veggies.length > 2) {
      alert('Maximum 2 légumes autorisés');
      return;
    }

    setLoading(true);

    try {
      // Calcul des quantités basées sur le poids
      const totalGrams = Math.round(weight * 25); // Base : 25g par kg

      // Proportions
      const proteinGrams = Math.round(totalGrams * 0.55); // 55%
      const carbGrams = selectedIngredients.carb ? Math.round(totalGrams * 0.25) : 0; // 25% si présent
      const veggiesGrams = Math.round(totalGrams * 0.15); // 15%
      const fatGrams = Math.round(totalGrams * 0.02); // 2%

      // Ajustement si saumon (réduire graisse)
      const adjustedFatGrams = selectedIngredients.protein === 'saumon' 
        ? Math.round(fatGrams * 0.5) 
        : fatGrams;

      // Calculer valeurs nutritionnelles
      const nutrition = calculateNutrition({
        protein: selectedIngredients.protein,
        proteinGrams,
        carb: selectedIngredients.carb,
        carbGrams,
        veggies: selectedIngredients.veggies,
        veggiesGrams,
        fatGrams: adjustedFatGrams
      });

      // Générer le titre et l'objectif
      const title = generateTitle(selectedIngredients.protein, activeDog?.name);
      const objective = generateObjective(selectedIngredients);

      // Générer les instructions
      const instructions = generateInstructions(selectedIngredients, {
        protein: proteinGrams,
        carb: carbGrams,
        veggies: veggiesGrams,
        fat: adjustedFatGrams
      });

      // Fréquence recommandée
      const frequency = calculateFrequency(selectedIngredients);

      const recipe = {
        title,
        objective,
        dogName: activeDog?.name || 'votre chien',
        weight: parseFloat(weight),
        ingredients: selectedIngredients,
        quantities: {
          protein: proteinGrams,
          carb: carbGrams,
          veggies: veggiesGrams,
          fat: adjustedFatGrams,
          total: totalGrams
        },
        nutrition,
        instructions,
        frequency
      };

      setGeneratedRecipe(recipe);
    } catch (error) {
      console.error('Erreur génération recette:', error);
      alert('Erreur lors de la génération de la recette');
    } finally {
      setLoading(false);
    }
  };

  const calculateNutrition = ({ protein, proteinGrams, carb, carbGrams, veggies, veggiesGrams, fatGrams }) => {
    // Valeurs nutritionnelles pour 100g
    const nutritionData = {
      proteins: {
        poulet: { calories: 165, protein: 31, fat: 3.6 },
        dinde: { calories: 135, protein: 29, fat: 1 },
        boeuf: { calories: 250, protein: 26, fat: 17 },
        saumon: { calories: 208, protein: 20, fat: 13 },
        oeuf: { calories: 155, protein: 13, fat: 11 }
      },
      carbs: {
        riz_blanc: { calories: 130, carbs: 28 },
        riz_complet: { calories: 111, carbs: 23 },
        pomme_terre: { calories: 77, carbs: 17 },
        patate_douce: { calories: 86, carbs: 20 },
        avoine: { calories: 389, carbs: 66 }
      },
      veggies: {
        carotte: { calories: 41, fiber: 2.8 },
        courgette: { calories: 17, fiber: 1 },
        haricots_verts: { calories: 31, fiber: 3.4 },
        potiron: { calories: 26, fiber: 0.5 },
        epinards: { calories: 23, fiber: 2.2 }
      },
      fats: {
        huile_colza: { calories: 884, omega3: 9.1 },
        huile_saumon: { calories: 884, omega3: 15.0 },
        huile_olive: { calories: 884, omega3: 0.76 }
      }
    };

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    // Protéine
    if (nutritionData.proteins[protein]) {
      const p = nutritionData.proteins[protein];
      totalCalories += (proteinGrams * p.calories) / 100;
      totalProtein += (proteinGrams * p.protein) / 100;
      totalFat += (proteinGrams * p.fat) / 100;
    }

    // Glucides
    if (carb && nutritionData.carbs[carb]) {
      const c = nutritionData.carbs[carb];
      totalCalories += (carbGrams * c.calories) / 100;
      totalCarbs += (carbGrams * c.carbs) / 100;
    }

    // Légumes
    veggies.forEach(veg => {
      if (nutritionData.veggies[veg]) {
        const v = nutritionData.veggies[veg];
        const vegGrams = veggiesGrams / veggies.length; // Répartir équitablement
        totalCalories += (vegGrams * v.calories) / 100;
        totalFiber += (vegGrams * v.fiber) / 100;
      }
    });

    // Graisse
    if (selectedIngredients.fat && nutritionData.fats[selectedIngredients.fat]) {
      const f = nutritionData.fats[selectedIngredients.fat];
      totalCalories += (fatGrams * f.calories) / 100;
      totalFat += fatGrams;
    }

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
      fiber: Math.round(totalFiber * 10) / 10
    };
  };

  const generateTitle = (protein, dogName) => {
    const proteinNames = {
      poulet: 'Poulet',
      dinde: 'Dinde',
      boeuf: 'Bœuf',
      saumon: 'Saumon',
      oeuf: 'Œuf'
    };
    return `Recette ${proteinNames[protein]} pour ${dogName || 'votre chien'}`;
  };

  const generateObjective = (ingredients) => {
    if (ingredients.protein === 'saumon') return 'Pelage brillant & oméga-3';
    if (ingredients.veggies.includes('potiron')) return 'Digestion facile';
    if (ingredients.carb === 'patate_douce') return 'Énergie douce & stable';
    if (ingredients.veggies.includes('carotte')) return 'Vision & vitalité';
    return 'Repas équilibré & plaisir';
  };

  const generateInstructions = (ingredients, quantities) => {
    const proteinNames = {
      poulet: 'poulet',
      dinde: 'dinde',
      boeuf: 'bœuf maigre',
      saumon: 'saumon (sans arêtes)',
      oeuf: 'œuf'
    };

    const carbNames = {
      riz_blanc: 'riz blanc',
      riz_complet: 'riz complet',
      pomme_terre: 'pomme de terre',
      patate_douce: 'patate douce',
      avoine: 'flocons d\'avoine'
    };

    const veggieNames = {
      carotte: 'carotte',
      courgette: 'courgette',
      haricots_verts: 'haricots verts',
      potiron: 'potiron',
      epinards: 'épinards'
    };

    const steps = [
      `Pesez ${quantities.protein}g de ${proteinNames[ingredients.protein]}. Faites cuire à la vapeur ou à la poêle sans matière grasse jusqu'à cuisson complète.`
    ];

    if (ingredients.carb) {
      steps.push(`Faites cuire ${quantities.carb}g de ${carbNames[ingredients.carb]} selon les instructions, sans sel ni assaisonnement.`);
    }

    const veggiesList = ingredients.veggies.map(v => veggieNames[v]).join(' et ');
    steps.push(`Faites cuire ${quantities.veggies}g de ${veggiesList} à la vapeur jusqu'à ce qu'ils soient tendres (10-15 min).`);

    steps.push(`Coupez la protéine en petits morceaux. Mélangez tous les ingrédients dans un grand bol.`);

    steps.push(`Ajoutez ${quantities.fat}g de ${ingredients.fat.replace('_', ' d\'')}. Mélangez bien.`);

    steps.push(`Laissez refroidir à température ambiante avant de servir. Vérifiez la température.`);

    return steps;
  };

  const calculateFrequency = (ingredients) => {
    if (ingredients.protein === 'oeuf' || ingredients.protein === 'boeuf') {
      return '2-3 fois par semaine maximum';
    }
    if (ingredients.carb === 'riz_complet') {
      return '2-3 fois par semaine (alternez avec riz blanc)';
    }
    return '3-4 fois par semaine';
  };

  return (
    <div className="space-y-6">
      {/* Carte informations du chien */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ChefHat className="text-primary" size={24} />
          Créer une recette
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pour quel chien ?
          </label>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            {activeDog ? (
              <>
                {activeDog.profile_image_url && (
                  <img 
                    src={activeDog.profile_image_url} 
                    alt={activeDog.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-bold text-gray-900">{activeDog.name}</p>
                  <p className="text-sm text-gray-600">{activeDog.breed}</p>
                </div>
              </>
            ) : (
              <p className="text-gray-600">Aucun chien actif</p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Poids du chien (kg) *
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Ex : 15"
            min="1"
            max="100"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Sélection des ingrédients */}
      <IngredientSelector
        selectedIngredients={selectedIngredients}
        onSelectionChange={setSelectedIngredients}
      />

      {/* Bouton génération */}
      <button
        onClick={generateRecipe}
        disabled={loading || !weight || !selectedIngredients.protein}
        className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Génération en cours...</span>
          </>
        ) : (
          <>
            <Sparkles size={20} />
            <span>Générer la recette</span>
          </>
        )}
      </button>

      {/* Résultat */}
      {generatedRecipe && (
        <RecipeResult 
          recipe={generatedRecipe}
          dogId={activeDog?.id}
          onSaved={() => {
            // Rafraîchir l'historique
            window.dispatchEvent(new Event('recipeCreated'));
          }}
        />
      )}
    </div>
  );
};

export default RecipeGenerator;
