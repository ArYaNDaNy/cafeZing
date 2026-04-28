import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, FlatList, ScrollView, Modal, Animated, Dimensions, StyleSheet } from 'react-native';
// ADDED: ChefHat icon to reuse app theme language
import { MapPin, X , Minus, Plus, ChefHat} from 'lucide-react-native';
// ADDED: Razorpay SDK
import RazorpayCheckout from 'react-native-razorpay';

import { styles } from '../styles/theme';
import { FadeInView } from '../components/Animations';
import { FoodCard } from '../components/UIComponents';
import { useCart } from '../context/CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.121:8000'; 
// ADDED: Load Razorpay Key
const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;

const CATEGORIES = ['All', 'Fast Selling', 'Snacks', 'Beverages', 'Combos'];

export default function MenuScreen({setCurrentScreen}) {
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isPaying, setIsPaying] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { cart, addToTray, updateQuantity, cartTotal } = useCart();

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchMenu();
  }, []);

  const { height } = Dimensions.get('window');
  const slideAnim = useRef(new Animated.Value(height)).current;

  // Optimized FAB animation
  useEffect(() => {
    if (cart.length > 0) {
      scaleAnim.setValue(1); 
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true })
      ]).start();
    }
  }, [cartTotal]);
  
  const openModal = () => {
    setIsModalVisible(true);
    Animated.spring(slideAnim, { toValue: 0, friction: 100, tension: 30, useNativeDriver: true }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, { toValue: height, duration: 950, useNativeDriver: true })
      .start(() => setIsModalVisible(false)); 
  };

  useEffect(() => {
    if (cart.length === 0 && isModalVisible) {
      closeModal();
    }
  }, [cart]);

  const fetchMenu = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/menu/`);
      if (!response.ok) throw new Error('Failed to fetch menu');
      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error("Menu Fetch Error:", error);
      Alert.alert("Error", "Could not load the canteen menu.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMenu = menuItems.filter(item => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Fast Selling') return item.is_fast_selling;
    return item.category === activeCategory;
  });

  // ==========================================
  // RAZORPAY INTEGRATION LOGIC
  // ==========================================
  const handlePayment = async () => {
    if (cart.length === 0 || !RAZORPAY_KEY_ID) return;
    setIsPaying(true);

    try {
      // 1. Validate Ghost Token (Already exist in your code)
      let ghostToken = await AsyncStorage.getItem('@ghost_token');
      if (!ghostToken) {
        Alert.alert("Invalid Session", "You must be inside the canteen to order.");
        setIsPaying(false);
        return; 
      }

      // Format items for backend payload
      const orderItems = cart.map(item => ({
        item_id: item.item_id.toString(), 
        quantity: item.qty,
        modifications: null 
      }));

      // --- STEP 1: CREATE RAZORPAY ORDER ON BACKEND ---
      // We send the amount and items to FastAPI, which asks Razorpay for an Order ID.
      const startOrderResponse = await fetch(`${BACKEND_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cartTotal, // Send total Rupees
          ghost_token: ghostToken,
          items: orderItems,
        })
      });

      if (!startOrderResponse.ok) {
        const errorData = await startOrderResponse.json();
        throw new Error(errorData.detail || "Could not initiate payment.");
      }

      // Data needed for SDK: rzp_order_id, amount_in_paise
      const razorpayOrderData = await startOrderResponse.json();

      // --- STEP 2: OPEN RAZORPAY SDK NATIVE OVERLAY ---
      const options = {
        description: 'Canteen Food Order',
        image: 'https://picsum.photos/seed/cafezing/200/200', // Use your logo URL
        currency: 'INR',
        key: RAZORPAY_KEY_ID, 
        amount: razorpayOrderData.amount_paise.toString(), // Razorpay expects amount in Paise
        name: 'Cafe Zing Canteen',
        order_id: razorpayOrderData.razorpay_order_id, // Important for automatic verification
        prefill: {
          email: 'student@college.edu', // Optionally use user data
          contact: '9999999999',
          name: 'Canteen Student'
        },
        theme: { color: '#1a1c1c' } // Matches app background
      };

      // Triggers GPay/PhonePe/Paytm intent flow
      const paymentSuccessData = await RazorpayCheckout.open(options);

      // If we reach here, payment was successful in the Razorpay UI.
      // paymentSuccessData contains: razorpay_payment_id, razorpay_order_id, razorpay_signature

      // --- STEP 3: VERIFY PAYMENT ON BACKEND ---
      // CRITICAL SECURITY STEP: Validate signature to prevent fraud.
      const verifyResponse = await fetch(`${BACKEND_URL}/api/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentSuccessData, // Send all Razorpay success IDs
          ghost_token: ghostToken,
          cart_total: cartTotal,
          items: orderItems // Resend items to actually create the DB order now
        })
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.detail || "Payment verification failed.");
      }

      // Final order data from your DB (contains final token number)
      const finalOrderData = await verifyResponse.json();

      // Success flow (Existing logic)
      await AsyncStorage.setItem('@active_order_id', finalOrderData.order_id);
      await AsyncStorage.setItem('@active_token_number', finalOrderData.daily_token_number.toString());

      // Clear Cart efficiently
      cart.forEach(item => updateQuantity(item.item_id, -item.qty)); 
      closeModal(); 

      // Redirect to KDS Waitlist
      setCurrentScreen('waitlist');

    } catch (error) {
      console.error("Payment API Error:", error);
      
      // Razorpay specific error handling (e.g., user cancelled)
      if (error.code) {
        console.log(`RZP Error ${error.code}: ${error.description}`);
        Alert.alert("Payment Cancelled/Failed", error.description);
      } else {
        Alert.alert("Order Failed", error.message || "Could not reach the server.");
      }
    } finally {
      setIsPaying(false);
    }
  };
  // ==========================================

  const renderListHeader = () => (
    <View style={styles.menuHeaderContainer}>
      <View style={styles.contextRow}>
        <View style={styles.priorityMiniBadge}>
          <MapPin size={12} color="#000" />
          <Text style={styles.priorityMiniText}>Canteen Priority</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Today's Menu</Text>
      <View style={styles.categoryWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)} style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}>
              <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <FadeInView slideY={20} style={styles.screenWrapper}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#39ff14" style={{ flex: 1, justifyContent: 'center' }} />
      ) : (
        <FlatList
          data={filteredMenu}
          keyExtractor={(item) => item.item_id.toString()}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={styles.flatListContent}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 32 }}>
              <FoodCard 
                name={item.name}
                price={item.price.toString()} 
                oldPrice={item.old_price ? item.old_price.toString() : null}
                desc={item.description}
                img={item.image_url}    
                fast={item.is_fast_selling}
                onAdd={() => addToTray(item)} 
              />
            </View>
          )}
        />
      )}

      {/* --- CONDITIONAL FAB --- */}
      {cart.length > 0 && (
        <View style={styles.checkoutFabContainer}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity style={styles.checkoutFab} onPress={openModal}>
              <View style={styles.checkoutFabLeft}>
                <Text style={styles.cartBadge}>{cart.length}</Text>
                <Text style={styles.checkoutText}>View Tray</Text>
              </View>
              <Text style={styles.checkoutTotal}>₹{cartTotal.toFixed(2)}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* --- CHECKOUT MODAL --- */}
      <Modal visible={isModalVisible} transparent={true} animationType="none" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeModal} activeOpacity={1} />

          <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Tray</Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color="#1a1c1c" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ maxHeight: 300, marginBottom: 24 }} showsVerticalScrollIndicator={false}>
              {cart.map((item, index) => (
                <View key={index} style={styles.cartItemRow}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    <Text style={styles.cartItemPrice}>₹{(parseFloat(item.price) * item.qty).toFixed(2)}</Text>
                  </View>

                  <View style={styles.qtyControl}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.item_id, -1)}>
                      <Minus size={16} color="#1a1c1c" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.item_id, 1)}>
                      <Plus size={16} color="#1a1c1c" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalTotalRow}>
              <Text style={styles.modalTotalLabel}>Total</Text>
              <Text style={styles.modalTotalValue}>₹{cartTotal.toFixed(2)}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.payButton, isPaying && { backgroundColor: '#9ca3af' }]} 
              onPress={handlePayment}
              disabled={isPaying} 
            >
              {isPaying ? (
                <ActivityIndicator color="#000" style={{marginRight: 8}} />
              ) : (
                <ChefHat size={18} color="#000" style={{marginRight: 8}} />
              )}
              <Text style={styles.payButtonText}>
                {isPaying ? "PROCESSING..." : `PAY ₹${cartTotal.toFixed(2)}`}
              </Text>
            </TouchableOpacity>

          </Animated.View>
        </View>
      </Modal>

    </FadeInView>
  );
}