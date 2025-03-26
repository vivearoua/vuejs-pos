import React from 'react';
import { useSession } from '../context/SessionContext';

const ProductCard: React.FC<{ 
  product: { 
    id: string;
    type: 'phone' | 'accessory';
    price: number;
    brand: string;
    stock: number;
    [key: string]: any;
  };
  onAdd: () => void;
}> = ({ product, onAdd }) => {
  const isPhone = product.type === 'phone';
  const name = isPhone ? `${product.brand} ${product.model}` : product.name;
  const details = isPhone 
    ? `${product.storage} - ${product.color}`
    : `${product.brand} - Compatible: ${product.compatible_with.join(', ')}`;

  return (
    <div
      onClick={onAdd}
      className="border rounded-lg p-3 cursor-pointer hover:shadow-lg transition-shadow bg-white"
    >
      <div className="font-medium text-lg mb-1">{name}</div>
      <div className="text-sm text-gray-600 mb-2">{details}</div>
      <div className="flex justify-between items-center">
        <div className="text-purple-600 font-bold">{product.price.toFixed(2)} $</div>
        <div className="text-sm text-gray-500">Stock: {product.stock}</div>
      </div>
    </div>
  );
};

const SessionPage: React.FC = () => {
  const {
    customer,
    cart,
    tax,
    discount,
    shipping,
    searchTerm,
    filteredProducts,
    setCustomer,
    addToCart,
    updateQuantity,
    removeFromCart,
    setTax,
    setDiscount,
    setShipping,
    setSearchTerm,
    resetSession,
    total
  } = useSession();

  return (
    <div className="p-4 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center space-x-4 mb-4">
        <button className="bg-purple-100 text-purple-600 px-4 py-2 rounded-lg text-sm">
          🧑 Nouveau Client
        </button>
        <div className="w-64">
          <select 
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm py-1"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          >
            <option value="Passager">Passager</option>
            {/* Autres clients peuvent être ajoutés ici */}
          </select>
        </div>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Panier - 1/3 de l'espace */}
        <div className="w-1/3 bg-white rounded-lg shadow p-4 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm">Produit</th>
                  <th className="text-right py-2 text-sm">Prix</th>
                  <th className="text-right py-2 text-sm">Qté</th>
                  <th className="text-right py-2 text-sm">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">
                      <div className="text-sm">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.type === 'phone' ? 'Téléphone' : 'Accessoire'}</div>
                    </td>
                    <td className="text-right text-sm">{item.price.toFixed(2)} $</td>
                    <td className="text-right">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value);
                          if (!isNaN(newQuantity) && newQuantity > 0) {
                            updateQuantity(item.id, newQuantity);
                          }
                        }}
                        className="w-12 text-right border rounded text-sm py-1"
                      />
                    </td>
                    <td className="text-right text-sm">{item.subtotal.toFixed(2)} $</td>
                    <td className="text-right">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t mt-4 pt-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Taxe (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tax}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 100) {
                      setTax(value);
                    }
                  }}
                  className="w-full rounded border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm py-1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Remise (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 100) {
                      setDiscount(value);
                    }
                  }}
                  className="w-full rounded border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm py-1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Livraison ($)</label>
                <input
                  type="number"
                  min="0"
                  value={shipping}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0) {
                      setShipping(value);
                    }
                  }}
                  className="w-full rounded border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm py-1"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mb-4 text-lg font-bold">
              <span>Total:</span>
              <span>{total.toFixed(2)} $</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={resetSession}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm"
              >
                🔄 Réinitialiser
              </button>
              <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm">
                💳 Payer Maintenant
              </button>
            </div>
          </div>
        </div>

        {/* Liste des produits - 2/3 de l'espace */}
        <div className="w-2/3 bg-white rounded-lg shadow p-4 flex flex-col">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Rechercher par Nom / Marque / Modèle"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={() => addToCart(product)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionPage; 