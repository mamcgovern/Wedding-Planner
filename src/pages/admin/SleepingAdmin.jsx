import {
  ArrowDown,
  ArrowUp,
  BedDouble,
  Check,
  Hotel,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  useEffect,
  useState,
} from "react";

import {
  db,
} from "../../services/firebase";

import {
  WEDDING_ID,
} from "../../config/wedding";

import {
  useAuth,
} from "../../context/AuthContext";

const defaultSleepingData = {
  weekendDates:
    "April 23rd–25th, 2027",

  intro:
    "Members of the wedding party are welcome to stay in the house at the venue during the wedding weekend.",

  progressLabel:
    "Work in Progress",

  progressMessage:
    "These assignments are still being finalized and may change as we get closer to the wedding.",

  contactHeading:
    "Want to stay at the house?",

  contactMessage:
    "Please reach out to the couple to let us know so we can make sure we have a sleeping space planned for you.",

  bedrooms:
    "3",

  bathrooms:
    "2",

  capacity:
    "16+",

  areas: [
    {
      id: "master-bedroom",
      name: "Master Bedroom",
      type: "Bedroom",
      note: "",
      assignments: [
        {
          id: "master-king",
          bed: "King Bed",
          people: "Maddie & Nick",
        },
      ],
    },
    {
      id: "bedroom-two",
      name: "Bedroom Two",
      type: "Bedroom",
      note: "",
      assignments: [
        {
          id: "bedroom-two-one",
          bed: "Queen Bed",
          people: "Sydni & Colin",
        },
        {
          id: "bedroom-two-two",
          bed: "Queen Bed",
          people: "Nathan & Skyler",
        },
      ],
    },
    {
      id: "bedroom-three",
      name: "Bedroom Three",
      type: "Bedroom",
      note: "",
      assignments: [
        {
          id: "bedroom-three-one",
          bed: "Queen Bed",
          people: "Lizzy & Kurt",
        },
        {
          id: "bedroom-three-two",
          bed: "Queen Bed",
          people: "Kay & Bee",
        },
        {
          id: "bedroom-three-floor",
          bed: "Floor",
          people: "Toph",
        },
      ],
    },
    {
      id: "living-room",
      name: "Living Room",
      type: "Common Area",
      note:
        "Additional air mattresses can be set up as needed.",
      assignments: [
        {
          id: "living-room-couch",
          bed: "Couch",
          people: "TBD",
        },
        {
          id: "living-room-pullout",
          bed: "Pull-Out Bed",
          people: "TBD",
        },
      ],
    },
  ],

  additionalSpaceEyebrow:
    "Additional Sleeping Space",

  additionalSpaceTitle:
    "The Living Room",

  additionalSpaceParagraphs: [
    "Additional sleeping space is available on the couch, pull-out bed, and air mattresses.",
    "The living area is very large, and should be able to sleep 10+ people comfortably.",
    "If you're assigned to the living room, plan to bring your own air mattress, pillow, and blankets unless we tell you otherwise. We have a couple air mattresses that can be borrowed if necessary.",
  ],

  hotel: {
    eyebrow:
      "Prefer Your Own Space?",

    name:
      "Cobblestone Inn & Suites",

    addressLine1:
      "1210 Commercial Court",

    addressLine2:
      "Manchester, IA 52057",

    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=1210+Commercial+Court+Manchester+IA+52057",

    distance:
      "12 minute drive from the wedding venue",

    phone:
      "(563) 856-0011",

    phoneLink:
      "5638560011",

    blockName:
      "Nick&Maddie Wedding",

    checkInDate:
      "Friday, April 23rd",

    checkInTime:
      "3:00 PM",

    checkOutDate:
      "Sunday, April 25th",

    checkOutTime:
      "11:00 AM",

    priceLabel:
      "Per Night",

    price:
      "~ $149.99",

    reserveBy:
      "TBD",
  },
};

