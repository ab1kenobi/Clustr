import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import "react-native-get-random-values";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, storage, auth } from "@/config/firebase";
import {
  buildLocationLabel,
  findCampusLocation,
  searchCampusLocations,
  type CampusLocation,
} from "@/constants/campus";
import { colors, spacing } from "@/styles/theme";
import { SmartImage } from "@/components/ui/smart-image";
import { ensureUicCampusAccess } from "@/utils/campus-access";
import { getImageUploadErrorMessage, uploadPickedImage } from "@/utils/upload-image";

type EventFormState = {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  locationId: string;
  locationRoom: string;
  tags: string[];
  visibility: "campus";
  capacity: string;
  image: string | null;
};

const initialFormState: EventFormState = {
  title: "",
  description: "",
  date: "",
  time: "",
  location: "",
  locationId: "",
  locationRoom: "",
  tags: [],
  visibility: "campus",
  capacity: "",
  image: null,
};

const TAGS = [
  "Tech",
  "Outdoors",
  "Art",
  "Food",
  "Music",
  "Networking",
  "Education",
  "Gaming",
  "Fitness",
  "Medical",
  "Club",
  "Workshop",
];

function parseEventDateTime(dateStr: string, timeStr: string) {
  try {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const eventDate = parseDateOnly(dateStr);
    eventDate.setHours(hours, minutes, 0, 0);
    return eventDate;
  } catch {
    return null;
  }
}

