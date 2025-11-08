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
import { db, storage } from "@/config/firebase"; // ✅ use storage from config
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
    image: null as string | null, // will hold hosted URL
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔧 Upload image to Firebase Storage
  const handleImageUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const fileUri = asset.uri;

      try {
        // Convert local URI to blob
        const response = await fetch(fileUri);
        const blob = await response.blob();

        // Create a unique path in Storage
        const fileName = `events/${Date.now()}-${asset.fileName || "image"}.jpg`;
        const imageRef = ref(storage, fileName);

        // Upload blob
        await uploadBytes(imageRef, blob);

        // Get public download URL
        const downloadURL = await getDownloadURL(imageRef);

        // Save hosted URL in formData
        handleChange("image", downloadURL);
      } catch (err: any) {
        // Log full error payload for debugging
        console.error("Image upload failed:", JSON.stringify(err, null, 2));
      }
    }
  };

  // 🔧 Save event in Firestore
  const handleSubmit = async () => {
    if (
      !formData.title ||
      !formData.description ||
      !formData.date ||
      !formData.time ||
      !formData.location
    ) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, "events"), {
        ...formData,
        attendees: 0,
        platform: "Meetup",
        likes: 0,
        createdAt: serverTimestamp(),
      });
      setLoading(false);
      router.replace("/discover"); // redirect back
    } catch (err) {
      console.error("Error adding event:", err);
      setLoading(false);
    }
  };

  const availableTags = [
    "Tech",
    "Outdoors",
    "Art",
    "Food",
    "Music",
    "Networking",
    "Education",
    "Gaming",
    "Fitness",
  ];

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace("/discover")}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Meetup</Text>
        </View>

        {/* Image Upload */}
        <TouchableOpacity style={styles.imageButton} onPress={handleImageUpload}>
          <Icon name="image" size={20} color="#333" />
          <Text style={styles.radioLabel}>Upload Meetup Image</Text>
        </TouchableOpacity>

        {formData.image && (
          <>
            <Image source={{ uri: formData.image }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => handleChange("image", null)}
            >
              <Icon name="x-circle" size={18} color="#d00" style={{ marginRight: 6 }} />
              <Text style={styles.removeImageText}>Remove Image</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Title */}
        <TextInput
          style={styles.input}
          placeholder="Meetup Title"
          value={formData.title}
          onChangeText={(text) => handleChange("title", text)}
        />

        {/* Description */}
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          value={formData.description}
          onChangeText={(text) => handleChange("description", text)}
          multiline
        />

        {/* Date Picker */}
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text>{formData.date || "Select Date"}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={formData.date ? new Date(formData.date) : new Date()}
            mode="date"
            display="calendar"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                handleChange("date", selectedDate.toISOString().split("T")[0]);
              }
            }}
          />
        )}

        {/* Time Picker */}
        <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
          <Text>{formData.time || "Select Time"}</Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            display="spinner"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                const hours = selectedTime.getHours().toString().padStart(2, "0");
                const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
                handleChange("time", `${hours}:${minutes}`);
              }
            }}
          />
        )}

        {/* Location */}
        <TextInput
          style={styles.input}
          placeholder="Location"
          value={formData.location}
          onChangeText={(text) => handleChange("location", text)}
        />

        {/* Tags */}
        <Text style={styles.subtitle}>Select Tags</Text>
        <View style={styles.grid}>
          {availableTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tag, formData.tags.includes(tag) && styles.tagSelected]}
              onPress={() => {
                const updated = formData.tags.includes(tag)
                  ? formData.tags.filter((t) => t !== tag)
                  : [...formData.tags, tag];
                handleChange("tags", updated);
              }}
            >
              <Text
                style={[styles.tagText, formData.tags.includes(tag) && styles.tagTextSelected]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Visibility */}
        <View style={styles.radioGroup}>
          {["public", "private"].map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.radioOption}
              onPress={() => handleChange("visibility", option)}
            >
              <Icon
                name={formData.visibility === option ? "check-circle" : "circle"}
                size={20}
                color={formData.visibility === option ? "#4CAF50" : "#999"}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.radioLabel}>
                {option === "public" ? "Public" : "Private"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Submit */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          !formData.title ||
          !formData.description ||
          !formData.date ||
          !formData.time ||
          !formData.location ||
          loading
            ? styles.disabledButton
            : null,
        ]}
        onPress={handleSubmit}
        disabled={
          !formData.title ||
          !formData.description ||
          !formData.date ||
          !formData.time ||
          !formData.location ||
          loading
        }
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Next</Text>}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  backButton: { padding: 8 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 12,
    lineHeight: 28,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  radioGroup: { marginVertical: 12 },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  radioLabel: { fontSize: 16, color: "#333" },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 12,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  removeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  removeImageText: {
    color: "#d00",
    fontSize: 14,
  },
  submitButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  // ✅ Missing styles for tags and subtitles
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 24,
  },
  tag: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 6,
  },
  tagSelected: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  tagText: {
    color: "#333",
    fontSize: 14,
  },
  tagTextSelected: {
    color: "#fff",
  },
});
