import React, { useEffect, useRef } from "react";
import { View, Text, Image, StyleSheet, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import DecorativeOrbs from "../../components/common/DecorativeOrbs";
import LoadingDots from "../../components/Loading/LoadingDots";

const ORBS = [
  { size: 320, color: "rgba(255,255,255,0.06)", top: -60, right: -80 },
  { size: 240, color: "rgba(139,92,246,0.2)", bottom: 80, left: -60 },
  { size: 160, color: "rgba(255,255,255,0.04)", top: "35%", right: -20 },
];

export default function SplashScreen() {
  const colors = useTheme();
  const navigation = useNavigation();
  const { restoreSession } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 280,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
    ]).start();

    let cancelled = false;

    const bootstrap = async () => {
      try {
        const [restoredUser] = await Promise.all([
          restoreSession(),
          new Promise((resolve) => setTimeout(resolve, 2400)),
        ]);

        if (cancelled) return;
        navigation.replace(restoredUser ? "Home" : "Onboarding");
      } catch {
        // restoreSession() already resolves rather than throwing, but if
        // something upstream still does, don't strand the user on Splash.
        if (!cancelled) navigation.replace("Onboarding");
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [fadeAnim, translateAnim, navigation, restoreSession]);

  return (
    <LinearGradient
      colors={[colors.primaryDeep, colors.primary, colors.primaryLight, colors.primaryLighter]}
      locations={[0, 0.45, 0.75, 1]}
      start={{ x: 0.32, y: 0.02 }}
      end={{ x: 0.68, y: 0.98 }}
      style={styles.container}
    >
      <DecorativeOrbs orbs={ORBS} />

      <Animated.View
        style={[
          styles.wordmark,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateAnim }],
          },
        ]}
      >
        <Image
          source={require("../../assets/splash-icon.png")}
          style={styles.mark}
          resizeMode="contain"
          accessibilityLabel="Reunio logo"
        />

        <View style={styles.textBlock}>
          <Text style={styles.title}>Reunio</Text>
          <Text style={styles.subtitle}>Find. Return. Reunite.</Text>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <LoadingDots count={4} activeIndex={1} opacities={[0.35, 1, 0.55, 0.25]} />
        <Text style={styles.footerText}>Community-powered since 2024</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    paddingBottom: 60,
  },
  wordmark: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  mark: {
    width: 88,
    height: 88,
  },
  textBlock: {
    alignItems: "center",
  },
  title: {
    fontSize: 44,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1.5,
    lineHeight: 46,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 0.3,
    marginTop: 10,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    gap: 16,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.45)",
  },
});
