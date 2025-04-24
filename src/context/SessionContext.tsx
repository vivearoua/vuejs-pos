import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { inventoryService } from '../services/inventoryService';

interface BaseProduct {
  id: string;
  price: number;
  stock: number;
}

interface Phone extends BaseProduct {
  type: 'phone';
  brand: string;
  model: string;
  storage: string;
  color: string;
}

interface Accessory extends BaseProduct {
  type: 'accessory';
  name: string;
  brand: string;
  compatible_with: string[];
}

type Product = Phone | Accessory;

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  type: 'phone' | 'accessory';
}

interface SessionContextType {
  customer: string;
  cart: CartItem[];
  tax: number;
  discount: number;
  shipping: number;
  searchTerm: string;
  filteredProducts: Product[];
  subtotal: number;
  total: number;
  setCustomer: (customer: string) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setTax: (tax: number) => void;
  setDiscount: (discount: number) => void;
  setShipping: (shipping: number) => void;
  setSearchTerm: (term: string) => void;
  resetSession: () => void;
}

// Obtenir les produits depuis le service d'inventaire
const getProducts = (): Product[] => {
  // Récupérer tous les produits depuis le service d'inventaire
  const products = inventoryService.getAllProducts();
  
  // Les produits sont déjà au bon format, donc on peut les retourner directement
  return products;
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState('Passager');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Charger les produits au montage du composant
  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Récupérer les produits depuis le service d'inventaire
        const products = getProducts();
        setAllProducts(products);
        
        // Appliquer le filtre de recherche initial
        if (searchTerm) {
          filterProducts(searchTerm, products);
        } else {
          setFilteredProducts(products);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
      }
    };
    
    loadProducts();
    
    // S'abonner aux mises à jour du stock
    const unsubscribe = inventoryService.subscribe((type, _data) => {
      if (['product_updated', 'stock_decreased'].includes(type)) {
        // Recharger les produits lorsque le stock est mis à jour
        setAllProducts(getProducts());
      }
    });
    
    // Se désabonner lors du démontage
    return () => unsubscribe();
  }, []);
  
  // Filtrer les produits lorsque le terme de recherche change
  useEffect(() => {
    filterProducts(searchTerm, allProducts);
  }, [searchTerm, allProducts]);
  
  // Fonction pour filtrer les produits selon le terme de recherche
  const filterProducts = (term: string, products: Product[]) => {
    const lowercaseSearch = term.toLowerCase();
    const filtered = products.filter(product => {
      if (product.type === 'phone') {
        return (
          product.brand.toLowerCase().includes(lowercaseSearch) ||
          product.model.toLowerCase().includes(lowercaseSearch)
        );
      } else {
        return (
          product.name.toLowerCase().includes(lowercaseSearch) ||
          product.brand.toLowerCase().includes(lowercaseSearch)
        );
      }
    });
    setFilteredProducts(filtered);
  };

  const addToCart = useCallback((product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
            : item
        );
      }
      const name = product.type === 'phone' 
        ? `${product.brand} ${product.model}`
        : product.name;
      return [...prevCart, {
        id: product.id,
        name,
        price: product.price,
        quantity: 1,
        subtotal: product.price,
        type: product.type
      }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity, subtotal: quantity * item.price }
          : item
      )
    );
  }, []);

  const resetSession = useCallback(() => {
    setCart([]);
    setTax(0);
    setDiscount(0);
    setShipping(0);
    setSearchTerm('');
    setCustomer('Passager');
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal * (1 + tax / 100) * (1 - discount / 100) + shipping;

  const value = {
    customer,
    cart,
    tax,
    discount,
    shipping,
    searchTerm,
    filteredProducts,
    subtotal,
    total,
    setCustomer,
    addToCart,
    removeFromCart,
    updateQuantity,
    setTax,
    setDiscount,
    setShipping,
    setSearchTerm,
    resetSession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export default SessionContext;