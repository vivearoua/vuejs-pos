import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import storeData from '../data/store.json';
import { Phone, Accessory } from '../types';
import { Search, Filter } from 'lucide-react';

function Products() {
  const { addToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<'all' | 'phones' | 'accessories'>('all');

  const phones: Phone[] = storeData.phones;
  const accessories: Accessory[] = storeData.accessories;

  const filteredProducts = [...phones.map(phone => ({
    ...phone,
    type: 'phone' as const,
    displayName: `${phone.brand} ${phone.model}`,
    details: `${phone.storage} - ${phone.color}`
  })), ...accessories.map(acc => ({
    ...acc,
    type: 'accessory' as const,
    displayName: acc.name,
    details: acc.brand
  }))].filter(product => {
    const matchesSearch = product.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'all' || category === product.type;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Products</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
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
              onChange={(e) => setCategory(e.target.value as 'all' | 'phones' | 'accessories')}
            >
              <option value="all">All Products</option>
              <option value="phones">Phones</option>
              <option value="accessories">Accessories</option>
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
                  {product.type}
                </span>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div>
                  <p className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">{product.stock} in stock</p>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  className={`px-4 py-2 rounded-lg text-white ${
                    product.stock > 0
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  } transition-colors`}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Products;