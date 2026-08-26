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
  auth,
} from "../services/firebase";

const AuthContext =
  createContext(null);

const googleProvider =
  new GoogleAuthProvider();

export function AuthProvider({
  children,
}) {
  const [
    user,
    setUser,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(
            currentUser
          );

          setLoading(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  const loginWithGoogle =
    async () => {
      return signInWithPopup(
        auth,
        googleProvider
      );
    };

  const logout =
    async () => {
      return signOut(
        auth
      );
    };

  const value = {
    user,
    loading,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}