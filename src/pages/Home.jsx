import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  CalendarDays,
  Clock3,
  Shirt,
  Sparkles,
} from "lucide-react";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import coupleOne from "../assets/home/engagement-photo-1.jpg";
import coupleTwo from "../assets/home/engagement-photo-2.jpg";
import coupleThree from "../assets/home/engagement-photo-3.jpg";
import coupleFour from "../assets/home/engagement-photo-4.jpg";

import {
  db,
} from "../services/firebase";

import {
  WEDDING_ID,
} from "../config/wedding";

import {
  useWedding,
} from "../context/WeddingContext";

const photos = [
  {
    src: coupleOne,
    alt: "Maddie and Nick together",
  },
  {
    src: coupleTwo,
    alt: "Maddie and Nick together",
  },
  {
    src: coupleThree,
    alt: "Maddie and Nick together",
  },
  {
    src: coupleFour,
    alt: "Maddie and Nick together",
  },
];

const homeCards = [
  {
    eyebrow: "Wedding Party",
    title: "Find Your Outfit",
    description:
      "Find your assigned attire, dress or suit options, shoes, and other outfit details.",
    path: "/attire",
    icon: Shirt,
  },
  {
    eyebrow: "Planning Ahead",
    title: "Important Dates",
    description:
      "Keep track of upcoming deadlines, wedding events, and important dates to remember.",
    path: "/important-dates",
    icon: CalendarDays,
  },
  {
    eyebrow: "Wedding Weekend",
    title: "Wedding Weekend",
    description:
      "See the weekend timeline, venue information, music, lodging, and everything else you need.",
    path: "/weekend",
    icon: Sparkles,
  },
];

