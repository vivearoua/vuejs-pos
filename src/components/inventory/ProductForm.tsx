import React, { useState, useEffect } from 'react';
import { Product } from '../../services/inventoryService';

type ProductFormData = {
  type: 'phone' | 'accessory';
  brand: string;
  model?: string;
  storage?: string;
  color?: string;
  name?: string;
  compatible_with?: string[];
  price: number;
  stock: number;
  minStock?: number;
};

interface ProductFormProps {
  product: Product | null;
  onSave: (product: ProductFormData) => void;
  onCancel: () => void;
}

export default function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [type, setType] = useState<'phone' | 'accessory'>(product?.type || 'phone');
  const [formData, setFormData] = useState<ProductFormData>({
    type,
    brand: '',
    model: '',
    storage: '',
    color: '',
    name: '',
    compatible_with: [],
    price: 0,
    stock: 0,
    minStock: 0
  });

  useEffect(() => {
    if (product) {
      if (product.type === 'phone') {
        setFormData({
          type: product.type,
          brand: product.brand,
          model: product.model,
          storage: product.storage,
          color: product.color,
          name: '',
          compatible_with: [],
          price: product.price,
          stock: product.stock,
          minStock: product.minStock || 0
        });
      } else {
        setFormData({
          type: product.type,
          brand: product.brand,
          model: '',
          storage: '',
          color: '',
          name: product.name,
          compatible_with: product.compatible_with,
          price: product.price,
          stock: product.stock,
          minStock: product.minStock || 0
        });
      }
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {product ? 'Modifier le Produit' : 'Nouveau Produit'}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Enregistrer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'phone' | 'accessory')}
            className="w-full p-2 border rounded-lg"
          >
            <option value="phone">Téléphone</option>
            <option value="accessory">Accessoire</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Marque</label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>

        {type === 'phone' ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Modèle</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Stockage</label>
              <input
                type="text"
                value={formData.storage}
                onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Couleur</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Compatible avec (séparés par ;)
              </label>
              <input
                type="text"
                value={formData.compatible_with?.join(';') || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  compatible_with: e.target.value.split(';').map(s => s.trim()).filter(Boolean) 
                })}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Prix</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            className="w-full p-2 border rounded-lg"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Stock</label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
            className="w-full p-2 border rounded-lg"
            min="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Stock Minimum</label>
          <input
            type="number"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
            className="w-full p-2 border rounded-lg"
            min="0"
          />
        </div>
      </div>
    </form>
  );
}
