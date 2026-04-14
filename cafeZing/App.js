import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet, Animated, Easing } from 'react-native';
import { Menu as MenuIcon, QrCode, UtensilsCrossed, Hourglass, LayoutDashboard, CheckCircle2, Bell, Camera, BarChart3, Plus, MapPin, Flame, Zap, ChevronRight } from 'lucide-react-native';

// --- CUSTOM ANIMATION WRAPPERS (Replaces Moti) ---

const FadeInView = ({ children, style, delay = 0, slideY = 0, slideX = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay: delay,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, []);

  return (
    <Animated.View style={[style, {
      opacity: anim,
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [slideY, 0] }) },
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [slideX, 0] }) }
      ]
    }]}>
      {children}
    </Animated.View>
  );
};

const RadarRing = ({ delay, borderColor }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        })
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.radarRing, { 
      borderColor,
      opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
      transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2] }) }]
    }]} />
  );
};

const BouncingDot = ({ delay }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: -6, duration: 300, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
        Animated.delay(300) // pause between jumps
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.dot, { transform: [{ translateY: anim }] }]} />;
};

// --- MAIN APP ---

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('scan');

  return (
    <SafeAreaView style={styles.appContainer}>
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity>
            <MenuIcon size={24} color="#1a1c1c" />
          </TouchableOpacity>
          <Text style={styles.appTitle}>CANTEEN LIVE</Text>
        </View>
        <View style={styles.profileContainer}>
          <Image source={{ uri: 'https://picsum.photos/seed/user123/100/100' }} style={styles.profileImg} />
        </View>
      </View>

      <View style={styles.mainContent}>
        {currentScreen === 'scan' && <ScanScreen />}
        {currentScreen === 'menu' && <MenuScreen />}
        {currentScreen === 'waitlist' && <WaitlistScreen />}
        {currentScreen === 'admin' && <AdminScreen />}
      </View>

      <View style={styles.bottomNav}>
        <NavButton active={currentScreen === 'scan'} onClick={() => setCurrentScreen('scan')} icon={<QrCode size={24} color={currentScreen === 'scan' ? '#39ff14' : 'rgba(255,255,255,0.6)'} />} label="Scan" />
        <NavButton active={currentScreen === 'menu'} onClick={() => setCurrentScreen('menu')} icon={<UtensilsCrossed size={24} color={currentScreen === 'menu' ? '#39ff14' : 'rgba(255,255,255,0.6)'} />} label="Menu" />
        <NavButton active={currentScreen === 'waitlist'} onClick={() => setCurrentScreen('waitlist')} icon={<Hourglass size={24} color={currentScreen === 'waitlist' ? '#39ff14' : 'rgba(255,255,255,0.6)'} />} label="Waitlist" />
        <NavButton active={currentScreen === 'admin'} onClick={() => setCurrentScreen('admin')} icon={<LayoutDashboard size={24} color={currentScreen === 'admin' ? '#39ff14' : 'rgba(255,255,255,0.6)'} />} label="Admin" />
      </View>
    </SafeAreaView>
  );
}

