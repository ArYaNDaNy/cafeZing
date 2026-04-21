import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal } from 'react-native';
import { Camera, BarChart3, CheckCircle2, X, Aperture, Image as ImageIcon, Upload } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { FadeInView } from '../components/Animations'; 

const API_URL = 'http://192.168.1.3:8000/api/menu/scan';

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
        setExtractedItems(data.items); 
        Alert.alert("Success", `AI extracted ${data.total_items_found} items!`);
      } else {
        Alert.alert("Server Error", data.detail || "Something went wrong.");
      }
    } catch (error) {
      console.error("Network Error:", error);
      Alert.alert("Network Error", "Could not reach the backend. Check your IP address!");
    } finally {
      setIsProcessing(false);
    }
  };
  // --- Handlers ---
  const handleOpenCamera = async () => {
    setIsModalVisible(false); // Close the choice modal
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
    setIsModalVisible(false); // Close the choice modal
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "We need gallery access to upload menus.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // <--- The new string array format!
      allowsEditing: true,
      quality: 1,             // <--- Still crucial for the OCR!
      base64: true,           
    });

    if (!result.canceled) {
      console.log("Gallery photo selected!");
      // Call the backend!
      sendImageToAI(result.assets[0].base64);
    }
  };

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true });
        setIsCameraActive(false);
        
        // Call the backend!
        sendImageToAI(photo.base64);
      } catch (error) {
        console.error("Failed to take picture", error);
      }
    }
  };

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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.adminHeaderSection}>
          <Text style={styles.adminSubtitle}>Internal Tool / OCR v2.4</Text>
          <Text style={styles.adminTitle}>Admin{'\n'}Dashboard</Text>
        </View>

        <View style={styles.adminGrid}>
          {/* CAMERA UPLOAD CARD - Now opens the modal instead of forcing camera */}
          <TouchableOpacity style={styles.ocrUploadCard} onPress={() => setIsModalVisible(true)}>
            <View style={styles.ocrBg} />
            <View style={styles.ocrContent}>
              <Upload size={48} color="#d1d5db" style={styles.ocrIcon} />
              <Text style={styles.ocrTitle}>Upload Menu</Text>
              <Text style={styles.ocrDesc}>JPG, PNG, PDF up to 12MB</Text>
            </View>
          </TouchableOpacity>

          {/* STATS CARD */}
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

        {/* INVENTORY SECTION */}
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

// --- LOCAL COMPONENTS ---
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

// --- LOCAL STYLESHEET ---
const styles = StyleSheet.create({
  // Dashboard Core
  screenWrapper: {  paddingHorizontal: 24, alignSelf: 'center', width: '100%', maxWidth: 512, flex: 1 },
  scrollContent: { paddingBottom: 48 },
  adminHeaderSection: { marginBottom: 48 },
  adminSubtitle: { fontSize: 10, fontWeight: '900', letterSpacing: 3.2, textTransform: 'uppercase', color: '#39ff14', marginBottom: 8 },
  adminTitle: { fontSize: 56, fontWeight: '900', lineHeight: 50, letterSpacing: -2.2, textTransform: 'uppercase', color: '#1a1c1c' },
  adminGrid: { marginBottom: 48, gap: 24 },
  
  // OCR Card
  ocrUploadCard: { backgroundColor: 'rgba(57, 255, 20, 0.05)', borderRadius: 32, borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db', padding: 48, alignItems: 'center' },
  ocrIcon: { marginBottom: 24 },
  ocrTitle: { fontSize: 20, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.4, marginBottom: 8, color: '#1a1c1c' },
  ocrDesc: { fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.6 },
  
  // Stats Card
  statsCard: { backgroundColor: '#1a1c1c', padding: 32, borderRadius: 32, justifyContent: 'space-between' },
  statsLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.6, opacity: 0.6, color: '#fff', marginBottom: 4, marginTop: 16 },
  statsValue: { fontSize: 36, fontWeight: '900', fontStyle: 'italic', color: '#fff' },
  statsBottom: { marginTop: 32 },
  confidenceWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  confidenceText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.6, opacity: 0.6, color: '#fff' },
  confidenceValue: { fontSize: 24, fontWeight: '900', color: '#39ff14' },
  confidenceBarBg: { height: 48, width: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 4, overflow: 'hidden' },
  confidenceBarFill: { height: '98%', width: '100%', backgroundColor: '#39ff14' },
  
  // Inventory Section
  inventoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 },
  inventoryTitle: { fontSize: 24, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.4, color: '#1a1c1c' },
  exportBtn: { paddingVertical: 8, paddingHorizontal: 24, backgroundColor: '#e5e7eb', borderRadius: 12 },
  exportBtnText: { color: '#000', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.6 },
  inventoryList: { gap: 16 },
  
  // Inventory Row
  inventoryRow: { flexDirection: 'row', alignItems: 'center', padding: 24, borderRadius: 16, backgroundColor: '#1a1c1c' },
  inventoryRowApproved: { backgroundColor: '#f3f4f6' },
  invColMain: { flex: 2 },
  invName: { fontWeight: '900', textTransform: 'uppercase', fontSize: 18, letterSpacing: -0.4, color: '#fff' },
  invCat: { fontSize: 10, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.4)', marginTop: 4 },
  textMuted: { color: '#9ca3af' },
  invColPrice: { flex: 1, textAlign: 'center', fontWeight: '700', color: 'rgba(255, 255, 255, 0.6)' },
  invColRec: { flex: 1, textAlign: 'center', fontWeight: '900', fontSize: 20, fontStyle: 'italic', color: '#39ff14' },
  invColAction: { flex: 1, alignItems: 'flex-end' },
  approvedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  approvedText: { color: '#9ca3af', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', fontStyle: 'italic' },
  approveBtn: { backgroundColor: '#39ff14', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 12 },
  approveBtnText: { color: '#000', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.6 },

  // --- Modal Styles ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: '#1a1c1c', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 15 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -0.4 },
  modalOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'rgba(57, 255, 20, 0.1)', padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(57, 255, 20, 0.2)' },
  modalOptionText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },

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