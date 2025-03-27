import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventoryService';

interface StockMovementsProps {
  productId: string;
}

export default function StockMovements({ productId }: StockMovementsProps) {
  const [movements, setMovements] = useState<any[]>([]);
  const [newMovement, setNewMovement] = useState({
    type: 'in' as 'in' | 'out',
    quantity: 1,
    reason: 'reception' as 'reception' | 'return' | 'adjustment',
    reference: ''
  });

  useEffect(() => {
    loadMovements();

    const unsubscribe = inventoryService.subscribe((type, data) => {
      if (type === 'movement_added' && data.productId === productId) {
        loadMovements();
      }
    });

    return () => unsubscribe();
  }, [productId]);

  const loadMovements = () => {
    setMovements(inventoryService.getMovements(productId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      inventoryService.addMovement({
        productId,
        ...newMovement
      });
      setNewMovement({
        type: 'in',
        quantity: 1,
        reason: 'reception',
        reference: ''
      });
    } catch (error) {
      alert('Erreur lors de l\'ajout du mouvement : ' + error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Mouvements de Stock</h3>

      {/* Formulaire d'ajout */}
      <form onSubmit={handleSubmit} className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={newMovement.type}
            onChange={(e) => setNewMovement({
              ...newMovement,
              type: e.target.value as 'in' | 'out'
            })}
            className="w-full p-2 border rounded-lg text-sm"
          >
            <option value="in">Entrée</option>
            <option value="out">Sortie</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quantité</label>
          <input
            type="number"
            min="1"
            value={newMovement.quantity}
            onChange={(e) => setNewMovement({
              ...newMovement,
              quantity: parseInt(e.target.value)
            })}
            className="w-full p-2 border rounded-lg text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Raison</label>
          <select
            value={newMovement.reason}
            onChange={(e) => setNewMovement({
              ...newMovement,
              reason: e.target.value as 'reception' | 'return' | 'adjustment'
            })}
            className="w-full p-2 border rounded-lg text-sm"
          >
            <option value="reception">Réception</option>
            <option value="return">Retour</option>
            <option value="adjustment">Ajustement</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Référence</label>
          <input
            type="text"
            value={newMovement.reference}
            onChange={(e) => setNewMovement({
              ...newMovement,
              reference: e.target.value
            })}
            placeholder="Optionnel"
            className="w-full p-2 border rounded-lg text-sm"
          />
        </div>

        <div className="col-span-2">
          <button
            type="submit"
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
          >
            Ajouter le Mouvement
          </button>
        </div>
      </form>

      {/* Liste des mouvements */}
      <div className="overflow-y-auto max-h-64">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1 text-left text-xs">Date</th>
              <th className="px-2 py-1 text-center text-xs">Type</th>
              <th className="px-2 py-1 text-right text-xs">Qté</th>
              <th className="px-2 py-1 text-left text-xs">Raison</th>
              <th className="px-2 py-1 text-left text-xs">Réf.</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => (
              <tr key={movement.id} className="border-t">
                <td className="px-2 py-1 text-xs">
                  {formatDate(movement.date)}
                </td>
                <td className="px-2 py-1 text-center">
                  <span className={movement.type === 'in' ? 'text-green-500' : 'text-red-500'}>
                    {movement.type === 'in' ? '↑' : '↓'}
                  </span>
                </td>
                <td className="px-2 py-1 text-right text-xs">
                  {movement.quantity}
                </td>
                <td className="px-2 py-1 text-xs">
                  {movement.reason === 'reception' && 'Réception'}
                  {movement.reason === 'return' && 'Retour'}
                  {movement.reason === 'adjustment' && 'Ajustement'}
                  {movement.reason === 'sale' && 'Vente'}
                </td>
                <td className="px-2 py-1 text-xs text-gray-500">
                  {movement.reference}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
