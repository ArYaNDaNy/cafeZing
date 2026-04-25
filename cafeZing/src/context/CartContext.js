import React, { createContext, useState, useContext } from 'react';

// 1. Create the Context
const CartContext = createContext();

// 2. Create the Provider Component
export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Add item logic
  const addToTray = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.item_id === item.item_id);
      if (existingItem) {
        return prevCart.map((cartItem) => 
          cartItem.item_id === item.item_id ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem
        );
      }
      return [...prevCart, { ...item, qty: 1 }];
    });
  };

  // Update/Remove item logic
  const updateQuantity = (itemId, delta) => {
    setCart((prevCart) => {
      return prevCart.map(item => {
        if (item.item_id === itemId) {
          return { ...item, qty: item.qty + delta };
        }
        return item;
      }).filter(item => item.qty > 0);
    });
  };

  // Calculate total
  const cartTotal = cart.reduce((total, item) => total + (parseFloat(item.price) * item.qty), 0);

  return (
    <CartContext.Provider value={{ cart, addToTray, updateQuantity, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

// 3. Custom Hook for easy access
export const useCart = () => useContext(CartContext);