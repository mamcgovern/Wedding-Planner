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

import {
  NavLink,
} from "react-router-dom";

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

import {
  db,
} from "../../services/firebase";

import {
  WEDDING_ID,
} from "../../config/wedding";

import {
  useAuth,
} from "../../context/AuthContext";

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
  const {
    user,
  } = useAuth();

  const fileInputRef =
    useRef(null);

  const [
    guests,
    setGuests,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    search,
    setSearch,
  ] = useState("");

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
  ] = useState(
    emptyGuest
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /*
   * CSV IMPORT
   */

  const [
    csvFileName,
    setCsvFileName,
  ] = useState("");

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
    familyAction,
    setFamilyAction,
  ] = useState("new");

  const [
    selectedExistingHousehold,
    setSelectedExistingHousehold,
  ] = useState("");

  const [
    savingFamily,
    setSavingFamily,
  ] = useState(false);

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
              (guestDocument) => ({
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

          setLoading(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading guests:",
            firebaseError
          );

          setError(
            "We couldn't load your guest list."
          );

          setLoading(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  /*
   * HOUSEHOLDS
   */

  const households =
    useMemo(
      () => {
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

                  count:
                    0,
                }
              );
            }

            householdMap.get(
              guest.householdId
            ).count +=
              1;
          }
        );

        return Array.from(
          householdMap.values()
        ).sort(
          (first, second) =>
            first.name.localeCompare(
              second.name
            )
        );
      },
      [
        guests,
      ]
    );

  /*
   * SELECTED FAMILY MEMBERS
   */

  const selectedGuests =
    useMemo(
      () =>
        guests.filter(
          (guest) =>
            selectedGuestIds.includes(
              guest.id
            )
        ),
      [
        guests,
        selectedGuestIds,
      ]
    );

  const suggestedHouseholdName =
    useMemo(
      () =>
        suggestHouseholdName(
          selectedGuests
        ),
      [
        selectedGuests,
      ]
    );

  useEffect(() => {
    if (
      !managingFamilies ||
      familyAction !==
        "new"
    ) {
      return;
    }

    if (
      householdNameWasEdited
    ) {
      return;
    }

    setHouseholdName(
      suggestedHouseholdName
    );
  }, [
    managingFamilies,
    familyAction,
    selectedGuestIds,
    suggestedHouseholdName,
    householdNameWasEdited,
  ]);

  /*
   * FILTERS
   */

  const filteredGuests =
    useMemo(
      () => {
        const searchValue =
          search
            .trim()
            .toLowerCase();

        return guests.filter(
          (guest) => {
            const searchable =
              [
                getGuestDisplayName(
                  guest
                ),
                guest.householdName,
                guest.guestOfName,
                guest.songRequest,
                guest.notes,
              ]
                .filter(
                  Boolean
                )
                .join(
                  " "
                )
                .toLowerCase();

            const matchesSearch =
              !searchValue ||
              searchable.includes(
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
      },
      [
        guests,
        search,
        rsvpFilter,
        rehearsalFilter,
        managingFamilies,
        hideAssignedGuests,
      ]
    );

  /*
   * STATS
   */

  const stats =
    useMemo(
      () => {
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
          total:
            guests.length,

          attending,

          declined,

          pending,

          rehearsalAttending,
        };
      },
      [
        guests,
      ]
    );

  /*
   * IMPORT PLAN
   */

  const importPlan =
    useMemo(
      () => {
        const existingLookup =
          buildExistingGuestLookup(
            guests
          );

        let additions =
          0;

        let updates =
          0;

        parsedImportGuests.forEach(
          (guest) => {
            if (
              existingLookup.has(
                guest.sourceKey
              )
            ) {
              updates +=
                1;
            } else {
              additions +=
                1;
            }
          }
        );

        return {
          additions,
          updates,
        };
      },
      [
        guests,
        parsedImportGuests,
      ]
    );

  /*
   * ADD GUEST
   */

  const openAddGuest =
    () => {
      setEditingGuestId(
        null
      );

      setGuestForm({
        ...emptyGuest,
      });

      setError(
        ""
      );

      setShowGuestModal(
        true
      );
    };

  /*
   * EDIT GUEST
   */

  const openEditGuest =
    (guest) => {
      setEditingGuestId(
        guest.id
      );

      setGuestForm({
        title:
          guest.title ||
          "",

        firstName:
          guest.firstName ||
          "",

        lastName:
          guest.lastName ||
          "",

        suffix:
          guest.suffix ||
          "",

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
          Boolean(
            guest.isUnnamedGuest
          ),

        guestOfName:
          guest.guestOfName ||
          "",

        songRequest:
          guest.songRequest ||
          "",

        notes:
          guest.notes ||
          "",

        email:
          guest.email ||
          "",

        phone:
          guest.phone ||
          "",

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
          "manual",
      });

      setError(
        ""
      );

      setShowGuestModal(
        true
      );
    };

  const closeGuestModal =
    () => {
      if (
        saving
      ) {
        return;
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

      setError(
        ""
      );
    };

  const handleGuestChange =
    (event) => {
      const {
        name,
        value,
        type,
        checked,
      } =
        event.target;

      setGuestForm(
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
   * SAVE GUEST
   */

  const handleSaveGuest =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        !guestForm.firstName.trim()
      ) {
        setError(
          "Please enter the guest's first name."
        );

        return;
      }

      setSaving(
        true
      );

      setError(
        ""
      );

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

          guestOfName:
            guestForm.guestOfName.trim(),

          songRequest:
            guestForm.songRequest.trim(),

          notes:
            guestForm.notes.trim(),

          email:
            guestForm.email.trim(),

          phone:
            guestForm.phone.trim(),

          updatedAt:
            serverTimestamp(),

          updatedBy:
            user?.uid ||
            null,
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

              householdId:
                null,

              householdName:
                "",

              tableId:
                null,

              sourceType:
                "manual",

              sourceKey:
                null,

              importOrder:
                null,

              createdAt:
                serverTimestamp(),

              createdBy:
                user?.uid ||
                null,
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
        setSaving(
          false
        );
      }
    };

  /*
   * DELETE GUEST
   */

  const handleDeleteGuest =
    async (
      guest
    ) => {
      const confirmed =
        window.confirm(
          `Delete ${getGuestDisplayName(
            guest
          )}?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        await deleteDoc(
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "guests",
            guest.id
          )
        );

        setSelectedGuestIds(
          (current) =>
            current.filter(
              (id) =>
                id !==
                guest.id
            )
        );
      } catch (firebaseError) {
        console.error(
          "Error deleting guest:",
          firebaseError
        );

        setError(
          "We couldn't delete this guest."
        );
      }
    };

  /*
   * CSV FILE
   */

  const handleFileSelect =
    (event) => {
      const file =
        event.target.files?.[
          0
        ];

      if (
        !file
      ) {
        return;
      }

      setError(
        ""
      );

      setCsvFileName(
        file.name
      );

      Papa.parse(
        file,
        {
          header:
            true,

          skipEmptyLines:
            true,

          transformHeader:
            (header) =>
              header.trim(),

          complete:
            (results) => {
              const headers =
                results.meta.fields ||
                [];

              const rows =
                results.data ||
                [];

              if (
                !rows.length
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
                missingHeaders.length
              ) {
                console.warn(
                  "Missing expected CSV headers:",
                  missingHeaders
                );
              }

              const parsed =
                parseWeddingCsvRows(
                  rows
                );

              if (
                !parsed.length
              ) {
                setError(
                  "We couldn't find any guests in that CSV."
                );

                return;
              }

              setParsedImportGuests(
                parsed
              );

              setShowImportModal(
                true
              );
            },

          error:
            (parseError) => {
              console.error(
                "CSV parse error:",
                parseError
              );

              setError(
                "We couldn't read that CSV file."
              );
            },
        }
      );

      event.target.value =
        "";
    };

  const closeImportModal =
    () => {
      if (
        importing
      ) {
        return;
      }

      setShowImportModal(
        false
      );

      setParsedImportGuests(
        []
      );

      setCsvFileName(
        ""
      );

      setError(
        ""
      );
    };

  /*
   * IMPORT / SYNC
   */

  const handleImportGuests =
    async () => {
      if (
        !parsedImportGuests.length
      ) {
        return;
      }

      setImporting(
        true
      );

      setError(
        ""
      );

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
                ) ||
                null,
            })
          );

        /*
         * Firestore batches allow up to 500 writes.
         * 400 leaves us a little breathing room.
         */

        const chunkSize =
          400;

        for (
          let start =
            0;
          start <
          operations.length;
          start +=
            chunkSize
        ) {
          const chunk =
            operations.slice(
              start,
              start +
                chunkSize
            );

          const batch =
            writeBatch(
              db
            );

          chunk.forEach(
            ({
              guest,
              existingGuest,
            }) => {
              if (
                existingGuest
              ) {
                batch.update(
                  doc(
                    db,
                    "weddings",
                    WEDDING_ID,
                    "guests",
                    existingGuest.id
                  ),
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

                /*
                 * Deliberately preserve:
                 * householdId
                 * householdName
                 * tableId
                 * email
                 * phone
                 *
                 * Re-importing Zola should not erase
                 * planning work done in this app.
                 */

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

                  email:
                    "",

                  phone:
                    "",

                  sourceType:
                    "csv",

                  importedFrom:
                    csvFileName,

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
          );

          await batch.commit();
        }

        setShowImportModal(
          false
        );

        setParsedImportGuests(
          []
        );

        setCsvFileName(
          ""
        );
      } catch (firebaseError) {
        console.error(
          "Error importing guests:",
          firebaseError
        );

        setError(
          "We couldn't update the guest list."
        );
      } finally {
        setImporting(
          false
        );
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

      setHouseholdName(
        ""
      );

      setHouseholdNameWasEdited(
        false
      );

      setFamilyAction(
        "new"
      );

      setSelectedExistingHousehold(
        ""
      );
    };

  const stopFamilyManagement =
    () => {
      if (
        savingFamily
      ) {
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

      setHouseholdName(
        ""
      );

      setHouseholdNameWasEdited(
        false
      );

      setFamilyAction(
        "new"
      );

      setSelectedExistingHousehold(
        ""
      );

      setError(
        ""
      );
    };

  const toggleGuestSelection =
    (guestId) => {
      setSelectedGuestIds(
        (current) =>
          current.includes(
            guestId
          )
            ? current.filter(
                (id) =>
                  id !==
                  guestId
              )
            : [
                ...current,
                guestId,
              ]
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

      if (
        allSelected
      ) {
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

  const handleAssignFamily =
    async () => {
      if (
        !selectedGuestIds.length
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
      } else {
        const existing =
          households.find(
            (household) =>
              household.id ===
              selectedExistingHousehold
          );

        if (
          !existing
        ) {
          setError(
            "Choose an existing household."
          );

          return;
        }

        targetHouseholdId =
          existing.id;

        targetHouseholdName =
          existing.name;
      }

      setSavingFamily(
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

        setHouseholdName(
          ""
        );

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
        setSavingFamily(
          false
        );
      }
    };

  const handleRemoveFromFamily =
    async () => {
      if (
        !selectedGuestIds.length
      ) {
        setError(
          "Select at least one guest first."
        );

        return;
      }

      setSavingFamily(
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
      } catch (firebaseError) {
        console.error(
          "Error removing household:",
          firebaseError
        );

        setError(
          "We couldn't remove those guests from their household."
        );
      } finally {
        setSavingFamily(
          false
        );
      }
    };

  return (
    <main className="page guests-page">
      <GuestPlanningNav />

      <div className="guests-page-header">
        <div>
          <p className="page-eyebrow">
            Guests
          </p>

          <h1 className="page-title">
            Guest List
          </h1>

          <p className="page-description">
            Manage invitations, RSVPs, rehearsal
            dinner responses, households, and seating
            information.
          </p>
        </div>

        <div className="guests-header-actions">
          <input
            ref={
              fileInputRef
            }
            type="file"
            accept=".csv,text/csv"
            className="guest-file-input"
            onChange={
              handleFileSelect
            }
          />

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            <Upload
              size={16}
            />

            Import Zola CSV
          </button>

          <button
            type="button"
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
        </div>
      </div>

      <section className="guest-stats-grid">
        <GuestStat
          label="Invited"
          value={
            stats.total
          }
        />

        <GuestStat
          label="RSVP Yes"
          value={
            stats.attending
          }
          type="yes"
        />

        <GuestStat
          label="Awaiting RSVP"
          value={
            stats.pending
          }
        />

        <GuestStat
          label="Declined"
          value={
            stats.declined
          }
          type="declined"
        />

        <GuestStat
          label="Rehearsal Yes"
          value={
            stats.rehearsalAttending
          }
          type="rehearsal"
        />
      </section>

      {managingFamilies && (
        <section className="family-manager">
          <div className="family-manager-header">
            <div>
              <p className="card-eyebrow">
                Household Management
              </p>

              <h2>
                Group Guests Into Families
              </h2>

              <p>
                Select the people who belong together,
                then create a new household or add them
                to an existing one.
              </p>
            </div>

            <button
              type="button"
              className="icon-button"
              onClick={
                stopFamilyManagement
              }
            >
              <X
                size={18}
              />
            </button>
          </div>

          <div className="family-manager-toolbar">
            <label className="guest-checkbox-row">
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

              Hide guests already in a family
            </label>

            <button
              type="button"
              className="secondary-button compact"
              onClick={
                toggleSelectAllVisible
              }
            >
              <Check
                size={15}
              />

              Select All Visible
            </button>
          </div>

          <div className="family-selection-summary">
            <Users
              size={18}
            />

            <strong>
              {selectedGuestIds.length}
            </strong>

            <span>
              selected
            </span>
          </div>

          <div className="family-action-tabs">
            <button
              type="button"
              className={
                familyAction ===
                "new"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setFamilyAction(
                  "new"
                );

                setHouseholdNameWasEdited(
                  false
                );

                setHouseholdName(
                  suggestedHouseholdName
                );
              }}
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
                setFamilyAction(
                  "existing"
                )
              }
            >
              Existing Family
            </button>
          </div>

          {familyAction ===
          "new" ? (
            <label className="form-field">
              <span>
                Family / Household Name
              </span>

              <input
                type="text"
                value={
                  householdName
                }
                onChange={(event) => {
                  setHouseholdName(
                    event.target.value
                  );

                  setHouseholdNameWasEdited(
                    true
                  );
                }}
                placeholder="Bergan Family"
              />
            </label>
          ) : (
            <label className="form-field">
              <span>
                Existing Family
              </span>

              <div className="select-wrap">
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
                        {household.name} ({household.count})
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={15}
                />
              </div>
            </label>
          )}

          <div className="family-manager-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={
                !selectedGuestIds.length ||
                savingFamily
              }
              onClick={
                handleRemoveFromFamily
              }
            >
              Remove From Family
            </button>

            <button
              type="button"
              className="primary-button"
              disabled={
                !selectedGuestIds.length ||
                savingFamily
              }
              onClick={
                handleAssignFamily
              }
            >
              {savingFamily ? (
                <>
                  <LoaderCircle
                    size={16}
                    className="spinner"
                  />

                  Saving...
                </>
              ) : (
                <>
                  <Users
                    size={16}
                  />

                  Assign Family
                </>
              )}
            </button>
          </div>
        </section>
      )}

      <section className="guest-toolbar">
        <div className="guest-search">
          <Search
            size={17}
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
            placeholder="Search guests, families, notes, or songs..."
          />
        </div>

        <div className="guest-toolbar-filters">
          <div className="select-wrap">
            <select
              value={
                rsvpFilter
              }
              onChange={(event) =>
                setRsvpFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All RSVPs
              </option>

              <option value="attending">
                RSVP Yes
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
                All Rehearsal
              </option>

              <option value="attending">
                Rehearsal Yes
              </option>

              <option value="declined">
                Rehearsal No
              </option>

              <option value="pending">
                No Response
              </option>

              <option value="na">
                N/A
              </option>
            </select>

            <ChevronDown
              size={15}
            />
          </div>

          {!managingFamilies && (
            <button
              type="button"
              className="secondary-button"
              onClick={
                startFamilyManagement
              }
            >
              <Users
                size={16}
              />

              Manage Families
            </button>
          )}
        </div>
      </section>

      {error &&
        !showGuestModal &&
        !showImportModal && (
          <div className="guest-page-error">
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
        <div className="content-card guest-loading">
          <LoaderCircle
            size={25}
            className="spinner"
          />

          <p>
            Loading guests...
          </p>
        </div>
      ) : guests.length ===
        0 ? (
        <section className="content-card guest-empty">
          <UserRoundPlus
            size={42}
            strokeWidth={1.25}
          />

          <h2>
            No guests yet
          </h2>

          <p>
            Add guests manually or import your Zola
            guest-list CSV.
          </p>

          <div className="guest-empty-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              <Upload
                size={16}
              />

              Import CSV
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={
                openAddGuest
              }
            >
              <Plus
                size={17}
              />

              Add First Guest
            </button>
          </div>
        </section>
      ) : filteredGuests.length ===
        0 ? (
        <section className="content-card guest-empty compact">
          <Search
            size={30}
            strokeWidth={1.25}
          />

          <h2>
            No matching guests
          </h2>

          <p>
            Try changing your search or filters.
          </p>
        </section>
      ) : (
        <section className="guest-list">
          {filteredGuests.map(
            (guest) => (
              <GuestRow
                key={
                  guest.id
                }
                guest={
                  guest
                }
                familyMode={
                  managingFamilies
                }
                selected={
                  selectedGuestIds.includes(
                    guest.id
                  )
                }
                onToggle={() =>
                  toggleGuestSelection(
                    guest.id
                  )
                }
                onEdit={() =>
                  openEditGuest(
                    guest
                  )
                }
                onDelete={() =>
                  handleDeleteGuest(
                    guest
                  )
                }
              />
            )
          )}
        </section>
      )}

      {showGuestModal && (
        <GuestModal
          editing={
            Boolean(
              editingGuestId
            )
          }
          form={
            guestForm
          }
          error={
            error
          }
          saving={
            saving
          }
          onChange={
            handleGuestChange
          }
          onClose={
            closeGuestModal
          }
          onSubmit={
            handleSaveGuest
          }
        />
      )}

      {showImportModal && (
        <ImportModal
          fileName={
            csvFileName
          }
          guests={
            parsedImportGuests
          }
          additions={
            importPlan.additions
          }
          updates={
            importPlan.updates
          }
          importing={
            importing
          }
          error={
            error
          }
          onClose={
            closeImportModal
          }
          onImport={
            handleImportGuests
          }
        />
      )}
    </main>
  );
}

/*
 * GUEST / SEATING NAVIGATION
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

function GuestStat({
  label,
  value,
  type = "",
}) {
  return (
    <div
      className={`guest-stat-card ${
        type
          ? `guest-stat-${type}`
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
 * GUEST ROW
 */

function GuestRow({
  guest,
  familyMode,
  selected,
  onToggle,
  onEdit,
  onDelete,
}) {
  return (
    <article
      className={`guest-row ${
        selected
          ? "selected"
          : ""
      }`}
    >
      {familyMode && (
        <label className="guest-family-checkbox">
          <input
            type="checkbox"
            checked={
              selected
            }
            onChange={
              onToggle
            }
            aria-label={`Select ${getGuestDisplayName(
              guest
            )}`}
          />
        </label>
      )}

      <div className="guest-row-main">
        <div className="guest-name-row">
          <strong>
            {getGuestDisplayName(
              guest
            )}
          </strong>

          {guest.isUnnamedGuest && (
            <span className="guest-plus-one-badge">
              Guest
            </span>
          )}

          <GuestRsvpBadge
            status={
              guest.rsvpStatus
            }
          />
        </div>

        <div className="guest-meta">
          {guest.householdName && (
            <span>
              <Users
                size={12}
              />

              {guest.householdName}
            </span>
          )}

          {guest.isUnnamedGuest &&
            guest.guestOfName && (
              <span>
                Guest of{" "}
                {guest.guestOfName}
              </span>
            )}

          {guest.tableId && (
            <span className="guest-seated-label">
              Seated
            </span>
          )}
        </div>

        {(guest.songRequest ||
          guest.notes) && (
          <div className="guest-extra">
            {guest.songRequest && (
              <p>
                <strong>
                  Song:
                </strong>{" "}
                {guest.songRequest}
              </p>
            )}

            {guest.notes && (
              <p>
                <strong>
                  Note:
                </strong>{" "}
                {guest.notes}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="guest-response-columns">
        <div>
          <span>
            Wedding
          </span>

          <strong>
            {formatRsvp(
              guest.rsvpStatus
            )}
          </strong>
        </div>

        <div>
          <span>
            Rehearsal
          </span>

          <strong>
            {formatRehearsal(
              guest.rehearsalStatus
            )}
          </strong>
        </div>
      </div>

      {!familyMode && (
        <div className="guest-row-actions">
          <button
            type="button"
            className="icon-button"
            onClick={
              onEdit
            }
            title="Edit guest"
          >
            <Pencil
              size={15}
            />
          </button>

          <button
            type="button"
            className="icon-button danger"
            onClick={
              onDelete
            }
            title="Delete guest"
          >
            <Trash2
              size={15}
            />
          </button>
        </div>
      )}
    </article>
  );
}

function GuestRsvpBadge({
  status,
}) {
  const value =
    status ||
    "pending";

  return (
    <span
      className={`guest-rsvp-badge guest-rsvp-${value}`}
    >
      {formatRsvp(
        value
      )}
    </span>
  );
}

/*
 * GUEST MODAL
 */

function GuestModal({
  editing,
  form,
  error,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={
        onClose
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
              {editing
                ? "Edit Guest"
                : "New Guest"}
            </p>

            <h2>
              {editing
                ? "Edit Guest"
                : "Add Guest"}
            </h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={
              onClose
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
            onSubmit
          }
        >
          <div className="guest-name-form-grid">
            <label className="form-field">
              <span>
                Title
              </span>

              <input
                type="text"
                name="title"
                value={
                  form.title
                }
                onChange={
                  onChange
                }
                placeholder="Mr."
              />
            </label>

            <label className="form-field guest-name-first">
              <span>
                First Name
              </span>

              <input
                type="text"
                name="firstName"
                value={
                  form.firstName
                }
                onChange={
                  onChange
                }
                placeholder="First name"
                autoFocus
              />
            </label>

            <label className="form-field guest-name-last">
              <span>
                Last Name
              </span>

              <input
                type="text"
                name="lastName"
                value={
                  form.lastName
                }
                onChange={
                  onChange
                }
                placeholder="Last name"
              />
            </label>

            <label className="form-field">
              <span>
                Suffix
              </span>

              <input
                type="text"
                name="suffix"
                value={
                  form.suffix
                }
                onChange={
                  onChange
                }
                placeholder="Jr."
              />
            </label>
          </div>

          <label className="guest-checkbox-row guest-unnamed-toggle">
            <input
              type="checkbox"
              name="isUnnamedGuest"
              checked={
                form.isUnnamedGuest
              }
              onChange={
                onChange
              }
            />

            This is an unnamed guest / plus-one
          </label>

          {form.isUnnamedGuest && (
            <label className="form-field">
              <span>
                Guest Of
              </span>

              <input
                type="text"
                name="guestOfName"
                value={
                  form.guestOfName
                }
                onChange={
                  onChange
                }
                placeholder="Name of invited guest"
              />
            </label>
          )}

          <div className="form-grid">
            <label className="form-field">
              <span>
                Wedding RSVP
              </span>

              <div className="select-wrap">
                <select
                  name="rsvpStatus"
                  value={
                    form.rsvpStatus
                  }
                  onChange={
                    onChange
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

                <ChevronDown
                  size={15}
                />
              </div>
            </label>

            <label className="form-field">
              <span>
                Rehearsal Dinner
              </span>

              <div className="select-wrap">
                <select
                  name="rehearsalStatus"
                  value={
                    form.rehearsalStatus
                  }
                  onChange={
                    onChange
                  }
                >
                  <option value="na">
                    N/A
                  </option>

                  <option value="pending">
                    No Response
                  </option>

                  <option value="attending">
                    Attending
                  </option>

                  <option value="declined">
                    Declined
                  </option>
                </select>

                <ChevronDown
                  size={15}
                />
              </div>
            </label>
          </div>

          <div className="form-grid">
            <label className="form-field">
              <span>
                Email
              </span>

              <input
                type="email"
                name="email"
                value={
                  form.email
                }
                onChange={
                  onChange
                }
              />
            </label>

            <label className="form-field">
              <span>
                Phone
              </span>

              <input
                type="tel"
                name="phone"
                value={
                  form.phone
                }
                onChange={
                  onChange
                }
              />
            </label>
          </div>

          <label className="form-field">
            <span>
              Song Request
            </span>

            <input
              type="text"
              name="songRequest"
              value={
                form.songRequest
              }
              onChange={
                onChange
              }
              placeholder="Requested song"
            />
          </label>

          <label className="form-field">
            <span>
              Notes
            </span>

            <textarea
              name="notes"
              rows={4}
              value={
                form.notes
              }
              onChange={
                onChange
              }
              placeholder="Guest notes..."
            />
          </label>

          {error && (
            <div className="guest-modal-error">
              {error}
            </div>
          )}

          <div className="task-form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={
                onClose
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

                  {editing
                    ? "Save Changes"
                    : "Add Guest"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/*
 * IMPORT MODAL
 */

function ImportModal({
  fileName,
  guests,
  additions,
  updates,
  importing,
  error,
  onClose,
  onImport,
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={
        onClose
      }
    >
      <div
        className="task-modal guest-import-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="task-modal-header">
          <div>
            <p className="card-eyebrow">
              Zola Import
            </p>

            <h2>
              Import Guest List
            </h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={
              onClose
            }
            disabled={
              importing
            }
          >
            <X
              size={19}
            />
          </button>
        </div>

        <div className="guest-import-file">
          <FileUp
            size={21}
          />

          <div>
            <strong>
              {fileName}
            </strong>

            <span>
              {guests.length} guest records found
            </span>
          </div>
        </div>

        <div className="guest-import-summary">
          <div>
            <span>
              New Guests
            </span>

            <strong>
              {additions}
            </strong>
          </div>

          <div>
            <span>
              Existing Guests Updated
            </span>

            <strong>
              {updates}
            </strong>
          </div>
        </div>

        <div className="guest-import-note">
          <strong>
            Existing planning work is protected.
          </strong>

          <p>
            Re-importing updates Zola RSVP information,
            names, song requests, and notes. It does
            not erase family assignments, seating
            assignments, email addresses, or phone
            numbers you added here.
          </p>
        </div>

        <div className="guest-import-preview">
          <div className="guest-import-preview-heading">
            <span>
              Preview
            </span>

            <span>
              First 8 guests
            </span>
          </div>

          {guests
            .slice(
              0,
              8
            )
            .map(
              (guest) => (
                <div
                  className="guest-import-preview-row"
                  key={
                    guest.sourceKey
                  }
                >
                  <span>
                    {getGuestDisplayName(
                      guest
                    )}
                  </span>

                  <span>
                    {formatRsvp(
                      guest.rsvpStatus
                    )}
                  </span>
                </div>
              )
            )}
        </div>

        {error && (
          <div className="guest-modal-error">
            {error}
          </div>
        )}

        <div className="task-form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={
              onClose
            }
            disabled={
              importing
            }
          >
            Cancel
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={
              onImport
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

                Importing...
              </>
            ) : (
              <>
                <Upload
                  size={17}
                />

                Import & Sync
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/*
 * CSV PARSING
 */

function parseWeddingCsvRows(
  rows
) {
  const parsed =
    [];

  let previousNamedGuest =
    "";

  rows.forEach(
    (
      row,
      index
    ) => {
      const title =
        cleanCsvValue(
          row["Title"]
        );

      const firstName =
        cleanCsvValue(
          row[
            "First Name"
          ]
        );

      const lastName =
        cleanCsvValue(
          row[
            "Last Name"
          ]
        );

      const suffix =
        cleanCsvValue(
          row[
            "Suffix"
          ]
        );

      if (
        !firstName &&
        !lastName
      ) {
        return;
      }

      const isUnnamedGuest =
        firstName
          .toLowerCase()
          .trim() ===
          "guest" &&
        !lastName;

      const guestOfName =
        isUnnamedGuest
          ? previousNamedGuest
          : "";

      const guest = {
        title,

        firstName:
          isUnnamedGuest
            ? "Guest"
            : firstName,

        lastName,

        suffix,

        rsvpStatus:
          parseWeddingRsvp(
            row[
              "The Bergans Wedding"
            ]
          ),

        rehearsalStatus:
          parseRehearsalRsvp(
            row[
              "Rehearsal Dinner"
            ]
          ),

        householdId:
          null,

        householdName:
          "",

        isUnnamedGuest,

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

        email:
          "",

        phone:
          "",

        tableId:
          null,

        importOrder:
          index,

        sourceType:
          "csv",
      };

      guest.sourceKey =
        buildGuestSourceKey(
          guest,
          index
        );

      parsed.push(
        guest
      );

      if (
        !isUnnamedGuest
      ) {
        previousNamedGuest =
          getGuestDisplayName(
            guest
          );
      }
    }
  );

  return parsed;
}

function parseWeddingRsvp(
  value
) {
  const normalized =
    cleanCsvValue(
      value
    ).toLowerCase();

  if (
    [
      "yes",
      "attending",
      "accepted",
      "accept",
      "will attend",
    ].some(
      (option) =>
        normalized.includes(
          option
        )
    )
  ) {
    return "attending";
  }

  if (
    [
      "no",
      "declined",
      "decline",
      "not attending",
    ].some(
      (option) =>
        normalized.includes(
          option
        )
    )
  ) {
    return "declined";
  }

  return "pending";
}

function parseRehearsalRsvp(
  value
) {
  const normalized =
    cleanCsvValue(
      value
    ).toLowerCase();

  if (
    !normalized
  ) {
    return "na";
  }

  if (
    [
      "yes",
      "attending",
      "accepted",
      "accept",
    ].some(
      (option) =>
        normalized.includes(
          option
        )
    )
  ) {
    return "attending";
  }

  if (
    [
      "no",
      "declined",
      "decline",
    ].some(
      (option) =>
        normalized.includes(
          option
        )
    )
  ) {
    return "declined";
  }

  return "pending";
}

function cleanCsvValue(
  value
) {
  return String(
    value ??
    ""
  ).trim();
}

/*
 * SOURCE KEY
 */

function buildGuestSourceKey(
  guest,
  index = null
) {
  const pieces =
    [
      guest.title,
      guest.firstName,
      guest.lastName,
      guest.suffix,
      guest.guestOfName,
    ]
      .map(
        normalizeKeyValue
      )
      .join(
        "|"
      );

  if (
    guest.isUnnamedGuest
  ) {
    return `${pieces}|guest-${index ?? 0}`;
  }

  return pieces;
}

function buildExistingGuestLookup(
  guests
) {
  const map =
    new Map();

  guests.forEach(
    (guest) => {
      if (
        guest.sourceKey
      ) {
        map.set(
          guest.sourceKey,
          guest
        );

        return;
      }

      if (
        guest.sourceType ===
        "csv"
      ) {
        const fallbackKey =
          buildGuestSourceKey(
            guest,
            guest.importOrder
          );

        map.set(
          fallbackKey,
          guest
        );
      }
    }
  );

  return map;
}

function normalizeKeyValue(
  value
) {
  return String(
    value ||
    ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      " "
    );
}

/*
 * HOUSEHOLD NAME
 */

function suggestHouseholdName(
  selectedGuests
) {
  if (
    !selectedGuests.length
  ) {
    return "";
  }

  if (
    selectedGuests.length ===
    1
  ) {
    return getGuestDisplayName(
      selectedGuests[
        0
      ]
    );
  }

  if (
    selectedGuests.length ===
    2
  ) {
    const [
      first,
      second,
    ] =
      selectedGuests;

    const firstLast =
      String(
        first.lastName ||
        ""
      ).trim();

    const secondLast =
      String(
        second.lastName ||
        ""
      ).trim();

    if (
      firstLast &&
      secondLast &&
      firstLast.toLowerCase() ===
        secondLast.toLowerCase()
    ) {
      return `${first.firstName} & ${second.firstName} ${firstLast}`;
    }

    return `${getSimpleGuestName(
      first
    )} & ${getSimpleGuestName(
      second
    )}`;
  }

  const firstGuest =
    selectedGuests[
      0
    ];

  if (
    firstGuest.lastName
  ) {
    return `${firstGuest.lastName} Family`;
  }

  return `${firstGuest.firstName} Family`;
}

function generateHouseholdId() {
  if (
    globalThis.crypto?.randomUUID
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `household-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

/*
 * FORMATTING
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
    guest.title,
    guest.firstName,
    guest.lastName,
    guest.suffix,
  ]
    .filter(
      Boolean
    )
    .join(
      " "
    );
}

function getSimpleGuestName(
  guest
) {
  if (
    guest.isUnnamedGuest
  ) {
    return getGuestDisplayName(
      guest
    );
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
    );
}

function formatRsvp(
  status
) {
  const labels = {
    attending:
      "Yes",

    declined:
      "No",

    pending:
      "No Response",
  };

  return labels[
    status
  ] ||
    "No Response";
}

function formatRehearsal(
  status
) {
  const labels = {
    attending:
      "Yes",

    declined:
      "No",

    pending:
      "No Response",

    na:
      "N/A",
  };

  return labels[
    status
  ] ||
    "N/A";
}

function compareGuestOrder(
  first,
  second
) {
  const firstHasOrder =
    typeof first.importOrder ===
    "number";

  const secondHasOrder =
    typeof second.importOrder ===
    "number";

  if (
    firstHasOrder &&
    secondHasOrder
  ) {
    return (
      first.importOrder -
      second.importOrder
    );
  }

  if (
    firstHasOrder
  ) {
    return -1;
  }

  if (
    secondHasOrder
  ) {
    return 1;
  }

  return getGuestDisplayName(
    first
  ).localeCompare(
    getGuestDisplayName(
      second
    )
  );
}

export default Guests;