import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
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

import { db } from "../services/firebase";
import { WEDDING_ID } from "../config/wedding";
import { useAuth } from "../context/AuthContext";

const categories = [
  "Setup",
  "Wedding Party",
  "Vendor",
  "Rehearsal",
  "Ceremony",
  "Cocktail Hour",
  "Reception",
  "Photos",
  "Meal",
  "Transportation",
  "Cleanup",
  "Other",
];

const commonAssignments = [
  "Bride",
  "Groom",
  "Bridesmaids",
  "Groomsmen",
  "Parents",
  "Grandparents",
  "Flower Girl",
  "Ring Bearer",
  "Officiant",
  "Coordinator",
  "Immediate Family",
  "Everyone",
];

const emptyTimelineItem = {
  title: "",
  date: "",
  startTime: "",
  endTime: "",
  allDay: false,
  category: "Other",
  location: "",
  assignedTo: [],
  notes: "",
  parentId: null,
};

const emptyWeddingSettings = {
  weddingDate: "",
  weekendStartDate: "",
  weekendEndDate: "",
};

function Timeline() {
  const { user } = useAuth();

  const [items, setItems] =
    useState([]);

  const [guests, setGuests] =
    useState([]);

  const [
    weddingSettings,
    setWeddingSettings,
  ] = useState(
    emptyWeddingSettings
  );

  const [
    loadingTimeline,
    setLoadingTimeline,
  ] = useState(true);

  const [
    loadingGuests,
    setLoadingGuests,
  ] = useState(true);

  const [
    loadingSettings,
    setLoadingSettings,
  ] = useState(true);

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    editingItemId,
    setEditingItemId,
  ] = useState(null);

  const [
    itemForm,
    setItemForm,
  ] = useState(
    emptyTimelineItem
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    assignmentSearch,
    setAssignmentSearch,
  ] = useState("");

  const [
    customAssignment,
    setCustomAssignment,
  ] = useState("");

  const [
    collapsedItems,
    setCollapsedItems,
  ] = useState({});

  const [
    error,
    setError,
  ] = useState("");

  /*
   * LOAD WEDDING SETTINGS
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
            const data =
              snapshot.data();

            setWeddingSettings({
              weddingDate:
                data.weddingDate ||
                "",

              weekendStartDate:
                data.weekendStartDate ||
                "",

              weekendEndDate:
                data.weekendEndDate ||
                "",
            });
          } else {
            setWeddingSettings(
              emptyWeddingSettings
            );
          }

          setLoadingSettings(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading timeline wedding settings:",
            firebaseError
          );

          setLoadingSettings(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  /*
   * LOAD TIMELINE
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
              (
                itemDocument
              ) => ({
                id:
                  itemDocument.id,

                ...itemDocument.data(),
              })
            );

          data.sort(
            compareTimelineItems
          );

          setItems(data);

          setLoadingTimeline(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading timeline:",
            firebaseError
          );

          setError(
            "We couldn't load the wedding timeline."
          );

          setLoadingTimeline(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  /*
   * LOAD GUESTS
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
              (
                guestDocument
              ) => ({
                id:
                  guestDocument.id,

                ...guestDocument.data(),
              })
            );

          data.sort(
            compareGuests
          );

          setGuests(data);

          setLoadingGuests(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading guests for timeline:",
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
   * WEEKEND DATE PRESETS
   */

  const weddingWeekendDates =
    useMemo(() => {
      return getWeddingWeekendDates(
        weddingSettings
      );
    }, [weddingSettings]);

  /*
   * ROOT ITEMS
   */

  const rootItems =
    useMemo(() => {
      return items.filter(
        (item) =>
          !item.parentId
      );
    }, [items]);

  /*
   * CHILD LOOKUP
   */

  const childMap =
    useMemo(() => {
      const map =
        new Map();

      items.forEach(
        (item) => {
          if (!item.parentId) {
            return;
          }

          if (
            !map.has(
              item.parentId
            )
          ) {
            map.set(
              item.parentId,
              []
            );
          }

          map
            .get(
              item.parentId
            )
            .push(item);
        }
      );

      map.forEach(
        (children) => {
          children.sort(
            compareTimelineItems
          );
        }
      );

      return map;
    }, [items]);

  /*
   * GROUP ROOT ITEMS BY DATE
   */

  const groupedItems =
    useMemo(() => {
      const map =
        new Map();

      rootItems.forEach(
        (item) => {
          const key =
            item.date ||
            "undated";

          if (!map.has(key)) {
            map.set(
              key,
              []
            );
          }

          map
            .get(key)
            .push(item);
        }
      );

      return Array.from(
        map.entries()
      ).sort(
        ([
          firstDate,
        ], [
          secondDate,
        ]) => {
          if (
            firstDate ===
            "undated"
          ) {
            return 1;
          }

          if (
            secondDate ===
            "undated"
          ) {
            return -1;
          }

          return firstDate.localeCompare(
            secondDate
          );
        }
      );
    }, [rootItems]);

  /*
   * GUEST OPTIONS
   */

  const guestAssignmentOptions =
    useMemo(() => {
      return guests
        .map(
          (guest) => ({
            id:
              guest.id,

            label:
              getGuestDisplayName(
                guest
              ),
          })
        )
        .filter(
          (option) =>
            option.label
        );
    }, [guests]);

  const filteredGroupAssignments =
    useMemo(() => {
      const search =
        assignmentSearch
          .trim()
          .toLowerCase();

      if (!search) {
        return commonAssignments;
      }

      return commonAssignments.filter(
        (assignment) =>
          assignment
            .toLowerCase()
            .includes(
              search
            )
      );
    }, [
      assignmentSearch,
    ]);

  const filteredGuestAssignments =
    useMemo(() => {
      const search =
        assignmentSearch
          .trim()
          .toLowerCase();

      if (!search) {
        return guestAssignmentOptions;
      }

      return guestAssignmentOptions.filter(
        (option) =>
          option.label
            .toLowerCase()
            .includes(
              search
            )
      );
    }, [
      assignmentSearch,
      guestAssignmentOptions,
    ]);

  const loading =
    loadingTimeline ||
    loadingGuests ||
    loadingSettings;

  /*
   * ADD ROOT ITEM
   */

  const openAddItem =
    () => {
      setEditingItemId(
        null
      );

      setItemForm({
        ...emptyTimelineItem,

        date:
          weddingSettings.weddingDate ||
          "",

        assignedTo: [],

        parentId: null,
      });

      setAssignmentSearch(
        ""
      );

      setCustomAssignment(
        ""
      );

      setError("");

      setShowModal(
        true
      );
    };

  /*
   * ADD SUBEVENT
   */

  const openAddSubevent = (
    parent
  ) => {
    setEditingItemId(
      null
    );

    setItemForm({
      ...emptyTimelineItem,

      date:
        parent.date ||
        weddingSettings.weddingDate ||
        "",

      category:
        parent.category ||
        "Other",

      location:
        parent.location ||
        "",

      assignedTo: [],

      parentId:
        parent.id,
    });

    setAssignmentSearch(
      ""
    );

    setCustomAssignment(
      ""
    );

    setError("");

    setShowModal(
      true
    );
  };

  /*
   * EDIT ITEM
   */

  const openEditItem = (
    item
  ) => {
    setEditingItemId(
      item.id
    );

    setItemForm({
      title:
        item.title || "",

      date:
        item.date || "",

      startTime:
        item.startTime ||
        "",

      endTime:
        item.endTime ||
        "",

      allDay:
        Boolean(
          item.allDay
        ),

      category:
        item.category ||
        "Other",

      location:
        item.location ||
        "",

      assignedTo:
        normalizeAssignments(
          item.assignedTo
        ),

      notes:
        item.notes || "",

      parentId:
        item.parentId ||
        null,
    });

    setAssignmentSearch(
      ""
    );

    setCustomAssignment(
      ""
    );

    setError("");

    setShowModal(
      true
    );
  };

  const closeModal =
    () => {
      if (saving) {
        return;
      }

      setShowModal(
        false
      );

      setEditingItemId(
        null
      );

      setItemForm(
        emptyTimelineItem
      );

      setAssignmentSearch(
        ""
      );

      setCustomAssignment(
        ""
      );

      setError("");
    };

  /*
   * STANDARD FORM CHANGE
   */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setItemForm(
      (current) => ({
        ...current,

        [name]:
          type ===
          "checkbox"
            ? checked
            : value,
      })
    );
  };

  /*
   * DATE PRESET
   */

  const handlePresetDate = (
    date
  ) => {
    setItemForm(
      (current) => ({
        ...current,
        date,
      })
    );
  };

  /*
   * ASSIGNMENTS
   */

  const toggleAssignment = (
    assignment
  ) => {
    setItemForm(
      (current) => {
        const exists =
          current.assignedTo.includes(
            assignment
          );

        return {
          ...current,

          assignedTo: exists
            ? current.assignedTo.filter(
                (value) =>
                  value !==
                  assignment
              )
            : [
                ...current.assignedTo,
                assignment,
              ],
        };
      }
    );
  };

  const removeAssignment = (
    assignment
  ) => {
    setItemForm(
      (current) => ({
        ...current,

        assignedTo:
          current.assignedTo.filter(
            (value) =>
              value !==
              assignment
          ),
      })
    );
  };

  const addCustomAssignment =
    () => {
      const value =
        customAssignment.trim();

      if (!value) {
        return;
      }

      setItemForm(
        (current) => ({
          ...current,

          assignedTo:
            current.assignedTo.includes(
              value
            )
              ? current.assignedTo
              : [
                  ...current.assignedTo,
                  value,
                ],
        })
      );

      setCustomAssignment(
        ""
      );
    };

  /*
   * COLLAPSE
   */

  const toggleCollapsed = (
    itemId
  ) => {
    setCollapsedItems(
      (current) => ({
        ...current,

        [itemId]:
          !current[itemId],
      })
    );
  };

  /*
   * SAVE
   */

  const handleSave =
    async (event) => {
      event.preventDefault();

      if (
        !itemForm.title.trim()
      ) {
        setError(
          "Please enter a timeline item title."
        );

        return;
      }

      if (!itemForm.date) {
        setError(
          "Please choose a date."
        );

        return;
      }

      if (
        !itemForm.allDay &&
        itemForm.startTime &&
        itemForm.endTime &&
        itemForm.endTime <
          itemForm.startTime
      ) {
        setError(
          "The end time can't be earlier than the start time."
        );

        return;
      }

      setSaving(
        true
      );

      setError("");

      try {
        const itemData = {
          title:
            itemForm.title.trim(),

          date:
            itemForm.date,

          startTime:
            itemForm.allDay
              ? ""
              : itemForm.startTime,

          endTime:
            itemForm.allDay
              ? ""
              : itemForm.endTime,

          allDay:
            itemForm.allDay,

          category:
            itemForm.category,

          location:
            itemForm.location.trim(),

          assignedTo:
            itemForm.assignedTo,

          notes:
            itemForm.notes.trim(),

          parentId:
            itemForm.parentId ||
            null,

          updatedAt:
            serverTimestamp(),

          updatedBy:
            user?.uid ||
            null,
        };

        if (
          editingItemId
        ) {
          await updateDoc(
            doc(
              db,
              "weddings",
              WEDDING_ID,
              "timelineItems",
              editingItemId
            ),
            itemData
          );
        } else {
          await addDoc(
            collection(
              db,
              "weddings",
              WEDDING_ID,
              "timelineItems"
            ),
            {
              ...itemData,

              createdAt:
                serverTimestamp(),

              createdBy:
                user?.uid ||
                null,
            }
          );
        }

        setShowModal(
          false
        );

        setEditingItemId(
          null
        );

        setItemForm(
          emptyTimelineItem
        );

        setAssignmentSearch(
          ""
        );

        setCustomAssignment(
          ""
        );
      } catch (
        firebaseError
      ) {
        console.error(
          "Error saving timeline item:",
          firebaseError
        );

        setError(
          "We couldn't save this timeline item."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /*
   * DELETE
   */

  const handleDelete =
    async (itemId) => {
      try {
        const children =
          childMap.get(
            itemId
          ) || [];

        await Promise.all([
          ...children.map(
            (child) =>
              deleteDoc(
                doc(
                  db,
                  "weddings",
                  WEDDING_ID,
                  "timelineItems",
                  child.id
                )
              )
          ),

          deleteDoc(
            doc(
              db,
              "weddings",
              WEDDING_ID,
              "timelineItems",
              itemId
            )
          ),
        ]);
      } catch (
        firebaseError
      ) {
        console.error(
          "Error deleting timeline item:",
          firebaseError
        );

        setError(
          "We couldn't delete this timeline item."
        );
      }
    };

  return (
    <div className="page timeline-page">
      <div className="timeline-page-header">
        <div>
          <p className="page-eyebrow">
            Wedding Weekend
          </p>

          <h1>
            Timeline
          </h1>

          <p className="page-description">
            Organize the weekend with main events and detailed
            subevents for things like the ceremony and reception.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={
            openAddItem
          }
        >
          <Plus size={17} />
          Add Timeline Item
        </button>
      </div>

      {error &&
        !showModal && (
          <div className="auth-error timeline-page-error">
            {error}

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              <X size={15} />
            </button>
          </div>
        )}

      {loading ? (
        <div className="content-card timeline-loading">
          <LoaderCircle
            size={25}
            className="spinner"
          />

          <p>
            Loading timeline...
          </p>
        </div>
      ) : rootItems.length ===
        0 ? (
        <section className="content-card timeline-empty">
          <CalendarDays
            size={42}
            strokeWidth={1.3}
          />

          <h2>
            No timeline items yet
          </h2>

          <p>
            Add your main wedding-weekend events first. You can then
            add detailed subevents underneath them.
          </p>

          <button
            className="primary-button"
            onClick={
              openAddItem
            }
          >
            <Plus
              size={17}
            />

            Add First Item
          </button>
        </section>
      ) : (
        <section className="timeline-days">
          {groupedItems.map(
            ([
              date,
              dayItems,
            ]) => (
              <TimelineDay
                key={date}
                date={date}
                items={
                  dayItems
                }
                childMap={
                  childMap
                }
                collapsedItems={
                  collapsedItems
                }
                weddingWeekendDates={
                  weddingWeekendDates
                }
                weddingDate={
                  weddingSettings.weddingDate
                }
                onToggleCollapsed={
                  toggleCollapsed
                }
                onAddSubevent={
                  openAddSubevent
                }
                onEdit={
                  openEditItem
                }
                onDelete={
                  handleDelete
                }
              />
            )
          )}
        </section>
      )}

      {showModal && (
        <div
          className="modal-backdrop"
          onMouseDown={
            closeModal
          }
        >
          <div
            className="task-modal timeline-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="task-modal-header">
              <div>
                <p className="card-eyebrow">
                  {editingItemId
                    ? "Edit"
                    : itemForm.parentId
                      ? "New Subevent"
                      : "New Event"}
                </p>

                <h2>
                  {editingItemId
                    ? "Edit Timeline Item"
                    : itemForm.parentId
                      ? "Add Subevent"
                      : "Add Timeline Item"}
                </h2>
              </div>

              <button
                className="icon-button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
              >
                <X
                  size={19}
                />
              </button>
            </div>

            <form
              className="task-form"
              onSubmit={
                handleSave
              }
            >
              {itemForm.parentId && (
                <ParentEventNotice
                  parent={
                    items.find(
                      (item) =>
                        item.id ===
                        itemForm.parentId
                    )
                  }
                />
              )}

              <label className="form-field">
                <span>
                  Event Name
                </span>

                <input
                  type="text"
                  name="title"
                  value={
                    itemForm.title
                  }
                  onChange={
                    handleChange
                  }
                  placeholder={
                    itemForm.parentId
                      ? "Dinner"
                      : "Reception"
                  }
                  autoFocus
                />
              </label>

              {!itemForm.parentId && (
                <div className="form-field">
                  <span>
                    Wedding Weekend Date
                  </span>

                  {weddingWeekendDates.length >
                  0 ? (
                    <div className="timeline-date-presets">
                      {weddingWeekendDates.map(
                        (preset) => (
                          <button
                            key={
                              preset.date
                            }
                            type="button"
                            className={
                              itemForm.date ===
                              preset.date
                                ? "active"
                                : ""
                            }
                            onClick={() =>
                              handlePresetDate(
                                preset.date
                              )
                            }
                          >
                            <strong>
                              {
                                preset.label
                              }
                            </strong>

                            <span>
                              {
                                preset.sublabel
                              }
                            </span>

                            <small>
                              {formatShortDate(
                                preset.date
                              )}
                            </small>
                          </button>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="timeline-no-weekend-settings">
                      Set your wedding weekend dates in Settings to
                      create quick date buttons here.
                    </div>
                  )}
                </div>
              )}

              <div className="form-grid">
                <label className="form-field">
                  <span>
                    Date
                  </span>

                  <input
                    type="date"
                    name="date"
                    value={
                      itemForm.date
                    }
                    onChange={
                      handleChange
                    }
                  />
                </label>

                <label className="form-field">
                  <span>
                    Category
                  </span>

                  <div className="select-wrap">
                    <select
                      name="category"
                      value={
                        itemForm.category
                      }
                      onChange={
                        handleChange
                      }
                    >
                      {categories.map(
                        (
                          category
                        ) => (
                          <option
                            key={
                              category
                            }
                            value={
                              category
                            }
                          >
                            {
                              category
                            }
                          </option>
                        )
                      )}
                    </select>

                    <ChevronDown
                      size={15}
                    />
                  </div>
                </label>
              </div>

              <label className="timeline-all-day-toggle">
                <input
                  type="checkbox"
                  name="allDay"
                  checked={
                    itemForm.allDay
                  }
                  onChange={
                    handleChange
                  }
                />

                <span>
                  Untimed / all-day item
                </span>
              </label>

              {!itemForm.allDay && (
                <div className="form-grid">
                  <label className="form-field">
                    <span>
                      Start Time
                    </span>

                    <input
                      type="time"
                      name="startTime"
                      value={
                        itemForm.startTime
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
                        itemForm.endTime
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </label>
                </div>
              )}

              <label className="form-field">
                <span>
                  Location
                </span>

                <input
                  type="text"
                  name="location"
                  value={
                    itemForm.location
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Bridal Suite, Ceremony Space, Venue..."
                />
              </label>

              <div className="form-field">
                <span>
                  Assigned To
                </span>

                <small className="timeline-form-help">
                  Choose only the people or groups who need to
                  participate in or know about this item.
                </small>

                {itemForm.assignedTo
                  .length >
                  0 && (
                  <div className="timeline-selected-assignments">
                    {itemForm.assignedTo.map(
                      (
                        assignment
                      ) => (
                        <span
                          key={
                            assignment
                          }
                          className="timeline-assignment-chip"
                        >
                          {
                            assignment
                          }

                          <button
                            type="button"
                            onClick={() =>
                              removeAssignment(
                                assignment
                              )
                            }
                          >
                            <X
                              size={12}
                            />
                          </button>
                        </span>
                      )
                    )}
                  </div>
                )}

                <div className="timeline-assignment-picker">
                  <div className="timeline-assignment-search">
                    <Search
                      size={15}
                    />

                    <input
                      type="text"
                      value={
                        assignmentSearch
                      }
                      onChange={(
                        event
                      ) =>
                        setAssignmentSearch(
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="Search people or groups..."
                    />
                  </div>

                  <div className="timeline-assignment-options">
                    {filteredGroupAssignments.length >
                      0 && (
                      <div className="timeline-assignment-section">
                        <span className="timeline-assignment-section-title">
                          Groups & Roles
                        </span>

                        <div className="timeline-assignment-list">
                          {filteredGroupAssignments.map(
                            (
                              assignment
                            ) => (
                              <label
                                key={
                                  assignment
                                }
                                className="timeline-assignment-option"
                              >
                                <input
                                  type="checkbox"
                                  checked={itemForm.assignedTo.includes(
                                    assignment
                                  )}
                                  onChange={() =>
                                    toggleAssignment(
                                      assignment
                                    )
                                  }
                                />

                                <span>
                                  {
                                    assignment
                                  }
                                </span>
                              </label>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {filteredGuestAssignments.length >
                      0 && (
                      <div className="timeline-assignment-section">
                        <span className="timeline-assignment-section-title">
                          Guest List
                        </span>

                        <div className="timeline-assignment-list">
                          {filteredGuestAssignments.map(
                            (
                              guest
                            ) => (
                              <label
                                key={
                                  guest.id
                                }
                                className="timeline-assignment-option"
                              >
                                <input
                                  type="checkbox"
                                  checked={itemForm.assignedTo.includes(
                                    guest.label
                                  )}
                                  onChange={() =>
                                    toggleAssignment(
                                      guest.label
                                    )
                                  }
                                />

                                <span>
                                  {
                                    guest.label
                                  }
                                </span>
                              </label>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {filteredGroupAssignments.length ===
                      0 &&
                      filteredGuestAssignments.length ===
                        0 && (
                        <div className="timeline-assignment-empty">
                          No matching people or groups.
                        </div>
                      )}
                  </div>

                  <div className="timeline-custom-assignment">
                    <UserPlus
                      size={15}
                    />

                    <input
                      type="text"
                      value={
                        customAssignment
                      }
                      onChange={(
                        event
                      ) =>
                        setCustomAssignment(
                          event
                            .target
                            .value
                        )
                      }
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          event.preventDefault();

                          addCustomAssignment();
                        }
                      }}
                      placeholder="Add another person or group..."
                    />

                    <button
                      type="button"
                      className="secondary-button compact"
                      onClick={
                        addCustomAssignment
                      }
                      disabled={
                        !customAssignment.trim()
                      }
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <label className="form-field">
                <span>
                  Notes / Instructions
                </span>

                <textarea
                  name="notes"
                  value={
                    itemForm.notes
                  }
                  onChange={
                    handleChange
                  }
                  rows="4"
                  placeholder="What needs to happen, what to bring, who needs to be ready..."
                />
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
                    closeModal
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    saving
                  }
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
                      <Check
                        size={17}
                      />

                      {editingItemId
                        ? "Save Changes"
                        : itemForm.parentId
                          ? "Add Subevent"
                          : "Add Item"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ParentEventNotice({
  parent,
}) {
  if (!parent) {
    return null;
  }

  return (
    <div className="timeline-parent-notice">
      <span>
        Adding under
      </span>

      <strong>
        {parent.title}
      </strong>
    </div>
  );
}

function TimelineDay({
  date,
  items,
  childMap,
  collapsedItems,
  weddingWeekendDates,
  weddingDate,
  onToggleCollapsed,
  onAddSubevent,
  onEdit,
  onDelete,
}) {
  const preset =
    weddingWeekendDates.find(
      (item) =>
        item.date === date
    );

  const isWeddingDay =
    date ===
    weddingDate;

  return (
    <section className="timeline-day">
      <div className="timeline-day-header">
        <div className="timeline-day-date-icon">
          <CalendarDays
            size={18}
          />
        </div>

        <div>
          <p className="card-eyebrow">
            {isWeddingDay
              ? `${formatWeekday(
                  date
                )} · Wedding Day`
              : preset
                ? `${preset.label} · ${preset.sublabel}`
                : date ===
                    "undated"
                  ? "Schedule"
                  : formatWeekday(
                      date
                    )}
          </p>

          <h2>
            {date ===
            "undated"
              ? "Undated Items"
              : formatFullDate(
                  date
                )}
          </h2>
        </div>
      </div>

      <div className="timeline-day-items">
        {items.map(
          (item) => {
            const children =
              childMap.get(
                item.id
              ) || [];

            const collapsed =
              Boolean(
                collapsedItems[
                  item.id
                ]
              );

            return (
              <TimelineItem
                key={
                  item.id
                }
                item={
                  item
                }
                children={
                  children
                }
                collapsed={
                  collapsed
                }
                onToggleCollapsed={() =>
                  onToggleCollapsed(
                    item.id
                  )
                }
                onAddSubevent={() =>
                  onAddSubevent(
                    item
                  )
                }
                onEdit={() =>
                  onEdit(
                    item
                  )
                }
                onDelete={() =>
                  onDelete(
                    item.id
                  )
                }
                onEditChild={
                  onEdit
                }
                onDeleteChild={
                  onDelete
                }
              />
            );
          }
        )}
      </div>
    </section>
  );
}

function TimelineItem({
  item,
  children,
  collapsed,
  onToggleCollapsed,
  onAddSubevent,
  onEdit,
  onDelete,
  onEditChild,
  onDeleteChild,
}) {
  const assignedTo =
    normalizeAssignments(
      item.assignedTo
    );

  return (
    <article className="timeline-item timeline-parent-item">
      <div className="timeline-item-time">
        {item.allDay ? (
          <span className="timeline-all-day-label">
            Anytime
          </span>
        ) : item.startTime ? (
          <>
            <strong>
              {formatTime(
                item.startTime
              )}
            </strong>

            {item.endTime && (
              <span>
                to{" "}
                {formatTime(
                  item.endTime
                )}
              </span>
            )}
          </>
        ) : (
          <span className="timeline-all-day-label">
            No Time
          </span>
        )}
      </div>

      <div className="timeline-line">
        <div className="timeline-dot" />
      </div>

      <div className="timeline-item-content">
        <div className="timeline-item-heading">
          <div>
            <span
              className={`timeline-category timeline-category-${slugify(
                item.category ||
                  "Other"
              )}`}
            >
              {item.category ||
                "Other"}
            </span>

            <h3>
              {item.title}
            </h3>
          </div>

          <div className="timeline-item-actions">
            <button
              className="icon-button"
              onClick={
                onEdit
              }
              title="Edit timeline item"
            >
              <Pencil
                size={15}
              />
            </button>

            <button
              className="icon-button danger"
              onClick={
                onDelete
              }
              title="Delete timeline item"
            >
              <Trash2
                size={15}
              />
            </button>
          </div>
        </div>

        {(item.location ||
          assignedTo.length >
            0) && (
          <div className="timeline-item-details">
            {item.location && (
              <span>
                <MapPin
                  size={13}
                />

                {
                  item.location
                }
              </span>
            )}

            {assignedTo.length >
              0 && (
              <span>
                <Users
                  size={13}
                />

                {assignedTo.join(
                  ", "
                )}
              </span>
            )}
          </div>
        )}

        {!item.allDay &&
          item.startTime && (
            <div className="timeline-mobile-time">
              <Clock3
                size={13}
              />

              <span>
                {formatTime(
                  item.startTime
                )}

                {item.endTime
                  ? ` – ${formatTime(
                      item.endTime
                    )}`
                  : ""}
              </span>
            </div>
          )}

        {item.notes && (
          <p className="timeline-item-notes">
            {item.notes}
          </p>
        )}

        <div className="timeline-parent-actions">
          {children.length >
            0 && (
            <button
              type="button"
              className="timeline-collapse-button"
              onClick={
                onToggleCollapsed
              }
            >
              {collapsed ? (
                <ChevronRight
                  size={15}
                />
              ) : (
                <ChevronDown
                  size={15}
                />
              )}

              {children.length}{" "}
              {children.length ===
              1
                ? "subevent"
                : "subevents"}
            </button>
          )}

          <button
            type="button"
            className="timeline-add-subevent-button"
            onClick={
              onAddSubevent
            }
          >
            <Plus
              size={14}
            />

            Add Subevent
          </button>
        </div>

        {children.length >
          0 &&
          !collapsed && (
            <div className="timeline-subevents">
              {children.map(
                (child) => (
                  <TimelineSubevent
                    key={
                      child.id
                    }
                    item={
                      child
                    }
                    onEdit={() =>
                      onEditChild(
                        child
                      )
                    }
                    onDelete={() =>
                      onDeleteChild(
                        child.id
                      )
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

function TimelineSubevent({
  item,
  onEdit,
  onDelete,
}) {
  const assignedTo =
    normalizeAssignments(
      item.assignedTo
    );

  return (
    <div className="timeline-subevent">
      <div className="timeline-subevent-time">
        {item.allDay ? (
          <span>
            Anytime
          </span>
        ) : item.startTime ? (
          <>
            <strong>
              {formatTime(
                item.startTime
              )}
            </strong>

            {item.endTime && (
              <small>
                {formatTime(
                  item.endTime
                )}
              </small>
            )}
          </>
        ) : (
          <span>
            No Time
          </span>
        )}
      </div>

      <div className="timeline-subevent-content">
        <div className="timeline-subevent-header">
          <div>
            <strong>
              {item.title}
            </strong>

            {item.category && (
              <span>
                {
                  item.category
                }
              </span>
            )}
          </div>

          <div className="timeline-subevent-actions">
            <button
              className="icon-button"
              onClick={
                onEdit
              }
              title="Edit subevent"
            >
              <Pencil
                size={14}
              />
            </button>

            <button
              className="icon-button danger"
              onClick={
                onDelete
              }
              title="Delete subevent"
            >
              <Trash2
                size={14}
              />
            </button>
          </div>
        </div>

        {(item.location ||
          assignedTo.length >
            0) && (
          <div className="timeline-subevent-meta">
            {item.location && (
              <span>
                <MapPin
                  size={12}
                />

                {
                  item.location
                }
              </span>
            )}

            {assignedTo.length >
              0 && (
              <span>
                <Users
                  size={12}
                />

                {assignedTo.join(
                  ", "
                )}
              </span>
            )}
          </div>
        )}

        {item.notes && (
          <p>
            {item.notes}
          </p>
        )}
      </div>
    </div>
  );
}

/*
 * WEEKEND DATE GENERATOR
 */

function getWeddingWeekendDates({
  weddingDate,
  weekendStartDate,
  weekendEndDate,
}) {
  if (
    !weekendStartDate ||
    !weekendEndDate
  ) {
    return [];
  }

  const start =
    parseDateOnly(
      weekendStartDate
    );

  const end =
    parseDateOnly(
      weekendEndDate
    );

  if (
    !start ||
    !end ||
    end < start
  ) {
    return [];
  }

  const results = [];

  const current =
    new Date(start);

  let index = 0;

  while (
    current <= end &&
    index < 14
  ) {
    const date =
      formatDateOnly(
        current
      );

    let sublabel =
      "Wedding Weekend";

    if (
      date ===
      weddingDate
    ) {
      sublabel =
        "Wedding Day";
    } else if (
      date ===
      weekendStartDate
    ) {
      sublabel =
        "Weekend Begins";
    } else if (
      date ===
      weekendEndDate
    ) {
      sublabel =
        "Weekend Ends";
    }

    results.push({
      date,

      label:
        new Intl.DateTimeFormat(
          "en-US",
          {
            weekday:
              "long",
          }
        ).format(
          current
        ),

      sublabel,
    });

    current.setDate(
      current.getDate() +
        1
    );

    index += 1;
  }

  return results;
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
    dateString
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

function formatDateOnly(
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

function normalizeAssignments(
  value
) {
  if (
    Array.isArray(
      value
    )
  ) {
    return value.filter(
      Boolean
    );
  }

  if (
    typeof value ===
      "string" &&
    value.trim()
  ) {
    return value
      .split(",")
      .map(
        (item) =>
          item.trim()
      )
      .filter(
        Boolean
      );
  }

  return [];
}

function getGuestDisplayName(
  guest
) {
  if (
    guest.isUnnamedGuest
  ) {
    if (
      guest.guestOfName
    ) {
      return `Guest of ${guest.guestOfName}`;
    }

    return "Guest";
  }

  const parts = [
    guest.firstName,
    guest.lastName,
  ].filter(
    Boolean
  );

  const name =
    parts.join(" ");

  if (name) {
    return name;
  }

  return (
    guest.householdName ||
    "Guest"
  );
}

function compareGuests(
  first,
  second
) {
  const firstOrder =
    Number.isFinite(
      Number(
        first.importOrder
      )
    )
      ? Number(
          first.importOrder
        )
      : Number.MAX_SAFE_INTEGER;

  const secondOrder =
    Number.isFinite(
      Number(
        second.importOrder
      )
    )
      ? Number(
          second.importOrder
        )
      : Number.MAX_SAFE_INTEGER;

  if (
    firstOrder !==
    secondOrder
  ) {
    return (
      firstOrder -
      secondOrder
    );
  }

  return getGuestDisplayName(
    first
  ).localeCompare(
    getGuestDisplayName(
      second
    )
  );
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
    timeString
      .split(":")
      .map(
        Number
      );

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
      minute:
        "2-digit",
    }
  ).format(
    date
  );
}

function formatWeekday(
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
    }
  ).format(
    date
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
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  ).format(
    date
  );
}

function formatShortDate(
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

function compareTimelineItems(
  first,
  second
) {
  const firstDate =
    first.date || "";

  const secondDate =
    second.date || "";

  const dateComparison =
    firstDate.localeCompare(
      secondDate
    );

  if (
    dateComparison !==
    0
  ) {
    return dateComparison;
  }

  if (
    first.allDay &&
    !second.allDay
  ) {
    return -1;
  }

  if (
    !first.allDay &&
    second.allDay
  ) {
    return 1;
  }

  const firstTime =
    first.startTime ||
    "99:99";

  const secondTime =
    second.startTime ||
    "99:99";

  const timeComparison =
    firstTime.localeCompare(
      secondTime
    );

  if (
    timeComparison !==
    0
  ) {
    return timeComparison;
  }

  return (
    first.title ||
    ""
  ).localeCompare(
    second.title ||
      ""
  );
}

function slugify(
  value
) {
  return String(
    value || ""
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-|-$/g,
      ""
    );
}

export default Timeline;