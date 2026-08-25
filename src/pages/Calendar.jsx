import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LoaderCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../services/firebase";
import { WEDDING_ID } from "../config/wedding";
import { useAuth } from "../context/AuthContext";

const emptyEvent = {
  title: "",
  date: "",
  time: "",
  type: "event",
  location: "",
  notes: "",
  showCountdown: false,
};

function Calendar() {
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [eventsLoading, setEventsLoading] =
    useState(true);

  const [tasksLoading, setTasksLoading] =
    useState(true);

  const [showEvents, setShowEvents] =
    useState(true);

  const [showTasks, setShowTasks] =
    useState(true);

  const [currentMonth, setCurrentMonth] =
    useState(() => {
      const today = new Date();

      return new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
    });

  const [
    showEventModal,
    setShowEventModal,
  ] = useState(false);

  const [
    selectedCalendarItem,
    setSelectedCalendarItem,
  ] = useState(null);

  const [eventForm, setEventForm] =
    useState(emptyEvent);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const eventsRef = collection(
      db,
      "weddings",
      WEDDING_ID,
      "events"
    );

    const eventsQuery = query(
      eventsRef,
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const data = snapshot.docs.map(
          (eventDocument) => ({
            id: eventDocument.id,
            source: "event",
            ...eventDocument.data(),
          })
        );

        setEvents(data);
        setEventsLoading(false);
      },
      (firebaseError) => {
        console.error(
          "Error loading events:",
          firebaseError
        );

        setError(
          "We couldn't load your calendar events."
        );

        setEventsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const tasksRef = collection(
      db,
      "weddings",
      WEDDING_ID,
      "tasks"
    );

    const unsubscribe = onSnapshot(
      tasksRef,
      (snapshot) => {
        const data = snapshot.docs.map(
          (taskDocument) => ({
            id: taskDocument.id,
            source: "task",
            ...taskDocument.data(),
          })
        );

        setTasks(data);
        setTasksLoading(false);
      },
      (firebaseError) => {
        console.error(
          "Error loading tasks:",
          firebaseError
        );

        setTasksLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const calendarItems = useMemo(() => {
    const taskItems = tasks
      .filter((task) => task.dueDate)
      .map((task) => ({
        id: task.id,
        source: "task",
        title: task.title,
        date: task.dueDate,
        time: "",
        type: "task",
        location: "",
        notes: task.notes || "",
        priority: task.priority,
        status: task.status,
        assignedTo: task.assignedTo,
      }));

    const visibleItems = [];

    if (showEvents) {
      visibleItems.push(...events);
    }

    if (showTasks) {
      visibleItems.push(...taskItems);
    }

    return visibleItems;
  }, [
    events,
    tasks,
    showEvents,
    showTasks,
  ]);

  const countdowns = useMemo(() => {
    return events
      .filter(
        (event) =>
          event.showCountdown &&
          event.date
      )
      .map((event) => ({
        ...event,
        daysAway:
          calculateDaysAway(
            event.date
          ),
      }))
      .filter(
        (event) =>
          event.daysAway >= 0
      )
      .sort(
        (a, b) =>
          a.daysAway - b.daysAway
      );
  }, [events]);

  const monthDays = useMemo(() => {
    return buildCalendarDays(
      currentMonth
    );
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1
        )
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1
        )
    );
  };

  const goToToday = () => {
    const today = new Date();

    setCurrentMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );
  };

  const openAddEvent = (
    date = ""
  ) => {
    setEventForm({
      ...emptyEvent,
      date,
    });

    setError("");
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    if (saving) {
      return;
    }

    setShowEventModal(false);
    setEventForm(emptyEvent);
    setError("");
  };

  const handleInputChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setEventForm(
      (current) => ({
        ...current,
        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!eventForm.title.trim()) {
      setError(
        "Please enter an event name."
      );
      return;
    }

    if (!eventForm.date) {
      setError(
        "Please choose a date."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const eventsRef = collection(
        db,
        "weddings",
        WEDDING_ID,
        "events"
      );

      await addDoc(eventsRef, {
        ...eventForm,

        title:
          eventForm.title.trim(),

        createdAt:
          serverTimestamp(),

        createdBy:
          user?.uid || null,

        createdByName:
          user?.displayName ||
          user?.email ||
          "",
      });

      setShowEventModal(false);
      setEventForm(emptyEvent);
    } catch (firebaseError) {
      console.error(
        "Error adding event:",
        firebaseError
      );

      setError(
        "We couldn't save this event."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent =
    async (eventId) => {
      try {
        await deleteDoc(
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "events",
            eventId
          )
        );

        setSelectedCalendarItem(
          null
        );
      } catch (firebaseError) {
        console.error(
          "Error deleting event:",
          firebaseError
        );
      }
    };

  const loading =
    eventsLoading ||
    tasksLoading;

  return (
    <div className="page calendar-page">
      <div className="calendar-page-header">
        <div>
          <p className="page-eyebrow">
            Planning
          </p>

          <h1>Calendar</h1>

          <p className="page-description">
            Keep wedding events,
            deadlines, appointments,
            and countdowns in one place.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            openAddEvent()
          }
        >
          <Plus size={18} />
          Add Event
        </button>
      </div>

      {countdowns.length > 0 && (
        <section className="calendar-countdowns">
          {countdowns
            .slice(0, 4)
            .map((event) => (
              <button
                className="calendar-countdown-card"
                key={event.id}
                onClick={() =>
                  setSelectedCalendarItem(
                    event
                  )
                }
              >
                <span className="calendar-countdown-number">
                  {event.daysAway}
                </span>

                <span className="calendar-countdown-unit">
                  {event.daysAway === 1
                    ? "day"
                    : "days"}
                </span>

                <strong>
                  {event.title}
                </strong>

                <span>
                  {formatLongDate(
                    event.date
                  )}
                </span>
              </button>
            ))}
        </section>
      )}

      {error && (
        <div className="auth-error calendar-error">
          {error}
        </div>
      )}

      <section className="calendar-card">
        <div className="calendar-toolbar">
          <div className="calendar-toolbar-left">
            <button
              className="calendar-nav-button"
              onClick={
                goToPreviousMonth
              }
              title="Previous month"
            >
              <ChevronLeft
                size={18}
              />
            </button>

            <button
              className="calendar-nav-button"
              onClick={
                goToNextMonth
              }
              title="Next month"
            >
              <ChevronRight
                size={18}
              />
            </button>

            <button
              className="calendar-today-button"
              onClick={goToToday}
            >
              Today
            </button>
          </div>

          <h2>
            {formatMonthYear(
              currentMonth
            )}
          </h2>

          <div className="calendar-filters">
            <button
              type="button"
              className={`calendar-filter-button event ${
                showEvents
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setShowEvents(
                  (current) =>
                    !current
                )
              }
              aria-pressed={
                showEvents
              }
            >
              <i className="legend-dot event" />

              Events
            </button>

            <button
              type="button"
              className={`calendar-filter-button task ${
                showTasks
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setShowTasks(
                  (current) =>
                    !current
                )
              }
              aria-pressed={
                showTasks
              }
            >
              <i className="legend-dot task" />

              Tasks
            </button>
          </div>
        </div>

        {loading ? (
          <div className="calendar-loading">
            <LoaderCircle
              size={26}
              className="spinner"
            />

            <p>
              Loading calendar...
            </p>
          </div>
        ) : (
          <>
            <div className="calendar-weekdays">
              {[
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ].map((day) => (
                <div key={day}>
                  {day}
                </div>
              ))}
            </div>

            <div className="calendar-grid">
              {monthDays.map(
                (day) => {
                  const dateString =
                    formatDateForStorage(
                      day.date
                    );

                  const dayItems =
                    calendarItems.filter(
                      (item) =>
                        item.date ===
                        dateString
                    );

                  return (
                    <div
                      className={`calendar-day ${
                        day.isCurrentMonth
                          ? ""
                          : "outside-month"
                      } ${
                        day.isToday
                          ? "today"
                          : ""
                      }`}
                      key={
                        dateString
                      }
                      onDoubleClick={() =>
                        openAddEvent(
                          dateString
                        )
                      }
                    >
                      <div className="calendar-day-header">
                        <span className="calendar-day-number">
                          {day.date.getDate()}
                        </span>

                        <button
                          className="calendar-day-add"
                          onClick={() =>
                            openAddEvent(
                              dateString
                            )
                          }
                          title="Add event"
                        >
                          <Plus
                            size={13}
                          />
                        </button>
                      </div>

                      <div className="calendar-day-items">
                        {dayItems
                          .slice(0, 4)
                          .map(
                            (item) => (
                              <button
                                className={`calendar-item calendar-item-${item.source}`}
                                key={`${item.source}-${item.id}`}
                                onClick={() =>
                                  setSelectedCalendarItem(
                                    item
                                  )
                                }
                              >
                                {item.time && (
                                  <span>
                                    {formatTime(
                                      item.time
                                    )}
                                  </span>
                                )}

                                <strong>
                                  {
                                    item.title
                                  }
                                </strong>
                              </button>
                            )
                          )}

                        {dayItems.length >
                          4 && (
                          <span className="calendar-more">
                            +
                            {dayItems.length -
                              4}{" "}
                            more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}
      </section>

      {showEventModal && (
        <div
          className="modal-backdrop"
          onMouseDown={
            closeEventModal
          }
        >
          <div
            className="task-modal calendar-event-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="task-modal-header">
              <div>
                <p className="card-eyebrow">
                  Calendar
                </p>

                <h2>
                  Add Event
                </h2>
              </div>

              <button
                className="icon-button"
                onClick={
                  closeEventModal
                }
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="task-form"
              onSubmit={
                handleSubmit
              }
            >
              <label className="form-field">
                <span>
                  Event name
                </span>

                <input
                  type="text"
                  name="title"
                  value={
                    eventForm.title
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Florist meeting"
                  autoFocus
                />
              </label>

              <div className="form-grid">
                <label className="form-field">
                  <span>Date</span>

                  <input
                    type="date"
                    name="date"
                    value={
                      eventForm.date
                    }
                    onChange={
                      handleInputChange
                    }
                  />
                </label>

                <label className="form-field">
                  <span>
                    Time
                  </span>

                  <input
                    type="time"
                    name="time"
                    value={
                      eventForm.time
                    }
                    onChange={
                      handleInputChange
                    }
                  />
                </label>

                <label className="form-field">
                  <span>
                    Type
                  </span>

                  <select
                    name="type"
                    value={
                      eventForm.type
                    }
                    onChange={
                      handleInputChange
                    }
                  >
                    <option value="event">
                      Event
                    </option>

                    <option value="appointment">
                      Appointment
                    </option>

                    <option value="deadline">
                      Deadline
                    </option>

                    <option value="payment">
                      Payment
                    </option>
                  </select>
                </label>

                <label className="form-field">
                  <span>
                    Location
                  </span>

                  <input
                    type="text"
                    name="location"
                    value={
                      eventForm.location
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Optional"
                  />
                </label>
              </div>

              <label className="form-field">
                <span>Notes</span>

                <textarea
                  name="notes"
                  value={
                    eventForm.notes
                  }
                  onChange={
                    handleInputChange
                  }
                  rows="4"
                  placeholder="Add any details..."
                />
              </label>

              <label className="countdown-checkbox">
                <input
                  type="checkbox"
                  name="showCountdown"
                  checked={
                    eventForm.showCountdown
                  }
                  onChange={
                    handleInputChange
                  }
                />

                <div>
                  <strong>
                    Show as countdown
                  </strong>

                  <span>
                    Display this event
                    above the calendar.
                  </span>
                </div>
              </label>

              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}

              <div className="task-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeEventModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="spinner"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CalendarDays
                        size={17}
                      />
                      Add Event
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCalendarItem && (
        <div
          className="modal-backdrop"
          onMouseDown={() =>
            setSelectedCalendarItem(
              null
            )
          }
        >
          <div
            className="calendar-detail-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="task-modal-header">
              <div>
                <p className="card-eyebrow">
                  {selectedCalendarItem.source ===
                  "task"
                    ? "Task"
                    : "Calendar Event"}
                </p>

                <h2>
                  {
                    selectedCalendarItem.title
                  }
                </h2>
              </div>

              <button
                className="icon-button"
                onClick={() =>
                  setSelectedCalendarItem(
                    null
                  )
                }
              >
                <X size={19} />
              </button>
            </div>

            <div className="calendar-detail-content">
              <div className="calendar-detail-row">
                <CalendarDays
                  size={18}
                />

                <div>
                  <span>
                    Date
                  </span>

                  <strong>
                    {formatLongDate(
                      selectedCalendarItem.date
                    )}
                  </strong>
                </div>
              </div>

              {selectedCalendarItem.time && (
                <div className="calendar-detail-row">
                  <Clock3
                    size={18}
                  />

                  <div>
                    <span>
                      Time
                    </span>

                    <strong>
                      {formatTime(
                        selectedCalendarItem.time
                      )}
                    </strong>
                  </div>
                </div>
              )}

              {selectedCalendarItem.location && (
                <div className="calendar-detail-section">
                  <span>
                    Location
                  </span>

                  <p>
                    {
                      selectedCalendarItem.location
                    }
                  </p>
                </div>
              )}

              {selectedCalendarItem.source ===
                "task" && (
                <>
                  <div className="calendar-detail-section">
                    <span>
                      Assigned to
                    </span>

                    <p>
                      {
                        selectedCalendarItem.assignedTo
                      }
                    </p>
                  </div>

                  <div className="calendar-detail-section">
                    <span>
                      Status
                    </span>

                    <p>
                      {formatTaskStatus(
                        selectedCalendarItem.status
                      )}
                    </p>
                  </div>
                </>
              )}

              {selectedCalendarItem.notes && (
                <div className="calendar-detail-section">
                  <span>
                    Notes
                  </span>

                  <p>
                    {
                      selectedCalendarItem.notes
                    }
                  </p>
                </div>
              )}
            </div>

            {selectedCalendarItem.source ===
              "event" && (
              <div className="calendar-detail-actions">
                <button
                  className="delete-event-button"
                  onClick={() =>
                    handleDeleteEvent(
                      selectedCalendarItem.id
                    )
                  }
                >
                  <Trash2
                    size={16}
                  />
                  Delete Event
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function buildCalendarDays(
  currentMonth
) {
  const year =
    currentMonth.getFullYear();

  const month =
    currentMonth.getMonth();

  const firstDay =
    new Date(year, month, 1);

  const startDate =
    new Date(
      year,
      month,
      1 - firstDay.getDay()
    );

  const days = [];

  for (
    let index = 0;
    index < 42;
    index += 1
  ) {
    const date = new Date(
      startDate
    );

    date.setDate(
      startDate.getDate() +
        index
    );

    days.push({
      date,

      isCurrentMonth:
        date.getMonth() ===
        month,

      isToday:
        isSameDay(
          date,
          new Date()
        ),
    });
  }

  return days;
}

function isSameDay(
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

function formatDateForStorage(
  date
) {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMonthYear(
  date
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

function formatLongDate(
  dateString
) {
  const [
    year,
    month,
    day,
  ] = dateString
    .split("-")
    .map(Number);

  const date = new Date(
    year,
    month - 1,
    day
  );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  ).format(date);
}

function formatTime(time) {
  if (!time) {
    return "";
  }

  const [hours, minutes] =
    time.split(":");

  const date = new Date();

  date.setHours(
    Number(hours),
    Number(minutes),
    0,
    0
  );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(date);
}

function calculateDaysAway(
  dateString
) {
  const [
    year,
    month,
    day,
  ] = dateString
    .split("-")
    .map(Number);

  const target = new Date(
    year,
    month - 1,
    day
  );

  target.setHours(0, 0, 0, 0);

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return Math.ceil(
    (target - today) /
      (1000 * 60 * 60 * 24)
  );
}

function formatTaskStatus(
  status
) {
  const labels = {
    todo: "To Do",
    "in-progress": "In Progress",
    done: "Completed",
  };

  return labels[status] || status;
}

export default Calendar;