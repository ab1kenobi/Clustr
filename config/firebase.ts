// config/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import the React Native persistence
// @ts-ignore - Firebase types may not recognize this import
import { getReactNativePersistence } from "firebase/auth";

// ✅ Firebase Config from .env
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// ✅ Initialize app once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Initialize Auth with AsyncStorage persistence
let auth: Auth;
try {
  if (getApps().length === 1) {
    // First initialization - use initializeAuth with persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } else {
    // Already initialized - just get the auth instance
    auth = getAuth(app);
  }
} catch (error) {
  // If initializeAuth fails, fall back to getAuth
  auth = getAuth(app);
  console.warn("Failed to initialize auth with persistence:", error);
}

// ✅ Initialize services
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app, "gs://clustr-1fd1b.firebasestorage.app");

console.log("🔥 Firebase initialized:", firebaseConfig.projectId);
console.log("Storage bucket from env:", process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET);

export { app, auth, db, storage };