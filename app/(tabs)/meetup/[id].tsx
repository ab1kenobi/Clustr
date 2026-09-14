import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import Icon from "react-native-vector-icons/Feather";
import { db, auth } from "@/config/firebase";
import { SmartImage } from "@/components/ui/smart-image";
import { colors } from "@/styles/theme";

type EventData = {
  id: string;
  title?: string;
  description?: string;
  image?: string;
  location?: string;
  locationAddress?: string;
  date?: string;
  time?: string;
  tags?: string[];
  creatorId?: string;
  campus?: string;
  campusOnly?: boolean;
  capacity?: number | null;
};

type Attendee = {
  uid: string;
  avatar?: string;
  name?: string;
  email?: string;
};

type UserAccess = {
  campusAccess?: string[];
  campusVerified?: boolean;
  schoolEmailVerified?: boolean;
};

export default function MeetupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const [event, setEvent] = useState<EventData | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);

  const reloadAttendees = useCallback(async () => {
    if (!id) return [];

    const snap = await getDocs(collection(db, "events", id, "attendees"));
    const profiles = await Promise.all(
      snap.docs.map(async (docSnap) => {
        const userSnap = await getDoc(doc(db, "users", docSnap.id));
        return userSnap.exists()
          ? ({ uid: docSnap.id, ...userSnap.data() } as Attendee)
          : ({ uid: docSnap.id } as Attendee);
      })
    );

    setAttendees(profiles);
    return profiles.map((profile) => profile.uid);
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchEvent = async () => {
      try {
        const snap = await getDoc(doc(db, "events", id));
        if (snap.exists()) {
          setEvent({ id: snap.id, ...snap.data() } as EventData);
        }
      } catch (err) {
        console.error("Error fetching event:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  useEffect(() => {
    reloadAttendees();
  }, [reloadAttendees]);

  const handleRSVP = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !id || !event) return;

    const userSnap = await getDoc(doc(db, "users", uid));
    const userAccess = userSnap.exists() ? (userSnap.data() as UserAccess) : null;
    const allowedCampus = event.campus || "UIC";
    const hasCampusAccess =
      userAccess?.campusAccess?.includes(allowedCampus) ||
      userAccess?.campusVerified ||
      userAccess?.schoolEmailVerified;

    if (event.campusOnly && !hasCampusAccess) {
      Alert.alert("Campus event", "This event is limited to UIC campus users.");
      return;
    }

    try {
      const nextAttendeeIds = await runTransaction(db, async (transaction) => {
        const eventRef = doc(db, "events", id);
        const attendeeRef = doc(db, "events", id, "attendees", uid);
        const eventSnap = await transaction.get(eventRef);
        const attendeeSnap = await transaction.get(attendeeRef);

        if (!eventSnap.exists()) throw new Error("EVENT_MISSING");

        const eventData = eventSnap.data() as EventData & {
          attendeeIds?: string[];
          rsvps?: string[];
        };
        const currentIds = Array.isArray(eventData.attendeeIds)
          ? eventData.attendeeIds
          : Array.isArray(eventData.rsvps)
            ? eventData.rsvps
            : [];

        if (!attendeeSnap.exists() && eventData.capacity && currentIds.length >= eventData.capacity) {
          throw new Error("EVENT_FULL");
        }

        const nextIds = attendeeSnap.exists()
          ? currentIds.filter((attendeeId) => attendeeId !== uid)
          : Array.from(new Set([...currentIds, uid]));

        if (attendeeSnap.exists()) {
          transaction.delete(attendeeRef);
        } else {
          transaction.set(attendeeRef, {
            joinedAt: serverTimestamp(),
          });
        }

        transaction.update(eventRef, {
          attendeeIds: nextIds,
          rsvps: nextIds,
          attendeeCount: nextIds.length,
          attendees: nextIds.length,
        });

        return nextIds;
      });

      const attendeeIds = await reloadAttendees();
      const count = attendeeIds.length || nextAttendeeIds.length;
      setEvent((prev) => (prev ? { ...prev, attendeeCount: count } : prev));
    } catch (err) {
      console.error("RSVP error:", err);
      if (err instanceof Error && err.message === "EVENT_FULL") {
        Alert.alert("Event full", "This meetup has reached its RSVP capacity.");
        return;
      }
      Alert.alert("RSVP error", "Could not update your RSVP. Please try again.");
    }
  };

  const submitReport = async (reason: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid || !id) return;

    try {
      await addDoc(collection(db, "reports"), {
        reporterId: uid,
        eventId: id,
        eventTitle: event?.title || "",
        reason,
        status: "open",
        createdAt: serverTimestamp(),
      });
      Alert.alert("Report sent", "Thanks. We saved the report for review.");
    } catch (err) {
      console.error("Report error:", err);
      Alert.alert("Report failed", "Could not send this report. Please try again.");
    }
  };

  const handleReport = () => {
    Alert.alert("Report meetup", "Tell us what needs review.", [
      { text: "Cancel", style: "cancel" },
      { text: "Safety concern", onPress: () => submitReport("Safety concern") },
      { text: "Wrong details", onPress: () => submitReport("Wrong details") },
      { text: "Spam", onPress: () => submitReport("Spam") },
    ]);
  };

  const handleDelete = async () => {
    if (!id || auth.currentUser?.uid !== event?.creatorId) return;

    Alert.alert("Delete Meetup", "Are you sure you want to delete this meetup?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "events", id));
            router.replace("/discover");
          } catch (err) {
            console.error("Error deleting meetup:", err);
            Alert.alert("Delete failed", "Could not delete this meetup.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
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

  const isCreator = auth.currentUser?.uid === event.creatorId;
  const currentUserIsAttending = attendees.some(
    (attendee) => attendee.uid === auth.currentUser?.uid
  );

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 36,
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/discover")} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.placeholder} />
        </TouchableOpacity>
        {isCreator && (
          <View style={styles.creatorActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push(`/create?id=${event.id}`)}
            >
              <Icon name="edit" size={18} color="#fff" />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Icon name="trash" size={18} color="#fff" />
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <SmartImage uri={event.image} style={styles.image} />
      <Text style={[styles.title, compact && styles.titleCompact]}>{event.title}</Text>
      <Text style={styles.subtitle}>{event.location}</Text>
      {event.locationAddress ? (
        <Text style={styles.address}>{event.locationAddress}</Text>
      ) : null}

      {event.campusOnly ? (
        <View style={styles.campusBadge}>
          <Icon name="lock" size={14} color={colors.primaryDark} />
          <Text style={styles.campusBadgeText}>UIC campus users only</Text>
        </View>
      ) : null}

      <View style={styles.dateRow}>
        <Text style={styles.date}>{event.date}</Text>
        <Text style={styles.date}>{event.time}</Text>
      </View>

      <Text style={styles.sectionTitle}>About</Text>
      <Text style={styles.description}>{event.description}</Text>

      {event.capacity ? (
        <>
          <Text style={styles.sectionTitle}>Capacity</Text>
          <Text style={styles.description}>
            {attendees.length} of {event.capacity} spots filled
          </Text>
        </>
      ) : null}

      {event.tags?.length ? (
        <>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tags}>
            {event.tags.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Attendees</Text>
      <Text style={styles.attendeesCount}>
        {attendees.length === 1
          ? "1 person has RSVP'd"
          : `${attendees.length} people have RSVP'd`}
      </Text>
      <View style={styles.attendeesList}>
        {attendees.map((attendee) => (
          <View key={attendee.uid} style={styles.attendeeChip}>
            {attendee.avatar ? (
              <SmartImage uri={attendee.avatar} style={styles.avatarSmall} />
            ) : null}
            <Text style={styles.attendeeText}>{attendee.name || attendee.email || "Guest"}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.rsvpButton} onPress={handleRSVP}>
        <Text style={styles.rsvpText}>
          {currentUserIsAttending ? "Cancel RSVP" : "RSVP"}
        </Text>
      </TouchableOpacity>

      {!isCreator ? (
        <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
          <Icon name="flag" size={16} color="#B91C1C" />
          <Text style={styles.reportText}>Report meetup</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { fontSize: 18, color: "#B91C1C", marginBottom: 12 },
  back: { color: colors.primary, fontSize: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  creatorActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" },
  image: { width: "100%", height: 220, borderRadius: 12, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8, color: colors.inputText },
  titleCompact: { fontSize: 24, lineHeight: 30 },
  subtitle: { fontSize: 18, color: colors.inputText, marginBottom: 4 },
  address: { fontSize: 14, color: colors.placeholder, marginBottom: 10 },
  campusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
  },
  campusBadgeText: { color: colors.primaryDark, fontWeight: "700", fontSize: 12 },
  dateRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  date: { fontSize: 16, color: colors.placeholder },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    color: colors.inputText,
  },
  description: { fontSize: 16, lineHeight: 22, color: colors.inputText },
  tags: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  tagChip: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: { fontSize: 14, color: colors.inputText },
  attendeesCount: { fontSize: 16, marginBottom: 8, color: colors.placeholder },
  attendeesList: { flexDirection: "row", flexWrap: "wrap" },
  attendeeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  attendeeText: { fontSize: 14, color: "#065F46", marginLeft: 6 },
  avatarSmall: { width: 20, height: 20, borderRadius: 10 },
  rsvpButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  rsvpText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  reportButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  reportText: {
    color: "#B91C1C",
    fontWeight: "700",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editText: { color: "#fff", marginLeft: 6, fontWeight: "600" },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#B91C1C",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteText: { color: "#fff", marginLeft: 6, fontWeight: "600" },
});
