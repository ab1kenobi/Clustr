import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import Icon from "react-native-vector-icons/Feather";
import { db, auth } from "@/config/firebase";

export default function MeetupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load event
  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      try {
        const snap = await getDoc(doc(db, "events", id));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setEvent(data);
        }
      } catch (err) {
        console.error("Error fetching event:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  // Load attendees profiles
  useEffect(() => {
    const loadAttendees = async () => {
      if (!event?.rsvps) return;
      const profiles = await Promise.all(
        event.rsvps.map(async (uid: string) => {
          const snap = await getDoc(doc(db, "users", uid));
          return snap.exists() ? { uid, ...snap.data() } : null;
        })
      );
      setAttendees(profiles.filter(Boolean));
    };
    loadAttendees();
  }, [event?.rsvps]);

  const handleRSVP = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid || !id) return;

  const alreadyRSVPd = event?.rsvps?.includes(uid);
    try {
      if (alreadyRSVPd) {
        // User already RSVP’d → remove them (un‑RSVP)
        await updateDoc(doc(db, "events", id), {
          rsvps: arrayRemove(uid),
        });
        setEvent((prev: any) => ({
          ...prev,
          rsvps: prev.rsvps.filter((u: string) => u !== uid),
        }));
      } else {
        // User not RSVP’d yet → add them
        await updateDoc(doc(db, "events", id), {
          rsvps: arrayUnion(uid),
        });
        setEvent((prev: any) => ({
          ...prev,
          rsvps: [...(prev?.rsvps || []), uid],
        }));
      }
    } catch (err) {
      console.error("Error updating RSVP:", err);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Event not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/discover")} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      {event.image && <Image source={{ uri: event.image }} style={styles.image} />}
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.subtitle}>{event.location}</Text>
      <Text style={styles.date}>{event.date}</Text>
      <Text style={styles.date}>{event.time}</Text>

      <Text style={styles.sectionTitle}>About</Text>
      <Text style={styles.description}>{event.description}</Text>


      {event.tags?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tags}>
            {event.tags.map((tag: string) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Attendees</Text>
      <Text style={styles.attendeesCount}>
        {attendees.length === 1
          ? "1 person has RSVP’d"
          : `${attendees.length} people have RSVP’d`}
      </Text>
      <View style={styles.attendeesList}>
        {attendees.map((u) => (
          <View key={u.uid} style={styles.attendeeChip}>
            {u.avatar ? (
              <Image source={{ uri: u.avatar }} style={styles.avatarSmall} />
            ) : null}
            <Text style={styles.attendeeText}>{u.name || u.email}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.rsvpButton} onPress={handleRSVP}>
        <Text style={styles.rsvpText}>{event?.rsvps?.includes(auth.currentUser?.uid) ? "Cancel RSVP" : "RSVP"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { padding: 16, paddingTop: 50 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { fontSize: 18, color: "red", marginBottom: 12 },
  back: { color: "#007BFF", fontSize: 16 },
  image: { width: "100%", height: 220, borderRadius: 12, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 18, color: "#555", marginBottom: 4 },
  date: { fontSize: 16, color: "#777", marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "600", marginTop: 16, marginBottom: 8 },
  description: { fontSize: 16, lineHeight: 22, color: "#333" },
  tags: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  tagChip: {
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: { fontSize: 14, color: "#333" },
  attendeesCount: { fontSize: 16, marginBottom: 8 },
  attendeesList: { flexDirection: "row", flexWrap: "wrap" },
  attendeeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  attendeeText: { fontSize: 14, color: "#065F46", marginLeft: 6 },
  avatarSmall: { width: 20, height: 20, borderRadius: 10 },
  rsvpButton: {
    backgroundColor: "#3B82F6",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  rsvpText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 24, fontWeight: "bold", marginLeft: 12 },
});
