import { useRouter } from "expo-router";
import { useState } from "react";
import "react-native-get-random-values";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, storage } from "@/config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { colors, spacing } from "@/styles/theme";

export default function CreateMeetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    tags: [] as string[],
    visibility: "public",
    image: null as string | null,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleChange = (name: string, value: any) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const handleImageUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets.length) return;

    const asset = result.assets[0];
    const blob = await (await fetch(asset.uri)).blob();
    const fileRef = ref(storage, `events/${Date.now()}-${asset.fileName || "image"}`);
    await uploadBytes(fileRef, blob);
    const url = await getDownloadURL(fileRef);
    handleChange("image", url);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.date || !formData.time || !formData.location) {
      alert("Please fill all required fields.");
      return;
    }

    setLoading(true);
    await addDoc(collection(db, "events"), {
      ...formData,
      attendees: 0,
      likes: 0,
      createdAt: serverTimestamp(),
    });
    setLoading(false);
    router.replace("/discover");
  };

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const tags = ["Tech", "Outdoors", "Art", "Food", "Music", "Networking", "Education", "Gaming", "Fitness"];

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace("/discover")} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Meetup</Text>
        </View>

        <TouchableOpacity style={styles.imageButton} onPress={handleImageUpload}>
          <Icon name="image" size={20} color={colors.primary} />
          <Text style={styles.uploadText}>Upload Meetup Image</Text>
        </TouchableOpacity>

        {formData.image && (
          <>
            <Image source={{ uri: formData.image }} style={styles.previewImage} />
            <TouchableOpacity onPress={() => handleChange("image", null)} style={styles.removeImageButton}>
              <Icon name="x-circle" size={18} color="#d00" />
              <Text style={styles.removeImageText}>Remove Image</Text>
            </TouchableOpacity>
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder="Meetup Title"
          placeholderTextColor={colors.placeholder}
          value={formData.title}
          onChangeText={(t) => handleChange("title", t)}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          placeholderTextColor={colors.placeholder}
          value={formData.description}
          onChangeText={(t) => handleChange("description", t)}
          multiline
        />

        {/* Date */}
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={formData.date ? styles.inputText : styles.placeholderText}>
            {formData.date || "Select Date"}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={formData.date ? new Date(formData.date) : new Date()}
            mode="date"
            display="inline"
            onChange={(e, date) => {
              setShowDatePicker(false);
              if (date) handleChange("date", date.toISOString().split("T")[0]);
            }}
          />
        )}

        {/* Time */}
        <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
          <Text style={formData.time ? styles.inputText : styles.placeholderText}>
            {formData.time || "Select Time"}
          </Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            display="spinner"
            onChange={(e, date) => {
              setShowTimePicker(false);
              if (date) handleChange("time", formatTime(date));
            }}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Location"
          placeholderTextColor={colors.placeholder}
          value={formData.location}
          onChangeText={(t) => handleChange("location", t)}
        />

        <Text style={styles.subtitle}>Tags</Text>
        <View style={styles.grid}>
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tag, formData.tags.includes(tag) && styles.tagSelected]}
              onPress={() =>
                handleChange("tags",
                  formData.tags.includes(tag)
                    ? formData.tags.filter((t) => t !== tag)
                    : [...formData.tags, tag]
                )
              }
            >
              <Text style={[styles.tagText, formData.tags.includes(tag) && styles.tagTextSelected]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.radioGroup}>
          {["public", "private"].map((option) => (
            <TouchableOpacity key={option} style={styles.radioOption} onPress={() => handleChange("visibility", option)}>
              <Icon
                name={formData.visibility === option ? "check-circle" : "circle"}
                size={20}
                color={formData.visibility === option ? colors.primary : "#bbb"}
              />
              <Text style={styles.radioLabel}>{option === "public" ? "Public" : "Private"}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={[styles.submitButton, loading && styles.disabledButton]} disabled={loading} onPress={handleSubmit}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Publish Meetup</Text>}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.screen, paddingBottom: 120 },

  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 24, fontWeight: "bold", marginLeft: 12 },

  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
    borderRadius: spacing.radius,
    padding: 12,
    marginBottom: spacing.fieldGap,
  },
  textArea: { height: 100, textAlignVertical: "top" },

  placeholderText: { color: colors.placeholder },
  inputText: { color: colors.inputText },

  imageButton: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  uploadText: { marginLeft: 8, color: colors.primary, fontWeight: "600" },

  previewImage: { width: "100%", height: 200, borderRadius: spacing.radius, marginBottom: 8 },
  removeImageButton: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  removeImageText: { marginLeft: 6, color: "#d00" },

  subtitle: { fontSize: 18, fontWeight: "600", marginVertical: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },

  tag: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderColor: colors.inputBorder,
    backgroundColor: "#fff",
    margin: 6,
  },
  tagSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  tagText: { color: "#333" },
  tagTextSelected: { color: colors.primary },

  radioGroup: { marginTop: 8 },
  radioOption: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  radioLabel: { marginLeft: 8, fontSize: 16, color: colors.inputText },

  submitButton: { position: "absolute", bottom: 20, left: 20, right: 20, backgroundColor: colors.primary, padding: 14, borderRadius: spacing.radius, alignItems: "center" },
  disabledButton: { backgroundColor: "#9cc5ff" },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
