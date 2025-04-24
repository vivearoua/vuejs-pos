import React, { useState, useEffect } from 'react';
import { inventoryService, Product } from '../../services/inventoryService';
import { ArrowUp, ArrowDown, Plus } from 'lucide-react';

interface StockMovementsProps {
  productId: string;
}

export default function StockMovements({ productId }: StockMovementsProps) {
  const [movements, setMovements] = useState<any[]>([]);
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [newMovement, setNewMovement] = useState({
    type: 'in' as 'in' | 'out',
    quantity: 1,
    reason: 'reception' as 'reception' | 'return' | 'adjustment' | 'sale',
    reference: ''
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadMovements();
    loadProduct();

    const unsubscribe = inventoryService.subscribe((type, data) => {
      if (type === 'movement_added' && data.productId === productId) {
        loadMovements();
        loadProduct();
      }
    });

    return () => unsubscribe();
  }, [productId]);

  const loadMovements = () => {
    setMovements(inventoryService.getMovements(productId));
  };

  const loadProduct = () => {
    setProduct(inventoryService.getProduct(productId));
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
      setShowForm(false);
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

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'reception': return 'Réception';
      case 'return': return 'Retour';
      case 'adjustment': return 'Ajustement';
      case 'sale': return 'Vente';
      default: return reason;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Mouvements de Stock</h3>
        {product && (
          <div className="text-sm">
            Stock actuel: <span className="font-bold">{product.stock}</span>
          </div>
        )}
      </div>

      {/* Bouton pour afficher/masquer le formulaire */}
      <div className="p-4 border-b">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
        >
          <Plus size={16} className="mr-1" />
          {showForm ? 'Masquer le formulaire' : 'Ajouter un mouvement'}
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="p-4 bg-gray-50 border-b">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
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
                  reason: e.target.value as 'reception' | 'return' | 'adjustment' | 'sale'
                })}
                className="w-full p-2 border rounded-lg text-sm"
              >
                <option value="reception">Réception</option>
                <option value="return">Retour</option>
                <option value="adjustment">Ajustement</option>
                <option value="sale">Vente</option>
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

            <div className="col-span-2 flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des mouvements */}
      <div className="overflow-y-auto max-h-96">
        {movements.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Aucun mouvement de stock enregistré
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qté</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Raison</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Réf.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {movements.map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs whitespace-nowrap">
                    {formatDate(movement.date)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {movement.type === 'in' ? (
                      <ArrowUp className="inline text-green-500" size={16} />
                    ) : (
                      <ArrowDown className="inline text-red-500" size={16} />
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-medium">
                    {movement.quantity}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {getReasonLabel(movement.reason)}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {movement.reference || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
