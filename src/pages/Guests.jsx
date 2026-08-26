import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Check,
  ChevronDown,
  FileUp,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  UserRoundPlus,
  Users,
  X,
} from "lucide-react";

import Papa from "papaparse";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "../services/firebase";
import { WEDDING_ID } from "../config/wedding";
import { useAuth } from "../context/AuthContext";

const EXPECTED_HEADERS = [
  "Title",
  "First Name",
  "Last Name",
  "Suffix",
  "Rehearsal Dinner",
  "The Bergans Wedding",
  "Any song requests?",
  "Leave a note for the couple.",
];

const emptyGuest = {
  title: "",
  firstName: "",
  lastName: "",
  suffix: "",

  rsvpStatus: "pending",
  rehearsalStatus: "na",

  householdId: null,
  householdName: "",

  isUnnamedGuest: false,
  guestOfName: "",

  songRequest: "",
  notes: "",

  email: "",
  phone: "",

  tableId: null,

  importOrder: null,
  sourceKey: null,
  sourceType: "manual",
};

function Guests() {
  const { user } = useAuth();

  const fileInputRef = useRef(null);

  const [guests, setGuests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [
    rsvpFilter,
    setRsvpFilter,
  ] = useState("all");

  const [
    rehearsalFilter,
    setRehearsalFilter,
  ] = useState("all");

  const [
    showGuestModal,
    setShowGuestModal,
  ] = useState(false);

  const [
    showImportModal,
    setShowImportModal,
  ] = useState(false);

  const [
    editingGuestId,
    setEditingGuestId,
  ] = useState(null);

  const [
    guestForm,
    setGuestForm,
  ] = useState(emptyGuest);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    csvFileName,
    setCsvFileName,
  ] = useState("");

  const [
    csvRows,
    setCsvRows,
  ] = useState([]);

  const [
    parsedImportGuests,
    setParsedImportGuests,
  ] = useState([]);

  const [
    importing,
    setImporting,
  ] = useState(false);

  /*
   * FAMILY MANAGEMENT
   */

  const [
    managingFamilies,
    setManagingFamilies,
  ] = useState(false);

  const [
    hideAssignedGuests,
    setHideAssignedGuests,
  ] = useState(false);

  const [
    selectedGuestIds,
    setSelectedGuestIds,
  ] = useState([]);

  const [
    householdName,
    setHouseholdName,
  ] = useState("");

  const [
    householdNameWasEdited,
    setHouseholdNameWasEdited,
  ] = useState(false);

  const [
    selectedExistingHousehold,
    setSelectedExistingHousehold,
  ] = useState("");

  const [
    familyAction,
    setFamilyAction,
  ] = useState("new");

  const [
    savingFamily,
    setSavingFamily,
  ] = useState(false);

  /*
   * LOAD GUESTS
   */

  useEffect(() => {
    const guestsRef = collection(
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

          setGuests(
            [...data].sort(
              compareGuestOrder
            )
          );

          setLoading(false);
        },
        (firebaseError) => {
          console.error(
            "Error loading guests:",
            firebaseError
          );

          setError(
            "We couldn't load your guest list."
          );

          setLoading(false);
        }
      );

    return unsubscribe;
  }, []);

  /*
   * HOUSEHOLDS
   */

  const households =
    useMemo(() => {
      const householdMap =
        new Map();

      guests.forEach(
        (guest) => {
          if (
            !guest.householdId ||
            !guest.householdName
          ) {
            return;
          }

          if (
            !householdMap.has(
              guest.householdId
            )
          ) {
            householdMap.set(
              guest.householdId,
              {
                id:
                  guest.householdId,

                name:
                  guest.householdName,

                count: 0,
              }
            );
          }

          householdMap.get(
            guest.householdId
          ).count += 1;
        }
      );

      return Array.from(
        householdMap.values()
      ).sort((a, b) =>
        a.name.localeCompare(
          b.name
        )
      );
    }, [guests]);

  /*
   * SELECTED FAMILY MEMBERS
   */

  const selectedGuests =
    useMemo(() => {
      return guests.filter(
        (guest) =>
          selectedGuestIds.includes(
            guest.id
          )
      );
    }, [
      guests,
      selectedGuestIds,
    ]);

  const suggestedHouseholdName =
    useMemo(() => {
      return suggestHouseholdName(
        selectedGuests
      );
    }, [selectedGuests]);

  /*
   * AUTO-SUGGEST FAMILY NAME
   */

  useEffect(() => {
    if (
      !managingFamilies ||
      familyAction !== "new"
    ) {
      return;
    }

    if (
      selectedGuestIds.length ===
      0
    ) {
      if (
        !householdNameWasEdited
      ) {
        setHouseholdName("");
      }

      return;
    }

    if (
      !householdNameWasEdited
    ) {
      setHouseholdName(
        suggestedHouseholdName
      );
    }
  }, [
    selectedGuestIds,
    suggestedHouseholdName,
    managingFamilies,
    familyAction,
    householdNameWasEdited,
  ]);

  /*
   * FILTERS
   */

  const filteredGuests =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return guests.filter(
        (guest) => {
          const displayName =
            getGuestDisplayName(
              guest
            ).toLowerCase();

          const household = (
            guest.householdName ||
            ""
          ).toLowerCase();

          const guestOfName = (
            guest.guestOfName ||
            ""
          ).toLowerCase();

          const songRequest = (
            guest.songRequest ||
            ""
          ).toLowerCase();

          const notes = (
            guest.notes ||
            ""
          ).toLowerCase();

          const matchesSearch =
            !searchValue ||
            displayName.includes(
              searchValue
            ) ||
            household.includes(
              searchValue
            ) ||
            guestOfName.includes(
              searchValue
            ) ||
            songRequest.includes(
              searchValue
            ) ||
            notes.includes(
              searchValue
            );

          const matchesRsvp =
            rsvpFilter ===
            "all" ||
            guest.rsvpStatus ===
            rsvpFilter;

          const matchesRehearsal =
            rehearsalFilter ===
            "all" ||
            guest.rehearsalStatus ===
            rehearsalFilter;

          const matchesFamilyVisibility =
            !managingFamilies ||
            !hideAssignedGuests ||
            !guest.householdId;

          return (
            matchesSearch &&
            matchesRsvp &&
            matchesRehearsal &&
            matchesFamilyVisibility
          );
        }
      );
    }, [
      guests,
      search,
      rsvpFilter,
      rehearsalFilter,
      managingFamilies,
      hideAssignedGuests,
    ]);

  /*
   * STATS
   */

  const stats = useMemo(() => {
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
          !guest.rsvpStatus ||
          guest.rsvpStatus ===
          "pending"
      ).length;

    const rehearsalAttending =
      guests.filter(
        (guest) =>
          guest.rehearsalStatus ===
          "attending"
      ).length;

    return {
      total: guests.length,
      attending,
      declined,
      pending,
      rehearsalAttending,
    };
  }, [guests]);

  /*
   * CSV IMPORT PLAN
   */

  const importPlan =
    useMemo(() => {
      const existingLookup =
        buildExistingGuestLookup(
          guests
        );

      let updates = 0;
      let additions = 0;

      parsedImportGuests.forEach(
        (guest) => {
          if (
            existingLookup.has(
              guest.sourceKey
            )
          ) {
            updates += 1;
          } else {
            additions += 1;
          }
        }
      );

      return {
        updates,
        additions,
      };
    }, [
      guests,
      parsedImportGuests,
    ]);

  /*
   * MANUAL GUEST ADD / EDIT
   */

  const openAddGuest = () => {
    setEditingGuestId(null);

    setGuestForm({
      ...emptyGuest,
      sourceType: "manual",
      importOrder: null,
      sourceKey: null,
    });

    setError("");
    setShowGuestModal(true);
  };

  const openEditGuest = (
    guest
  ) => {
    setEditingGuestId(
      guest.id
    );

    setGuestForm({
      title:
        guest.title || "",

      firstName:
        guest.firstName || "",

      lastName:
        guest.lastName || "",

      suffix:
        guest.suffix || "",

      rsvpStatus:
        guest.rsvpStatus ||
        "pending",

      rehearsalStatus:
        guest.rehearsalStatus ||
        "na",

      householdId:
        guest.householdId ||
        null,

      householdName:
        guest.householdName ||
        "",

      isUnnamedGuest:
        guest.isUnnamedGuest ||
        false,

      guestOfName:
        guest.guestOfName ||
        "",

      songRequest:
        guest.songRequest ||
        "",

      notes:
        guest.notes || "",

      email:
        guest.email || "",

      phone:
        guest.phone || "",

      tableId:
        guest.tableId ||
        null,

      importOrder:
        typeof guest.importOrder ===
          "number"
          ? guest.importOrder
          : null,

      sourceKey:
        guest.sourceKey ||
        null,

      sourceType:
        guest.sourceType ||
        getGuestSourceType(
          guest
        ),
    });

    setError("");
    setShowGuestModal(true);
  };

  const closeGuestModal =
    () => {
      if (saving) {
        return;
      }

      setShowGuestModal(false);
      setEditingGuestId(null);
      setGuestForm(emptyGuest);
      setError("");
    };

  const handleGuestChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setGuestForm(
      (current) => ({
        ...current,

        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );
  };

  const handleSaveGuest =
    async (event) => {
      event.preventDefault();

      if (
        !guestForm.firstName.trim()
      ) {
        setError(
          "Please enter the guest's first name."
        );

        return;
      }

      setSaving(true);
      setError("");

      try {
        const guestData = {
          ...guestForm,

          title:
            guestForm.title.trim(),

          firstName:
            guestForm.firstName.trim(),

          lastName:
            guestForm.lastName.trim(),

          suffix:
            guestForm.suffix.trim(),

          householdName:
            guestForm.householdName.trim(),

          guestOfName:
            guestForm.guestOfName.trim(),

          songRequest:
            guestForm.songRequest.trim(),

          notes:
            guestForm.notes.trim(),

          updatedAt:
            serverTimestamp(),

          updatedBy:
            user?.uid || null,
        };

        if (
          editingGuestId
        ) {
          await updateDoc(
            doc(
              db,
              "weddings",
              WEDDING_ID,
              "guests",
              editingGuestId
            ),
            guestData
          );
        } else {
          await addDoc(
            collection(
              db,
              "weddings",
              WEDDING_ID,
              "guests"
            ),
            {
              ...guestData,

              sourceType:
                "manual",

              sourceKey: null,
              importOrder: null,

              tableId: null,

              createdAt:
                serverTimestamp(),

              createdBy:
                user?.uid ||
                null,

              createdByName:
                user?.displayName ||
                user?.email ||
                "",
            }
          );
        }

        setShowGuestModal(
          false
        );

        setEditingGuestId(
          null
        );

        setGuestForm(
          emptyGuest
        );
      } catch (firebaseError) {
        console.error(
          "Error saving guest:",
          firebaseError
        );

        setError(
          "We couldn't save this guest."
        );
      } finally {
        setSaving(false);
      }
    };

  const handleDeleteGuest =
    async (guestId) => {
      try {
        await deleteDoc(
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "guests",
            guestId
          )
        );

        setSelectedGuestIds(
          (current) =>
            current.filter(
              (id) =>
                id !== guestId
            )
        );
      } catch (firebaseError) {
        console.error(
          "Error deleting guest:",
          firebaseError
        );
      }
    };

  /*
   * CSV FILE SELECTION
   */

  const handleFileSelect = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setCsvFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,

      transformHeader:
        (header) =>
          header.trim(),

      complete: (results) => {
        const headers =
          results.meta.fields ||
          [];

        const rows =
          results.data || [];

        if (
          headers.length === 0 ||
          rows.length === 0
        ) {
          setError(
            "We couldn't find any guest data in that CSV."
          );

          return;
        }

        const missingHeaders =
          EXPECTED_HEADERS.filter(
            (header) =>
              !headers.includes(
                header
              )
          );

        if (
          missingHeaders.length >
          0
        ) {
          console.warn(
            "Missing expected CSV columns:",
            missingHeaders
          );
        }

        const parsedGuests =
          parseWeddingCsvRows(
            rows
          );

        if (
          parsedGuests.length ===
          0
        ) {
          setError(
            "We couldn't find any guests in that CSV."
          );

          return;
        }

        setCsvRows(rows);

        setParsedImportGuests(
          parsedGuests
        );

        setShowImportModal(
          true
        );
      },

      error: (parseError) => {
        console.error(
          "CSV parse error:",
          parseError
        );

        setError(
          "We couldn't read that CSV file."
        );
      },
    });

    event.target.value = "";
  };

  const closeImportModal =
    () => {
      if (importing) {
        return;
      }

      setShowImportModal(
        false
      );

      setCsvRows([]);

      setParsedImportGuests(
        []
      );

      setCsvFileName("");
      setError("");
    };

  /*
   * CSV IMPORT / SYNC
   */

  const handleImportGuests =
    async () => {
      if (
        parsedImportGuests.length ===
        0
      ) {
        setError(
          "There are no guests to import."
        );

        return;
      }

      setImporting(true);
      setError("");

      try {
        const existingLookup =
          buildExistingGuestLookup(
            guests
          );

        const operations =
          parsedImportGuests.map(
            (guest) => ({
              guest,

              existingGuest:
                existingLookup.get(
                  guest.sourceKey
                ) || null,
            })
          );

        const chunkSize = 400;

        for (
          let start = 0;
          start <
          operations.length;
          start += chunkSize
        ) {
          const chunk =
            operations.slice(
              start,
              start +
              chunkSize
            );

          const batch =
            writeBatch(db);

          chunk.forEach(
            ({
              guest,
              existingGuest,
            }) => {
              if (
                existingGuest
              ) {
                const guestRef =
                  doc(
                    db,
                    "weddings",
                    WEDDING_ID,
                    "guests",
                    existingGuest.id
                  );

                batch.update(
                  guestRef,
                  {
                    title:
                      guest.title,

                    firstName:
                      guest.firstName,

                    lastName:
                      guest.lastName,

                    suffix:
                      guest.suffix,

                    rsvpStatus:
                      guest.rsvpStatus,

                    rehearsalStatus:
                      guest.rehearsalStatus,

                    isUnnamedGuest:
                      guest.isUnnamedGuest,

                    guestOfName:
                      guest.guestOfName,

                    songRequest:
                      guest.songRequest,

                    notes:
                      guest.notes,

                    importOrder:
                      guest.importOrder,

                    sourceKey:
                      guest.sourceKey,

                    sourceType:
                      "csv",

                    importedFrom:
                      csvFileName,

                    updatedAt:
                      serverTimestamp(),

                    updatedBy:
                      user?.uid ||
                      null,
                  }
                );

                return;
              }

              const guestRef =
                doc(
                  collection(
                    db,
                    "weddings",
                    WEDDING_ID,
                    "guests"
                  )
                );

              batch.set(
                guestRef,
                {
                  ...guest,

                  householdId:
                    null,

                  householdName:
                    "",

                  tableId:
                    null,

                  email: "",
                  phone: "",

                  sourceType:
                    "csv",

                  createdAt:
                    serverTimestamp(),

                  updatedAt:
                    serverTimestamp(),

                  createdBy:
                    user?.uid ||
                    null,

                  createdByName:
                    user?.displayName ||
                    user?.email ||
                    "",

                  importedFrom:
                    csvFileName,
                }
              );
            }
          );

          await batch.commit();
        }

        setShowImportModal(
          false
        );

        setCsvRows([]);

        setParsedImportGuests(
          []
        );

        setCsvFileName("");
      } catch (firebaseError) {
        console.error(
          "Error importing guests:",
          firebaseError
        );

        setError(
          "We couldn't update the guest list."
        );
      } finally {
        setImporting(false);
      }
    };

  /*
   * FAMILY MANAGEMENT
   */

  const startFamilyManagement =
    () => {
      setManagingFamilies(
        true
      );

      setSelectedGuestIds(
        []
      );

      setHouseholdName("");

      setHouseholdNameWasEdited(
        false
      );

      setSelectedExistingHousehold(
        ""
      );

      setFamilyAction("new");

      setError("");
    };

  const stopFamilyManagement =
    () => {
      if (savingFamily) {
        return;
      }

      setManagingFamilies(
        false
      );

      setHideAssignedGuests(
        false
      );

      setSelectedGuestIds(
        []
      );

      setHouseholdName("");

      setHouseholdNameWasEdited(
        false
      );

      setSelectedExistingHousehold(
        ""
      );

      setFamilyAction("new");

      setError("");
    };

  const toggleGuestSelection = (
    guestId
  ) => {
    setSelectedGuestIds(
      (current) => {
        if (
          current.includes(
            guestId
          )
        ) {
          return current.filter(
            (id) =>
              id !== guestId
          );
        }

        return [
          ...current,
          guestId,
        ];
      }
    );

    setHouseholdNameWasEdited(
      false
    );
  };

  const toggleSelectAllVisible =
    () => {
      const visibleIds =
        filteredGuests.map(
          (guest) =>
            guest.id
        );

      const allSelected =
        visibleIds.length >
        0 &&
        visibleIds.every(
          (id) =>
            selectedGuestIds.includes(
              id
            )
        );

      if (allSelected) {
        setSelectedGuestIds(
          (current) =>
            current.filter(
              (id) =>
                !visibleIds.includes(
                  id
                )
            )
        );
      } else {
        setSelectedGuestIds(
          (current) =>
            Array.from(
              new Set([
                ...current,
                ...visibleIds,
              ])
            )
        );
      }

      setHouseholdNameWasEdited(
        false
      );
    };

  const selectHousehold = (
    householdId
  ) => {
    const householdGuestIds =
      guests
        .filter(
          (guest) =>
            guest.householdId ===
            householdId
        )
        .map(
          (guest) =>
            guest.id
        );

    setSelectedGuestIds(
      (current) =>
        Array.from(
          new Set([
            ...current,
            ...householdGuestIds,
          ])
        )
    );

    setHouseholdNameWasEdited(
      false
    );
  };

  const handleFamilyNameChange =
    (event) => {
      setHouseholdName(
        event.target.value
      );

      setHouseholdNameWasEdited(
        true
      );
    };

  const handleFamilyActionChange =
    (action) => {
      setFamilyAction(action);

      if (
        action === "new"
      ) {
        setHouseholdNameWasEdited(
          false
        );

        setHouseholdName(
          suggestedHouseholdName
        );
      }
    };

  const handleAssignFamily =
    async () => {
      if (
        selectedGuestIds.length ===
        0
      ) {
        setError(
          "Select at least one guest first."
        );

        return;
      }

      let targetHouseholdId =
        null;

      let targetHouseholdName =
        "";

      if (
        familyAction ===
        "new"
      ) {
        if (
          !householdName.trim()
        ) {
          setError(
            "Enter a family or household name."
          );

          return;
        }

        targetHouseholdId =
          generateHouseholdId();

        targetHouseholdName =
          householdName.trim();
      }

      if (
        familyAction ===
        "existing"
      ) {
        const existing =
          households.find(
            (household) =>
              household.id ===
              selectedExistingHousehold
          );

        if (!existing) {
          setError(
            "Choose an existing family."
          );

          return;
        }

        targetHouseholdId =
          existing.id;

        targetHouseholdName =
          existing.name;
      }

      setSavingFamily(true);
      setError("");

      try {
        const batch =
          writeBatch(db);

        selectedGuestIds.forEach(
          (guestId) => {
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
                householdId:
                  targetHouseholdId,

                householdName:
                  targetHouseholdName,

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

        setSelectedGuestIds(
          []
        );

        setHouseholdName("");

        setHouseholdNameWasEdited(
          false
        );

        setSelectedExistingHousehold(
          ""
        );
      } catch (firebaseError) {
        console.error(
          "Error assigning household:",
          firebaseError
        );

        setError(
          "We couldn't update those guests."
        );
      } finally {
        setSavingFamily(false);
      }
    };

  const handleRemoveFromFamily =
    async () => {
      if (
        selectedGuestIds.length ===
        0
      ) {
        setError(
          "Select at least one guest first."
        );

        return;
      }

      setSavingFamily(true);
      setError("");

      try {
        const batch =
          writeBatch(db);

        selectedGuestIds.forEach(
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
                householdId:
                  null,

                householdName:
                  "",

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

        setSelectedGuestIds(
          []
        );

        setHouseholdName("");

        setHouseholdNameWasEdited(
          false
        );
      } catch (firebaseError) {
        console.error(
          "Error removing family:",
          firebaseError
        );

        setError(
          "We couldn't remove those guests from their family."
        );
      } finally {
        setSavingFamily(false);
      }
    };

  return (
    <div className="page guests-page">
      <div className="guests-page-header">
        <div>
          <p className="page-eyebrow">
            Guests
          </p>

          <h1>Guest List</h1>

          <p className="page-description">
            Manage wedding and rehearsal RSVPs,
            families, song requests, notes, and seating.
          </p>
        </div>

        <div className="guests-header-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={
              handleFileSelect
            }
            hidden
          />

          {!managingFamilies && (
            <>
              <button
                className="secondary-button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                <FileUp
                  size={17}
                />

                Import / Update CSV
              </button>

              <button
                className="secondary-button"
                onClick={
                  startFamilyManagement
                }
              >
                <Users
                  size={17}
                />

                Manage Families
              </button>

              <button
                className="primary-button"
                onClick={
                  openAddGuest
                }
              >
                <Plus
                  size={17}
                />

                Add Guest
              </button>
            </>
          )}

          {managingFamilies && (
            <button
              className="secondary-button"
              onClick={
                stopFamilyManagement
              }
            >
              <X size={17} />
              Done Managing
            </button>
          )}
        </div>
      </div>

      <section className="guest-stats-grid">
        <GuestStat
          label="Total Guests"
          value={stats.total}
        />

        <GuestStat
          label="Wedding Attending"
          value={
            stats.attending
          }
          type="attending"
        />

        <GuestStat
          label="Awaiting RSVP"
          value={stats.pending}
          type="pending"
        />

        <GuestStat
          label="Declined"
          value={stats.declined}
          type="declined"
        />
      </section>

      <section className="guest-secondary-stat">
        <strong>
          {
            stats.rehearsalAttending
          }
        </strong>

        <span>
          attending rehearsal
          dinner
        </span>
      </section>

      {managingFamilies && (
        <section className="family-manager">
          <div className="family-manager-heading">
            <div>
              <p className="card-eyebrow">
                Family Management
              </p>

              <h2>
                Group guests into
                families
              </h2>

              <p>
                Select guests below,
                then create a family or
                add them to an existing
                one. Their original
                RSVP-list order will
                stay exactly the same.
              </p>
            </div>

            <div className="family-selection-count">
              <strong>
                {
                  selectedGuestIds.length
                }
              </strong>

              <span>
                selected
              </span>
            </div>
          </div>

          <label className="family-visibility-toggle">
            <input
              type="checkbox"
              checked={
                hideAssignedGuests
              }
              onChange={(event) =>
                setHideAssignedGuests(
                  event.target.checked
                )
              }
            />

            <div>
              <strong>
                Hide guests already assigned
              </strong>

              <span>
                Only show guests who still need to be placed
                into a family.
              </span>
            </div>
          </label>

          {households.length >
            0 && (
              <div className="family-existing-list">
                <span>
                  Existing families
                </span>

                <div>
                  {households.map(
                    (household) => (
                      <button
                        key={
                          household.id
                        }
                        type="button"
                        onClick={() =>
                          selectHousehold(
                            household.id
                          )
                        }
                      >
                        {
                          household.name
                        }

                        <small>
                          {
                            household.count
                          }
                        </small>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

          <div className="family-action-tabs">
            <button
              type="button"
              className={
                familyAction ===
                  "new"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleFamilyActionChange(
                  "new"
                )
              }
            >
              New Family
            </button>

            <button
              type="button"
              className={
                familyAction ===
                  "existing"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleFamilyActionChange(
                  "existing"
                )
              }
            >
              Existing Family
            </button>
          </div>

          <div className="family-manager-actions">
            {familyAction ===
              "new" ? (
              <label className="family-name-input">
                <span>
                  Family / Household Name
                </span>

                <input
                  type="text"
                  value={
                    householdName
                  }
                  onChange={
                    handleFamilyNameChange
                  }
                  placeholder="Select guests for a suggestion"
                />

                {suggestedHouseholdName && (
                  <small className="family-name-suggestion">
                    Suggested from selected guests
                  </small>
                )}
              </label>
            ) : (
              <label className="family-name-input">
                <span>
                  Existing Family
                </span>

                <select
                  value={
                    selectedExistingHousehold
                  }
                  onChange={(event) =>
                    setSelectedExistingHousehold(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Choose a family
                  </option>

                  {households.map(
                    (household) => (
                      <option
                        key={
                          household.id
                        }
                        value={
                          household.id
                        }
                      >
                        {
                          household.name
                        }
                      </option>
                    )
                  )}
                </select>
              </label>
            )}

            <button
              className="primary-button"
              onClick={
                handleAssignFamily
              }
              disabled={
                savingFamily ||
                selectedGuestIds.length ===
                0
              }
            >
              {savingFamily ? (
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
                  Assign Family
                </>
              )}
            </button>

            <button
              className="remove-family-button"
              onClick={
                handleRemoveFromFamily
              }
              disabled={
                savingFamily ||
                selectedGuestIds.length ===
                0
              }
            >
              <X size={16} />
              Remove from Family
            </button>
          </div>
        </section>
      )}

      <section className="guest-toolbar">
        <div className="guest-search">
          <Search size={17} />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search guests, families, song requests, or notes..."
          />
        </div>

        <div className="guest-toolbar-filters">
          <div className="select-wrap">
            <select
              value={rsvpFilter}
              onChange={(event) =>
                setRsvpFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All Wedding RSVPs
              </option>

              <option value="attending">
                Attending
              </option>

              <option value="pending">
                Awaiting RSVP
              </option>

              <option value="declined">
                Declined
              </option>
            </select>

            <ChevronDown
              size={15}
            />
          </div>

          <div className="select-wrap">
            <select
              value={
                rehearsalFilter
              }
              onChange={(event) =>
                setRehearsalFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All Rehearsal RSVPs
              </option>

              <option value="attending">
                Rehearsal: Yes
              </option>

              <option value="pending">
                Rehearsal: Pending
              </option>

              <option value="declined">
                Rehearsal: No
              </option>

              <option value="na">
                Rehearsal: N/A
              </option>
            </select>

            <ChevronDown
              size={15}
            />
          </div>
        </div>
      </section>

      {error &&
        !showGuestModal &&
        !showImportModal && (
          <div className="auth-error guest-page-error">
            {error}
          </div>
        )}

      {loading ? (
        <div className="content-card guest-loading">
          <LoaderCircle
            size={25}
            className="spinner"
          />

          <p>
            Loading guests...
          </p>
        </div>
      ) : guests.length === 0 ? (
        <div className="content-card guest-empty-state">
          <Users
            size={38}
            strokeWidth={1.3}
          />

          <h2>
            Your guest list is empty
          </h2>

          <p>
            Import your RSVP CSV or add guests manually.
          </p>

          <div className="guest-empty-actions">
            <button
              className="secondary-button"
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              <Upload
                size={17}
              />
              Import CSV
            </button>

            <button
              className="primary-button"
              onClick={
                openAddGuest
              }
            >
              <UserRoundPlus
                size={17}
              />
              Add Guest
            </button>
          </div>
        </div>
      ) : filteredGuests.length ===
        0 ? (
        <div className="content-card guest-empty-state compact">
          <Search
            size={30}
            strokeWidth={1.3}
          />

          <h2>
            No matching guests
          </h2>

          <p>
            {managingFamilies &&
              hideAssignedGuests
              ? "Everyone shown by your current filters has already been assigned to a family."
              : "Try changing your search or filters."}
          </p>
        </div>
      ) : (
        <div className="guest-table-wrap">
          <table className="guest-table">
            <thead>
              <tr>
                {managingFamilies && (
                  <th className="guest-checkbox-column">
                    <input
                      type="checkbox"
                      checked={
                        filteredGuests.length >
                        0 &&
                        filteredGuests.every(
                          (guest) =>
                            selectedGuestIds.includes(
                              guest.id
                            )
                        )
                      }
                      onChange={
                        toggleSelectAllVisible
                      }
                      aria-label="Select all visible guests"
                    />
                  </th>
                )}

                <th>Guest</th>
                <th>Family</th>
                <th>
                  Wedding RSVP
                </th>
                <th>
                  Rehearsal
                </th>
                <th>
                  Guest Of
                </th>
                <th>
                  Song Request
                </th>
                <th>Note</th>

                {!managingFamilies && (
                  <th />
                )}
              </tr>
            </thead>

            <tbody>
              {filteredGuests.map(
                (guest) => {
                  const selected =
                    selectedGuestIds.includes(
                      guest.id
                    );

                  return (
                    <tr
                      key={
                        guest.id
                      }
                      className={
                        selected
                          ? "guest-row-selected"
                          : ""
                      }
                    >
                      {managingFamilies && (
                        <td className="guest-checkbox-column">
                          <input
                            type="checkbox"
                            checked={
                              selected
                            }
                            onChange={() =>
                              toggleGuestSelection(
                                guest.id
                              )
                            }
                            aria-label={`Select ${getGuestDisplayName(
                              guest
                            )}`}
                          />
                        </td>
                      )}

                      <td>
                        <div className="guest-name-cell">
                          <div className="guest-avatar">
                            {getInitials(
                              guest
                            )}
                          </div>

                          <div>
                            <strong>
                              {getGuestDisplayName(
                                guest
                              )}
                            </strong>

                            {guest.isUnnamedGuest && (
                              <span className="unnamed-guest-label">
                                Unnamed guest
                              </span>
                            )}

                            <span className="guest-import-order">
                              {getGuestOrderLabel(
                                guest
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="guest-rsvp-cell">
                        <span className="guest-mobile-field-label">
                          Family
                        </span>

                        {guest.householdName ? (
                          <span className="family-badge">
                            {
                              guest.householdName
                            }
                          </span>
                        ) : (
                          <span className="no-family-label">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="guest-rsvp-cell">
                        <span className="guest-mobile-field-label">
                          Wedding
                        </span>

                        <RsvpBadge
                          status={
                            guest.rsvpStatus
                          }
                        />
                      </td>

                      <td className="guest-rsvp-cell">
                        <span className="guest-mobile-field-label">
                          Rehearsal
                        </span>

                        <RsvpBadge
                          status={
                            guest.rehearsalStatus
                          }
                          compact
                        />
                      </td>

                      <td>
                        {guest.guestOfName ||
                          "—"}
                      </td>

                      <td>
                        <div className="guest-long-text">
                          {guest.songRequest ||
                            "—"}
                        </div>
                      </td>

                      <td>
                        <div className="guest-long-text">
                          {guest.notes ||
                            "—"}
                        </div>
                      </td>

                      {!managingFamilies && (
                        <td>
                          <div className="guest-actions">
                            <button
                              className="icon-button"
                              title="Edit guest"
                              onClick={() =>
                                openEditGuest(
                                  guest
                                )
                              }
                            >
                              <Pencil
                                size={16}
                              />
                            </button>

                            <button
                              className="icon-button danger"
                              title="Delete guest"
                              onClick={() =>
                                handleDeleteGuest(
                                  guest.id
                                )
                              }
                            >
                              <Trash2
                                size={16}
                              />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}

      {showGuestModal && (
        <div
          className="modal-backdrop"
          onMouseDown={
            closeGuestModal
          }
        >
          <div
            className="task-modal guest-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="task-modal-header">
              <div>
                <p className="card-eyebrow">
                  {editingGuestId
                    ? "Edit"
                    : "New Guest"}
                </p>

                <h2>
                  {editingGuestId
                    ? "Edit Guest"
                    : "Add Guest"}
                </h2>
              </div>

              <button
                className="icon-button"
                onClick={
                  closeGuestModal
                }
                disabled={saving}
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="task-form"
              onSubmit={
                handleSaveGuest
              }
            >
              <div className="form-grid">
                <label className="form-field">
                  <span>Title</span>

                  <input
                    type="text"
                    name="title"
                    value={
                      guestForm.title
                    }
                    onChange={
                      handleGuestChange
                    }
                    placeholder="Mr."
                  />
                </label>

                <label className="form-field">
                  <span>
                    First name
                  </span>

                  <input
                    type="text"
                    name="firstName"
                    value={
                      guestForm.firstName
                    }
                    onChange={
                      handleGuestChange
                    }
                    autoFocus
                  />
                </label>

                <label className="form-field">
                  <span>
                    Last name
                  </span>

                  <input
                    type="text"
                    name="lastName"
                    value={
                      guestForm.lastName
                    }
                    onChange={
                      handleGuestChange
                    }
                  />
                </label>

                <label className="form-field">
                  <span>Suffix</span>

                  <input
                    type="text"
                    name="suffix"
                    value={
                      guestForm.suffix
                    }
                    onChange={
                      handleGuestChange
                    }
                    placeholder="Jr."
                  />
                </label>

                <label className="form-field">
                  <span>
                    Wedding RSVP
                  </span>

                  <select
                    name="rsvpStatus"
                    value={
                      guestForm.rsvpStatus
                    }
                    onChange={
                      handleGuestChange
                    }
                  >
                    <option value="pending">
                      Awaiting RSVP
                    </option>

                    <option value="attending">
                      Attending
                    </option>

                    <option value="declined">
                      Declined
                    </option>
                  </select>
                </label>

                <label className="form-field">
                  <span>
                    Rehearsal Dinner
                  </span>

                  <select
                    name="rehearsalStatus"
                    value={
                      guestForm.rehearsalStatus
                    }
                    onChange={
                      handleGuestChange
                    }
                  >
                    <option value="na">
                      N/A / Not Invited
                    </option>

                    <option value="pending">
                      Awaiting RSVP
                    </option>

                    <option value="attending">
                      Attending
                    </option>

                    <option value="declined">
                      Declined
                    </option>
                  </select>
                </label>

                <label className="form-field">
                  <span>
                    Family / Household
                  </span>

                  <input
                    type="text"
                    name="householdName"
                    value={
                      guestForm.householdName
                    }
                    onChange={
                      handleGuestChange
                    }
                    placeholder="Usually managed from Manage Families"
                  />
                </label>

                <label className="form-field">
                  <span>
                    Guest of
                  </span>

                  <input
                    type="text"
                    name="guestOfName"
                    value={
                      guestForm.guestOfName
                    }
                    onChange={
                      handleGuestChange
                    }
                    placeholder="John Smith"
                  />
                </label>
              </div>

              <label className="guest-checkbox-field">
                <input
                  type="checkbox"
                  name="isUnnamedGuest"
                  checked={
                    guestForm.isUnnamedGuest
                  }
                  onChange={
                    handleGuestChange
                  }
                />

                <div>
                  <strong>
                    Unnamed guest
                  </strong>

                  <span>
                    Use this for a plus-one whose name is not
                    known yet.
                  </span>
                </div>
              </label>

              <label className="form-field">
                <span>
                  Song request
                </span>

                <input
                  type="text"
                  name="songRequest"
                  value={
                    guestForm.songRequest
                  }
                  onChange={
                    handleGuestChange
                  }
                />
              </label>

              <label className="form-field">
                <span>
                  Note from guest
                </span>

                <textarea
                  name="notes"
                  value={
                    guestForm.notes
                  }
                  onChange={
                    handleGuestChange
                  }
                  rows="4"
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
                    closeGuestModal
                  }
                  disabled={saving}
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
                      <Check
                        size={17}
                      />

                      {editingGuestId
                        ? "Save Changes"
                        : "Add Guest"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div
          className="modal-backdrop"
          onMouseDown={
            closeImportModal
          }
        >
          <div
            className="csv-import-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="task-modal-header">
              <div>
                <p className="card-eyebrow">
                  RSVP Sync
                </p>

                <h2>
                  Import / Update Guest List
                </h2>

                <p className="csv-file-name">
                  {csvFileName}
                </p>
              </div>

              <button
                className="icon-button"
                onClick={
                  closeImportModal
                }
                disabled={
                  importing
                }
              >
                <X size={19} />
              </button>
            </div>

            <div className="csv-import-intro">
              <p>
                We found{" "}
                <strong>
                  {
                    parsedImportGuests.length
                  }
                </strong>{" "}
                guests in{" "}
                <strong>
                  {csvRows.length}
                </strong>{" "}
                CSV rows.
              </p>

              <p>
                <strong>
                  {
                    importPlan.updates
                  }
                </strong>{" "}
                existing guests will be updated and{" "}
                <strong>
                  {
                    importPlan.additions
                  }
                </strong>{" "}
                new guests will be added.
              </p>

              <p>
                Family assignments and seating assignments will
                not be overwritten.
              </p>

              <p>
                The displayed RSVP-list order will be updated to
                match this file exactly.
              </p>
            </div>

            <div className="csv-sync-summary">
              <div>
                <strong>
                  {
                    importPlan.updates
                  }
                </strong>

                <span>
                  Updates
                </span>
              </div>

              <div>
                <strong>
                  {
                    importPlan.additions
                  }
                </strong>

                <span>
                  New Guests
                </span>
              </div>

              <div>
                <strong>
                  {
                    parsedImportGuests.length
                  }
                </strong>

                <span>
                  Total Rows
                </span>
              </div>
            </div>

            <div className="csv-preview-section">
              <div className="csv-preview-heading">
                <div>
                  <p className="card-eyebrow">
                    Preview
                  </p>

                  <h3>
                    First{" "}
                    {Math.min(
                      10,
                      parsedImportGuests.length
                    )}{" "}
                    guests
                  </h3>
                </div>
              </div>

              <div className="csv-preview-wrap">
                <table className="csv-preview-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Guest</th>
                      <th>
                        Wedding
                      </th>
                      <th>
                        Rehearsal
                      </th>
                      <th>
                        Guest Of
                      </th>
                      <th>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {parsedImportGuests
                      .slice(0, 10)
                      .map(
                        (guest) => {
                          const lookup =
                            buildExistingGuestLookup(
                              guests
                            );

                          const willUpdate =
                            lookup.has(
                              guest.sourceKey
                            );

                          return (
                            <tr
                              key={
                                guest.sourceKey
                              }
                            >
                              <td>
                                {guest.importOrder +
                                  1}
                              </td>

                              <td>
                                {getGuestDisplayName(
                                  guest
                                )}
                              </td>

                              <td>
                                <RsvpBadge
                                  status={
                                    guest.rsvpStatus
                                  }
                                />
                              </td>

                              <td>
                                <RsvpBadge
                                  status={
                                    guest.rehearsalStatus
                                  }
                                  compact
                                />
                              </td>

                              <td>
                                {guest.guestOfName ||
                                  "—"}
                              </td>

                              <td>
                                <span
                                  className={`csv-action-badge ${willUpdate
                                      ? "update"
                                      : "new"
                                    }`}
                                >
                                  {willUpdate
                                    ? "Update"
                                    : "New"}
                                </span>
                              </td>
                            </tr>
                          );
                        }
                      )}
                  </tbody>
                </table>
              </div>
            </div>

            {error && (
              <div className="auth-error csv-import-error">
                {error}
              </div>
            )}

            <div className="csv-import-actions">
              <button
                className="secondary-button"
                onClick={
                  closeImportModal
                }
                disabled={
                  importing
                }
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={
                  handleImportGuests
                }
                disabled={
                  importing
                }
              >
                {importing ? (
                  <>
                    <LoaderCircle
                      size={17}
                      className="spinner"
                    />
                    Updating...
                  </>
                ) : (
                  <>
                    <Upload
                      size={17}
                    />

                    Sync{" "}
                    {
                      parsedImportGuests.length
                    }{" "}
                    Guests
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/*
 * CSV PARSER
 */

function parseWeddingCsvRows(
  rows
) {
  const guests = [];

  let previousNamedGuest =
    null;

  let previousNamedSourceKey =
    null;

  let unnamedGuestNumber = 0;

  const personOccurrenceCounts =
    new Map();

  rows.forEach(
    (row, rowIndex) => {
      const firstName =
        cleanCsvValue(
          row["First Name"]
        );

      const lastName =
        cleanCsvValue(
          row["Last Name"]
        );

      if (
        !firstName &&
        !lastName
      ) {
        return;
      }

      const isUnnamedGuest =
        firstName
          .trim()
          .toLowerCase() ===
        "guest";

      const weddingStatus =
        normalizeRsvpStatus(
          row[
          "The Bergans Wedding"
          ]
        );

      const rehearsalStatus =
        normalizeRehearsalStatus(
          row[
          "Rehearsal Dinner"
          ]
        );

      const importOrder =
        rowIndex;

      if (isUnnamedGuest) {
        unnamedGuestNumber += 1;

        const guestOfName =
          previousNamedGuest
            ? getGuestDisplayName(
              previousNamedGuest,
              false
            )
            : "";

        const sourceKey =
          previousNamedSourceKey
            ? `guest:${previousNamedSourceKey}:${unnamedGuestNumber}`
            : `guest:unmatched:${rowIndex}`;

        guests.push({
          title: "",
          firstName: "Guest",
          lastName: "",
          suffix: "",

          rsvpStatus:
            weddingStatus,

          rehearsalStatus,

          householdId:
            null,

          householdName:
            "",

          isUnnamedGuest:
            true,

          guestOfName,

          songRequest:
            cleanCsvValue(
              row[
              "Any song requests?"
              ]
            ),

          notes:
            cleanCsvValue(
              row[
              "Leave a note for the couple."
              ]
            ),

          email: "",
          phone: "",

          tableId:
            null,

          importOrder,

          sourceKey,

          sourceType:
            "csv",
        });

        return;
      }

      unnamedGuestNumber = 0;

      const suffix =
        cleanCsvValue(
          row["Suffix"]
        );

      const personBaseKey =
        buildPersonBaseKey({
          firstName,
          lastName,
          suffix,
        });

      const occurrence =
        (personOccurrenceCounts.get(
          personBaseKey
        ) || 0) + 1;

      personOccurrenceCounts.set(
        personBaseKey,
        occurrence
      );

      const sourceKey =
        `person:${personBaseKey}:${occurrence}`;

      const guest = {
        title:
          cleanCsvValue(
            row["Title"]
          ),

        firstName,
        lastName,
        suffix,

        rsvpStatus:
          weddingStatus,

        rehearsalStatus,

        householdId:
          null,

        householdName:
          "",

        isUnnamedGuest:
          false,

        guestOfName:
          "",

        songRequest:
          cleanCsvValue(
            row[
            "Any song requests?"
            ]
          ),

        notes:
          cleanCsvValue(
            row[
            "Leave a note for the couple."
            ]
          ),

        email: "",
        phone: "",

        tableId:
          null,

        importOrder,

        sourceKey,

        sourceType:
          "csv",
      };

      guests.push(guest);

      previousNamedGuest =
        guest;

      previousNamedSourceKey =
        sourceKey;
    }
  );

  return guests;
}

/*
 * DUPLICATE / UPDATE LOOKUP
 */

function buildExistingGuestLookup(
  guests
) {
  const lookup =
    new Map();

  const importedGuests =
    [...guests]
      .filter(
        (guest) =>
          guest.sourceKey ||
          guest.sourceType ===
          "csv" ||
          guest.importedFrom
      )
      .sort(
        compareGuestOrder
      );

  const personOccurrenceCounts =
    new Map();

  let previousNamedSourceKey =
    null;

  let unnamedGuestNumber = 0;

  importedGuests.forEach(
    (guest) => {
      if (
        guest.sourceKey
      ) {
        lookup.set(
          guest.sourceKey,
          guest
        );

        if (
          !guest.isUnnamedGuest
        ) {
          previousNamedSourceKey =
            guest.sourceKey;

          unnamedGuestNumber =
            0;

          const baseKey =
            buildPersonBaseKey(
              guest
            );

          const current =
            personOccurrenceCounts.get(
              baseKey
            ) || 0;

          personOccurrenceCounts.set(
            baseKey,
            current + 1
          );
        } else {
          unnamedGuestNumber +=
            1;
        }

        return;
      }

      if (
        guest.isUnnamedGuest
      ) {
        unnamedGuestNumber +=
          1;

        const sourceKey =
          previousNamedSourceKey
            ? `guest:${previousNamedSourceKey}:${unnamedGuestNumber}`
            : `guest:legacy:${guest.id}`;

        lookup.set(
          sourceKey,
          guest
        );

        return;
      }

      unnamedGuestNumber = 0;

      const baseKey =
        buildPersonBaseKey(
          guest
        );

      const occurrence =
        (personOccurrenceCounts.get(
          baseKey
        ) || 0) + 1;

      personOccurrenceCounts.set(
        baseKey,
        occurrence
      );

      const sourceKey =
        `person:${baseKey}:${occurrence}`;

      previousNamedSourceKey =
        sourceKey;

      lookup.set(
        sourceKey,
        guest
      );
    }
  );

  return lookup;
}

/*
 * FAMILY NAME SUGGESTION
 */

function suggestHouseholdName(
  selectedGuests
) {
  const namedGuests =
    selectedGuests.filter(
      (guest) =>
        !guest.isUnnamedGuest &&
        guest.firstName
    );

  if (
    namedGuests.length === 0
  ) {
    return "";
  }

  /*
   * One person:
   *
   * Maddie McGovern
   */
  if (
    namedGuests.length === 1
  ) {
    const guest =
      namedGuests[0];

    return [
      guest.firstName,
      guest.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  /*
   * Two people
   */
  if (
    namedGuests.length === 2
  ) {
    const [
      firstGuest,
      secondGuest,
    ] = namedGuests;

    const firstFirstName =
      firstGuest.firstName ||
      "";

    const secondFirstName =
      secondGuest.firstName ||
      "";

    const firstLastName =
      firstGuest.lastName ||
      "";

    const secondLastName =
      secondGuest.lastName ||
      "";

    const sameLastName =
      firstLastName &&
      secondLastName &&
      firstLastName.toLowerCase() ===
      secondLastName.toLowerCase();

    /*
     * Maddie & Nick Bergan
     */
    if (sameLastName) {
      return `${firstFirstName} & ${secondFirstName} ${firstLastName}`;
    }

    /*
     * Maddie McGovern & Nick Bergan
     */
    const firstName =
      `${firstFirstName} ${firstLastName}`.trim();

    const secondName =
      `${secondFirstName} ${secondLastName}`.trim();

    return `${firstName} & ${secondName}`;
  }

  /*
   * 3+ people:
   *
   * Bergan Family
   */

  const firstGuest =
    namedGuests[0];

  if (
    firstGuest.lastName
  ) {
    return `${firstGuest.lastName} Family`;
  }

  return `${firstGuest.firstName} Family`;
}

/*
 * HELPERS
 */

function buildPersonBaseKey({
  firstName,
  lastName,
  suffix,
}) {
  return [
    firstName,
    lastName,
    suffix,
  ]
    .map((value) =>
      normalizeKeyPart(
        value
      )
    )
    .filter(Boolean)
    .join("-");
}

function normalizeKeyPart(
  value
) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function compareGuestOrder(
  first,
  second
) {
  const firstIsCsv =
    getGuestSourceType(
      first
    ) === "csv";

  const secondIsCsv =
    getGuestSourceType(
      second
    ) === "csv";

  if (
    firstIsCsv &&
    !secondIsCsv
  ) {
    return -1;
  }

  if (
    !firstIsCsv &&
    secondIsCsv
  ) {
    return 1;
  }

  if (
    firstIsCsv &&
    secondIsCsv
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
  }

  return getGuestDisplayName(
    first
  ).localeCompare(
    getGuestDisplayName(
      second
    )
  );
}

function getGuestSourceType(
  guest
) {
  if (
    guest.sourceType
  ) {
    return guest.sourceType;
  }

  if (
    guest.sourceKey ||
    guest.importedFrom
  ) {
    return "csv";
  }

  return "manual";
}

function getGuestOrderLabel(
  guest
) {
  if (
    getGuestSourceType(
      guest
    ) !== "csv"
  ) {
    return "Manual entry";
  }

  if (
    typeof guest.importOrder !==
    "number"
  ) {
    return "RSVP list";
  }

  return `RSVP list #${guest.importOrder + 1
    }`;
}

function generateHouseholdId() {
  if (
    typeof crypto !==
    "undefined" &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID();
  }

  return `household-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function normalizeRsvpStatus(
  value
) {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase();

  if (!normalized) {
    return "pending";
  }

  if (
    [
      "yes",
      "y",
      "attending",
      "accept",
      "accepted",
      "coming",
      "true",
    ].includes(normalized)
  ) {
    return "attending";
  }

  if (
    [
      "no",
      "n",
      "declined",
      "decline",
      "not attending",
      "not coming",
      "false",
    ].includes(normalized)
  ) {
    return "declined";
  }

  if (
    normalized.includes(
      "accept"
    ) ||
    normalized.includes(
      "attend"
    )
  ) {
    if (
      normalized.includes(
        "not"
      ) ||
      normalized.includes(
        "declin"
      )
    ) {
      return "declined";
    }

    return "attending";
  }

  if (
    normalized.includes(
      "declin"
    )
  ) {
    return "declined";
  }

  return "pending";
}

function normalizeRehearsalStatus(
  value
) {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase();

  /*
   * Blank means they were not
   * invited to rehearsal dinner.
   */
  if (!normalized) {
    return "na";
  }

  if (
    [
      "n/a",
      "na",
      "not applicable",
      "not invited",
    ].includes(normalized)
  ) {
    return "na";
  }

  if (
    [
      "yes",
      "y",
      "attending",
      "accept",
      "accepted",
      "coming",
      "true",
    ].includes(normalized)
  ) {
    return "attending";
  }

  if (
    [
      "no",
      "n",
      "declined",
      "decline",
      "not attending",
      "not coming",
      "false",
    ].includes(normalized)
  ) {
    return "declined";
  }

  if (
    [
      "pending",
      "no response",
      "awaiting response",
      "awaiting rsvp",
    ].includes(normalized)
  ) {
    return "pending";
  }

  return "pending";
}

function cleanCsvValue(
  value
) {
  return String(
    value ?? ""
  ).trim();
}

function getGuestDisplayName(
  guest,
  showGuestRelationship = true
) {
  if (
    guest.isUnnamedGuest
  ) {
    if (
      showGuestRelationship &&
      guest.guestOfName
    ) {
      return `Guest of ${guest.guestOfName}`;
    }

    return "Guest";
  }

  return [
    guest.title,
    guest.firstName,
    guest.lastName,
    guest.suffix,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function GuestStat({
  label,
  value,
  type = "",
}) {
  return (
    <div
      className={`guest-stat-card ${type
          ? `guest-stat-${type}`
          : ""
        }`}
    >
      <p>{label}</p>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function RsvpBadge({
  status,
  compact = false,
}) {
  const normalized =
    status === "na"
      ? "na"
      : normalizeRsvpStatus(
        status
      );

  const labels = compact
    ? {
      attending: "Yes",
      pending: "Pending",
      declined: "No",
      na: "N/A",
    }
    : {
      attending:
        "Attending",

      pending:
        "Awaiting RSVP",

      declined:
        "Declined",

      na:
        "N/A",
    };

  return (
    <span
      className={`rsvp-badge rsvp-${normalized}`}
    >
      {
        labels[
        normalized
        ]
      }
    </span>
  );
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
    guest.firstName?.[0] ||
    "";

  const last =
    guest.lastName?.[0] ||
    "";

  return `${first}${last}`.toUpperCase();
}

export default Guests;