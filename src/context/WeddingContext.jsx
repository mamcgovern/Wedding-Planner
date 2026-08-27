import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  db,
} from "../services/firebase";

import {
  WEDDING_ID,
} from "../config/wedding";

const WeddingContext =
  createContext(null);

const emptyWedding = {
  brideName: "",
  groomName: "",

  weddingDate: "",

  weekendStartDate: "",
  weekendEndDate: "",

  ceremonyTime: "",
  receptionTime: "",
  receptionEndTime: "",

  venueName: "",
  venueLocation: "",
};

export function WeddingProvider({
  children,
}) {
  const [
    wedding,
    setWedding,
  ] = useState(
    emptyWedding
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    /*
     * PUBLIC WEDDING INFORMATION
     *
     * This document contains only information that
     * is safe for anyone visiting the public wedding
     * website to read.
     */

    const weddingRef =
      doc(
        db,
        "weddings",
        WEDDING_ID,
        "public",
        "site"
      );

    const unsubscribe =
      onSnapshot(
        weddingRef,
        (snapshot) => {
          if (
            snapshot.exists()
          ) {
            const data =
              snapshot.data();

            setWedding({
              brideName:
                data.brideName ||
                "",

              groomName:
                data.groomName ||
                "",

              weddingDate:
                data.weddingDate ||
                "",

              weekendStartDate:
                data.weekendStartDate ||
                "",

              weekendEndDate:
                data.weekendEndDate ||
                "",

              ceremonyTime:
                data.ceremonyTime ||
                "",

              receptionTime:
                data.receptionTime ||
                "",

              receptionEndTime:
                data.receptionEndTime ||
                "",

              venueName:
                data.venueName ||
                "",

              venueLocation:
                data.venueLocation ||
                "",
            });
          } else {
            setWedding(
              emptyWedding
            );
          }

          setError(
            ""
          );

          setLoading(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading public wedding data:",
            firebaseError
          );

          setWedding(
            emptyWedding
          );

          setError(
            "We couldn't load the wedding information."
          );

          setLoading(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  const value =
    useMemo(
      () => ({
        wedding,
        loading,
        error,
      }),
      [
        wedding,
        loading,
        error,
      ]
    );

  return (
    <WeddingContext.Provider
      value={
        value
      }
    >
      {children}
    </WeddingContext.Provider>
  );
}

export function useWedding() {
  const context =
    useContext(
      WeddingContext
    );

  if (
    !context
  ) {
    throw new Error(
      "useWedding must be used inside WeddingProvider."
    );
  }

  return context;
}