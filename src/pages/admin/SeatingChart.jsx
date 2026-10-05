import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Armchair,
  Check,
  GripVertical,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  NavLink,
} from "react-router-dom";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
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

  const fullName = [
    guest.firstName,
    guest.lastName,
  ]
    .filter(
      (value) =>
        value &&
        String(value).trim()
    )
    .join(" ")
    .trim();

  if (fullName) {
    return fullName;
  }

  if (
    guest.name &&
    String(guest.name).trim()
  ) {
    return String(
      guest.name
    ).trim();
  }

  if (
    guest.displayName &&
    String(guest.displayName).trim()
  ) {
    return String(
      guest.displayName
    ).trim();
  }

  if (
    guest.fullName &&
    String(guest.fullName).trim()
  ) {
    return String(
      guest.fullName
    ).trim();
  }

  return "Unnamed Guest";
}


function getInitials(
  guest
) {
  if (
    guest.isUnnamedGuest
  ) {
    return "+1";
  }

  const displayName =
    getGuestDisplayName(
      guest
    );

  const parts =
    displayName
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length >= 2
  ) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  if (
    parts.length === 1
  ) {
    return parts[0][0].toUpperCase();
  }

  return "?";
}


function compareGuestOrder(
  a,
  b
) {
  return getGuestDisplayName(
    a
  ).localeCompare(
    getGuestDisplayName(
      b
    )
  );
}


function groupGuests(
  guests
) {
  const groups = [];
  const householdMap =
    new Map();

  guests.forEach(
    (guest) => {
      if (
        guest.householdId
      ) {
        if (
          !householdMap.has(
            guest.householdId
          )
        ) {
          const group = {
            id: guest.householdId,
            name:
              guest.householdName ||
              "Family",
            householdName:
              guest.householdName ||
              "",
            guests: [],
          };

          householdMap.set(
            guest.householdId,
            group
          );

          groups.push(
            group
          );
        }

        householdMap
          .get(
            guest.householdId
          )
          .guests.push(
            guest
          );

        return;
      }

      groups.push({
        id: `guest-${guest.id}`,
        name:
          getGuestDisplayName(
            guest
          ),
        householdName: "",
        guests: [guest],
      });
    }
  );

  groups.forEach(
    (group) => {
      group.guests.sort(
        compareGuestOrder
      );
    }
  );

  groups.sort(
    (a, b) =>
      a.name.localeCompare(
        b.name
      )
  );

  return groups;
}


function DraggableGuest({
  guest,
  onDragStart,
  compact = false,
}) {
  const rsvpClass =
    guest.rsvpStatus ===
      "attending"
      ? "confirmed"
      : "pending";

  return (
    <div
      className={`seating-guest ${compact
        ? "compact"
        : ""
        }`}
      draggable
      onDragStart={(event) =>
        onDragStart(
          event,
          guest
        )
      }
    >
      <GripVertical
        size={14}
        className="guest-grip"
      />

      <div
        className={`seating-guest-avatar ${rsvpClass}`}
      >
        {getInitials(
          guest
        )}
      </div>

      <div className="seating-guest-name">
        <strong>
          {getGuestDisplayName(guest)}
        </strong>

        {guest.householdName && (
          <span>
            {guest.householdName}
          </span>
        )}
      </div>
    </div>
  );
}


function GuestGroup({
  group,
  onGuestDragStart,
  onFamilyDragStart,
}) {
  const isFamily =
    group.guests.length >
    1 ||
    Boolean(
      group.householdName
    );

  return (
    <section className="seating-family-group">
      <div
        className="seating-family-heading"
        draggable={
          isFamily
        }
        onDragStart={(event) =>
          onFamilyDragStart(
            event,
            group
          )
        }
      >
        <div>
          <strong>
            {group.name}
          </strong>

          <span>
            {group.guests.length}{" "}
            {group.guests.length ===
              1
              ? "guest"
              : "guests"}
          </span>
        </div>

        {isFamily && (
          <div
            className="family-drag-handle"
            title="Drag whole family"
          >
            <GripVertical
              size={16}
            />
          </div>
        )}
      </div>

      <div className="seating-family-members">
        {group.guests.map(
          (guest) => (
            <DraggableGuest
              key={
                guest.id
              }
              guest={
                guest
              }
              onDragStart={
                onGuestDragStart
              }
            />
          )
        )}
      </div>
    </section>
  );
}


