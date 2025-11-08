import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, { useSharedValue, withTiming, useAnimatedProps, Easing } from "react-native-reanimated";
import { auth, db } from "@/config/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function calculateCompletion(user: any) {
  const fields = ["name","username","location","age","gender","bio","avatar","interests"];
  const filled = fields.filter((key) => user[key] && user[key] !== "" && user[key].length !== 0).length;
  return Math.round((filled / fields.length) * 100);
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) setUser(snap.data());
    });
    return () => unsub();
  }, []);

  const progress = useSharedValue(0);
  const completion = user ? calculateCompletion(user) : 0;
  const isVerified = completion >= 80;

  useEffect(() => {
    progress.value = withTiming(completion, { duration: 800, easing: Easing.out(Easing.exp) });
  }, [completion]);

  const strokeWidth = 6;
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (circumference * progress.value) / 100,
  }));

  if (!user) return <Text>Loading...</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          <View style={{ position: "absolute" }}>
            <Svg width={radius * 2 + 10} height={radius * 2 + 10}>
              <Circle cx={radius + 5} cy={radius + 5} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} />
              <AnimatedCircle
                cx={radius + 5}
                cy={radius + 5}
                r={radius}
                stroke={isVerified ? "#10b981" : "#3b82f6"}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference}, ${circumference}`}
                animatedProps={animatedProps}
                strokeLinecap="round"
              />
            </Svg>
          </View>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        </View>

        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.location}>{user.location}</Text>
        <Text style={styles.ageGender}>{user.age} • {user.gender}</Text>

        {isVerified && <View style={styles.badgeRow}><Text style={styles.badge}>Verified ✅</Text></View>}

        <Text style={[styles.completionText, { color: isVerified ? "#10b981" : "#3b82f6" }]}>
          Profile {completion}% complete
        </Text>
      </View>

      {user.interests?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interestsWrap}>
            {user.interests.map((interest: string, i: number) => (
              <Text key={i} style={styles.interestTag}>{interest}</Text>
            ))}
          </View>
        </View>
      )}

      <Section title="About"><Text style={styles.text}>{user.bio}</Text></Section>

      <TouchableOpacity style={styles.editButton} onPress={() => router.push("/(tabs)/settings")}>
        <Text style={styles.editText}>Edit Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { alignItems: "center", paddingVertical: 24 },
  avatarWrapper: { justifyContent: "center", alignItems: "center", marginBottom: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#e5e7eb" },
  name: { fontSize: 24, fontWeight: "700" },
  username: { color: "#666" },
  location: { color: "#999", marginTop: 2 },
  ageGender: { color: "#777", marginTop: 2 },
  completionText: { marginTop: 8, fontSize: 13, fontWeight: "500" },
  badgeRow: { flexDirection: "row", marginTop: 8, gap: 10 },
  badge: { backgroundColor: "#dcfce7", color: "#15803d", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: "600" },
  section: { paddingHorizontal: 20, paddingVertical: 12 },
  sectionTitle: { fontWeight: "700", fontSize: 18, marginBottom: 6 },
  text: { lineHeight: 20, color: "#444" },
  interestsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  interestTag: { backgroundColor: "#eef2ff", color: "#3b82f6", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, fontSize: 13, fontWeight: "500" },
  editButton: { alignSelf: "center", marginTop: 20, backgroundColor: "#3b82f6", borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 },
  editText: { color: "#fff", fontWeight: "600" },
});
