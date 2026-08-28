import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Clock3,
  MapPin,
  Sparkles,
} from "lucide-react";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import {
  db,
} from "../../services/firebase";

import {
  WEDDING_ID,
} from "../../config/wedding";

function WeekendTimeline() {
  const [
    events,
    setEvents,
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

    const weekendEventsQuery =
      query(
        itemsRef,
        where(
          "visibility",
          "==",
          "public"
        ),
        where(
          "type",
          "==",
          "event"
        ),
        where(
          "showOnWeekend",
          "==",
          true
        )
      );

    const unsubscribe =
      onSnapshot(
        weekendEventsQuery,
        (snapshot) => {
          const loaded =
            snapshot.docs.map(
              (itemDoc) => ({
                id:
                  itemDoc.id,

                ...itemDoc.data(),
              })
            );

          setEvents(
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
            "Error loading wedding weekend timeline:",
            firebaseError
          );

          setError(
            "We couldn't load the wedding weekend timeline."
          );

          setLoading(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  const groupedEvents =
    useMemo(
      () => {
        const sorted =
          [...events].sort(
            compareEvents
          );

        return sorted.reduce(
          (
            groups,
            event
          ) => {
            if (
              !groups[
                event.date
              ]
            ) {
              groups[
                event.date
              ] = [];
            }

            groups[
              event.date
            ].push(
              event
            );

            return groups;
          },
          {}
        );
      },
      [
        events,
      ]
    );

  const dates =
    Object.keys(
      groupedEvents
    ).sort();

  const eventCount =
    events.length;

  return (
    <main className="page weekend-detail-page weekend-timeline-page">
      <header className="weekend-timeline-intro">
        <p className="page-eyebrow">
          Wedding Weekend
        </p>

        <h1 className="page-title">
          Weekend Timeline
        </h1>

        <p className="page-description">
          Rehearsal plans, wedding-day details, and
          everything happening throughout the weekend.
        </p>

        {!loading &&
          !error &&
          dates.length >
            0 && (
            <div className="weekend-timeline-summary">
              <CalendarDays
                size={18}
              />

              <span>
                {dates.length ===
                1
                  ? "1 day"
                  : `${dates.length} days`}
              </span>

              <span className="weekend-timeline-summary-dot">
                •
              </span>

              <span>
                {eventCount ===
                1
                  ? "1 event"
                  : `${eventCount} events`}
              </span>
            </div>
          )}
      </header>

      {loading ? (
        <div className="content-card">
          Loading wedding weekend...
        </div>
      ) : error ? (
        <div className="content-card">
          {error}
        </div>
      ) : dates.length ===
        0 ? (
        <div className="content-card weekend-events-empty">
          <CalendarDays
            size={22}
          />

          <div>
            <h2>
              Timeline Coming Soon
            </h2>

            <p>
              The wedding weekend timeline hasn't been
              posted yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="weekend-timeline">
          {dates.map(
            (
              date,
              index
            ) => (
              <TimelineDay
                key={
                  date
                }
                date={
                  date
                }
                events={
                  groupedEvents[
                    date
                  ]
                }
                dayNumber={
                  index + 1
                }
              />
            )
          )}
        </div>
      )}
    </main>
  );
}

function TimelineDay({
  date,
  events,
  dayNumber,
}) {
  return (
    <section className="weekend-timeline-day">
      <div className="weekend-day-heading">
        <span className="weekend-day-number">
          Day {dayNumber}
        </span>

        <p>
          {
            getWeekday(
              date
            )
          }
        </p>

        <h2>
          {
            getMonthDay(
              date
            )
          }
        </h2>
      </div>

      <div className="weekend-day-events">
        {events.map(
          (event) => (
            <TimelineEvent
              key={
                event.id
              }
              event={
                event
              }
            />
          )
        )}
      </div>
    </section>
  );
}

function TimelineEvent({
  event,
}) {
  const subevents =
    Array.isArray(
      event.subevents
    )
      ? [...event.subevents].sort(
          compareSubevents
        )
      : [];

  const hasSubevents =
    subevents.length >
    0;

  return (
    <article
      className={`weekend-timeline-event ${
        hasSubevents
          ? "weekend-timeline-event-featured"
          : ""
      }`}
    >
      <div className="weekend-timeline-marker">
        <span />
      </div>

      <div className="weekend-timeline-event-body">
        <div className="weekend-timeline-event-header">
          <div>
            <div className="weekend-timeline-event-meta">
              {event.startTime && (
                <p className="weekend-timeline-time">
                  <Clock3
                    size={14}
                  />

                  <span>
                    {
                      formatTime(
                        event.startTime
                      )
                    }

                    {event.endTime && (
                      <>
                        {" - "}
                        {
                          formatTime(
                            event.endTime
                          )
                        }
                      </>
                    )}
                  </span>
                </p>
              )}

              {hasSubevents && (
                <span className="weekend-timeline-featured-label">
                  <Sparkles
                    size={13}
                  />

                  Full Schedule
                </span>
              )}
            </div>

            <h3>
              {
                event.title
              }
            </h3>
          </div>
        </div>

        {event.location && (
          <div className="weekend-timeline-detail">
            <MapPin
              size={15}
            />

            <span>
              {
                event.location
              }
            </span>
          </div>
        )}

        {event.notes && (
          <p className="weekend-timeline-notes">
            {
              event.notes
            }
          </p>
        )}

        {hasSubevents && (
          <div className="public-subevent-list">
            {subevents.map(
              (
                subevent,
                index
              ) => (
                <PublicSubevent
                  key={
                    subevent.id ||
                    `${event.id}-${index}`
                  }
                  subevent={
                    subevent
                  }
                />
              )
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function PublicSubevent({
  subevent,
}) {
  return (
    <div className="public-subevent">
      <div className="public-subevent-time">
        <Clock3
          size={14}
        />

        <span>
          {subevent.startTime
            ? formatTime(
                subevent.startTime
              )
            : "Any time"}

          {subevent.endTime && (
            <>
              {" - "}
              {
                formatTime(
                  subevent.endTime
                )
              }
            </>
          )}
        </span>
      </div>

      <div className="public-subevent-content">
        <h4>
          {
            subevent.title
          }
        </h4>

        {subevent.location && (
          <div className="public-subevent-location">
            <MapPin
              size={13}
            />

            <span>
              {
                subevent.location
              }
            </span>
          </div>
        )}

        {subevent.notes && (
          <p>
            {
              subevent.notes
            }
          </p>
        )}
      </div>
    </div>
  );
}

function compareEvents(
  first,
  second
) {
  if (
    first.date !==
    second.date
  ) {
    return first.date.localeCompare(
      second.date
    );
  }

  const firstTime =
    first.startTime ||
    getFirstSubeventTime(
      first
    ) ||
    "23:59";

  const secondTime =
    second.startTime ||
    getFirstSubeventTime(
      second
    ) ||
    "23:59";

  return firstTime.localeCompare(
    secondTime
  );
}

function compareSubevents(
  first,
  second
) {
  const firstOrder =
    first.order;

  const secondOrder =
    second.order;

  if (
    typeof firstOrder ===
      "number" &&
    typeof secondOrder ===
      "number" &&
    firstOrder !==
      secondOrder
  ) {
    return (
      firstOrder -
      secondOrder
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

function getFirstSubeventTime(
  event
) {
  if (
    !Array.isArray(
      event.subevents
    ) ||
    event.subevents.length ===
      0
  ) {
    return "";
  }

  const sorted =
    [...event.subevents].sort(
      compareSubevents
    );

  return (
    sorted[0]
      ?.startTime ||
    ""
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

function getWeekday(
  value
) {
  return createLocalDate(
    value
  ).toLocaleDateString(
    "en-US",
    {
      weekday:
        "long",
    }
  );
}

function getMonthDay(
  value
) {
  return createLocalDate(
    value
  ).toLocaleDateString(
    "en-US",
    {
      month:
        "long",

      day:
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

export default WeekendTimeline;