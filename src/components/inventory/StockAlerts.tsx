import { Product } from '../../services/inventoryService';

interface StockAlertsProps {
  lowStock: Product[];
  outOfStock: Product[];
}

export default function StockAlerts({ lowStock, outOfStock }: StockAlertsProps) {
  const getProductName = (product: Product) => {
    if (product.type === 'phone') {
      return `${product.brand} ${product.model}`;
    }
    return product.name;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Alertes Stock</h3>

      {/* Rupture de stock */}
      {outOfStock.length > 0 && (
        <div className="mb-4">
          <h4 className="text-red-500 font-medium mb-2">
            Rupture de Stock ({outOfStock.length})
          </h4>
          <ul className="space-y-1">
            {outOfStock.map((product) => (
              <li
                key={product.id}
                className="text-sm flex justify-between items-center border-b pb-1"
              >
                <span>{getProductName(product)}</span>
                <span className="text-red-500 font-medium">0</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stock bas */}
      {lowStock.length > 0 && (
        <div>
          <h4 className="text-yellow-500 font-medium mb-2">
            Stock Bas ({lowStock.length})
          </h4>
          <ul className="space-y-1">
            {lowStock.map((product) => (
              <li
                key={product.id}
                className="text-sm flex justify-between items-center border-b pb-1"
              >
                <span>{getProductName(product)}</span>
                <div className="text-right">
                  <span className="text-yellow-500 font-medium">
                    {product.stock}
                  </span>
                  <span className="text-gray-500 text-xs ml-1">
                    / {product.minStock}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Aucune alerte */}
      {outOfStock.length === 0 && lowStock.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          ✨ Aucune alerte de stock
        </div>
      )}
    </div>
  );
}
