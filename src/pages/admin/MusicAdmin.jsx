import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowDown,
  ArrowUp,
  Check,
  CircleCheck,
  CircleMinus,
  Music2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import {
  db,
} from "../../services/firebase";

import {
  WEDDING_ID,
} from "../../config/wedding";

import {
  useAuth,
} from "../../context/AuthContext";

const emptyForm = {
  type: "ceremony",
  section: "",
  title: "",
  artist: "",
  spotifyUrl: "",
};

const emptyMusicConfig = {
  playlistUrl: "",
  requestFormUrl: "",
};

const musicCategories = [
  {
    value: "prelude",
    label: "Prelude",
  },
  {
    value: "ceremony",
    label: "Ceremony",
  },
  {
    value: "reception",
    label: "Reception",
  },
  {
    value: "must-play",
    label: "Must Plays",
  },
];

function MusicAdmin() {
  const {
    user,
  } = useAuth();

  const [
    songs,
    setSongs,
  ] = useState([]);

  const [
    form,
    setForm,
  ] = useState(
    emptyForm
  );

  const [
    musicConfig,
    setMusicConfig,
  ] = useState(
    emptyMusicConfig
  );

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    savingConfig,
    setSavingConfig,
  ] = useState(false);

  const [
    configSaved,
    setConfigSaved,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    configError,
    setConfigError,
  ] = useState("");

  useEffect(() => {
    const musicRef =
      collection(
        db,
        "weddings",
        WEDDING_ID,
        "music"
      );

    const unsubscribe =
      onSnapshot(
        musicRef,
        (snapshot) => {
          const loadedSongs = [];

          let loadedConfig =
            emptyMusicConfig;

          snapshot.docs.forEach(
            (musicDoc) => {
              const data =
                musicDoc.data();

              if (
                musicDoc.id ===
                  "_config" ||
                data.kind ===
                  "config"
              ) {
                loadedConfig = {
                  playlistUrl:
                    data.playlistUrl ||
                    "",

                  requestFormUrl:
                    data.requestFormUrl ||
                    "",
                };

                return;
              }

              loadedSongs.push({
                id:
                  musicDoc.id,

                ...data,
              });
            }
          );

          setSongs(
            loadedSongs
          );

          setMusicConfig(
            loadedConfig
          );

          setLoading(false);
          setError("");
        },
        (firebaseError) => {
          console.error(
            "Error loading music:",
            firebaseError
          );

          setError(
            "We couldn't load the music."
          );

          setLoading(false);
        }
      );

    return unsubscribe;
  }, []);

  const songsByCategory =
    useMemo(
      () => {
        const grouped = {};

        musicCategories.forEach(
          (category) => {
            grouped[
              category.value
            ] =
              songs
                .filter(
                  (song) =>
                    song.type ===
                    category.value
                )
                .sort(
                  compareSongs
                );
          }
        );

        return grouped;
      },
      [songs]
    );

  const connectedSongCount =
    useMemo(
      () =>
        songs.filter(
          (song) =>
            isSpotifyTrackUrl(
              song.spotifyUrl
            )
        ).length,
      [songs]
    );

  const spotifyFormStatus =
    getSpotifyConnectionStatus(
      form.spotifyUrl
    );

  const handleChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setForm(
        (current) => ({
          ...current,

          [name]:
            value,
        })
      );

      setError("");
    };

  const handleConfigChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setMusicConfig(
        (current) => ({
          ...current,

          [name]:
            value,
        })
      );

      setConfigSaved(
        false
      );

      setConfigError("");
    };

  const resetForm =
    () => {
      setForm(
        emptyForm
      );

      setEditingId(
        null
      );

      setError("");
    };

  const handleSaveConfig =
    async (event) => {
      event.preventDefault();

      const playlistUrl =
        musicConfig.playlistUrl.trim();

      const requestFormUrl =
        musicConfig.requestFormUrl.trim();

      if (
        playlistUrl &&
        !isSpotifyPlaylistUrl(
          playlistUrl
        )
      ) {
        setConfigError(
          "Enter a valid Spotify playlist link."
        );

        return;
      }

      if (
        requestFormUrl &&
        !isGoogleFormUrl(
          requestFormUrl
        )
      ) {
        setConfigError(
          "Enter a valid Google Forms link."
        );

        return;
      }

      setSavingConfig(true);
      setConfigSaved(false);
      setConfigError("");

      try {
        await setDoc(
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "music",
            "_config"
          ),
          {
            kind:
              "config",

            playlistUrl,

            requestFormUrl,

            updatedAt:
              serverTimestamp(),

            updatedBy:
              user?.uid ||
              null,
          },
          {
            merge:
              true,
          }
        );

        setConfigSaved(
          true
        );
      } catch (firebaseError) {
        console.error(
          "Error saving music settings:",
          firebaseError
        );

        setConfigError(
          "We couldn't save the music page settings."
        );
      } finally {
        setSavingConfig(false);
      }
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const title =
        form.title.trim();

      if (!title) {
        setError(
          "Enter a song title."
        );

        return;
      }

      if (
        form.spotifyUrl.trim() &&
        !isSpotifyTrackUrl(
          form.spotifyUrl
        )
      ) {
        setError(
          "The Spotify link doesn't look like a valid Spotify track link."
        );

        return;
      }

      setSaving(true);
      setError("");

      try {
        const sameTypeSongs =
          songs.filter(
            (song) =>
              song.type ===
              form.type
          );

        const songData = {
          type:
            form.type,

          section:
            form.section.trim(),

          title,

          artist:
            form.artist.trim(),

          spotifyUrl:
            form.spotifyUrl.trim(),

          updatedAt:
            serverTimestamp(),

          updatedBy:
            user?.uid ||
            null,
        };

        if (editingId) {
          await updateDoc(
            doc(
              db,
              "weddings",
              WEDDING_ID,
              "music",
              editingId
            ),
            songData
          );
        } else {
          await addDoc(
            collection(
              db,
              "weddings",
              WEDDING_ID,
              "music"
            ),
            {
              ...songData,

              order:
                sameTypeSongs.length,

              createdAt:
                serverTimestamp(),

              createdBy:
                user?.uid ||
                null,
            }
          );
        }

        resetForm();
      } catch (firebaseError) {
        console.error(
          "Error saving song:",
          firebaseError
        );

        setError(
          "We couldn't save that song."
        );
      } finally {
        setSaving(false);
      }
    };

  const handleEdit =
    (song) => {
      setEditingId(
        song.id
      );

      setForm({
        type:
          song.type ||
          "ceremony",

        section:
          song.section ||
          "",

        title:
          song.title ||
          "",

        artist:
          song.artist ||
          "",

        spotifyUrl:
          song.spotifyUrl ||
          "",
      });

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    };

  const handleDelete =
    async (song) => {
      const confirmed =
        window.confirm(
          `Delete "${song.title}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        await deleteDoc(
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "music",
            song.id
          )
        );

        if (
          editingId ===
          song.id
        ) {
          resetForm();
        }
      } catch (firebaseError) {
        console.error(
          "Error deleting song:",
          firebaseError
        );

        setError(
          "We couldn't delete that song."
        );
      }
    };

  const handleMove =
    async (
      song,
      direction
    ) => {
      const orderedSongs =
        songsByCategory[
          song.type
        ] || [];

      const currentIndex =
        orderedSongs.findIndex(
          (item) =>
            item.id ===
            song.id
        );

      if (
        currentIndex ===
        -1
      ) {
        return;
      }

      const nextIndex =
        direction ===
        "up"
          ? currentIndex - 1
          : currentIndex + 1;

      if (
        nextIndex < 0 ||
        nextIndex >=
          orderedSongs.length
      ) {
        return;
      }

      const reordered = [
        ...orderedSongs,
      ];

      const [
        movedSong,
      ] =
        reordered.splice(
          currentIndex,
          1
        );

      reordered.splice(
        nextIndex,
        0,
        movedSong
      );

      try {
        const batch =
          writeBatch(
            db
          );

        reordered.forEach(
          (
            item,
            index
          ) => {
            batch.update(
              doc(
                db,
                "weddings",
                WEDDING_ID,
                "music",
                item.id
              ),
              {
                order:
                  index,

                updatedAt:
                  serverTimestamp(),

                updatedBy:
                  user?.uid ||
                  null,
              }
            );
          }
        );

        await batch.commit();
      } catch (firebaseError) {
        console.error(
          "Error reordering music:",
          firebaseError
        );

        setError(
          "We couldn't reorder the songs."
        );
      }
    };

  return (
    <main className="page music-admin-page">
      <p className="page-eyebrow">
        Planning
      </p>

      <div className="music-admin-page-heading">
        <div>
          <h1 className="page-title">
            Music
          </h1>

          <p className="page-description">
            Manage the music shown on the wedding-party
            website, the reception playlist, and song
            requests.
          </p>
        </div>

        {!loading && (
          <div className="spotify-summary">
            <CircleCheck
              size={18}
            />

            <div>
              <strong>
                {
                  connectedSongCount
                }
                /
                {
                  songs.length
                }
              </strong>

              <span>
                Spotify connected
              </span>
            </div>
          </div>
        )}
      </div>

      <section className="content-card music-config-editor">
        <div className="music-editor-heading">
          <div>
            <p className="card-eyebrow">
              Public Music Page
            </p>

            <h2>
              Playlist & Requests
            </h2>
          </div>
        </div>

        <form
          className="music-config-form"
          onSubmit={
            handleSaveConfig
          }
        >
          <label className="form-field">
            <span>
              Spotify Playlist Link
            </span>

            <input
              type="url"
              name="playlistUrl"
              value={
                musicConfig.playlistUrl
              }
              onChange={
                handleConfigChange
              }
              placeholder="https://open.spotify.com/playlist/..."
            />
          </label>

          <label className="form-field">
            <span>
              Google Song Request Form
            </span>

            <input
              type="url"
              name="requestFormUrl"
              value={
                musicConfig.requestFormUrl
              }
              onChange={
                handleConfigChange
              }
              placeholder="https://docs.google.com/forms/..."
            />
          </label>

          {configError && (
            <div className="music-admin-error">
              {
                configError
              }
            </div>
          )}

          <div className="music-config-actions">
            {configSaved && (
              <span className="music-config-saved">
                <Check
                  size={15}
                />

                Saved
              </span>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={
                savingConfig
              }
            >
              <Save
                size={16}
              />

              {savingConfig
                ? "Saving..."
                : "Save Page Settings"}
            </button>
          </div>
        </form>
      </section>

      <section className="content-card music-editor">
        <div className="music-editor-heading">
          <div>
            <p className="card-eyebrow">
              {editingId
                ? "Editing Song"
                : "New Song"}
            </p>

            <h2>
              {editingId
                ? "Edit Song"
                : "Add a Song"}
            </h2>
          </div>

          {editingId && (
            <button
              type="button"
              className="icon-button"
              onClick={
                resetForm
              }
              aria-label="Cancel editing"
            >
              <X
                size={17}
              />
            </button>
          )}
        </div>

        <form
          className="music-admin-form"
          onSubmit={
            handleSubmit
          }
        >
          <label className="form-field">
            <span>
              Category
            </span>

            <select
              name="type"
              value={
                form.type
              }
              onChange={
                handleChange
              }
            >
              {musicCategories.map(
                (category) => (
                  <option
                    key={
                      category.value
                    }
                    value={
                      category.value
                    }
                  >
                    {
                      category.label
                    }
                  </option>
                )
              )}
            </select>
          </label>

          <label className="form-field">
            <span>
              Section
            </span>

            <input
              type="text"
              name="section"
              value={
                form.section
              }
              onChange={
                handleChange
              }
              placeholder={
                getSectionPlaceholder(
                  form.type
                )
              }
            />
          </label>

          <label className="form-field music-title-field">
            <span>
              Song
            </span>

            <input
              type="text"
              name="title"
              value={
                form.title
              }
              onChange={
                handleChange
              }
              placeholder="Song title"
            />
          </label>

          <label className="form-field">
            <span>
              Artist
            </span>

            <input
              type="text"
              name="artist"
              value={
                form.artist
              }
              onChange={
                handleChange
              }
              placeholder="Artist"
            />
          </label>

          <div className="form-field music-spotify-field">
            <span>
              Spotify Link
            </span>

            <input
              type="url"
              name="spotifyUrl"
              value={
                form.spotifyUrl
              }
              onChange={
                handleChange
              }
              placeholder="https://open.spotify.com/track/..."
            />

            <SpotifyFieldStatus
              status={
                spotifyFormStatus
              }
            />
          </div>

          {error && (
            <div className="music-admin-error">
              {error}
            </div>
          )}

          <div className="music-admin-actions">
            {editingId && (
              <button
                type="button"
                className="secondary-button"
                onClick={
                  resetForm
                }
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={
                saving
              }
            >
              <Plus
                size={16}
              />

              {saving
                ? "Saving..."
                : editingId
                  ? "Save Changes"
                  : "Add Song"}
            </button>
          </div>
        </form>
      </section>

      {loading ? (
        <div className="content-card">
          Loading music...
        </div>
      ) : (
        <div className="music-admin-sections">
          {musicCategories.map(
            (category) => (
              <AdminMusicSection
                key={
                  category.value
                }
                eyebrow={
                  category.label
                }
                title={
                  getCategoryTitle(
                    category.value
                  )
                }
                songs={
                  songsByCategory[
                    category.value
                  ] || []
                }
                onEdit={
                  handleEdit
                }
                onDelete={
                  handleDelete
                }
                onMove={
                  handleMove
                }
              />
            )
          )}
        </div>
      )}
    </main>
  );
}

function SpotifyFieldStatus({
  status,
}) {
  if (
    status ===
    "empty"
  ) {
    return (
      <div className="spotify-field-status empty">
        <CircleMinus
          size={14}
        />

        <span>
          Not connected to Spotify
        </span>
      </div>
    );
  }

  if (
    status ===
    "connected"
  ) {
    return (
      <div className="spotify-field-status connected">
        <CircleCheck
          size={14}
        />

        <span>
          Spotify track connected
        </span>
      </div>
    );
  }

  return (
    <div className="spotify-field-status invalid">
      <X
        size={14}
      />

      <span>
        This doesn't look like a Spotify track link
      </span>
    </div>
  );
}

function AdminMusicSection({
  eyebrow,
  title,
  songs,
  onEdit,
  onDelete,
  onMove,
}) {
  const connectedCount =
    songs.filter(
      (song) =>
        isSpotifyTrackUrl(
          song.spotifyUrl
        )
    ).length;

  return (
    <section className="music-admin-section">
      <div className="music-admin-section-heading">
        <div>
          <p className="card-eyebrow">
            {eyebrow}
          </p>

          <h2>
            {title}
          </h2>

          {songs.length >
            0 && (
            <p className="music-section-spotify-summary">
              {
                connectedCount
              }{" "}
              of{" "}
              {
                songs.length
              }{" "}
              connected to Spotify
            </p>
          )}
        </div>

        <span className="task-count">
          {songs.length}
        </span>
      </div>

      {songs.length ===
      0 ? (
        <div className="content-card music-admin-empty">
          <Music2
            size={20}
          />

          <span>
            No songs added yet.
          </span>
        </div>
      ) : (
        <div className="music-admin-list">
          {songs.map(
            (
              song,
              index
            ) => {
              const spotifyConnected =
                isSpotifyTrackUrl(
                  song.spotifyUrl
                );

              return (
                <article
                  key={
                    song.id
                  }
                  className="music-admin-card"
                >
                  <div className="music-admin-order">
                    <button
                      type="button"
                      className="icon-button"
                      disabled={
                        index ===
                        0
                      }
                      onClick={() =>
                        onMove(
                          song,
                          "up"
                        )
                      }
                      aria-label="Move song up"
                    >
                      <ArrowUp
                        size={15}
                      />
                    </button>

                    <button
                      type="button"
                      className="icon-button"
                      disabled={
                        index ===
                        songs.length -
                          1
                      }
                      onClick={() =>
                        onMove(
                          song,
                          "down"
                        )
                      }
                      aria-label="Move song down"
                    >
                      <ArrowDown
                        size={15}
                      />
                    </button>
                  </div>

                  <div className="music-admin-song">
                    <div className="music-admin-song-top">
                      <p>
                        {
                          song.section ||
                          "Song"
                        }
                      </p>

                      <SpotifyBadge
                        connected={
                          spotifyConnected
                        }
                      />
                    </div>

                    <h3>
                      {
                        song.title
                      }
                    </h3>

                    {song.artist && (
                      <span>
                        {
                          song.artist
                        }
                      </span>
                    )}
                  </div>

                  <div className="music-admin-card-actions">
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() =>
                        onEdit(
                          song
                        )
                      }
                      aria-label="Edit song"
                    >
                      <Pencil
                        size={16}
                      />
                    </button>

                    <button
                      type="button"
                      className="icon-button danger"
                      onClick={() =>
                        onDelete(
                          song
                        )
                      }
                      aria-label="Delete song"
                    >
                      <Trash2
                        size={16}
                      />
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}

function SpotifyBadge({
  connected,
}) {
  return (
    <span
      className={`spotify-status-badge ${
        connected
          ? "connected"
          : "disconnected"
      }`}
    >
      {connected ? (
        <CircleCheck
          size={12}
        />
      ) : (
        <CircleMinus
          size={12}
        />
      )}

      {connected
        ? "Spotify Connected"
        : "Not Connected"}
    </span>
  );
}

function getSpotifyConnectionStatus(
  value
) {
  if (
    !value ||
    !value.trim()
  ) {
    return "empty";
  }

  if (
    isSpotifyTrackUrl(
      value
    )
  ) {
    return "connected";
  }

  return "invalid";
}

function isSpotifyTrackUrl(
  value
) {
  if (!value) {
    return false;
  }

  try {
    const url =
      new URL(
        value.trim()
      );

    const validHost =
      url.hostname ===
        "open.spotify.com" ||
      url.hostname ===
        "www.open.spotify.com";

    if (!validHost) {
      return false;
    }

    const pathParts =
      url.pathname
        .split("/")
        .filter(Boolean);

    const trackIndex =
      pathParts.indexOf(
        "track"
      );

    return Boolean(
      trackIndex !==
        -1 &&
      pathParts[
        trackIndex + 1
      ]
    );
  } catch {
    return false;
  }
}

function getCategoryTitle(
  type
) {
  if (
    type ===
    "prelude"
  ) {
    return "Prelude Music";
  }

  if (
    type ===
    "ceremony"
  ) {
    return "Ceremony Music";
  }

  if (
    type ===
    "reception"
  ) {
    return "Reception Music";
  }

  return "Must Plays";
}

function getSectionPlaceholder(
  type
) {
  if (
    type ===
    "prelude"
  ) {
    return "Prelude";
  }

  if (
    type ===
    "ceremony"
  ) {
    return "Processional";
  }

  if (
    type ===
    "reception"
  ) {
    return "First Dance";
  }

  return "Dance Floor";
}

function isSpotifyPlaylistUrl(
  value
) {
  try {
    const url =
      new URL(
        value
      );

    return (
      (
        url.hostname ===
          "open.spotify.com" ||
        url.hostname ===
          "www.open.spotify.com"
      ) &&
      url.pathname.includes(
        "/playlist/"
      )
    );
  } catch {
    return false;
  }
}

function isGoogleFormUrl(
  value
) {
  try {
    const url =
      new URL(
        value
      );

    return (
      url.hostname ===
        "docs.google.com" &&
      url.pathname.includes(
        "/forms/"
      )
    );
  } catch {
    return false;
  }
}

function compareSongs(
  first,
  second
) {
  const firstOrder =
    first.order ??
    999;

  const secondOrder =
    second.order ??
    999;

  if (
    firstOrder !==
    secondOrder
  ) {
    return (
      firstOrder -
      secondOrder
    );
  }

  return String(
    first.title ||
    ""
  ).localeCompare(
    String(
      second.title ||
      ""
    )
  );
}

export default MusicAdmin;