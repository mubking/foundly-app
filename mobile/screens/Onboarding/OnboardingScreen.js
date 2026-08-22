import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

import images from "../../constants/images";
import GlassIconBadge from "../../components/common/GlassIconBadge";
import GlassButton from "../../components/common/GlassButton";
import ProgressDots from "../../components/common/ProgressDots";
import ArrowRightIcon from "../../components/common/ArrowRightIcon";
import Button from "../../components/Button/Button";

const SLIDES = [
  {
    image: images.onboarding[0],
    emoji: "🔍",
    title: "Lost something?",
    body: "Report your item in under 60 seconds. Our AI suggests descriptions and connects you with the community nearby.",
  },
  {
    image: images.onboarding[1],
    emoji: "🤲",
    title: "Found something?",
    body: "Upload what you found in seconds. Help reunite people with what matters most — passports, keys, phones, pets.",
  },
  {
    image: images.onboarding[2],
    emoji: "⭐",
    title: "Earn & be trusted",
    body: "Build your trust score with every return. Earn rewards, community badges, and become a Reunio Hero.",
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const [slide, setSlide] = useState(0);
  const imageFade = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  useEffect(() => {
    imageFade.setValue(0);
    contentFade.setValue(0);
    Animated.timing(imageFade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    Animated.timing(contentFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [slide, imageFade, contentFade]);

  const goToLogin = () => navigation.navigate("Login");
  const handleContinue = () => (isLast ? goToLogin() : setSlide((s) => s + 1));

  return (
    <View style={styles.container}>
      <Animated.Image
        key={slide}
        source={current.image}
        style={[StyleSheet.absoluteFill, { opacity: imageFade }]}
        resizeMode="cover"
      />

      <LinearGradient
        colors={["rgba(10,15,30,0.98)", "rgba(10,15,30,0.7)", "rgba(10,15,30,0.2)"]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      <GlassButton style={styles.skipButton} textStyle={styles.skipText} onPress={goToLogin}>
        Skip
      </GlassButton>

      <View style={styles.content}>
        <Animated.View style={{ opacity: contentFade }}>
          <GlassIconBadge
            size={56}
            radius={16}
            intensity={20}
            backgroundColor="rgba(255,255,255,0.1)"
            borderColor="rgba(255,255,255,0.15)"
          >
            <Text style={styles.emoji}>{current.emoji}</Text>
          </GlassIconBadge>

          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>
        </Animated.View>

        <ProgressDots count={SLIDES.length} activeIndex={slide} style={styles.progress} />

        <View style={styles.actions}>
          {!isLast ? (
            <Button
              fullWidth
              onPress={handleContinue}
              iconRight={<ArrowRightIcon size={18} color="#fff" />}
            >
              Continue
            </Button>
          ) : (
            <>
              <Button onPress={goToLogin} style={styles.getStartedButton}>
                Get Started
              </Button>
              <GlassButton style={styles.signInButton} textStyle={styles.signInText} onPress={goToLogin}>
                Sign in
              </GlassButton>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0F1E",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  skipButton: {
    position: "absolute",
    top: 56,
    right: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  skipText: {
    fontSize: 12,
  },
  content: {
    paddingHorizontal: 28,
    paddingBottom: 48,
  },
  emoji: {
    fontSize: 30,
  },
  title: {
    marginTop: 20,
    marginBottom: 12,
    fontSize: 30,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.8,
    lineHeight: 33,
  },
  body: {
    marginBottom: 24,
    fontSize: 15,
    fontWeight: "400",
    color: "rgba(255,255,255,0.6)",
    lineHeight: 25,
  },
  progress: {
    marginBottom: 28,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  getStartedButton: {},
  signInButton: {
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  signInText: {
    fontSize: 14,
  },
});

