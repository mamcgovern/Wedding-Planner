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
  Star,
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
    entranceSongs,
    setEntranceSongs,
  ] = useState([]);

  const [
    entranceVotes,
    setEntranceVotes,
  ] = useState([]);

  const [
    voterSearch,
    setVoterSearch,
  ] = useState("");

  const [
    activeTab,
    setActiveTab,
  ] = useState("overall");

  const [
    entranceForm,
    setEntranceForm,
  ] = useState({
    title: "",
    artist: "",
    spotifyUrl: "",
  });

  const [
    editingEntranceId,
    setEditingEntranceId,
  ] = useState(null);

  const [
    savingEntrance,
    setSavingEntrance,
  ] = useState(false);

  const [
    entranceError,
    setEntranceError,
  ] = useState("");

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

  useEffect(() => {
    const entranceSongsRef = collection(
      db,
      "weddings",
      WEDDING_ID,
      "bridesmaidEntranceSongs"
    );

    const unsubscribe = onSnapshot(
      entranceSongsRef,
      (snapshot) => {
        const loadedSongs = snapshot.docs
          .map((songDoc) => ({
            id: songDoc.id,
            ...songDoc.data(),
          }))
          .sort(compareSongs);

        setEntranceSongs(loadedSongs);
        setEntranceError("");
      },
      (firebaseError) => {
        console.error(
          "Error loading bridesmaid entrance songs:",
          firebaseError
        );

        setEntranceError(
          "We couldn't load the bridesmaid entrance songs."
        );
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const votesRef = collection(
      db,
      "weddings",
      WEDDING_ID,
      "bridesmaidSongVotes"
    );

    const unsubscribe = onSnapshot(
      votesRef,
      (snapshot) => {
        setEntranceVotes(
          snapshot.docs.map((voteDoc) => ({
            id: voteDoc.id,
            ...voteDoc.data(),
          }))
        );
      },
      (firebaseError) => {
        console.error("Error loading bridesmaid song votes:", firebaseError);
        setEntranceError("We couldn't load the poll results.");
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

  const entrancePollResults = useMemo(
    () => entranceSongs.map((song) => {
      const ratingCounts = { yes: 0, maybe: 0, no: 0 };
      let favoriteCount = 0;

      entranceVotes.forEach((vote) => {
        if (vote.favoriteSongId === song.id) {
          favoriteCount += 1;
        }

        const rating = vote.ratings?.[song.id];
        if (rating && Object.prototype.hasOwnProperty.call(ratingCounts, rating)) {
          ratingCounts[rating] += 1;
        }
      });

      return { ...song, favoriteCount, ratingCounts };
    }),
    [entranceSongs, entranceVotes]
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

  const handleEntranceChange = (event) => {
    const { name, value } = event.target;

    setEntranceForm((current) => ({
      ...current,
      [name]: value,
    }));

    setEntranceError("");
  };

  const resetEntranceForm = () => {
    setEntranceForm({
      title: "",
      artist: "",
      spotifyUrl: "",
    });
    setEditingEntranceId(null);
    setEntranceError("");
  };

  const handleEntranceSubmit = async (event) => {
    event.preventDefault();

    const title = entranceForm.title.trim();
    const artist = entranceForm.artist.trim();
    const spotifyUrl = entranceForm.spotifyUrl.trim();

    if (!title) {
      setEntranceError("Enter a song title.");
      return;
    }

    if (spotifyUrl && !isSpotifyTrackUrl(spotifyUrl)) {
      setEntranceError(
        "The Spotify link doesn't look like a valid Spotify track link."
      );
      return;
    }

    setSavingEntrance(true);
    setEntranceError("");

    try {
      const songData = {
        title,
        artist,
        spotifyUrl,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid || null,
      };

      if (editingEntranceId) {
        await updateDoc(
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "bridesmaidEntranceSongs",
            editingEntranceId
          ),
          songData
        );
      } else {
        await addDoc(
          collection(
            db,
            "weddings",
            WEDDING_ID,
            "bridesmaidEntranceSongs"
          ),
          {
            ...songData,
            order: entranceSongs.length,
            createdAt: serverTimestamp(),
            createdBy: user?.uid || null,
          }
        );
      }

      resetEntranceForm();
    } catch (firebaseError) {
      console.error(
        "Error saving bridesmaid entrance song:",
        firebaseError
      );

      setEntranceError(
        "We couldn't save that bridesmaid entrance song."
      );
    } finally {
      setSavingEntrance(false);
    }
  };

  const handleEditEntranceSong = (song) => {
    setEditingEntranceId(song.id);
    setEntranceForm({
      title: song.title || "",
      artist: song.artist || "",
      spotifyUrl: song.spotifyUrl || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeleteEntranceSong = async (song) => {
    const confirmed = window.confirm(
      `Delete "${song.title}" from bridesmaid entrance candidates?`
    );

    if (!confirmed) return;

    try {
      await deleteDoc(
        doc(
          db,
          "weddings",
          WEDDING_ID,
          "bridesmaidEntranceSongs",
          song.id
        )
      );

      if (editingEntranceId === song.id) {
        resetEntranceForm();
      }
    } catch (firebaseError) {
      console.error(
        "Error deleting bridesmaid entrance song:",
        firebaseError
      );

      setEntranceError(
        "We couldn't delete that bridesmaid entrance song."
      );
    }
  };

  const handleMoveEntranceSong = async (song, direction) => {
    const currentIndex = entranceSongs.findIndex(
      (item) => item.id === song.id
    );

    const nextIndex = direction === "up"
      ? currentIndex - 1
      : currentIndex + 1;

    if (
      currentIndex < 0 ||
      nextIndex < 0 ||
      nextIndex >= entranceSongs.length
    ) {
      return;
    }

    const reordered = [...entranceSongs];
    const [movedSong] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, movedSong);

    try {
      const batch = writeBatch(db);

      reordered.forEach((item, index) => {
        batch.update(
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "bridesmaidEntranceSongs",
            item.id
          ),
          {
            order: index,
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid || null,
          }
        );
      });

      await batch.commit();
    } catch (firebaseError) {
      console.error(
        "Error reordering bridesmaid entrance songs:",
        firebaseError
      );

      setEntranceError(
        "We couldn't reorder the bridesmaid entrance songs."
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

      <nav className="music-page-tabs music-admin-tabs" role="tablist" aria-label="Music administration sections">
        <button
          type="button"
          className={`music-page-tab${activeTab === "overall" ? " is-active" : ""}`}
          role="tab"
          id="music-admin-tab-overall"
          aria-controls="music-admin-panel-overall"
          aria-selected={activeTab === "overall"}
          aria-pressed={activeTab === "overall"}
          onClick={() => setActiveTab("overall")}
        >
          Overall Wedding Songs
        </button>
        <button
          type="button"
          className={`music-page-tab${activeTab === "bridesmaid" ? " is-active" : ""}`}
          role="tab"
          id="music-admin-tab-bridesmaid"
          aria-controls="music-admin-panel-bridesmaid"
          aria-selected={activeTab === "bridesmaid"}
          aria-pressed={activeTab === "bridesmaid"}
          onClick={() => setActiveTab("bridesmaid")}
        >
          Bridesmaid Song Options
        </button>
      </nav>

      {activeTab === "overall" && (
        <div id="music-admin-panel-overall" role="tabpanel" aria-labelledby="music-admin-tab-overall">
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
        </div>
      )}

      {activeTab === "bridesmaid" && (
        <div id="music-admin-panel-bridesmaid" role="tabpanel" aria-labelledby="music-admin-tab-bridesmaid">
          <section className="content-card music-editor bridesmaid-entrance-admin">
        <div className="music-editor-heading">
          <div>
            <p className="card-eyebrow">
              Bridesmaid Entrance Voting
            </p>

            <h2>
              {editingEntranceId
                ? "Edit Candidate Song"
                : "Add Candidate Song"}
            </h2>

            <p className="music-admin-help-text">
              These songs are stored separately from your regular wedding music
              and appear on the bridesmaid voting page.
            </p>
          </div>

          {editingEntranceId && (
            <button
              type="button"
              className="icon-button"
              onClick={resetEntranceForm}
              aria-label="Cancel editing candidate song"
            >
              <X size={17} />
            </button>
          )}
        </div>

        <form
          className="music-admin-form"
          onSubmit={handleEntranceSubmit}
        >
          <label className="form-field music-title-field">
            <span>Song</span>
            <input
              type="text"
              name="title"
              value={entranceForm.title}
              onChange={handleEntranceChange}
              placeholder="Song title"
              required
            />
          </label>

          <label className="form-field">
            <span>Artist</span>
            <input
              type="text"
              name="artist"
              value={entranceForm.artist}
              onChange={handleEntranceChange}
              placeholder="Artist"
            />
          </label>

          <div className="form-field music-spotify-field">
            <span>Spotify Link</span>
            <input
              type="url"
              name="spotifyUrl"
              value={entranceForm.spotifyUrl}
              onChange={handleEntranceChange}
              placeholder="https://open.spotify.com/track/..."
            />
            <SpotifyFieldStatus
              status={getSpotifyConnectionStatus(entranceForm.spotifyUrl)}
            />
          </div>

          {entranceError && (
            <div className="music-admin-error">
              {entranceError}
            </div>
          )}

          <div className="music-admin-actions">
            {editingEntranceId && (
              <button
                type="button"
                className="secondary-button"
                onClick={resetEntranceForm}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={savingEntrance}
            >
              <Plus size={16} />
              {savingEntrance
                ? "Saving..."
                : editingEntranceId
                  ? "Save Changes"
                  : "Add Candidate Song"}
            </button>
          </div>
        </form>

        <div className="bridesmaid-candidate-list">
          <div className="music-admin-section-heading">
            <div>
              <p className="card-eyebrow">Voting Candidates</p>
              <h3>Bridesmaid Entrance Songs</h3>
            </div>
            <span className="task-count">{entranceSongs.length}</span>
          </div>

          {entranceSongs.length === 0 ? (
            <div className="content-card music-admin-empty">
              <Music2 size={20} />
              <span>No candidate songs added yet.</span>
            </div>
          ) : (
            <div className="music-admin-list">
              {entranceSongs.map((song, index) => (
                <article key={song.id} className="music-admin-card">
                  <div className="music-admin-order">
                    <button
                      type="button"
                      className="icon-button"
                      disabled={index === 0}
                      onClick={() => handleMoveEntranceSong(song, "up")}
                      aria-label="Move candidate song up"
                    >
                      <ArrowUp size={15} />
                    </button>

                    <button
                      type="button"
                      className="icon-button"
                      disabled={index === entranceSongs.length - 1}
                      onClick={() => handleMoveEntranceSong(song, "down")}
                      aria-label="Move candidate song down"
                    >
                      <ArrowDown size={15} />
                    </button>
                  </div>

                  <div className="music-admin-song">
                    <div className="music-admin-song-top">
                      <p>Bridesmaid Entrance</p>
                      <SpotifyBadge
                        connected={isSpotifyTrackUrl(song.spotifyUrl)}
                      />
                    </div>

                    <h3>{song.title}</h3>

                    {song.artist && <span>{song.artist}</span>}
                  </div>

                  <div className="music-admin-card-actions">
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => handleEditEntranceSong(song)}
                      aria-label="Edit candidate song"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      className="icon-button danger"
                      onClick={() => handleDeleteEntranceSong(song)}
                      aria-label="Delete candidate song"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bridesmaid-results-section" aria-labelledby="admin-bridesmaid-results-title">
        <div className="bridesmaid-results-heading">
          <p className="card-eyebrow">Poll Results</p>
          <h2 id="admin-bridesmaid-results-title">Bridesmaid Song Results</h2>
          <p>
            {entranceVotes.length === 1
              ? "1 response submitted so far."
              : `${entranceVotes.length} responses submitted so far.`} Results update as votes are saved.
          </p>
        </div>

        {entranceVotes.length === 0 ? (
          <div className="content-card bridesmaid-results-empty">
            Results will appear here once someone submits their choices.
          </div>
        ) : entranceSongs.length === 0 ? (
          <div className="content-card bridesmaid-results-empty">
            Add candidate songs above to see poll results.
          </div>
        ) : (
          <div className="bridesmaid-results-list">
            {entrancePollResults
              .slice()
              .sort((a, b) => b.favoriteCount - a.favoriteCount || compareSongs(a, b))
              .map((song, index) => (
                <article className="content-card bridesmaid-result-card" key={song.id}>
                  <div className="bridesmaid-result-title-row">
                    <span className="bridesmaid-result-rank">{index + 1}</span>
                    <div className="bridesmaid-result-song-title">
                      <h3>{song.title || "Untitled song"}</h3>
                      {song.artist && <p>{song.artist}</p>}
                    </div>
                    <div className="bridesmaid-result-favorite-count">
                      <Star size={16} fill="currentColor" />
                      <strong>{song.favoriteCount}</strong>
                      <span>{song.favoriteCount === 1 ? "favorite" : "favorites"}</span>
                    </div>
                  </div>
                  <div className="bridesmaid-result-ratings" aria-label={`Ratings for ${song.title || "song"}`}>
                    <div className="bridesmaid-result-rating rating-yes"><span>Yes</span><strong>{song.ratingCounts.yes}</strong></div>
                    <div className="bridesmaid-result-rating rating-maybe"><span>Maybe</span><strong>{song.ratingCounts.maybe}</strong></div>
                    <div className="bridesmaid-result-rating rating-no"><span>No</span><strong>{song.ratingCounts.no}</strong></div>
                  </div>
                </article>
              ))}
          </div>
        )}
      </section>

      <section
        className="content-card bridesmaid-voters-section"
        aria-labelledby="bridesmaid-voters-title"
      >
        <div className="music-editor-heading">
          <div>
            <p className="card-eyebrow">Voting Activity</p>
            <h2 id="bridesmaid-voters-title">Who Has Voted?</h2>
            <p className="music-admin-help-text">
              {entranceVotes.length}{" "}
              {entranceVotes.length === 1
                ? "person has"
                : "people have"}{" "}
              submitted votes.
            </p>
          </div>
          <span className="task-count">{entranceVotes.length}</span>
        </div>

        <label className="form-field">
          <span>Search voters</span>
          <input
            type="search"
            value={voterSearch}
            onChange={(event) => setVoterSearch(event.target.value)}
            placeholder="Search by name..."
          />
        </label>

        {entranceVotes.length === 0 ? (
          <p className="music-admin-help-text">
            No votes have been submitted yet.
          </p>
        ) : (
          <div className="bridesmaid-voter-list">
            {entranceVotes
              .filter((vote) =>
                (vote.guestName || "Unknown voter")
                  .toLowerCase()
                  .includes(voterSearch.trim().toLowerCase())
              )
              .sort((a, b) =>
                (a.guestName || "").localeCompare(b.guestName || "")
              )
              .map((vote) => {
                const favorite = entranceSongs.find(
                  (song) => song.id === vote.favoriteSongId
                );

                return (
                  <article key={vote.id} className="bridesmaid-voter-card">
                    <div className="bridesmaid-voter-header">
                      <div>
                        <h3>{vote.guestName || "Unknown voter"}</h3>
                        <p>
                          Favorite:{" "}
                          <strong>
                            {favorite
                              ? `${favorite.title}${favorite.artist ? ` - ${favorite.artist}` : ""}`
                              : "Song no longer available"}
                          </strong>
                        </p>
                      </div>
                      <Star size={18} aria-hidden="true" />
                    </div>

                    <div className="bridesmaid-voter-ratings">
                      {entranceSongs
                        .filter((song) => song.id !== vote.favoriteSongId)
                        .map((song) => {
                          const rating = vote.ratings?.[song.id];

                          return (
                            <div key={song.id} className="bridesmaid-voter-rating">
                              <span>
                                {song.title}
                                {song.artist ? ` - ${song.artist}` : ""}
                              </span>
                              <strong>
                                {rating
                                  ? rating.charAt(0).toUpperCase() + rating.slice(1)
                                  : "Not rated"}
                              </strong>
                            </div>
                          );
                        })}
                    </div>

                    <p className="bridesmaid-voter-updated">
                      Last updated:{" "}
                      {vote.updatedAt?.toDate
                        ? vote.updatedAt.toDate().toLocaleString()
                        : "Timestamp unavailable"}
                    </p>
                  </article>
                );
              })}
            {entranceVotes.filter((vote) =>
              (vote.guestName || "Unknown voter")
                .toLowerCase()
                .includes(voterSearch.trim().toLowerCase())
            ).length === 0 && (
              <p className="music-admin-help-text">
                No voters match “{voterSearch}”.
              </p>
            )}
          </div>
        )}
      </section>
        </div>
      )}

      {activeTab === "overall" && (
        <div className="music-admin-overall-panel-content">
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