function TableCard({
  table,
  guests,
  onGuestDragStart,
  onDrop,
  onEdit,
  onDelete,
}) {
  const confirmedCount =
    guests.filter(
      (guest) =>
        guest.rsvpStatus ===
        "attending"
    ).length;

  const pendingCount =
    guests.filter(
      (guest) =>
        guest.rsvpStatus !==
        "attending"
    ).length;

  const capacity =
    Number(
      table.capacity
    ) || 0;

  const occupancyPercent =
    capacity > 0
      ? Math.min(
        (guests.length /
          capacity) *
        100,
        100
      )
      : 0;

  const isFull =
    capacity > 0 &&
    guests.length >=
    capacity;

  return (
    <article
      className={`seating-table-card ${isFull
        ? "full"
        : ""
        }`}
      onDragOver={(event) =>
        event.preventDefault()
      }
      onDrop={(event) =>
        onDrop(
          event,
          table.id
        )
      }
    >
      <div className="seating-table-header">
        <div>
          <h3>
            {table.name}
          </h3>

          {table.location && (
            <span>
              {table.location}
            </span>
          )}
        </div>

        <div className="seating-table-actions">
          <button
            type="button"
            className="icon-button"
            onClick={() =>
              onEdit(
                table
              )
            }
            title="Edit table"
          >
            <Pencil
              size={15}
            />
          </button>

          <button
            type="button"
            className="icon-button danger"
            onClick={() =>
              onDelete(
                table
              )
            }
            title="Delete table"
          >
            <Trash2
              size={15}
            />
          </button>
        </div>
      </div>

      <div className="table-capacity-row">
        <span>
          {guests.length} /{" "}
          {capacity}
        </span>

        <div className="table-capacity-bar">
          <div
            style={{
              width: `${occupancyPercent}%`,
            }}
          />
        </div>
      </div>

      <div className="table-rsvp-summary">
        <span>
          <Check
            size={13}
          />
          {confirmedCount} confirmed
        </span>

        {pendingCount >
          0 && (
            <span>
              {pendingCount} pending
            </span>
          )}
      </div>

      <div className="table-guests">
        {guests.length ===
          0 ? (
          <div className="empty-table-drop">
            <Armchair
              size={20}
            />
            <span>
              Drop guests here
            </span>
          </div>
        ) : (
          guests.map(
            (guest) => (
              <DraggableGuest
                key={
                  guest.id
                }
                guest={
                  guest
                }
                onDragStart={
                  onGuestDragStart
                }
                compact
              />
            )
          )
        )}
      </div>
    </article>
  );
}


