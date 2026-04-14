import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { styles } from '../styles/theme';

export const FadeInView = ({ children, style, delay = 0, slideY = 0, slideX = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay: delay,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View style={[style, {
      opacity: anim,
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [slideY, 0] }) },
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [slideX, 0] }) }
      ]
    }]}>
      {children}
    </Animated.View>
  );
};

export const RadarRing = ({ delay, borderColor }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        })
      ])
    ).start();
  }, [anim, delay]);

  return (
    <Animated.View style={[styles.radarRing, { 
      borderColor,
      opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
      transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2] }) }]
    }]} />
  );
};

export const BouncingDot = ({ delay }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: -6, duration: 300, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
        Animated.delay(300)
      ])
    ).start();
  }, [anim, delay]);

  return <Animated.View style={[styles.dot, { transform: [{ translateY: anim }] }]} />;
};