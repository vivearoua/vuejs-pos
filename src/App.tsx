import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { LayoutGrid, ShoppingCart, Settings, BarChart3, PenTool as Tool, Package, History, DollarSign } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SessionProvider } from './context/SessionContext';
import Login from './components/Login';
import Products from './components/Products';
import Cart from './components/Cart';
import Dashboard from './components/Dashboard';
import Repairs from './components/Repairs';
import Inventory from './components/Inventory';
import Transactions from './components/Transactions';
import SessionPage from './components/SessionPage';
import InventoryPage from './components/InventoryPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = React.useState('dashboard');

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'session', name: 'Session', icon: DollarSign },
    { id: 'products', name: 'Products', icon: LayoutGrid },
    { id: 'cart', name: 'Cart', icon: ShoppingCart },
    { id: 'repairs', name: 'Repairs', icon: Tool },
    { id: 'inventory', name: 'Inventory', icon: Package },
    { id: 'transactions', name: 'Transactions', icon: History },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">POS System</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {user?.full_name}
            </span>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className=" mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Navigation */}
          <nav className="w-64 bg-white rounded-lg shadow-sm p-4 h-[calc(100vh-8rem)]">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg ${
                        activeTab === item.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'session' && <SessionPage />}
            {activeTab === 'products' && <Products />}
            {activeTab === 'cart' && <Cart />}
            {activeTab === 'repairs' && <Repairs />}
            {activeTab === 'inventory' && <InventoryPage />}
            {activeTab === 'transactions' && <Transactions />}
            {activeTab === 'settings' && <div>Settings</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <SessionProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/session" element={<SessionPage />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/repairs" element={<Repairs />} />
                        <Route path="/inventory" element={<InventoryPage />} />
                        <Route path="/transactions" element={<Transactions />} />
                        <Route path="/settings" element={<div>Settings</div>} />
                      </Routes>
                    </Layout>
                  </PrivateRoute>
                }
              />
            </Routes>
          </SessionProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;