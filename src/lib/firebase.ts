import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // 1. Import Storage

const firebaseConfig = {
  apiKey: "AIzaSyAD2BXYwGlYrTxkE-0i5s0D8hiIJDEYtms",
  authDomain: "city-fix-3bfd4.firebaseapp.com",
  projectId: "city-fix-3bfd4",
  storageBucket: "city-fix-3bfd4.firebasestorage.app",
  messagingSenderId: "991732008559",
  appId: "1:991732008559:web:41b1a77d78dab24f3eef9a",
  measurementId: "G-858MPCE53K"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); // 2. Export Storage