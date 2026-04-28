import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal, ActivityIndicator, Image as RNImage, TextInput } from 'react-native';
import { Camera, BarChart3, CheckCircle2, X, Aperture, Image as ImageIcon, Upload, Plus, Trash2, Zap, Save } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { FadeInView } from '../components/Animations'; 

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.3:8000';
const API_URL = `${API_BASE}/api/menu/scan`;
const API_APPROVE_URL = `${API_BASE}/api/menu/approve`; 
const API_BATCH_APPROVE_URL = `${API_BASE}/api/menu/approve/batch`; 

export default function AdminScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);
  
  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraMode, setCameraMode] = useState('capture'); 
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [stagedPhotos, setStagedPhotos] = useState([]);
  const cameraRef = useRef(null);

  // Individual Approval State
  const [itemToApprove, setItemToApprove] = useState(null);
  const [customPrice, setCustomPrice] = useState("");

  // --- API CALLS ---
  const sendImagesToAI = async (base64Array) => {
    setIsProcessing(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true' // ADD HERE TOO
  },
        body: JSON.stringify({ images_base64: base64Array }),
      });

      const data = await response.json();
      if (response.ok) {
        const itemsArray = data.items ? data.items : data;
        setExtractedItems(prev => [...prev, ...itemsArray]); 
      } else {
        Alert.alert("Server Error", data.detail || "Something went wrong.");
      }
    } catch (error) {
      Alert.alert("Network Error", "Could not reach the backend.");
    } finally {
      setIsProcessing(false);
      setStagedPhotos([]); 
    }
  };

  const openApproveModal = (item, index) => {
    setItemToApprove({ ...item, originalIndex: index });
    setCustomPrice(item.price.toString());
  };

  const confirmIndividualApprove = async () => {
    if (!itemToApprove) return;
    
    const finalItem = { 
      ...itemToApprove, 
      final_price: parseFloat(customPrice) || 0 
    };

    // 1. Optimistic UI: Remove from list immediately
    const newItems = [...extractedItems];
    newItems.splice(itemToApprove.originalIndex, 1);
    setExtractedItems(newItems);
    setItemToApprove(null); 

    // 2. Send to backend as a "Batch of One"
    try {
      await fetch(API_BATCH_APPROVE_URL, {  // <--- CHANGED TO BATCH URL
        method: 'POST',
        headers: { 
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true' // ADD HERE TOO
  },
        body: JSON.stringify([finalItem]),  // <--- WRAPPED IN ARRAY BRACKETS
      });
    } catch (e) {
      console.error("Approve error", e);
    }
  };

  const handleBulkApprove = async (priceType) => {
    if (extractedItems.length === 0) return;

    const formattedItems = extractedItems.map(item => ({
      ...item,
      final_price: priceType === 'ai' ? item.ai_recommended_price : item.price
    }));

    setExtractedItems([]); // Clear staging area

    try {
      const response = await fetch(API_BATCH_APPROVE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedItems),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // --- NEW: Check if any images were missing! ---
        if (data.missing_images && data.missing_images.length > 0) {
          Alert.alert(
            "Partial Success", 
            `Saved to database! However, Unsplash images were not found for:\n\n${data.missing_images.join(', ')}\n\nThey have been saved with 'null'.`
          );
        } else {
          Alert.alert("Success", `Pushed ${formattedItems.length} items to database!`);
        }
      } else {
        Alert.alert("Error", "Failed to push to database.");
      }
      
    } catch (e) {
      console.error("Batch Approve Error", e);
    }
  };

  // --- CAMERA HANDLERS ---
  const handleOpenCamera = async () => {
    setIsModalVisible(false);
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) return Alert.alert("Permission Required", "Need camera access.");
    }
    setCameraMode('capture');
    setIsCameraActive(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true });
      setCurrentPhoto(photo);
      setCameraMode('preview');
    }
  };

  const handleRetake = () => {
    setCurrentPhoto(null);
    setCameraMode('capture');
  };

  const handleAddPage = () => {
    setStagedPhotos([...stagedPhotos, currentPhoto.base64]);
    setCurrentPhoto(null);
    setCameraMode('capture');
  };

  const handleFinishScan = () => {
    const allPhotos = [...stagedPhotos, currentPhoto.base64];
    setIsCameraActive(false);
    setCurrentPhoto(null);
    sendImagesToAI(allPhotos);
  };

  const handleOpenGallery = async () => {
    setIsModalVisible(false);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return Alert.alert("Permission Required", "Need gallery access.");

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      allowsMultipleSelection: true, 
      quality: 1,             
      base64: true,           
    });

    if (!result.canceled) {
      const base64Array = result.assets.map(asset => asset.base64);
      sendImagesToAI(base64Array);
    }
  };

  const clearAllItems = () => {
    Alert.alert("Clear All?", "Are you sure you want to clear the staging area?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => setExtractedItems([]) }
    ]);
  };

  const handleExportCSV = async () => {
    if (extractedItems.length === 0) return;
    try {
      let csvContent = "Name,Category,Original Price,AI Recommended Price\n";
      extractedItems.forEach(item => {
        const safeName = `"${(item.name || '').replace(/"/g, '""')}"`;
        const safeCat = `"${(item.category || '').replace(/"/g, '""')}"`;
        csvContent += `${safeName},${safeCat},${item.price},${item.ai_recommended_price}\n`;
      });
      const fileName = `CafeZing_Menu_${new Date().getTime()}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Menu Inventory' });
    } catch (error) {
      Alert.alert("Export Failed", "Could not generate the CSV file.");
    }
  };

  // --- NEW: INDIVIDUAL ITEM IMAGE HANDLERS ---
  
  const handlePickItemImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square images look best for food
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      setItemToApprove(prev => ({ 
        ...prev, 
        image_url: `data:image/jpeg;base64,${result.assets[0].base64}` 
      }));
    }
  };

  const handleTakeItemPhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return Alert.alert("Error", "Camera permission required");

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      setItemToApprove(prev => ({ 
        ...prev, 
        image_url: `data:image/jpeg;base64,${result.assets[0].base64}` 
      }));
    }
  };

  const totalItems = extractedItems.length;

  // --- CAMERA UI ---
  if (isCameraActive) {
    return (
      <View style={styles.cameraContainer}>
        {cameraMode === 'capture' ? (
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
                <View style={styles.stagedBadge}>
                  <Text style={styles.stagedBadgeText}>{stagedPhotos.length} Pages</Text>
                </View>
                <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
                  <View style={styles.captureBtnInner}><Aperture size={32} color="#1a1c1c" /></View>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        ) : (
          <View style={styles.previewContainer}>
            <RNImage source={{ uri: currentPhoto.uri }} style={styles.previewImage} resizeMode="contain" />
            <View style={styles.previewControls}>
              <TouchableOpacity style={styles.previewBtn} onPress={handleRetake}>
                <Text style={styles.previewBtnText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.previewBtn} onPress={handleAddPage}>
                <Plus size={20} color="#fff" />
                <Text style={styles.previewBtnText}>Add Page</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.previewBtn, styles.finishBtn]} onPress={handleFinishScan}>
                <CheckCircle2 size={20} color="#000" />
                <Text style={styles.finishBtnText}>Finish</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  // --- DASHBOARD UI ---
  return (
    <FadeInView slideY={-10} style={styles.screenWrapper}>
      
      {/* INDIVIDUAL APPROVAL MODAL */}
      <Modal visible={!!itemToApprove} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Pricing</Text>
              <TouchableOpacity onPress={() => setItemToApprove(null)}>
                <X size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            
            {itemToApprove && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* --- NEW: IMAGE PREVIEW & PICKER --- */}
                <View style={styles.itemImageContainer}>
                  {itemToApprove.image_url ? (
                    <RNImage source={{ uri: itemToApprove.image_url }} style={styles.itemImagePreview} />
                  ) : (
                    <View style={styles.itemImagePlaceholder}>
                      <ImageIcon size={32} color="#4b5563" />
                      <Text style={styles.placeholderText}>Auto-fetching from Unsplash...</Text>
                    </View>
                  )}
                  <View style={styles.imagePickerOverlay}>
                    <TouchableOpacity style={styles.miniPickerBtn} onPress={handleTakeItemPhoto}>
                      <Camera size={16} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.miniPickerBtn} onPress={handlePickItemImage}>
                      <ImageIcon size={16} color="#000" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.reviewItemName}>{itemToApprove.name}</Text>
                
                <View style={styles.quickSelectRow}>
                  <TouchableOpacity style={styles.quickSelectBtn} onPress={() => setCustomPrice(itemToApprove.price.toString())}>
                    <Text style={styles.quickSelectLabel}>Original</Text>
                    <Text style={styles.quickSelectPrice}>₹{itemToApprove.price}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.quickSelectBtn, styles.quickSelectBtnAI]} onPress={() => setCustomPrice(itemToApprove.ai_recommended_price.toString())}>
                    <Text style={[styles.quickSelectLabel, {color: '#000'}]}>AI Rec</Text>
                    <Text style={[styles.quickSelectPrice, {color: '#000'}]}>₹{itemToApprove.ai_recommended_price}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Final Price Override</Text>
                <TextInput style={styles.priceInput} value={customPrice} onChangeText={setCustomPrice} keyboardType="numeric" placeholder="0.00" placeholderTextColor="#6b7280" />
                
                <TouchableOpacity style={styles.confirmPushBtn} onPress={confirmIndividualApprove}>
                  <Save size={20} color="#000" style={{marginRight: 8}} />
                  <Text style={styles.confirmPushText}>Push to Database</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* UPLOAD SELECTION MODAL */}
      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Menu</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}><X size={24} color="#9ca3af" /></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.modalOptionBtn} onPress={handleOpenCamera}>
              <Camera size={24} color="#39ff14" />
              <Text style={styles.modalOptionText}>Scan Pages (Camera)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOptionBtn} onPress={handleOpenGallery}>
              <ImageIcon size={24} color="#39ff14" />
              <Text style={styles.modalOptionText}>Select Multiple (Gallery)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PROCESSING OVERLAY MODAL */}
      <Modal visible={isProcessing} transparent={true} animationType="fade">
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color="#39ff14" />
            <Text style={styles.processingTitle}>Analyzing Batch</Text>
            <Text style={styles.processingText}>Processing multiple pages through Groq AI.</Text>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.adminHeaderSection}>
          <Text style={styles.adminSubtitle}>Staging Area</Text>
          <Text style={styles.adminTitle}>Admin{'\n'}Dashboard</Text>
        </View>

        <TouchableOpacity style={styles.ocrUploadCard} onPress={() => setIsModalVisible(true)}>
          <View style={styles.ocrContent}>
            <Upload size={48} color="#d1d5db" style={styles.ocrIcon} />
            <Text style={styles.ocrTitle}>Scan Multi-Page Menu</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.inventoryHeader}>
          <Text style={styles.inventoryTitle}>Staged Items ({totalItems})</Text>
          {totalItems > 0 && (
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearAllItems}>
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV}>
                <Text style={styles.exportBtnText}>Export CSV</Text>
              </TouchableOpacity>
            </View>
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
                onApprove={() => openApproveModal(item, index)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Staging area clear. Upload a menu to begin.</Text>
            </View>
          )}
        </View>

        {totalItems > 0 && (
          <View style={styles.bulkActionBar}>
            <Text style={styles.bulkActionTitle}>Batch Operations</Text>
            <View style={styles.bulkActionRow}>
              <TouchableOpacity style={[styles.bulkBtn, styles.bulkBtnOriginal]} onPress={() => handleBulkApprove('original')}>
                <Text style={styles.bulkBtnText}>Push All (Original)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.bulkBtn, styles.bulkBtnAI]} onPress={() => handleBulkApprove('ai')}>
                <Zap size={16} color="#000" style={{marginRight: 6}} />
                <Text style={[styles.bulkBtnText, {color: '#000'}]}>Push All (AI Price)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </FadeInView>
  );
}

// --- ROW COMPONENT ---
function InventoryRow({ name, price, rec, cat, onApprove }) {
  return (
    <View style={styles.inventoryRow}>
      <View style={styles.invColMain}>
        <Text style={styles.invName} numberOfLines={2}>{name}</Text>
        <Text style={styles.invCat} numberOfLines={1}>{cat}</Text>
      </View>
      <View style={styles.pricingColumn}>
        <Text style={styles.pricingLabel}>Original</Text>
        <Text style={styles.invColPrice}>{price}</Text>
      </View>
      <View style={styles.pricingColumn}>
        <Text style={styles.pricingLabel}>AI Price</Text>
        <Text style={styles.invColRec}>{rec}</Text>
      </View>
      <View style={styles.invColAction}>
        <TouchableOpacity style={styles.approveBtn} onPress={onApprove}>
          <Text style={styles.approveBtnText}>Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- STYLESHEET ---
const styles = StyleSheet.create({
  screenWrapper: { paddingHorizontal: 16, alignSelf: 'center', width: '100%', maxWidth: 512, flex: 1,height: '100%' },
  scrollContent: { paddingBottom: 48, paddingTop: 20 },
  adminHeaderSection: { marginBottom: 32 },
  adminSubtitle: { fontSize: 10, fontWeight: '900', letterSpacing: 3.2, textTransform: 'uppercase', color: '#39ff14', marginBottom: 8 },
  adminTitle: { fontSize: 40, fontWeight: '900', lineHeight: 40, letterSpacing: -1.5, textTransform: 'uppercase', color: '#1a1c1c' },
  
  ocrUploadCard: { backgroundColor: 'rgba(57, 255, 20, 0.05)', borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db', padding: 32, alignItems: 'center', marginBottom: 32 },
  ocrIcon: { marginBottom: 16 },
  ocrTitle: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase', color: '#1a1c1c' },

  inventoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  inventoryTitle: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase', color: '#1a1c1c' },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  exportBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#1a1c1c', borderRadius: 8 },
  exportBtnText: { color: '#39ff14', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  clearBtn: { padding: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 },

  inventoryList: { gap: 12 },
  emptyState: { padding: 32, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 16 },
  emptyStateText: { textAlign: 'center', color: '#9ca3af', fontWeight: '600', lineHeight: 20 },
  
  inventoryRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: '#1a1c1c', gap: 8 },
  invColMain: { flex: 2, paddingRight: 8 },
  invName: { fontWeight: '900', textTransform: 'uppercase', fontSize: 14, color: '#fff' },
  invCat: { fontSize: 9, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)', marginTop: 4, fontWeight: '700' },
  pricingColumn: { alignItems: 'center', flex: 1 },
  pricingLabel: { fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: '900', marginBottom: 2 },
  invColPrice: { textAlign: 'center', fontWeight: '700', color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 },
  invColRec: { textAlign: 'center', fontWeight: '900', fontSize: 14, fontStyle: 'italic', color: '#39ff14' },
  invColAction: { flex: 1.2, alignItems: 'flex-end' },
  approveBtn: { backgroundColor: '#39ff14', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, width: '100%', alignItems: 'center' },
  approveBtnText: { color: '#000', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },

  // Modals & Overlays
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: '#1a1c1c', borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
  modalOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'rgba(57, 255, 20, 0.1)', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(57, 255, 20, 0.2)' },
  modalOptionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  processingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  processingCard: { backgroundColor: '#1a1c1c', padding: 32, borderRadius: 24, alignItems: 'center', width: '100%', maxWidth: 320 },
  processingTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 16, marginBottom: 8, textTransform: 'uppercase' },
  processingText: { color: '#9ca3af', textAlign: 'center', fontSize: 12, fontWeight: '600' },

  // Individual Approval Modal Specifics
  reviewItemName: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 20 },
  quickSelectRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickSelectBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  quickSelectBtnAI: { backgroundColor: '#39ff14', borderColor: '#39ff14' },
  quickSelectLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, textTransform: 'uppercase', fontWeight: '900', marginBottom: 4 },
  quickSelectPrice: { color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic' },
  inputLabel: { color: '#9ca3af', fontSize: 10, textTransform: 'uppercase', fontWeight: '900', marginBottom: 8 },
  priceInput: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 24, fontWeight: 'bold', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 24, textAlign: 'center' },
  confirmPushBtn: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  confirmPushText: { color: '#000', fontWeight: '900', textTransform: 'uppercase', fontSize: 14 },

  // Bulk Action Bar
  bulkActionBar: { marginTop: 40, padding: 24, backgroundColor: 'rgba(57, 255, 20, 0.05)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(57, 255, 20, 0.2)' },
  bulkActionTitle: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', color: '#39ff14', marginBottom: 16, textAlign: 'center', letterSpacing: 1.5 },
  bulkActionRow: { flexDirection: 'row', gap: 12 },
  bulkBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  bulkBtnOriginal: { backgroundColor: '#1a1c1c', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  bulkBtnAI: { backgroundColor: '#39ff14' },
  bulkBtnText: { color: '#fff', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Camera & Preview Overlays
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
  cameraControls: { alignItems: 'center', paddingBottom: 40, flexDirection: 'row', justifyContent: 'center' },
  stagedBadge: { position: 'absolute', left: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 8 },
  stagedBadgeText: { color: '#fff', fontWeight: 'bold' },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#39ff14', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(57, 255, 20, 0.3)' },
  captureBtnInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#39ff14', justifyContent: 'center', alignItems: 'center' },
  previewContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  previewImage: { flex: 1, width: '100%' },
  previewControls: { flexDirection: 'row', justifyContent: 'space-around', padding: 30, backgroundColor: '#1a1c1c' },
  previewBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
  previewBtnText: { color: '#fff', fontWeight: '700' },
  finishBtn: { backgroundColor: '#39ff14' },
  finishBtnText: { color: '#000', fontWeight: '900' },
  // Add these to your styles object
  itemImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  itemImagePreview: {
    width: '100%',
    height: '100%',
  },
  itemImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#4b5563',
    fontSize: 10,
    marginTop: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  imagePickerOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  miniPickerBtn: {
    backgroundColor: '#39ff14',
    padding: 10,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#39ff14',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  }
});