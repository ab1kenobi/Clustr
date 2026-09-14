import { auth, db } from "@/config/firebase";
import {
  isAllowedCampusEmail,
  isAllowedInviteCode,
} from "@/constants/campus";
import { colors } from "@/styles/theme";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmedAge, setConfirmedAge] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  const handleSubmit = async () => {
    if (!email || !password || (mode === "signup" && !confirm)) {
      Alert.alert("Missing info", "Please fill in all fields");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (mode === "signup") {
      const hasCampusEmail = isAllowedCampusEmail(normalizedEmail);
      const hasInviteAccess = isAllowedInviteCode(inviteCode);

      if (!hasCampusEmail && !hasInviteAccess) {
        Alert.alert(
          "UIC access required",
          "Use a UIC email address or a pilot invite code to create an account."
        );
        return;
      }

      if (!confirmedAge) {
        Alert.alert("Age Requirement", "You must be 18 or older to use Clustr");
        return;
      }

      if (!agreedToTerms) {
        Alert.alert("Terms Required", "Please agree to the Terms of Service and Privacy Policy");
        return;
      }

      if (password !== confirm) {
        Alert.alert("Passwords", "Passwords do not match");
        return;
      }
    }

    try {
      if (mode === "signup") {
        const hasCampusEmail = isAllowedCampusEmail(normalizedEmail);
        const hasInviteAccess = isAllowedInviteCode(inviteCode);
        const res = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

        await sendEmailVerification(res.user);
        Alert.alert("Verify Email", "A verification email has been sent. Please check your inbox.");

        await setDoc(doc(db, "users", res.user.uid), {
          email: res.user.email,
          createdAt: serverTimestamp(),
          name: "",
          bio: "",
          location: "",
          age: 0,
          gender: "",
          avatar: "",
          interests: [],
          onboardingComplete: false,
          campus: "UIC",
          campusAccess: ["UIC"],
          campusVerified: hasCampusEmail || hasInviteAccess,
          schoolEmailVerified: hasCampusEmail,
          accessMethod: hasCampusEmail ? "uic-email" : "invite-code",
          inviteCodeUsed: hasInviteAccess ? inviteCode.trim().toUpperCase() : "",
          agreedToTerms: true,
          ageVerified: true,
          agreedAt: serverTimestamp(),
        });

        router.replace("/choose");
      } else {
        const res = await signInWithEmailAndPassword(auth, normalizedEmail, password);

        if (!res.user.emailVerified) {
          Alert.alert("Email not verified", "Please verify your email before continuing.");
          return;
        }

        const snap = await getDoc(doc(db, "users", res.user.uid));
        if (snap.exists() && !snap.data().onboardingComplete) {
          router.replace("/choose");
        } else {
          router.replace("/(tabs)/discover");
        }
      }
    } catch (e: any) {
      Alert.alert("Auth Error", e?.code || e?.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <View style={styles.box}>
          <Text style={styles.title}>
            {mode === "signin" ? "Welcome Back" : "Create Account"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.placeholder}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {mode === "signup" && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry
                value={confirm}
                onChangeText={setConfirm}
              />

              <TextInput
                style={styles.input}
                placeholder="Invite Code (if not using UIC email)"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="characters"
                value={inviteCode}
                onChangeText={setInviteCode}
              />

              <Text style={styles.accessNote}>
                UIC emails are approved automatically. Pilot guests need a club invite code.
              </Text>

              {/* Age Verification */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setConfirmedAge(!confirmedAge)}
              >
                <View style={[styles.checkbox, confirmedAge && styles.checkboxChecked]}>
                  {confirmedAge && <Icon name="check" size={16} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  I confirm that I am 18 years of age or older
                </Text>
              </TouchableOpacity>

              {/* Terms Agreement */}
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  onPress={() => setAgreedToTerms(!agreedToTerms)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                    {agreedToTerms && <Icon name="check" size={16} color="#fff" />}
                  </View>
                </TouchableOpacity>
                <View style={styles.checkboxTextContainer}>
                  <TouchableOpacity onPress={() => setAgreedToTerms(!agreedToTerms)}>
                    <Text style={styles.checkboxLabel}>I agree to the </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push("/(auth)/legal?type=terms")}>
                    <Text style={styles.link}>Terms of Service</Text>
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}> and </Text>
                  <TouchableOpacity onPress={() => router.push("/(auth)/legal?type=privacy")}>
                    <Text style={styles.link}>Privacy Policy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>
              {mode === "signin" ? "Sign In" : "Sign Up"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(mode === "signin" ? "signup" : "signin")}>
            <Text style={styles.toggleText}>
              {mode === "signin"
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
            </Text>
          </TouchableOpacity>

          {mode === "signin" && (
            <View style={styles.legalLinks}>
              <TouchableOpacity onPress={() => router.push("/(auth)/legal?type=terms")}>
                <Text style={styles.legalLink}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.legalSeparator}>/</Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/legal?type=privacy")}>
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  box: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
  },
  title: { fontSize: 26, fontWeight: "700", textAlign: "center", marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: colors.inputText,
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  checkboxTextContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    flex: 1,
    alignItems: "center",
  },
  link: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  accessNote: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  toggleText: {
    textAlign: "center",
    color: colors.primary,
    marginTop: 14,
    fontWeight: "600",
  },
  legalLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  legalLink: {
    color: "#666",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  legalSeparator: {
    color: "#666",
    marginHorizontal: 8,
    fontSize: 12,
  },
});
