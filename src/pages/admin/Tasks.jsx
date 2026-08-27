import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
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

const emptyForm = {
  title: "",
  date: "",
  notes: "",
  visibility: "private",
};

function Tasks() {
  const {
    user,
  } = useAuth();

  const [
    tasks,
    setTasks,
  ] = useState([]);

  const [
    form,
    setForm,
  ] = useState(
    emptyForm
  );

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /*
   * LOAD TASKS
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
                  item.type ===
                  "task"
              );

          setTasks(
            loaded
          );

          setLoading(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading tasks:",
            firebaseError
          );

          setError(
            "We couldn't load your tasks."
          );

          setLoading(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  /*
   * SORT TASKS
   */

  const openTasks =
    useMemo(
      () =>
        tasks
          .filter(
            (task) =>
              !task.completed
          )
          .sort(
            compareTasks
          ),
      [tasks]
    );

  const completedTasks =
    useMemo(
      () =>
        tasks
          .filter(
            (task) =>
              task.completed
          )
          .sort(
            compareTasks
          ),
      [tasks]
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
        emptyForm
      );

      setEditingId(
        null
      );

      setError("");
    };

  /*
   * SAVE
   */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const title =
        form.title.trim();

      if (!title) {
        setError(
          "Enter a task name."
        );

        return;
      }

      setSaving(true);
      setError("");

      try {
        const taskData = {
          type:
            "task",

          title,

          date:
            form.date,

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
            taskData
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
              ...taskData,

              completed:
                false,

              createdAt:
                serverTimestamp(),

              createdBy:
                user?.uid ||
                null,
            }
          );
        }

        resetForm();
      } catch (firebaseError) {
        console.error(
          "Error saving task:",
          firebaseError
        );

        setError(
          "We couldn't save that task."
        );
      } finally {
        setSaving(false);
      }
    };

  /*
   * EDIT
   */

  const handleEdit =
    (task) => {
      setEditingId(
        task.id
      );

      setForm({
        title:
          task.title ||
          "",

        date:
          task.date ||
          "",

        notes:
          task.notes ||
          "",

        visibility:
          task.visibility ||
          "private",
      });

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    };

  /*
   * COMPLETE
   */

  const handleToggleComplete =
    async (task) => {
      try {
        await updateDoc(
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "scheduleItems",
            task.id
          ),
          {
            completed:
              !task.completed,

            completedAt:
              !task.completed
                ? serverTimestamp()
                : null,

            updatedAt:
              serverTimestamp(),

            updatedBy:
              user?.uid ||
              null,
          }
        );
      } catch (firebaseError) {
        console.error(
          "Error updating task:",
          firebaseError
        );

        setError(
          "We couldn't update that task."
        );
      }
    };

  /*
   * VISIBILITY
   */

  const handleToggleVisibility =
    async (task) => {
      const nextVisibility =
        task.visibility ===
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
            task.id
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
          "Error updating task visibility:",
          firebaseError
        );

        setError(
          "We couldn't change that task's visibility."
        );
      }
    };

  /*
   * DELETE
   */

  const handleDelete =
    async (task) => {
      const confirmed =
        window.confirm(
          `Delete "${task.title}"?`
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
            task.id
          )
        );

        if (
          editingId ===
          task.id
        ) {
          resetForm();
        }
      } catch (firebaseError) {
        console.error(
          "Error deleting task:",
          firebaseError
        );

        setError(
          "We couldn't delete that task."
        );
      }
    };

  return (
    <main className="page tasks-page">
      <p className="page-eyebrow">
        Planning
      </p>

      <h1 className="page-title">
        Tasks
      </h1>

      <p className="page-description">
        Keep track of planning tasks and choose which
        deadlines should also appear on the wedding-party
        Important Dates page.
      </p>

      <section className="content-card task-editor">
        <div className="task-editor-header">
          <div>
            <p className="card-eyebrow">
              {editingId
                ? "Editing Task"
                : "New Task"}
            </p>

            <h2>
              {editingId
                ? "Edit Task"
                : "Add a Task"}
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
          className="task-form"
          onSubmit={
            handleSubmit
          }
        >
          <label className="form-field task-title-field">
            <span>
              Task
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
              placeholder="What needs to be done?"
            />
          </label>

          <label className="form-field">
            <span>
              Due Date
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

          <label className="form-field task-notes-field">
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
            <div className="task-error">
              {error}
            </div>
          )}

          <div className="task-form-actions">
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
                  : "Add Task"}
            </button>
          </div>
        </form>
      </section>

      <TaskSection
        title="Open Tasks"
        eyebrow="To Do"
        tasks={
          openTasks
        }
        loading={
          loading
        }
        emptyMessage="No open tasks."
        onToggleComplete={
          handleToggleComplete
        }
        onToggleVisibility={
          handleToggleVisibility
        }
        onEdit={
          handleEdit
        }
        onDelete={
          handleDelete
        }
      />

      {completedTasks.length >
        0 && (
        <TaskSection
          title="Completed"
          eyebrow="Finished"
          tasks={
            completedTasks
          }
          loading={
            false
          }
          emptyMessage=""
          onToggleComplete={
            handleToggleComplete
          }
          onToggleVisibility={
            handleToggleVisibility
          }
          onEdit={
            handleEdit
          }
          onDelete={
            handleDelete
          }
        />
      )}
    </main>
  );
}

