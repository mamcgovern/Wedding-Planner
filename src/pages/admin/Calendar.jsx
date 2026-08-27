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

const calendarViews = [
  "month",
  "week",
  "day",
];

function Calendar() {
  const {
    user,
  } = useAuth();

  const today =
    startOfDay(
      new Date()
    );

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    today
  );

  const [
    view,
    setView,
  ] = useState(
    "month"
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
   * LOAD SCHEDULE ITEMS
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

        setSelectedDate(
          createLocalDate(
            form.date
          )
        );

        resetForm();
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
   * EDIT EVENT
   */

  const handleEdit =
    (item) => {
      if (
        item.type !==
        "event"
      ) {
        return;
      }

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
   * DELETE EVENT
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
          "Error changing visibility:",
          firebaseError
        );

        setError(
          "We couldn't change that item's visibility."
        );
      }
    };

  /*
   * VIEW NAVIGATION
   */

  const handlePrevious =
    () => {
      setSelectedDate(
        (current) => {
          if (
            view ===
            "month"
          ) {
            return new Date(
              current.getFullYear(),
              current.getMonth() -
                1,
              1
            );
          }

          if (
            view ===
            "week"
          ) {
            return addDays(
              current,
              -7
            );
          }

          return addDays(
            current,
            -1
          );
        }
      );
    };

  const handleNext =
    () => {
      setSelectedDate(
        (current) => {
          if (
            view ===
            "month"
          ) {
            return new Date(
              current.getFullYear(),
              current.getMonth() +
                1,
              1
            );
          }

          if (
            view ===
            "week"
          ) {
            return addDays(
              current,
              7
            );
          }

          return addDays(
            current,
            1
          );
        }
      );
    };

  const handleToday =
    () => {
      setSelectedDate(
        startOfDay(
          new Date()
        )
      );
    };

  const heading =
    getCalendarHeading(
      selectedDate,
      view
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
        Manage wedding events and view planning tasks
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

          <label className="form-field">
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
          <div className="calendar-toolbar-title">
            <p className="card-eyebrow">
              Schedule
            </p>

            <h2>
              {heading}
            </h2>
          </div>

          <div className="calendar-controls">
            <div className="calendar-view-switcher">
              {calendarViews.map(
                (option) => (
                  <button
                    key={
                      option
                    }
                    type="button"
                    className={`calendar-view-button ${
                      view ===
                      option
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setView(
                        option
                      )
                    }
                  >
                    {
                      capitalize(
                        option
                      )
                    }
                  </button>
                )
              )}
            </div>

            <div className="calendar-navigation">
              <button
                type="button"
                className="secondary-button calendar-today-button"
                onClick={
                  handleToday
                }
              >
                Today
              </button>

              <button
                type="button"
                className="icon-button"
                onClick={
                  handlePrevious
                }
                aria-label="Previous"
              >
                <ChevronLeft
                  size={18}
                />
              </button>

              <button
                type="button"
                className="icon-button"
                onClick={
                  handleNext
                }
                aria-label="Next"
              >
                <ChevronRight
                  size={18}
                />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="content-card">
            Loading calendar...
          </div>
        ) : view ===
          "month" ? (
          <MonthView
            selectedDate={
              selectedDate
            }
            items={
              items
            }
            onSelectDate={
              setSelectedDate
            }
            onEdit={
              handleEdit
            }
          />
        ) : view ===
          "week" ? (
          <WeekView
            selectedDate={
              selectedDate
            }
            items={
              items
            }
            onSelectDate={
              setSelectedDate
            }
            onEdit={
              handleEdit
            }
          />
        ) : (
          <DayView
            selectedDate={
              selectedDate
            }
            items={
              items
            }
            onEdit={
              handleEdit
            }
          />
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

function MonthView({
  selectedDate,
  items,
  onSelectDate,
  onEdit,
}) {
  const calendarDays =
    buildCalendarDays(
      selectedDate
    );

  return (
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
              getItemsForDate(
                items,
                dateKey
              );

            return (
              <div
                key={
                  dateKey
                }
                className={`calendar-day ${
                  day.inCurrentMonth
                    ? ""
                    : "outside-month"
                } ${
                  day.isToday
                    ? "today"
                    : ""
                }`}
                onDoubleClick={() =>
                  onSelectDate(
                    day.date
                  )
                }
              >
                <button
                  type="button"
                  className="calendar-day-number"
                  onClick={() =>
                    onSelectDate(
                      day.date
                    )
                  }
                >
                  {
                    day.date.getDate()
                  }
                </button>

                <div className="calendar-day-items">
                  {dayItems
                    .slice(0, 4)
                    .map(
                      (item) => (
                        <CalendarItem
                          key={
                            item.id
                          }
                          item={
                            item
                          }
                          onEdit={
                            onEdit
                          }
                        />
                      )
                    )}

                  {dayItems.length >
                    4 && (
                    <span className="calendar-more">
                      +
                      {
                        dayItems.length -
                        4
                      }{" "}
                      more
                    </span>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

function WeekView({
  selectedDate,
  items,
  onSelectDate,
  onEdit,
}) {
  const weekDays =
    getWeekDays(
      selectedDate
    );

  return (
    <div className="week-view">
      {weekDays.map(
        (date) => {
          const dateKey =
            formatDateKey(
              date
            );

          const dayItems =
            getItemsForDate(
              items,
              dateKey
            );

          const isToday =
            sameDate(
              date,
              new Date()
            );

          return (
            <article
              key={
                dateKey
              }
              className={`week-day-column ${
                isToday
                  ? "today"
                  : ""
              }`}
            >
              <button
                type="button"
                className="week-day-header"
                onClick={() =>
                  onSelectDate(
                    date
                  )
                }
              >
                <span>
                  {
                    date.toLocaleDateString(
                      "en-US",
                      {
                        weekday:
                          "short",
                      }
                    )
                  }
                </span>

                <strong>
                  {
                    date.getDate()
                  }
                </strong>
              </button>

              <div className="week-day-items">
                {dayItems.length ===
                0 ? (
                  <span className="calendar-no-items">
                    No items
                  </span>
                ) : (
                  dayItems.map(
                    (item) => (
                      <WeekItem
                        key={
                          item.id
                        }
                        item={
                          item
                        }
                        onEdit={
                          onEdit
                        }
                      />
                    )
                  )
                )}
              </div>
            </article>
          );
        }
      )}
    </div>
  );
}

function DayView({
  selectedDate,
  items,
  onEdit,
}) {
  const dateKey =
    formatDateKey(
      selectedDate
    );

  const dayItems =
    getItemsForDate(
      items,
      dateKey
    );

  return (
    <div className="day-view">
      <div className="day-view-heading">
        <span className="day-view-weekday">
          {
            selectedDate.toLocaleDateString(
              "en-US",
              {
                weekday:
                  "long",
              }
            )
          }
        </span>

        <strong>
          {
            selectedDate.toLocaleDateString(
              "en-US",
              {
                month:
                  "long",

                day:
                  "numeric",
              }
            )
          }
        </strong>
      </div>

      {dayItems.length ===
      0 ? (
        <div className="day-view-empty">
          <CalendarDays
            size={22}
          />

          <p>
            Nothing scheduled for this day.
          </p>
        </div>
      ) : (
        <div className="day-view-list">
          {dayItems.map(
            (item) => (
              <DayItem
                key={
                  item.id
                }
                item={
                  item
                }
                onEdit={
                  onEdit
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function CalendarItem({
  item,
  onEdit,
}) {
  return (
    <button
      type="button"
      className={`calendar-item calendar-item-${item.type} ${
        item.visibility ===
        "public"
          ? "public"
          : "private"
      }`}
      onClick={() =>
        onEdit(
          item
        )
      }
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
  );
}

function WeekItem({
  item,
  onEdit,
}) {
  return (
    <button
      type="button"
      className={`week-item week-item-${item.type}`}
      onClick={() =>
        onEdit(
          item
        )
      }
    >
      {item.startTime && (
        <span className="week-item-time">
          {
            formatTime(
              item.startTime
            )
          }
        </span>
      )}

      <strong>
        {
          item.title
        }
      </strong>

      <span
        className={`week-item-visibility ${
          item.visibility ===
          "public"
            ? "public"
            : "private"
        }`}
      >
        {item.visibility ===
        "public"
          ? "Public"
          : "Private"}
      </span>
    </button>
  );
}

function DayItem({
  item,
  onEdit,
}) {
  return (
    <button
      type="button"
      className={`day-item day-item-${item.type}`}
      onClick={() =>
        onEdit(
          item
        )
      }
    >
      <div className="day-item-time">
        {item.startTime
          ? formatTime(
              item.startTime
            )
          : item.type ===
              "task"
            ? "Task"
            : "All day"}
      </div>

      <div className="day-item-content">
        <div className="day-item-title-row">
          <strong>
            {
              item.title
            }
          </strong>

          <span
            className={`visibility-badge ${
              item.visibility ===
              "public"
                ? "public"
                : "private"
            }`}
          >
            {item.visibility ===
            "public"
              ? "Public"
              : "Private"}
          </span>
        </div>

        {item.endTime && (
          <span className="day-item-meta">
            Ends{" "}
            {
              formatTime(
                item.endTime
              )
            }
          </span>
        )}

        {item.location && (
          <span className="day-item-meta">
            {
              item.location
            }
          </span>
        )}

        {item.notes && (
          <span className="day-item-notes">
            {
              item.notes
            }
          </span>
        )}
      </div>
    </button>
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
  selectedDate
) {
  const year =
    selectedDate.getFullYear();

  const month =
    selectedDate.getMonth();

  const firstDay =
    new Date(
      year,
      month,
      1
    );

  const startDate =
    addDays(
      firstDay,
      -firstDay.getDay()
    );

  return Array.from(
    {
      length: 42,
    },
    (_, index) => {
      const date =
        addDays(
          startDate,
          index
        );

      return {
        date,

        inCurrentMonth:
          date.getMonth() ===
          month,

        isToday:
          sameDate(
            date,
            new Date()
          ),
      };
    }
  );
}

function getWeekDays(
  selectedDate
) {
  const start =
    startOfWeek(
      selectedDate
    );

  return Array.from(
    {
      length: 7,
    },
    (_, index) =>
      addDays(
        start,
        index
      )
  );
}

function getItemsForDate(
  items,
  dateKey
) {
  return items
    .filter(
      (item) =>
        item.date ===
        dateKey
    )
    .sort(
      compareScheduleItems
    );
}

function getCalendarHeading(
  date,
  view
) {
  if (
    view ===
    "month"
  ) {
    return date.toLocaleDateString(
      "en-US",
      {
        month:
          "long",

        year:
          "numeric",
      }
    );
  }

  if (
    view ===
    "week"
  ) {
    const start =
      startOfWeek(
        date
      );

    const end =
      addDays(
        start,
        6
      );

    if (
      start.getMonth() ===
        end.getMonth()
    ) {
      return `${start.toLocaleDateString(
        "en-US",
        {
          month:
            "long",
        }
      )} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`;
    }

    return `${start.toLocaleDateString(
      "en-US",
      {
        month:
          "short",
        day:
          "numeric",
      }
    )} - ${end.toLocaleDateString(
      "en-US",
      {
        month:
          "short",
        day:
          "numeric",
        year:
          "numeric",
      }
    )}`;
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
    (
      first.type ===
      "task"
        ? "23:58"
        : "23:59"
    );

  const secondTime =
    second.startTime ||
    (
      second.type ===
      "task"
        ? "23:58"
        : "23:59"
    );

  return firstTime.localeCompare(
    secondTime
  );
}

function startOfDay(
  date
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function startOfWeek(
  date
) {
  const cleanDate =
    startOfDay(
      date
    );

  return addDays(
    cleanDate,
    -cleanDate.getDay()
  );
}

function addDays(
  date,
  amount
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() +
      amount
  );
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

function capitalize(
  value
) {
  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

export default Calendar;