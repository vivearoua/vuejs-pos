import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import storeData from '../data/store.json';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Package, PenTool as Tool, ShoppingBag } from 'lucide-react';
import { logger } from '../utils/logger';
import ErrorBoundary from './ErrorBoundary';

function DashboardContent() {
  const { user } = useAuth();
  const stats = storeData.stats;

  useEffect(() => {
    logger.info('Dashboard mounted', { userId: user?.id });
    try {
      logger.info('Loading dashboard stats', {
        totalSales: stats.total_sales.amount,
        totalRepairs: stats.total_repairs.amount,
        inventory: {
          phones: stats.inventory.phones_in_stock,
          accessories: stats.inventory.accessories_in_stock
        }
      });
    } catch (err) {
      logger.error('Error loading dashboard stats', err);
    }
  }, [user, stats]);

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
          {storeData.transactions.slice(0, 5).map((transaction) => (
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