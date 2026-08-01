import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import colors from "../../constants/colors";
import { CATEGORIES } from "../../constants/homeMockData";

import Header from "../../components/Header/Header";
import PhotoSourceButton from "../../components/common/PhotoSourceButton";
import CameraIcon from "../../components/common/CameraIcon";
import ImageIcon from "../../components/common/ImageIcon";
import AIScannerCard from "../../components/common/AIScannerCard";
import Input from "../../components/Input/Input";
import CategoryGrid from "../../components/common/CategoryGrid";
import MapPinIcon from "../../components/common/MapPinIcon";
import CalendarIcon from "../../components/common/CalendarIcon";
import PackageIcon from "../../components/common/PackageIcon";
import UploadIcon from "../../components/common/UploadIcon";
import Button from "../../components/Button/Button";

export default function ReportFoundScreen() {
  const navigation = useNavigation();
  const [aiDone, setAiDone] = useState(false);
  const [category, setCategory] = useState("Electronics");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [description, setDescription] = useState("");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Upload Found Item" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.photoRow}>
          <PhotoSourceButton icon={<CameraIcon size={24} color="#fff" />} label="Take Photo" variant="gradient" />
          <PhotoSourceButton
            icon={<ImageIcon size={24} color={colors.textLight} />}
            label="From Gallery"
            variant="dashed"
          />
        </View>

        <AIScannerCard
          scanned={aiDone}
          onScan={() => setAiDone(true)}
          detectedTitle="Detected: iPhone 15 Pro · Space Black"
          detectedSubtitle="Electronics · Confidence 94% · Serial detected"
        />

        <Input
          label="Item Title"
          placeholder={aiDone ? "iPhone 15 Pro" : "What did you find?"}
          value={title}
          onChangeText={setTitle}
        />

        <View>
          <Text style={styles.sectionLabel}>Category</Text>
          <CategoryGrid categories={CATEGORIES} selected={category} onSelect={setCategory} />
        </View>

        <Input
          label="Found at Location"
          placeholder="Where exactly did you find it?"
          value={location}
          onChangeText={setLocation}
          icon={<MapPinIcon size={17} color={colors.textLight} />}
        />

        <View style={styles.row}>
          <Input
            label="Date Found"
            placeholder="Jul 28, 2025"
            icon={<CalendarIcon size={17} color={colors.textLight} />}
            style={styles.rowItem}
          />
          <Input
            label="Storage Location"
            placeholder="e.g. Police station"
            value={storageLocation}
            onChangeText={setStorageLocation}
            icon={<PackageIcon size={17} color={colors.textLight} />}
            style={styles.rowItem}
          />
        </View>

        <Input
          label="Description"
          placeholder="Describe any unique identifying marks…"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Button
          variant="green"
          fullWidth
          icon={<UploadIcon size={18} color="#fff" />}
          onPress={() => navigation.navigate("Home")}
        >
          Publish Found Item
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 20,
  },
  photoRow: {
    flexDirection: "row",
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textLight,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
});
