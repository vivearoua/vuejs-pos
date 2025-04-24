import React, { useEffect, useState } from 'react';
import { useSession } from '../context/SessionContext';
import { logger } from '../utils/logger';
import ErrorBoundary from './ErrorBoundary';
import PaymentModal from './PaymentModal';
import { transactionService } from '../services/transactionService';
import { userService } from '../services/userService';
import { clientService } from '../services/clientService';
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

const SessionContent: React.FC = () => {
  const { 
    customer: customerName, 
    cart, 
    tax, 
    discount, 
    shipping, 
    searchTerm, 
    filteredProducts, 
    subtotal, 
    total, 
    setCustomer: setCustomerName, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    setTax, 
    setDiscount, 
    setShipping, 
    resetSession,
    setSearchTerm 
  } = useSession();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<string | null>(null);
  const [customers, setCustomers] = useState(clientService.getClients());
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [showExportOptions, setShowExportOptions] = useState(false);

  useEffect(() => {
    // Charger les clients depuis le service
    const loadedCustomers = clientService.getClients();
    setCustomers(loadedCustomers);
    
    // Sélectionner le premier client par défaut ou 'Client Passager' si disponible
    if (loadedCustomers.length > 0) {
      const guestCustomer = loadedCustomers.find(c => c.name === 'Client Passager') || loadedCustomers[0];
      setSelectedCustomerId(guestCustomer.id);
      setCustomerName(guestCustomer.name);
    } else {
      setCustomerName('Client Passager');
    }
    
    logger.info('Session page mounted', {
      customer: customerName,
      cartSize: cart.length,
      cartTotal: total,
      productsCount: filteredProducts.length,
      customersLoaded: loadedCustomers.length
    });
  }, []);

  const handleCustomerChange = (customerId: string) => {
    const selectedCustomer = clientService.getClientById(customerId);
    if (selectedCustomer) {
      setSelectedCustomerId(customerId);
      setCustomerName(selectedCustomer.name);
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
      logger.info('Session reset', {
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
      // Obtenir l'utilisateur actuel (caissier)
      const currentUser = userService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Aucun caissier connecté');
      }

      // Obtenir le client sélectionné
      const selectedCustomer = clientService.getClientById(selectedCustomerId);
      if (!selectedCustomer) {
        throw new Error('Client non trouvé');
      }

      // Créer la transaction sans recharger la page
      const transaction = transactionService.createTransaction({
        customer: selectedCustomer.name,
        customerId: selectedCustomerId,
        cashier: currentUser.name,
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

      // Mettre à jour l'interface sans recharger la page
      setLastTransaction(transaction.id);
      setIsPaymentModalOpen(false);
      
      // Réinitialiser la session sans recharger la page
      resetSession();
      
      // Afficher un message de confirmation
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50';
      successMessage.innerHTML = `
        <div class="flex items-center">
          <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div>
            <p class="font-bold">Transaction réussie</p>
            <p class="text-sm">ID: ${transaction.id}</p>
          </div>
        </div>
      `;
      document.body.appendChild(successMessage);
      
      // Supprimer le message après 3 secondes
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);

      logger.info('Transaction completed', {
        transactionId: transaction.id,
        total: transaction.total,
        paymentMethod: paymentDetails.method,
        cashier: currentUser.name,
        customer: selectedCustomer.name
      });
    } catch (err) {
      logger.error('Error processing payment', err);
      alert(`Erreur lors du traitement du paiement: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

  const handleExportTransactions = (format: 'json' | 'csv') => {
    try {
      if (format === 'json') {
        transactionService.downloadTransactionsAsJSON();
      } else {
        transactionService.downloadTransactionsAsCSV();
      }
      setShowExportOptions(false);
    } catch (err) {
      logger.error('Error exporting transactions', err);
      alert(`Erreur lors de l'exportation des transactions: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
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
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              aria-label="Sélectionner un client"
            >
              {customers.map(cust => (
                <option key={cust.id} value={cust.id}>{cust.name}</option>
              ))}
            </select>
          </div>
          <div className="relative ml-auto">
            <button 
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm"
              aria-label="Exporter les transactions"
            >
              📊 Exporter Transactions
            </button>
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleExportTransactions('json')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Exporter en JSON
                  </button>
                  <button
                    onClick={() => handleExportTransactions('csv')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Exporter en CSV
                  </button>
                </div>
              </div>
            )}
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
                  💶 Payer en espèces
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