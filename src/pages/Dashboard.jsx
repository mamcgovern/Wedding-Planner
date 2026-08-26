import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  Heart,
  ListTodo,
  LoaderCircle,
  MapPin,
  Users,
  Wallet,
} from "lucide-react";

import {
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";

import { Link } from "react-router-dom";

import { db } from "../services/firebase";
import { WEDDING_ID } from "../config/wedding";

function Dashboard() {
  const [
    wedding,
    setWedding,
  ] = useState(null);

  const [
    tasks,
    setTasks,
  ] = useState([]);

  const [
    guests,
    setGuests,
  ] = useState([]);

  const [
    budgetItems,
    setBudgetItems,
  ] = useState([]);

  const [
    timelineItems,
    setTimelineItems,
  ] = useState([]);

  const [
    loadingWedding,
    setLoadingWedding,
  ] = useState(true);

  const [
    loadingTasks,
    setLoadingTasks,
  ] = useState(true);

  const [
    loadingGuests,
    setLoadingGuests,
  ] = useState(true);

  const [
    loadingBudget,
    setLoadingBudget,
  ] = useState(true);

  const [
    loadingTimeline,
    setLoadingTimeline,
  ] = useState(true);

  /*
   * WEDDING SETTINGS
   */

  useEffect(() => {
    const weddingRef =
      doc(
        db,
        "weddings",
        WEDDING_ID
      );

    const unsubscribe =
      onSnapshot(
        weddingRef,
        (snapshot) => {
          if (
            snapshot.exists()
          ) {
            setWedding({
              id:
                snapshot.id,

              ...snapshot.data(),
            });
          } else {
            setWedding(
              null
            );
          }

          setLoadingWedding(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading dashboard wedding settings:",
            firebaseError
          );

          setLoadingWedding(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  /*
   * TASKS
   */

  useEffect(() => {
    const tasksRef =
      collection(
        db,
        "weddings",
        WEDDING_ID,
        "tasks"
      );

    const unsubscribe =
      onSnapshot(
        tasksRef,
        (snapshot) => {
          const data =
            snapshot.docs.map(
              (taskDocument) => ({
                id:
                  taskDocument.id,

                ...taskDocument.data(),
              })
            );

          setTasks(data);

          setLoadingTasks(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading dashboard tasks:",
            firebaseError
          );

          setLoadingTasks(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  /*
   * GUESTS
   */

  useEffect(() => {
    const guestsRef =
      collection(
        db,
        "weddings",
        WEDDING_ID,
        "guests"
      );

    const unsubscribe =
      onSnapshot(
        guestsRef,
        (snapshot) => {
          const data =
            snapshot.docs.map(
              (guestDocument) => ({
                id:
                  guestDocument.id,

                ...guestDocument.data(),
              })
            );

          setGuests(data);

          setLoadingGuests(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading dashboard guests:",
            firebaseError
          );

          setLoadingGuests(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  /*
   * BUDGET
   */

  useEffect(() => {
    const budgetRef =
      collection(
        db,
        "weddings",
        WEDDING_ID,
        "budgetItems"
      );

    const unsubscribe =
      onSnapshot(
        budgetRef,
        (snapshot) => {
          const data =
            snapshot.docs.map(
              (budgetDocument) => ({
                id:
                  budgetDocument.id,

                ...budgetDocument.data(),
              })
            );

          setBudgetItems(
            data
          );

          setLoadingBudget(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading dashboard budget:",
            firebaseError
          );

          setLoadingBudget(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  /*
   * TIMELINE
   */

  useEffect(() => {
    const timelineRef =
      collection(
        db,
        "weddings",
        WEDDING_ID,
        "timelineItems"
      );

    const unsubscribe =
      onSnapshot(
        timelineRef,
        (snapshot) => {
          const data =
            snapshot.docs.map(
              (timelineDocument) => ({
                id:
                  timelineDocument.id,

                ...timelineDocument.data(),
              })
            );

          setTimelineItems(
            data
          );

          setLoadingTimeline(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading dashboard timeline:",
            firebaseError
          );

          setLoadingTimeline(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  const loading =
    loadingWedding ||
    loadingTasks ||
    loadingGuests ||
    loadingBudget ||
    loadingTimeline;

  /*
   * COUNTDOWN
   */

  const countdown =
    useMemo(() => {
      return getCountdown(
        wedding?.weddingDate
      );
    }, [
      wedding?.weddingDate,
    ]);

  /*
   * TASK SUMMARY
   */

  const taskSummary =
    useMemo(() => {
      const activeTasks =
        tasks.filter(
          (task) =>
            !isTaskCompleted(
              task
            )
        );

      const completed =
        tasks.length -
        activeTasks.length;

      const upcoming =
        activeTasks
          .filter(
            (task) =>
              getTaskDueDate(
                task
              )
          )
          .sort(
            compareTasksByDueDate
          )
          .slice(
            0,
            5
          );

      const overdue =
        activeTasks.filter(
          (task) =>
            isTaskOverdue(
              task
            )
        ).length;

      return {
        total:
          tasks.length,

        completed,

        active:
          activeTasks.length,

        overdue,

        upcoming,
      };
    }, [tasks]);

  /*
   * GUEST SUMMARY
   */

  const guestSummary =
    useMemo(() => {
      const attending =
        guests.filter(
          (guest) =>
            guest.rsvpStatus ===
            "attending"
        ).length;

      const declined =
        guests.filter(
          (guest) =>
            guest.rsvpStatus ===
            "declined"
        ).length;

      const pending =
        guests.filter(
          (guest) =>
            guest.rsvpStatus !==
              "attending" &&
            guest.rsvpStatus !==
              "declined"
        ).length;

      return {
        total:
          guests.length,

        attending,

        declined,

        pending,
      };
    }, [guests]);

  /*
   * BUDGET SUMMARY
   */

  const budgetSummary =
    useMemo(() => {
      const totalBudget =
        getNumber(
          wedding?.totalBudget
        );

      const totalCost =
        budgetItems.reduce(
          (
            total,
            item
          ) =>
            total +
            getBudgetItemCost(
              item
            ),
          0
        );

      const amountPaid =
        budgetItems.reduce(
          (
            total,
            item
          ) =>
            total +
            getNumber(
              item.amountPaid
            ),
          0
        );

      const remaining =
        Math.max(
          totalCost -
            amountPaid,
          0
        );

      const budgetLeft =
        totalBudget -
        totalCost;

      const percentUsed =
        totalBudget > 0
          ? Math.min(
              (
                totalCost /
                totalBudget
              ) *
                100,
              100
            )
          : 0;

      return {
        totalBudget,
        totalCost,
        amountPaid,
        remaining,
        budgetLeft,
        percentUsed,
      };
    }, [
      wedding?.totalBudget,
      budgetItems,
    ]);

  /*
   * NEXT TIMELINE EVENT
   */

  const nextTimelineItem =
    useMemo(() => {
      return getNextTimelineItem(
        timelineItems
      );
    }, [timelineItems]);

  if (loading) {
    return (
      <div className="page dashboard-page">
        <div className="content-card dashboard-loading">
          <LoaderCircle
            size={26}
            className="spinner"
          />

          <p>
            Loading your wedding planner...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <p className="page-eyebrow">
            Wedding Planner
          </p>

          <h1>
            {getCoupleHeading(
              wedding
            )}
          </h1>

          {wedding?.weddingDate && (
            <p className="dashboard-wedding-date">
              <CalendarDays
                size={15}
              />

              {formatFullDate(
                wedding.weddingDate
              )}
            </p>
          )}

          {(wedding?.venueName ||
            wedding?.venueLocation) && (
            <p className="dashboard-venue">
              <MapPin
                size={14}
              />

              {[wedding?.venueName, wedding?.venueLocation]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>

        <div className="dashboard-countdown">
          <Heart
            size={19}
          />

          {countdown ===
          null ? (
            <>
              <strong>
                Add your wedding date
              </strong>

              <span>
                Set it in Wedding Settings.
              </span>
            </>
          ) : countdown >
            0 ? (
            <>
              <strong>
                {countdown}
              </strong>

              <span>
                {countdown ===
                1
                  ? "day to go"
                  : "days to go"}
              </span>
            </>
          ) : countdown ===
            0 ? (
            <>
              <strong>
                Today!
              </strong>

              <span>
                It's wedding day.
              </span>
            </>
          ) : (
            <>
              <strong>
                Married
              </strong>

              <span>
                Wedding day has arrived.
              </span>
            </>
          )}
        </div>
      </section>

      <section className="dashboard-stat-grid">
        <DashboardStatCard
          icon={
            <ListTodo
              size={18}
            />
          }
          label="Open Tasks"
          value={
            taskSummary.active
          }
          detail={
            taskSummary.overdue >
            0
              ? `${taskSummary.overdue} overdue`
              : `${taskSummary.completed} completed`
          }
          link="/tasks"
        />

        <DashboardStatCard
          icon={
            <Users
              size={18}
            />
          }
          label="RSVP Yes"
          value={
            guestSummary.attending
          }
          detail={`${guestSummary.pending} awaiting response`}
          link="/guests"
        />

        <DashboardStatCard
          icon={
            <DollarSign
              size={18}
            />
          }
          label="Wedding Cost"
          value={
            formatCurrency(
              budgetSummary.totalCost
            )
          }
          detail={`${formatCurrency(
            budgetSummary.remaining
          )} still owed`}
          link="/budget"
        />

        <DashboardStatCard
          icon={
            <Wallet
              size={18}
            />
          }
          label="Amount Paid"
          value={
            formatCurrency(
              budgetSummary.amountPaid
            )
          }
          detail={
            budgetSummary.totalBudget >
            0
              ? `${Math.round(
                  budgetSummary.percentUsed
                )}% of budget committed`
              : "No overall budget set"
          }
          link="/budget"
        />
      </section>

      <section className="dashboard-main-grid">
        <div className="dashboard-panel dashboard-tasks-panel">
          <div className="dashboard-panel-heading">
            <div>
              <p className="card-eyebrow">
                Planning
              </p>

              <h2>
                Upcoming Tasks
              </h2>
            </div>

            <Link
              to="/tasks"
              className="dashboard-panel-link"
            >
              View all

              <ArrowRight
                size={14}
              />
            </Link>
          </div>

          {taskSummary.upcoming.length ===
          0 ? (
            <div className="dashboard-empty-small">
              <CheckCircle2
                size={24}
              />

              <p>
                No upcoming tasks with due dates.
              </p>
            </div>
          ) : (
            <div className="dashboard-task-list">
              {taskSummary.upcoming.map(
                (task) => (
                  <DashboardTask
                    key={
                      task.id
                    }
                    task={
                      task
                    }
                  />
                )
              )}
            </div>
          )}
        </div>

        <div className="dashboard-side-stack">
          <div className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <p className="card-eyebrow">
                  Schedule
                </p>

                <h2>
                  Next Timeline Event
                </h2>
              </div>

              <Link
                to="/timeline"
                className="dashboard-panel-link"
              >
                Timeline

                <ArrowRight
                  size={14}
                />
              </Link>
            </div>

            {nextTimelineItem ? (
              <div className="dashboard-next-event">
                <div className="dashboard-next-event-date">
                  <span>
                    {formatShortMonth(
                      nextTimelineItem.date
                    )}
                  </span>

                  <strong>
                    {formatDay(
                      nextTimelineItem.date
                    )}
                  </strong>
                </div>

                <div className="dashboard-next-event-content">
                  <span className="dashboard-event-category">
                    {nextTimelineItem.category ||
                      "Timeline"}
                  </span>

                  <h3>
                    {
                      nextTimelineItem.title
                    }
                  </h3>

                  <div className="dashboard-event-meta">
                    {nextTimelineItem.startTime && (
                      <span>
                        <Clock3
                          size={13}
                        />

                        {formatTime(
                          nextTimelineItem.startTime
                        )}
                      </span>
                    )}

                    {nextTimelineItem.location && (
                      <span>
                        <MapPin
                          size={13}
                        />

                        {
                          nextTimelineItem.location
                        }
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="dashboard-empty-small">
                <CalendarDays
                  size={24}
                />

                <p>
                  No upcoming timeline events.
                </p>
              </div>
            )}
          </div>

          <div className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <p className="card-eyebrow">
                  Guests
                </p>

                <h2>
                  RSVP Progress
                </h2>
              </div>

              <Link
                to="/guests"
                className="dashboard-panel-link"
              >
                Guests

                <ArrowRight
                  size={14}
                />
              </Link>
            </div>

            <div className="dashboard-rsvp-summary">
              <div className="dashboard-rsvp-total">
                <strong>
                  {
                    guestSummary.attending
                  }
                </strong>

                <span>
                  attending
                </span>
              </div>

              <div className="dashboard-rsvp-breakdown">
                <div>
                  <span>
                    Pending
                  </span>

                  <strong>
                    {
                      guestSummary.pending
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Declined
                  </span>

                  <strong>
                    {
                      guestSummary.declined
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Total
                  </span>

                  <strong>
                    {
                      guestSummary.total
                    }
                  </strong>
                </div>
              </div>

              <ProgressBar
                value={
                  guestSummary.total >
                  0
                    ? (
                        guestSummary.attending /
                        guestSummary.total
                      ) *
                      100
                    : 0
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-bottom-grid">
        <div className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <p className="card-eyebrow">
                Finances
              </p>

              <h2>
                Budget Progress
              </h2>
            </div>

            <Link
              to="/budget"
              className="dashboard-panel-link"
            >
              Budget

              <ArrowRight
                size={14}
              />
            </Link>
          </div>

          <div className="dashboard-budget-summary">
            <div className="dashboard-budget-main">
              <span>
                Current Cost
              </span>

              <strong>
                {formatCurrency(
                  budgetSummary.totalCost
                )}
              </strong>

              {budgetSummary.totalBudget >
                0 && (
                <small>
                  of{" "}
                  {formatCurrency(
                    budgetSummary.totalBudget
                  )}{" "}
                  budget
                </small>
              )}
            </div>

            <ProgressBar
              value={
                budgetSummary.percentUsed
              }
            />

            <div className="dashboard-budget-breakdown">
              <div>
                <span>
                  Paid
                </span>

                <strong>
                  {formatCurrency(
                    budgetSummary.amountPaid
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Still Owed
                </span>

                <strong>
                  {formatCurrency(
                    budgetSummary.remaining
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Budget Left
                </span>

                <strong
                  className={
                    budgetSummary.budgetLeft <
                    0
                      ? "negative"
                      : ""
                  }
                >
                  {formatCurrency(
                    budgetSummary.budgetLeft
                  )}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <p className="card-eyebrow">
                Wedding Details
              </p>

              <h2>
                At a Glance
              </h2>
            </div>

            <Link
              to="/settings"
              className="dashboard-panel-link"
            >
              Settings

              <ArrowRight
                size={14}
              />
            </Link>
          </div>

          <div className="dashboard-details-list">
            <DashboardDetail
              icon={
                <CalendarDays
                  size={16}
                />
              }
              label="Wedding"
              value={
                wedding?.weddingDate
                  ? formatFullDate(
                      wedding.weddingDate
                    )
                  : "Not set"
              }
            />

            <DashboardDetail
              icon={
                <Clock3
                  size={16}
                />
              }
              label="Ceremony"
              value={
                wedding?.ceremonyTime
                  ? formatTime(
                      wedding.ceremonyTime
                    )
                  : "Not set"
              }
            />

            <DashboardDetail
              icon={
                <Clock3
                  size={16}
                />
              }
              label="Reception"
              value={
                wedding?.receptionTime
                  ? formatTime(
                      wedding.receptionTime
                    )
                  : "Not set"
              }
            />

            <DashboardDetail
              icon={
                <MapPin
                  size={16}
                />
              }
              label="Venue"
              value={
                wedding?.venueName ||
                "Not set"
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardStatCard({
  icon,
  label,
  value,
  detail,
  link,
}) {
  return (
    <Link
      to={link}
      className="dashboard-stat-card"
    >
      <div className="dashboard-stat-icon">
        {icon}
      </div>

      <div className="dashboard-stat-content">
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {detail}
        </small>
      </div>

      <ArrowRight
        size={15}
        className="dashboard-stat-arrow"
      />
    </Link>
  );
}

function DashboardTask({
  task,
}) {
  const dueDate =
    getTaskDueDate(
      task
    );

  const overdue =
    isTaskOverdue(
      task
    );

  return (
    <div className="dashboard-task">
      <div className="dashboard-task-check">
        <span />
      </div>

      <div className="dashboard-task-content">
        <strong>
          {task.title ||
            task.name ||
            "Untitled Task"}
        </strong>

        <div className="dashboard-task-meta">
          {task.category && (
            <span>
              {
                task.category
              }
            </span>
          )}

          {dueDate && (
            <span
              className={
                overdue
                  ? "overdue"
                  : ""
              }
            >
              <CalendarDays
                size={12}
              />

              {formatCompactDate(
                dueDate
              )}
            </span>
          )}
        </div>
      </div>

      {task.priority && (
        <span
          className={`dashboard-priority dashboard-priority-${String(
            task.priority
          ).toLowerCase()}`}
        >
          {
            task.priority
          }
        </span>
      )}
    </div>
  );
}

function DashboardDetail({
  icon,
  label,
  value,
}) {
  return (
    <div className="dashboard-detail">
      <div className="dashboard-detail-icon">
        {icon}
      </div>

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>
    </div>
  );
}

function ProgressBar({
  value,
}) {
  const safeValue =
    Math.max(
      0,
      Math.min(
        Number(value) ||
          0,
        100
      )
    );

  return (
    <div className="dashboard-progress">
      <div
        className="dashboard-progress-fill"
        style={{
          width: `${safeValue}%`,
        }}
      />
    </div>
  );
}

function getCoupleHeading(
  wedding
) {
  const first =
    wedding?.brideName?.trim();

  const second =
    wedding?.groomName?.trim();

  if (
    first &&
    second
  ) {
    return `${first} & ${second}`;
  }

  if (first) {
    return first;
  }

  if (second) {
    return second;
  }

  return "Wedding Planning";
}

function getCountdown(
  weddingDate
) {
  const wedding =
    parseDateOnly(
      weddingDate
    );

  if (!wedding) {
    return null;
  }

  const today =
    new Date();

  const todayOnly =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

  const difference =
    wedding.getTime() -
    todayOnly.getTime();

  return Math.ceil(
    difference /
      86400000
  );
}

function getNextTimelineItem(
  items
) {
  const now =
    new Date();

  const candidates =
    items
      .filter(
        (item) =>
          item.date
      )
      .map(
        (item) => ({
          ...item,

          eventDate:
            buildEventDate(
              item
            ),
        })
      )
      .filter(
        (item) =>
          item.eventDate &&
          item.eventDate >=
            now
      )
      .sort(
        (first, second) =>
          first.eventDate -
          second.eventDate
      );

  return (
    candidates[0] ||
    null
  );
}

function buildEventDate(
  item
) {
  const date =
    parseDateOnly(
      item.date
    );

  if (!date) {
    return null;
  }

  if (
    item.startTime
  ) {
    const [
      hours,
      minutes,
    ] =
      item.startTime
        .split(":")
        .map(Number);

    date.setHours(
      hours || 0,
      minutes || 0,
      0,
      0
    );
  } else {
    date.setHours(
      23,
      59,
      59,
      999
    );
  }

  return date;
}

function isTaskCompleted(
  task
) {
  const status =
    String(
      task.status ||
        ""
    )
      .trim()
      .toLowerCase();

  return [
    "completed",
    "complete",
    "done",
  ].includes(
    status
  );
}

function getTaskDueDate(
  task
) {
  return (
    task.dueDate ||
    task.due ||
    task.deadline ||
    ""
  );
}

function compareTasksByDueDate(
  first,
  second
) {
  return String(
    getTaskDueDate(
      first
    )
  ).localeCompare(
    String(
      getTaskDueDate(
        second
      )
    )
  );
}

function isTaskOverdue(
  task
) {
  if (
    isTaskCompleted(
      task
    )
  ) {
    return false;
  }

  const due =
    parseDateOnly(
      getTaskDueDate(
        task
      )
    );

  if (!due) {
    return false;
  }

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  return due <
    today;
}

function getBudgetItemCost(
  item
) {
  if (
    item.cost !==
      undefined &&
    item.cost !== null
  ) {
    return getNumber(
      item.cost
    );
  }

  const actual =
    getNumber(
      item.actualCost
    );

  if (actual > 0) {
    return actual;
  }

  return getNumber(
    item.estimatedCost
  );
}

function getNumber(
  value
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

function parseDateOnly(
  dateString
) {
  if (!dateString) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] =
    String(
      dateString
    )
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

function formatFullDate(
  dateString
) {
  const date =
    parseDateOnly(
      dateString
    );

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  ).format(
    date
  );
}

function formatCompactDate(
  dateString
) {
  const date =
    parseDateOnly(
      dateString
    );

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  ).format(
    date
  );
}

function formatShortMonth(
  dateString
) {
  const date =
    parseDateOnly(
      dateString
    );

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
    }
  )
    .format(date)
    .toUpperCase();
}

function formatDay(
  dateString
) {
  const date =
    parseDateOnly(
      dateString
    );

  if (!date) {
    return "";
  }

  return date.getDate();
}

function formatTime(
  timeString
) {
  if (!timeString) {
    return "";
  }

  const [
    hours,
    minutes,
  ] =
    String(
      timeString
    )
      .split(":")
      .map(Number);

  const date =
    new Date();

  date.setHours(
    hours,
    minutes,
    0,
    0
  );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(
    date
  );
}

function formatCurrency(
  value
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }
  ).format(
    getNumber(
      value
    )
  );
}

export default Dashboard;