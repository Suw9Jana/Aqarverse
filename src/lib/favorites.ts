// src/lib/favorites.ts
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

/** Toggle a favorite for the current customer. Uses empty doc, no timestamps. */
export async function toggleFavorite(propertyId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");

  const favRef = doc(db, "Customer", uid, "favorites", propertyId);
  const snap = await getDoc(favRef);

  if (snap.exists()) {
    await deleteDoc(favRef); // unfavorite
    return { favorited: false };
  } else {
    await setDoc(favRef, {}); // favorite (empty doc)
    return { favorited: true };
  }
}

/** Check if a property is currently favorited by the user. */
export async function isFavorited(propertyId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  const favRef = doc(db, "Customer", uid, "favorites", propertyId);
  const snap = await getDoc(favRef);
  return snap.exists();
}

/** Get all favorited property IDs for the current customer. */
export async function getFavoriteIds() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const snap = await getDocs(collection(db, "Customer", uid, "favorites"));
  return snap.docs.map((d) => d.id); // propertyId is the doc id
}
