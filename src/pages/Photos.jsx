import {
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  Camera,
  Heart,
  Images,
  LoaderCircle,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import {
  db,
} from "../services/firebase";

import {
  WEDDING_ID,
} from "../config/wedding";

function Photos() {
  const [
    albums,
    setAlbums,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /*
   * =====================================================
   * LOAD PUBLIC ALBUMS ONLY
   *
   * This is required by the new privacy rules.
   * =====================================================
   */

  useEffect(() => {
    const albumsQuery =
      query(
        collection(
          db,
          "weddings",
          WEDDING_ID,
          "photoAlbums"
        ),

        where(
          "isPublic",
          "==",
          true
        )
      );

    const unsubscribe =
      onSnapshot(
        albumsQuery,

        (
          snapshot
        ) => {
          const loaded =
            snapshot.docs.map(
              (
                albumDocument
              ) => ({
                id:
                  albumDocument.id,

                ...albumDocument.data(),
              })
            );

          /*
           * We sort locally so this query
           * does not require an additional
           * Firestore composite index.
           */

          loaded.sort(
            (
              albumA,
              albumB
            ) => {
              const orderA =
                Number(
                  albumA.sortOrder ??
                    999
                );

              const orderB =
                Number(
                  albumB.sortOrder ??
                    999
                );

              if (
                orderA !==
                orderB
              ) {
                return (
                  orderA -
                  orderB
                );
              }

              return String(
                albumA.title ||
                  ""
              ).localeCompare(
                String(
                  albumB.title ||
                    ""
                )
              );
            }
          );

          setAlbums(
            loaded
          );

          setLoading(
            false
          );
        },

        (
          firebaseError
        ) => {
          console.error(
            "Error loading photo albums:",
            firebaseError
          );

          setError(
            "We couldn't load the photo galleries."
          );

          setLoading(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  return (
    <main className="page photos-page">
      <div className="photos-page-header">
        <p className="page-eyebrow">
          Our Photos
        </p>

        <h1 className="page-title">
          Photo Galleries
        </h1>

        <p className="page-description">
          Browse our favorite moments and photos shared by our friends and family.
        </p>
      </div>

      {error && (
        <div className="photo-gallery-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="photo-gallery-loading">
          <LoaderCircle
            size={24}
            className="spinner"
          />

          Loading galleries...
        </div>
      ) : albums.length ===
        0 ? (
        <div className="photo-gallery-empty">
          <Images
            size={30}
          />

          <h2>
            Photos coming soon
          </h2>

          <p>
            Check back later for photo galleries.
          </p>
        </div>
      ) : (
        <div className="photo-album-grid">
          {albums.map(
            (
              album
            ) => {
              const Icon =
                getAlbumIcon(
                  album
                );

              return (
                <Link
                  key={
                    album.id
                  }
                  to={`/photos/${album.id}`}
                  className="photo-album-card"
                >
                  <div className="photo-album-card-icon">
                    <Icon
                      size={26}
                    />
                  </div>

                  <div className="photo-album-card-content">
                    {album.eyebrow && (
                      <p className="card-eyebrow">
                        {
                          album.eyebrow
                        }
                      </p>
                    )}

                    <h2>
                      {
                        album.title
                      }
                    </h2>

                    {album.eventDate && (
                      <div
                        style={{
                          display:
                            "flex",

                          alignItems:
                            "center",

                          gap:
                            "6px",

                          margin:
                            "6px 0 10px",

                          fontSize:
                            "0.9rem",

                          fontWeight:
                            600,

                          opacity:
                            0.75,
                        }}
                      >
                        <CalendarDays
                          size={16}
                        />

                        {
                          formatAlbumDate(
                            album.eventDate
                          )
                        }
                      </div>
                    )}

                    {album.description && (
                      <p>
                        {
                          album.description
                        }
                      </p>
                    )}

                    {album.allowGuestUploads && (
                      <span className="photo-album-upload-label">
                        Guests can add photos
                      </span>
                    )}
                  </div>
                </Link>
              );
            }
          )}
        </div>
      )}
    </main>
  );
}

function getAlbumIcon(
  album
) {
  if (
    album.allowGuestUploads
  ) {
    return Camera;
  }

  if (
    album.id ===
    "engagement"
  ) {
    return Heart;
  }

  return Images;
}

function formatAlbumDate(
  dateString
) {
  if (
    !dateString
  ) {
    return "";
  }

  const [
    year,
    month,
    day,
  ] =
    dateString
      .split("-")
      .map(
        Number
      );

  if (
    !year
    ||
    !month
    ||
    !day
  ) {
    return "";
  }

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month:
        "long",

      day:
        "numeric",

      year:
        "numeric",
    }
  ).format(
    date
  );
}

export default Photos;