import { useState, useEffect } from 'react';
import storeData from '../data/store.json';
import { Search, Package, Smartphone } from 'lucide-react';
import { logger } from '../utils/logger';
import ErrorBoundary from './ErrorBoundary';

type ProductType = 'all' | 'phone' | 'accessory';

function InventoryContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<ProductType>('all');

  const phones = storeData.phones;
  const accessories = storeData.accessories;

  useEffect(() => {
    logger.info('Inventory page mounted', {
      totalPhones: phones.length,
      totalAccessories: accessories.length,
      totalItems: phones.length + accessories.length,
      lowStockItems: [...phones, ...accessories].filter(item => item.stock < 10).length
    });
  }, [phones.length, accessories.length]);

  const filteredItems = [...phones.map(phone => ({
    ...phone,
    type: 'phone' as const,
    displayName: `${phone.brand} ${phone.model}`,
    details: `${phone.storage} - ${phone.color}`
  })), ...accessories.map(acc => ({
    ...acc,
    type: 'accessory' as const,
    displayName: acc.name,
    details: acc.brand
  }))].filter(item => {
    const matchesSearch = item.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'all' || category === item.type;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (searchTerm || category !== 'all') {
      logger.info('Inventory filtered', {
        searchTerm,
        category,
        resultsCount: filteredItems.length,
        totalItems: phones.length + accessories.length
      });
    }
  }, [searchTerm, category, filteredItems.length, phones.length, accessories.length]);

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: 'text-red-600', bg: 'bg-red-100', text: 'Rupture de stock' };
    if (stock < 10) {
      logger.warn('Low stock item detected', { stock });
      return { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Stock faible' };
    }
    return { color: 'text-green-600', bg: 'bg-green-100', text: 'En stock' };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Gestion du Stock</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher dans le stock..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductType)}
          >
            <option value="all">Tous les articles</option>
            <option value="phone">Téléphones</option>
            <option value="accessory">Accessoires</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Article
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Catégorie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prix
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.map((item) => {
              const status = getStockStatus(item.stock);
              return (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {item.type === 'phone' ? (
                        <Smartphone className="h-10 w-10 text-gray-500" aria-label="Téléphone" />
                      ) : (
                        <Package className="h-10 w-10 text-gray-500" aria-label="Accessoire" />
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.displayName}
                        </div>
                        <div className="text-sm text-gray-500">{item.details}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {item.type === 'phone' ? 'Téléphone' : 'Accessoire'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.bg} ${status.color}`}>
                      {status.text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Inventory() {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-red-600 text-center">
            <h2 className="text-lg font-bold">Une erreur est survenue</h2>
            <p>Impossible de charger l'inventaire</p>
          </div>
        </div>
      }
    >
      <InventoryContent />
    </ErrorBoundary>
  );
}