import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";
import { auth, db } from "@/config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function Onboarding() {
  const router = useRouter();
  const uid = auth.currentUser?.uid;

  const [profile, setProfile] = useState<any>({
    name: "",
    bio: "",
    location: "",
    age: "",
    gender: "",
    avatar: "",
    interests: [],
  });

  // Load existing profile if it exists
  useEffect(() => {
    const loadProfile = async () => {
      if (!uid) return;
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          name: data.name || "",
          bio: data.bio || "",
          location: data.location || "",
          age: data.age ? String(data.age) : "",
          gender: data.gender || "",
          avatar: data.avatar || "",
          interests: data.interests || [],
        });
      }
    };
    loadProfile();
  }, [uid]);

  const interests = [
    "Tech","Outdoors","Art","Food","Activism","Music",
    "Fitness","Gaming","Spirituality","Networking","Education","Volunteering",
  ];

  const toggleInterest = (interest: string) => {
    setProfile((prev: any) => {
      const selected = prev.interests.includes(interest)
        ? prev.interests.filter((i: string) => i !== interest)
        : prev.interests.length < 5
        ? [...prev.interests, interest]
        : prev.interests;
      return { ...prev, interests: selected };
    });
  };

  const handleImageUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setProfile({ ...profile, avatar: result.assets[0].uri });
    }
  };

  const handleContinue = async () => {
    if (!profile.name || !profile.location || !profile.age || profile.interests.length < 3) {
      Alert.alert("Missing info", "Fill required fields and select at least 3 interests");
      return;
    }
    try {
      if (!uid) return;
      await updateDoc(doc(db, "users", uid), {
        ...profile,
        age: Number(profile.age),
        onboardingComplete: true,
      });
      router.replace("/discover");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not save profile");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <Text style={styles.title}>Complete Your Profile</Text>

      <View style={styles.avatarContainer}>
        {profile.avatar ? (
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
        ) : null}
        <TouchableOpacity onPress={handleImageUpload} style={styles.changePhotoButton}>
          <Icon name="image" size={20} color="#333" />
          <Text style={styles.changePhotoText}>Upload Profile Photo</Text>
        </TouchableOpacity>
      </View>

      <Field label="Name" value={profile.name} onChangeText={(t: string) => setProfile({ ...profile, name: t })} />
      <Field label="Bio" value={profile.bio} onChangeText={(t: string) => setProfile({ ...profile, bio: t })} multiline />
      <Field label="Location" value={profile.location} onChangeText={(t: string) => setProfile({ ...profile, location: t })} />
      <Field label="Age" value={profile.age} onChangeText={(t: string) => setProfile({ ...profile, age: t })} keyboardType="numeric" />
      <Field label="Gender" value={profile.gender} onChangeText={(t: string) => setProfile({ ...profile, gender: t })} />

      <Text style={styles.subtitle}>Choose 3–5 Interests</Text>
      <View style={styles.grid}>
        {interests.map((interest) => (
          <TouchableOpacity
            key={interest}
            style={[styles.tag, profile.interests.includes(interest) && styles.tagSelected]}
            onPress={() => toggleInterest(interest)}
          >
            <Text style={[styles.tagText, profile.interests.includes(interest) && styles.tagTextSelected]}>
              {interest}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, (!profile.name || !profile.location || !profile.age || profile.interests.length < 3) && styles.disabledButton]}
        onPress={handleContinue}
        disabled={!profile.name || !profile.location || !profile.age || profile.interests.length < 3}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
}

const Field = ({ label, value, onChangeText, multiline = false, keyboardType = "default" }: FieldProps) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      style={[styles.input, multiline && { height: 80 }]}
      multiline={multiline}
      keyboardType={keyboardType}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  avatarContainer: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  changePhotoButton: { marginTop: 10, flexDirection: "row", alignItems: "center" },
  changePhotoText: { marginLeft: 8, color: "#3b82f6", fontWeight: "600" },
  field: { marginBottom: 16 },
  label: { fontWeight: "600", marginBottom: 6, color: "#444" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: "#fafafa" },
  subtitle: { fontSize: 18, fontWeight: "600", marginVertical: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginBottom: 24 },
  tag: { borderWidth: 1, borderColor: "#ccc", borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, margin: 6 },
  tagSelected: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  tagText: { color: "#333", fontSize: 14 },
  tagTextSelected: { color: "#fff" },
  button: { backgroundColor: "#4CAF50", padding: 14, borderRadius: 8, alignItems: "center", width: "100%" },
  disabledButton: { backgroundColor: "#ccc" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
