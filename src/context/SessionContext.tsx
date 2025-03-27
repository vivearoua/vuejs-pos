import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import storeData from '../data/store.json';

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

// Convertir les téléphones et accessoires en format uniforme
const convertToProducts = (): Product[] => {
  const phones: Phone[] = storeData.phones.map(phone => ({
    ...phone,
    type: 'phone' as const
  }));

  const accessories: Accessory[] = storeData.accessories.map(accessory => ({
    ...accessory,
    type: 'accessory' as const
  }));

  return [...phones, ...accessories];
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState('Passager');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(convertToProducts());

  useEffect(() => {
    const lowercaseSearch = searchTerm.toLowerCase();
    const filtered = convertToProducts().filter(product => {
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
  }, [searchTerm]);

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