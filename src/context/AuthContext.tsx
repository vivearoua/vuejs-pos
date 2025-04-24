import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index';
import storeData from '../data/store.json';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  checkAuthStatus: () => boolean;
}

// Créer le contexte avec une valeur par défaut
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: () => {},
  isAuthenticated: false,
  checkAuthStatus: () => false
});

// Hook personnalisé pour utiliser le contexte d'authentification
export function useAuth() {
  return useContext(AuthContext);
}

// Composant fournisseur du contexte d'authentification
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fonction simple pour vérifier l'état d'authentification
  const checkAuthStatus = (): boolean => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser as User);
        setIsAuthenticated(true);
        return true;
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    }
    return false;
  };

  // Vérifier l'authentification au chargement initial
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (username: string, password: string) => {
    // In a real app, this would be an API call
    const foundUser = storeData.users.find(
      (u) => u.username === username && u.password === password
    );

    if (foundUser) {
      setUser(foundUser as User);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(foundUser));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
}