function NavButton({ active, onClick, icon, label }) {
  return (
    <TouchableOpacity onPress={onClick} style={[styles.navBtn, active && styles.navBtnActive]}>
      {icon}
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// --- SCREENS ---

function ScanScreen() {
  return (
    <FadeInView slideY={20} style={styles.scanScreen}>
      <Text style={styles.heroTitle}>Grab a{'\n'}Bite.</Text>

      <View style={styles.radarWrapper}>
        <View style={styles.radarGlow} />
        <View style={styles.radarCard}>
          <View style={styles.radarAnimationContainer}>
            <RadarRing delay={0} borderColor="rgba(57, 255, 20, 0.3)" />
            <RadarRing delay={600} borderColor="rgba(57, 255, 20, 0.2)" />
            <RadarRing delay={1200} borderColor="rgba(57, 255, 20, 0.1)" />
            
            <View style={styles.radarCenter}>
              <Zap size={40} color="#000" fill="#000" />
            </View>
          </View>

          <View style={styles.scanningTextWrapper}>
            <Text style={styles.scanningText}>Scanning for{'\n'}Canteen Beacon...</Text>
            <View style={styles.scanningDots}>
              <BouncingDot delay={0} />
              <BouncingDot delay={150} />
              <BouncingDot delay={300} />
            </View>
          </View>

          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      <View style={styles.offlineNotice}>
        <CheckCircle2 size={12} color="#9ca3af" />
        <Text style={styles.offlineText}>Works offline. No internet required for scanning.</Text>
      </View>
    </FadeInView>
  );
}

function WaitlistScreen() {
  return (
    <FadeInView slideX={20} style={styles.screenWrapper}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statusIndicator}>
          <View style={styles.liveDotContainer}>
            <View style={styles.liveDotCore} />
          </View>
          <Text style={styles.statusLabel}>Live Queue Status</Text>
        </View>

        <View style={styles.tokenCard}>
          <Text style={styles.tokenSubtitle}>Your Position</Text>
          <Text style={styles.tokenTitle}>TOKEN{'\n'}#42</Text>
          <View style={styles.queuePosition}>
            <Text style={styles.queuePositionText}>2 orders ahead of you.</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressLineBg} />
          <View style={styles.progressLineActive} />
          <ProgressStep icon={<CheckCircle2 size={20} color="#000" />} label="Received" sub="12:40 PM" active />
          <ProgressStep icon={<UtensilsCrossed size={20} color="#000" />} label="Cooking" sub="In Progress" active />
          <ProgressStep icon={<Bell size={20} color="#9ca3af" />} label="Ready" sub="Est. 5 mins" />
        </View>

        <View style={styles.orderDetailsCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderHeaderTitle}>Order Details</Text>
            <Text style={styles.orderId}>ID: BXT-992</Text>
          </View>
          <View style={styles.orderItem}>
            <View style={styles.itemInfoLeft}>
              <View style={styles.itemImgContainer}>
                <Image source={{ uri: 'https://picsum.photos/seed/salad/200/200' }} style={styles.itemImg} />
              </View>
              <View>
                <Text style={styles.itemName}>Zen Power Bowl</Text>
                <Text style={styles.itemMods}>Extra Avocado • No Onion</Text>
              </View>
            </View>
            <Text style={styles.itemPrice}>$14.50</Text>
          </View>
        </View>
      </ScrollView>
    </FadeInView>
  );
}

function ProgressStep({ icon, label, sub, active }) {
  return (
    <View style={styles.progressStep}>
      <View style={[styles.stepCircle, active && styles.stepCircleActive]}>{icon}</View>
      <View style={styles.stepTextContainer}>
        <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
        <Text style={styles.stepSub}>{sub}</Text>
      </View>
    </View>
  );
}

function AdminScreen() {
  return (
    <FadeInView slideY={-10} style={styles.screenWrapper}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.adminHeaderSection}>
          <Text style={styles.adminSubtitle}>Internal Tool / OCR v2.4</Text>
          <Text style={styles.adminTitle}>Admin{'\n'}Dashboard</Text>
        </View>

        <View style={styles.adminGrid}>
          <TouchableOpacity style={styles.ocrUploadCard}>
            <View style={styles.ocrBg} />
            <View style={styles.ocrContent}>
              <Camera size={48} color="#d1d5db" style={styles.ocrIcon} />
              <Text style={styles.ocrTitle}>Snap Photo of Menu</Text>
              <Text style={styles.ocrDesc}>JPG, PNG, PDF up to 12MB</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.statsCard}>
            <View style={styles.statsTop}>
              <BarChart3 size={32} color="#39ff14" />
              <Text style={styles.statsLabel}>Total Items Scanned</Text>
              <Text style={styles.statsValue}>1,248</Text>
            </View>
            <View style={styles.statsBottom}>
              <View style={styles.confidenceWrapper}>
                <View>
                  <Text style={styles.confidenceText}>AI Confidence</Text>
                  <Text style={styles.confidenceValue}>98.2%</Text>
                </View>
                <View style={styles.confidenceBarBg}>
                  <View style={styles.confidenceBarFill} />
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.inventoryHeader}>
          <Text style={styles.inventoryTitle}>Extracted Inventory</Text>
          <TouchableOpacity style={styles.exportBtn}>
            <Text style={styles.exportBtnText}>Export CSV</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inventoryList}>
          <InventoryRow name="Vada Pav" price="₹15" rec="₹12" cat="Snacks" />
          <InventoryRow name="Coffee" price="₹30" rec="₹25" cat="Beverages" />
          <InventoryRow name="Masala Dosa" price="₹65" rec="₹60" cat="Breakfast" approved />
        </View>
      </ScrollView>
    </FadeInView>
  );
}

