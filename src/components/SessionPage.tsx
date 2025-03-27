import React, { useEffect, useState } from 'react';
import { useSession } from '../context/SessionContext';
import { logger } from '../utils/logger';
import ErrorBoundary from './ErrorBoundary';
import PaymentModal from './PaymentModal';
import { transactionService } from '../services/transactionService';
import type { PaymentDetails } from './PaymentModal';

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
    : `${product.brand} - Compatible avec : ${product.compatible_with.join(', ')}`;

  return (
    <div
      onClick={onAdd}
      className="border rounded-lg p-3 cursor-pointer hover:shadow-lg transition-shadow bg-white"
      aria-label={`Ajouter ${name} au panier`}
    >
      <div className="font-medium text-lg mb-1">{name}</div>
      <div className="text-sm text-gray-600 mb-2">{details}</div>
      <div className="flex justify-between items-center">
        <div className="text-purple-600 font-bold">{product.price.toFixed(2)} €</div>
        <div className="text-sm text-gray-500">Stock : {product.stock}</div>
      </div>
    </div>
  );
};

function SessionContent() {
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
    total,
    subtotal
  } = useSession();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<string | null>(null);

  useEffect(() => {
    logger.info('Session page mounted', {
      customer,
      cartSize: cart.length,
      cartTotal: total,
      productsCount: filteredProducts.length
    });
  }, []);

  const handleCustomerChange = (newCustomer: string) => {
    try {
      logger.info('Customer changed', {
        previousCustomer: customer,
        newCustomer
      });
      setCustomer(newCustomer);
    } catch (err) {
      logger.error('Error changing customer', err);
    }
  };

  const handleSearch = (term: string) => {
    try {
      setSearchTerm(term);
      logger.info('Product search performed', {
        searchTerm: term,
        resultsCount: filteredProducts.length
      });
    } catch (err) {
      logger.error('Error during product search', err);
    }
  };

  const handleAddToCart = (product: any) => {
    try {
      addToCart(product);
      logger.info('Product added to cart', {
        productId: product.id,
        productName: product.type === 'phone' ? `${product.brand} ${product.model}` : product.name,
        cartSize: cart.length + 1
      });
    } catch (err) {
      logger.error('Error adding product to cart', err);
    }
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    try {
      updateQuantity(id, quantity);
      const item = cart.find(i => i.id === id);
      logger.info('Cart item quantity updated', {
        productId: id,
        productName: item?.name,
        previousQuantity: item?.quantity,
        newQuantity: quantity
      });
    } catch (err) {
      logger.error('Error updating cart item quantity', err);
    }
  };

  const handleRemoveFromCart = (id: string) => {
    try {
      const item = cart.find(i => i.id === id);
      removeFromCart(id);
      logger.info('Product removed from cart', {
        productId: id,
        productName: item?.name,
        cartSize: cart.length - 1
      });
    } catch (err) {
      logger.error('Error removing product from cart', err);
    }
  };

  const handleResetSession = () => {
    try {
      logger.info('Session reset requested', {
        cartSize: cart.length,
        cartTotal: total
      });
      resetSession();
    } catch (err) {
      logger.error('Error resetting session', err);
    }
  };

  const handlePayment = (paymentDetails: PaymentDetails) => {
    try {
      const transaction = transactionService.createTransaction({
        customer,
        items: cart,
        subtotal,
        tax,
        taxAmount: (subtotal * tax) / 100,
        discount,
        discountAmount: (subtotal * discount) / 100,
        shipping,
        total,
        payment: paymentDetails
      });

      setLastTransaction(transaction.id);
      setIsPaymentModalOpen(false);
      resetSession();

      logger.info('Transaction completed', {
        transactionId: transaction.id,
        total: transaction.total,
        paymentMethod: paymentDetails.method
      });
    } catch (err) {
      logger.error('Error processing payment', err);
    }
  };

  return (
    <div className="relative">
      <div className="p-4 h-[calc(100vh-6rem)] flex flex-col">
        {lastTransaction && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center justify-between">
            <span>✅ Transaction {lastTransaction} complétée avec succès</span>
            <button
              onClick={() => setLastTransaction(null)}
              className="text-green-700 hover:text-green-800"
              aria-label="Fermer la notification"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex items-center space-x-4 mb-4">
          <button 
            className="bg-purple-100 text-purple-600 px-4 py-2 rounded-lg text-sm"
            aria-label="Créer un nouveau client"
          >
            🧑 Nouveau Client
          </button>
          <div className="w-64">
            <select 
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm py-1"
              value={customer}
              onChange={(e) => handleCustomerChange(e.target.value)}
              aria-label="Sélectionner un client"
            >
              <option value="Passager">Client Passager</option>
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
                      <td className="text-right text-sm">{item.price.toFixed(2)} €</td>
                      <td className="text-right">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value);
                            if (!isNaN(newQuantity) && newQuantity > 0) {
                              handleUpdateQuantity(item.id, newQuantity);
                            }
                          }}
                          className="w-12 text-right border rounded text-sm py-1"
                          aria-label={`Quantité de ${item.name}`}
                        />
                      </td>
                      <td className="text-right text-sm">{item.subtotal.toFixed(2)} €</td>
                      <td className="text-right">
                        <button
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                          aria-label={`Supprimer ${item.name} du panier`}
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">TVA (%)</label>
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
                    aria-label="Taux de TVA en pourcentage"
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
                    aria-label="Taux de remise en pourcentage"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Livraison (€)</label>
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
                    aria-label="Frais de livraison"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mb-4 text-lg font-bold">
                <span>Total :</span>
                <span>{total.toFixed(2)} €</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleResetSession}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm"
                  aria-label="Réinitialiser la session"
                >
                  🔄 Réinitialiser
                </button>
                <button 
                  onClick={() => setIsPaymentModalOpen(true)}
                  disabled={cart.length === 0}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                  aria-label="Procéder au paiement"
                >
                  💳 Payer
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
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                aria-label="Rechercher des produits"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={() => handleAddToCart(product)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirm={handlePayment}
        total={total}
      />
    </div>
  );
}

export default function SessionPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-red-600 text-center">
            <h2 className="text-lg font-bold">Une erreur est survenue</h2>
            <p>Impossible de charger la session</p>
          </div>
        </div>
      }
    >
      <SessionContent />
    </ErrorBoundary>
  );
}