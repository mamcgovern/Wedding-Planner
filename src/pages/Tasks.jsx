import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

const categories = [
  "General",
  "Venue",
  "Attire",
  "Decor",
  "Ceremony",
  "Reception",
  "Guests & RSVPs",
  "Stationery",
  "Photography",
  "Honeymoon",
  "Wedding Week",
];

const initialTasks = [
  {
    id: 1,
    title: "Finalize guest list",
    category: "Guests & RSVPs",
    dueDate: "2026-09-15",
    priority: "high",
    status: "in-progress",
    assignedTo: "Maddie",
    notes: "Review addresses and confirm household groupings.",
  },
  {
    id: 2,
    title: "Choose ceremony readings",
    category: "Ceremony",
    dueDate: "2026-10-01",
    priority: "medium",
    status: "todo",
    assignedTo: "Maddie & Nick",
    notes: "",
  },
  {
    id: 3,
    title: "Confirm photographer timeline",
    category: "Photography",
    dueDate: "2027-03-15",
    priority: "medium",
    status: "todo",
    assignedTo: "Maddie",
    notes: "",
  },
  {
    id: 4,
    title: "Book wedding venue",
    category: "Venue",
    dueDate: "2026-01-01",
    priority: "high",
    status: "done",
    assignedTo: "Maddie & Nick",
    notes: "",
  },
];

const emptyTask = {
  title: "",
  category: "General",
  dueDate: "",
  priority: "medium",
  status: "todo",
  assignedTo: "Maddie",
  notes: "",
};

