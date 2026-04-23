import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal, ActivityIndicator } from 'react-native';
import { Camera, BarChart3, CheckCircle2, X, Aperture, Image as ImageIcon, Upload } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { FadeInView } from '../components/Animations'; 

// Load from .env with a fallback just in case!
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.3:8000';
const API_URL = `${API_BASE}/api/menu/scan`;

export default function AdminScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);
  const cameraRef = useRef(null);

  const sendImageToAI = async (base64String) => {
    setIsProcessing(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_base64: base64String }),
      });

      const data = await response.json();

      if (response.ok) {
        setExtractedItems(data); 
      } else {
        Alert.alert("Server Error", data.detail || "Something went wrong.");
      }
    } catch (error) {
      console.error("Network Error:", error);
      Alert.alert("Network Error", "Could not reach the backend. Check your backend server and IP.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- CSV Export Logic ---
  const handleExportCSV = async () => {
    if (extractedItems.length === 0) return;

    try {
      // 1. Build the CSV String
      let csvContent = "Name,Category,Original Price,AI Recommended Price\n";
      
      extractedItems.forEach(item => {
        // Escape quotes to prevent CSV formatting breaks
        const safeName = `"${(item.name || '').replace(/"/g, '""')}"`;
        const safeCat = `"${(item.category || '').replace(/"/g, '""')}"`;
        csvContent += `${safeName},${safeCat},${item.price},${item.ai_recommended_price}\n`;
      });

      // 2. Write to Phone Storage
      const fileName = `CafeZing_Menu_${new Date().getTime()}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // 3. Open Native Share Sheet
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Menu Inventory',
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device.");
      }
    } catch (error) {
      console.error("Export Error:", error);
      Alert.alert("Export Failed", "Could not generate the CSV file.");
    }
  };

  // --- Camera Handlers ---
  const handleOpenCamera = async () => {
    setIsModalVisible(false);
    if (!cameraPermission) return;
    if (!cameraPermission.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        Alert.alert("Permission Required", "We need camera access to scan menus.");
        return;
      }
    }
    setIsCameraActive(true);
  };

  const handleOpenGallery = async () => {
    setIsModalVisible(false);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "We need gallery access to upload menus.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      allowsEditing: true,
      quality: 1,             
      base64: true,           
    });

    if (!result.canceled) {
      sendImageToAI(result.assets[0].base64);
    }
  };

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true });
        setIsCameraActive(false);
        sendImageToAI(photo.base64);
      } catch (error) {
        console.error("Failed to take picture", error);
      }
    }
  };

  const totalItems = extractedItems.length;
  const averageConfidence = totalItems > 0 
    ? (extractedItems.reduce((acc, item) => acc + (item.confidence_score || 0.99), 0) / totalItems) * 100 
    : 0;

  // --- CAMERA VIEW ---
  if (isCameraActive) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing="back" ref={cameraRef}>
          <View style={styles.cameraOverlay}>
            <TouchableOpacity style={styles.closeCameraBtn} onPress={() => setIsCameraActive(false)}>
              <X size={28} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.cameraTargetBox}>
              <View style={[styles.targetCorner, styles.targetTopLeft]} />
              <View style={[styles.targetCorner, styles.targetTopRight]} />
              <View style={[styles.targetCorner, styles.targetBottomLeft]} />
              <View style={[styles.targetCorner, styles.targetBottomRight]} />
            </View>

            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.captureBtn} onPress={handleTakePicture}>
                <View style={styles.captureBtnInner}>
                  <Aperture size={32} color="#1a1c1c" />
                </View>
              </TouchableOpacity>
              <Text style={styles.cameraHelperText}>Align menu within the frame</Text>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  // --- DASHBOARD VIEW ---
  return (
    <FadeInView slideY={-10} style={styles.screenWrapper}>
      
      {/* SELECTION MODAL */}
      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Menu</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <X size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.modalOptionBtn} onPress={handleOpenCamera}>
              <Camera size={24} color="#39ff14" />
              <Text style={styles.modalOptionText}>Take a Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOptionBtn} onPress={handleOpenGallery}>
              <ImageIcon size={24} color="#39ff14" />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FULL-SCREEN PROCESSING MODAL */}
      <Modal visible={isProcessing} transparent={true} animationType="fade">
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color="#39ff14" />
            <Text style={styles.processingTitle}>Analyzing Menu</Text>
            <Text style={styles.processingText}>Gemini AI is extracting items, formatting JSON, and calculating price recommendations.</Text>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.adminHeaderSection}>
          <Text style={styles.adminSubtitle}>Internal Tool / OCR v2.4</Text>
          <Text style={styles.adminTitle}>Admin{'\n'}Dashboard</Text>
        </View>

        <View style={styles.adminGrid}>
          <TouchableOpacity style={styles.ocrUploadCard} onPress={() => setIsModalVisible(true)}>
            <View style={styles.ocrContent}>
              <Upload size={48} color="#d1d5db" style={styles.ocrIcon} />
              <Text style={styles.ocrTitle}>Upload Menu</Text>
              <Text style={styles.ocrDesc}>JPG, PNG up to 12MB</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.statsCard}>
            <View style={styles.statsTop}>
              <BarChart3 size={32} color="#39ff14" />
              <Text style={styles.statsLabel}>Total Items Scanned</Text>
              <Text style={styles.statsValue}>{totalItems}</Text>
            </View>
            <View style={styles.statsBottom}>
              <View style={styles.confidenceWrapper}>
                <View>
                  <Text style={styles.confidenceText}>AI Average Confidence</Text>
                  <Text style={styles.confidenceValue}>{averageConfidence.toFixed(1)}%</Text>
                </View>
                <View style={styles.confidenceBarBg}>
                  <View style={[styles.confidenceBarFill, { height: `${averageConfidence}%` }]} />
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.inventoryHeader}>
          <Text style={styles.inventoryTitle}>Extracted Inventory</Text>
          {totalItems > 0 && (
            <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV}>
              <Text style={styles.exportBtnText}>Export CSV</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inventoryList}>
          {totalItems > 0 ? (
            extractedItems.map((item, index) => (
              <InventoryRow 
                key={index} 
                name={item.name} 
                price={`₹${item.price}`} 
                rec={`₹${item.ai_recommended_price}`} 
                cat={item.category} 
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No items extracted yet. Upload a menu to begin populating your database.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </FadeInView>
  );
}

// --- LOCAL COMPONENTS ---
function InventoryRow({ name, price, rec, cat, approved }) {
  return (
    <View style={[styles.inventoryRow, approved && styles.inventoryRowApproved]}>
      <View style={styles.invColMain}>
        <Text style={[styles.invName, approved && styles.textMuted]} numberOfLines={2}>{name}</Text>
        <Text style={[styles.invCat, approved && styles.textMuted]} numberOfLines={1}>{cat}</Text>
      </View>
      
      <View style={styles.pricingColumn}>
        <Text style={styles.pricingLabel}>Original</Text>
        <Text style={[styles.invColPrice, approved && styles.textMuted]}>{price}</Text>
      </View>

      <View style={styles.pricingColumn}>
        <Text style={styles.pricingLabel}>AI Price</Text>
        <Text style={[styles.invColRec, approved && styles.textMuted]}>{rec}</Text>
      </View>
      
      <View style={styles.invColAction}>
        {approved ? (
          <View style={styles.approvedBadge}>
            <CheckCircle2 size={14} color="#9ca3af" />
            <Text style={styles.approvedText}>Done</Text>
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

// --- LOCAL STYLESHEET ---
const styles = StyleSheet.create({
  // Dashboard Core
  screenWrapper: { paddingHorizontal: 16, alignSelf: 'center', width: '100%', maxWidth: 512, flex: 1 },
  scrollContent: { paddingBottom: 48, paddingTop: 20 },
  adminHeaderSection: { marginBottom: 32 },
  adminSubtitle: { fontSize: 10, fontWeight: '900', letterSpacing: 3.2, textTransform: 'uppercase', color: '#39ff14', marginBottom: 8 },
  adminTitle: { fontSize: 40, fontWeight: '900', lineHeight: 40, letterSpacing: -1.5, textTransform: 'uppercase', color: '#1a1c1c' },
  adminGrid: { marginBottom: 32, gap: 16 },
  
  // OCR Card
  ocrUploadCard: { backgroundColor: 'rgba(57, 255, 20, 0.05)', borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db', padding: 32, alignItems: 'center' },
  ocrIcon: { marginBottom: 16 },
  ocrTitle: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.4, marginBottom: 8, color: '#1a1c1c' },
  ocrDesc: { fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.2 },
  
  // Stats Card
  statsCard: { backgroundColor: '#1a1c1c', padding: 24, borderRadius: 24, justifyContent: 'space-between' },
  statsLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.6, opacity: 0.6, color: '#fff', marginBottom: 4, marginTop: 12 },
  statsValue: { fontSize: 32, fontWeight: '900', fontStyle: 'italic', color: '#fff' },
  statsBottom: { marginTop: 24 },
  confidenceWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  confidenceText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.6, opacity: 0.6, color: '#fff' },
  confidenceValue: { fontSize: 20, fontWeight: '900', color: '#39ff14' },
  confidenceBarBg: { height: 40, width: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  confidenceBarFill: { width: '100%', backgroundColor: '#39ff14' },
  
  // Inventory Section
  inventoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  inventoryTitle: { fontSize: 20, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.4, color: '#1a1c1c' },
  exportBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#1a1c1c', borderRadius: 8 },
  exportBtnText: { color: '#39ff14', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  inventoryList: { gap: 12 },
  emptyState: { padding: 32, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 16 },
  emptyStateText: { textAlign: 'center', color: '#9ca3af', fontWeight: '600', lineHeight: 20 },
  
  // Inventory Row
  inventoryRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: '#1a1c1c', gap: 8 },
  inventoryRowApproved: { backgroundColor: '#f3f4f6' },
  invColMain: { flex: 2, paddingRight: 8 },
  invName: { fontWeight: '900', textTransform: 'uppercase', fontSize: 14, letterSpacing: -0.2, color: '#fff' },
  invCat: { fontSize: 9, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)', marginTop: 4, fontWeight: '700' },
  textMuted: { color: '#9ca3af' },
  pricingColumn: { alignItems: 'center', flex: 1 },
  pricingLabel: { fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: '900', marginBottom: 2 },
  invColPrice: { textAlign: 'center', fontWeight: '700', color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 },
  invColRec: { textAlign: 'center', fontWeight: '900', fontSize: 14, fontStyle: 'italic', color: '#39ff14' },
  invColAction: { flex: 1.2, alignItems: 'flex-end' },
  approvedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  approvedText: { color: '#9ca3af', fontWeight: '900', fontSize: 9, textTransform: 'uppercase', fontStyle: 'italic' },
  approveBtn: { backgroundColor: '#39ff14', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, width: '100%', alignItems: 'center' },
  approveBtnText: { color: '#000', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },

  // --- Modal Styles ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: '#1a1c1c', borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.4 },
  modalOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'rgba(57, 255, 20, 0.1)', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(57, 255, 20, 0.2)' },
  modalOptionText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },

  // --- Processing UI Styles ---
  processingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  processingCard: { backgroundColor: '#1a1c1c', padding: 32, borderRadius: 24, alignItems: 'center', width: '100%', maxWidth: 320, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20 },
  processingTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 16, marginBottom: 8, textTransform: 'uppercase' },
  processingText: { color: '#9ca3af', textAlign: 'center', fontSize: 12, lineHeight: 18, fontWeight: '600' },

  // --- Camera UI Styles ---
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'space-between', padding: 24 },
  closeCameraBtn: { alignSelf: 'flex-end', marginTop: 40, backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 24 },
  cameraTargetBox: { alignSelf: 'center', width: '90%', aspectRatio: 0.7, position: 'relative' },
  targetCorner: { position: 'absolute', width: 40, height: 40, borderColor: '#39ff14' },
  targetTopLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  targetTopRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  targetBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  targetBottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  cameraControls: { alignItems: 'center', paddingBottom: 40 },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#39ff14', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(57, 255, 20, 0.3)' },
  captureBtnInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#39ff14', justifyContent: 'center', alignItems: 'center' },
  cameraHelperText: { color: '#fff', marginTop: 16, fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }
});