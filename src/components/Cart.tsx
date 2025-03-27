import { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Trash2, CreditCard } from 'lucide-react';
import { logger } from '../utils/logger';
import ErrorBoundary from './ErrorBoundary';

function CartContent() {
  const { cart, removeFromCart, updateQuantity } = useCart();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = total * 0.08; // 8% tax
  const finalTotal = total + tax;

  useEffect(() => {
    logger.info('Cart mounted', {
      itemCount: cart.length,
      total: finalTotal
    });
  }, [cart.length, finalTotal]);

  const handleQuantityUpdate = (itemId: string, newQuantity: number) => {
    try {
      logger.info('Updating cart item quantity', {
        itemId,
        oldQuantity: cart.find(item => item.id === itemId)?.quantity,
        newQuantity
      });
      updateQuantity(itemId, newQuantity);
    } catch (err) {
      logger.error('Error updating cart item quantity', err);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    try {
      const item = cart.find(item => item.id === itemId);
      logger.info('Removing item from cart', {
        itemId,
        itemName: item?.name,
        quantity: item?.quantity
      });
      removeFromCart(itemId);
    } catch (err) {
      logger.error('Error removing item from cart', err);
    }
  };

  const handleCheckout = () => {
    try {
      logger.info('Starting checkout process', {
        itemCount: cart.length,
        total: finalTotal,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity
        }))
      });
      alert('Traitement du paiement...');
    } catch (err) {
      logger.error('Error during checkout', err);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Panier</h2>
      {cart.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Votre panier est vide</p>
          <p className="text-gray-400 mt-2">Ajoutez des produits pour commencer</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-grow">
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=100&h=100'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {item.name}
                      </h3>
                      <p className="text-gray-600">${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          handleQuantityUpdate(item.id, Math.max(1, item.quantity - 1))
                        }
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                        aria-label="Diminuer la quantité"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                        aria-label="Augmenter la quantité"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                      aria-label="Supprimer l'article"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:w-80">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Résumé de la commande</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>TVA (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                className="mt-6 w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <CreditCard size={20} />
                <span>Payer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Cart() {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-red-600 text-center">
            <h2 className="text-lg font-bold">Une erreur est survenue</h2>
            <p>Impossible de charger le panier</p>
          </div>
        </div>
      }
    >
      <CartContent />
    </ErrorBoundary>
  );
}