import React, { useState, useEffect } from 'react';
import { inventoryService, Product } from '../services/inventoryService';
import ProductForm from './inventory/ProductForm';
import ProductList from './inventory/ProductList';
import StockMovements from './inventory/StockMovements';
import StockAlerts from './inventory/StockAlerts';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockStatus, setStockStatus] = useState({
    totalProducts: 0,
    lowStock: [] as Product[],
    outOfStock: [] as Product[],
    totalValue: 0
  });

  useEffect(() => {
    loadProducts();
    updateStockStatus();

    const unsubscribe = inventoryService.subscribe((type) => {
      if (['product_added', 'product_updated', 'product_deleted'].includes(type)) {
        loadProducts();
        updateStockStatus();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadProducts = () => {
    if (searchTerm) {
      setProducts(inventoryService.searchProducts(searchTerm));
    } else {
      setProducts(inventoryService.getAllProducts());
    }
  };

  const updateStockStatus = () => {
    setStockStatus(inventoryService.getStockStatus());
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term) {
      setProducts(inventoryService.searchProducts(term));
    } else {
      setProducts(inventoryService.getAllProducts());
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setIsEditing(true);
  };

  const handleProductSave = (product: Omit<Product, 'id' | 'lastUpdated'>) => {
    if (selectedProduct) {
      inventoryService.updateProduct(selectedProduct.id, product);
    } else {
      inventoryService.addProduct(product);
    }
    setIsEditing(false);
    setSelectedProduct(null);
  };

  const handleProductDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      inventoryService.deleteProduct(id);
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await inventoryService.importFromCSV(file);
        alert('Import réussi !');
        loadProducts();
      } catch (error) {
        alert('Erreur lors de l\'import : ' + error);
      }
    }
  };

  const handleExportCSV = () => {
    const csv = inventoryService.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedProduct(null);
  };

  return (
    <div className="p-4">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Produits</h3>
          <p className="text-2xl">{stockStatus.totalProducts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Valeur Totale</h3>
          <p className="text-2xl">{stockStatus.totalValue.toFixed(2)} €</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Stock Bas</h3>
          <p className="text-2xl">{stockStatus.lowStock.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Rupture Stock</h3>
          <p className="text-2xl">{stockStatus.outOfStock.length}</p>
        </div>
      </div>

      {/* Barre d'outils */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <button
            onClick={handleNewProduct}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            ➕ Nouveau Produit
          </button>
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
              id="csvImport"
            />
            <label
              htmlFor="csvImport"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 cursor-pointer"
            >
              📥 Importer CSV
            </label>
          </div>
          <button
            onClick={handleExportCSV}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
          >
            📤 Exporter CSV
          </button>
        </div>
        <div className="w-64">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Formulaire d'édition intégré (non popup) */}
      {isEditing && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <ProductForm
            product={selectedProduct}
            onSave={handleProductSave}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Liste des produits */}
        <div className={isEditing ? "col-span-2" : "col-span-2"}>
          <ProductList
            products={products}
            onSelect={handleProductSelect}
            onDelete={handleProductDelete}
          />
        </div>

        {/* Panneau latéral */}
        <div className="space-y-6">
          <StockAlerts
            lowStock={stockStatus.lowStock}
            outOfStock={stockStatus.outOfStock}
          />
          {selectedProduct && !isEditing && (
            <StockMovements productId={selectedProduct.id} />
          )}
        </div>
      </div>
    </div>
  );
}
