import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Printer, AlertTriangle, CheckCircle } from 'lucide-react';

const RecipeResult = ({ recipe, dogId, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const ingredientNames = {
    proteins: {
      poulet: 'Poulet',
      dinde: 'Dinde',
      boeuf: 'Bœuf maigre',
      saumon: 'Saumon (sans arêtes)',
      oeuf: 'Œuf'
    },
    carbs: {
      riz_blanc: 'Riz blanc',
      riz_complet: 'Riz complet',
      pomme_terre: 'Pomme de terre',
      patate_douce: 'Patate douce',
      avoine: 'Flocons d\'avoine'
    },
    veggies: {
      carotte: 'Carotte',
      courgette: 'Courgette',
      haricots_verts: 'Haricots verts',
      potiron: 'Potiron',
      epinards: 'Épinards'
    },
    fats: {
      huile_colza: 'Huile de colza',
      huile_saumon: 'Huile de saumon',
      huile_olive: 'Huile d\'olive'
    }
  };

  const handleSave = async () => {
    if (!dogId) {
      alert('Aucun chien sélectionné');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('dog_recipes')
        .insert([
          {
            user_id: user.id,
            dog_id: dogId,
            title: recipe.title,
            objective: recipe.objective,
            dog_weight: recipe.weight,
            protein_type: recipe.ingredients.protein,
            carb_type: recipe.ingredients.carb,
            veggies_type: recipe.ingredients.veggies,
            fat_type: recipe.ingredients.fat,
            quantities: recipe.quantities,
            nutrition_info: recipe.nutrition,
            instructions: recipe.instructions,
            frequency: recipe.frequency
          }
        ]);

      if (error) throw error;

      setSaved(true);
      if (onSaved) onSaved();
      
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {recipe.title}
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
              {recipe.objective}
            </span>
            <span>• Pour {recipe.dogName}</span>
            <span>• {recipe.weight} kg</span>
          </div>
        </div>
      </div>

      {/* Ingrédients */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🍗 Ingrédients</h3>
        <div className="space-y-2">
          <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
            <span className="font-medium">{ingredientNames.proteins[recipe.ingredients.protein]}</span>
            <span className="text-primary font-bold">{recipe.quantities.protein}g</span>
          </div>
          
          {recipe.ingredients.carb && (
            <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
              <span className="font-medium">{ingredientNames.carbs[recipe.ingredients.carb]}</span>
              <span className="text-primary font-bold">{recipe.quantities.carb}g</span>
            </div>
          )}
          
          {recipe.ingredients.veggies.map((veggie, index) => (
            <div key={index} className="flex justify-between p-3 bg-gray-50 rounded-xl">
              <span className="font-medium">{ingredientNames.veggies[veggie]}</span>
              <span className="text-primary font-bold">
                {Math.round(recipe.quantities.veggies / recipe.ingredients.veggies.length)}g
              </span>
            </div>
          ))}
          
          <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
            <span className="font-medium">{ingredientNames.fats[recipe.ingredients.fat]}</span>
            <span className="text-primary font-bold">{recipe.quantities.fat}g</span>
          </div>

          <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
            <span className="font-medium">Eau</span>
            <span className="text-gray-600">Pour la cuisson</span>
          </div>
        </div>
      </div>

      {/* Valeurs nutritionnelles */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Valeurs nutritionnelles</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-primary/5 to-purple-50 rounded-2xl">
            <div className="text-2xl font-bold text-primary mb-1">
              {recipe.nutrition.calories}
            </div>
            <div className="text-sm text-gray-600">Calories</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-primary/5 to-purple-50 rounded-2xl">
            <div className="text-2xl font-bold text-primary mb-1">
              {recipe.nutrition.protein}g
            </div>
            <div className="text-sm text-gray-600">Protéines</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-primary/5 to-purple-50 rounded-2xl">
            <div className="text-2xl font-bold text-primary mb-1">
              {recipe.nutrition.carbs}g
            </div>
            <div className="text-sm text-gray-600">Glucides</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-primary/5 to-purple-50 rounded-2xl">
            <div className="text-2xl font-bold text-primary mb-1">
              {recipe.nutrition.fat}g
            </div>
            <div className="text-sm text-gray-600">Lipides</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-primary/5 to-purple-50 rounded-2xl">
            <div className="text-2xl font-bold text-primary mb-1">
              {recipe.nutrition.fiber}g
            </div>
            <div className="text-sm text-gray-600">Fibres</div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">👨‍🍳 Préparation</h3>
        <div className="space-y-4">
          {recipe.instructions.map((instruction, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <p className="flex-1 text-gray-700 pt-1">{instruction}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Conseils */}
      <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
          <CheckCircle size={20} />
          💡 Conseils & astuces
        </h4>
        <ul className="space-y-2 text-sm text-blue-900">
          <li>• Cette recette correspond à <strong>2 repas</strong> pour un chien de {recipe.weight}kg</li>
          <li>• Conservez la moitié au réfrigérateur jusqu'à 48h maximum</li>
          <li>• Congelez en portions individuelles pour une utilisation ultérieure</li>
          <li>• Fréquence recommandée : <strong>{recipe.frequency}</strong></li>
        </ul>
      </div>

      {/* Avertissement */}
      <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-200">
        <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
          <AlertTriangle size={20} />
          ⚠️ Important
        </h4>
        <ul className="space-y-2 text-sm text-red-900">
          <li>• <strong>Recette complémentaire</strong> – ne remplace pas une alimentation complète et équilibrée</li>
          <li>• Introduisez progressivement (25% nouveau, 75% ancien pendant 5-7 jours)</li>
          <li>• Surveillez les selles et le comportement de votre chien</li>
          <li>• En cas de doute, consultez votre vétérinaire</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saved ? (
            <>
              <CheckCircle size={20} />
              <span>Sauvegardée !</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
            </>
          )}
        </button>

        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
        >
          <Printer size={20} />
          <span>Imprimer</span>
        </button>
      </div>
    </div>
  );
};

export default RecipeResult;