function SleepingAdmin() {
  const {
    user,
  } = useAuth();

  const [
    data,
    setData,
  ] = useState(
    defaultSleepingData
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    saved,
    setSaved,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    const sleepingRef =
      doc(
        db,
        "weddings",
        WEDDING_ID,
        "public",
        "sleeping"
      );

    const unsubscribe =
      onSnapshot(
        sleepingRef,
        (snapshot) => {
          if (
            snapshot.exists()
          ) {
            setData(
              mergeSleepingData(
                snapshot.data()
              )
            );
          } else {
            setData(
              defaultSleepingData
            );
          }

          setLoading(false);
          setError("");
        },
        (firebaseError) => {
          console.error(
            "Error loading sleeping arrangements:",
            firebaseError
          );

          setError(
            "We couldn't load the sleeping arrangements."
          );

          setLoading(false);
        }
      );

    return unsubscribe;
  }, []);

  const handleTopLevelChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setData(
        (current) => ({
          ...current,

          [name]:
            value,
        })
      );

      setSaved(false);
    };

  const handleHotelChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setData(
        (current) => ({
          ...current,

          hotel: {
            ...current.hotel,

            [name]:
              value,
          },
        })
      );

      setSaved(false);
    };

  const handleAdditionalParagraphChange =
    (
      index,
      value
    ) => {
      setData(
        (current) => {
          const paragraphs = [
            ...current.additionalSpaceParagraphs,
          ];

          paragraphs[
            index
          ] = value;

          return {
            ...current,

            additionalSpaceParagraphs:
              paragraphs,
          };
        }
      );

      setSaved(false);
    };

  const addAdditionalParagraph =
    () => {
      setData(
        (current) => ({
          ...current,

          additionalSpaceParagraphs: [
            ...current.additionalSpaceParagraphs,
            "",
          ],
        })
      );

      setSaved(false);
    };

  const deleteAdditionalParagraph =
    (index) => {
      setData(
        (current) => ({
          ...current,

          additionalSpaceParagraphs:
            current.additionalSpaceParagraphs.filter(
              (
                _,
                paragraphIndex
              ) =>
                paragraphIndex !==
                index
            ),
        })
      );

      setSaved(false);
    };

  const addArea =
    () => {
      setData(
        (current) => ({
          ...current,

          areas: [
            ...current.areas,

            {
              id:
                createId(
                  "room"
                ),

              name:
                "New Sleeping Area",

              type:
                "Bedroom",

              note:
                "",

              assignments:
                [],
            },
          ],
        })
      );

      setSaved(false);
    };

  const updateArea =
    (
      areaId,
      field,
      value
    ) => {
      setData(
        (current) => ({
          ...current,

          areas:
            current.areas.map(
              (area) =>
                area.id ===
                areaId
                  ? {
                      ...area,

                      [field]:
                        value,
                    }
                  : area
            ),
        })
      );

      setSaved(false);
    };

  const deleteArea =
    (areaId) => {
      const area =
        data.areas.find(
          (item) =>
            item.id ===
            areaId
        );

      const confirmed =
        window.confirm(
          `Delete "${
            area?.name ||
            "this sleeping area"
          }"?`
        );

      if (!confirmed) {
        return;
      }

      setData(
        (current) => ({
          ...current,

          areas:
            current.areas.filter(
              (item) =>
                item.id !==
                areaId
            ),
        })
      );

      setSaved(false);
    };

  const moveArea =
    (
      areaId,
      direction
    ) => {
      setData(
        (current) => {
          const index =
            current.areas.findIndex(
              (area) =>
                area.id ===
                areaId
            );

          if (
            index === -1
          ) {
            return current;
          }

          const nextIndex =
            direction ===
            "up"
              ? index - 1
              : index + 1;

          if (
            nextIndex < 0 ||
            nextIndex >=
              current.areas.length
          ) {
            return current;
          }

          const areas = [
            ...current.areas,
          ];

          const [
            moved,
          ] =
            areas.splice(
              index,
              1
            );

          areas.splice(
            nextIndex,
            0,
            moved
          );

          return {
            ...current,
            areas,
          };
        }
      );

      setSaved(false);
    };

  const addAssignment =
    (areaId) => {
      setData(
        (current) => ({
          ...current,

          areas:
            current.areas.map(
              (area) =>
                area.id ===
                areaId
                  ? {
                      ...area,

                      assignments: [
                        ...area.assignments,

                        {
                          id:
                            createId(
                              "bed"
                            ),

                          bed:
                            "",

                          people:
                            "",
                        },
                      ],
                    }
                  : area
            ),
        })
      );

      setSaved(false);
    };

  const updateAssignment =
    (
      areaId,
      assignmentId,
      field,
      value
    ) => {
      setData(
        (current) => ({
          ...current,

          areas:
            current.areas.map(
              (area) => {
                if (
                  area.id !==
                  areaId
                ) {
                  return area;
                }

                return {
                  ...area,

                  assignments:
                    area.assignments.map(
                      (
                        assignment
                      ) =>
                        assignment.id ===
                        assignmentId
                          ? {
                              ...assignment,

                              [field]:
                                value,
                            }
                          : assignment
                    ),
                };
              }
            ),
        })
      );

      setSaved(false);
    };

  const deleteAssignment =
    (
      areaId,
      assignmentId
    ) => {
      setData(
        (current) => ({
          ...current,

          areas:
            current.areas.map(
              (area) =>
                area.id ===
                areaId
                  ? {
                      ...area,

                      assignments:
                        area.assignments.filter(
                          (
                            assignment
                          ) =>
                            assignment.id !==
                            assignmentId
                        ),
                    }
                  : area
            ),
        })
      );

      setSaved(false);
    };

  const handleSave =
    async () => {
      setSaving(true);
      setSaved(false);
      setError("");

      try {
        await setDoc(
          doc(
            db,
            "weddings",
            WEDDING_ID,
            "public",
            "sleeping"
          ),
          {
            ...data,

            updatedAt:
              serverTimestamp(),

            updatedBy:
              user?.uid ||
              null,
          },
          {
            merge:
              true,
          }
        );

        setSaved(true);
      } catch (firebaseError) {
        console.error(
          "Error saving sleeping arrangements:",
          firebaseError
        );

        setError(
          "We couldn't save the sleeping arrangements."
        );
      } finally {
        setSaving(false);
      }
    };

  if (loading) {
    return (
      <main className="page sleeping-admin-page">
        <p className="page-eyebrow">
          Planning
        </p>

        <h1 className="page-title">
          Sleeping Arrangements
        </h1>

        <div className="content-card">
          Loading sleeping arrangements...
        </div>
      </main>
    );
  }

  return (
    <main className="page sleeping-admin-page">
      <div className="sleeping-admin-heading">
        <div>
          <p className="page-eyebrow">
            Planning
          </p>

          <h1 className="page-title">
            Sleeping Arrangements
          </h1>

          <p className="page-description">
            Manage sleeping spaces, room assignments,
            and hotel information for the wedding
            weekend.
          </p>
        </div>

        <div className="sleeping-admin-save">
          {saved && (
            <span className="sleeping-save-status">
              <Check
                size={15}
              />

              Saved
            </span>
          )}

          <button
            type="button"
            className="primary-button"
            onClick={
              handleSave
            }
            disabled={
              saving
            }
          >
            <Save
              size={16}
            />

            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="sleeping-admin-error">
          {error}
        </div>
      )}

      <section className="content-card sleeping-admin-section">
        <div className="sleeping-admin-section-title">
          <p className="card-eyebrow">
            Public Page
          </p>

          <h2>
            Introduction
          </h2>
        </div>

        <div className="sleeping-admin-form-grid">
          <label className="form-field">
            <span>
              Weekend Dates
            </span>

            <input
              type="text"
              name="weekendDates"
              value={
                data.weekendDates
              }
              onChange={
                handleTopLevelChange
              }
            />
          </label>

          <label className="form-field sleeping-admin-wide">
            <span>
              Introduction
            </span>

            <textarea
              name="intro"
              rows={3}
              value={
                data.intro
              }
              onChange={
                handleTopLevelChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              Status Label
            </span>

            <input
              type="text"
              name="progressLabel"
              value={
                data.progressLabel
              }
              onChange={
                handleTopLevelChange
              }
            />
          </label>

          <label className="form-field sleeping-admin-wide">
            <span>
              Status Message
            </span>

            <textarea
              name="progressMessage"
              rows={2}
              value={
                data.progressMessage
              }
              onChange={
                handleTopLevelChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              Contact Heading
            </span>

            <input
              type="text"
              name="contactHeading"
              value={
                data.contactHeading
              }
              onChange={
                handleTopLevelChange
              }
            />
          </label>

          <label className="form-field sleeping-admin-wide">
            <span>
              Contact Message
            </span>

            <textarea
              name="contactMessage"
              rows={2}
              value={
                data.contactMessage
              }
              onChange={
                handleTopLevelChange
              }
            />
          </label>
        </div>
      </section>

      <section className="content-card sleeping-admin-section">
        <div className="sleeping-admin-section-title">
          <p className="card-eyebrow">
            House
          </p>

          <h2>
            Summary
          </h2>
        </div>

        <div className="sleeping-summary-admin-grid">
          <label className="form-field">
            <span>
              Bedrooms
            </span>

            <input
              type="text"
              name="bedrooms"
              value={
                data.bedrooms
              }
              onChange={
                handleTopLevelChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              Bathrooms
            </span>

            <input
              type="text"
              name="bathrooms"
              value={
                data.bathrooms
              }
              onChange={
                handleTopLevelChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              Guest Capacity
            </span>

            <input
              type="text"
              name="capacity"
              value={
                data.capacity
              }
              onChange={
                handleTopLevelChange
              }
            />
          </label>
        </div>
      </section>

      <section className="sleeping-admin-rooms">
        <div className="sleeping-admin-list-heading">
          <div>
            <p className="card-eyebrow">
              House
            </p>

            <h2>
              Rooms & Assignments
            </h2>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={
              addArea
            }
          >
            <Plus
              size={16}
            />

            Add Sleeping Area
          </button>
        </div>

        <div className="sleeping-admin-room-list">
          {data.areas.map(
            (
              area,
              areaIndex
            ) => (
              <article
                className="content-card sleeping-admin-room"
                key={
                  area.id
                }
              >
                <div className="sleeping-admin-room-header">
                  <div className="sleeping-admin-room-order">
                    <button
                      type="button"
                      className="icon-button"
                      disabled={
                        areaIndex ===
                        0
                      }
                      onClick={() =>
                        moveArea(
                          area.id,
                          "up"
                        )
                      }
                      aria-label="Move room up"
                    >
                      <ArrowUp
                        size={15}
                      />
                    </button>

                    <button
                      type="button"
                      className="icon-button"
                      disabled={
                        areaIndex ===
                        data.areas.length -
                          1
                      }
                      onClick={() =>
                        moveArea(
                          area.id,
                          "down"
                        )
                      }
                      aria-label="Move room down"
                    >
                      <ArrowDown
                        size={15}
                      />
                    </button>
                  </div>

                  <div className="sleeping-admin-room-title">
                    <BedDouble
                      size={19}
                    />

                    <strong>
                      {area.name}
                    </strong>
                  </div>

                  <button
                    type="button"
                    className="icon-button danger"
                    onClick={() =>
                      deleteArea(
                        area.id
                      )
                    }
                    aria-label="Delete sleeping area"
                  >
                    <Trash2
                      size={16}
                    />
                  </button>
                </div>

                <div className="sleeping-admin-form-grid">
                  <label className="form-field">
                    <span>
                      Area Name
                    </span>

                    <input
                      type="text"
                      value={
                        area.name
                      }
                      onChange={(event) =>
                        updateArea(
                          area.id,
                          "name",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label className="form-field">
                    <span>
                      Type
                    </span>

                    <select
                      value={
                        area.type
                      }
                      onChange={(event) =>
                        updateArea(
                          area.id,
                          "type",
                          event.target.value
                        )
                      }
                    >
                      <option value="Bedroom">
                        Bedroom
                      </option>

                      <option value="Common Area">
                        Common Area
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>
                  </label>

                  <label className="form-field sleeping-admin-wide">
                    <span>
                      Room Note
                    </span>

                    <textarea
                      rows={2}
                      value={
                        area.note ||
                        ""
                      }
                      onChange={(event) =>
                        updateArea(
                          area.id,
                          "note",
                          event.target.value
                        )
                      }
                      placeholder="Optional"
                    />
                  </label>
                </div>

                <div className="sleeping-admin-assignments">
                  <div className="sleeping-admin-assignment-heading">
                    <h3>
                      Sleeping Spaces
                    </h3>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        addAssignment(
                          area.id
                        )
                      }
                    >
                      <Plus
                        size={14}
                      />

                      Add Bed / Space
                    </button>
                  </div>

                  {area.assignments.length ===
                  0 ? (
                    <div className="sleeping-admin-empty">
                      No sleeping spaces added yet.
                    </div>
                  ) : (
                    <div className="sleeping-admin-assignment-list">
                      {area.assignments.map(
                        (
                          assignment
                        ) => (
                          <div
                            className="sleeping-admin-assignment-row"
                            key={
                              assignment.id
                            }
                          >
                            <label className="form-field">
                              <span>
                                Bed / Space
                              </span>

                              <input
                                type="text"
                                value={
                                  assignment.bed
                                }
                                onChange={(event) =>
                                  updateAssignment(
                                    area.id,
                                    assignment.id,
                                    "bed",
                                    event.target.value
                                  )
                                }
                                placeholder="Queen Bed"
                              />
                            </label>

                            <label className="form-field">
                              <span>
                                Assigned To
                              </span>

                              <input
                                type="text"
                                value={
                                  assignment.people
                                }
                                onChange={(event) =>
                                  updateAssignment(
                                    area.id,
                                    assignment.id,
                                    "people",
                                    event.target.value
                                  )
                                }
                                placeholder="Maddie & Nick"
                              />
                            </label>

                            <button
                              type="button"
                              className="icon-button danger sleeping-assignment-delete"
                              onClick={() =>
                                deleteAssignment(
                                  area.id,
                                  assignment.id
                                )
                              }
                              aria-label="Delete sleeping space"
                            >
                              <Trash2
                                size={16}
                              />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </article>
            )
          )}
        </div>
      </section>

      <section className="content-card sleeping-admin-section">
        <div className="sleeping-admin-section-title">
          <p className="card-eyebrow">
            Additional Sleeping Space
          </p>

          <h2>
            Living Room Notes
          </h2>
        </div>

        <div className="sleeping-admin-form-grid">
          <label className="form-field">
            <span>
              Eyebrow
            </span>

            <input
              type="text"
              name="additionalSpaceEyebrow"
              value={
                data.additionalSpaceEyebrow
              }
              onChange={
                handleTopLevelChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              Heading
            </span>

            <input
              type="text"
              name="additionalSpaceTitle"
              value={
                data.additionalSpaceTitle
              }
              onChange={
                handleTopLevelChange
              }
            />
          </label>
        </div>

        <div className="sleeping-admin-paragraph-list">
          {data.additionalSpaceParagraphs.map(
            (
              paragraph,
              index
            ) => (
              <div
                className="sleeping-admin-paragraph"
                key={
                  index
                }
              >
                <textarea
                  rows={3}
                  value={
                    paragraph
                  }
                  onChange={(event) =>
                    handleAdditionalParagraphChange(
                      index,
                      event.target.value
                    )
                  }
                />

                <button
                  type="button"
                  className="icon-button danger"
                  onClick={() =>
                    deleteAdditionalParagraph(
                      index
                    )
                  }
                  aria-label="Delete paragraph"
                >
                  <Trash2
                    size={16}
                  />
                </button>
              </div>
            )
          )}

          <button
            type="button"
            className="secondary-button sleeping-add-paragraph"
            onClick={
              addAdditionalParagraph
            }
          >
            <Plus
              size={15}
            />

            Add Paragraph
          </button>
        </div>
      </section>

      <section className="content-card sleeping-admin-section">
        <div className="sleeping-admin-section-title">
          <p className="card-eyebrow">
            Hotel Block
          </p>

          <h2>
            Hotel Information
          </h2>
        </div>

        <div className="sleeping-admin-form-grid">
          <label className="form-field">
            <span>
              Eyebrow
            </span>

            <input
              type="text"
              name="eyebrow"
              value={
                data.hotel.eyebrow
              }
              onChange={
                handleHotelChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              Hotel Name
            </span>

            <input
              type="text"
              name="name"
              value={
                data.hotel.name
              }
              onChange={
                handleHotelChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              Address Line 1
            </span>

            <input
              type="text"
              name="addressLine1"
              value={
                data.hotel.addressLine1
              }
              onChange={
                handleHotelChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              Address Line 2
            </span>

            <input
              type="text"
              name="addressLine2"
              value={
                data.hotel.addressLine2
              }
              onChange={
                handleHotelChange
              }
            />
          </label>

          <label className="form-field sleeping-admin-wide">
            <span>
              Google Maps Link
            </span>

            <input
              type="url"
              name="mapsUrl"
              value={
                data.hotel.mapsUrl
              }
              onChange={
                handleHotelChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              Distance
            </span>

            <input
              type="text"
              name="distance"
              value={
                data.hotel.distance
              }
              onChange={
                handleHotelChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              Phone Display
            </span>

            <input
              type="text"
              name="phone"
              value={
                data.hotel.phone
              }
              onChange={
                handleHotelChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              Phone Number
            </span>

            <input
              type="text"
              name="phoneLink"
              value={
                data.hotel.phoneLink
              }
              onChange={
                handleHotelChange
              }
              placeholder="5638560011"
            />
          </label>

          <label className="form-field">
            <span>
              Block Name
            </span>

            <input
              type="text"
              name="blockName"
              value={
                data.hotel.blockName
              }
              onChange={
                handleHotelChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              Check In Date
            </span>

            <input
              type="text"
              name="checkInDate"
              value={
                data.hotel.checkInDate
              }
              onChange={
                handleHotelChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              Check In Time
            </span>

            <input
              type="text"
              name="checkInTime"
              value={
                data.hotel.checkInTime
              }
              onChange={
                handleHotelChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              Check Out Date
            </span>

            <input
              type="text"
              name="checkOutDate"
              value={
                data.hotel.checkOutDate
              }
              onChange={
                handleHotelChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              Check Out Time
            </span>

            <input
              type="text"
              name="checkOutTime"
              value={
                data.hotel.checkOutTime
              }
              onChange={
                handleHotelChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              Price Label
            </span>

            <input
              type="text"
              name="priceLabel"
              value={
                data.hotel.priceLabel
              }
              onChange={
                handleHotelChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              Price
            </span>

            <input
              type="text"
              name="price"
              value={
                data.hotel.price
              }
              onChange={
                handleHotelChange
              }
            />
          </label>

          <label className="form-field">
            <span>
              Reserve By
            </span>

            <input
              type="text"
              name="reserveBy"
              value={
                data.hotel.reserveBy
              }
              onChange={
                handleHotelChange
              }
            />
          </label>
        </div>
      </section>

      <div className="sleeping-admin-bottom-save">
        {saved && (
          <span className="sleeping-save-status">
            <Check
              size={15}
            />

            Saved
          </span>
        )}

        <button
          type="button"
          className="primary-button"
          onClick={
            handleSave
          }
          disabled={
            saving
          }
        >
          <Save
            size={16}
          />

          {saving
            ? "Saving..."
            : "Save Changes"}
        </button>
      </div>
    </main>
  );
}

function mergeSleepingData(
  incoming
) {
  return {
    ...defaultSleepingData,
    ...incoming,

    areas:
      Array.isArray(
        incoming.areas
      )
        ? incoming.areas.map(
            (area) => ({
              ...area,

              id:
                area.id ||
                createId(
                  "room"
                ),

              assignments:
                Array.isArray(
                  area.assignments
                )
                  ? area.assignments.map(
                      (
                        assignment
                      ) => ({
                        ...assignment,

                        id:
                          assignment.id ||
                          createId(
                            "bed"
                          ),
                      })
                    )
                  : [],
            })
          )
        : defaultSleepingData.areas,

    additionalSpaceParagraphs:
      Array.isArray(
        incoming.additionalSpaceParagraphs
      )
        ? incoming.additionalSpaceParagraphs
        : defaultSleepingData.additionalSpaceParagraphs,

    hotel: {
      ...defaultSleepingData.hotel,
      ...(incoming.hotel ||
        {}),
    },
  };
}

function createId(
  prefix
) {
  if (
    typeof crypto !==
      "undefined" &&
    crypto.randomUUID
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export default SleepingAdmin;