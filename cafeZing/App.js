import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity,Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Menu as MenuIcon, QrCode, UtensilsCrossed, Hourglass, LayoutDashboard, ChefHat } from 'lucide-react-native';

import { styles } from './src/styles/theme';
import { NavButton } from './src/components/UIComponents';

import ScanScreen from './src/screens/ScanScreen';
import MenuScreen from './src/screens/MenuScreen';
import WaitlistScreen from './src/screens/WaitlistScreen';
import AdminScreen from './src/screens/AdminScreen';
import KitchenScreen from './src/screens/KitchenScreen'; 
import { CartProvider } from './src/context/CartContext';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('scan');
  const [isAdminMode, setIsAdminMode] = useState(false);

  const toggleRole = () => {
    const newMode = !isAdminMode;
    setIsAdminMode(newMode);
    setCurrentScreen(newMode ? 'kitchen' : 'scan');
  };

  return (
    <SafeAreaProvider>
      <CartProvider>
        <SafeAreaView style={styles.appContainer} edges={['top', 'bottom']}>
          <View style={styles.appHeader}>
            <View style={styles.headerLeft}>
              <TouchableOpacity>
                <MenuIcon size={24} color="#1a1c1c" />
              </TouchableOpacity>
              <Text style={styles.appTitle}>
                {isAdminMode ? "CAFEZING STAFF" : "CANTEEN LIVE"}
              </Text>
            </View>
            

            <TouchableOpacity 
              style={styles.profileContainer} 
              onLongPress={toggleRole} 
              delayLongPress={800} 
            >
              <Image 
                source={{ uri: 'https://picsum.photos/seed/user123/100/100' }} 
                style={[styles.profileImg, isAdminMode && { borderColor: '#39ff14', borderWidth: 2 }]} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            {currentScreen === 'scan' && <ScanScreen />}
            {currentScreen === 'menu' && <MenuScreen setCurrentScreen={setCurrentScreen}/>}
            {currentScreen === 'waitlist' && <WaitlistScreen setCurrentScreen={setCurrentScreen}/>}
            {currentScreen === 'admin' && <AdminScreen />}
            {currentScreen === 'kitchen' && <KitchenScreen />}
          </View>

          <View style={styles.bottomNav}>
            {!isAdminMode ? (
              <>
                {/* STUDENT NAVIGATION */}
                <NavButton 
                  active={currentScreen === 'scan'} 
                  onClick={() => setCurrentScreen('scan')} 
                  icon={<QrCode size={24} color={currentScreen === 'scan' ? '#39ff14' : 'rgba(255,255,255,0.6)'} />} 
                  label="Scan" 
                />
                <NavButton 
                  active={currentScreen === 'menu'} 
                  onClick={() => setCurrentScreen('menu')} 
                  icon={<UtensilsCrossed size={24} color={currentScreen === 'menu' ? '#39ff14' : 'rgba(255,255,255,0.6)'} />} 
                  label="Menu" 
                />
                <NavButton 
                  active={currentScreen === 'waitlist'} 
                  onClick={() => setCurrentScreen('waitlist')} 
                  icon={<Hourglass size={24} color={currentScreen === 'waitlist' ? '#39ff14' : 'rgba(255,255,255,0.6)'} />} 
                  label="Waitlist" 
                />
              </>
            ) : (
              <>
                {/* STAFF / KITCHEN NAVIGATION */}
                <NavButton 
                  active={currentScreen === 'kitchen'} 
                  onClick={() => setCurrentScreen('kitchen')} 
                  icon={<ChefHat size={24} color={currentScreen === 'kitchen' ? '#39ff14' : 'rgba(255,255,255,0.6)'} />} 
                  label="Kitchen" 
                />
                <NavButton 
                  active={currentScreen === 'admin'} 
                  onClick={() => setCurrentScreen('admin')} 
                  icon={<LayoutDashboard size={24} color={currentScreen === 'admin' ? '#39ff14' : 'rgba(255,255,255,0.6)'} />} 
                  label="Dashboard" 
                />
              </>
            )}
          </View>
        </SafeAreaView>
      </CartProvider> 
    </SafeAreaProvider>
  );

}