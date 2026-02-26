import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAD2BXYwGlYrTxkE-0i5s0D8hiIJDEYtms",
  authDomain: "city-fix-3bfd4.firebaseapp.com",
  projectId: "city-fix-3bfd4",
  storageBucket: "city-fix-3bfd4.firebasestorage.app",
  messagingSenderId: "991732008559",
  appId: "1:991732008559:web:41b1a77d78dab24f3eef9a",
  measurementId: "G-858MPCE53K"
};

// Initialize Firebase (Prevents "app already exists" errors during hot-reloads)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);