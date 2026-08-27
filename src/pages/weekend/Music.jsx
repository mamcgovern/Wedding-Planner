import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Music2,
} from "lucide-react";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import {
  db,
} from "../../services/firebase";

import {
  WEDDING_ID,
} from "../../config/wedding";

const musicCategories = [
  {
    type: "prelude",
    eyebrow: "Prelude",
    title: "Prelude Music",
    id: "prelude",
  },
  {
    type: "ceremony",
    eyebrow: "Ceremony",
    title: "Ceremony Music",
    id: "ceremony",
  },
  {
    type: "reception",
    eyebrow: "Reception",
    title: "Reception Music",
    id: "reception",
  },
  {
    type: "must-play",
    eyebrow: "Dance Floor",
    title: "Must Plays",
    id: "must-plays",
  },
];

function Music() {
  const [
    songs,
    setSongs,
  ] = useState([]);

  const [
    musicConfig,
    setMusicConfig,
  ] = useState({
    playlistUrl: "",
    requestFormUrl: "",
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
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

          let loadedConfig = {
            playlistUrl: "",
            requestFormUrl: "",
          };

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

          setError("");
          setLoading(false);
        },
        (firebaseError) => {
          console.error(
            "Error loading music:",
            firebaseError
          );

          setError(
            "We couldn't load the wedding music."
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
              category.type
            ] =
              songs
                .filter(
                  (song) =>
                    song.type ===
                    category.type
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

  const playlistEmbedUrl =
    getSpotifyPlaylistEmbedUrl(
      musicConfig.playlistUrl
    );

  const requestFormEmbedUrl =
    getGoogleFormEmbedUrl(
      musicConfig.requestFormUrl
    );

  const navigation =
    useMemo(
      () => {
        const items =
          musicCategories
            .filter(
              (category) =>
                (
                  songsByCategory[
                    category.type
                  ] || []
                ).length >
                0
            )
            .map(
              (category) => ({
                label:
                  getNavLabel(
                    category.type
                  ),

                id:
                  category.id,
              })
            );

        if (
          playlistEmbedUrl
        ) {
          items.push({
            label:
              "Playlist",

            id:
              "playlist",
          });
        }

        if (
          requestFormEmbedUrl
        ) {
          items.push({
            label:
              "Request a Song",

            id:
              "song-request",
          });
        }

        return items;
      },
      [
        songsByCategory,
        playlistEmbedUrl,
        requestFormEmbedUrl,
      ]
    );

  return (
    <main className="page weekend-detail-page music-page">
      <p className="page-eyebrow">
        Wedding Weekend
      </p>

      <h1 className="page-title">
        Music
      </h1>

      <p className="page-description">
        Prelude music, ceremony songs, special dances,
        must-plays, our reception playlist, and a place
        to send us your own song request.
      </p>

      {navigation.length >
        0 && (
        <nav
          className="music-page-nav"
          aria-label="Music sections"
        >
          {navigation.map(
            (item) => (
              <a
                key={
                  item.id
                }
                href={`#${item.id}`}
                className="music-page-nav-link"
              >
                {
                  item.label
                }
              </a>
            )
          )}
        </nav>
      )}

      {loading ? (
        <div className="content-card">
          Loading wedding music...
        </div>
      ) : error ? (
        <div className="content-card">
          {error}
        </div>
      ) : (
        <div className="music-page-content">
          {musicCategories.map(
            (category) => {
              const categorySongs =
                songsByCategory[
                  category.type
                ] || [];

              if (
                categorySongs.length ===
                0
              ) {
                return null;
              }

              return (
                <MusicSection
                  key={
                    category.type
                  }
                  id={
                    category.id
                  }
                  eyebrow={
                    category.eyebrow
                  }
                  title={
                    category.title
                  }
                  songs={
                    categorySongs
                  }
                />
              );
            }
          )}

          {playlistEmbedUrl && (
            <section
              className="music-special-section"
              id="playlist"
            >
              <div className="music-special-heading">
                <p className="card-eyebrow">
                  Listen Along
                </p>

                <h2>
                  Spotify Playlist
                </h2>

                <p>
                  Listen to some of the songs we plan to
                  play throughout the reception.
                </p>
              </div>

              <SpotifyPlaylist
                embedUrl={
                  playlistEmbedUrl
                }
              />
            </section>
          )}

          {requestFormEmbedUrl && (
            <section
              className="music-special-section music-request"
              id="song-request"
            >
              <div className="music-special-heading">
                <p className="card-eyebrow">
                  Have a Request?
                </p>

                <h2>
                  Request a Song
                </h2>

                <p>
                  Is there a song you want to hear at
                  the reception? Send us your request
                  below!
                </p>
              </div>

              <div className="music-request-form">
                <iframe
                  src={
                    requestFormEmbedUrl
                  }
                  width="100%"
                  height="1050"
                  frameBorder="0"
                  marginHeight="0"
                  marginWidth="0"
                  title="Wedding Song Request Form"
                  loading="lazy"
                >
                  Loading…
                </iframe>
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

function MusicSection({
  id,
  eyebrow,
  title,
  songs,
}) {
  return (
    <section
      className="music-section"
      id={
        id
      }
    >
      <div className="music-section-heading">
        <p className="card-eyebrow">
          {eyebrow}
        </p>

        <h2>
          {title}
        </h2>
      </div>

      <div className="music-embed-list">
        {songs.map(
          (song) => (
            <SongEmbed
              key={
                song.id
              }
              song={
                song
              }
            />
          )
        )}
      </div>
    </section>
  );
}

function SongEmbed({
  song,
}) {
  const embedUrl =
    getSpotifyTrackEmbedUrl(
      song.spotifyUrl
    );

  if (!embedUrl) {
    return (
      <article className="music-fallback-card">
        <div className="music-fallback-icon">
          <Music2
            size={19}
          />
        </div>

        <div>
          <p className="music-card-section">
            {
              song.section ||
              "Song"
            }
          </p>

          <h3>
            {
              song.title ||
              "TBD"
            }
          </h3>

          {song.artist && (
            <p className="music-card-artist">
              {
                song.artist
              }
            </p>
          )}

          <p className="music-no-spotify">
            Add a Spotify track link to enable playback.
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="music-embed-card">
      {song.section && (
        <div className="music-embed-label">
          {
            song.section
          }
        </div>
      )}

      <iframe
        src={
          embedUrl
        }
        title={`Spotify player for ${song.title}`}
        className="spotify-track-embed"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </article>
  );
}

function SpotifyPlaylist({
  embedUrl,
}) {
  return (
    <div className="spotify-playlist-card">
      <iframe
        src={
          embedUrl
        }
        width="100%"
        height="500"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title="Wedding Reception Spotify Playlist"
      />
    </div>
  );
}

function getSpotifyTrackEmbedUrl(
  value
) {
  return getSpotifyEmbedUrl(
    value,
    "track"
  );
}

function getSpotifyPlaylistEmbedUrl(
  value
) {
  return getSpotifyEmbedUrl(
    value,
    "playlist"
  );
}

function getSpotifyEmbedUrl(
  value,
  expectedType
) {
  if (!value) {
    return "";
  }

  try {
    const url =
      new URL(
        value.trim()
      );

    if (
      url.hostname !==
        "open.spotify.com" &&
      url.hostname !==
        "www.open.spotify.com"
    ) {
      return "";
    }

    const pathParts =
      url.pathname
        .split("/")
        .filter(Boolean);

    const typeIndex =
      pathParts.indexOf(
        expectedType
      );

    if (
      typeIndex ===
        -1 ||
      !pathParts[
        typeIndex + 1
      ]
    ) {
      return "";
    }

    const spotifyId =
      pathParts[
        typeIndex + 1
      ];

    return `https://open.spotify.com/embed/${expectedType}/${spotifyId}?utm_source=generator`;
  } catch {
    return "";
  }
}

function getGoogleFormEmbedUrl(
  value
) {
  if (!value) {
    return "";
  }

  try {
    const url =
      new URL(
        value.trim()
      );

    if (
      url.hostname !==
        "docs.google.com" ||
      !url.pathname.includes(
        "/forms/"
      )
    ) {
      return "";
    }

    url.searchParams.set(
      "embedded",
      "true"
    );

    return url.toString();
  } catch {
    return "";
  }
}

function getNavLabel(
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
    return "Ceremony";
  }

  if (
    type ===
    "reception"
  ) {
    return "Reception";
  }

  return "Must Plays";
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
    first.section ||
    first.title ||
    ""
  ).localeCompare(
    String(
      second.section ||
      second.title ||
      ""
    )
  );
}

export default Music;