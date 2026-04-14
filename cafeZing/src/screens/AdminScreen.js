import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Camera, BarChart3 } from 'lucide-react-native';
import { styles } from '../styles/theme';
import { FadeInView } from '../components/Animations';
import { InventoryRow } from '../components/UIComponents';

export default function AdminScreen() {
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