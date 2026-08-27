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

    const unsubscribe =
      onSnapshot(
        itemsRef,
        (snapshot) => {
          const loaded =
            snapshot.docs
              .map(
                (itemDoc) => ({
                  id:
                    itemDoc.id,

                  ...itemDoc.data(),
                })
              )
              .filter(
                (item) =>
                  item.visibility ===
                  "public"
              );

          setItems(
            loaded
          );

          setError("");
          setLoading(false);
        },
        (firebaseError) => {
          console.error(
            "Error loading important dates:",
            firebaseError
          );

          setError(
            "We couldn't load the important dates."
          );

          setLoading(false);
        }
      );

    return unsubscribe;
  }, []);

  const upcomingItems =
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
      [items]
    );

  return (
    <main className="page important-dates-page">
      <p className="page-eyebrow">
        Wedding Party
      </p>

      <h1 className="page-title">
        Important Dates
      </h1>

      <p className="page-description">
        Keep track of attire deadlines, RSVP dates,
        wedding events, and other things you need to
        know before the wedding.
      </p>

      {loading ? (
        <div className="content-card">
          Loading important dates...
        </div>
      ) : error ? (
        <div className="content-card">
          {error}
        </div>
      ) : upcomingItems.length ===
        0 ? (
        <div className="content-card important-dates-empty">
          <CalendarDays
            size={22}
          />

          <p>
            There aren't any important dates posted yet.
          </p>
        </div>
      ) : (
        <div className="important-dates-list">
          {upcomingItems.map(
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

  return (
    <article
      className={`important-date-card ${
        isEvent
          ? "important-date-event"
          : "important-date-task"
      }`}
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
        <p className="card-eyebrow">
          {isEvent
            ? "Event"
            : "Deadline"}
        </p>

        <h2>
          {item.title}
        </h2>

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
            {item.notes}
          </p>
        )}

        {item.type ===
          "task" &&
          item.completed && (
            <span className="important-date-completed">
              <Check
                size={13}
              />

              Completed
            </span>
          )}
      </div>
    </article>
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
  if (!value) {
    return "";
  }

  const [
    hour,
    minute,
  ] = value
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
  ] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}

export default ImportantDates;