function TaskSection({
  title,
  eyebrow,
  tasks,
  loading,
  emptyMessage,
  onToggleComplete,
  onToggleVisibility,
  onEdit,
  onDelete,
}) {
  return (
    <section className="tasks-section">
      <div className="tasks-section-heading">
        <div>
          <p className="card-eyebrow">
            {eyebrow}
          </p>

          <h2>
            {title}
          </h2>
        </div>

        <span className="task-count">
          {tasks.length}
        </span>
      </div>

      {loading ? (
        <div className="content-card">
          Loading tasks...
        </div>
      ) : tasks.length ===
        0 ? (
        <div className="content-card task-empty">
          <Check
            size={20}
          />

          <span>
            {emptyMessage}
          </span>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map(
            (task) => (
              <TaskCard
                key={
                  task.id
                }
                task={
                  task
                }
                onToggleComplete={
                  onToggleComplete
                }
                onToggleVisibility={
                  onToggleVisibility
                }
                onEdit={
                  onEdit
                }
                onDelete={
                  onDelete
                }
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

function TaskCard({
  task,
  onToggleComplete,
  onToggleVisibility,
  onEdit,
  onDelete,
}) {
  const isPublic =
    task.visibility ===
    "public";

  return (
    <article
      className={`task-card ${
        task.completed
          ? "task-card-completed"
          : ""
      }`}
    >
      <button
        type="button"
        className={`task-check ${
          task.completed
            ? "checked"
            : ""
        }`}
        onClick={() =>
          onToggleComplete(
            task
          )
        }
        aria-label={
          task.completed
            ? "Mark task incomplete"
            : "Mark task complete"
        }
      >
        {task.completed && (
          <Check
            size={14}
          />
        )}
      </button>

      <div className="task-card-content">
        <div className="task-title-row">
          <h3>
            {task.title}
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

        {task.date && (
          <p className="task-date">
            {
              formatDate(
                task.date
              )
            }
          </p>
        )}

        {task.notes && (
          <p className="task-notes">
            {task.notes}
          </p>
        )}
      </div>

      <div className="task-actions">
        <button
          type="button"
          className="icon-button"
          onClick={() =>
            onToggleVisibility(
              task
            )
          }
          title={
            isPublic
              ? "Make private"
              : "Make public"
          }
          aria-label={
            isPublic
              ? "Make task private"
              : "Make task public"
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
              task
            )
          }
          title="Edit task"
          aria-label="Edit task"
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
              task
            )
          }
          title="Delete task"
          aria-label="Delete task"
        >
          <Trash2
            size={16}
          />
        </button>
      </div>
    </article>
  );
}

function compareTasks(
  first,
  second
) {
  if (
    !first.date &&
    !second.date
  ) {
    return first.title.localeCompare(
      second.title
    );
  }

  if (!first.date) {
    return 1;
  }

  if (!second.date) {
    return -1;
  }

  return first.date.localeCompare(
    second.date
  );
}

function formatDate(
  value
) {
  if (!value) {
    return "";
  }

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
  ).toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );
}

export default Tasks;