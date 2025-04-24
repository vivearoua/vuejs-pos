import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Search, Filter } from 'lucide-react';
import { logger } from '../utils/logger';
import ErrorBoundary from './ErrorBoundary';
import { inventoryService } from '../services/inventoryService';

type ProductType = 'all' | 'phone' | 'accessory';

function ProductsContent() {
  const { addToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<ProductType>('all');

  const [products, setProducts] = useState<any[]>([]);
  
  // Charger les produits depuis le service d'inventaire
  useEffect(() => {
    const loadProducts = () => {
      const allProducts = inventoryService.getAllProducts();
      setProducts(allProducts);
    };
    
    loadProducts();
    
    // S'abonner aux mises à jour du stock
    const unsubscribe = inventoryService.subscribe((type, _data) => {
      if (['product_updated', 'stock_decreased'].includes(type)) {
        // Recharger les produits lorsque le stock est mis à jour
        loadProducts();
      }
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const phones = products.filter(p => p.type === 'phone');
      const accessories = products.filter(p => p.type === 'accessory');
      
      logger.info('Products page mounted', {
        totalPhones: phones.length,
        totalAccessories: accessories.length
      });
    }
  }, [products]);

  const matchesCategory = (product: { type: 'phone' | 'accessory' }) => {
    if (category === 'all') return true;
    return product.type === category;
  };

  const filteredProducts = products.map(product => {
    if (product.type === 'phone') {
      return {
        ...product,
        displayName: `${product.brand} ${product.model}`,
        details: `${product.storage} - ${product.color}`
      };
    } else {
      return {
        ...product,
        displayName: product.name,
        details: product.brand
      };
    }
  }).filter(product => {
    const matchesSearch = product.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && matchesCategory(product);
  });

  useEffect(() => {
    if (searchTerm || category !== 'all') {
      logger.info('Products filtered', {
        searchTerm,
        category,
        resultsCount: filteredProducts.length
      });
    }
  }, [searchTerm, category, filteredProducts.length]);

  const handleAddToCart = (product: any) => {
    try {
      logger.info('Adding product to cart', {
        productId: product.id,
        productName: product.displayName,
        productType: product.type
      });
      addToCart(product);
    } catch (err) {
      logger.error('Error adding product to cart', err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Produits</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher des produits..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductType)}
            >
              <option value="all">Tous les produits</option>
              <option value="phone">Téléphones</option>
              <option value="accessory">Accessoires</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <img
              src={product.type === 'phone' 
                ? `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=300&h=300`
                : `https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=300&h=300`
              }
              alt={product.displayName}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{product.displayName}</h3>
                  <p className="text-sm text-gray-600">{product.details}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {product.type === 'phone' ? 'téléphone' : 'accessoire'}
                </span>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div>
                  <p className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">{product.stock} en stock</p>
                </div>
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                  className={`px-4 py-2 rounded-lg text-white ${
                    product.stock > 0
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  } transition-colors`}
                >
                  Ajouter au panier
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Products() {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-red-600 text-center">
            <h2 className="text-lg font-bold">Une erreur est survenue</h2>
            <p>Impossible de charger la liste des produits</p>
          </div>
        </div>
      }
    >
      <ProductsContent />
    </ErrorBoundary>
  );
}