function parseDateOnly(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function formatDateOnlyValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseTimeToDate(timeStr: string) {
  const today = new Date().toISOString().split("T")[0];
  return parseEventDateTime(today, timeStr) || new Date();
}

function formatTime(date: Date) {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

function formatWebTime(value: string) {
  if (!value) return "";
  const [hoursValue, minutes = "00"] = value.split(":");
  const date = new Date();
  date.setHours(Number(hoursValue), Number(minutes), 0, 0);
  return formatTime(date);
}

function timeToWebValue(timeStr: string) {
  const parsed = parseTimeToDate(timeStr);
  return `${parsed.getHours().toString().padStart(2, "0")}:${parsed
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

export default function CreateMeetup() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [formData, setFormData] = useState<EventFormState>(initialFormState);
  const [locationQuery, setLocationQuery] = useState("");
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);
  const [tempPickerDate, setTempPickerDate] = useState(new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedLocation = useMemo(
    () => findCampusLocation(formData.locationId),
    [formData.locationId]
  );

  const campusLocations = useMemo(
    () => searchCampusLocations(locationQuery).slice(0, 8),
    [locationQuery]
  );

  useEffect(() => {
    if (!id) {
      setFormData(initialFormState);
      setLocationQuery("");
    }
  }, [id]);

  useEffect(() => {
    const loadMeetup = async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, "events", id as string));
      if (!snap.exists()) return;

      const data = snap.data();
      if (data.creatorId !== auth.currentUser?.uid) {
        Alert.alert("Not allowed", "You are not allowed to edit this meetup.");
        router.replace("/discover");
        return;
      }

      setFormData({
        title: data.title || "",
        description: data.description || "",
        date: data.date || "",
        time: data.time || "",
        location: data.location || "",
        locationId: data.locationId || "",
        locationRoom: data.locationRoom || "",
        tags: data.tags || [],
        visibility: "campus",
        capacity: data.capacity ? String(data.capacity) : "",
        image: data.image || null,
      });
      setLocationQuery(data.locationName || data.location || "");
    };

    loadMeetup();
  }, [id, router]);

  const handleChange = <K extends keyof EventFormState>(
    name: K,
    value: EventFormState[K]
  ) => setFormData((prev) => ({ ...prev, [name]: value }));

  const handleLocationSelect = (location: CampusLocation) => {
    const label = buildLocationLabel(location, formData.locationRoom);
    setFormData((prev) => ({
      ...prev,
      locationId: location.id,
      location: label,
    }));
    setLocationQuery(`${location.code} - ${location.name}`);
  };

  const handleRoomChange = (room: string) => {
    setFormData((prev) => {
      const location = findCampusLocation(prev.locationId);
      return {
        ...prev,
        locationRoom: room,
        location: buildLocationLabel(location, room),
      };
    });
  };

  const openNativePicker = (mode: "date" | "time") => {
    setTempPickerDate(
      mode === "date"
        ? formData.date
          ? parseDateOnly(formData.date)
          : new Date()
        : formData.time
          ? parseTimeToDate(formData.time)
          : new Date()
    );
    setPickerMode(mode);
  };

  const confirmNativePicker = () => {
    if (pickerMode === "date") {
      handleChange("date", formatDateOnlyValue(tempPickerDate));
    }

    if (pickerMode === "time") {
      handleChange("time", formatTime(tempPickerDate));
    }

    setPickerMode(null);
  };

  const shiftWebDate = (days: number) => {
    const nextDate = formData.date ? parseDateOnly(formData.date) : new Date();
    nextDate.setDate(nextDate.getDate() + days);
    if (nextDate < today) nextDate.setTime(today.getTime());
    handleChange("date", formatDateOnlyValue(nextDate));
  };

  const shiftWebTime = (minutes: number) => {
    const nextTime = formData.time ? parseTimeToDate(formData.time) : new Date();
    nextTime.setMinutes(nextTime.getMinutes() + minutes);
    handleChange("time", formatTime(nextTime));
  };

  const handleImageUpload = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Sign in required", "Please sign in before uploading an image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.5,
      allowsEditing: true,
      aspect: [16, 9],
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });

    if (result.canceled || !result.assets.length) return;

    try {
      setUploadingImage(true);
      const asset = result.assets[0];
      const url = await uploadPickedImage({
        storage,
        asset,
        pathPrefix: `events/${uid}`,
        fallbackName: "meetup.jpg",
      });
      setUploadError("");
      handleChange("image", url);
    } catch (error) {
      console.error("Meetup image upload error:", error);
      const message = getImageUploadErrorMessage(error);
      setUploadError(message);
      Alert.alert("Upload failed", message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    const uid = auth.currentUser?.uid;
    const eventDateTime = parseEventDateTime(formData.date, formData.time);
    const now = new Date();
    const capacity = formData.capacity ? Number(formData.capacity) : null;

    if (!uid) {
      Alert.alert("Sign in required", "Please sign in before publishing a meetup.");
      return;
    }

    if (!eventDateTime) {
      Alert.alert("Invalid time", "Choose a valid date and time.");
      return;
    }

    if (eventDateTime < now) {
      Alert.alert("Past meetup", "You cannot create a meetup in the past.");
      return;
    }

    if (!formData.title || !formData.description || !formData.date || !formData.time) {
      Alert.alert("Missing info", "Please fill all required fields.");
      return;
    }

    if (!selectedLocation) {
      Alert.alert("Choose location", "Select one approved UIC campus location.");
      return;
    }

    if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) {
      Alert.alert("Capacity", "Capacity must be a whole number.");
      return;
    }

    const locationLabel = buildLocationLabel(selectedLocation, formData.locationRoom);
    const payload = {
      ...formData,
      location: locationLabel,
      locationName: selectedLocation.name,
      locationCode: selectedLocation.code,
      locationAddress: selectedLocation.address,
      locationBuildingNumber: selectedLocation.buildingNumber,
      locationAccess: selectedLocation.access,
      locationRoom: formData.locationRoom.trim(),
      campus: "UIC",
      campusOnly: true,
      allowedCampuses: ["UIC"],
      visibility: "campus",
      capacity,
      safetyStatus: "campus-location-verified",
    };

    setLoading(true);

    try {
      const campusAccess = await ensureUicCampusAccess();
      if (!campusAccess.ok) {
        Alert.alert(
          campusAccess.title || "UIC access required",
          campusAccess.message || "Your account is not cleared to publish campus meetups."
        );
        return;
      }

      if (id) {
        await updateDoc(doc(db, "events", id as string), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        const eventRef = await addDoc(collection(db, "events"), {
          ...payload,
          creatorId: uid,
          attendeeCount: 0,
          attendeeIds: [],
          attendees: 0,
          likes: 0,
          createdAt: serverTimestamp(),
        });
        setFormData(initialFormState);
        setLocationQuery("");
        router.replace(`/(tabs)/meetup/${eventRef.id}` as any);
        return;
      }

      router.replace("/discover");
    } catch (error) {
      console.error("Save meetup error:", error);
      const message =
        error instanceof Error && error.message ? error.message : "Please try again.";
      Alert.alert("Could not save", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 120,
          },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace("/discover")} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.inputText} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{id ? "Edit Meetup" : "Create Meetup"}</Text>
            <Text style={styles.headerSubtitle}>UIC pilot events are campus-only.</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleImageUpload}
          style={styles.imageButton}
          disabled={uploadingImage}
        >
          <Icon name="image" size={20} color={colors.primary} />
          <Text style={styles.uploadText}>
            {uploadingImage ? "Uploading image..." : "Upload Meetup Image"}
          </Text>
        </TouchableOpacity>

        {uploadError ? <Text style={styles.errorText}>{uploadError}</Text> : null}

        {formData.image && (
          <>
            <SmartImage uri={formData.image} style={styles.previewImage} />
            <TouchableOpacity onPress={() => handleChange("image", null)} style={styles.removeImageButton}>
              <Icon name="x" size={20} color={colors.primaryDark} />
              <Text style={styles.removeImageText}>Remove Image</Text>
            </TouchableOpacity>
          </>
        )}

        <TextInput
          style={[styles.input, styles.inputText]}
          placeholder="Meetup Title"
          placeholderTextColor={colors.placeholder}
          value={formData.title}
          onChangeText={(text) => handleChange("title", text)}
        />

        <TextInput
          style={[styles.input, styles.textArea, styles.inputText]}
          placeholder="Description"
          placeholderTextColor={colors.placeholder}
          value={formData.description}
          onChangeText={(text) => handleChange("description", text)}
          multiline
        />

        {Platform.OS === "web" ? (
          <View style={styles.webDateTimeGrid}>
            <View style={styles.webPickerCard}>
              <Text style={styles.fieldLabel}>Date</Text>
              <TextInput
                {...({ type: "date" } as any)}
                style={[styles.input, styles.inputText, styles.webPickerInput]}
                placeholder="Select Date"
                placeholderTextColor={colors.placeholder}
                value={formData.date}
                onChangeText={(date) => handleChange("date", date)}
              />
              <View style={styles.quickRow}>
                <TouchableOpacity style={styles.stepButton} onPress={() => shiftWebDate(-1)}>
                  <Icon name="chevron-left" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => handleChange("date", formatDateOnlyValue(new Date()))}
                >
                  <Text style={styles.quickButtonText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickButton} onPress={() => shiftWebDate(1)}>
                  <Text style={styles.quickButtonText}>+1 day</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.stepButton} onPress={() => shiftWebDate(7)}>
                  <Icon name="chevrons-right" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.webPickerCard}>
              <Text style={styles.fieldLabel}>Time</Text>
              <TextInput
                {...({ type: "time" } as any)}
                style={[styles.input, styles.inputText, styles.webPickerInput]}
                placeholder="Select Time"
                placeholderTextColor={colors.placeholder}
                value={formData.time ? timeToWebValue(formData.time) : ""}
                onChangeText={(time) => handleChange("time", formatWebTime(time))}
              />
              <View style={styles.quickRow}>
                <TouchableOpacity style={styles.stepButton} onPress={() => shiftWebTime(-15)}>
                  <Icon name="minus" size={16} color={colors.primary} />
                </TouchableOpacity>
                {["12:00 PM", "5:00 PM", "7:00 PM"].map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={styles.quickButton}
                    onPress={() => handleChange("time", time)}
                  >
                    <Text style={styles.quickButtonText}>{time.replace(":00", "")}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.stepButton} onPress={() => shiftWebTime(15)}>
                  <Icon name="plus" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.input, styles.rowInput]}
              onPress={() => openNativePicker("date")}
              activeOpacity={0.75}
            >
              <Text style={formData.date ? styles.inputText : styles.placeholderText}>
                {formData.date || "Select Date"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.input, styles.rowInput]}
              onPress={() => openNativePicker("time")}
              activeOpacity={0.75}
            >
              <Text style={formData.time ? styles.inputText : styles.placeholderText}>
                {formData.time || "Select Time"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.subtitle}>Approved UIC Location</Text>
        <TextInput
          style={[styles.input, styles.inputText]}
          placeholder="Search building or code, like LH or Lecture Center C"
          placeholderTextColor={colors.placeholder}
          value={locationQuery}
          onChangeText={(text) => {
            setLocationQuery(text);
            if (text !== selectedLocation?.name) {
              handleChange("locationId", "");
              handleChange("location", "");
            }
          }}
        />

        <View style={styles.locationList}>
          {campusLocations.map((location) => {
            const isSelected = formData.locationId === location.id;
            return (
              <TouchableOpacity
                key={location.id}
                style={[styles.locationOption, isSelected && styles.locationOptionSelected]}
                onPress={() => handleLocationSelect(location)}
              >
                <View style={styles.locationCode}>
                  <Text style={[styles.locationCodeText, isSelected && styles.locationCodeTextSelected]}>
                    {location.code}
                  </Text>
                </View>
                <View style={styles.locationCopy}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationAddress}>
                    Building {location.buildingNumber} - {location.address}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={[styles.input, styles.inputText]}
          placeholder="Room or meetup spot (example: 321, lobby, room C3)"
          placeholderTextColor={colors.placeholder}
          value={formData.locationRoom}
          onChangeText={handleRoomChange}
        />

        <TextInput
          style={[styles.input, styles.inputText]}
          placeholder="Capacity (optional)"
          placeholderTextColor={colors.placeholder}
          value={formData.capacity}
          onChangeText={(text) => handleChange("capacity", text.replace(/[^0-9]/g, ""))}
          keyboardType="numeric"
        />

        <View style={styles.accessBox}>
          <Icon name="lock" size={18} color={colors.primary} />
          <View style={styles.accessCopy}>
            <Text style={styles.accessTitle}>UIC campus event</Text>
            <Text style={styles.accessText}>
              Only UIC-verified users or approved invite-code pilot users should see and RSVP.
            </Text>
          </View>
        </View>

        <Text style={styles.subtitle}>Tags</Text>
        <View style={styles.grid}>
          {TAGS.map((tag) => {
            const selected = formData.tags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, selected && styles.tagSelected]}
                onPress={() =>
                  handleChange(
                    "tags",
                    selected
                      ? formData.tags.filter((selectedTag) => selectedTag !== tag)
                      : [...formData.tags, tag]
                  )
                }
              >
                <Icon
                  name={selected ? "check-square" : "square"}
                  size={16}
                  color={selected ? colors.primary : colors.placeholder}
                />
                <Text style={[styles.tagText, selected && styles.tagTextSelected]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.submitButton,
          { bottom: insets.bottom + 16 },
          (loading || uploadingImage) && styles.disabledButton,
        ]}
        onPress={handleSubmit}
        disabled={loading || uploadingImage}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>{id ? "Save Changes" : "Publish Meetup"}</Text>
        )}
      </TouchableOpacity>

      <Modal visible={pickerMode !== null} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity
                style={styles.pickerHeaderButton}
                onPress={() => setPickerMode(null)}
              >
                <Icon name="x" size={20} color={colors.placeholder} />
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>

              <Text style={styles.pickerTitle}>
                {pickerMode === "date" ? "Choose date" : "Choose time"}
              </Text>

              <TouchableOpacity
                style={styles.pickerConfirmButton}
                onPress={confirmNativePicker}
              >
                <Icon name="check" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {pickerMode ? (
              <DateTimePicker
                value={tempPickerDate}
                mode={pickerMode}
                display="spinner"
                minimumDate={pickerMode === "date" ? today : undefined}
                minuteInterval={5}
                onChange={(_event, selectedDate) => {
                  if (selectedDate) setTempPickerDate(selectedDate);
                }}
                style={styles.nativePicker}
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: spacing.screen },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: colors.inputText },
  headerSubtitle: { color: colors.placeholder, fontSize: 13, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
    borderRadius: spacing.radius,
    padding: 12,
    marginBottom: spacing.fieldGap,
  },
  row: { flexDirection: "row", gap: 10 },
  rowInput: { flex: 1 },
  fieldLabel: {
    color: colors.inputText,
    fontWeight: "700",
    marginBottom: 8,
  },
  webDateTimeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: spacing.fieldGap,
  },
  webPickerCard: {
    flex: 1,
    minWidth: 240,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: spacing.radius,
    padding: 12,
  },
  webPickerInput: {
    marginBottom: 10,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  quickButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  quickButtonText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  placeholderText: { color: colors.placeholder },
  inputText: { color: colors.inputText },
  imageButton: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  uploadText: { marginLeft: 8, color: colors.primary, fontWeight: "600" },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  previewImage: { width: "100%", height: 200, borderRadius: spacing.radius, marginBottom: 8 },
  removeImageButton: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  removeImageText: { marginLeft: 6, color: colors.primaryDark },
  subtitle: { fontSize: 17, fontWeight: "700", marginTop: 10, marginBottom: 10, color: colors.inputText },
  locationList: { gap: 8, marginBottom: 12 },
  locationOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 10,
  },
  locationOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  locationCode: {
    minWidth: 58,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  locationCodeText: { color: colors.inputText, fontWeight: "700", fontSize: 12 },
  locationCodeTextSelected: { color: colors.primary },
  locationCopy: { flex: 1 },
  locationName: { color: colors.inputText, fontWeight: "700", fontSize: 14 },
  locationAddress: { color: colors.placeholder, fontSize: 12, marginTop: 2 },
  accessBox: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  accessCopy: { flex: 1 },
  accessTitle: { fontWeight: "700", color: colors.primaryDark, marginBottom: 2 },
  accessText: { color: colors.inputText, fontSize: 13, lineHeight: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderColor: colors.inputBorder,
    backgroundColor: colors.surface,
    margin: 6,
  },
  tagSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  tagText: { color: colors.inputText },
  tagTextSelected: { color: colors.primary },
  submitButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: spacing.radius,
    alignItems: "center",
  },
  disabledButton: { backgroundColor: colors.inputBorder },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  pickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17, 24, 39, 0.35)",
  },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 14,
    paddingHorizontal: 16,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pickerHeaderButton: {
    minWidth: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  pickerCancelText: {
    color: colors.placeholder,
    fontWeight: "700",
  },
  pickerTitle: {
    color: colors.inputText,
    fontWeight: "800",
    fontSize: 17,
  },
  pickerConfirmButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  nativePicker: {
    alignSelf: "center",
    width: "100%",
  },
});
