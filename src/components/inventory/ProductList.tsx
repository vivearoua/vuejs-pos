import { Product } from '../../services/inventoryService';

interface ProductListProps {
  products: Product[];
  onSelect: (product: Product) => void;
  onDelete: (id: string) => void;
}

export default function ProductList({ products, onSelect, onDelete }: ProductListProps) {
  const getStockStatus = (product: Product) => {
    if (product.stock === 0) {
      return <span className="text-red-500">Rupture</span>;
    }
    if (product.minStock && product.stock <= product.minStock) {
      return <span className="text-yellow-500">Stock Bas</span>;
    }
    return <span className="text-green-500">OK</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left">Produit</th>
            <th className="px-4 py-2 text-right">Prix</th>
            <th className="px-4 py-2 text-right">Stock</th>
            <th className="px-4 py-2 text-center">Statut</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              className="border-t hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelect(product)}
            >
              <td className="px-4 py-2">
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
              <td className="px-4 py-2 text-right">
                {product.price.toFixed(2)} €
              </td>
              <td className="px-4 py-2 text-right">
                {product.stock}
                {product.minStock && (
                  <span className="text-sm text-gray-500"> (min: {product.minStock})</span>
                )}
              </td>
              <td className="px-4 py-2 text-center">
                {getStockStatus(product)}
              </td>
              <td className="px-4 py-2 text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(product.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                  title="Supprimer"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
