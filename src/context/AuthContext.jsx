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
  signOut as firebaseSignOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../services/firebase";

import {
  WEDDING_ID,
} from "../config/wedding";

const AuthContext =
  createContext(null);

export function AuthProvider({
  children,
}) {
  const [
    user,
    setUser,
  ] = useState(null);

  const [
    isAdmin,
    setIsAdmin,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    authError,
    setAuthError,
  ] = useState("");

  /*
   * CHECK WHETHER A FIREBASE USER
   * IS AN APPROVED WEDDING ADMIN.
   */

  const checkAdminAccess =
    async (
      firebaseUser
    ) => {
      if (
        !firebaseUser
      ) {
        return false;
      }

      try {
        const adminRef =
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "admins",
            firebaseUser.uid
          );

        const adminSnapshot =
          await getDoc(
            adminRef
          );

        if (
          !adminSnapshot.exists()
        ) {
          return false;
        }

        const adminData =
          adminSnapshot.data();

        return (
          adminData.active ===
          true
        );
      } catch (error) {
        console.error(
          "Error checking admin access:",
          error
        );

        /*
         * IMPORTANT:
         * If we cannot verify admin access,
         * access is denied.
         *
         * We never want an error to
         * accidentally grant access.
         */

        return false;
      }
    };

  /*
   * LISTEN FOR AUTH CHANGES
   */

  useEffect(() => {
    let cancelled =
      false;

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (
          firebaseUser
        ) => {
          setLoading(
            true
          );

          setAuthError(
            ""
          );

          if (
            !firebaseUser
          ) {
            if (
              !cancelled
            ) {
              setUser(
                null
              );

              setIsAdmin(
                false
              );

              setLoading(
                false
              );
            }

            return;
          }

          const hasAdminAccess =
            await checkAdminAccess(
              firebaseUser
            );

          if (
            cancelled
          ) {
            return;
          }

          setUser(
            firebaseUser
          );

          setIsAdmin(
            hasAdminAccess
          );

          setLoading(
            false
          );
        }
      );

    return () => {
      cancelled =
        true;

      unsubscribe();
    };
  }, []);

  /*
   * GOOGLE SIGN IN
   */

  const signInWithGoogle =
    async () => {
      setAuthError(
        ""
      );

      const provider =
        new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt:
          "select_account",
      });

      try {
        const result =
          await signInWithPopup(
            auth,
            provider
          );

        return result.user;
      } catch (error) {
        console.error(
          "Google sign-in error:",
          error
        );

        setAuthError(
          "We couldn't sign you in with Google."
        );

        throw error;
      }
    };

  /*
   * SIGN OUT
   */

  const signOut =
    async () => {
      setAuthError(
        ""
      );

      try {
        await firebaseSignOut(
          auth
        );

        setUser(
          null
        );

        setIsAdmin(
          false
        );
      } catch (error) {
        console.error(
          "Sign-out error:",
          error
        );

        setAuthError(
          "We couldn't sign you out."
        );

        throw error;
      }
    };

  const value = {
    user,
    isAdmin,
    loading,
    authError,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider
      value={
        value
      }
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

  if (
    !context
  ) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}

export default AuthContext;