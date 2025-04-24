import React, { useState, useEffect } from 'react';
import { Product } from '../../services/inventoryService';
import { Image as ImageIcon } from 'lucide-react';

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
  imageUrl?: string;
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
    minStock: 0,
    imageUrl: ''
  });
  const [previewUrl, setPreviewUrl] = useState<string>('');

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
          minStock: product.minStock || 0,
          imageUrl: product.imageUrl || ''
        });
        setPreviewUrl(product.imageUrl || '');
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
          minStock: product.minStock || 0,
          imageUrl: product.imageUrl || ''
        });
        setPreviewUrl(product.imageUrl || '');
      }
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'phone' | 'accessory';
    setType(newType);
    setFormData({
      ...formData,
      type: newType,
      // Réinitialiser les champs spécifiques au type
      model: newType === 'phone' ? formData.model : '',
      storage: newType === 'phone' ? formData.storage : '',
      color: newType === 'phone' ? formData.color : '',
      name: newType === 'accessory' ? formData.name : '',
      compatible_with: newType === 'accessory' ? formData.compatible_with : [],
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setFormData({ ...formData, imageUrl });
        setPreviewUrl(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
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
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Enregistrer
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
        {/* Prévisualisation de l'image */}
        <div className="col-span-1 row-span-3">
          <div className="border rounded-lg p-2 h-full flex flex-col items-center justify-center">
            {previewUrl ? (
              <div className="text-center">
                <img 
                  src={previewUrl} 
                  alt="Aperçu du produit" 
                  className="max-h-40 max-w-full mb-2 object-contain mx-auto"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, imageUrl: '' });
                    setPreviewUrl('');
                  }}
                  className="text-red-500 text-sm hover:text-red-700"
                >
                  Supprimer l'image
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <ImageIcon size={48} className="mx-auto mb-2" />
                <p>Aucune image</p>
              </div>
            )}
            <div className="mt-4 w-full">
              <label className="block text-sm font-medium mb-1">Image du produit</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        </div>

        {/* Champs du formulaire */}
        <div className="col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={type}
                onChange={handleTypeChange}
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
        </div>
      </form>
    </div>
  );
}
