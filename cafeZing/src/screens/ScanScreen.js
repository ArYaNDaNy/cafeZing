import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Zap, CheckCircle2, AlertCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../styles/theme';
import { FadeInView, RadarRing, BouncingDot } from '../components/Animations';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL; 
const CANTEEN_BEACON_ID = 'canteen_main_gate';
const bleManager = new BleManager();

export default function ScanScreen({ navigation }) { // Assuming you use React Navigation
  const [scanStatus, setScanStatus] = useState('scanning'); // 'scanning', 'success', 'error'
  const [tokenId, setTokenId] = useState(null);
  
  const heartbeatInterval = useRef(null);

  // 1. WAKE UP LOGIC
  useEffect(() => {
    checkSavedToken();
    return () => stopHeartbeat();
  }, []);

  // 2. CHECK STORAGE FIRST
  const checkSavedToken = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('@ghost_token');
      
      if (savedToken) {
        // We found an old token! Let's ask the server if it's still valid
        const response = await fetch(`${BACKEND_URL}/api/heartbeat/`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-token-id': savedToken 
          },
        });

        if (response.ok) {
          setTokenId(savedToken);
          setScanStatus('success');
          startHeartbeat(savedToken);
          return; 
        } else {
          // Server rejected it (token died in Redis). Clear it and scan.
          await AsyncStorage.removeItem('@ghost_token');
        }
      }
      
      // If no token was found, or the old one was dead, do a fresh scan
      performScan();

    } catch (error) {
      console.error("Storage error:", error);
      performScan();
    }
  };

  // 3. THE API CALL LOGIC (Updated to save token)
  const performScan = async () => {
    setScanStatus('scanning');
    
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert("Permission Denied", "Bluetooth and Location are required.");
      setScanStatus('error');
      return;
    }

    // 1. Start listening to the physical Bluetooth radio
    bleManager.startDeviceScan(null, null, async (error, device) => {
      if (error) {
        console.error("BLE Error:", error);
        setScanStatus('error');
        return;
      }

      // 2. 🔍 LOOK FOR THE PHYSICAL BEACON
      if (device && device.name === 'CANTEEN_BEACON') {
        
        bleManager.stopDeviceScan(); // Found it! Turn off radio to save battery.
        
        try {
          // 3. CALL YOUR BACKEND TO GET THE OFFICIAL REDIS TOKEN
          const response = await fetch(`${BACKEND_URL}/api/scan/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ beacon_id: CANTEEN_BEACON_ID }),
          });

          if (response.ok) {
            const data = await response.json();
            
            // 4. SAVE THE OFFICIAL TOKEN
            setTokenId(data.token_id);
            await AsyncStorage.setItem('@ghost_token', data.token_id); 
            
            setScanStatus('success');
            startHeartbeat(data.token_id); // Start the Redis keep-alive ping!
          } else {
            setScanStatus('error');
          }
        } catch (networkError) {
          console.error("Backend Error:", networkError);
          setScanStatus('error');
        }
      }
    });

    // Auto-fail if the beacon isn't found within 10 seconds
    setTimeout(() => {
      bleManager.stopDeviceScan();
      setScanStatus(prev => prev === 'scanning' ? 'error' : prev);
    }, 10000);
  };

  // 4. THE HEARTBEAT LOGIC
  const startHeartbeat = (activeToken) => {
    stopHeartbeat(); 

    heartbeatInterval.current = setInterval(async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/heartbeat/`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-token-id': activeToken 
          },
        });

        if (response.status === 401) {
          // TOKEN DIED! 
          stopHeartbeat();
          setScanStatus('error');
          await AsyncStorage.removeItem('@ghost_token'); // <-- WIPE FROM HARD DRIVE
          Alert.alert("Session Expired", "You stepped away. Please rescan.");
        }
      } catch (error) {
        console.log("Heartbeat ping failed, will retry next cycle.");
      }
    }, 120000); 
  };

  const stopHeartbeat = () => {
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
  };

  // --- RENDER HELPERS ---

  const renderScanningUI = () => (
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
  );

  // permissions
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      return (
        granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true; 
  };

  return (
    <FadeInView slideY={20} style={styles.scanScreen}>
      <Text style={styles.heroTitle}>Grab a{'\n'}Bite.</Text>

      <View style={styles.radarWrapper}>
        <View style={styles.radarGlow} />
        
        {/* CONDITIONAL RENDERING BASED ON STATE */}
        
        {scanStatus === 'scanning' && renderScanningUI()}

        {scanStatus === 'success' && (
          <View style={[styles.radarCard, { justifyContent: 'center', alignItems: 'center' }]}>
            <CheckCircle2 size={60} color="#39FF14" style={{ marginBottom: 20 }} />
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>Connected!</Text>
            <Text style={{ color: '#888', marginTop: 10 }}>Ghost Token: {tokenId}</Text>
            
            <TouchableOpacity 
              style={{ backgroundColor: '#39FF14', padding: 15, borderRadius: 30, marginTop: 30, width: '80%', alignItems: 'center' }}
              onPress={() => console.log("Navigate to Menu Screen here!")}
            >
              <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>View Menu</Text>
            </TouchableOpacity>
          </View>
        )}

        {scanStatus === 'error' && (
          <View style={[styles.radarCard, { justifyContent: 'center', alignItems: 'center' }]}>
            <AlertCircle size={60} color="#FF4747" style={{ marginBottom: 20 }} />
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>Beacon Not Found</Text>
            <Text style={{ color: '#888', marginTop: 10, textAlign: 'center' }}>Ensure you are at the canteen entrance.</Text>
            
            <TouchableOpacity 
              style={{ backgroundColor: '#FF4747', padding: 15, borderRadius: 30, marginTop: 30, width: '80%', alignItems: 'center' }}
              onPress={performScan}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Tap to Retry</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>

      <View style={styles.offlineNotice}>
        <CheckCircle2 size={12} color="#9ca3af" />
        <Text style={styles.offlineText}>Works offline. No internet required for scanning.</Text>
      </View>
    </FadeInView>
  );
}