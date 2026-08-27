import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Eye,
  EyeOff,
  Pencil,
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
  updateDoc,
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

const emptyEventForm = {
  title: "",
  date: "",
  startTime: "",
  endTime: "",
  location: "",
  notes: "",
  visibility: "private",
};

function Calendar() {
  const {
    user,
  } = useAuth();

  const today =
    new Date();

  const [
    currentMonth,
    setCurrentMonth,
  ] = useState(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )
  );

  const [
    items,
    setItems,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    form,
    setForm,
  ] = useState(
    emptyEventForm
  );

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /*
   * LOAD ALL SCHEDULE ITEMS
   */

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

          setLoading(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading calendar:",
            firebaseError
          );

          setError(
            "We couldn't load the calendar."
          );

          setLoading(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  /*
   * EVENTS ONLY
   */

  const events =
    useMemo(
      () =>
        items.filter(
          (item) =>
            item.type ===
            "event"
        ),
      [items]
    );

  /*
   * FORM
   */

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

  const resetForm =
    () => {
      setForm(
        emptyEventForm
      );

      setEditingId(
        null
      );

      setError("");
    };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const title =
        form.title.trim();

      if (!title) {
        setError(
          "Enter an event name."
        );

        return;
      }

      if (!form.date) {
        setError(
          "Choose a date for the event."
        );

        return;
      }

      if (
        form.startTime &&
        form.endTime &&
        form.endTime <
          form.startTime
      ) {
        setError(
          "The event end time can't be before the start time."
        );

        return;
      }

      setSaving(true);
      setError("");

      try {
        const eventData = {
          type:
            "event",

          title,

          date:
            form.date,

          startTime:
            form.startTime,

          endTime:
            form.endTime,

          location:
            form.location.trim(),

          notes:
            form.notes.trim(),

          visibility:
            form.visibility,

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
              "scheduleItems",
              editingId
            ),
            eventData
          );
        } else {
          await addDoc(
            collection(
              db,
              "weddings",
              WEDDING_ID,
              "scheduleItems"
            ),
            {
              ...eventData,

              createdAt:
                serverTimestamp(),

              createdBy:
                user?.uid ||
                null,
            }
          );
        }

        resetForm();

        setCurrentMonth(
          createLocalDate(
            form.date,
            true
          )
        );
      } catch (firebaseError) {
        console.error(
          "Error saving event:",
          firebaseError
        );

        setError(
          "We couldn't save that event."
        );
      } finally {
        setSaving(false);
      }
    };

  /*
   * EDIT
   */

  const handleEdit =
    (item) => {
      setEditingId(
        item.id
      );

      setForm({
        title:
          item.title ||
          "",

        date:
          item.date ||
          "",

        startTime:
          item.startTime ||
          "",

        endTime:
          item.endTime ||
          "",

        location:
          item.location ||
          "",

        notes:
          item.notes ||
          "",

        visibility:
          item.visibility ||
          "private",
      });

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    };

  /*
   * DELETE
   */

  const handleDelete =
    async (item) => {
      const confirmed =
        window.confirm(
          `Delete "${item.title}"?`
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
            "scheduleItems",
            item.id
          )
        );

        if (
          editingId ===
          item.id
        ) {
          resetForm();
        }
      } catch (firebaseError) {
        console.error(
          "Error deleting event:",
          firebaseError
        );

        setError(
          "We couldn't delete that event."
        );
      }
    };

  /*
   * VISIBILITY
   */

  const handleToggleVisibility =
    async (item) => {
      const nextVisibility =
        item.visibility ===
        "public"
          ? "private"
          : "public";

      try {
        await updateDoc(
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "scheduleItems",
            item.id
          ),
          {
            visibility:
              nextVisibility,

            updatedAt:
              serverTimestamp(),

            updatedBy:
              user?.uid ||
              null,
          }
        );
      } catch (firebaseError) {
        console.error(
          "Error changing event visibility:",
          firebaseError
        );

        setError(
          "We couldn't change that event's visibility."
        );
      }
    };

  /*
   * MONTH NAVIGATION
   */

  const previousMonth =
    () => {
      setCurrentMonth(
        (current) =>
          new Date(
            current.getFullYear(),
            current.getMonth() -
              1,
            1
          )
      );
    };

  const nextMonth =
    () => {
      setCurrentMonth(
        (current) =>
          new Date(
            current.getFullYear(),
            current.getMonth() +
              1,
            1
          )
      );
    };

  const goToToday =
    () => {
      const now =
        new Date();

      setCurrentMonth(
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        )
      );
    };

  const calendarDays =
    buildCalendarDays(
      currentMonth
    );

  return (
    <main className="page calendar-page">
      <p className="page-eyebrow">
        Planning
      </p>

      <h1 className="page-title">
        Calendar
      </h1>

      <p className="page-description">
        Manage wedding events and see planning tasks
        and public wedding-party dates together.
      </p>

      <section className="content-card event-editor">
        <div className="event-editor-header">
          <div>
            <p className="card-eyebrow">
              {editingId
                ? "Editing Event"
                : "New Event"}
            </p>

            <h2>
              {editingId
                ? "Edit Event"
                : "Add an Event"}
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
                size={18}
              />
            </button>
          )}
        </div>

        <form
          className="event-form"
          onSubmit={
            handleSubmit
          }
        >
          <label className="form-field event-title-field">
            <span>
              Event
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
              placeholder="Wedding rehearsal"
            />
          </label>

          <label className="form-field">
            <span>
              Date
            </span>

            <input
              type="date"
              name="date"
              value={
                form.date
              }
              onChange={
                handleChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              Visibility
            </span>

            <select
              name="visibility"
              value={
                form.visibility
              }
              onChange={
                handleChange
              }
            >
              <option value="private">
                Private
              </option>

              <option value="public">
                Public
              </option>
            </select>
          </label>

          <label className="form-field">
            <span>
              Start Time
            </span>

            <input
              type="time"
              name="startTime"
              value={
                form.startTime
              }
              onChange={
                handleChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              End Time
            </span>

            <input
              type="time"
              name="endTime"
              value={
                form.endTime
              }
              onChange={
                handleChange
              }
            />
          </label>

          <label className="form-field event-location-field">
            <span>
              Location
            </span>

            <input
              type="text"
              name="location"
              value={
                form.location
              }
              onChange={
                handleChange
              }
              placeholder="Optional location"
            />
          </label>

          <label className="form-field event-notes-field">
            <span>
              Notes
            </span>

            <textarea
              name="notes"
              value={
                form.notes
              }
              onChange={
                handleChange
              }
              rows={3}
              placeholder="Optional notes"
            />
          </label>

          {error && (
            <div className="calendar-error">
              {error}
            </div>
          )}

          <div className="event-form-actions">
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
              <CirclePlus
                size={17}
              />

              {saving
                ? "Saving..."
                : editingId
                  ? "Save Changes"
                  : "Add Event"}
            </button>
          </div>
        </form>
      </section>

      <section className="calendar-section">
        <div className="calendar-toolbar">
          <div>
            <p className="card-eyebrow">
              Schedule
            </p>

            <h2>
              {currentMonth.toLocaleDateString(
                "en-US",
                {
                  month:
                    "long",
                  year:
                    "numeric",
                }
              )}
            </h2>
          </div>

          <div className="calendar-toolbar-actions">
            <button
              type="button"
              className="secondary-button calendar-today-button"
              onClick={
                goToToday
              }
            >
              Today
            </button>

            <button
              type="button"
              className="icon-button"
              onClick={
                previousMonth
              }
              aria-label="Previous month"
            >
              <ChevronLeft
                size={18}
              />
            </button>

            <button
              type="button"
              className="icon-button"
              onClick={
                nextMonth
              }
              aria-label="Next month"
            >
              <ChevronRight
                size={18}
              />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="content-card">
            Loading calendar...
          </div>
        ) : (
          <div className="calendar-wrapper">
            <div className="calendar-weekdays">
              {[
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ].map(
                (day) => (
                  <div
                    key={
                      day
                    }
                  >
                    {day}
                  </div>
                )
              )}
            </div>

            <div className="calendar-grid">
              {calendarDays.map(
                (day) => {
                  const dateKey =
                    formatDateKey(
                      day.date
                    );

                  const dayItems =
                    items
                      .filter(
                        (item) =>
                          item.date ===
                          dateKey
                      )
                      .sort(
                        compareScheduleItems
                      );

                  return (
                    <CalendarDay
                      key={
                        dateKey
                      }
                      day={
                        day
                      }
                      items={
                        dayItems
                      }
                      onEdit={
                        handleEdit
                      }
                    />
                  );
                }
              )}
            </div>
          </div>
        )}
      </section>

      <section className="calendar-event-list-section">
        <div className="calendar-list-heading">
          <div>
            <p className="card-eyebrow">
              Events
            </p>

            <h2>
              All Events
            </h2>
          </div>

          <span className="task-count">
            {
              events.length
            }
          </span>
        </div>

        {events.length ===
        0 ? (
          <div className="content-card calendar-empty">
            <CalendarDays
              size={20}
            />

            <span>
              No events yet.
            </span>
          </div>
        ) : (
          <div className="calendar-event-list">
            {[...events]
              .sort(
                compareScheduleItems
              )
              .map(
                (item) => (
                  <EventCard
                    key={
                      item.id
                    }
                    item={
                      item
                    }
                    onEdit={
                      handleEdit
                    }
                    onDelete={
                      handleDelete
                    }
                    onToggleVisibility={
                      handleToggleVisibility
                    }
                  />
                )
              )}
          </div>
        )}
      </section>
    </main>
  );
}

