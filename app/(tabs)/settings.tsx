import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";
import { auth, db, storage } from "@/config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import { SmartImage } from "@/components/ui/smart-image";
import { GenderSelect } from "@/components/ui/gender-select";
import { colors, spacing } from "@/styles/theme";
import { getImageUploadErrorMessage, uploadPickedImage } from "@/utils/upload-image";

type Profile = {
  name: string;
  bio: string;
  location: string;
  age: string | number;
  gender: string;
  avatar: string;
  interests: string[];
  onboardingComplete?: boolean;
};

const interests = [
  "Tech",
  "Outdoors",
  "Art",
  "Food",
  "Activism",
  "Music",
  "Fitness",
  "Gaming",
  "Spirituality",
  "Networking",
  "Education",
  "Volunteering",
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const uid = auth.currentUser?.uid;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [saving, setSaving] = useState(false);

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
          onboardingComplete: data.onboardingComplete || false,
        });
      } else {
        setProfile({
          name: "",
          bio: "",
          location: "",
          age: "",
          gender: "",
          avatar: "",
          interests: [],
          onboardingComplete: false,
        });
      }
    };

    loadProfile();
  }, [uid]);

  const updateProfile = (patch: Partial<Profile>) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const toggleInterest = (interest: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const selected = prev.interests.includes(interest)
        ? prev.interests.filter((item) => item !== interest)
        : prev.interests.length < 5
          ? [...prev.interests, interest]
          : prev.interests;

      return { ...prev, interests: selected };
    });
  };

  const handleImageUpload = async () => {
    if (!uid || !profile) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });

    if (result.canceled || result.assets.length === 0) return;

    try {
      setUploadingAvatar(true);
      const asset = result.assets[0];
      const avatarUrl = await uploadPickedImage({
        storage,
        asset,
        pathPrefix: `users/${uid}/avatar`,
        fallbackName: "profile.jpg",
      });
      await updateDoc(doc(db, "users", uid), { avatar: avatarUrl });
      setUploadError("");
      updateProfile({ avatar: avatarUrl });
    } catch (error) {
      console.error("Profile image upload error:", error);
      const message = getImageUploadErrorMessage(error);
      setUploadError(message);
      Alert.alert("Upload failed", message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!uid || !profile) return;

    const age = Number(profile.age);
    if (!profile.name || !profile.location || !profile.age || profile.interests.length < 3) {
      Alert.alert("Missing info", "Fill required fields and select at least 3 interests.");
      return;
    }

    if (!Number.isInteger(age) || age < 18) {
      Alert.alert("Age requirement", "Enter a valid age of 18 or older.");
      return;
    }

    try {
      setSaving(true);
      await updateDoc(doc(db, "users", uid), {
        ...profile,
        age,
        onboardingComplete: true,
      });

      if (profile.onboardingComplete) {
        Alert.alert("Profile Updated", "Your changes have been saved.");
        router.replace("/profile");
      } else {
        router.replace("/discover");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  const saveDisabled =
    saving ||
    uploadingAvatar ||
    !profile.name ||
    !profile.location ||
    !profile.age ||
    profile.interests.length < 3;

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 40,
        },
      ]}
    >
      <Text style={styles.title}>
        {profile.onboardingComplete ? "Edit Profile" : "Complete Your Profile"}
      </Text>

      <View style={styles.avatarContainer}>
        {profile.avatar ? (
          <SmartImage uri={profile.avatar} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Icon name="user" size={42} color="#9CA3AF" />
          </View>
        )}
        <TouchableOpacity
          onPress={handleImageUpload}
          style={styles.changePhotoButton}
          disabled={uploadingAvatar}
        >
          <Icon name="image" size={20} color={colors.primary} />
          <Text style={styles.changePhotoText}>
            {uploadingAvatar ? "Uploading..." : "Upload Profile Photo"}
          </Text>
        </TouchableOpacity>
        {uploadError ? <Text style={styles.errorText}>{uploadError}</Text> : null}
      </View>

      <Field label="Name" value={profile.name} onChangeText={(name) => updateProfile({ name })} />
      <Field label="Bio" value={profile.bio} onChangeText={(bio) => updateProfile({ bio })} multiline />
      <Field
        label="Location"
        value={profile.location}
        onChangeText={(location) => updateProfile({ location })}
      />
      <Field
        label="Age"
        value={String(profile.age)}
        onChangeText={(age) => updateProfile({ age })}
        keyboardType="numeric"
      />
      <GenderSelect
        value={profile.gender}
        onChange={(gender) => updateProfile({ gender })}
      />

      <Text style={styles.subtitle}>Choose 3-5 Interests</Text>
      <View style={styles.grid}>
        {interests.map((interest) => {
          const selected = profile.interests.includes(interest);
          return (
            <TouchableOpacity
              key={interest}
              style={[styles.tag, selected && styles.tagSelected]}
              onPress={() => toggleInterest(interest)}
            >
              <Icon
                name={selected ? "check-square" : "square"}
                size={16}
                color={selected ? "#fff" : colors.placeholder}
              />
              <Text style={[styles.tagText, selected && styles.tagTextSelected]}>
                {interest}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saveDisabled && styles.disabledButton]}
        onPress={handleSave}
        disabled={saveDisabled}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>
            {profile.onboardingComplete ? "Save Changes" : "Continue"}
          </Text>
        )}
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

const Field = ({
  label,
  value,
  onChangeText,
  multiline = false,
  keyboardType = "default",
}: FieldProps) => (
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
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: colors.inputText,
  },
  avatarContainer: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.inputBackground,
  },
  changePhotoButton: { marginTop: 10, flexDirection: "row", alignItems: "center" },
  changePhotoText: { marginLeft: 8, color: colors.primary, fontWeight: "600" },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    textAlign: "center",
  },
  field: { marginBottom: 16 },
  label: { fontWeight: "600", marginBottom: 6, color: colors.inputText },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: spacing.radius,
    padding: 10,
    fontSize: 16,
    backgroundColor: colors.inputBackground,
    color: colors.inputText,
  },
  subtitle: { fontSize: 18, fontWeight: "700", marginVertical: 12, color: colors.inputText },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 24,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    margin: 6,
  },
  tagSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  tagText: { color: colors.inputText, fontSize: 14 },
  tagTextSelected: { color: "#fff" },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: spacing.radius,
    paddingVertical: 12,
    marginTop: 5,
    alignItems: "center",
  },
  disabledButton: { backgroundColor: colors.inputBorder },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
