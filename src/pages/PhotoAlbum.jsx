import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Image as ImageIcon,
  LoaderCircle,
  LockKeyhole,
  Upload,
  UserRound,
  X,
} from "lucide-react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

import {
  db,
  storage,
} from "../services/firebase";

import {
  WEDDING_ID,
} from "../config/wedding";

const MAX_FILE_SIZE =
  30 * 1024 * 1024;

const THUMBNAIL_MAX_SIZE =
  800;

const THUMBNAIL_QUALITY =
  0.82;

const SWIPE_THRESHOLD =
  50;

function PhotoAlbum() {
  const {
    albumId,
  } =
    useParams();

  const fileInputRef =
    useRef(null);

  const touchStartXRef =
    useRef(null);

  const [
    album,
    setAlbum,
  ] = useState(null);

  const [
    loadingAlbum,
    setLoadingAlbum,
  ] = useState(true);

  const [
    albumUnavailable,
    setAlbumUnavailable,
  ] = useState(false);

  const [
    photos,
    setPhotos,
  ] = useState([]);

  const [
    loadingPhotos,
    setLoadingPhotos,
  ] = useState(true);

  const [
    selectedPhotoId,
    setSelectedPhotoId,
  ] = useState(null);

  const [
    lightboxUrl,
    setLightboxUrl,
  ] = useState("");

  const [
    loadingLightbox,
    setLoadingLightbox,
  ] = useState(false);

  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState([]);

  const [
    uploaderName,
    setUploaderName,
  ] = useState("");

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    uploadProgress,
    setUploadProgress,
  ] = useState({
    current: 0,
    total: 0,
  });

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  /*
   * =====================================================
   * LOAD ALBUM
   * =====================================================
   */

  useEffect(() => {
    if (
      !albumId
    ) {
      setLoadingAlbum(
        false
      );

      setAlbumUnavailable(
        true
      );

      return undefined;
    }

    setLoadingAlbum(
      true
    );

    setAlbumUnavailable(
      false
    );

    const albumRef =
      doc(
        db,
        "weddings",
        WEDDING_ID,
        "photoAlbums",
        albumId
      );

    const unsubscribe =
      onSnapshot(
        albumRef,

        (
          snapshot
        ) => {
          if (
            !snapshot.exists()
          ) {
            setAlbum(
              null
            );

            setAlbumUnavailable(
              true
            );

            setLoadingAlbum(
              false
            );

            return;
          }

          setAlbum({
            id:
              snapshot.id,

            ...snapshot.data(),
          });

          setAlbumUnavailable(
            false
          );

          setLoadingAlbum(
            false
          );
        },

        (
          firebaseError
        ) => {
          console.error(
            "Could not load album:",
            firebaseError
          );

          setAlbum(
            null
          );

          setAlbumUnavailable(
            true
          );

          setLoadingAlbum(
            false
          );

          setLoadingPhotos(
            false
          );
        }
      );

    return unsubscribe;
  }, [
    albumId,
  ]);

  /*
   * =====================================================
   * LOAD PHOTOS
   * =====================================================
   */

  useEffect(() => {
    if (
      !album
      ||
      !albumId
    ) {
      setPhotos(
        []
      );

      setLoadingPhotos(
        false
      );

      return undefined;
    }

    setLoadingPhotos(
      true
    );

    const photosQuery =
      query(
        collection(
          db,
          "weddings",
          WEDDING_ID,
          "photos"
        ),

        where(
          "albumId",
          "==",
          albumId
        )
      );

    const unsubscribe =
      onSnapshot(
        photosQuery,

        async (
          snapshot
        ) => {
          try {
            const loaded =
              await Promise.all(
                snapshot.docs.map(
                  async (
                    photoDocument
                  ) => {
                    const data =
                      photoDocument.data();

                    const previewPath =
                      data.thumbnailPath
                      ||
                      data.displayPath
                      ||
                      data.storagePath;

                    let thumbnailUrl =
                      "";

                    if (
                      previewPath
                    ) {
                      try {
                        thumbnailUrl =
                          await getDownloadURL(
                            ref(
                              storage,
                              previewPath
                            )
                          );
                      } catch (
                        storageError
                      ) {
                        console.error(
                          `Could not load thumbnail for ${
                            data.fileName ||
                            photoDocument.id
                          }:`,
                          storageError
                        );
                      }
                    }

                    return {
                      id:
                        photoDocument.id,

                      ...data,

                      thumbnailUrl,
                    };
                  }
                )
              );

            loaded.sort(
              (
                photoA,
                photoB
              ) => {
                const timeA =
                  photoA.uploadedAt
                    ?.toMillis?.()
                  || 0;

                const timeB =
                  photoB.uploadedAt
                    ?.toMillis?.()
                  || 0;

                return (
                  timeA -
                  timeB
                );
              }
            );

            setPhotos(
              loaded
            );

            setLoadingPhotos(
              false
            );
          } catch (
            loadError
          ) {
            console.error(
              "Could not load photos:",
              loadError
            );

            setError(
              "We couldn't load the photos in this gallery."
            );

            setLoadingPhotos(
              false
            );
          }
        },

        (
          firebaseError
        ) => {
          console.error(
            "Could not load gallery photos:",
            firebaseError
          );

          setError(
            "We couldn't load the photos in this gallery."
          );

          setLoadingPhotos(
            false
          );
        }
      );

    return unsubscribe;
  }, [
    album,
    albumId,
  ]);

  /*
   * =====================================================
   * SELECTED PHOTO
   * =====================================================
   */

  const selectedPhoto =
    useMemo(
      () =>
        photos.find(
          (
            photo
          ) =>
            photo.id ===
            selectedPhotoId
        )
        ||
        null,
      [
        photos,
        selectedPhotoId,
      ]
    );

  const selectedPhotoIndex =
    useMemo(
      () =>
        photos.findIndex(
          (
            photo
          ) =>
            photo.id ===
            selectedPhotoId
        ),
      [
        photos,
        selectedPhotoId,
      ]
    );

  /*
   * =====================================================
   * LOAD FULL DISPLAY IMAGE
   * =====================================================
   */

  useEffect(() => {
    let cancelled =
      false;

    async function loadFullImage() {
      if (
        !selectedPhoto
      ) {
        setLightboxUrl(
          ""
        );

        setLoadingLightbox(
          false
        );

        return;
      }

      const displayPath =
        selectedPhoto.displayPath
        ||
        selectedPhoto.storagePath;

      if (
        !displayPath
      ) {
        setLightboxUrl(
          ""
        );

        return;
      }

      setLoadingLightbox(
        true
      );

      setLightboxUrl(
        ""
      );

      try {
        const url =
          await getDownloadURL(
            ref(
              storage,
              displayPath
            )
          );

        if (
          !cancelled
        ) {
          setLightboxUrl(
            url
          );
        }
      } catch (
        storageError
      ) {
        console.error(
          "Could not load full photo:",
          storageError
        );

        if (
          !cancelled
        ) {
          setError(
            "We couldn't load the full-size photo."
          );
        }
      } finally {
        if (
          !cancelled
        ) {
          setLoadingLightbox(
            false
          );
        }
      }
    }

    loadFullImage();

    return () => {
      cancelled =
        true;
    };
  }, [
    selectedPhoto,
  ]);

  /*
   * =====================================================
   * PRELOAD NEXT PHOTO
   * =====================================================
   */

  useEffect(() => {
    if (
      selectedPhotoIndex <
        0
      ||
      photos.length <
        2
    ) {
      return;
    }

    let cancelled =
      false;

    async function preloadNext() {
      const nextIndex =
        (
          selectedPhotoIndex +
          1
        ) %
        photos.length;

      const nextPhoto =
        photos[
          nextIndex
        ];

      const path =
        nextPhoto?.displayPath
        ||
        nextPhoto?.storagePath;

      if (
        !path
      ) {
        return;
      }

      try {
        const url =
          await getDownloadURL(
            ref(
              storage,
              path
            )
          );

        if (
          cancelled
        ) {
          return;
        }

        const image =
          new Image();

        image.src =
          url;
      } catch (
        preloadError
      ) {
        console.debug(
          "Could not preload next photo:",
          preloadError
        );
      }
    }

    preloadNext();

    return () => {
      cancelled =
        true;
    };
  }, [
    selectedPhotoIndex,
    photos,
  ]);

  /*
   * =====================================================
   * LIGHTBOX NAVIGATION
   * =====================================================
   */

  const showPreviousPhoto =
    () => {
      if (
        photos.length ===
        0
      ) {
        return;
      }

      const nextIndex =
        selectedPhotoIndex <=
        0
          ? photos.length -
            1
          : selectedPhotoIndex -
            1;

      setSelectedPhotoId(
        photos[
          nextIndex
        ].id
      );
    };

  const showNextPhoto =
    () => {
      if (
        photos.length ===
        0
      ) {
        return;
      }

      const nextIndex =
        selectedPhotoIndex >=
        photos.length -
          1
          ? 0
          : selectedPhotoIndex +
            1;

      setSelectedPhotoId(
        photos[
          nextIndex
        ].id
      );
    };

  const closeLightbox =
    () => {
      setSelectedPhotoId(
        null
      );

      setLightboxUrl(
        ""
      );
    };

  /*
   * =====================================================
   * KEYBOARD
   * =====================================================
   */

  useEffect(() => {
    if (
      !selectedPhotoId
    ) {
      return undefined;
    }

    const handleKeyDown =
      (
        event
      ) => {
        if (
          event.key ===
          "Escape"
        ) {
          closeLightbox();
        }

        if (
          event.key ===
          "ArrowLeft"
        ) {
          showPreviousPhoto();
        }

        if (
          event.key ===
          "ArrowRight"
        ) {
          showNextPhoto();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    selectedPhotoId,
    selectedPhotoIndex,
    photos,
  ]);

  /*
   * =====================================================
   * TOUCH / SWIPE
   * =====================================================
   */

  const handleTouchStart =
    (
      event
    ) => {
      touchStartXRef.current =
        event.touches[
          0
        ]?.clientX ??
        null;
    };

  const handleTouchEnd =
    (
      event
    ) => {
      if (
        touchStartXRef.current ===
        null
      ) {
        return;
      }

      const endX =
        event.changedTouches[
          0
        ]?.clientX;

      if (
        typeof endX !==
        "number"
      ) {
        touchStartXRef.current =
          null;

        return;
      }

      const difference =
        endX -
        touchStartXRef.current;

      if (
        Math.abs(
          difference
        ) >=
        SWIPE_THRESHOLD
      ) {
        if (
          difference >
          0
        ) {
          showPreviousPhoto();
        } else {
          showNextPhoto();
        }
      }

      touchStartXRef.current =
        null;
    };

  /*
   * =====================================================
   * DOWNLOAD ORIGINAL
   * =====================================================
   */

  const handleDownloadOriginal =
    async () => {
      if (
        !selectedPhoto?.storagePath
      ) {
        return;
      }

      try {
        const url =
          await getDownloadURL(
            ref(
              storage,
              selectedPhoto.storagePath
            )
          );

        const anchor =
          document.createElement(
            "a"
          );

        anchor.href =
          url;

        anchor.download =
          selectedPhoto.fileName
          ||
          "photo";

        anchor.target =
          "_blank";

        anchor.rel =
          "noopener noreferrer";

        document.body.appendChild(
          anchor
        );

        anchor.click();

        anchor.remove();
      } catch (
        downloadError
      ) {
        console.error(
          "Could not download original:",
          downloadError
        );

        setError(
          "We couldn't download the original photo."
        );
      }
    };

  /*
   * =====================================================
   * GUEST UPLOAD PERMISSION
   * =====================================================
   */

  const canGuestUpload =
    Boolean(
      album?.isPublic
      &&
      album?.allowGuestUploads
    );

  /*
   * =====================================================
   * FILE SELECTION
   * =====================================================
   */

  const handleChoosePhotos =
    () => {
      setError("");
      setSuccess("");

      fileInputRef.current?.click();
    };

  const handleFileChange =
    (
      event
    ) => {
      const files =
        Array.from(
          event.target.files ||
            []
        );

      if (
        files.length ===
        0
      ) {
        setSelectedFiles(
          []
        );

        return;
      }

      const invalid =
        files.find(
          (
            file
          ) =>
            !isSupportedImage(
              file
            )
        );

      if (
        invalid
      ) {
        setError(
          `Unsupported file: ${invalid.name}`
        );

        setSelectedFiles(
          []
        );

        event.target.value =
          "";

        return;
      }

      const oversized =
        files.find(
          (
            file
          ) =>
            file.size >=
            MAX_FILE_SIZE
        );

      if (
        oversized
      ) {
        setError(
          `${oversized.name} is too large. Each photo must be smaller than 30 MB.`
        );

        setSelectedFiles(
          []
        );

        event.target.value =
          "";

        return;
      }

      setError("");
      setSuccess("");

      setSelectedFiles(
        files
      );
    };

  /*
   * =====================================================
   * GUEST BULK UPLOAD
   * =====================================================
   */

  const handleGuestUpload =
    async () => {
      if (
        !canGuestUpload
        ||
        !album
      ) {
        setError(
          "Guest uploads are not available for this gallery."
        );

        return;
      }

      if (
        selectedFiles.length ===
        0
      ) {
        setError(
          "Choose at least one photo."
        );

        return;
      }

      setUploading(
        true
      );

      setError("");
      setSuccess("");

      setUploadProgress({
        current: 0,
        total:
          selectedFiles.length,
      });

      const failures =
        [];

      let successful =
        0;

      for (
        let index =
          0;
        index <
        selectedFiles.length;
        index +=
          1
      ) {
        const file =
          selectedFiles[
            index
          ];

        try {
          await uploadGuestPhoto(
            file,
            album.id,
            uploaderName.trim()
          );

          successful +=
            1;
        } catch (
          uploadError
        ) {
          console.error(
            `Upload failed for ${file.name}:`,
            uploadError
          );

          failures.push({
            file,

            fileName:
              file.name,

            message:
              getUploadErrorMessage(
                uploadError
              ),
          });
        }

        setUploadProgress({
          current:
            index +
            1,

          total:
            selectedFiles.length,
        });
      }

      if (
        failures.length ===
        0
      ) {
        setSelectedFiles(
          []
        );

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }

        setSuccess(
          `${successful} ${
            successful ===
            1
              ? "photo was"
              : "photos were"
          } added. Thank you for sharing!`
        );
      } else {
        setSelectedFiles(
          failures.map(
            (
              failure
            ) =>
              failure.file
          )
        );

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }

        if (
          successful >
          0
        ) {
          setSuccess(
            `${successful} ${
              successful ===
              1
                ? "photo was"
                : "photos were"
            } uploaded successfully.`
          );
        }

        const failureList =
          failures
            .map(
              (
                failure
              ) =>
                `• ${failure.fileName} — ${failure.message}`
            )
            .join(
              "\n"
            );

        setError(
          `${failures.length} ${
            failures.length ===
            1
              ? "photo failed"
              : "photos failed"
          }:\n${failureList}`
        );
      }

      setUploading(
        false
      );
    };

  /*
   * =====================================================
   * LOADING
   * =====================================================
   */

  if (
    loadingAlbum
  ) {
    return (
      <main className="page photo-album-page">
        <div className="photo-gallery-loading">
          <LoaderCircle
            size={24}
            className="spinner"
          />

          Loading gallery...
        </div>
      </main>
    );
  }

  if (
    albumUnavailable
    ||
    !album
  ) {
    return (
      <main className="page photo-album-page">
        <Link
          to="/photos"
          className="photo-album-back"
        >
          <ArrowLeft
            size={17}
          />

          Back to Photos
        </Link>

        <div className="photo-gallery-empty">
          <ImageIcon
            size={30}
          />

          <h1>
            Gallery unavailable
          </h1>

          <p>
            This gallery may not be available yet.
          </p>

          <Link
            to="/photos"
            className="primary-button"
          >
            View Photo Galleries
          </Link>
        </div>
      </main>
    );
  }

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <main className="page photo-album-page">
      <Link
        to="/photos"
        className="photo-album-back"
      >
        <ArrowLeft
          size={17}
        />

        All Galleries
      </Link>

      <header className="photo-album-header">
        {album.eyebrow && (
          <p className="page-eyebrow">
            {
              album.eyebrow
            }
          </p>
        )}

        <h1>
          {
            album.title
          }
        </h1>

        {album.eventDate && (
          <div className="photo-album-date">
            <CalendarDays
              size={18}
            />

            <span>
              {
                formatAlbumDate(
                  album.eventDate
                )
              }
            </span>
          </div>
        )}

        {!album.isPublic && (
          <div className="photo-album-private-preview">
            <LockKeyhole
              size={17}
            />

            <span>
              Private preview. Guests cannot see this gallery yet.
            </span>
          </div>
        )}

        {album.description && (
          <p className="page-description">
            {
              album.description
            }
          </p>
        )}
      </header>

      {error && (
        <div
          className="photo-gallery-error"
          style={{
            whiteSpace:
              "pre-line",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div className="photos-admin-success">
          {success}
        </div>
      )}

      {/*
       * =================================================
       * GUEST UPLOAD
       * =================================================
       */}

      {canGuestUpload && (
        <section className="photo-upload-card">
          <div className="photo-upload-card-heading">
            <div className="photo-upload-card-icon">
              <Upload
                size={21}
              />
            </div>

            <div>
              <p className="card-eyebrow">
                Share Your Photos
              </p>

              <h2>
                Add to this gallery
              </h2>
            </div>
          </div>

          <p>
            Have photos from the celebration? Add them here so everyone can enjoy them.
          </p>

          <label className="form-field">
            <span>
              Your name
            </span>

            <input
              type="text"
              value={
                uploaderName
              }
              onChange={(
                event
              ) =>
                setUploaderName(
                  event.target.value
                )
              }
              placeholder="Optional"
              maxLength={
                100
              }
            />

            <small>
              Your name will appear with the photos you share.
            </small>
          </label>

          <input
            ref={
              fileInputRef
            }
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            hidden
            onChange={
              handleFileChange
            }
          />

          <div className="photo-upload-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={
                handleChoosePhotos
              }
              disabled={
                uploading
              }
            >
              <ImageIcon
                size={17}
              />

              Choose Photos
            </button>

            {selectedFiles.length >
              0 && (
              <button
                type="button"
                className="primary-button"
                onClick={
                  handleGuestUpload
                }
                disabled={
                  uploading
                }
              >
                {uploading ? (
                  <>
                    <LoaderCircle
                      size={17}
                      className="spinner"
                    />

                    Uploading{" "}
                    {
                      uploadProgress.current
                    }{" "}
                    of{" "}
                    {
                      uploadProgress.total
                    }
                  </>
                ) : (
                  <>
                    <Upload
                      size={17}
                    />

                    Upload{" "}
                    {
                      selectedFiles.length
                    }{" "}
                    {selectedFiles.length ===
                    1
                      ? "Photo"
                      : "Photos"}
                  </>
                )}
              </button>
            )}
          </div>

          {selectedFiles.length >
            0 &&
            !uploading && (
              <p className="photo-upload-selected">
                {
                  selectedFiles.length
                }{" "}
                {selectedFiles.length ===
                1
                  ? "photo selected"
                  : "photos selected"}
              </p>
            )}
        </section>
      )}

      {/*
       * =================================================
       * PHOTO GRID
       * =================================================
       */}

      <section className="photo-gallery-section">
        <div className="photo-gallery-heading">
          <div>
            <p className="card-eyebrow">
              Gallery
            </p>

            <h2>
              {
                album.title
              }
            </h2>
          </div>

          {!loadingPhotos && (
            <span>
              {
                photos.length
              }{" "}
              {photos.length ===
              1
                ? "photo"
                : "photos"}
            </span>
          )}
        </div>

        {loadingPhotos ? (
          <div className="photo-gallery-loading">
            <LoaderCircle
              size={24}
              className="spinner"
            />

            Loading photos...
          </div>
        ) : photos.length ===
          0 ? (
          <div className="photo-gallery-empty">
            <ImageIcon
              size={30}
            />

            <h2>
              No photos yet
            </h2>

            <p>
              {canGuestUpload
                ? "Be the first to share a photo."
                : "Photos will appear here soon."}
            </p>
          </div>
        ) : (
          <div className="photo-gallery-grid">
            {photos.map(
              (
                photo
              ) => (
                <div
                  key={
                    photo.id
                  }
                  className="photo-gallery-card"
                >
                  <button
                    type="button"
                    className="photo-gallery-item"
                    onClick={() =>
                      setSelectedPhotoId(
                        photo.id
                      )
                    }
                    aria-label={`Open ${
                      photo.fileName ||
                      "photo"
                    }`}
                  >
                    {photo.thumbnailUrl ? (
                      <img
                        src={
                          photo.thumbnailUrl
                        }
                        alt={
                          photo.fileName ||
                          "Wedding photo"
                        }
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="photo-gallery-image-unavailable">
                        <ImageIcon
                          size={24}
                        />

                        <span>
                          Photo unavailable
                        </span>
                      </div>
                    )}
                  </button>

                  {photo.uploaderName && (
                    <div className="photo-gallery-credit">
                      <UserRound
                        size={14}
                      />

                      <span>
                        Shared by{" "}
                        <strong>
                          {
                            photo.uploaderName
                          }
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/*
       * =================================================
       * LIGHTBOX
       * =================================================
       */}

      {selectedPhoto && (
        <div
          className="photo-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={
            closeLightbox
          }
        >
          <div
            className="photo-lightbox-content"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
            onTouchStart={
              handleTouchStart
            }
            onTouchEnd={
              handleTouchEnd
            }
          >
            <button
              type="button"
              className="photo-lightbox-close"
              onClick={
                closeLightbox
              }
              aria-label="Close photo"
            >
              <X
                size={24}
              />
            </button>

            {photos.length >
              1 && (
              <>
                <button
                  type="button"
                  className="photo-lightbox-nav photo-lightbox-prev"
                  onClick={
                    showPreviousPhoto
                  }
                  aria-label="Previous photo"
                >
                  <ChevronLeft
                    size={30}
                  />
                </button>

                <button
                  type="button"
                  className="photo-lightbox-nav photo-lightbox-next"
                  onClick={
                    showNextPhoto
                  }
                  aria-label="Next photo"
                >
                  <ChevronRight
                    size={30}
                  />
                </button>
              </>
            )}

            <div className="photo-lightbox-image-wrap">
              {loadingLightbox ? (
                <div className="photo-lightbox-loading">
                  <LoaderCircle
                    size={28}
                    className="spinner"
                  />

                  Loading photo...
                </div>
              ) : lightboxUrl ? (
                <img
                  src={
                    lightboxUrl
                  }
                  alt={
                    selectedPhoto.fileName ||
                    "Wedding photo"
                  }
                  decoding="async"
                />
              ) : (
                <div className="photo-gallery-image-unavailable">
                  <ImageIcon
                    size={28}
                  />

                  <span>
                    Photo unavailable
                  </span>
                </div>
              )}
            </div>

            <div className="photo-lightbox-footer">
              <div className="photo-lightbox-details">
                {selectedPhoto.uploaderName && (
                  <div className="photo-lightbox-credit">
                    <UserRound
                      size={16}
                    />

                    <span>
                      Shared by{" "}
                      <strong>
                        {
                          selectedPhoto.uploaderName
                        }
                      </strong>
                    </span>
                  </div>
                )}

                {photos.length >
                  1 && (
                  <span className="photo-lightbox-count">
                    {selectedPhotoIndex +
                      1}{" "}
                    of{" "}
                    {
                      photos.length
                    }
                  </span>
                )}
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={
                  handleDownloadOriginal
                }
              >
                <Download
                  size={17}
                />

                Download Original
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/*
 * =========================================================
 * GUEST PHOTO UPLOAD
 * =========================================================
 */

async function uploadGuestPhoto(
  file,
  albumId,
  uploaderName
) {
  const uniqueName =
    createUniqueFileName(
      file.name
    );

  const contentType =
    getOriginalContentType(
      file
    );

  const storagePath =
    `weddings/${WEDDING_ID}/photos/${albumId}/${uniqueName}`;

  let displayBlob =
    null;

  let thumbnailSource =
    file;

  if (
    isHeicFile(
      file
    )
  ) {
    displayBlob =
      await convertHeicToPng(
        file
      );

    thumbnailSource =
      displayBlob;
  }

  const thumbnailBlob =
    await createThumbnail(
      thumbnailSource
    );

  await uploadBlob(
    file,
    storagePath,
    contentType
  );

  let displayPath =
    storagePath;

  if (
    displayBlob
  ) {
    const displayName =
      replaceExtension(
        uniqueName,
        ".png"
      );

    displayPath =
      `weddings/${WEDDING_ID}/photos/${albumId}/display/${displayName}`;

    await uploadBlob(
      displayBlob,
      displayPath,
      "image/png"
    );
  }

  const thumbnailName =
    replaceExtension(
      uniqueName,
      ".jpg"
    );

  const thumbnailPath =
    `weddings/${WEDDING_ID}/photos/${albumId}/thumbnails/${thumbnailName}`;

  await uploadBlob(
    thumbnailBlob,
    thumbnailPath,
    "image/jpeg"
  );

  await addDoc(
    collection(
      db,
      "weddings",
      WEDDING_ID,
      "photos"
    ),
    {
      albumId,

      storagePath,

      displayPath,

      thumbnailPath,

      fileName:
        file.name,

      contentType,

      size:
        file.size,

      uploaderName:
        uploaderName.slice(
          0,
          100
        ),

      uploadedAt:
        serverTimestamp(),
    }
  );
}

/*
 * =========================================================
 * HEIC
 * =========================================================
 */

async function convertHeicToPng(
  blob
) {
  const {
    heicTo,
  } =
    await import(
      "heic-to"
    );

  const converted =
    await heicTo({
      blob,

      type:
        "image/png",
    });

  if (
    !converted
  ) {
    throw new Error(
      "HEIC conversion returned no image."
    );
  }

  return converted;
}

/*
 * =========================================================
 * THUMBNAIL
 * =========================================================
 */

async function createThumbnail(
  blob
) {
  const objectUrl =
    URL.createObjectURL(
      blob
    );

  try {
    const image =
      await loadImage(
        objectUrl
      );

    const scale =
      Math.min(
        1,

        THUMBNAIL_MAX_SIZE /
          Math.max(
            image.naturalWidth,
            image.naturalHeight
          )
      );

    const width =
      Math.max(
        1,

        Math.round(
          image.naturalWidth *
            scale
        )
      );

    const height =
      Math.max(
        1,

        Math.round(
          image.naturalHeight *
            scale
        )
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      width;

    canvas.height =
      height;

    const context =
      canvas.getContext(
        "2d",
        {
          alpha:
            false,
        }
      );

    if (
      !context
    ) {
      throw new Error(
        "Could not create thumbnail."
      );
    }

    context.fillStyle =
      "#ffffff";

    context.fillRect(
      0,
      0,
      width,
      height
    );

    context.drawImage(
      image,
      0,
      0,
      width,
      height
    );

    return await canvasToBlob(
      canvas,
      "image/jpeg",
      THUMBNAIL_QUALITY
    );
  } finally {
    URL.revokeObjectURL(
      objectUrl
    );
  }
}

function loadImage(
  src
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const image =
        new Image();

      image.decoding =
        "async";

      image.onload =
        () =>
          resolve(
            image
          );

      image.onerror =
        () =>
          reject(
            new Error(
              "The browser could not decode this image."
            )
          );

      image.src =
        src;
    }
  );
}

function canvasToBlob(
  canvas,
  type,
  quality
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      canvas.toBlob(
        (
          blob
        ) => {
          if (
            blob
          ) {
            resolve(
              blob
            );
          } else {
            reject(
              new Error(
                "Could not create thumbnail."
              )
            );
          }
        },

        type,

        quality
      );
    }
  );
}

/*
 * =========================================================
 * STORAGE
 * =========================================================
 */

function uploadBlob(
  blob,
  path,
  contentType
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const isThumbnail =
        path.includes(
          "/thumbnails/"
        );

      const task =
        uploadBytesResumable(
          ref(
            storage,
            path
          ),

          blob,

          {
            contentType,

            cacheControl:
              isThumbnail
                ? "public,max-age=31536000,immutable"
                : "public,max-age=86400",
          }
        );

      task.on(
        "state_changed",
        null,
        reject,
        () =>
          resolve()
      );
    }
  );
}

/*
 * =========================================================
 * FILE HELPERS
 * =========================================================
 */

function isHeicFile(
  file
) {
  const name =
    String(
      file.name ||
        ""
    ).toLowerCase();

  const type =
    String(
      file.type ||
        ""
    ).toLowerCase();

  return (
    type.includes(
      "heic"
    )
    ||
    type.includes(
      "heif"
    )
    ||
    name.endsWith(
      ".heic"
    )
    ||
    name.endsWith(
      ".heif"
    )
  );
}

function isSupportedImage(
  file
) {
  return (
    isHeicFile(
      file
    )
    ||
    Boolean(
      file.type?.startsWith(
        "image/"
      )
    )
  );
}

function getOriginalContentType(
  file
) {
  if (
    isHeicFile(
      file
    )
  ) {
    return String(
      file.type ||
        ""
    )
      .toLowerCase()
      .includes(
        "heif"
      )
      ? "image/heif"
      : "image/heic";
  }

  return (
    file.type
    ||
    "application/octet-stream"
  );
}

function createUniqueFileName(
  originalName
) {
  const safeName =
    originalName
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      );

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}-${safeName}`;
}

function replaceExtension(
  fileName,
  extension
) {
  const dot =
    fileName.lastIndexOf(
      "."
    );

  if (
    dot ===
    -1
  ) {
    return `${fileName}${extension}`;
  }

  return `${fileName.slice(
    0,
    dot
  )}${extension}`;
}

/*
 * =========================================================
 * DATE
 * =========================================================
 */

function formatAlbumDate(
  value
) {
  if (
    !value
  ) {
    return "";
  }

  const [
    year,
    month,
    day,
  ] =
    value
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

  return new Date(
    year,
    month -
      1,
    day
  ).toLocaleDateString(
    "en-US",
    {
      weekday:
        "long",

      month:
        "long",

      day:
        "numeric",

      year:
        "numeric",
    }
  );
}

/*
 * =========================================================
 * ERRORS
 * =========================================================
 */

function getUploadErrorMessage(
  error
) {
  if (
    error?.code ===
    "storage/unauthorized"
  ) {
    return "Firebase Storage permission denied.";
  }

  if (
    error?.code ===
    "permission-denied"
  ) {
    return "Firebase permission denied.";
  }

  return (
    error?.message
    ||
    "Unknown error."
  );
}

export default PhotoAlbum;