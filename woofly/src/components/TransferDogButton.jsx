import React, { useState } from 'react';
import { Send } from 'lucide-react';
import TransferModal from './TransferModal';

const TransferDogButton = ({ dog, professionalAccountId, onTransferComplete }) => {
  const [showModal, setShowModal] = useState(false);

  if (!dog || !professionalAccountId) {
    return null;
  }

  // Ne pas afficher le bouton si le chien est déjà adopté
  if (dog.adoption_status === 'adopted') {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-2xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg"
      >
        <Send size={24} />
        Transférer ce chien à son adoptant
      </button>

      {showModal && (
        <TransferModal
          dog={dog}
          professionalAccountId={professionalAccountId}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            if (onTransferComplete) {
              onTransferComplete();
            }
          }}
        />
      )}
    </>
  );
};

export default TransferDogButton;
