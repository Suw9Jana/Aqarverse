// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBzqOSzGt7vVWuRDPn0NTw9mdheVspwOag",
  authDomain: "aqarverse-66eb3.firebaseapp.com",
  projectId: "aqarverse-66eb3",
  storageBucket: "aqarverse-66eb3.firebasestorage.app", // ← keep this
  messagingSenderId: "569603954223",
  appId: "1:569603954223:web:882fed0d61a93e1c9dd8da",
  measurementId: "G-Q0SXS9JFGY",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
