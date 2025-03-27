import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SessionPage from './components/SessionPage';
import InventoryPage from './components/InventoryPage';
import ClientPage from './components/clients/ClientPage';
import RepairPage from './components/repairs/RepairPage';
import { SessionProvider } from './context/SessionContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Login from './components/Login';
import Products from './components/Products';
import Cart from './components/Cart';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';

function PrivateRoute({ element }: { element: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{element}</> : <Navigate to="/login" />;
}

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = React.useState('dashboard');

  const navigation = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'session', name: 'Session' },
    { id: 'products', name: 'Products' },
    { id: 'cart', name: 'Cart' },
    { id: 'repairs', name: 'Repairs' },
    { id: 'inventory', name: 'Inventory' },
    { id: 'clients', name: 'Clients' },
    { id: 'transactions', name: 'Transactions' },
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
            {activeTab === 'repairs' && <RepairPage />}
            {activeTab === 'inventory' && <InventoryPage />}
            {activeTab === 'clients' && <ClientPage />}
            {activeTab === 'transactions' && <Transactions />}
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
                  <PrivateRoute element={
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/session" element={<SessionPage />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/repairs" element={<RepairPage />} />
                        <Route path="/inventory" element={<InventoryPage />} />
                        <Route path="/clients" element={<ClientPage />} />
                        <Route path="/transactions" element={<Transactions />} />
                      </Routes>
                    </Layout>
                  } />
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