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

const emptyTable = {
  name: "",
  capacity: 8,
};

function SeatingChart() {
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
    guestsLoading,
    setGuestsLoading,
  ] = useState(true);

  const [
    tablesLoading,
    setTablesLoading,
  ] = useState(true);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    showTableModal,
    setShowTableModal,
  ] = useState(false);

  const [
    editingTableId,
    setEditingTableId,
  ] = useState(null);

  const [
    tableForm,
    setTableForm,
  ] = useState(
    emptyTable
  );

  const [
    savingTable,
    setSavingTable,
  ] = useState(false);

  const [
    movingGuests,
    setMovingGuests,
  ] = useState(false);

  const [
    dragOverTarget,
    setDragOverTarget,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

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
            compareGuestOrder
          );

          setGuests(
            data
          );

          setGuestsLoading(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading guests:",
            firebaseError
          );

          setError(
            "We couldn't load the guest list."
          );

          setGuestsLoading(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  /*
   * LOAD TABLES
   */

  useEffect(() => {
    const tablesRef =
      collection(
        db,
        "weddings",
        WEDDING_ID,
        "tables"
      );

    const tablesQuery =
      query(
        tablesRef,
        orderBy(
          "order",
          "asc"
        )
      );

    const unsubscribe =
      onSnapshot(
        tablesQuery,
        (snapshot) => {
          const data =
            snapshot.docs.map(
              (
                tableDocument
              ) => ({
                id:
                  tableDocument.id,

                ...tableDocument.data(),
              })
            );

          setTables(
            data
          );

          setTablesLoading(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading tables:",
            firebaseError
          );

          setError(
            "We couldn't load the tables."
          );

          setTablesLoading(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  /*
   * SEATABLE GUESTS
   *
   * Everyone stays on the seating chart
   * unless they have declined.
   */

  const seatableGuests =
    useMemo(
      () =>
        guests.filter(
          (guest) =>
            guest.rsvpStatus !==
            "declined"
        ),
      [
        guests,
      ]
    );

  /*
   * RSVP COUNTS
   */

  const confirmedCount =
    useMemo(
      () =>
        seatableGuests.filter(
          (guest) =>
            guest.rsvpStatus ===
            "attending"
        ).length,
      [
        seatableGuests,
      ]
    );

  const pendingCount =
    useMemo(
      () =>
        seatableGuests.filter(
          (guest) =>
            guest.rsvpStatus !==
            "attending"
        ).length,
      [
        seatableGuests,
      ]
    );

  /*
   * UNSEATED
   */

  const unseatedGuests =
    useMemo(
      () =>
        seatableGuests.filter(
          (guest) =>
            !guest.tableId
        ),
      [
        seatableGuests,
      ]
    );

  /*
   * SEARCH UNSEATED
   */

  const filteredUnseatedGuests =
    useMemo(
      () => {
        const searchValue =
          search
            .trim()
            .toLowerCase();

        if (
          !searchValue
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
              String(
                guest.householdName ||
                ""
              ).toLowerCase();

            return (
              name.includes(
                searchValue
              ) ||
              household.includes(
                searchValue
              )
            );
          }
        );
      },
      [
        unseatedGuests,
        search,
      ]
    );

  /*
   * GROUP UNSEATED BY FAMILY
   */

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

  /*
   * TABLE -> GUEST LOOKUP
   */

  const tableGuestMap =
    useMemo(
      () => {
        const map =
          new Map();

        tables.forEach(
          (table) => {
            map.set(
              table.id,
              []
            );
          }
        );

        seatableGuests.forEach(
          (guest) => {
            if (
              guest.tableId &&
              map.has(
                guest.tableId
              )
            ) {
              map
                .get(
                  guest.tableId
                )
                .push(
                  guest
                );
            }
          }
        );

        return map;
      },
      [
        tables,
        seatableGuests,
      ]
    );

  const seatedCount =
    seatableGuests.length -
    unseatedGuests.length;

  const totalCapacity =
    useMemo(
      () =>
        tables.reduce(
          (
            total,
            table
          ) =>
            total +
            Number(
              table.capacity ||
              0
            ),
          0
        ),
      [
        tables,
      ]
    );

  const loading =
    guestsLoading ||
    tablesLoading;

  /*
   * ADD TABLE
   */

  const openAddTable =
    () => {
      setEditingTableId(
        null
      );

      setTableForm({
        name:
          `Table ${
            tables.length +
            1
          }`,

        capacity:
          8,
      });

      setError(
        ""
      );

      setShowTableModal(
        true
      );
    };

  /*
   * EDIT TABLE
   */

  const openEditTable =
    (table) => {
      setEditingTableId(
        table.id
      );

      setTableForm({
        name:
          table.name ||
          "",

        capacity:
          table.capacity ||
          8,
      });

      setError(
        ""
      );

      setShowTableModal(
        true
      );
    };

  const closeTableModal =
    () => {
      if (
        savingTable
      ) {
        return;
      }

      setShowTableModal(
        false
      );

      setEditingTableId(
        null
      );

      setTableForm(
        emptyTable
      );

      setError(
        ""
      );
    };

  const handleTableChange =
    (event) => {
      const {
        name,
        value,
      } =
        event.target;

      setTableForm(
        (current) => ({
          ...current,

          [name]:
            name ===
            "capacity"
              ? Number(
                  value
                )
              : value,
        })
      );
    };

  /*
   * SAVE TABLE
   */

  const handleSaveTable =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        !tableForm.name.trim()
      ) {
        setError(
          "Please enter a table name."
        );

        return;
      }

      if (
        Number(
          tableForm.capacity
        ) <
        1
      ) {
        setError(
          "Table capacity must be at least 1."
        );

        return;
      }

      setSavingTable(
        true
      );

      setError(
        ""
      );

      try {
        if (
          editingTableId
        ) {
          const currentGuests =
            tableGuestMap.get(
              editingTableId
            ) ||
            [];

          if (
            Number(
              tableForm.capacity
            ) <
            currentGuests.length
          ) {
            setError(
              `This table already has ${currentGuests.length} guests. Increase the capacity or move guests first.`
            );

            setSavingTable(
              false
            );

            return;
          }

          await updateDoc(
            doc(
              db,
              "weddings",
              WEDDING_ID,
              "tables",
              editingTableId
            ),
            {
              name:
                tableForm.name.trim(),

              capacity:
                Number(
                  tableForm.capacity
                ),

              updatedAt:
                serverTimestamp(),

              updatedBy:
                user?.uid ||
                null,
            }
          );
        } else {
          await addDoc(
            collection(
              db,
              "weddings",
              WEDDING_ID,
              "tables"
            ),
            {
              name:
                tableForm.name.trim(),

              capacity:
                Number(
                  tableForm.capacity
                ),

              order:
                getNextTableOrder(
                  tables
                ),

              createdAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp(),

              createdBy:
                user?.uid ||
                null,

              updatedBy:
                user?.uid ||
                null,
            }
          );
        }

        setShowTableModal(
          false
        );

        setEditingTableId(
          null
        );

        setTableForm(
          emptyTable
        );
      } catch (firebaseError) {
        console.error(
          "Error saving table:",
          firebaseError
        );

        setError(
          "We couldn't save this table."
        );
      } finally {
        setSavingTable(
          false
        );
      }
    };

  /*
   * CLEAR TABLE
   */

  const handleClearTable =
    async (
      table
    ) => {
      const tableGuests =
        tableGuestMap.get(
          table.id
        ) ||
        [];

      if (
        !tableGuests.length
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Clear ${table.name}? All ${tableGuests.length} guests will return to Unseated.`
        );

      if (
        !confirmed
      ) {
        return;
      }

      setMovingGuests(
        true
      );

      setError(
        ""
      );

      try {
        const batch =
          writeBatch(
            db
          );

        tableGuests.forEach(
          (guest) => {
            batch.update(
              doc(
                db,
                "weddings",
                WEDDING_ID,
                "guests",
                guest.id
              ),
              {
                tableId:
                  null,

                updatedAt:
                  serverTimestamp(),

                updatedBy:
                  user?.uid ||
                  null,
              }
            );
          }
        );

        await batch.commit();
      } catch (firebaseError) {
        console.error(
          "Error clearing table:",
          firebaseError
        );

        setError(
          "We couldn't clear this table."
        );
      } finally {
        setMovingGuests(
          false
        );
      }
    };

  /*
   * DELETE TABLE
   */

  const handleDeleteTable =
    async (
      table
    ) => {
      const tableGuests =
        tableGuestMap.get(
          table.id
        ) ||
        [];

      const confirmed =
        window.confirm(
          tableGuests.length
            ? `Delete ${table.name}? Its ${tableGuests.length} guests will return to Unseated.`
            : `Delete ${table.name}?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      setMovingGuests(
        true
      );

      setError(
        ""
      );

      try {
        if (
          tableGuests.length >
          0
        ) {
          const batch =
            writeBatch(
              db
            );

          tableGuests.forEach(
            (guest) => {
              batch.update(
                doc(
                  db,
                  "weddings",
                  WEDDING_ID,
                  "guests",
                  guest.id
                ),
                {
                  tableId:
                    null,

                  updatedAt:
                    serverTimestamp(),

                  updatedBy:
                    user?.uid ||
                    null,
                }
              );
            }
          );

          await batch.commit();
        }

        await deleteDoc(
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "tables",
            table.id
          )
        );
      } catch (firebaseError) {
        console.error(
          "Error deleting table:",
          firebaseError
        );

        setError(
          "We couldn't delete this table."
        );
      } finally {
        setMovingGuests(
          false
        );
      }
    };

  /*
   * DRAG START: ONE GUEST
   */

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
          type:
            "guest",

          guestIds: [
            guest.id,
          ],
        })
      );
    };

  /*
   * DRAG START: WHOLE FAMILY
   */

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
          type:
            "family",

          guestIds:
            group.guests.map(
              (guest) =>
                guest.id
            ),
        })
      );
    };

  /*
   * DROP ON TABLE
   */

  const handleDropOnTable =
    async (
      event,
      table
    ) => {
      event.preventDefault();

      setDragOverTarget(
        null
      );

      const payload =
        readDragPayload(
          event
        );

      if (
        !payload ||
        !payload.guestIds?.length
      ) {
        return;
      }

      const moving =
        seatableGuests.filter(
          (guest) =>
            payload.guestIds.includes(
              guest.id
            )
        );

      if (
        !moving.length
      ) {
        return;
      }

      const currentGuests =
        tableGuestMap.get(
          table.id
        ) ||
        [];

      const movingFromElsewhere =
        moving.filter(
          (guest) =>
            guest.tableId !==
            table.id
        );

      const newCount =
        currentGuests.length +
        movingFromElsewhere.length;

      if (
        newCount >
        Number(
          table.capacity ||
          0
        )
      ) {
        setError(
          `${table.name} only has ${table.capacity} seats. This move would put ${newCount} guests at the table.`
        );

        return;
      }

      await assignGuestsToTable(
        moving.map(
          (guest) =>
            guest.id
        ),
        table.id
      );
    };

  /*
   * DROP BACK INTO UNSEATED
   */

  const handleDropUnseated =
    async (
      event
    ) => {
      event.preventDefault();

      setDragOverTarget(
        null
      );

      const payload =
        readDragPayload(
          event
        );

      if (
        !payload ||
        !payload.guestIds?.length
      ) {
        return;
      }

      await assignGuestsToTable(
        payload.guestIds,
        null
      );
    };

  /*
   * SAVE TABLE ASSIGNMENT
   */

  const assignGuestsToTable =
    async (
      guestIds,
      tableId
    ) => {
      if (
        !guestIds.length
      ) {
        return;
      }

      setMovingGuests(
        true
      );

      setError(
        ""
      );

      try {
        const batch =
          writeBatch(
            db
          );

        guestIds.forEach(
          (guestId) => {
            batch.update(
              doc(
                db,
                "weddings",
                WEDDING_ID,
                "guests",
                guestId
              ),
              {
                tableId,

                updatedAt:
                  serverTimestamp(),

                updatedBy:
                  user?.uid ||
                  null,
              }
            );
          }
        );

        await batch.commit();
      } catch (firebaseError) {
        console.error(
          "Error moving guests:",
          firebaseError
        );

        setError(
          "We couldn't update the seating assignment."
        );
      } finally {
        setMovingGuests(
          false
        );
      }
    };

  return (
    <main className="page seating-page">
      <GuestPlanningNav />

      <div className="seating-page-header">
        <div>
          <p className="page-eyebrow">
            Guests
          </p>

          <h1 className="page-title">
            Seating Chart
          </h1>

          <p className="page-description">
            Arrange confirmed and pending guests while
            RSVP responses are still coming in.
          </p>
        </div>

        <button
          type="button"
          className="primary-button seating-add-table"
          onClick={
            openAddTable
          }
        >
          <Plus
            size={17}
          />

          Add Table
        </button>
      </div>

      <section className="seating-stats">
        <SeatingStat
          label="Seating Guests"
          value={
            seatableGuests.length
          }
        />

        <SeatingStat
          label="RSVP Yes"
          value={
            confirmedCount
          }
          type="confirmed"
        />

        <SeatingStat
          label="Awaiting RSVP"
          value={
            pendingCount
          }
          type="pending"
        />

        <SeatingStat
          label="Seated"
          value={
            seatedCount
          }
          type="seated"
        />

        <SeatingStat
          label="Unseated"
          value={
            unseatedGuests.length
          }
        />

        <SeatingStat
          label="Total Seats"
          value={
            totalCapacity
          }
        />
      </section>

      <div className="seating-rsvp-legend">
        <span>
          <i className="confirmed" />

          RSVP Yes
        </span>

        <span>
          <i className="pending" />

          Awaiting RSVP
        </span>

        <span className="seating-progress-text">
          {seatedCount} of{" "}
          {seatableGuests.length} seated
          across{" "}
          {tables.length}{" "}
          {tables.length ===
          1
            ? "table"
            : "tables"}
        </span>
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
              size={15}
            />
          </button>
        </div>
      )}

      {loading ? (
        <div className="content-card seating-loading">
          <LoaderCircle
            className="spinner"
            size={25}
          />

          <p>
            Loading seating chart...
          </p>
        </div>
      ) : (
        <div className="seating-layout">
          <aside
            className={`unseated-panel ${
              dragOverTarget ===
              "unseated"
                ? "drag-over"
                : ""
            }`}
            onDragOver={(event) => {
              event.preventDefault();

              setDragOverTarget(
                "unseated"
              );
            }}
            onDragLeave={() =>
              setDragOverTarget(
                null
              )
            }
            onDrop={
              handleDropUnseated
            }
          >
            <div className="unseated-header">
              <div>
                <p className="card-eyebrow">
                  Unseated
                </p>

                <h2>
                  Guests
                </h2>
              </div>

              <span className="unseated-count">
                {unseatedGuests.length}
              </span>
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
                    event.target.value
                  )
                }
                placeholder="Search unseated guests..."
              />
            </div>

            <div className="unseated-drop-hint">
              Drag a guest or an entire family onto a
              table. Drop them back here to remove
              their seating assignment.
            </div>

            {unseatedGroups.length ===
            0 ? (
              <div className="unseated-empty">
                <Check
                  size={30}
                />

                <strong>
                  {unseatedGuests.length ===
                  0
                    ? "Everyone is seated"
                    : "No matches"}
                </strong>

                <span>
                  {unseatedGuests.length ===
                  0
                    ? "Every guest who has not declined currently has a table assignment."
                    : "Try a different search."}
                </span>
              </div>
            ) : (
              <div className="unseated-groups">
                {unseatedGroups.map(
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
                )}
              </div>
            )}
          </aside>

          <section className="table-area">
            {tables.length ===
            0 ? (
              <div className="content-card seating-no-tables">
                <Armchair
                  size={40}
                  strokeWidth={1.3}
                />

                <h2>
                  No tables yet
                </h2>

                <p>
                  Add your reception tables, then drag
                  guests into them.
                </p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    openAddTable
                  }
                >
                  <Plus
                    size={17}
                  />

                  Add First Table
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
                        tableGuestMap.get(
                          table.id
                        ) ||
                        []
                      }
                      dragOver={
                        dragOverTarget ===
                        table.id
                      }
                      onDragOver={(event) => {
                        event.preventDefault();

                        setDragOverTarget(
                          table.id
                        );
                      }}
                      onDragLeave={() =>
                        setDragOverTarget(
                          null
                        )
                      }
                      onDrop={(event) =>
                        handleDropOnTable(
                          event,
                          table
                        )
                      }
                      onGuestDragStart={
                        handleGuestDragStart
                      }
                      onEdit={() =>
                        openEditTable(
                          table
                        )
                      }
                      onClear={() =>
                        handleClearTable(
                          table
                        )
                      }
                      onDelete={() =>
                        handleDeleteTable(
                          table
                        )
                      }
                    />
                  )
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {movingGuests && (
        <div className="seating-saving-indicator">
          <LoaderCircle
            className="spinner"
            size={16}
          />

          Saving seating...
        </div>
      )}

      {showTableModal && (
        <div
          className="modal-backdrop"
          onMouseDown={
            closeTableModal
          }
        >
          <div
            className="task-modal seating-table-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="task-modal-header">
              <div>
                <p className="card-eyebrow">
                  {editingTableId
                    ? "Edit"
                    : "New Table"}
                </p>

                <h2>
                  {editingTableId
                    ? "Edit Table"
                    : "Add Table"}
                </h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={
                  closeTableModal
                }
                disabled={
                  savingTable
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
                handleSaveTable
              }
            >
              <label className="form-field">
                <span>
                  Table Name
                </span>

                <input
                  type="text"
                  name="name"
                  value={
                    tableForm.name
                  }
                  onChange={
                    handleTableChange
                  }
                  placeholder="Table 1"
                  autoFocus
                />
              </label>

              <label className="form-field">
                <span>
                  Number of Seats
                </span>

                <input
                  type="number"
                  name="capacity"
                  min="1"
                  max="30"
                  value={
                    tableForm.capacity
                  }
                  onChange={
                    handleTableChange
                  }
                />
              </label>

              {error && (
                <div className="seating-modal-error">
                  {error}
                </div>
              )}

              <div className="task-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeTableModal
                  }
                  disabled={
                    savingTable
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    savingTable
                  }
                >
                  {savingTable ? (
                    <>
                      <LoaderCircle
                        className="spinner"
                        size={17}
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Check
                        size={17}
                      />

                      {editingTableId
                        ? "Save Changes"
                        : "Add Table"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

/*
 * GUEST / SEATING NAV
 */

function GuestPlanningNav() {
  return (
    <nav
      className="guest-planning-nav"
      aria-label="Guest planning"
    >
      <NavLink
        to="/admin/guests"
        className={({
          isActive,
        }) =>
          `guest-planning-nav-link ${
            isActive
              ? "active"
              : ""
          }`
        }
      >
        Guests
      </NavLink>

      <NavLink
        to="/admin/seating-chart"
        className={({
          isActive,
        }) =>
          `guest-planning-nav-link ${
            isActive
              ? "active"
              : ""
          }`
        }
      >
        Seating Chart
      </NavLink>
    </nav>
  );
}

/*
 * STAT
 */

function SeatingStat({
  label,
  value,
  type = "",
}) {
  return (
    <div
      className={`seating-stat-card ${
        type
          ? `seating-stat-${type}`
          : ""
      }`}
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

/*
 * UNSEATED FAMILY GROUP
 */

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

/*
 * TABLE CARD
 */

function TableCard({
  table,
  guests,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onGuestDragStart,
  onEdit,
  onClear,
  onDelete,
}) {
  const capacity =
    Number(
      table.capacity ||
      0
    );

  const remaining =
    capacity -
    guests.length;

  const full =
    remaining <=
    0;

  const confirmedAtTable =
    guests.filter(
      (guest) =>
        guest.rsvpStatus ===
        "attending"
    ).length;

  const pendingAtTable =
    guests.length -
    confirmedAtTable;

  return (
    <article
      className={`seating-table-card ${
        dragOver
          ? "drag-over"
          : ""
      } ${
        full
          ? "table-full"
          : ""
      }`}
      onDragOver={
        onDragOver
      }
      onDragLeave={
        onDragLeave
      }
      onDrop={
        onDrop
      }
    >
      <div className="seating-table-header">
        <div>
          <p className="card-eyebrow">
            Table
          </p>

          <h2>
            {table.name}
          </h2>
        </div>

        <div className="seating-table-actions">
          <button
            type="button"
            className="icon-button"
            onClick={
              onEdit
            }
            title="Edit table"
          >
            <Pencil
              size={15}
            />
          </button>

          <button
            type="button"
            className="icon-button"
            onClick={
              onClear
            }
            title="Clear table"
            disabled={
              guests.length ===
              0
            }
          >
            <X
              size={15}
            />
          </button>

          <button
            type="button"
            className="icon-button danger"
            onClick={
              onDelete
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
          {capacity} seats
        </span>

        <span
          className={
            full
              ? "capacity-full"
              : ""
          }
        >
          {full
            ? "Full"
            : `${remaining} open`}
        </span>
      </div>

      <div className="table-capacity-bar">
        <div
          style={{
            width: `${Math.min(
              100,
              capacity
                ? (
                    guests.length /
                    capacity
                  ) *
                  100
                : 0
            )}%`,
          }}
        />
      </div>

      {guests.length >
        0 && (
        <div className="table-rsvp-summary">
          <span>
            <i className="confirmed" />

            {confirmedAtTable} yes
          </span>

          <span>
            <i className="pending" />

            {pendingAtTable} pending
          </span>
        </div>
      )}

      <div className="table-guests">
        {guests.length ===
        0 ? (
          <div className="empty-table-drop">
            <Armchair
              size={24}
            />

            <span>
              Drop guests here
            </span>
          </div>
        ) : (
          [...guests]
            .sort(
              compareGuestOrder
            )
            .map(
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

/*
 * DRAGGABLE GUEST
 */

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
      className={`seating-guest ${
        compact
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
          {getGuestDisplayName(
            guest
          )}
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

/*
 * GROUP GUESTS BY HOUSEHOLD
 */

function groupGuests(
  guests
) {
  const groups =
    [];

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
            id:
              guest.householdId,

            name:
              guest.householdName ||
              "Family",

            householdName:
              guest.householdName ||
              "",

            guests:
              [],
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
        id:
          `guest-${guest.id}`,

        name:
          getGuestDisplayName(
            guest
          ),

        householdName:
          "",

        guests: [
          guest,
        ],
      });
    }
  );

  return groups;
}

/*
 * READ DRAG PAYLOAD
 */

function readDragPayload(
  event
) {
  try {
    const raw =
      event.dataTransfer.getData(
        "text/plain"
      );

    if (
      !raw
    ) {
      return null;
    }

    return JSON.parse(
      raw
    );
  } catch {
    return null;
  }
}

/*
 * NEXT TABLE ORDER
 */

function getNextTableOrder(
  tables
) {
  if (
    !tables.length
  ) {
    return 0;
  }

  return (
    Math.max(
      ...tables.map(
        (table) =>
          typeof table.order ===
          "number"
            ? table.order
            : 0
      )
    ) +
    1
  );
}

/*
 * GUEST SORT
 */

function compareGuestOrder(
  first,
  second
) {
  const firstOrder =
    typeof first.importOrder ===
    "number"
      ? first.importOrder
      : Number.MAX_SAFE_INTEGER;

  const secondOrder =
    typeof second.importOrder ===
    "number"
      ? second.importOrder
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

/*
 * DISPLAY HELPERS
 */

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

  return [
    guest.firstName,
    guest.lastName,
  ]
    .filter(
      Boolean
    )
    .join(
      " "
    )
    .trim();
}

function getInitials(
  guest
) {
  if (
    guest.isUnnamedGuest
  ) {
    return "+1";
  }

  const first =
    guest.firstName?.[
      0
    ] ||
    "";

  const last =
    guest.lastName?.[
      0
    ] ||
    "";

  return `${first}${last}`.toUpperCase();
}

export default SeatingChart;