function Tasks() {
  const [tasks, setTasks] = useState(initialTasks);
  const [view, setView] = useState("list");

  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskForm, setTaskForm] = useState(emptyTask);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" || task.category === categoryFilter;

      const matchesAssignee =
        assigneeFilter === "all" || task.assignedTo === assigneeFilter;

      return matchesStatus && matchesCategory && matchesAssignee;
    });
  }, [tasks, statusFilter, categoryFilter, assigneeFilter]);

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "done").length;
    const inProgress = tasks.filter(
      (task) => task.status === "in-progress"
    ).length;
    const todo = tasks.filter((task) => task.status === "todo").length;

    return {
      total,
      completed,
      inProgress,
      todo,
    };
  }, [tasks]);

  const openAddTask = () => {
    setEditingTaskId(null);
    setTaskForm(emptyTask);
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      category: task.category,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo,
      notes: task.notes,
    });
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTaskId(null);
    setTaskForm(emptyTask);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setTaskForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!taskForm.title.trim()) {
      return;
    }

    if (editingTaskId) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                ...taskForm,
                title: taskForm.title.trim(),
              }
            : task
        )
      );
    } else {
      const newTask = {
        id: Date.now(),
        ...taskForm,
        title: taskForm.title.trim(),
      };

      setTasks((current) => [newTask, ...current]);
    }

    closeTaskModal();
  };

  const handleDeleteTask = (taskId) => {
    setTasks((current) => current.filter((task) => task.id !== taskId));
  };

  const toggleTaskComplete = (taskId) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === "done" ? "todo" : "done",
            }
          : task
      )
    );
  };

  const changeTaskStatus = (taskId, newStatus) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
            }
          : task
      )
    );
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("all");
    setAssigneeFilter("all");
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    assigneeFilter !== "all";

  return (
    <div className="page tasks-page">
      <div className="tasks-header">
        <div>
          <p className="page-eyebrow">Planning</p>
          <h1>Tasks</h1>
          <p className="page-description">
            Keep track of everything that needs to get done before the big day.
          </p>
        </div>

        <button className="primary-button" onClick={openAddTask}>
          <Plus size={18} />
          Add Task
        </button>
      </div>

      <section className="task-summary-grid">
        <div className="task-summary-card">
          <p>Total</p>
          <strong>{taskStats.total}</strong>
        </div>

        <div className="task-summary-card">
          <p>To Do</p>
          <strong>{taskStats.todo}</strong>
        </div>

        <div className="task-summary-card">
          <p>In Progress</p>
          <strong>{taskStats.inProgress}</strong>
        </div>

        <div className="task-summary-card">
          <p>Completed</p>
          <strong>{taskStats.completed}</strong>
        </div>
      </section>

      <section className="task-toolbar">
        <div className="task-filters">
          <div className="select-wrap">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
              <option value="done">Completed</option>
            </select>
            <ChevronDown size={15} />
          </div>

          <div className="select-wrap">
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">All categories</option>

              {categories.map((category) => (
                <option value={category} key={category}>
                  {category}
                </option>
              ))}
            </select>

            <ChevronDown size={15} />
          </div>

          <div className="select-wrap">
            <select
              value={assigneeFilter}
              onChange={(event) => setAssigneeFilter(event.target.value)}
            >
              <option value="all">Everyone</option>
              <option value="Maddie">Maddie</option>
              <option value="Nick">Nick</option>
              <option value="Maddie & Nick">Maddie & Nick</option>
            </select>

            <ChevronDown size={15} />
          </div>

          {hasActiveFilters && (
            <button className="clear-filter-button" onClick={clearFilters}>
              <X size={15} />
              Clear
            </button>
          )}
        </div>

        <div className="view-toggle">
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
            title="List view"
          >
            <List size={17} />
          </button>

          <button
            className={view === "board" ? "active" : ""}
            onClick={() => setView("board")}
            title="Board view"
          >
            <LayoutGrid size={17} />
          </button>
        </div>
      </section>

      {view === "list" ? (
        <TaskList
          tasks={filteredTasks}
          openEditTask={openEditTask}
          handleDeleteTask={handleDeleteTask}
          toggleTaskComplete={toggleTaskComplete}
        />
      ) : (
        <TaskBoard
          tasks={filteredTasks}
          openEditTask={openEditTask}
          handleDeleteTask={handleDeleteTask}
          changeTaskStatus={changeTaskStatus}
        />
      )}

      {showTaskModal && (
        <div className="modal-backdrop" onMouseDown={closeTaskModal}>
          <div
            className="task-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="task-modal-header">
              <div>
                <p className="card-eyebrow">
                  {editingTaskId ? "Edit" : "New Task"}
                </p>

                <h2>{editingTaskId ? "Edit Task" : "Add a Task"}</h2>
              </div>

              <button className="icon-button" onClick={closeTaskModal}>
                <X size={19} />
              </button>
            </div>

            <form className="task-form" onSubmit={handleSubmit}>
              <label className="form-field full-width">
                <span>Task</span>

                <input
                  type="text"
                  name="title"
                  value={taskForm.title}
                  onChange={handleInputChange}
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </label>

              <div className="form-grid">
                <label className="form-field">
                  <span>Category</span>

                  <select
                    name="category"
                    value={taskForm.category}
                    onChange={handleInputChange}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Assigned to</span>

                  <select
                    name="assignedTo"
                    value={taskForm.assignedTo}
                    onChange={handleInputChange}
                  >
                    <option value="Maddie">Maddie</option>
                    <option value="Nick">Nick</option>
                    <option value="Maddie & Nick">Maddie & Nick</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>Due date</span>

                  <input
                    type="date"
                    name="dueDate"
                    value={taskForm.dueDate}
                    onChange={handleInputChange}
                  />
                </label>

                <label className="form-field">
                  <span>Priority</span>

                  <select
                    name="priority"
                    value={taskForm.priority}
                    onChange={handleInputChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>Status</span>

                  <select
                    name="status"
                    value={taskForm.status}
                    onChange={handleInputChange}
                  >
                    <option value="todo">To do</option>
                    <option value="in-progress">In progress</option>
                    <option value="done">Completed</option>
                  </select>
                </label>
              </div>

              <label className="form-field full-width">
                <span>Notes</span>

                <textarea
                  name="notes"
                  value={taskForm.notes}
                  onChange={handleInputChange}
                  placeholder="Add any notes or details..."
                  rows="4"
                />
              </label>

              <div className="task-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeTaskModal}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-button">
                  <Check size={17} />
                  {editingTaskId ? "Save Changes" : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskList({
  tasks,
  openEditTask,
  handleDeleteTask,
  toggleTaskComplete,
}) {
  if (tasks.length === 0) {
    return (
      <div className="content-card task-empty-state">
        <CheckCircle2 size={34} strokeWidth={1.3} />
        <h2>No tasks found</h2>
        <p>Try changing your filters or add a new task.</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div
          className={`task-row ${task.status === "done" ? "completed" : ""}`}
          key={task.id}
        >
          <button
            className="task-complete-button"
            onClick={() => toggleTaskComplete(task.id)}
            title={
              task.status === "done"
                ? "Mark as incomplete"
                : "Mark as complete"
            }
          >
            {task.status === "done" ? (
              <CheckCircle2 size={22} />
            ) : (
              <Circle size={22} />
            )}
          </button>

          <div className="task-main">
            <div className="task-title-line">
              <h3>{task.title}</h3>

              <PriorityBadge priority={task.priority} />
            </div>

            <div className="task-meta">
              <span>{task.category}</span>
              <span>{task.assignedTo}</span>

              {task.dueDate && (
                <span className="task-due-date">
                  <CalendarDays size={14} />
                  {formatDate(task.dueDate)}
                </span>
              )}
            </div>

            {task.notes && <p className="task-notes">{task.notes}</p>}
          </div>

          <StatusBadge status={task.status} />

          <div className="task-actions">
            <button
              className="icon-button"
              onClick={() => openEditTask(task)}
              title="Edit task"
            >
              <Pencil size={17} />
            </button>

            <button
              className="icon-button danger"
              onClick={() => handleDeleteTask(task.id)}
              title="Delete task"
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskBoard({
  tasks,
  openEditTask,
  handleDeleteTask,
  changeTaskStatus,
}) {
  const columns = [
    {
      id: "todo",
      label: "To Do",
    },
    {
      id: "in-progress",
      label: "In Progress",
    },
    {
      id: "done",
      label: "Completed",
    },
  ];

  return (
    <div className="task-board">
      {columns.map((column) => {
        const columnTasks = tasks.filter(
          (task) => task.status === column.id
        );

        return (
          <div className="task-board-column" key={column.id}>
            <div className="task-board-column-header">
              <h2>{column.label}</h2>
              <span>{columnTasks.length}</span>
            </div>

            <div className="task-board-cards">
              {columnTasks.length === 0 ? (
                <div className="board-empty">No tasks</div>
              ) : (
                columnTasks.map((task) => (
                  <div className="task-board-card" key={task.id}>
                    <div className="task-board-card-top">
                      <span className="task-category">{task.category}</span>

                      <PriorityBadge priority={task.priority} />
                    </div>

                    <h3>{task.title}</h3>

                    {task.notes && <p>{task.notes}</p>}

                    <div className="task-board-meta">
                      <span>{task.assignedTo}</span>

                      {task.dueDate && (
                        <span>
                          <CalendarDays size={13} />
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>

                    <div className="board-status-control">
                      <select
                        value={task.status}
                        onChange={(event) =>
                          changeTaskStatus(task.id, event.target.value)
                        }
                      >
                        <option value="todo">To do</option>
                        <option value="in-progress">In progress</option>
                        <option value="done">Completed</option>
                      </select>
                    </div>

                    <div className="task-board-actions">
                      <button
                        className="icon-button"
                        onClick={() => openEditTask(task)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="icon-button danger"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span className={`priority-badge priority-${priority}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }) {
  const labels = {
    todo: "To Do",
    "in-progress": "In Progress",
    done: "Completed",
  };

  return (
    <span className={`status-badge status-${status}`}>
      {labels[status]}
    </span>
  );
}

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateString));
}

export default Tasks;