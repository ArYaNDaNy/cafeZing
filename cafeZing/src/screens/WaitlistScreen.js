import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { CheckCircle2, UtensilsCrossed, Bell } from 'lucide-react-native';
import { styles } from '../styles/theme';
import { FadeInView } from '../components/Animations';
import { ProgressStep } from '../components/UIComponents';

export default function WaitlistScreen() {
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