import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "../services/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setUserData(null);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
          setUserData({
            id: userSnapshot.id,
            ...userSnapshot.data(),
          });
        } else {
          const newUserData = {
            displayName: firebaseUser.displayName || "",
            email: firebaseUser.email || "",
            photoURL: firebaseUser.photoURL || "",
            weddingId: null,
            role: null,
            createdAt: serverTimestamp(),
          };

          await setDoc(userRef, newUserData);

          setUserData({
            id: firebaseUser.uid,
            ...newUserData,
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    const result = await signInWithPopup(auth, provider);

    return result.user;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const refreshUserData = async () => {
    if (!auth.currentUser) {
      return;
    }

    const userRef = doc(db, "users", auth.currentUser.uid);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
      setUserData({
        id: userSnapshot.id,
        ...userSnapshot.data(),
      });
    }
  };

  const value = {
    user,
    userData,
    loading,
    loginWithGoogle,
    logout,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}