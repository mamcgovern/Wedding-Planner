import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Image as ImageIcon,
  LoaderCircle,
  Plus,
  Upload,
  UserRound,
  X,
} from "lucide-react";

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

import "../styles/wedding-day-photos.css";

const WEDDING_DAY_ALBUM_ID =
  "our-wedding-day";

const MAX_FILE_SIZE =
  30 * 1024 * 1024;

const THUMBNAIL_MAX_SIZE =
  800;

const THUMBNAIL_QUALITY =
  0.82;

const SWIPE_THRESHOLD =
  50;

function WeddingDayPhotos() {
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
    uploadOpen,
    setUploadOpen,
  ] = useState(false);

  const [
    uploaderName,
    setUploaderName,
  ] = useState("");

  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState([]);

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

  useEffect(() => {
    const albumRef =
      doc(
        db,
        "weddings",
        WEDDING_ID,
        "photoAlbums",
        WEDDING_DAY_ALBUM_ID
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

            setLoadingAlbum(
              false
            );

            setLoadingPhotos(
              false
            );

            return;
          }

          setAlbum({
            id:
              snapshot.id,

            ...snapshot.data(),
          });

          setLoadingAlbum(
            false
          );
        },

        (
          firebaseError
        ) => {
          console.error(
            "Could not load wedding day album:",
            firebaseError
          );

          setAlbum(
            null
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
  }, []);

  useEffect(() => {
    if (
      !album
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
          WEDDING_DAY_ALBUM_ID
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
                          `Could not load ${data.fileName}:`,
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
              "Could not load wedding photos:",
              loadError
            );

            setError(
              "We couldn't load all of the photos."
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
            "Wedding photo listener failed:",
            firebaseError
          );

          setError(
            "We couldn't load the wedding photos."
          );

          setLoadingPhotos(
            false
          );
        }
      );

    return unsubscribe;
  }, [
    album,
  ]);

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
          "Could not load full wedding photo:",
          storageError
        );

        if (
          !cancelled
        ) {
          setError(
            "We couldn't load that photo."
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

  const closeLightbox =
    () => {
      setSelectedPhotoId(
        null
      );

      setLightboxUrl(
        ""
      );
    };

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

  useEffect(() => {
    if (
      !selectedPhoto
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
    selectedPhoto,
    selectedPhotoIndex,
    photos,
  ]);

  useEffect(() => {
    if (
      !uploadOpen
      &&
      !selectedPhoto
    ) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    uploadOpen,
    selectedPhoto,
  ]);

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
          "wedding-photo";

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
          "Could not download wedding photo:",
          downloadError
        );

        setError(
          "We couldn't download that photo."
        );
      }
    };

  const openUploadModal =
    () => {
      setError("");
      setSuccess("");

      setUploadOpen(
        true
      );
    };

  const closeUploadModal =
    () => {
      if (
        uploading
      ) {
        return;
      }

      setUploadOpen(
        false
      );

      setSelectedFiles(
        []
      );

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    };

  const handleChoosePhotos =
    () => {
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
        return;
      }

      const invalidFile =
        files.find(
          (
            file
          ) =>
            !isSupportedImage(
              file
            )
        );

      if (
        invalidFile
      ) {
        setError(
          `${invalidFile.name} isn't a supported image.`
        );

        event.target.value =
          "";

        return;
      }

      const oversizedFile =
        files.find(
          (
            file
          ) =>
            file.size >=
            MAX_FILE_SIZE
        );

      if (
        oversizedFile
      ) {
        setError(
          `${oversizedFile.name} is too large. Each photo must be smaller than 30 MB.`
        );

        event.target.value =
          "";

        return;
      }

      setError("");

      setSelectedFiles(
        files
      );
    };

  const handleUpload =
    async () => {
      if (
        !album?.isPublic
        ||
        !album?.allowGuestUploads
      ) {
        setError(
          "Photo sharing is not available right now."
        );

        return;
      }

      if (
        selectedFiles.length ===
        0
      ) {
        setError(
          "Choose at least one photo first."
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
          await uploadWeddingPhoto(
            file,
            uploaderName.trim()
          );

          successful +=
            1;
        } catch (
          uploadError
        ) {
          console.error(
            `Could not upload ${file.name}:`,
            uploadError
          );

          failures.push({
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

        setUploading(
          false
        );

        setUploadOpen(
          false
        );

        setSuccess(
          successful ===
          1
            ? "Thank you for capturing this moment with us. Your photo has been added!"
            : `Thank you for capturing this moment with us. ${successful} photos have been added!`
        );

        return;
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
          } added successfully.`
        );
      }

      setError(
        failures
          .map(
            (
              failure
            ) =>
              `• ${failure.fileName} — ${failure.message}`
          )
          .join(
            "\n"
          )
      );

      setUploading(
        false
      );
    };

  if (
    loadingAlbum
  ) {
    return (
      <main className="wedding-day-photo-page">
        <div className="wedding-day-loading">
          <Heart
            size={24}
          />

          <span>
            Loading our wedding photos...
          </span>
        </div>
      </main>
    );
  }

  if (
    !album
  ) {
    return (
      <main className="wedding-day-photo-page">
        <section className="wedding-day-unavailable">
          <Heart
            size={28}
          />

          <h1>
            Our Wedding Day
          </h1>

          <p>
            Our wedding gallery isn't available quite yet.
          </p>
        </section>
      </main>
    );
  }

  const uploadsEnabled =
    Boolean(
      album.isPublic
      &&
      album.allowGuestUploads
    );

  return (
    <main className="wedding-day-photo-page">
      <section className="wedding-day-hero">
        <div className="wedding-day-hero-decoration">
          <span />

          <Heart
            size={17}
            strokeWidth={1.5}
          />

          <span />
        </div>

        <p className="wedding-day-eyebrow">
          {album.eventDate
            ? formatAlbumDate(
                album.eventDate
              )
            : "April 24, 2027"}
        </p>

        <h1>
          {album.title ||
            "Our Wedding Day"}
        </h1>

        {album.description && (
          <p className="wedding-day-description">
            {
              album.description
            }
          </p>
        )}

        <p className="wedding-day-location">
          Manchester, Iowa
        </p>

        <div className="wedding-day-scroll-note">
          <Camera
            size={16}
          />

          <span>
            Photos from our favorite day
          </span>
        </div>
      </section>

      {error && (
        <div className="wedding-day-message wedding-day-message-error">
          {error}
        </div>
      )}

      {success && (
        <div className="wedding-day-message wedding-day-message-success">
          <Check
            size={18}
          />

          <span>
            {success}
          </span>
        </div>
      )}

      <section className="wedding-day-gallery-section">
        <div className="wedding-day-gallery-heading">
          <div>
            <p>
              The Gallery
            </p>

            <h2>
              Captured Moments
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
          <div className="wedding-day-gallery-loading">
            <LoaderCircle
              className="spinner"
              size={24}
            />

            <span>
              Loading photos...
            </span>
          </div>
        ) : photos.length ===
          0 ? (
          <div className="wedding-day-empty">
            <Camera
              size={30}
            />

            <h2>
              The gallery is just getting started
            </h2>

            <p>
              Share a photo and help us fill it with memories from today.
            </p>
          </div>
        ) : (
          <div className="wedding-day-gallery">
            {photos.map(
              (
                photo
              ) => (
                <div
                  className="wedding-day-photo-card"
                  key={
                    photo.id
                  }
                >
                  <button
                    type="button"
                    className="wedding-day-photo"
                    onClick={() =>
                      setSelectedPhotoId(
                        photo.id
                      )
                    }
                    aria-label={`View ${
                      photo.fileName ||
                      "wedding photo"
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
                      <div className="wedding-day-photo-unavailable">
                        <ImageIcon
                          size={24}
                        />
                      </div>
                    )}
                  </button>

                  {photo.uploaderName && (
                    <div className="wedding-day-photo-credit">
                      <UserRound
                        size={13}
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

      {uploadsEnabled && (
        <section className="wedding-day-share-section">
          <div className="wedding-day-share-mark">
            <Heart
              size={21}
              strokeWidth={1.5}
            />
          </div>

          <h2>
            Have a moment to share?
          </h2>

          <p>
            We'd love to see the day through your eyes.
          </p>

          <button
            type="button"
            className="wedding-day-share-button"
            onClick={
              openUploadModal
            }
          >
            <Plus
              size={19}
            />

            Share Your Photos
          </button>
        </section>
      )}

      <footer className="wedding-day-footer">
        <Heart
          size={14}
          fill="currentColor"
        />

        <span>
          Maddie & Nick
        </span>

        <Heart
          size={14}
          fill="currentColor"
        />
      </footer>

      {uploadsEnabled && (
        <button
          type="button"
          className="wedding-day-floating-upload"
          onClick={
            openUploadModal
          }
        >
          <Plus
            size={20}
          />

          <span>
            Add Photos
          </span>
        </button>
      )}

      {uploadOpen && (
        <div
          className="wedding-day-upload-backdrop"
          role="presentation"
          onClick={
            closeUploadModal
          }
        >
          <section
            className="wedding-day-upload-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wedding-day-upload-title"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="wedding-day-upload-handle" />

            <button
              type="button"
              className="wedding-day-modal-close"
              onClick={
                closeUploadModal
              }
              disabled={
                uploading
              }
              aria-label="Close upload form"
            >
              <X
                size={20}
              />
            </button>

            <div className="wedding-day-upload-icon">
              <Camera
                size={23}
              />
            </div>

            <p className="wedding-day-modal-eyebrow">
              Our Wedding Day
            </p>

            <h2 id="wedding-day-upload-title">
              Share Your Photos
            </h2>

            <p className="wedding-day-modal-description">
              Add your favorite photos from our wedding day. They will appear in the gallery for everyone to enjoy.
            </p>

            <label className="wedding-day-form-field">
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
                maxLength={
                  100
                }
                placeholder="Your name"
                disabled={
                  uploading
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

            <button
              type="button"
              className="wedding-day-file-picker"
              onClick={
                handleChoosePhotos
              }
              disabled={
                uploading
              }
            >
              <ImageIcon
                size={21}
              />

              <span>
                <strong>
                  {selectedFiles.length >
                  0
                    ? `${selectedFiles.length} ${
                        selectedFiles.length ===
                        1
                          ? "photo selected"
                          : "photos selected"
                      }`
                    : "Choose Photos"}
                </strong>

                <small>
                  JPG, PNG, HEIC and other image formats
                </small>
              </span>
            </button>

            {error && (
              <div className="wedding-day-modal-error">
                {error}
              </div>
            )}

            <button
              type="button"
              className="wedding-day-upload-submit"
              onClick={
                handleUpload
              }
              disabled={
                uploading
                ||
                selectedFiles.length ===
                  0
              }
            >
              {uploading ? (
                <>
                  <LoaderCircle
                    size={19}
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
                    size={19}
                  />

                  Upload{" "}
                  {selectedFiles.length >
                  0
                    ? selectedFiles.length
                    : ""}{" "}
                  {selectedFiles.length ===
                  1
                    ? "Photo"
                    : "Photos"}
                </>
              )}
            </button>

            <p className="wedding-day-upload-note">
              Thank you for helping us remember every little moment.
            </p>
          </section>
        </div>
      )}

      {selectedPhoto && (
        <div
          className="wedding-day-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Wedding photo viewer"
          onClick={
            closeLightbox
          }
        >
          <button
            type="button"
            className="wedding-day-lightbox-close"
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
                className="wedding-day-lightbox-nav wedding-day-lightbox-previous"
                onClick={(
                  event
                ) => {
                  event.stopPropagation();

                  showPreviousPhoto();
                }}
                aria-label="Previous photo"
              >
                <ChevronLeft
                  size={30}
                />
              </button>

              <button
                type="button"
                className="wedding-day-lightbox-nav wedding-day-lightbox-next"
                onClick={(
                  event
                ) => {
                  event.stopPropagation();

                  showNextPhoto();
                }}
                aria-label="Next photo"
              >
                <ChevronRight
                  size={30}
                />
              </button>
            </>
          )}

          <div
            className="wedding-day-lightbox-content"
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
            <div className="wedding-day-lightbox-image">
              {loadingLightbox ? (
                <div className="wedding-day-lightbox-loading">
                  <LoaderCircle
                    className="spinner"
                    size={28}
                  />

                  <span>
                    Loading photo...
                  </span>
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
                />
              ) : (
                <div className="wedding-day-lightbox-loading">
                  <ImageIcon
                    size={28}
                  />

                  <span>
                    Photo unavailable
                  </span>
                </div>
              )}
            </div>

            <div className="wedding-day-lightbox-footer">
              <div className="wedding-day-lightbox-details">
                {selectedPhoto.uploaderName && (
                  <div className="wedding-day-lightbox-credit">
                    <UserRound
                      size={15}
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

                <span className="wedding-day-lightbox-count">
                  {selectedPhotoIndex +
                    1}{" "}
                  of{" "}
                  {
                    photos.length
                  }
                </span>
              </div>

              <button
                type="button"
                className="wedding-day-lightbox-download"
                onClick={
                  handleDownloadOriginal
                }
              >
                <Download
                  size={17}
                />

                <span>
                  Download Original
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

async function uploadWeddingPhoto(
  file,
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
    `weddings/${WEDDING_ID}/photos/${WEDDING_DAY_ALBUM_ID}/${uniqueName}`;

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
      `weddings/${WEDDING_ID}/photos/${WEDDING_DAY_ALBUM_ID}/display/${displayName}`;

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
    `weddings/${WEDDING_ID}/photos/${WEDDING_DAY_ALBUM_ID}/thumbnails/${thumbnailName}`;

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
      albumId:
        WEDDING_DAY_ALBUM_ID,

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
      "We couldn't convert this HEIC photo."
    );
  }

  return converted;
}

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
        "We couldn't prepare this photo."
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
              "We couldn't read this image."
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
                "We couldn't prepare the photo."
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

function getUploadErrorMessage(
  error
) {
  if (
    error?.code ===
    "storage/unauthorized"
  ) {
    return "We don't currently have permission to upload this photo.";
  }

  if (
    error?.code ===
    "permission-denied"
  ) {
    return "Photo uploads aren't available right now.";
  }

  return (
    error?.message
    ||
    "Something went wrong."
  );
}

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
      month:
        "long",
      day:
        "numeric",
      year:
        "numeric",
    }
  );
}

export default WeddingDayPhotos;