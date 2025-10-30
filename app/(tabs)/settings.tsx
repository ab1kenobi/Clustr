import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useUser } from "../../context/UserContext"; // ✅ import shared context

export default function SettingsScreen() {
  const { user, setUser } = useUser();

  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [location, setLocation] = useState(user.location);
  const [age, setAge] = useState(user.age.toString());
  const [gender, setGender] = useState(user.gender);
  const [avatar, setAvatar] = useState(user.avatar);

  const handleSave = () => {
    setUser({
      ...user,
      name,
      bio,
      location,
      age: Number(age),
      gender,
      avatar,
    });
    Alert.alert("✅ Profile Updated", "Your changes have been saved!");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <Text style={styles.title}>Edit Profile</Text>

      <View style={styles.avatarContainer}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <TouchableOpacity
          onPress={() => Alert.alert("Change Photo", "We'll hook this up soon!")}
          style={styles.changePhotoButton}
        >
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>
      </View>

      <Field label="Name" value={name} onChangeText={setName} />
      <Field label="Bio" value={bio} onChangeText={setBio} multiline />
      <Field label="Location" value={location} onChangeText={setLocation} />
      <Field label="Age" value={age} onChangeText={setAge} keyboardType="numeric" />
      <Field label="Gender" value={gender} onChangeText={setGender} />

      <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.saveText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const Field = ({
  label,
  value,
  onChangeText,
  multiline = false,
  keyboardType = "default",
}: any) => (
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
  changePhotoButton: { marginTop: 10 },
  changePhotoText: { color: "#3b82f6", fontWeight: "600" },
  field: { marginBottom: 16 },
  label: { fontWeight: "600", marginBottom: 6, color: "#444" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  saveButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 20,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
