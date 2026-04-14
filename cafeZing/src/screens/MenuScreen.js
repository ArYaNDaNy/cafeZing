import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MapPin, Zap, ChevronRight } from 'lucide-react-native';
import { styles } from '../styles/theme';
import { FadeInView } from '../components/Animations';
import { FoodCard } from '../components/UIComponents';

export default function MenuScreen() {
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