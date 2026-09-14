import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Icon from "react-native-vector-icons/Feather";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import { SmartImage } from "@/components/ui/smart-image";
import { colors, spacing } from "@/styles/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ProfileEvent = {
  id: string;
  title?: string;
  date?: string;
  time?: string;
  creatorId?: string;
  attendeeIds?: string[];
  rsvps?: string[];
};

function calculateCompletion(user: any) {
  const fields = ["name", "location", "age", "gender", "bio", "avatar", "interests"];
  const completed = fields.filter((field) => {
    const value = user[field];
    if (Array.isArray(value)) return value.length >= 3;
    return value !== null && value !== "" && value !== 0;
  }).length;

  return Math.round((completed / fields.length) * 100);
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any>(null);
  const [profileError, setProfileError] = useState("");
  const [currentUid, setCurrentUid] = useState("");
  const [profileEvents, setProfileEvents] = useState<ProfileEvent[]>([]);
  const progress = useSharedValue(0);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    let unsubscribeEvents: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (userAuth) => {
      unsubscribeProfile?.();
      unsubscribeEvents?.();

      if (!userAuth) {
        setUser(null);
        setCurrentUid("");
        setProfileEvents([]);
        return;
      }

      setCurrentUid(userAuth.uid);
      unsubscribeProfile = onSnapshot(
        doc(db, "users", userAuth.uid),
        (snap) => {
          setProfileError("");
          setUser(snap.exists() ? snap.data() : null);
        },
        (error) => {
          console.error("Profile listener error:", error);
          setProfileError(error.message || "Could not load your profile.");
          setUser(null);
        }
      );

      unsubscribeEvents = onSnapshot(
        query(collection(db, "events"), where("campus", "==", "UIC")),
        (snapshot) => {
          setProfileEvents(
            snapshot.docs.map((eventDoc) => ({
              id: eventDoc.id,
              ...eventDoc.data(),
            })) as ProfileEvent[]
          );
        },
        (error) => {
          console.warn("Profile events listener error:", error);
        }
      );
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribeEvents?.();
      unsubscribeAuth();
    };
  }, []);

  const completion = user ? calculateCompletion(user) : 0;
  const isFullyComplete = completion === 100;
  const postedEvents = profileEvents.filter((event) => event.creatorId === currentUid);
  const rsvpEvents = profileEvents.filter((event) => {
    const attendeeIds = event.attendeeIds || event.rsvps || [];
    return attendeeIds.includes(currentUid);
  });

  useEffect(() => {
    progress.value = withTiming(completion, {
      duration: 800,
      easing: Easing.out(Easing.exp),
    });
  }, [completion, progress]);

  const strokeWidth = 6;
  const radius = 65;
  const circumference = 2 * Math.PI * radius;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (circumference * progress.value) / 100,
  }));

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/(auth)/auth");
  };

  if (!user) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>
          {profileError || "Loading profile..."}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 100,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.backWrapper, { top: Math.max(insets.top + 8, 20) }]}>
          <TouchableOpacity onPress={() => router.replace("/discover")} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.placeholder} />
          </TouchableOpacity>
        </View>

        <View style={styles.avatarWrapper}>
          <View style={styles.progressRing}>
            <Svg width={radius * 2 + 10} height={radius * 2 + 10}>
              <Circle
                cx={radius + 5}
                cy={radius + 5}
                r={radius}
                stroke={colors.border}
                strokeWidth={strokeWidth}
              />
              <AnimatedCircle
                cx={radius + 5}
                cy={radius + 5}
                r={radius}
                stroke={isFullyComplete ? colors.success : colors.primary}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference}, ${circumference}`}
                animatedProps={animatedProps}
                strokeLinecap="round"
              />
            </Svg>
          </View>

          {user.avatar ? (
            <SmartImage uri={user.avatar} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Icon name="user" size={42} color={colors.placeholder} />
            </View>
          )}
        </View>

        <Text style={styles.name}>{user.name || "Your profile"}</Text>
        {user.username ? <Text style={styles.username}>{user.username}</Text> : null}
        <Text style={styles.location}>{user.location}</Text>
        <Text style={styles.ageGender}>
          {[user.age, user.gender].filter(Boolean).join(" - ")}
        </Text>

        <Text style={styles.completionText}>Profile {completion}% complete</Text>
      </View>

      {user.interests?.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interestsWrap}>
            {user.interests.map((interest: string) => (
              <Text key={interest} style={styles.interestTag}>
                {interest}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      <Section title="About">
        <Text style={styles.text}>{user.bio || "No bio yet."}</Text>
      </Section>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Clustr</Text>
        <View style={styles.activityGrid}>
          <ActivityColumn title="Posted" events={postedEvents} />
          <ActivityColumn title="RSVPs" events={rsvpEvents} />
        </View>
      </View>

      <TouchableOpacity style={styles.editButton} onPress={() => router.push("/(tabs)/settings")}>
        <Text style={styles.editText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleSignOut}>
        <Text style={styles.secondaryText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const ActivityColumn = ({
  title,
  events,
}: {
  title: string;
  events: ProfileEvent[];
}) => (
  <View style={styles.activityColumn}>
    <Text style={styles.activityTitle}>{title}</Text>
    {events.length ? (
      events.slice(0, 3).map((event) => (
        <View key={event.id} style={styles.activityItem}>
          <Text style={styles.activityItemTitle} numberOfLines={1}>
            {event.title || "Untitled meetup"}
          </Text>
          <Text style={styles.activityItemMeta} numberOfLines={1}>
            {[event.date, event.time].filter(Boolean).join(" at ") || "Date TBD"}
          </Text>
        </View>
      ))
    ) : (
      <Text style={styles.activityEmpty}>Nothing yet</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {},
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  loadingText: { color: colors.placeholder },
  header: { alignItems: "center", paddingVertical: 24 },
  backWrapper: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: spacing.radius,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarWrapper: { justifyContent: "center", alignItems: "center", marginBottom: 16 },
  progressRing: { position: "absolute" },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.border },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  name: { fontSize: 24, fontWeight: "700", color: colors.inputText },
  username: { color: colors.placeholder },
  location: { color: colors.placeholder, marginTop: 2 },
  ageGender: { color: colors.placeholder, marginTop: 2 },
  completionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  section: { paddingHorizontal: 20, paddingVertical: 12, alignItems: "center" },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 6,
    color: colors.inputText,
  },
  text: { lineHeight: 20, color: colors.inputText, textAlign: "center" },
  interestsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  interestTag: {
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 13,
    fontWeight: "600",
  },
  activityGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 20,
  },
  activityColumn: {
    flex: 1,
    minWidth: 150,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radius,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 8,
  },
  activityTitle: {
    color: colors.inputText,
    fontWeight: "800",
    fontSize: 14,
  },
  activityItem: {
    borderRadius: spacing.radius,
    backgroundColor: colors.inputBackground,
    padding: 10,
  },
  activityItemTitle: {
    color: colors.inputText,
    fontWeight: "700",
    fontSize: 13,
  },
  activityItemMeta: {
    color: colors.placeholder,
    marginTop: 2,
    fontSize: 12,
  },
  activityEmpty: {
    color: colors.placeholder,
    fontSize: 13,
  },
  editButton: {
    alignSelf: "center",
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: spacing.radius,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  editText: { color: "#fff", fontWeight: "600" },
  secondaryButton: {
    alignSelf: "center",
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: spacing.radius,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  secondaryText: { color: colors.inputText, fontWeight: "600" },
});
