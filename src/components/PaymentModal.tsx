import React, { useState } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentDetails: PaymentDetails) => void;
  total: number;
}

export interface PaymentDetails {
  method: 'cash';
  amount: number;
  change?: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onConfirm, total }) => {
  const [amount, setAmount] = useState<string>(total.toFixed(2));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    
    const paymentDetails: PaymentDetails = {
      method: 'cash',
      amount: numericAmount,
      ...(numericAmount > total ? { change: numericAmount - total } : {})
    };

    onConfirm(paymentDetails);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Paiement en Espèces</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant reçu
            </label>
            <div className="relative">
              <input
                type="number"
                min={total}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 pr-8"
              />
              <span className="absolute right-3 top-2 text-gray-500">€</span>
            </div>
          </div>

          {parseFloat(amount) > total && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monnaie à rendre
              </label>
              <div className="bg-gray-100 p-2 rounded text-lg font-bold text-center">
                {(parseFloat(amount) - total).toFixed(2)} €
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700"
            >
              Confirmer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
