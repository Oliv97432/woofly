import React from 'react';
import { Check } from 'lucide-react';

const IngredientSelector = ({ selectedIngredients, onSelectionChange }) => {
  const ingredients = {
    proteins: [
      { id: 'poulet', name: 'Poulet', emoji: '🍗' },
      { id: 'dinde', name: 'Dinde', emoji: '🦃' },
      { id: 'boeuf', name: 'Bœuf maigre', emoji: '🥩' },
      { id: 'saumon', name: 'Saumon', emoji: '🐟' },
      { id: 'oeuf', name: 'Œuf', emoji: '🥚' }
    ],
    carbs: [
      { id: 'riz_blanc', name: 'Riz blanc', emoji: '🍚' },
      { id: 'riz_complet', name: 'Riz complet', emoji: '🌾' },
      { id: 'pomme_terre', name: 'Pomme de terre', emoji: '🥔' },
      { id: 'patate_douce', name: 'Patate douce', emoji: '🍠' },
      { id: 'avoine', name: 'Flocons d\'avoine', emoji: '🌾' }
    ],
    veggies: [
      { id: 'carotte', name: 'Carotte', emoji: '🥕' },
      { id: 'courgette', name: 'Courgette', emoji: '🥒' },
      { id: 'haricots_verts', name: 'Haricots verts', emoji: '🫘' },
      { id: 'potiron', name: 'Potiron', emoji: '🎃' },
      { id: 'epinards', name: 'Épinards', emoji: '🥬' }
    ],
    fats: [
      { id: 'huile_colza', name: 'Huile de colza', emoji: '🫒' },
      { id: 'huile_saumon', name: 'Huile de saumon', emoji: '🐟' },
      { id: 'huile_olive', name: 'Huile d\'olive', emoji: '🫒' }
    ]
  };

  const handleProteinSelect = (proteinId) => {
    onSelectionChange({
      ...selectedIngredients,
      protein: proteinId
    });
  };

  const handleCarbSelect = (carbId) => {
    onSelectionChange({
      ...selectedIngredients,
      carb: selectedIngredients.carb === carbId ? null : carbId
    });
  };

  const handleVeggieToggle = (veggieId) => {
    const currentVeggies = selectedIngredients.veggies || [];
    const isSelected = currentVeggies.includes(veggieId);
    
    let newVeggies;
    if (isSelected) {
      newVeggies = currentVeggies.filter(v => v !== veggieId);
    } else {
      if (currentVeggies.length >= 2) {
        alert('Maximum 2 légumes autorisés');
        return;
      }
      newVeggies = [...currentVeggies, veggieId];
    }

    onSelectionChange({
      ...selectedIngredients,
      veggies: newVeggies
    });
  };

  const handleFatSelect = (fatId) => {
    onSelectionChange({
      ...selectedIngredients,
      fat: fatId
    });
  };

  const IngredientCard = ({ ingredient, isSelected, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative p-4 rounded-2xl border-2 transition-all
        ${isSelected 
          ? 'border-primary bg-primary/5' 
          : 'border-gray-200 bg-white hover:border-gray-300'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="text-center">
        <div className="text-3xl mb-2">{ingredient.emoji}</div>
        <div className="text-sm font-medium text-gray-900">{ingredient.name}</div>
      </div>
      
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <Check size={14} className="text-white" />
        </div>
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
      {/* Protéines */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          🥩 Protéine <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm text-gray-600 mb-4">Sélectionnez une protéine (obligatoire)</p>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {ingredients.proteins.map(protein => (
            <IngredientCard
              key={protein.id}
              ingredient={protein}
              isSelected={selectedIngredients.protein === protein.id}
              onClick={() => handleProteinSelect(protein.id)}
            />
          ))}
        </div>
      </div>

      {/* Glucides */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          🌾 Glucides
        </h3>
        <p className="text-sm text-gray-600 mb-4">Optionnel (0 ou 1)</p>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {ingredients.carbs.map(carb => (
            <IngredientCard
              key={carb.id}
              ingredient={carb}
              isSelected={selectedIngredients.carb === carb.id}
              onClick={() => handleCarbSelect(carb.id)}
            />
          ))}
        </div>
      </div>

      {/* Légumes */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          🥕 Légumes <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm text-gray-600 mb-4">Sélectionnez 1 ou 2 légumes (obligatoire)</p>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {ingredients.veggies.map(veggie => (
            <IngredientCard
              key={veggie.id}
              ingredient={veggie}
              isSelected={selectedIngredients.veggies?.includes(veggie.id)}
              onClick={() => handleVeggieToggle(veggie.id)}
            />
          ))}
        </div>
      </div>

      {/* Graisses */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          🫒 Graisse
        </h3>
        <p className="text-sm text-gray-600 mb-4">Automatique (recommandé : huile de colza)</p>
        <div className="grid grid-cols-3 gap-3">
          {ingredients.fats.map(fat => (
            <IngredientCard
              key={fat.id}
              ingredient={fat}
              isSelected={selectedIngredients.fat === fat.id}
              onClick={() => handleFatSelect(fat.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default IngredientSelector;
