import React from 'react';
import { View, Text } from 'react-native';
import { Zap, CheckCircle2 } from 'lucide-react-native';
import { styles } from '../styles/theme';
import { FadeInView, RadarRing, BouncingDot } from '../components/Animations';

export default function ScanScreen() {
  return (
    <FadeInView slideY={20} style={styles.scanScreen}>
      <Text style={styles.heroTitle}>Grab a{'\n'}Bite.</Text>

      <View style={styles.radarWrapper}>
        <View style={styles.radarGlow} />
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
      </View>

      <View style={styles.offlineNotice}>
        <CheckCircle2 size={12} color="#9ca3af" />
        <Text style={styles.offlineText}>Works offline. No internet required for scanning.</Text>
      </View>
    </FadeInView>
  );
}