import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import { fileService } from './services/fileService';

// Définition du composant Layout qui utilise le hook useAuth
function Layout() {
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

      {/* Navigation */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex -mb-px">
            {navigation.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === item.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(item.id);
                }}
              >
                {item.name}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'session' && <SessionPage />}
        {activeTab === 'products' && <Products />}
        {activeTab === 'cart' && <Cart />}
        {activeTab === 'repairs' && <RepairPage />}
        {activeTab === 'inventory' && <InventoryPage />}
        {activeTab === 'clients' && <ClientPage />}
        {activeTab === 'transactions' && <Transactions />}
      </main>
    </div>
  );
}

// Composant qui vérifie l'authentification
const RequireAuth = () => {
  const { isAuthenticated } = useAuth();
  
  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Sinon, afficher le layout
  return <Layout />;
};

// Composant qui vérifie si l'utilisateur est déjà connecté
const LoginRoute = () => {
  const { isAuthenticated } = useAuth();
  
  // Si l'utilisateur est déjà authentifié, rediriger vers le dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }
  
  // Sinon, afficher la page de connexion
  return <Login />;
};

function App() {
  useEffect(() => {
    // Configurer la sauvegarde automatique des transactions
    fileService.setupAutoSave();
    
    // Afficher un message de bienvenue
    console.log('Application POS démarrée');
  }, []);

  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <SessionProvider>
            <Routes>
              <Route path="/login" element={<LoginRoute />} />
              <Route path="/*" element={<RequireAuth />} />
            </Routes>
          </SessionProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;