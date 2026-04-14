import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { CheckCircle2, Flame, Plus } from 'lucide-react-native';
import { styles } from '../styles/theme';

export function NavButton({ active, onClick, icon, label }) {
  return (
    <TouchableOpacity onPress={onClick} style={[styles.navBtn, active && styles.navBtnActive]}>
      {icon}
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ProgressStep({ icon, label, sub, active }) {
  return (
    <View style={styles.progressStep}>
      <View style={[styles.stepCircle, active && styles.stepCircleActive]}>{icon}</View>
      <View style={styles.stepTextContainer}>
        <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
        <Text style={styles.stepSub}>{sub}</Text>
      </View>
    </View>
  );
}

export function InventoryRow({ name, price, rec, cat, approved }) {
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

export function FoodCard({ name, price, oldPrice, desc, img, fast }) {
  return (
    <View style={styles.foodCard}>
      <View style={styles.foodImgContainer}>
        {fast && (
          <View style={styles.fastBadgeWrapper}>
            <View style={styles.fastBadge}>
              <Flame size={12} color="#000" fill="#000" />
              <Text style={styles.fastBadgeText}>SELLING FAST</Text>
            </View>
          </View>
        )}
        <Image source={{ uri: img }} style={styles.foodImg} />
      </View>
      <View style={styles.foodInfo}>
        <View style={styles.foodHeader}>
          <Text style={styles.foodName}>{name}</Text>
          <View style={styles.foodPricing}>
            <Text style={styles.foodPrice}>₹{price}</Text>
            <Text style={styles.foodOldPrice}>₹{oldPrice}</Text>
          </View>
        </View>
        <Text style={styles.foodDesc}>{desc}</Text>
        <TouchableOpacity style={styles.addToTrayBtn}>
          <Text style={styles.addToTrayText}>ADD TO TRAY</Text>
          <Plus size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}