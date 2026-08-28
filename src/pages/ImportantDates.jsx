import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Check,
  Clock3,
  MapPin,
} from "lucide-react";

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

function ImportantDates() {
  const [
    items,
    setItems,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
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
          const loaded =
            snapshot.docs.map(
              (itemDoc) => ({
                id:
                  itemDoc.id,

                ...itemDoc.data(),
              })
            );

          setItems(
            loaded
          );

          setError(
            ""
          );

          setLoading(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading important dates:",
            firebaseError
          );

          setError(
            "We couldn't load the important dates."
          );

          setLoading(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  const sortedItems =
    useMemo(
      () =>
        items
          .filter(
            (item) =>
              item.date
          )
          .sort(
            compareScheduleItems
          ),
      [
        items,
      ]
    );

  const upcomingCount =
    useMemo(
      () =>
        sortedItems.filter(
          (item) =>
            isUpcomingItem(
              item
            )
        ).length,
      [
        sortedItems,
      ]
    );

  return (
    <main className="page important-dates-page">
      <header className="important-dates-intro">
        <p className="page-eyebrow">
          Wedding Guide
        </p>

        <h1 className="page-title">
          Important Dates
        </h1>

        <p className="page-description">
          Keep track of attire deadlines, RSVP dates,
          wedding events, and other important things to
          know before the wedding.
        </p>

        {!loading &&
          !error &&
          sortedItems.length >
            0 && (
            <div className="important-dates-summary">
              <CalendarDays
                size={18}
              />

              <span>
                {upcomingCount ===
                1
                  ? "1 upcoming date"
                  : `${upcomingCount} upcoming dates`}
              </span>
            </div>
          )}
      </header>

      {loading ? (
        <div className="content-card important-dates-status">
          Loading important dates...
        </div>
      ) : error ? (
        <div className="content-card important-dates-status">
          {error}
        </div>
      ) : sortedItems.length ===
        0 ? (
        <div className="content-card important-dates-empty">
          <div className="important-dates-empty__icon">
            <CalendarDays
              size={24}
            />
          </div>

          <div>
            <h2>
              Nothing Posted Yet
            </h2>

            <p>
              There aren't any important dates posted
              yet. Check back later for updates.
            </p>
          </div>
        </div>
      ) : (
        <div className="important-dates-list">
          {sortedItems.map(
            (item) => (
              <ImportantDateCard
                key={
                  item.id
                }
                item={
                  item
                }
              />
            )
          )}
        </div>
      )}
    </main>
  );
}

function ImportantDateCard({
  item,
}) {
  const isEvent =
    item.type ===
    "event";

  const isCompleted =
    item.type ===
      "task" &&
    item.completed;

  const isPast =
    !isUpcomingItem(
      item
    );

  const cardClassName = [
    "important-date-card",
    isEvent
      ? "important-date-event"
      : "important-date-task",
    isCompleted
      ? "important-date-completed-card"
      : "",
    isPast
      ? "important-date-past"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={
        cardClassName
      }
    >
      <div className="important-date-date">
        <span className="important-date-month">
          {
            getMonth(
              item.date
            )
          }
        </span>

        <strong>
          {
            getDay(
              item.date
            )
          }
        </strong>
      </div>

      <div className="important-date-content">
        <div className="important-date-heading-row">
          <div>
            <p className="card-eyebrow">
              {isEvent
                ? "Event"
                : "Deadline"}
            </p>

            <h2>
              {
                item.title
              }
            </h2>
          </div>

          {isCompleted && (
            <span className="important-date-completed">
              <Check
                size={13}
              />

              Completed
            </span>
          )}
        </div>

        <p className="important-date-full-date">
          {
            formatDate(
              item.date
            )
          }
        </p>

        {isEvent && (
          <div className="important-date-details">
            {item.startTime && (
              <div className="important-date-detail">
                <Clock3
                  size={15}
                />

                <span>
                  {
                    formatTime(
                      item.startTime
                    )
                  }

                  {item.endTime && (
                    <>
                      {" - "}
                      {
                        formatTime(
                          item.endTime
                        )
                      }
                    </>
                  )}
                </span>
              </div>
            )}

            {item.location && (
              <div className="important-date-detail">
                <MapPin
                  size={15}
                />

                <span>
                  {
                    item.location
                  }
                </span>
              </div>
            )}
          </div>
        )}

        {item.notes && (
          <p className="important-date-notes">
            {
              item.notes
            }
          </p>
        )}
      </div>
    </article>
  );
}

function isUpcomingItem(
  item
) {
  if (
    !item?.date
  ) {
    return false;
  }

  const now =
    new Date();

  const itemDate =
    createLocalDate(
      item.date
    );

  if (
    item.type ===
      "event" &&
    item.startTime
  ) {
    const [
      hour,
      minute,
    ] =
      item.startTime
        .split(":")
        .map(Number);

    itemDate.setHours(
      hour,
      minute,
      0,
      0
    );

    return (
      itemDate >=
      now
    );
  }

  itemDate.setHours(
    23,
    59,
    59,
    999
  );

  return (
    itemDate >=
    now
  );
}

function compareScheduleItems(
  first,
  second
) {
  const firstDate =
    first.date ||
    "";

  const secondDate =
    second.date ||
    "";

  if (
    firstDate !==
    secondDate
  ) {
    return firstDate.localeCompare(
      secondDate
    );
  }

  const firstTime =
    first.startTime ||
    "23:59";

  const secondTime =
    second.startTime ||
    "23:59";

  return firstTime.localeCompare(
    secondTime
  );
}

function getMonth(
  value
) {
  const date =
    createLocalDate(
      value
    );

  return date
    .toLocaleDateString(
      "en-US",
      {
        month:
          "short",
      }
    )
    .toUpperCase();
}

function getDay(
  value
) {
  const date =
    createLocalDate(
      value
    );

  return date.getDate();
}

function formatDate(
  value
) {
  const date =
    createLocalDate(
      value
    );

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

function createLocalDate(
  value
) {
  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}

export default ImportantDates;