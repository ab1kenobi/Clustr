import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

export default function MeetupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      try {
        const snap = await getDoc(doc(db, "events", id));
        if (snap.exists()) {
          setEvent({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error("Error fetching event:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent} // ✅ use this for layout
    >
      {event.image && (
        <Image source={{ uri: event.image }} style={styles.image} />
      )}
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

      <TouchableOpacity
        style={styles.rsvpButton}
        onPress={() => console.log(`RSVP to ${event.title}`)}
      >
        <Text style={styles.rsvpText}>RSVP</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16},
  scrollContent: {padding: 16, paddingTop: 50, justifyContent: "center"},
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
  tagChip: { backgroundColor: "#eee", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  tagText: { fontSize: 14, color: "#333" },
  rsvpButton: { backgroundColor: "#3B82F6", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 24 },
  rsvpText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
