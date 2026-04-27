import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, AppState, ActivityIndicator,Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckCircle2, UtensilsCrossed, Bell } from 'lucide-react-native';
import { styles } from '../styles/theme';
import { FadeInView } from '../components/Animations';
import { ProgressStep } from '../components/UIComponents';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL; 

export default function WaitlistScreen({ setCurrentScreen }) {
  const [orderId, setOrderId] = useState(null);
  const [tokenNumber, setTokenNumber] = useState(null);
  const [status, setStatus] = useState("LOADING"); 
  const [orderItems, setOrderItems] = useState([]);
  const [queuePos, setQueuePos] = useState(null);
  // WebSocket Refs
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const appState = useRef(AppState.currentState);

  // --- 2. WEBSOCKET CONNECTION ---
  useEffect(() => {
    let mounted = true;

    const connectWebSocket = async () => {
      try {
        const savedOrderId = await AsyncStorage.getItem('@active_order_id');
        const savedToken = await AsyncStorage.getItem('@active_token_number');
        
        if (!savedOrderId || !savedToken) {
          if (mounted) setCurrentScreen('menu');
          return;
        }

        setOrderId(savedOrderId);
        setTokenNumber(savedToken);

        if (ws.current && ws.current.readyState === WebSocket.OPEN) return;

        const wsUrl = BACKEND_URL.replace(/^http/, 'ws') + `/api/orders/ws/${savedOrderId}`;
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = async () => {
          console.log(`📡 Connected to Live Queue for ${savedOrderId}`);
          if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);

          try {

            const response = await fetch(`${BACKEND_URL}/api/orders/${savedOrderId}`);
            
            if (response.ok) {
              const data = await response.json();
              if (mounted) {
                setStatus(data.status); 
                setOrderItems(data.items);
                setQueuePos(data.queue_position);
              }
            } else {
              if (mounted) setStatus("RECEIVED"); 
            }
          } catch (err) {
            console.error("Failed to fetch initial order data", err);
            if (mounted) setStatus("RECEIVED"); 
          }
        };

        ws.current.onmessage = async (event) => {
          const data = JSON.parse(event.data);

          if (data.type === 'QUEUE_UPDATE' && mounted) {
            try {
              const res = await fetch(`${BACKEND_URL}/api/orders/${savedOrderId}`);
              if (res.ok) {
                const updatedData = await res.json();
                setQueuePos(updatedData.queue_position); 
              }
            } catch (err) {
              console.log("Failed to refresh queue position", err);
            }
            return;
          }

          if (data.status && mounted) {
            setStatus(data.status);

            if (data.status === 'COMPLETED') {
              setTimeout(async () => {
                Alert.alert("Enjoy your meal!", "Your order is complete.");
                await AsyncStorage.multiRemove([
                  '@active_order_id', 
                  '@active_token_number'
                ]);
                setCurrentScreen('menu');
              }, 2000);
            }
          }
        };

        ws.current.onclose = () => {
          if (mounted) {
            reconnectTimeout.current = setTimeout(() => connectWebSocket(), 3000);
          }
        };

      } catch (error) {
        console.error("Queue Error:", error);
      }
    };

    connectWebSocket();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
          connectWebSocket();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      mounted = false;
      if (ws.current) ws.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      subscription.remove();
    };
  }, []);

  // --- 3. DYNAMIC UI LOGIC ---
  const isCooking = status === 'PREPARING' || status === 'READY';
  const isReady = status === 'READY';

  if (status === "LOADING") {
    return (
      <View style={[styles.screenWrapper, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 10 }}>Fetching your token...</Text>
      </View>
    );
  }

  return (
    <FadeInView slideX={20} style={styles.screenWrapper}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Status Indicator */}
        <View style={styles.statusIndicator}>
          <View style={styles.liveDotContainer}>
            <View style={[styles.liveDotCore, isReady && { backgroundColor: '#10b981' }]} />
          </View>
          <Text style={styles.statusLabel}>
            {isReady ? "Order Ready to Pick Up!" : "Live Queue Status"}
          </Text>
        </View>

        {/* Token Card */}
        <View style={styles.tokenCard}>
          <Text style={styles.tokenSubtitle}>Your Token</Text>
          <Text style={styles.tokenTitle}>#{tokenNumber}</Text>
          <View style={styles.queuePosition}>
            {isReady ? (
              <Text style={styles.queuePositionText}>
                Please proceed to the counter!
              </Text>
            ) : (
              <Text style={styles.queuePositionText}>
                {queuePos === 0 
                  ? "You are next in line! 🔥" 
                  : `${queuePos} ${queuePos === 1 ? 'order' : 'orders'} ahead of you.`}
              </Text>
            )}
          </View>
        </View>

        {/* Dynamic Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLineBg} />
          {/* Fill the line based on status */}
          <View style={[
            styles.progressLineActive, 
            { width : isReady ? '80%' : isCooking ? '50%' : '10%' }
          ]} />
          
          <ProgressStep 
            icon={<CheckCircle2 size={20} color="#000" />} 
            label="Received" 
            sub="Order Placed" 
            active={true} 
          />
          <ProgressStep 
            icon={<UtensilsCrossed size={20} color={isCooking ? "#000" : "#9ca3af"} />} 
            label="Cooking" 
            sub={isCooking ? "In Progress" : "Waiting..."} 
            active={isCooking} 
          />
          <ProgressStep 
            icon={<Bell size={20} color={isReady ? "#000" : "#9ca3af"} />} 
            label="Ready" 
            sub={isReady ? "Pick up now!" : "Est. 5 mins"} 
            active={isReady} 
          />
        </View>

        {/* Order Details Summary */}
        <View style={styles.orderDetailsCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderHeaderTitle}>Order Details</Text>
            <Text style={styles.orderId}>ID: {orderId}</Text>
          </View>
          
          {orderItems.length > 0 ? (
            orderItems.map((item, index) => (
              <View key={item.item_id || index} style={styles.orderItem}>
              <View style={styles.itemInfoLeft}>
                
                <View style={styles.itemImgContainer}>
                  <Image 
                    source={{ uri: item.image_url }} 
                    style={styles.itemImg} 
                  />
                </View>

                <View>
                  <Text style={styles.itemName}>
                    {item.quantity}x {item.name}
                  </Text>

                  <Text style={styles.itemMods}>
                    {item.modifications ? item.modifications : "Standard preparation"}
                  </Text>
                </View>
              </View>

              <Text style={styles.itemPrice}>
                ₹{item.price ? (item.price * item.quantity).toFixed(2) : "Paid"}
              </Text>
            </View>
            ))
          ) : (
             <Text style={{ textAlign: 'center', margin: 10, color: 'gray' }}>
               Loading items...
             </Text>
          )}
        </View>

      </ScrollView>
    </FadeInView>
  );
}