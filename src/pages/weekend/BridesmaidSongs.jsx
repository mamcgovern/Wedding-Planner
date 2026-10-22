import {
  useEffect,
  useMemo,
  useState,
} from "react";


import {
  Check,
  Heart,
  LoaderCircle,
  Music2,
  Save,
  Star,
} from "lucide-react";

import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../../services/firebase";
import { WEDDING_ID } from "../../config/wedding";

// This list is intentionally independent of the Firestore guest list.
// Keep these IDs stable so each person's votes are saved consistently.
const BRIDESMAID_VOTERS = [
  { id: "sydni-edgington", displayName: "Sydni Edgington" },
  { id: "toph-mcgovern", displayName: "Toph McGovern" },
  { id: "kay-mcgovern", displayName: "Kay McGovern" },
  { id: "maddelynne-mcgovern", displayName: "Maddelynne McGovern" },
  { id: "lizzy-cardey", displayName: "Lizzy Cardey" },
  { id: "nicholas-bergan", displayName: "Nicholas Bergan" },
  { id: "taylor-bergan", displayName: "Taylor Bergan" },
  { id: "emily-curry", displayName: "Emily Curry" },
];

const RATING_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
];

function BridesmaidSongs() {
  const [songs, setSongs] = useState([]);
  const [votes, setVotes] = useState([]);
  const [selectedGuestId, setSelectedGuestId] = useState("");
  const [favoriteSongId, setFavoriteSongId] = useState("");
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let loadedParts = 0;
    const markLoaded = () => {
      loadedParts += 1;
      if (loadedParts >= 2) setLoading(false);
    };

    const entranceSongsRef = collection(
      db,
      "weddings",
      WEDDING_ID,
      "bridesmaidEntranceSongs"
    );
    const votesRef = collection(
      db,
      "weddings",
      WEDDING_ID,
      "bridesmaidSongVotes"
    );

    const unsubscribeMusic = onSnapshot(
      entranceSongsRef,
      (snapshot) => {
        const loadedSongs = snapshot.docs
          .map((musicDoc) => ({ id: musicDoc.id, ...musicDoc.data() }))
          .sort(compareSongs);

        setSongs(loadedSongs);
        markLoaded();
      },
      (firebaseError) => {
        console.error("Error loading bridesmaid entrance songs:", firebaseError);
        setError("We couldn't load the candidate songs. Please try refreshing the page.");
        markLoaded();
      }
    );

    const unsubscribeVotes = onSnapshot(
      votesRef,
      (snapshot) => {
        setVotes(snapshot.docs.map((voteDoc) => ({
          id: voteDoc.id,
          ...voteDoc.data(),
        })));
        markLoaded();
      },
      (firebaseError) => {
        console.error("Error loading song votes:", firebaseError);
        setError("We couldn't load saved votes. You can still try submitting your choices.");
        markLoaded();
      }
    );

    return () => {
      unsubscribeMusic();
      unsubscribeVotes();
    };
  }, []);

  const selectedGuest = useMemo(
    () => BRIDESMAID_VOTERS.find((guest) => guest.id === selectedGuestId),
    [selectedGuestId]
  );

  // Match by stable ID for new votes and by name for votes saved before
  // the voter list was decoupled from the guest collection.
  const existingVote = useMemo(
    () => votes.find(
      (vote) =>
        vote.id === selectedGuestId ||
        normalizeName(vote.guestName) === normalizeName(selectedGuest?.displayName)
    ),
    [votes, selectedGuestId, selectedGuest]
  );

  const pollResults = useMemo(
    () => songs.map((song) => {
      const ratingCounts = { yes: 0, maybe: 0, no: 0 };
      let favoriteCount = 0;

      votes.forEach((vote) => {
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
    [songs, votes]
  );

  useEffect(() => {
    if (!selectedGuestId) {
      setFavoriteSongId("");
      setRatings({});
      setMessage("");
      return;
    }

    const selectedName = BRIDESMAID_VOTERS.find((guest) => guest.id === selectedGuestId)?.displayName;
    const vote = votes.find(
      (item) =>
        item.id === selectedGuestId ||
        normalizeName(item.guestName) === normalizeName(selectedName)
    );
    setFavoriteSongId(vote?.favoriteSongId || "");
    setRatings(vote?.ratings || {});
    setMessage(vote ? "Your previous choices have been loaded. You can update them below." : "");
    setError("");
  }, [selectedGuestId, votes]);

  const handleRatingChange = (songId, value) => {
    setRatings((current) => ({ ...current, [songId]: value }));
    setMessage("");
    setError("");
  };

  const handleFavoriteChange = (songId) => {
    setFavoriteSongId(songId);
    setRatings((current) => {
      const next = { ...current };
      delete next[songId];
      return next;
    });
    setMessage("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!selectedGuest || !favoriteSongId) {
      setError("Please select your name and choose one favorite song.");
      return;
    }

    const unratedSongs = songs.filter(
      (song) => song.id !== favoriteSongId && !ratings[song.id]
    );

    if (unratedSongs.length > 0) {
      setError("Please rate every other song Yes, Maybe, or No before submitting.");
      return;
    }

    setSaving(true);

    try {
      await setDoc(
        doc(
          db,
          "weddings",
          WEDDING_ID,
          "bridesmaidSongVotes",
          existingVote?.id || selectedGuestId
        ),
        {
          guestId: selectedGuestId,
          guestName: selectedGuest.displayName,
          favoriteSongId,
          ratings: Object.fromEntries(
            songs
              .filter((song) => song.id !== favoriteSongId)
              .map((song) => [song.id, ratings[song.id]])
          ),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMessage("Your votes have been saved. You can come back and update them any time.");
    } catch (firebaseError) {
      console.error("Error saving bridesmaid song votes:", firebaseError);
      setError("We couldn't save your votes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="page weekend-detail-page bridesmaid-songs-page">
        <div className="content-card bridesmaid-songs-status">
          <LoaderCircle size={22} className="bridesmaid-songs-spinner" />
          Loading song choices...
        </div>
      </main>
    );
  }

  return (
    <main className="page weekend-detail-page bridesmaid-songs-page">
      <header className="bridesmaid-songs-intro">
        <p className="page-eyebrow">Wedding Weekend</p>
        <h1 className="page-title">Bridesmaid Entrance Songs</h1>
        <p className="page-description">
          Help us choose one song for the bridesmaids' entrance! Listen to each
          option, pick your favorite, and rate the rest.
        </p>
      </header>

      <form className="bridesmaid-songs-form" onSubmit={handleSubmit}>
        <section className="content-card bridesmaid-voter-card">
          <label className="bridesmaid-field-label" htmlFor="bridesmaid-voter">
            Select your name
          </label>
          <select
            id="bridesmaid-voter"
            className="bridesmaid-voter-select"
            value={selectedGuestId}
            onChange={(event) => setSelectedGuestId(event.target.value)}
            required
          >
            <option value="">Choose your name...</option>
            {BRIDESMAID_VOTERS.map((guest) => (
              <option key={guest.id} value={guest.id}>
                {guest.displayName}
              </option>
            ))}
          </select>
          <p className="bridesmaid-field-help">
            Your choices are saved under your name, so you can change them later.
          </p>
        </section>

        {songs.length === 0 ? (
          <section className="content-card bridesmaid-songs-empty">
            <Music2 size={24} />
            <div>
              <h2>No songs yet</h2>
            </div>
          </section>
        ) : (
          <>
            <div className="bridesmaid-voting-instructions">
              <div className="bridesmaid-instruction-icon">
                <Heart size={20} />
              </div>
              <div>
                <h2>Choose your favorite</h2>
                <p>
                  Mark exactly one song as your favorite. Then rate every other song
                  as Yes, Maybe, or No.
                </p>
              </div>
            </div>

            <div className="bridesmaid-song-list">
              {songs.map((song, index) => {
                const embedUrl = getSpotifyTrackEmbedUrl(song.spotifyUrl);
                const isFavorite = favoriteSongId === song.id;

                return (
                  <article
                    key={song.id}
                    className={`bridesmaid-song-card${isFavorite ? " is-favorite" : ""}`}
                  >
                    <div className="bridesmaid-song-heading">
                      <span className="bridesmaid-song-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="bridesmaid-song-title-wrap">
                        <h3>{song.title || "Untitled song"}</h3>
                        {song.artist && <p>{song.artist}</p>}
                      </div>
                      {isFavorite && (
                        <span className="bridesmaid-favorite-badge">
                          <Star size={14} fill="currentColor" />
                          Favorite
                        </span>
                      )}
                    </div>

                    {embedUrl ? (
                      <div className="bridesmaid-song-embed">
                        <iframe
                          src={embedUrl}
                          title={`Spotify player for ${song.title || "song"}`}
                          className="spotify-track-embed"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <p className="bridesmaid-song-no-embed">
                        Spotify playback will appear when a valid track link is added.
                      </p>
                    )}

                    <div className="bridesmaid-song-actions">
                      <label className={`bridesmaid-favorite-option${isFavorite ? " selected" : ""}`}>
                        <input
                          type="radio"
                          name="favorite-song"
                          value={song.id}
                          checked={isFavorite}
                          onChange={() => handleFavoriteChange(song.id)}
                          disabled={!selectedGuestId}
                        />
                        <Star size={16} />
                        <span>My favorite</span>
                      </label>

                      {!isFavorite && (
                        <fieldset className="bridesmaid-rating-fieldset" disabled={!selectedGuestId}>
                          <legend>My rating</legend>
                          <div className="bridesmaid-rating-options">
                            {RATING_OPTIONS.map((option) => (
                              <label
                                key={option.value}
                                className={`bridesmaid-rating-option rating-${option.value}${ratings[song.id] === option.value ? " selected" : ""}`}
                              >
                                <input
                                  type="radio"
                                  name={`rating-${song.id}`}
                                  value={option.value}
                                  checked={ratings[song.id] === option.value}
                                  onChange={() => handleRatingChange(song.id, option.value)}
                                />
                                <span>{option.label}</span>
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="bridesmaid-submit-area">
              {error && <p className="bridesmaid-form-message error" role="alert">{error}</p>}
              {message && <p className="bridesmaid-form-message success" role="status">{message}</p>}

              <button
                type="submit"
                className="bridesmaid-submit-button"
                disabled={!selectedGuestId || !favoriteSongId || saving}
              >
                {saving ? (
                  <LoaderCircle size={18} className="bridesmaid-songs-spinner" />
                ) : existingVote ? (
                  <Save size={18} />
                ) : (
                  <Check size={18} />
                )}
                {saving ? "Saving..." : existingVote ? "Update My Votes" : "Submit My Votes"}
              </button>
              <p className="bridesmaid-submit-note">
                You can return to this page later and update your choices.
              </p>
            </div>
          </>
        )}

        {songs.length === 0 && (
          <>
            {error && <p className="bridesmaid-form-message error" role="alert">{error}</p>}
            {message && <p className="bridesmaid-form-message success" role="status">{message}</p>}
          </>
        )}
      </form>

      <section className="bridesmaid-results-section" aria-labelledby="bridesmaid-results-title">
        <div className="bridesmaid-results-heading">
          <p className="page-eyebrow">Poll Results</p>
          <h2 id="bridesmaid-results-title">Bridesmaid Song Results</h2>
          <p>
            {votes.length === 1
              ? "1 response submitted so far."
              : `${votes.length} responses submitted so far.`}
          </p>
        </div>

        {votes.length === 0 ? (
          <div className="content-card bridesmaid-results-empty">
            Results will appear here once someone submits their choices.
          </div>
        ) : songs.length === 0 ? (
          <div className="content-card bridesmaid-results-empty">
            Add songs in Music Admin to see poll results.
          </div>
        ) : (
          <div className="bridesmaid-results-list">
            {pollResults
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
                  <div className="bridesmaid-result-ratings" aria-label={`Ratings for ${song.title}`}>
                    <div className="bridesmaid-result-rating rating-yes">
                      <span>Yes</span><strong>{song.ratingCounts.yes}</strong>
                    </div>
                    <div className="bridesmaid-result-rating rating-maybe">
                      <span>Maybe</span><strong>{song.ratingCounts.maybe}</strong>
                    </div>
                    <div className="bridesmaid-result-rating rating-no">
                      <span>No</span><strong>{song.ratingCounts.no}</strong>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        )}
      </section>
    </main>
  );
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getSpotifyTrackEmbedUrl(value) {
  if (!value) return "";

  try {
    const url = new URL(value.trim());

    if (
      url.hostname !== "open.spotify.com" &&
      url.hostname !== "www.open.spotify.com"
    ) {
      return "";
    }

    const pathParts = url.pathname.split("/").filter(Boolean);
    const trackIndex = pathParts.indexOf("track");

    if (trackIndex === -1 || !pathParts[trackIndex + 1]) {
      return "";
    }

    return `https://open.spotify.com/embed/track/${pathParts[trackIndex + 1]}?utm_source=generator`;
  } catch {
    return "";
  }
}

function compareSongs(first, second) {
  const firstOrder = first.order ?? 999;
  const secondOrder = second.order ?? 999;

  if (firstOrder !== secondOrder) {
    return firstOrder - secondOrder;
  }

  return String(first.title || "").localeCompare(String(second.title || ""));
}

export default BridesmaidSongs;