function InventoryRow({ name, price, rec, cat, approved }) {
  return (
    <View style={[styles.inventoryRow, approved && styles.inventoryRowApproved]}>
      <View style={styles.invColMain}>
        <Text style={[styles.invName, approved && styles.textMuted]}>{name}</Text>
        <Text style={[styles.invCat, approved && styles.textMuted]}>Category: {cat}</Text>
      </View>
      <Text style={[styles.invColPrice, approved && styles.textMuted]}>{price}</Text>
      <Text style={[styles.invColRec, approved && styles.textMuted]}>{rec}</Text>
      <View style={styles.invColAction}>
        {approved ? (
          <View style={styles.approvedBadge}>
            <CheckCircle2 size={14} color="#9ca3af" />
            <Text style={styles.approvedText}>Approved</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.approveBtn}>
            <Text style={styles.approveBtnText}>Approve</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function MenuScreen() {
  return (
    <FadeInView slideY={20} style={styles.screenWrapper}>
      <View style={styles.priorityBanner}>
        <View style={styles.bannerLeft}>
          <MapPin size={14} color="#000" />
          <Text style={styles.bannerText}>Canteen Detected: Priority Unlocked!</Text>
        </View>
        <View style={styles.bannerTimer}>
          <Text style={styles.bannerTimerText}>10:00</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.menuScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.happyHourBanner}>
          <View style={styles.hhLeft}>
            <Zap size={20} color="#39ff14" fill="#39ff14" />
            <Text style={styles.hhText}>Happy Hour Active: 10% Off</Text>
          </View>
          <Text style={styles.hhBadge}>(Low Traffic)</Text>
        </View>

        <View style={styles.foodGrid}>
          <FoodCard name="Classic Vada Pav" price="25" oldPrice="30" desc="Spicy potato fritter in a soft bun with dry garlic chutney." img="https://picsum.photos/seed/vadapav/400/300" fast />
          <FoodCard name="Classic Cold Coffee" price="45" oldPrice="50" desc="Blended espresso with cold milk and a thick froth layer." img="https://picsum.photos/seed/coffee/400/300" />
          <FoodCard name="Crispy Samosa" price="20" oldPrice="25" desc="Two pieces of flaky pastry stuffed with spiced peas and potato." img="https://picsum.photos/seed/samosa/400/300" fast />
        </View>
      </ScrollView>

      <View style={styles.checkoutFabContainer}>
        <TouchableOpacity style={styles.checkoutFab}>
          <Text style={styles.checkoutText}>Pay with UPI / Card</Text>
          <View style={styles.checkoutAmount}>
            <Text style={styles.checkoutAmountText}>₹120</Text>
            <ChevronRight size={24} color="#000" />
          </View>
        </TouchableOpacity>
      </View>
    </FadeInView>
  );
}

function FoodCard({ name, price, oldPrice, desc, img, fast }) {
  return (
    <View style={styles.foodCard}>
      <View style={styles.foodImgContainer}>
        {fast && (
          <View style={styles.fastBadgeWrapper}>
            <View style={styles.fastBadge}>
              <Flame size={12} color="#000" fill="#000" />
              <Text style={styles.fastBadgeText}>SELLING FAST</Text>
            </View>
          </View>
        )}
        <Image source={{ uri: img }} style={styles.foodImg} />
      </View>
      <View style={styles.foodInfo}>
        <View style={styles.foodHeader}>
          <Text style={styles.foodName}>{name}</Text>
          <View style={styles.foodPricing}>
            <Text style={styles.foodPrice}>₹{price}</Text>
            <Text style={styles.foodOldPrice}>₹{oldPrice}</Text>
          </View>
        </View>
        <Text style={styles.foodDesc}>{desc}</Text>
        <TouchableOpacity style={styles.addToTrayBtn}>
          <Text style={styles.addToTrayText}>ADD TO TRAY</Text>
          <Plus size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- STYLES ---

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: '#f9f9f9' },
  appHeader: { position: 'absolute', top: 0, left: 0, right: 0, height: 64, backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, zIndex: 50 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  appTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -1, textTransform: 'uppercase', color: '#1a1c1c' },
  profileContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(57, 255, 20, 0.2)', borderWidth: 2, borderColor: '#39ff14', overflow: 'hidden' },
  profileImg: { width: '100%', height: '100%' },
  mainContent: { paddingTop: 64, paddingBottom: 96, flex: 1 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1a1c1c', height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 16, zIndex: 50, shadowColor: '#39ff14', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.15, shadowRadius: 40, elevation: 20 },
  navBtn: { alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 },
  navBtnActive: { backgroundColor: '#2f3131' },
  navLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.6, color: 'rgba(255, 255, 255, 0.6)' },
  navLabelActive: { color: '#39ff14' },
  screenWrapper: { paddingTop: 32, paddingHorizontal: 24, alignSelf: 'center', width: '100%', maxWidth: 512, flex: 1 },
  scrollContent: { paddingBottom: 48 },
  scanScreen: { flex: 1, paddingTop: 32, paddingHorizontal: 24, alignItems: 'center' },
  heroTitle: { fontSize: 64, fontWeight: '900', lineHeight: 54, letterSpacing: -3.2, textTransform: 'uppercase', marginBottom: 48, alignSelf: 'flex-start', color: '#1a1c1c' },
  radarWrapper: { position: 'relative', width: '100%', aspectRatio: 1, maxWidth: 340 },
  radarGlow: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(57, 255, 20, 0.15)', borderRadius: 170 },
  radarCard: { width: '100%', height: '100%', backgroundColor: '#1a1c1c', borderRadius: 24, alignItems: 'center', justifyContent: 'center', padding: 32, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 25 }, shadowOpacity: 0.25, shadowRadius: 50, elevation: 15 },
  radarAnimationContainer: { position: 'relative', width: 192, height: 192, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  radarRing: { position: 'absolute', width: '100%', height: '100%', borderRadius: 96, borderWidth: 2 },
  radarCenter: { width: 96, height: 96, backgroundColor: '#39ff14', borderRadius: 48, alignItems: 'center', justifyContent: 'center', shadowColor: '#39ff14', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 40, elevation: 10 },
  scanningTextWrapper: { alignItems: 'center' },
  scanningText: { color: '#39ff14', fontWeight: '900', fontSize: 20, letterSpacing: -0.5, textTransform: 'uppercase', lineHeight: 22, marginBottom: 16, textAlign: 'center' },
  scanningDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, height: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#39ff14' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: 'rgba(57, 255, 20, 0.4)' },
  topLeft: { top: 24, left: 24, borderTopWidth: 2, borderLeftWidth: 2 },
  topRight: { top: 24, right: 24, borderTopWidth: 2, borderRightWidth: 2 },
  bottomLeft: { bottom: 24, left: 24, borderBottomWidth: 2, borderLeftWidth: 2 },
  bottomRight: { bottom: 24, right: 24, borderBottomWidth: 2, borderRightWidth: 2 },
  offlineNotice: { marginTop: 48, flexDirection: 'row', alignItems: 'center', gap: 8 },
  offlineText: { color: '#9ca3af', fontWeight: '700', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.6 },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 32 },
  liveDotContainer: { width: 12, height: 12, justifyContent: 'center', alignItems: 'center' },
  liveDotCore: { width: '100%', height: '100%', borderRadius: 6, backgroundColor: '#39ff14' },
  statusLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase', color: '#6b7280' },
  tokenCard: { backgroundColor: '#1a1c1c', borderRadius: 40, padding: 48, alignItems: 'center', marginBottom: 48, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.1, shadowRadius: 25, elevation: 5 },
  tokenSubtitle: { color: '#39ff14', fontWeight: '900', letterSpacing: 3.2, fontSize: 12, textTransform: 'uppercase', marginBottom: 16 },
  tokenTitle: { color: '#fff', fontWeight: '900', fontSize: 72, lineHeight: 72, letterSpacing: -3.6, marginBottom: 24, textAlign: 'center' },
  queuePosition: { backgroundColor: 'rgba(57, 255, 20, 0.1)', borderWidth: 1, borderColor: 'rgba(57, 255, 20, 0.2)', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 24 },
  queuePositionText: { color: '#39ff14', fontWeight: '700', fontSize: 14 },
  progressContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 64, paddingHorizontal: 16 },
  progressLineBg: { position: 'absolute', top: 20, left: 32, right: 32, height: 2, backgroundColor: '#e5e7eb', zIndex: -1 },
  progressLineActive: { position: 'absolute', top: 20, left: 32, width: '50%', height: 2, backgroundColor: '#39ff14', zIndex: -1 },
  progressStep: { alignItems: 'center', gap: 12 },
  stepCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#f3f4f6' },
  stepCircleActive: { backgroundColor: '#39ff14', borderColor: 'transparent', shadowColor: '#39ff14', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 8 },
  stepTextContainer: { alignItems: 'center' },
  stepLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.4, color: '#9ca3af' },
  stepLabelActive: { color: '#000' },
  stepSub: { fontSize: 8, color: '#9ca3af', fontWeight: '700' },
  orderDetailsCard: { backgroundColor: '#f3f4f6', borderRadius: 24, padding: 24 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  orderHeaderTitle: { fontWeight: '900', fontSize: 18, textTransform: 'uppercase', letterSpacing: -0.4, color: '#1a1c1c' },
  orderId: { fontSize: 10, backgroundColor: '#e5e7eb', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, fontWeight: '700', color: '#1a1c1c' },
  orderItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemInfoLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  itemImgContainer: { width: 64, height: 64, backgroundColor: '#1a1c1c', borderRadius: 16, overflow: 'hidden' },
  itemImg: { width: '100%', height: '100%', opacity: 0.8 },
  itemName: { fontWeight: '900', textTransform: 'uppercase', fontSize: 14, color: '#1a1c1c' },
  itemMods: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  itemPrice: { fontWeight: '900', fontSize: 20, color: '#39ff14', backgroundColor: '#1a1c1c', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8 },
  adminHeaderSection: { marginBottom: 48 },
  adminSubtitle: { fontSize: 10, fontWeight: '900', letterSpacing: 3.2, textTransform: 'uppercase', color: '#39ff14', marginBottom: 8 },
  adminTitle: { fontSize: 56, fontWeight: '900', lineHeight: 50, letterSpacing: -2.2, textTransform: 'uppercase', color: '#1a1c1c' },
  adminGrid: { marginBottom: 48, gap: 24 },
  ocrUploadCard: { backgroundColor: 'rgba(57, 255, 20, 0.05)', borderRadius: 32, borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db', padding: 48, alignItems: 'center' },
  ocrIcon: { marginBottom: 24 },
  ocrTitle: { fontSize: 20, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.4, marginBottom: 8, color: '#1a1c1c' },
  ocrDesc: { fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.6 },
  statsCard: { backgroundColor: '#1a1c1c', padding: 32, borderRadius: 32, justifyContent: 'space-between' },
  statsLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.6, opacity: 0.6, color: '#fff', marginBottom: 4, marginTop: 16 },
  statsValue: { fontSize: 36, fontWeight: '900', fontStyle: 'italic', color: '#fff' },
  statsBottom: { marginTop: 32 },
  confidenceWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  confidenceText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.6, opacity: 0.6, color: '#fff' },
  confidenceValue: { fontSize: 24, fontWeight: '900', color: '#39ff14' },
  confidenceBarBg: { height: 48, width: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 4, overflow: 'hidden' },
  confidenceBarFill: { height: '98%', width: '100%', backgroundColor: '#39ff14' },
  inventoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 },
  inventoryTitle: { fontSize: 24, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.4, color: '#1a1c1c' },
  exportBtn: { paddingVertical: 8, paddingHorizontal: 24, backgroundColor: '#e5e7eb', borderRadius: 12 },
  exportBtnText: { color: '#000', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.6 },
  inventoryList: { gap: 16 },
  inventoryRow: { flexDirection: 'row', alignItems: 'center', padding: 24, borderRadius: 16, backgroundColor: '#1a1c1c' },
  inventoryRowApproved: { backgroundColor: '#f3f4f6' },
  invColMain: { flex: 2 },
  invName: { fontWeight: '900', textTransform: 'uppercase', fontSize: 18, letterSpacing: -0.4, color: '#fff' },
  invCat: { fontSize: 10, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.4)' },
  textMuted: { color: '#9ca3af' },
  invColPrice: { flex: 1, textAlign: 'center', fontWeight: '700', color: 'rgba(255, 255, 255, 0.6)' },
  invColRec: { flex: 1, textAlign: 'center', fontWeight: '900', fontSize: 20, fontStyle: 'italic', color: '#39ff14' },
  invColAction: { flex: 1, alignItems: 'flex-end' },
  approvedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  approvedText: { color: '#9ca3af', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', fontStyle: 'italic' },
  approveBtn: { backgroundColor: '#39ff14', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 12 },
  approveBtnText: { color: '#000', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.6 },
  menuScrollContent: { paddingBottom: 160 },
  priorityBanner: { backgroundColor: '#39ff14', paddingVertical: 12, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerText: { color: '#000', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.6 },
  bannerTimer: { backgroundColor: '#000', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12 },
  bannerTimerText: { color: '#39ff14', fontSize: 10, fontWeight: '900' },
  happyHourBanner: { backgroundColor: '#1a1c1c', paddingVertical: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  hhLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hhText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: -0.8, textTransform: 'uppercase', fontStyle: 'italic' },
  hhBadge: { color: '#39ff14', fontSize: 9, fontWeight: '900', letterSpacing: 1.6, backgroundColor: 'rgba(57, 255, 20, 0.1)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(57, 255, 20, 0.2)', textTransform: 'uppercase' },
  foodGrid: { padding: 24, gap: 32 },
  foodCard: { backgroundColor: '#1a1c1c', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 25 }, shadowOpacity: 0.25, shadowRadius: 50, elevation: 15 },
  foodImgContainer: { aspectRatio: 1.33, overflow: 'hidden' },
  fastBadgeWrapper: { position: 'absolute', top: 16, left: 16, zIndex: 10 },
  fastBadge: { backgroundColor: '#39ff14', flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, gap: 6 },
  fastBadgeText: { color: '#000', fontSize: 9, fontWeight: '900' },
  foodImg: { width: '100%', height: '100%', opacity: 0.9 },
  foodInfo: { padding: 32 },
  foodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  foodName: { fontWeight: '900', fontSize: 24, letterSpacing: -0.8, textTransform: 'uppercase', fontStyle: 'italic', color: '#fff', flex: 1, marginRight: 8 },
  foodPricing: { alignItems: 'flex-end' },
  foodPrice: { color: '#39ff14', fontWeight: '900', fontSize: 30, letterSpacing: -0.8 },
  foodOldPrice: { color: 'rgba(255, 255, 255, 0.3)', textDecorationLine: 'line-through', fontSize: 12, fontWeight: '700' },
  foodDesc: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 14, fontWeight: '500', marginBottom: 24, lineHeight: 22 },
  addToTrayBtn: { backgroundColor: '#fff', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addToTrayText: { color: '#000', fontWeight: '900' },
  checkoutFabContainer: { position: 'absolute', bottom: 96, left: 0, right: 0, alignItems: 'center', zIndex: 50 },
  checkoutFab: { width: '90%', maxWidth: 448, backgroundColor: '#39ff14', paddingVertical: 20, paddingHorizontal: 32, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#39ff14', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 50, elevation: 20 },
  checkoutText: { textTransform: 'uppercase', letterSpacing: 3.2, fontSize: 12, fontWeight: '900', color: '#000' },
  checkoutAmount: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkoutAmountText: { fontSize: 24, letterSpacing: -0.8, fontWeight: '900', color: '#000' }
});