function Home() {
  const {
    wedding,
    loading: weddingLoading,
  } = useWedding();

  const [
    scheduleItems,
    setScheduleItems,
  ] = useState([]);

  const [
    scheduleLoading,
    setScheduleLoading,
  ] = useState(true);

  const [
    scheduleError,
    setScheduleError,
  ] = useState("");

  useEffect(() => {
    const itemsRef =
      collection(
        db,
        "weddings",
        WEDDING_ID,
        "scheduleItems"
      );

    const publicItemsQuery =
      query(
        itemsRef,
        where(
          "visibility",
          "==",
          "public"
        )
      );

    const unsubscribe =
      onSnapshot(
        publicItemsQuery,
        (snapshot) => {
          const items =
            snapshot.docs.map(
              (document) => ({
                id:
                  document.id,

                ...document.data(),
              })
            );

          setScheduleItems(
            items
          );

          setScheduleError(
            ""
          );

          setScheduleLoading(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading public schedule:",
            firebaseError
          );

          setScheduleError(
            "We couldn't load the upcoming wedding information."
          );

          setScheduleLoading(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  const coupleName =
    buildCoupleName(
      wedding.brideName,
      wedding.groomName
    );

  const nextItem =
    useMemo(
      () =>
        getNextScheduleItem(
          scheduleItems
        ),
      [
        scheduleItems,
      ]
    );

  const nextItemDate =
    getScheduleItemDate(
      nextItem
    );

  const weddingCountdownDate =
    getWeddingCountdownDate(
      wedding.weddingDate,
      wedding.ceremonyTime
    );

  if (
    weddingLoading
  ) {
    return (
      <main className="page">
        <div className="content-card">
          Loading wedding information...
        </div>
      </main>
    );
  }

  return (
    <main className="home-page">
      <header className="home-hero">
        <div
          className="home-hero__photos"
          aria-hidden="true"
        >
          {photos.map(
            (
              photo,
              index
            ) => (
              <img
                key={
                  photo.src
                }
                src={
                  photo.src
                }
                alt=""
                className={`home-hero__photo home-hero__photo--${index + 1}`}
              />
            )
          )}
        </div>

        <div className="home-hero__overlay" />

        <div className="home-hero__content">
          <p className="home-hero__eyebrow">
            Our Wedding
          </p>

          <h1>
            {
              coupleName
            }
          </h1>

          <p className="home-hero__date">
            {
              formatWeddingDateShort(
                wedding.weddingDate
              )
            }
          </p>

          {wedding.venueName && (
            <p className="home-hero__venue">
              {
                wedding.venueName
              }
            </p>
          )}
        </div>
      </header>

      <section className="home-section home-next-section">
        <div className="home-section-heading">
          <p className="page-eyebrow">
            Coming Up
          </p>

          <h2>
            What&apos;s Next?
          </h2>

          <p>
            The next important date on our wedding
            calendar.
          </p>
        </div>

        {scheduleLoading ? (
          <div className="content-card home-next-card">
            Loading what&apos;s next...
          </div>
        ) : scheduleError ? (
          <div className="content-card home-next-card">
            {scheduleError}
          </div>
        ) : nextItem ? (
          <div className="content-card home-next-card">
            <div className="home-next-card__details">
              <span className="home-next-card__label">
                {nextItem.type ===
                "task"
                  ? "Next Deadline"
                  : "Next Event"}
              </span>

              <h3>
                {nextItem.title}
              </h3>

              <div className="home-next-card__meta">
                <span>
                  <CalendarDays
                    size={17}
                  />

                  {
                    formatShortDate(
                      nextItem.date
                    )
                  }
                </span>

                {nextItem.startTime && (
                  <span>
                    <Clock3
                      size={17}
                    />

                    {
                      formatTime(
                        nextItem.startTime
                      )
                    }
                  </span>
                )}
              </div>

              {nextItem.notes && (
                <p>
                  {
                    nextItem.notes
                  }
                </p>
              )}

              <Link
                to="/important-dates"
                className="text-link"
              >
                View all important dates
              </Link>
            </div>

            <div className="home-next-card__countdown">
              <p>
                Countdown
              </p>

              <Countdown
                targetDate={
                  nextItemDate
                }
              />
            </div>
          </div>
        ) : (
          <div className="content-card home-next-card">
            <div className="home-next-card__details">
              <span className="home-next-card__label">
                All Caught Up
              </span>

              <h3>
                Nothing coming up right now
              </h3>

              <p>
                Check back later for more wedding
                updates.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="home-section home-information">
        <div className="home-section-heading">
          <p className="page-eyebrow">
            Wedding Guide
          </p>

          <h2>
            Everything You Need
          </h2>

          <p>
            Find attire information, keep track of
            important dates, and review plans for the
            wedding weekend.
          </p>
        </div>

        <div className="home-card-grid">
          {homeCards.map(
            (card) => {
              const Icon =
                card.icon;

              return (
                <Link
                  key={
                    card.path
                  }
                  to={
                    card.path
                  }
                  className="content-card home-link-card"
                >
                  <div className="home-link-card__icon">
                    <Icon
                      size={24}
                    />
                  </div>

                  <p className="card-eyebrow">
                    {
                      card.eyebrow
                    }
                  </p>

                  <h3>
                    {
                      card.title
                    }
                  </h3>

                  <p>
                    {
                      card.description
                    }
                  </p>

                  <span className="home-link-card__action">
                    View Details
                  </span>
                </Link>
              );
            }
          )}
        </div>
      </section>

      <section className="home-section home-reminder">
        <div className="home-reminder__content">
          <p className="page-eyebrow">
            {
              formatWeddingDateShort(
                wedding.weddingDate
              )
            }
          </p>

          <h2>
            We Can&apos;t Wait to Celebrate With You
          </h2>

          <p>
            Thank you for being such an important
            part of our wedding weekend.
          </p>

          {weddingCountdownDate && (
            <div className="home-reminder__countdown">
              <Countdown
                targetDate={
                  weddingCountdownDate
                }
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Countdown({
  targetDate,
}) {
  const [
    now,
    setNow,
  ] = useState(
    () => new Date()
  );

  useEffect(() => {
    if (
      !targetDate
    ) {
      return undefined;
    }

    const interval =
      window.setInterval(
        () => {
          setNow(
            new Date()
          );
        },
        60000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    targetDate,
  ]);

  if (
    !targetDate
  ) {
    return null;
  }

  const target =
    new Date(
      targetDate
    );

  const difference =
    target.getTime() -
    now.getTime();

  if (
    Number.isNaN(
      target.getTime()
    )
  ) {
    return null;
  }

  if (
    difference <= 0
  ) {
    return (
      <div className="countdown">
        <div className="countdown__item">
          <strong>
            Today
          </strong>

          <span>
            is the day!
          </span>
        </div>
      </div>
    );
  }

  const totalMinutes =
    Math.floor(
      difference /
        1000 /
        60
    );

  const days =
    Math.floor(
      totalMinutes /
        60 /
        24
    );

  const hours =
    Math.floor(
      (
        totalMinutes -
        days *
          24 *
          60
      ) /
        60
    );

  const minutes =
    totalMinutes %
    60;

  return (
    <div className="countdown">
      <div className="countdown__item">
        <strong>
          {days}
        </strong>

        <span>
          Days
        </span>
      </div>

      <div className="countdown__item">
        <strong>
          {hours}
        </strong>

        <span>
          Hours
        </span>
      </div>

      <div className="countdown__item">
        <strong>
          {minutes}
        </strong>

        <span>
          Minutes
        </span>
      </div>
    </div>
  );
}

function getNextScheduleItem(
  items
) {
  const now =
    new Date();

  return [
    ...items,
  ]
    .filter(
      (item) => {
        if (
          !item.date
        ) {
          return false;
        }

        if (
          item.type ===
            "task" &&
          item.completed
        ) {
          return false;
        }

        const itemDate =
          getScheduleItemDate(
            item
          );

        if (
          !itemDate
        ) {
          return false;
        }

        if (
          item.type ===
          "task"
        ) {
          const endOfDay =
            new Date(
              itemDate
            );

          endOfDay.setHours(
            23,
            59,
            59,
            999
          );

          return (
            endOfDay >=
            now
          );
        }

        return (
          itemDate >=
          now
        );
      }
    )
    .sort(
      (
        first,
        second
      ) => {
        const firstDate =
          getScheduleItemDate(
            first
          );

        const secondDate =
          getScheduleItemDate(
            second
          );

        return (
          firstDate -
          secondDate
        );
      }
    )[0] ||
    null;
}

function getScheduleItemDate(
  item
) {
  if (
    !item?.date
  ) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] =
    item.date
      .split("-")
      .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return null;
  }

  let hour = 12;
  let minute = 0;

  if (
    item.startTime
  ) {
    const timeParts =
      item.startTime
        .split(":")
        .map(Number);

    hour =
      timeParts[0] ??
      12;

    minute =
      timeParts[1] ??
      0;
  }

  return new Date(
    year,
    month - 1,
    day,
    hour,
    minute
  );
}

function getWeddingCountdownDate(
  weddingDate,
  ceremonyTime
) {
  if (
    !weddingDate
  ) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] =
    weddingDate
      .split("-")
      .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return null;
  }

  let hour = 12;
  let minute = 0;

  if (
    ceremonyTime
  ) {
    const timeParts =
      ceremonyTime
        .split(":")
        .map(Number);

    hour =
      timeParts[0] ??
      12;

    minute =
      timeParts[1] ??
      0;
  }

  return new Date(
    year,
    month - 1,
    day,
    hour,
    minute
  );
}

function buildCoupleName(
  brideName,
  groomName
) {
  const brideFirst =
    getFirstName(
      brideName
    );

  const groomFirst =
    getFirstName(
      groomName
    );

  if (
    groomFirst &&
    brideFirst
  ) {
    return `${groomFirst} & ${brideFirst}`;
  }

  if (
    groomFirst
  ) {
    return groomFirst;
  }

  if (
    brideFirst
  ) {
    return brideFirst;
  }

  return "Our Wedding";
}

function getFirstName(
  value
) {
  return String(
    value ||
      ""
  )
    .trim()
    .split(/\s+/)[0];
}

function formatWeddingDateShort(
  value
) {
  if (
    !value
  ) {
    return "Wedding Day";
  }

  const date =
    createLocalDate(
      value
    );

  if (
    !date
  ) {
    return "Wedding Day";
  }

  return date.toLocaleDateString(
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

function formatShortDate(
  value
) {
  const date =
    createLocalDate(
      value
    );

  if (
    !date
  ) {
    return "";
  }

  return date.toLocaleDateString(
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

function createLocalDate(
  value
) {
  if (
    !value
  ) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return null;
  }

  return new Date(
    year,
    month - 1,
    day
  );
}

function formatTime(
  value
) {
  if (
    !value
  ) {
    return "";
  }

  const [
    hour,
    minute,
  ] =
    value
      .split(":")
      .map(Number);

  const date =
    new Date();

  date.setHours(
    hour,
    minute,
    0,
    0
  );

  return date.toLocaleTimeString(
    "en-US",
    {
      hour:
        "numeric",

      minute:
        "2-digit",
    }
  );
}

export default Home;