import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ChefHat, CheckCircle2, Clock, Flame } from 'lucide-react-native';

// Mock data so you can see the UI before connecting the backend
const MOCK_ORDERS = [
  {
    id: "8492",
    time: "10:42 AM",
    status: "pending", 
    items: [
      { name: "Classic Vada Pav", qty: 2, note: "Extra spicy" },
      { name: "Cold Coffee", qty: 1, note: "Less sugar" }
    ]
  },
  {
    id: "8493",
    time: "10:45 AM",
    status: "cooking",
    items: [
      { name: "Masala Dosa", qty: 1, note: "" },
      { name: "Filter Coffee", qty: 2, note: "" }
    ]
  }
];

export default function KitchenScreen() {
  const [orders, setOrders] = useState(MOCK_ORDERS);

  // Simulating state changes
  const handleStartCooking = (orderId) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: 'cooking' } : order
    ));
  };

  const handleMarkReady = (orderId) => {
    setOrders(orders.filter(order => order.id !== orderId));
  };

  return (
    <View style={styles.appContainer}>
      {/* HEADER */}
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}>
          <ChefHat color="#1a1c1c" size={24} />
          <Text style={styles.appTitle}>Kitchen Line</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.screenWrapper}>
          
          <View style={[styles.adminHeaderSection, { marginTop: 24 }]}>
            <Text style={styles.adminSubtitle}>Live Queue</Text>
            <Text style={styles.adminTitle}>Active{'\n'}Orders</Text>
          </View>

          {/* ACTIVE TICKETS */}
          <View style={styles.kitchenGrid}>
            {orders.length === 0 ? (
              <View style={styles.emptyKitchenState}>
                <CheckCircle2 size={48} color="#39ff14" style={{marginBottom: 16}} />
                <Text style={styles.emptyKitchenText}>ALL CAUGHT UP</Text>
                <Text style={styles.emptyKitchenSub}>No active orders in the queue.</Text>
              </View>
            ) : (
              orders.map((order) => (
                <View 
                  key={order.id} 
                  style={[
                    styles.kitchenCard, 
                    order.status === 'cooking' && styles.kitchenCardActive
                  ]}
                >
                  {/* TICKET HEADER */}
                  <View style={styles.kitchenCardHeader}>
                    <View>
                      <Text style={styles.kitchenOrderLabel}>ORDER NO.</Text>
                      <Text style={styles.kitchenOrderId}>#{order.id}</Text>
                    </View>
                    <View style={styles.kitchenTimeBadge}>
                      <Clock size={12} color="#9ca3af" />
                      <Text style={styles.kitchenTimeText}>{order.time}</Text>
                    </View>
                  </View>

                  {/* ITEMS LIST */}
                  <View style={styles.kitchenItemList}>
                    {order.items.map((item, index) => (
                      <View key={index} style={styles.kitchenItemRow}>
                        <View style={styles.kitchenQtyBadge}>
                          <Text style={styles.kitchenQtyText}>{item.qty}x</Text>
                        </View>
                        <View style={styles.kitchenItemDetails}>
                          <Text style={styles.kitchenItemName}>{item.name}</Text>
                          {item.note ? <Text style={styles.kitchenItemNote}>{item.note}</Text> : null}
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* ACTION BUTTONS */}
                  <View style={styles.kitchenActionRow}>
                    {order.status === 'pending' ? (
                      <TouchableOpacity 
                        style={styles.kitchenBtnStart} 
                        onPress={() => handleStartCooking(order.id)}
                      >
                        <Flame size={20} color="#000" />
                        <Text style={styles.kitchenBtnTextDark}>Start Cooking</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={styles.kitchenBtnReady} 
                        onPress={() => handleMarkReady(order.id)}
                      >
                        <CheckCircle2 size={20} color="#000" />
                        <Text style={styles.kitchenBtnTextDark}>Order Ready</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
          
        </View>
      </ScrollView>
    </View>
  );
}

// --- SELF-CONTAINED STYLESHEET ---
const styles = StyleSheet.create({
  // BASE APP STYLES
  appContainer: { flex: 1, backgroundColor: '#f9f9f9' },
  appHeader: { height: 64, backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderBottomColor: '#f3f6f4', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, zIndex: 50 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  appTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -1, textTransform: 'uppercase', color: '#1a1c1c' },
  screenWrapper: { paddingTop: 0, paddingHorizontal: 24, alignSelf: 'center', width: '100%', maxWidth: 512, flex: 1 },
  scrollContent: { paddingBottom: 48 },
  adminHeaderSection: { marginBottom: 48 },
  adminSubtitle: { fontSize: 10, fontWeight: '900', letterSpacing: 3.2, textTransform: 'uppercase', color: '#39ff14', marginBottom: 8 },
  adminTitle: { fontSize: 56, fontWeight: '900', lineHeight: 50, letterSpacing: -2.2, textTransform: 'uppercase', color: '#1a1c1c' },

  // --- KITCHEN DISPLAY SYSTEM (KDS) STYLES ---
  kitchenGrid: { gap: 24, paddingBottom: 100 },
  emptyKitchenState: { padding: 48, alignItems: 'center', backgroundColor: '#1a1c1c', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(57,255,20,0.2)' },
  emptyKitchenText: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  emptyKitchenSub: { color: '#9ca3af', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  
  // Ticket Card
  kitchenCard: { backgroundColor: '#1a1c1c', borderRadius: 24, padding: 24, borderWidth: 2, borderColor: '#2f3131', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 10 },
  kitchenCardActive: { borderColor: '#39ff14', backgroundColor: '#111' }, 
  
  // Ticket Header
  kitchenCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 16, marginBottom: 16 },
  kitchenOrderLabel: { color: '#39ff14', fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  kitchenOrderId: { color: '#fff', fontSize: 40, fontWeight: '900', letterSpacing: -2, lineHeight: 40 },
  kitchenTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  kitchenTimeText: { color: '#9ca3af', fontSize: 12, fontWeight: '700' },
  
  // Ticket Items
  kitchenItemList: { gap: 16, marginBottom: 24 },
  kitchenItemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  kitchenQtyBadge: { backgroundColor: '#39ff14', width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  kitchenQtyText: { color: '#000', fontSize: 18, fontWeight: '900' },
  kitchenItemDetails: { flex: 1, paddingTop: 4 },
  kitchenItemName: { color: '#fff', fontSize: 20, fontWeight: '800', textTransform: 'uppercase', letterSpacing: -0.5, marginBottom: 4 },
  kitchenItemNote: { color: '#ef4444', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  
  // Action Buttons
  kitchenActionRow: { paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  kitchenBtnStart: { backgroundColor: '#fff', paddingVertical: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  kitchenBtnReady: { backgroundColor: '#39ff14', paddingVertical: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: '#39ff14', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  kitchenBtnTextDark: { color: '#000', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
});