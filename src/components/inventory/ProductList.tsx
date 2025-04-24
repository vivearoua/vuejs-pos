import { Product } from '../../services/inventoryService';
import { Edit, Trash2, Image as ImageIcon } from 'lucide-react';

interface ProductListProps {
  products: Product[];
  onSelect: (product: Product) => void;
  onDelete: (id: string) => void;
}

export default function ProductList({ products, onSelect, onDelete }: ProductListProps) {
  const getStockStatus = (product: Product) => {
    if (product.stock === 0) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Rupture</span>;
    }
    if (product.minStock && product.stock <= product.minStock) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Stock Bas</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">En stock</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Liste des produits ({products.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                  Aucun produit trouvé
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 w-16">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.type === 'phone' ? `${product.brand} ${product.model}` : product.name} 
                        className="h-12 w-12 object-cover rounded-md"
                      />
                    ) : (
                      <div className="h-12 w-12 flex items-center justify-center bg-gray-100 rounded-md">
                        <ImageIcon size={20} className="text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {product.type === 'phone' ? (
                      <>
                        <div className="font-medium">{product.brand} {product.model}</div>
                        <div className="text-sm text-gray-500">
                          {product.storage} - {product.color}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          {product.brand} - Compatible: {product.compatible_with.join(', ')}
                        </div>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {product.price.toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-medium">{product.stock}</span>
                    {product.minStock && (
                      <span className="text-sm text-gray-500"> (min: {product.minStock})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getStockStatus(product)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => onSelect(product)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                        title="Modifier"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(product.id);
                        }}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
