import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Package, PenTool as Tool, ShoppingBag } from 'lucide-react';
import { logger } from '../utils/logger';
import ErrorBoundary from './ErrorBoundary';
import { inventoryService } from '../services/inventoryService';

function DashboardContent() {
  const { user } = useAuth();
  
  // État pour stocker les statistiques du tableau de bord
  const [stats, setStats] = useState({
    total_sales: { amount: 0 },
    total_repairs: { amount: 0 },
    inventory: {
      phones_in_stock: 0,
      accessories_in_stock: 0
    }
  });
  
  // État pour stocker les transactions récentes
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    logger.info('Dashboard mounted', { userId: user?.id });
    
    // Charger les statistiques du tableau de bord
    const loadDashboardData = async () => {
      try {
        // Récupérer les produits depuis le service d'inventaire
        const products = inventoryService.getAllProducts();
        
        // Calculer les statistiques d'inventaire
        const phones = products.filter(p => p.type === 'phone');
        const accessories = products.filter(p => p.type === 'accessory');
        const phones_in_stock = phones.reduce((sum, p) => sum + p.stock, 0);
        const accessories_in_stock = accessories.reduce((sum, p) => sum + p.stock, 0);
        
        // Récupérer les transactions depuis l'API
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/transactions`);
          if (response.ok) {
            const transactions = await response.json();
            
            // Calculer les statistiques de ventes et réparations
            const sales = transactions.filter((t: any) => t.type === 'sale');
            const repairs = transactions.filter((t: any) => t.type === 'repair');
            const total_sales_amount = sales.reduce((sum: number, t: any) => sum + t.total_amount, 0);
            const total_repairs_amount = repairs.reduce((sum: number, t: any) => sum + t.total_amount, 0);
            
            // Mettre à jour les statistiques
            setStats({
              total_sales: { amount: total_sales_amount },
              total_repairs: { amount: total_repairs_amount },
              inventory: {
                phones_in_stock,
                accessories_in_stock
              }
            });
            
            // Récupérer les 5 transactions les plus récentes
            const sortedTransactions = [...transactions].sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            setRecentTransactions(sortedTransactions.slice(0, 5));
            
            logger.info('Loading dashboard stats', {
              totalSales: total_sales_amount,
              totalRepairs: total_repairs_amount,
              inventory: {
                phones: phones_in_stock,
                accessories: accessories_in_stock
              }
            });
          }
        } catch (error) {
          console.error('Erreur lors du chargement des transactions:', error);
          logger.error('Error loading transactions', error);
        }
      } catch (err) {
        logger.error('Error loading dashboard stats', err);
      }
    };
    
    loadDashboardData();
    
    // S'abonner aux mises à jour du stock
    const unsubscribe = inventoryService.subscribe((type, _data) => {
      if (['product_updated', 'stock_decreased'].includes(type)) {
        // Recharger les données du tableau de bord lorsque le stock est mis à jour
        loadDashboardData();
      }
    });
    
    return () => unsubscribe();
  }, [user]);

  const salesData = [
    { name: 'Total Sales', value: stats.total_sales.amount },
    { name: 'Total Repairs', value: stats.total_repairs.amount },
  ];

  const inventoryData = [
    { name: 'Phones', value: stats.inventory.phones_in_stock },
    { name: 'Accessories', value: stats.inventory.accessories_in_stock },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Sales</p>
              <p className="text-xl font-semibold">${stats.total_sales.amount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <Tool className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Repairs</p>
              <p className="text-xl font-semibold">${stats.total_repairs.amount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Phones in Stock</p>
              <p className="text-xl font-semibold">{stats.inventory.phones_in_stock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <ShoppingBag className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Accessories in Stock</p>
              <p className="text-xl font-semibold">{stats.inventory.accessories_in_stock}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Inventory Status</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recentTransactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
              <div>
                <p className="font-medium text-gray-900">{transaction.customer_name}</p>
                <p className="text-sm text-gray-500">
                  {transaction.type === 'sale' ? 'Purchase' : 'Repair'} - ${transaction.total_amount.toFixed(2)}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(transaction.timestamp).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-red-600 text-center">
            <h2 className="text-lg font-bold">Une erreur est survenue</h2>
            <p>Impossible de charger le tableau de bord</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </ErrorBoundary>
  );
}