function CalendarDay({
  day,
  items,
  onEdit,
}) {
  return (
    <div
      className={`calendar-day ${
        day.inCurrentMonth
          ? ""
          : "outside-month"
      } ${
        day.isToday
          ? "today"
          : ""
      }`}
    >
      <div className="calendar-day-number">
        {
          day.date.getDate()
        }
      </div>

      <div className="calendar-day-items">
        {items
          .slice(0, 4)
          .map(
            (item) => (
              <button
                key={
                  item.id
                }
                type="button"
                className={`calendar-item calendar-item-${item.type} ${
                  item.visibility ===
                  "public"
                    ? "public"
                    : "private"
                }`}
                onClick={() => {
                  if (
                    item.type ===
                    "event"
                  ) {
                    onEdit(
                      item
                    );
                  }
                }}
                title={
                  item.title
                }
              >
                <span className="calendar-item-title">
                  {
                    item.title
                  }
                </span>
              </button>
            )
          )}

        {items.length >
          4 && (
          <span className="calendar-more">
            +
            {
              items.length -
              4
            }{" "}
            more
          </span>
        )}
      </div>
    </div>
  );
}

function EventCard({
  item,
  onEdit,
  onDelete,
  onToggleVisibility,
}) {
  const isPublic =
    item.visibility ===
    "public";

  return (
    <article className="calendar-event-card">
      <div className="calendar-event-date">
        <span>
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

      <div className="calendar-event-content">
        <div className="calendar-event-title-row">
          <h3>
            {item.title}
          </h3>

          <span
            className={`visibility-badge ${
              isPublic
                ? "public"
                : "private"
            }`}
          >
            {isPublic ? (
              <Eye
                size={12}
              />
            ) : (
              <EyeOff
                size={12}
              />
            )}

            {isPublic
              ? "Public"
              : "Private"}
          </span>
        </div>

        <p className="calendar-event-meta">
          {
            formatFullDate(
              item.date
            )
          }

          {item.startTime && (
            <>
              {" · "}
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
            </>
          )}
        </p>

        {item.location && (
          <p className="calendar-event-location">
            {item.location}
          </p>
        )}

        {item.notes && (
          <p className="calendar-event-notes">
            {item.notes}
          </p>
        )}
      </div>

      <div className="calendar-event-actions">
        <button
          type="button"
          className="icon-button"
          onClick={() =>
            onToggleVisibility(
              item
            )
          }
          title={
            isPublic
              ? "Make private"
              : "Make public"
          }
        >
          {isPublic ? (
            <Eye
              size={16}
            />
          ) : (
            <EyeOff
              size={16}
            />
          )}
        </button>

        <button
          type="button"
          className="icon-button"
          onClick={() =>
            onEdit(
              item
            )
          }
          title="Edit event"
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
              item
            )
          }
          title="Delete event"
        >
          <Trash2
            size={16}
          />
        </button>
      </div>
    </article>
  );
}

function buildCalendarDays(
  month
) {
  const year =
    month.getFullYear();

  const monthIndex =
    month.getMonth();

  const firstDay =
    new Date(
      year,
      monthIndex,
      1
    );

  const startDate =
    new Date(
      year,
      monthIndex,
      1 -
        firstDay.getDay()
    );

  const today =
    new Date();

  return Array.from(
    {
      length: 42,
    },
    (_, index) => {
      const date =
        new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate() +
            index
        );

      return {
        date,

        inCurrentMonth:
          date.getMonth() ===
          monthIndex,

        isToday:
          sameDate(
            date,
            today
          ),
      };
    }
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

function formatDateKey(
  date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() +
        1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function sameDate(
  first,
  second
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}

function createLocalDate(
  value,
  firstOfMonth = false
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
    firstOfMonth
      ? 1
      : day
  );
}

function formatFullDate(
  value
) {
  return createLocalDate(
    value
  ).toLocaleDateString(
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

function getMonth(
  value
) {
  return createLocalDate(
    value
  )
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
  return createLocalDate(
    value
  ).getDate();
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

export default Calendar;