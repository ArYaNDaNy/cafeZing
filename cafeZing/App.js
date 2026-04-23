import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
// Use the new package for safe areas
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Menu as MenuIcon, QrCode, UtensilsCrossed, Hourglass, LayoutDashboard } from 'lucide-react-native';

// Import Theme & UI Components
import { styles } from './src/styles/theme';
import { NavButton } from './src/components/UIComponents';

// Import Screens
import ScanScreen from './src/screens/ScanScreen';
import MenuScreen from './src/screens/MenuScreen';
import WaitlistScreen from './src/screens/WaitlistScreen';
import AdminScreen from './src/screens/AdminScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('scan');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.appContainer} edges={['top']}>
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
          <NavButton 
            active={currentScreen === 'admin'} 
            onClick={() => setCurrentScreen('admin')} 
            icon={<LayoutDashboard size={24} color={currentScreen === 'admin' ? '#39ff14' : 'rgba(255,255,255,0.6)'} />} 
            label="Admin" 
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}