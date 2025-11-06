import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "@/config/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "expo-router";

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
        // ✅ Create auth user
        const res = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        // ✅ Create user document in Firestore
        await setDoc(doc(db, "users", res.user.uid), {
          email: res.user.email,
          createdAt: serverTimestamp(),
          interests: [],
        });

        console.log("✅ Signup OK:", res.user.uid);
        Alert.alert("Success", "Account created!");
      } else {
        const res = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        console.log("✅ Signin OK:", res.user.uid);
        Alert.alert("Welcome Back!");
      }
    } catch (e: any) {
      console.log("❌ Auth error:", e?.code || e?.message || e);
      Alert.alert("Auth Error", e?.code || e?.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {mode === "signin" ? "Sign In" : "Sign Up"}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {mode === "signup" && (
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 12, color: "#000" },
  button: { backgroundColor: "#4CAF50", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 4 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  toggleText: { textAlign: "center", color: "#007BFF", marginTop: 12 },
});
