'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
  name: string;
  email: string;
  avatar_url?: string;
  is_admin?: boolean;
};

type AppContextType = {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  cart: any[];
  addToCart: (product: any) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Load state from localStorage on mount to persist across pages
  useEffect(() => {
    setIsMounted(true);
    const storedUser = localStorage.getItem('Rothashop_user');
    const storedCart = localStorage.getItem('Rothashop_cart');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    if (storedCart) setCart(JSON.parse(storedCart));
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (isMounted) {
      if (currentUser) {
        localStorage.setItem('Rothashop_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('Rothashop_user');
      }
    }
  }, [currentUser, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('Rothashop_cart', JSON.stringify(cart));
    }
  }, [cart, isMounted]);

  const addToCart = (product: any) => {
    setCart((prev) => [...prev, product]);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUser, cart, addToCart, removeFromCart, clearCart }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