function TableModal({
  table,
  onClose,
  onSave,
}) {
  const [
    name,
    setName,
  ] = useState(
    table?.name || ""
  );

  const [
    capacity,
    setCapacity,
  ] = useState(
    table?.capacity ||
    8
  );

  const [
    location,
    setLocation,
  ] = useState(
    table?.location || ""
  );

  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    const trimmedName =
      name.trim();

    if (!trimmedName) {
      return;
    }

    onSave({
      name: trimmedName,
      capacity:
        Number(
          capacity
        ) || 8,
      location:
        location.trim(),
    });
  };

  return (
    <div
      className="seating-table-modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="seating-table-modal">
        <div className="seating-table-modal-header">
          <div>
            <h2>
              {table
                ? "Edit Table"
                : "Add Table"}
            </h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={
              onClose
            }
          >
            <X
              size={18}
            />
          </button>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
        >
          <label>
            <span>
              Table name
            </span>

            <input
              type="text"
              value={
                name
              }
              onChange={(event) =>
                setName(
                  event.target
                    .value
                )
              }
              placeholder="Table 1"
              autoFocus
            />
          </label>

          <label>
            <span>
              Capacity
            </span>

            <input
              type="number"
              min="1"
              value={
                capacity
              }
              onChange={(event) =>
                setCapacity(
                  event.target
                    .value
                )
              }
            />
          </label>

          <label>
            <span>
              Location
              <small>
                Optional
              </small>
            </span>

            <input
              type="text"
              value={
                location
              }
              onChange={(event) =>
                setLocation(
                  event.target
                    .value
                )
              }
              placeholder="Barn"
            />
          </label>

          <div className="seating-table-modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={
                onClose
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="button primary"
              disabled={
                !name.trim()
              }
            >
              <Check
                size={16}
              />
              {table
                ? "Save Changes"
                : "Add Table"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function SeatingChart() {
  const {
    user,
  } = useAuth();

  const [
    guests,
    setGuests,
  ] = useState([]);

  const [
    tables,
    setTables,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(
    true
  );

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    modalTable,
    setModalTable,
  ] = useState(
    null
  );

  const [
    isAddingTable,
    setIsAddingTable,
  ] = useState(
    false
  );

  const [
    saving,
    setSaving,
  ] = useState(
    false
  );

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const guestsRef =
      collection(
        db,
        "weddings",
        WEDDING_ID,
        "guests"
      );

    const tablesRef =
      collection(
        db,
        "weddings",
        WEDDING_ID,
        "tables"
      );

    const guestsQuery =
      query(
        guestsRef,
        orderBy(
          "lastName"
        )
      );

    const tablesQuery =
      query(
        tablesRef,
        orderBy(
          "order"
        )
      );

    let guestsLoaded =
      false;

    let tablesLoaded =
      false;

    const checkLoaded =
      () => {
        if (
          guestsLoaded &&
          tablesLoaded
        ) {
          setLoading(
            false
          );
        }
      };

    const unsubscribeGuests =
      onSnapshot(
        guestsQuery,
        (snapshot) => {
          const guestData =
            snapshot.docs.map(
              (
                guestDoc
              ) => ({
                id:
                  guestDoc.id,
                ...guestDoc.data(),
              })
            );

          setGuests(
            guestData
          );

          guestsLoaded =
            true;

          checkLoaded();
        },
        (snapshotError) => {
          console.error(
            "Error loading guests:",
            snapshotError
          );

          setError(
            "Unable to load guests."
          );

          guestsLoaded =
            true;

          checkLoaded();
        }
      );

    const unsubscribeTables =
      onSnapshot(
        tablesQuery,
        (snapshot) => {
          const tableData =
            snapshot.docs.map(
              (
                tableDoc
              ) => ({
                id:
                  tableDoc.id,
                ...tableDoc.data(),
              })
            );

          setTables(
            tableData
          );

          tablesLoaded =
            true;

          checkLoaded();
        },
        (snapshotError) => {
          console.error(
            "Error loading tables:",
            snapshotError
          );

          setError(
            "Unable to load tables."
          );

          tablesLoaded =
            true;

          checkLoaded();
        }
      );

    return () => {
      unsubscribeGuests();
      unsubscribeTables();
    };
  }, [user]);

  const attendingGuests =
    useMemo(
      () =>
        guests.filter(
          (guest) =>
            guest.rsvpStatus !==
            "declined"
        ),
      [guests]
    );

  const seatedGuests =
    useMemo(
      () =>
        attendingGuests.filter(
          (guest) =>
            guest.tableId
        ),
      [attendingGuests]
    );

  const unseatedGuests =
    useMemo(
      () =>
        attendingGuests.filter(
          (guest) =>
            !guest.tableId
        ),
      [attendingGuests]
    );

  const confirmedGuests =
    useMemo(
      () =>
        attendingGuests.filter(
          (guest) =>
            guest.rsvpStatus ===
            "attending"
        ),
      [attendingGuests]
    );

  const pendingGuests =
    useMemo(
      () =>
        attendingGuests.filter(
          (guest) =>
            guest.rsvpStatus !==
            "attending"
        ),
      [attendingGuests]
    );

  const filteredUnseatedGuests =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      if (
        !normalizedSearch
      ) {
        return unseatedGuests;
      }

      return unseatedGuests.filter(
        (guest) => {
          const name =
            getGuestDisplayName(
              guest
            ).toLowerCase();

          const household =
            (
              guest.householdName ||
              ""
            ).toLowerCase();

          return (
            name.includes(
              normalizedSearch
            ) ||
            household.includes(
              normalizedSearch
            )
          );
        }
      );
    }, [
      search,
      unseatedGuests,
    ]);

  const unseatedGroups =
    useMemo(
      () =>
        groupGuests(
          filteredUnseatedGuests
        ),
      [
        filteredUnseatedGuests,
      ]
    );

  const guestsByTable =
    useMemo(() => {
      const grouped =
        new Map();

      tables.forEach(
        (table) => {
          grouped.set(
            table.id,
            []
          );
        }
      );

      seatedGuests.forEach(
        (guest) => {
          if (
            !grouped.has(
              guest.tableId
            )
          ) {
            grouped.set(
              guest.tableId,
              []
            );
          }

          grouped
            .get(
              guest.tableId
            )
            .push(
              guest
            );
        }
      );

      grouped.forEach(
        (tableGuests) => {
          tableGuests.sort(
            compareGuestOrder
          );
        }
      );

      return grouped;
    }, [
      tables,
      seatedGuests,
    ]);

  const totalCapacity =
    useMemo(
      () =>
        tables.reduce(
          (
            total,
            table
          ) =>
            total +
            (Number(
              table.capacity
            ) || 0),
          0
        ),
      [tables]
    );

  const seatingPercent =
    attendingGuests.length >
      0
      ? Math.round(
        (seatedGuests.length /
          attendingGuests.length) *
        100
      )
      : 0;

  const handleGuestDragStart =
    (
      event,
      guest
    ) => {
      event.dataTransfer.effectAllowed =
        "move";

      event.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          type: "guest",
          guestId:
            guest.id,
        })
      );
    };

  const handleFamilyDragStart =
    (
      event,
      group
    ) => {
      event.dataTransfer.effectAllowed =
        "move";

      event.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          type: "family",
          guestIds:
            group.guests.map(
              (guest) =>
                guest.id
            ),
        })
      );
    };

  const handleDrop =
    async (
      event,
      tableId
    ) => {
      event.preventDefault();

      try {
        const data =
          JSON.parse(
            event.dataTransfer.getData(
              "text/plain"
            )
          );

        setSaving(
          true
        );

        const batch =
          writeBatch(
            db
          );

        if (
          data.type ===
          "guest"
        ) {
          const guestRef =
            doc(
              db,
              "weddings",
              WEDDING_ID,
              "guests",
              data.guestId
            );

          batch.update(
            guestRef,
            {
              tableId,
              updatedAt:
                serverTimestamp(),
            }
          );
        }

        if (
          data.type ===
          "family"
        ) {
          data.guestIds.forEach(
            (
              guestId
            ) => {
              const guestRef =
                doc(
                  db,
                  "weddings",
                  WEDDING_ID,
                  "guests",
                  guestId
                );

              batch.update(
                guestRef,
                {
                  tableId,
                  updatedAt:
                    serverTimestamp(),
                }
              );
            }
          );
        }

        await batch.commit();
      } catch (
      dropError
      ) {
        console.error(
          "Error seating guest:",
          dropError
        );

        setError(
          "Unable to move guest."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  const handleUnseatDrop =
    async (
      event
    ) => {
      event.preventDefault();

      try {
        const data =
          JSON.parse(
            event.dataTransfer.getData(
              "text/plain"
            )
          );

        setSaving(
          true
        );

        const batch =
          writeBatch(
            db
          );

        if (
          data.type ===
          "guest"
        ) {
          const guestRef =
            doc(
              db,
              "weddings",
              WEDDING_ID,
              "guests",
              data.guestId
            );

          batch.update(
            guestRef,
            {
              tableId:
                null,
              updatedAt:
                serverTimestamp(),
            }
          );
        }

        if (
          data.type ===
          "family"
        ) {
          data.guestIds.forEach(
            (
              guestId
            ) => {
              const guestRef =
                doc(
                  db,
                  "weddings",
                  WEDDING_ID,
                  "guests",
                  guestId
                );

              batch.update(
                guestRef,
                {
                  tableId:
                    null,
                  updatedAt:
                    serverTimestamp(),
                }
              );
            }
          );
        }

        await batch.commit();
      } catch (
      dropError
      ) {
        console.error(
          "Error unseating guest:",
          dropError
        );

        setError(
          "Unable to remove guest from table."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  const handleSaveTable =
    async (
      tableData
    ) => {
      try {
        setSaving(
          true
        );

        if (
          modalTable
        ) {
          const tableRef =
            doc(
              db,
              "weddings",
              WEDDING_ID,
              "tables",
              modalTable.id
            );

          await updateDoc(
            tableRef,
            {
              ...tableData,
              updatedAt:
                serverTimestamp(),
            }
          );
        } else {
          const highestOrder =
            tables.reduce(
              (
                highest,
                table
              ) =>
                Math.max(
                  highest,
                  Number(
                    table.order
                  ) || 0
                ),
              0
            );

          await addDoc(
            collection(
              db,
              "weddings",
              WEDDING_ID,
              "tables"
            ),
            {
              ...tableData,
              order:
                highestOrder +
                1,
              createdAt:
                serverTimestamp(),
              updatedAt:
                serverTimestamp(),
            }
          );
        }

        setModalTable(
          null
        );

        setIsAddingTable(
          false
        );
      } catch (
      saveError
      ) {
        console.error(
          "Error saving table:",
          saveError
        );

        setError(
          "Unable to save table."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  const handleDeleteTable =
    async (
      table
    ) => {
      const tableGuests =
        guestsByTable.get(
          table.id
        ) || [];

      const message =
        tableGuests.length >
          0
          ? `Delete ${table.name}? The ${tableGuests.length} guest${tableGuests.length ===
            1
            ? ""
            : "s"
          } at this table will become unseated.`
          : `Delete ${table.name}?`;

      if (
        !window.confirm(
          message
        )
      ) {
        return;
      }

      try {
        setSaving(
          true
        );

        const batch =
          writeBatch(
            db
          );

        tableGuests.forEach(
          (guest) => {
            const guestRef =
              doc(
                db,
                "weddings",
                WEDDING_ID,
                "guests",
                guest.id
              );

            batch.update(
              guestRef,
              {
                tableId:
                  null,
                updatedAt:
                  serverTimestamp(),
              }
            );
          }
        );

        const tableRef =
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "tables",
            table.id
          );

        batch.delete(
          tableRef
        );

        await batch.commit();
      } catch (
      deleteError
      ) {
        console.error(
          "Error deleting table:",
          deleteError
        );

        setError(
          "Unable to delete table."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  const handleEditTable =
    (table) => {
      setModalTable(
        table
      );

      setIsAddingTable(
        false
      );
    };

  const handleAddTable =
    () => {
      setModalTable(
        null
      );

      setIsAddingTable(
        true
      );
    };

  const closeModal =
    () => {
      setModalTable(
        null
      );

      setIsAddingTable(
        false
      );
    };

  if (loading) {
    return (
      <div className="seating-loading">
        <LoaderCircle
          size={24}
          className="spin"
        />
        <span>
          Loading seating chart...
        </span>
      </div>
    );
  }

  return (
    <div className="seating-page">
      <div className="seating-page-header">
        <div>
          <h1>
            Seating Chart
          </h1>

          <p className="page-description">
            Organize your attending guests into tables. Drag individual guests or entire families between tables.
          </p>
        </div>

        <div className="seating-page-header-actions">
          <NavLink
            to="/guests"
            className="button secondary"
          >
            View Guests
          </NavLink>

          <button
            type="button"
            className="button primary"
            onClick={
              handleAddTable
            }
          >
            <Plus
              size={16}
            />
            Add Table
          </button>
        </div>
      </div>

      {error && (
        <div className="seating-error">
          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError(
                ""
              )
            }
          >
            <X
              size={16}
            />
          </button>
        </div>
      )}

      <div className="seating-stats">
        <div className="seating-stat-card">
          <span>
            Attending
          </span>

          <strong>
            {
              attendingGuests.length
            }
          </strong>
        </div>

        <div className="seating-stat-card seating-stat-confirmed">
          <span>
            Confirmed
          </span>

          <strong>
            {
              confirmedGuests.length
            }
          </strong>
        </div>

        <div className="seating-stat-card seating-stat-pending">
          <span>
            Pending
          </span>

          <strong>
            {
              pendingGuests.length
            }
          </strong>
        </div>

        <div className="seating-stat-card seating-stat-seated">
          <span>
            Seated
          </span>

          <strong>
            {seatedGuests.length}
          </strong>
        </div>

        <div className="seating-stat-card">
          <span>
            Unseated
          </span>

          <strong>
            {
              unseatedGuests.length
            }
          </strong>
        </div>
      </div>

      <div className="seating-rsvp-legend">
        <div>
          <span className="legend-dot confirmed" />
          Confirmed
        </div>

        <div>
          <span className="legend-dot pending" />
          Pending RSVP
        </div>

        <div className="seating-progress-text">
          {seatingPercent}% seated
          {totalCapacity >
            0 && (
              <>
                {" "}
                ·{" "}
                {seatedGuests.length} /{" "}
                {totalCapacity} seats
              </>
            )}
        </div>
      </div>

      <div className="seating-layout">
        <aside
          className="unseated-panel"
          onDragOver={(event) =>
            event.preventDefault()
          }
          onDrop={
            handleUnseatDrop
          }
        >
          <div className="unseated-header">
            <div>
              <h2>
                Unseated Guests
              </h2>

              <span className="unseated-count">
                {
                  unseatedGuests.length
                }
              </span>
            </div>
          </div>

          <div className="seating-search">
            <Search
              size={16}
            />

            <input
              type="search"
              value={
                search
              }
              onChange={(event) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Search guests..."
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch(
                    ""
                  )
                }
              >
                <X
                  size={14}
                />
              </button>
            )}
          </div>

          <div className="unseated-drop-hint">
            Drag guests here to remove them from a table
          </div>

          <div className="unseated-groups">
            {unseatedGroups.length ===
              0 ? (
              <div className="unseated-empty">
                <Check
                  size={22}
                />

                <strong>
                  {search
                    ? "No guests found"
                    : "Everyone is seated"}
                </strong>

                <span>
                  {search
                    ? "Try a different search."
                    : "Nice work!"}
                </span>
              </div>
            ) : (
              unseatedGroups.map(
                (group) => (
                  <GuestGroup
                    key={
                      group.id
                    }
                    group={
                      group
                    }
                    onGuestDragStart={
                      handleGuestDragStart
                    }
                    onFamilyDragStart={
                      handleFamilyDragStart
                    }
                  />
                )
              )
            )}
          </div>
        </aside>

        <main className="table-area">
          {tables.length ===
            0 ? (
            <div className="seating-no-tables">
              <Armchair
                size={32}
              />

              <h2>
                No tables yet
              </h2>

              <p>
                Add your first table to start arranging your guests.
              </p>

              <button
                type="button"
                className="button primary"
                onClick={
                  handleAddTable
                }
              >
                <Plus
                  size={16}
                />
                Add Table
              </button>
            </div>
          ) : (
            <div className="table-grid">
              {tables.map(
                (table) => (
                  <TableCard
                    key={
                      table.id
                    }
                    table={
                      table
                    }
                    guests={
                      guestsByTable.get(
                        table.id
                      ) || []
                    }
                    onGuestDragStart={
                      handleGuestDragStart
                    }
                    onDrop={
                      handleDrop
                    }
                    onEdit={
                      handleEditTable
                    }
                    onDelete={
                      handleDeleteTable
                    }
                  />
                )
              )}
            </div>
          )}
        </main>
      </div>

      {saving && (
        <div className="seating-saving-indicator">
          <LoaderCircle
            size={15}
            className="spin"
          />
          Saving...
        </div>
      )}

      {(modalTable ||
        isAddingTable) && (
          <TableModal
            table={
              modalTable
            }
            onClose={
              closeModal
            }
            onSave={
              handleSaveTable
            }
          />
        )}
    </div>
  );
}