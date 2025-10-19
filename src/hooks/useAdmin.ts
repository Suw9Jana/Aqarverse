import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export function useAdmin() {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "admin", u.uid));
        setIsAdmin(snap.exists() && snap.data()?.role === "admin");
      } finally {
        setChecking(false);
      }
    });
    return unsub;
  }, []);

  return { checking, isAdmin };
}
