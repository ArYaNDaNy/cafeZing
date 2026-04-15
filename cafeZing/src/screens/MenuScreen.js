import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MapPin, Zap, ChevronRight } from 'lucide-react-native';
import { styles } from '../styles/theme';
import { FadeInView } from '../components/Animations';
import { FoodCard } from '../components/UIComponents';

const BACKEND_URL = 'http://192.168.29.121:8000'; 

export default function MenuScreen() {
  const [menuItems, setMenuItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async() => {
    try{
      const response = await fetch(`${BACKEND_URL}/api/menu/`)

      if(!response.ok)
      {
        throw new Error('Failed to fetch menu')
      }

      const data = await response.json()
      setMenuItems(data)
    }
    catch (error) 
    {
      console.error("Menu Fetch Error:", error);
      Alert.alert("Error", "Could not load the canteen menu.");
    } 
    finally 
    {
      setIsLoading(false);
    }
  }

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
          {isLoading ? (
            <ActivityIndicator size="large" color="#39ff14" style={{ marginTop: 50 }} />
          ) : (
            menuItems.map((item) => (
              <FoodCard 
                key={item.item_id}
                name={item.name}
                price={item.price.toString()} 
                oldPrice={item.old_price ? item.old_price.toString() : null}
                desc={item.description}
                img={item.image_url}    // Mapping backend key to your frontend prop
                fast={item.is_fast_selling} // Mapping backend key to your frontend prop
              />
            ))
          )}
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