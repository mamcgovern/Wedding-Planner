import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  CSS,
} from "@dnd-kit/utilities";

import {
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Globe2,
  GripVertical,
  Image as ImageIcon,
  LoaderCircle,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import {
  deleteObject,
  getBytes,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

import {
  httpsCallable,
} from "firebase/functions";

import {
  db,
  functions,
  storage,
} from "../../services/firebase";

import {
  WEDDING_ID,
} from "../../config/wedding";

const MAX_FILE_SIZE =
  30 * 1024 * 1024;

const THUMBNAIL_MAX_SIZE =
  800;

const THUMBNAIL_QUALITY =
  0.82;

const emptyAlbumForm = {
  title: "",
  eyebrow: "",
  description: "",
  eventDate: "",
  isPublic: false,
  allowGuestUploads: false,
};

const generateMissingPhotoThumbnails =
  httpsCallable(
    functions,
    "generateMissingPhotoThumbnails"
  );

function PhotosAdmin() {
  const fileInputRef =
    useRef(null);

  const [
    albums,
    setAlbums,
  ] = useState([]);

  const [
    photos,
    setPhotos,
  ] = useState([]);

  const [
    selectedAlbumId,
    setSelectedAlbumId,
  ] = useState("");

  const [
    loadingAlbums,
    setLoadingAlbums,
  ] = useState(true);

  const [
    loadingPhotos,
    setLoadingPhotos,
  ] = useState(false);

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
    deletingPhotoId,
    setDeletingPhotoId,
  ] = useState(null);

  const [
    repairing,
    setRepairing,
  ] = useState(false);

  const [
    repairProgress,
    setRepairProgress,
  ] = useState({
    current: 0,
    total: 0,
  });

  const [
    generatingThumbnails,
    setGeneratingThumbnails,
  ] = useState(false);

  const [
    sortingAlbums,
    setSortingAlbums,
  ] = useState(false);

  const [
    showAlbumModal,
    setShowAlbumModal,
  ] = useState(false);

  const [
    editingAlbumId,
    setEditingAlbumId,
  ] = useState(null);

  const [
    albumForm,
    setAlbumForm,
  ] = useState(
    emptyAlbumForm
  );

  const [
    savingAlbum,
    setSavingAlbum,
  ] = useState(false);

  const [
    deletingAlbumId,
    setDeletingAlbumId,
  ] = useState(null);

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
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  /*
   * =====================================================
   * DRAG SENSORS
   * =====================================================
   */

  const sensors =
    useSensors(
      useSensor(
        PointerSensor,
        {
          activationConstraint: {
            distance:
              5,
          },
        }
      ),

      useSensor(
        TouchSensor,
        {
          activationConstraint: {
            delay:
              150,

            tolerance:
              5,
          },
        }
      ),

      useSensor(
        KeyboardSensor,
        {
          coordinateGetter:
            sortableKeyboardCoordinates,
        }
      )
    );

  /*
   * =====================================================
   * LOAD ALBUMS
   * =====================================================
   */

  useEffect(() => {
    const albumsRef =
      collection(
        db,
        "weddings",
        WEDDING_ID,
        "photoAlbums"
      );

    const unsubscribe =
      onSnapshot(
        albumsRef,

        async (
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

          const albumsToMigrate =
            loaded.filter(
              (
                album
              ) =>
                typeof album.isPublic !==
                  "boolean"

                ||

                typeof album.eventDate !==
                  "string"
            );

          if (
            albumsToMigrate.length >
            0
          ) {
            try {
              const batch =
                writeBatch(
                  db
                );

              albumsToMigrate.forEach(
                (
                  album
                ) => {
                  const updates =
                    {};

                  if (
                    typeof album.isPublic !==
                    "boolean"
                  ) {
                    updates.isPublic =
                      true;
                  }

                  if (
                    typeof album.eventDate !==
                    "string"
                  ) {
                    updates.eventDate =
                      "";
                  }

                  batch.update(
                    doc(
                      db,
                      "weddings",
                      WEDDING_ID,
                      "photoAlbums",
                      album.id
                    ),
                    updates
                  );
                }
              );

              await batch.commit();
            } catch (
              migrationError
            ) {
              console.error(
                "Could not migrate old photo albums:",
                migrationError
              );
            }
          }

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

          setSelectedAlbumId(
            (
              current
            ) => {
              if (
                current

                &&

                loaded.some(
                  (
                    album
                  ) =>
                    album.id ===
                    current
                )
              ) {
                return current;
              }

              return (
                loaded[
                  0
                ]?.id ||
                ""
              );
            }
          );

          setLoadingAlbums(
            false
          );
        },

        (
          firebaseError
        ) => {
          console.error(
            "Error loading albums:",
            firebaseError
          );

          setError(
            formatFirebaseError(
              "We couldn't load the photo albums.",
              firebaseError
            )
          );

          setLoadingAlbums(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  /*
   * =====================================================
   * LOAD PHOTOS
   * =====================================================
   */

  useEffect(() => {
    if (
      !selectedAlbumId
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

    setSelectedPhotoId(
      null
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
          selectedAlbumId
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
                          `Could not load preview for ${
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
                  timeB -
                  timeA
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
              "Error loading photos:",
              loadError
            );

            setError(
              "We couldn't load the photos."
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
            "Error loading photos:",
            firebaseError
          );

          setError(
            formatFirebaseError(
              "We couldn't load the photos.",
              firebaseError
            )
          );

          setLoadingPhotos(
            false
          );
        }
      );

    return unsubscribe;
  }, [
    selectedAlbumId,
  ]);

  /*
   * =====================================================
   * DERIVED DATA
   * =====================================================
   */

  const selectedAlbum =
    useMemo(
      () =>
        albums.find(
          (
            album
          ) =>
            album.id ===
            selectedAlbumId
        )
        ||
        null,
      [
        albums,
        selectedAlbumId,
      ]
    );

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

  const repairableHeicPhotos =
    useMemo(
      () =>
        photos.filter(
          (
            photo
          ) =>
            isHeicRecord(
              photo
            )

            &&

            !hasSeparateDisplayCopy(
              photo
            )
        ),
      [
        photos,
      ]
    );

  const photosMissingThumbnails =
    useMemo(
      () =>
        photos.filter(
          (
            photo
          ) =>
            !photo.thumbnailPath
        ),
      [
        photos,
      ]
    );

  /*
   * =====================================================
   * ADMIN LIGHTBOX
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
          "Could not load admin lightbox image:",
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
   * REORDER ALBUMS
   * =====================================================
   */

  const handleDragEnd =
    async (
      event
    ) => {
      const {
        active,
        over,
      } =
        event;

      if (
        !over
        ||
        active.id ===
          over.id
      ) {
        return;
      }

      const oldIndex =
        albums.findIndex(
          (
            album
          ) =>
            album.id ===
            active.id
        );

      const newIndex =
        albums.findIndex(
          (
            album
          ) =>
            album.id ===
            over.id
        );

      if (
        oldIndex <
          0
        ||
        newIndex <
          0
      ) {
        return;
      }

      const previousAlbums =
        albums;

      const reordered =
        arrayMove(
          albums,
          oldIndex,
          newIndex
        );

      setAlbums(
        reordered
      );

      setSortingAlbums(
        true
      );

      setError("");
      setSuccess("");

      try {
        const batch =
          writeBatch(
            db
          );

        reordered.forEach(
          (
            album,
            index
          ) => {
            batch.update(
              doc(
                db,
                "weddings",
                WEDDING_ID,
                "photoAlbums",
                album.id
              ),
              {
                sortOrder:
                  index +
                  1,

                updatedAt:
                  serverTimestamp(),
              }
            );
          }
        );

        await batch.commit();

        setSuccess(
          "Album order saved."
        );
      } catch (
        reorderError
      ) {
        console.error(
          "Error reordering albums:",
          reorderError
        );

        setAlbums(
          previousAlbums
        );

        setError(
          "We couldn't save the new album order."
        );
      } finally {
        setSortingAlbums(
          false
        );
      }
    };

  /*
   * =====================================================
   * ALBUM MODAL
   * =====================================================
   */

  const openAddAlbum =
    () => {
      setEditingAlbumId(
        null
      );

      setAlbumForm({
        ...emptyAlbumForm,
      });

      setError("");
      setSuccess("");

      setShowAlbumModal(
        true
      );
    };

  const openEditAlbum =
    (
      album
    ) => {
      setEditingAlbumId(
        album.id
      );

      setAlbumForm({
        title:
          album.title ||
          "",

        eyebrow:
          album.eyebrow ||
          "",

        description:
          album.description ||
          "",

        eventDate:
          album.eventDate ||
          "",

        isPublic:
          Boolean(
            album.isPublic
          ),

        allowGuestUploads:
          Boolean(
            album.isPublic
            &&
            album.allowGuestUploads
          ),
      });

      setError("");
      setSuccess("");

      setShowAlbumModal(
        true
      );
    };

  const closeAlbumModal =
    () => {
      if (
        savingAlbum
      ) {
        return;
      }

      setShowAlbumModal(
        false
      );

      setEditingAlbumId(
        null
      );

      setAlbumForm({
        ...emptyAlbumForm,
      });
    };

  const handleAlbumFormChange =
    (
      event
    ) => {
      const {
        name,
        value,
        checked,
        type,
      } =
        event.target;

      setAlbumForm(
        (
          current
        ) => {
          const next = {
            ...current,

            [name]:
              type ===
              "checkbox"
                ? checked
                : value,
          };

          if (
            name ===
              "isPublic"

            &&

            checked ===
              false
          ) {
            next.allowGuestUploads =
              false;
          }

          return next;
        }
      );
    };

  /*
   * =====================================================
   * SAVE ALBUM
   * =====================================================
   */

  const handleSaveAlbum =
    async (
      event
    ) => {
      event.preventDefault();

      const title =
        albumForm.title.trim();

      if (
        !title
      ) {
        setError(
          "Enter an album name."
        );

        return;
      }

      setSavingAlbum(
        true
      );

      setError("");
      setSuccess("");

      try {
        const isPublic =
          Boolean(
            albumForm.isPublic
          );

        const allowGuestUploads =
          isPublic
          &&
          Boolean(
            albumForm.allowGuestUploads
          );

        if (
          editingAlbumId
        ) {
          await updateDoc(
            doc(
              db,
              "weddings",
              WEDDING_ID,
              "photoAlbums",
              editingAlbumId
            ),
            {
              title,

              eyebrow:
                albumForm.eyebrow.trim(),

              description:
                albumForm.description.trim(),

              eventDate:
                albumForm.eventDate,

              isPublic,

              allowGuestUploads,

              updatedAt:
                serverTimestamp(),
            }
          );

          setSuccess(
            isPublic
              ? "Album updated."
              : "Album saved as private."
          );
        } else {
          const albumId =
            createAlbumId(
              title
            );

          if (
            !albumId
          ) {
            setError(
              "Please use at least one letter or number in the album name."
            );

            return;
          }

          if (
            albums.some(
              (
                album
              ) =>
                album.id ===
                albumId
            )
          ) {
            setError(
              "An album with that name already exists."
            );

            return;
          }

          const nextSortOrder =
            albums.length >
            0
              ? Math.max(
                  ...albums.map(
                    (
                      album
                    ) =>
                      Number(
                        album.sortOrder ||
                          0
                      )
                  )
                ) +
                1
              : 1;

          await setDoc(
            doc(
              db,
              "weddings",
              WEDDING_ID,
              "photoAlbums",
              albumId
            ),
            {
              title,

              eyebrow:
                albumForm.eyebrow.trim(),

              description:
                albumForm.description.trim(),

              eventDate:
                albumForm.eventDate,

              isPublic,

              allowGuestUploads,

              sortOrder:
                nextSortOrder,

              createdAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp(),
            }
          );

          setSelectedAlbumId(
            albumId
          );

          setSuccess(
            isPublic
              ? "Album created and published."
              : "Private album created."
          );
        }

        setShowAlbumModal(
          false
        );

        setEditingAlbumId(
          null
        );

        setAlbumForm({
          ...emptyAlbumForm,
        });
      } catch (
        firebaseError
      ) {
        console.error(
          "Error saving album:",
          firebaseError
        );

        setError(
          formatFirebaseError(
            "We couldn't save that album.",
            firebaseError
          )
        );
      } finally {
        setSavingAlbum(
          false
        );
      }
    };

  /*
   * =====================================================
   * DELETE ALBUM
   * =====================================================
   */

  const handleDeleteAlbum =
    async (
      album
    ) => {
      if (
        photos.length >
        0
      ) {
        setError(
          "Delete the photos in this album before deleting the album."
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Delete "${album.title}"? This cannot be undone.`
        );

      if (
        !confirmed
      ) {
        return;
      }

      setDeletingAlbumId(
        album.id
      );

      setError("");
      setSuccess("");

      try {
        await deleteDoc(
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "photoAlbums",
            album.id
          )
        );

        setSuccess(
          "Album deleted."
        );
      } catch (
        firebaseError
      ) {
        console.error(
          "Error deleting album:",
          firebaseError
        );

        setError(
          formatFirebaseError(
            "We couldn't delete that album.",
            firebaseError
          )
        );
      } finally {
        setDeletingAlbumId(
          null
        );
      }
    };

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
          `${oversized.name} is too large. Each original photo must be smaller than 30 MB.`
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
   * UPLOAD NEW PHOTOS
   * =====================================================
   */

  const handleUpload =
    async () => {
      if (
        !selectedAlbumId
        ||
        selectedFiles.length ===
          0
      ) {
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
          await uploadPhoto(
            file,
            selectedAlbumId
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
          } uploaded successfully.`
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
      }

      setUploading(
        false
      );
    };

  /*
   * =====================================================
   * SERVER THUMBNAILS
   * =====================================================
   */

  const handleGenerateMissingThumbnails =
    async () => {
      if (
        !selectedAlbum
        ||
        photosMissingThumbnails.length ===
          0
      ) {
        return;
      }

      setGeneratingThumbnails(
        true
      );

      setError("");
      setSuccess("");

      try {
        const result =
          await generateMissingPhotoThumbnails({
            weddingId:
              WEDDING_ID,

            albumId:
              selectedAlbum.id,
          });

        const data =
          result.data;

        if (
          data.successful >
          0
        ) {
          setSuccess(
            `${data.successful} thumbnails generated successfully.`
          );
        }

        const messages =
          [];

        data.failures?.forEach(
          (
            failure
          ) => {
            messages.push(
              `• ${failure.fileName} — ${failure.message}`
            );
          }
        );

        data.skippedPhotos?.forEach(
          (
            skipped
          ) => {
            messages.push(
              `• ${skipped.fileName} — ${skipped.reason}`
            );
          }
        );

        if (
          messages.length >
          0
        ) {
          setError(
            messages.join(
              "\n"
            )
          );
        }
      } catch (
        functionError
      ) {
        console.error(
          "Thumbnail function failed:",
          functionError
        );

        setError(
          functionError?.message ||
          "The server could not generate the thumbnails."
        );
      } finally {
        setGeneratingThumbnails(
          false
        );
      }
    };

  /*
   * =====================================================
   * REPAIR HEIC
   * =====================================================
   */

  const handleRepairHeic =
    async () => {
      if (
        repairableHeicPhotos.length ===
        0
      ) {
        return;
      }

      setRepairing(
        true
      );

      setError("");
      setSuccess("");

      setRepairProgress({
        current: 0,
        total:
          repairableHeicPhotos.length,
      });

      const failures =
        [];

      let successful =
        0;

      for (
        let index =
          0;
        index <
        repairableHeicPhotos.length;
        index +=
          1
      ) {
        const photo =
          repairableHeicPhotos[
            index
          ];

        try {
          await repairExistingHeic(
            photo
          );

          successful +=
            1;
        } catch (
          repairError
        ) {
          failures.push({
            fileName:
              photo.fileName,

            message:
              getUploadErrorMessage(
                repairError
              ),
          });
        }

        setRepairProgress({
          current:
            index +
            1,

          total:
            repairableHeicPhotos.length,
        });
      }

      if (
        successful >
        0
      ) {
        setSuccess(
          `${successful} HEIC photos repaired.`
        );
      }

      if (
        failures.length >
        0
      ) {
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
      }

      setRepairing(
        false
      );
    };

  /*
   * =====================================================
   * DELETE PHOTO
   * =====================================================
   */

  const handleDeletePhoto =
    async (
      photo
    ) => {
      const confirmed =
        window.confirm(
          "Delete this photo permanently? The original, display copy, and thumbnail will all be removed."
        );

      if (
        !confirmed
      ) {
        return;
      }

      if (
        selectedPhotoId ===
        photo.id
      ) {
        closeLightbox();
      }

      setDeletingPhotoId(
        photo.id
      );

      setError("");
      setSuccess("");

      try {
        const paths =
          [
            ...new Set(
              [
                photo.thumbnailPath,
                photo.displayPath,
                photo.storagePath,
              ].filter(
                Boolean
              )
            ),
          ];

        for (
          const path of paths
        ) {
          await deleteStorageFileSafely(
            path
          );
        }

        await deleteDoc(
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "photos",
            photo.id
          )
        );

        setSuccess(
          "Photo deleted."
        );
      } catch (
        deleteError
      ) {
        console.error(
          "Error deleting photo:",
          deleteError
        );

        setError(
          "We couldn't delete that photo."
        );
      } finally {
        setDeletingPhotoId(
          null
        );
      }
    };

  if (
    loadingAlbums
  ) {
    return (
      <div className="page photos-admin-page">
        <div className="photo-gallery-loading">
          <LoaderCircle
            size={24}
            className="spinner"
          />

          Loading galleries...
        </div>
      </div>
    );
  }

  return (
    <div className="page photos-admin-page">
      <div className="photos-admin-header">
        <div>
          <p className="page-eyebrow">
            Photos
          </p>

          <h1>
            Photo Galleries
          </h1>

          <p className="page-description">
            Create galleries in advance, arrange their order, and publish them whenever you're ready.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={
            openAddAlbum
          }
        >
          <Plus
            size={17}
          />

          Add Album
        </button>
      </div>

      {error && (
        <div className="photo-gallery-error">
          {error}
        </div>
      )}

      {success && (
        <div className="photos-admin-success">
          {success}
        </div>
      )}

      {albums.length ===
      0 ? (
        <div className="photo-gallery-empty">
          <ImageIcon
            size={30}
          />

          <h2>
            No albums yet
          </h2>

          <p>
            Create your first photo album to get started.
          </p>
        </div>
      ) : (
        <section className="photos-admin-albums-card">
          <div className="photos-admin-gallery-heading">
            <div>
              <p className="card-eyebrow">
                Album Order
              </p>

              <h2>
                Arrange Galleries
              </h2>
            </div>

            {sortingAlbums && (
              <span>
                Saving...
              </span>
            )}
          </div>

          <p>
            Drag the handle to change the order guests see the galleries.
          </p>

          <DndContext
            sensors={
              sensors
            }
            collisionDetection={
              closestCenter
            }
            onDragEnd={
              handleDragEnd
            }
          >
            <SortableContext
              items={
                albums.map(
                  (
                    album
                  ) =>
                    album.id
                )
              }
              strategy={
                verticalListSortingStrategy
              }
            >
              <div className="photos-admin-sort-list">
                {albums.map(
                  (
                    album
                  ) => (
                    <SortableAlbumRow
                      key={
                        album.id
                      }
                      album={
                        album
                      }
                      selected={
                        selectedAlbumId ===
                        album.id
                      }
                      onSelect={() =>
                        setSelectedAlbumId(
                          album.id
                        )
                      }
                    />
                  )
                )}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      )}

      {selectedAlbum && (
        <>
          <section className="photos-admin-album-details">
            <div>
              <p className="card-eyebrow">
                Selected Gallery
              </p>

              <h2>
                {
                  selectedAlbum.title
                }
              </h2>

              <div className="photos-admin-status-row">
                <StatusBadge
                  icon={
                    selectedAlbum.isPublic
                      ? Globe2
                      : LockKeyhole
                  }
                  label={
                    selectedAlbum.isPublic
                      ? "Public"
                      : "Private"
                  }
                />

                {selectedAlbum.eventDate && (
                  <StatusBadge
                    icon={
                      CalendarDays
                    }
                    label={
                      formatAlbumDate(
                        selectedAlbum.eventDate
                      )
                    }
                  />
                )}

                {selectedAlbum.allowGuestUploads && (
                  <StatusBadge
                    icon={
                      Upload
                    }
                    label="Guest uploads"
                  />
                )}
              </div>

              {selectedAlbum.description && (
                <p>
                  {
                    selectedAlbum.description
                  }
                </p>
              )}
            </div>

            <div className="photos-admin-album-actions">
              <Link
                className="secondary-button"
                to={`/photos/${selectedAlbum.id}`}
              >
                <Eye
                  size={16}
                />

                Preview
              </Link>

              {photosMissingThumbnails.length >
                0 && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    handleGenerateMissingThumbnails
                  }
                  disabled={
                    generatingThumbnails
                  }
                >
                  {generatingThumbnails ? (
                    <LoaderCircle
                      size={16}
                      className="spinner"
                    />
                  ) : (
                    <WandSparkles
                      size={16}
                    />
                  )}

                  Generate{" "}
                  {
                    photosMissingThumbnails.length
                  }{" "}
                  Thumbnails
                </button>
              )}

              {repairableHeicPhotos.length >
                0 && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    handleRepairHeic
                  }
                  disabled={
                    repairing
                  }
                >
                  {repairing ? (
                    <LoaderCircle
                      size={16}
                      className="spinner"
                    />
                  ) : (
                    <RefreshCw
                      size={16}
                    />
                  )}

                  {repairing
                    ? `Repairing ${repairProgress.current}/${repairProgress.total}`
                    : `Fix ${repairableHeicPhotos.length} HEIC`}
                </button>
              )}

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  openEditAlbum(
                    selectedAlbum
                  )
                }
              >
                <Pencil
                  size={16}
                />

                Edit Album
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  handleDeleteAlbum(
                    selectedAlbum
                  )
                }
                disabled={
                  deletingAlbumId ===
                  selectedAlbum.id
                }
              >
                <Trash2
                  size={16}
                />

                Delete Album
              </button>
            </div>
          </section>

          <section className="photos-admin-upload-card">
            <div className="photos-admin-card-heading">
              <div className="photos-admin-card-icon">
                <Camera
                  size={20}
                />
              </div>

              <div>
                <p className="card-eyebrow">
                  Add Photos
                </p>

                <h2>
                  Upload to{" "}
                  {
                    selectedAlbum.title
                  }
                </h2>
              </div>
            </div>

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

            <div className="photos-admin-upload-actions">
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
                    handleUpload
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

                      Processing{" "}
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
                      Photos
                    </>
                  )}
                </button>
              )}
            </div>
          </section>

          <div className="photos-admin-gallery-heading">
            <div>
              <p className="card-eyebrow">
                Gallery
              </p>

              <h2>
                {
                  selectedAlbum.title
                }
              </h2>
            </div>

            <span>
              {
                photos.length
              }{" "}
              {photos.length ===
              1
                ? "photo"
                : "photos"}
            </span>
          </div>

          {loadingPhotos ? (
            <div className="photo-gallery-loading">
              <LoaderCircle
                size={24}
                className="spinner"
              />

              Loading photos...
            </div>
          ) : (
            <div className="photos-admin-grid">
              {photos.map(
                (
                  photo
                ) => (
                  <div
                    className="photos-admin-item"
                    key={
                      photo.id
                    }
                  >
                    <button
                      type="button"
                      className="photos-admin-preview-button"
                      onClick={() =>
                        setSelectedPhotoId(
                          photo.id
                        )
                      }
                      aria-label={`Preview ${
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
                        <div className="photos-admin-image-error">
                          <ImageIcon
                            size={24}
                          />
                        </div>
                      )}
                    </button>

                    {photo.uploaderName && (
                      <div className="photos-admin-uploader">
                        <UserRound
                          size={12}
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

                    {!photo.thumbnailPath && (
                      <span className="photos-admin-needs-thumbnail">
                        Needs thumbnail
                      </span>
                    )}

                    <button
                      type="button"
                      className="photos-admin-delete"
                      onClick={() =>
                        handleDeletePhoto(
                          photo
                        )
                      }
                      disabled={
                        deletingPhotoId ===
                        photo.id
                      }
                      aria-label="Delete photo"
                    >
                      <Trash2
                        size={17}
                      />
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </>
      )}

      {/*
       * ADMIN LIGHTBOX
       */}

      {selectedPhoto && (
        <div
          className="photo-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Admin photo preview"
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
          >
            <button
              type="button"
              className="photo-lightbox-close"
              onClick={
                closeLightbox
              }
              aria-label="Close preview"
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
                <div className="photo-lightbox-unavailable">
                  <ImageIcon
                    size={28}
                  />

                  Photo unavailable
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

                <span className="photo-lightbox-count">
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

      {showAlbumModal && (
        <div
          className="modal-backdrop"
          onClick={
            closeAlbumModal
          }
        >
          <div
            className="modal-card photos-album-modal"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <p className="card-eyebrow">
                  Photo Gallery
                </p>

                <h2>
                  {editingAlbumId
                    ? "Edit Album"
                    : "Add Album"}
                </h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={
                  closeAlbumModal
                }
              >
                <X
                  size={20}
                />
              </button>
            </div>

            <form
              onSubmit={
                handleSaveAlbum
              }
            >
              <label className="form-field">
                <span>
                  Album name
                </span>

                <input
                  type="text"
                  name="title"
                  value={
                    albumForm.title
                  }
                  onChange={
                    handleAlbumFormChange
                  }
                />
              </label>

              <label className="form-field">
                <span>
                  Eyebrow
                </span>

                <input
                  type="text"
                  name="eyebrow"
                  value={
                    albumForm.eyebrow
                  }
                  onChange={
                    handleAlbumFormChange
                  }
                />
              </label>

              <label className="form-field">
                <span>
                  Event date
                </span>

                <input
                  type="date"
                  name="eventDate"
                  value={
                    albumForm.eventDate
                  }
                  onChange={
                    handleAlbumFormChange
                  }
                />
              </label>

              <label className="form-field">
                <span>
                  Description
                </span>

                <textarea
                  name="description"
                  value={
                    albumForm.description
                  }
                  onChange={
                    handleAlbumFormChange
                  }
                  rows={
                    4
                  }
                />
              </label>

              <label className="photos-album-toggle">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={
                    albumForm.isPublic
                  }
                  onChange={
                    handleAlbumFormChange
                  }
                />

                <span>
                  <strong>
                    Visible to guests
                  </strong>

                  <small>
                    Turn this off while preparing the gallery.
                  </small>
                </span>
              </label>

              <label className="photos-album-toggle">
                <input
                  type="checkbox"
                  name="allowGuestUploads"
                  checked={
                    albumForm.allowGuestUploads
                  }
                  disabled={
                    !albumForm.isPublic
                  }
                  onChange={
                    handleAlbumFormChange
                  }
                />

                <span>
                  <strong>
                    Allow guest uploads
                  </strong>

                  <small>
                    Guests can add photos without signing in.
                  </small>
                </span>
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeAlbumModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    savingAlbum
                  }
                >
                  {savingAlbum
                    ? "Saving..."
                    : "Save Album"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SortableAlbumRow({
  album,
  selected,
  onSelect,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } =
    useSortable({
      id:
        album.id,
    });

  return (
    <div
      ref={
        setNodeRef
      }
      style={{
        transform:
          CSS.Transform.toString(
            transform
          ),

        transition,

        opacity:
          isDragging
            ? 0.55
            : 1,

        display:
          "flex",

        alignItems:
          "center",

        gap:
          "10px",

        padding:
          "10px",

        border:
          selected
            ? "2px solid var(--primary-dark)"
            : "1px solid var(--border)",

        borderRadius:
          "12px",

        background:
          "var(--background)",
      }}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        style={{
          border:
            0,

          background:
            "transparent",

          cursor:
            "grab",

          padding:
            "8px",

          touchAction:
            "none",
        }}
      >
        <GripVertical
          size={20}
        />
      </button>

      <button
        type="button"
        onClick={
          onSelect
        }
        style={{
          border:
            0,

          background:
            "transparent",

          flex:
            1,

          textAlign:
            "left",

          cursor:
            "pointer",
        }}
      >
        <strong>
          {
            album.title
          }
        </strong>
      </button>
    </div>
  );
}

function StatusBadge({
  icon: Icon,
  label,
}) {
  return (
    <span className="photos-admin-status-badge">
      <Icon
        size={14}
      />

      {label}
    </span>
  );
}

async function uploadPhoto(
  file,
  albumId
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
    displayPath =
      `weddings/${WEDDING_ID}/photos/${albumId}/display/${replaceExtension(
        uniqueName,
        ".png"
      )}`;

    await uploadBlob(
      displayBlob,
      displayPath,
      "image/png"
    );
  }

  const thumbnailPath =
    `weddings/${WEDDING_ID}/photos/${albumId}/thumbnails/${replaceExtension(
      uniqueName,
      ".jpg"
    )}`;

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
        "",

      uploadedAt:
        serverTimestamp(),
    }
  );
}

async function repairExistingHeic(
  photo
) {
  const bytes =
    await getBytes(
      ref(
        storage,
        photo.storagePath
      )
    );

  const originalBlob =
    new Blob(
      [
        bytes,
      ],
      {
        type:
          normalizeHeicContentType(
            photo.contentType
          ),
      }
    );

  const convertedBlob =
    await convertHeicToPng(
      originalBlob
    );

  const displayPath =
    `weddings/${WEDDING_ID}/photos/${photo.albumId}/display/${replaceExtension(
      getStorageFileName(
        photo.storagePath
      ),
      ".png"
    )}`;

  await uploadBlob(
    convertedBlob,
    displayPath,
    "image/png"
  );

  await updateDoc(
    doc(
      db,
      "weddings",
      WEDDING_ID,
      "photos",
      photo.id
    ),
    {
      displayPath,
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

  return heicTo({
    blob,

    type:
      "image/png",
  });
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
      Math.round(
        image.naturalWidth *
          scale
      );

    const height =
      Math.round(
        image.naturalHeight *
          scale
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
        "2d"
      );

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

      image.onload =
        () =>
          resolve(
            image
          );

      image.onerror =
        reject;

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
        ) =>
          blob
            ? resolve(
                blob
              )
            : reject(
                new Error(
                  "Could not create thumbnail."
                )
              ),

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
      const task =
        uploadBytesResumable(
          ref(
            storage,
            path
          ),

          blob,

          {
            contentType,
          }
        );

      task.on(
        "state_changed",
        null,
        reject,
        resolve
      );
    }
  );
}

async function deleteStorageFileSafely(
  path
) {
  try {
    await deleteObject(
      ref(
        storage,
        path
      )
    );
  } catch (
    storageError
  ) {
    if (
      storageError?.code !==
      "storage/object-not-found"
    ) {
      throw storageError;
    }
  }
}

function isHeicFile(
  file
) {
  return (
    String(
      file.type
    )
      .toLowerCase()
      .includes(
        "heic"
      )

    ||

    String(
      file.type
    )
      .toLowerCase()
      .includes(
        "heif"
      )

    ||

    /\.hei[cf]$/i.test(
      file.name
    )
  );
}

function isHeicRecord(
  photo
) {
  return Boolean(
    /\.hei[cf]$/i.test(
      photo.fileName ||
      ""
    )

    ||

    /\.hei[cf]$/i.test(
      photo.storagePath ||
      ""
    )

    ||

    String(
      photo.contentType ||
      ""
    )
      .toLowerCase()
      .includes(
        "hei"
      )
  );
}

function hasSeparateDisplayCopy(
  photo
) {
  return Boolean(
    photo.displayPath
    &&
    photo.displayPath !==
      photo.storagePath
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
  return (
    file.type
    ||
    "application/octet-stream"
  );
}

function normalizeHeicContentType(
  contentType
) {
  return String(
    contentType ||
    ""
  )
    .toLowerCase()
    .includes(
      "heif"
    )
    ? "image/heif"
    : "image/heic";
}

function getStorageFileName(
  path
) {
  return String(
    path ||
    ""
  )
    .split("/")
    .pop();
}

function replaceExtension(
  fileName,
  extension
) {
  const dot =
    fileName.lastIndexOf(
      "."
    );

  return dot ===
    -1
    ? `${fileName}${extension}`
    : `${fileName.slice(
        0,
        dot
      )}${extension}`;
}

function createAlbumId(
  title
) {
  return title
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function createUniqueFileName(
  originalName
) {
  const safeName =
    originalName.replace(
      /[^a-zA-Z0-9._-]/g,
      "-"
    );

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}-${safeName}`;
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

  return new Date(
    year,
    month -
      1,
    day
  ).toLocaleDateString(
    "en-US",
    {
      month:
        "short",

      day:
        "numeric",

      year:
        "numeric",
    }
  );
}

function getUploadErrorMessage(
  error
) {
  return (
    error?.message
    ||
    "Unknown error."
  );
}

function formatFirebaseError(
  prefix,
  error
) {
  return `${prefix} ${
    error?.message ||
    ""
  }`;
}

export default PhotosAdmin;