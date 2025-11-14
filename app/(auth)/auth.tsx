import { auth, db } from "@/config/firebase";
import { colors } from "@/styles/theme";
import { useRouter } from "expo-router";
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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = async () => {
    if (!email || !password || (mode === "signup" && !confirm)) {
      Alert.alert("Missing info", "Please fill in all fields");
      return;
    }
    if (mode === "signup" && password !== confirm) {
      Alert.alert("Passwords", "Passwords do not match");
      return;
    }

    try {
      if (mode === "signup") {
        const res = await createUserWithEmailAndPassword(auth, email.trim(), password);

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
        });

        // @ts-ignore - Setup route exists but not in typed routes yet
        (router.replace as any)("/(setup)/index");
      } else {
        const res = await signInWithEmailAndPassword(auth, email.trim(), password);

        if (!res.user.emailVerified) {
          Alert.alert("Email not verified", "Please verify your email before continuing.");
          return;
        }

        const snap = await getDoc(doc(db, "users", res.user.uid));
        if (snap.exists() && !snap.data().onboardingComplete) {
          // @ts-ignore - Setup route exists but not in typed routes yet
          router.replace("/(setup)/index");
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
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor={colors.placeholder}
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
          />
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
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: 20,
  },
  box: {
    backgroundColor: "#fff",
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
});