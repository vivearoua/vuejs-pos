import React, { useState, useEffect } from 'react';

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
  // Calculer l'arrondi supérieur du total
  const roundedTotal = Math.ceil(total);
  const [amount, setAmount] = useState<string>(roundedTotal.toFixed(2));

  // Mettre à jour le montant si le total change
  useEffect(() => {
    setAmount(Math.ceil(total).toFixed(2));
  }, [total]);

  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const minAllowed = total * 0.7;


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (numericAmount < minAllowed) {
      setError(`Le montant doit être au moins égal à 70% du total (${minAllowed.toFixed(2)} €)`);
      return;
    }
    setError('');
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
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 pr-8"
              />
              <span className="absolute right-3 top-2 text-gray-500">€</span>
            </div>
            {error && (
              <div className="text-red-500 text-sm mt-1">{error}</div>
            )}
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
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
              disabled={parseFloat(amount) < minAllowed}
            >
              Valider
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
