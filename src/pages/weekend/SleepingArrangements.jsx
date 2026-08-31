import {
  BedDouble,
  Building2,
  ExternalLink,
  Hotel,
  MapPin,
  Phone,
  Users,
} from "lucide-react";

import {
  doc,
  onSnapshot,
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
    "Please reach out to the couple to let us know so we can make sure we have a sleeping space planned for you. Sleeping spaces are available on a first-come, first-served basis and are reserved for those who have RSVP'd to the wedding.",

  bedrooms:
    "3",

  bathrooms:
    "2",

  capacity:
    "16+",

  areas: [
    {
      id:
        "master-bedroom",

      name:
        "Master Bedroom",

      type:
        "Bedroom",

      note:
        "",

      assignments: [
        {
          id:
            "master-king",

          bed:
            "King Bed",

          people:
            "Maddie & Nick",
        },
      ],
    },
    {
      id:
        "bedroom-two",

      name:
        "Bedroom Two",

      type:
        "Bedroom",

      note:
        "",

      assignments: [
        {
          id:
            "bedroom-two-one",

          bed:
            "Queen Bed",

          people:
            "Sydni & Colin",
        },
        {
          id:
            "bedroom-two-two",

          bed:
            "Queen Bed",

          people:
            "Nathan & Skyler",
        },
      ],
    },
    {
      id:
        "bedroom-three",

      name:
        "Bedroom Three",

      type:
        "Bedroom",

      note:
        "",

      assignments: [
        {
          id:
            "bedroom-three-one",

          bed:
            "Queen Bed",

          people:
            "Lizzy & Kurt",
        },
        {
          id:
            "bedroom-three-two",

          bed:
            "Queen Bed",

          people:
            "Kay & Bee",
        },
        {
          id:
            "bedroom-three-floor",

          bed:
            "Floor",

          people:
            "Toph",
        },
      ],
    },
    {
      id:
        "living-room",

      name:
        "Living Room",

      type:
        "Common Area",

      note:
        "Additional air mattresses can be set up as needed.",

      assignments: [
        {
          id:
            "living-room-couch",

          bed:
            "Couch",

          people:
            "TBD",
        },
        {
          id:
            "living-room-pullout",

          bed:
            "Pull-Out Bed",

          people:
            "TBD",
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

function SleepingArrangements() {
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
            setData({
              ...defaultSleepingData,
              ...snapshot.data(),

              hotel: {
                ...defaultSleepingData.hotel,
                ...(snapshot.data()
                  .hotel ||
                  {}),
              },
            });
          }

          setLoading(
            false
          );
        },
        (firebaseError) => {
          console.error(
            "Error loading sleeping arrangements:",
            firebaseError
          );

          setLoading(
            false
          );
        }
      );

    return unsubscribe;
  }, []);

  if (
    loading
  ) {
    return (
      <main className="page sleeping-page">
        <div className="content-card">
          Loading sleeping arrangements...
        </div>
      </main>
    );
  }

  return (
    <main className="sleeping-page">
      <section className="sleeping-intro">
        <div className="sleeping-intro-inner">
          <div className="sleeping-intro-icon">
            <BedDouble
              size={24}
            />
          </div>

          <p className="page-eyebrow">
            {
              data.weekendDates
            }
          </p>

          <h1>
            Sleeping Arrangements
          </h1>

          <p className="sleeping-intro-description">
            {
              data.intro
            }
          </p>

          <div className="sleeping-progress">
            <div className="sleeping-progress-heading">
              <span className="sleeping-progress-label">
                {
                  data.progressLabel
                }
              </span>

              <p>
                {
                  data.progressMessage
                }
              </p>
            </div>

            <div className="sleeping-progress-contact">
              <div className="sleeping-progress-contact-icon">
                <Users
                  size={19}
                />
              </div>

              <div>
                <strong>
                  {
                    data.contactHeading
                  }
                </strong>

                <p>
                  {
                    data.contactMessage
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sleeping-main">
        <div className="sleeping-summary">
          <SummaryItem
            number={
              data.bedrooms
            }
            label="Bedrooms"
          />

          <SummaryItem
            number={
              data.bathrooms
            }
            label="Bathrooms"
          />

          <SummaryItem
            number={
              data.capacity
            }
            label="Guests"
          />
        </div>

        <div className="sleeping-section-heading">
          <p className="page-eyebrow">
            Venue House
          </p>

          <h2>
            Where Everyone Is Sleeping
          </h2>

          <p>
            Find your room and sleeping space below.
            Assignments may still change as plans are
            finalized.
          </p>
        </div>

        <div className="sleeping-grid">
          {data.areas.map(
            (area) => (
              <SleepingArea
                key={
                  area.id
                }
                area={
                  area
                }
              />
            )
          )}
        </div>
      </section>

      <section className="sleeping-notes">
        <div className="sleeping-notes-inner">
          <div className="sleeping-notes-icon">
            <BedDouble
              size={24}
            />
          </div>

          <p className="page-eyebrow">
            {
              data.additionalSpaceEyebrow
            }
          </p>

          <h2>
            {
              data.additionalSpaceTitle
            }
          </h2>

          <div className="sleeping-note-paragraphs">
            {data.additionalSpaceParagraphs.map(
              (
                paragraph,
                index
              ) =>
                paragraph && (
                  <p
                    key={
                      index
                    }
                  >
                    {
                      paragraph
                    }
                  </p>
                )
            )}
          </div>
        </div>
      </section>

      <HotelSection
        hotel={
          data.hotel
        }
      />
    </main>
  );
}

function SummaryItem({
  number,
  label,
}) {
  return (
    <div className="sleeping-summary-item">
      <span className="sleeping-summary-number">
        {
          number
        }
      </span>

      <span className="sleeping-summary-label">
        {
          label
        }
      </span>
    </div>
  );
}

function SleepingArea({
  area,
}) {
  const isCommon =
    area.type ===
    "Common Area";

  return (
    <article
      className={`sleeping-card ${
        isCommon
          ? "sleeping-card-common"
          : ""
      }`}
    >
      <div className="sleeping-card-header">
        <div className="sleeping-room-icon">
          {isCommon ? (
            <Building2
              size={19}
            />
          ) : (
            <BedDouble
              size={19}
            />
          )}
        </div>

        <div>
          <p className="sleeping-room-label">
            {
              area.type
            }
          </p>

          <h2>
            {
              area.name
            }
          </h2>
        </div>
      </div>

      <div className="sleeping-assignments">
        {area.assignments?.map(
          (assignment) => (
            <div
              className="sleeping-assignment"
              key={
                assignment.id
              }
            >
              <span className="sleeping-assignment-bed">
                {
                  assignment.bed
                }
              </span>

              <span
                className={`sleeping-assignment-people ${
                  !assignment.people ||
                  assignment.people ===
                    "TBD"
                    ? "sleeping-assignment-tbd"
                    : ""
                }`}
              >
                {
                  assignment.people ||
                  "TBD"
                }
              </span>
            </div>
          )
        )}
      </div>

      {area.note && (
        <p className="sleeping-card-note">
          {
            area.note
          }
        </p>
      )}
    </article>
  );
}

function HotelSection({
  hotel,
}) {
  return (
    <section className="sleeping-hotel">
      <div className="sleeping-hotel-heading">
        <div className="sleeping-hotel-icon">
          <Hotel
            size={24}
          />
        </div>

        <p className="page-eyebrow">
          {
            hotel.eyebrow
          }
        </p>

        <h2>
          Hotel Option
        </h2>

        <p>
          If you would rather have your own room, we also
          have a hotel block available nearby.
        </p>
      </div>

      <div className="sleeping-hotel-inner">
        <div className="sleeping-hotel-content">
          <p className="card-eyebrow">
            Wedding Room Block
          </p>

          <h2>
            {
              hotel.name
            }
          </h2>

          {hotel.mapsUrl ? (
            <a
              className="sleeping-hotel-address"
              href={
                hotel.mapsUrl
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin
                size={16}
              />

              <span>
                {
                  hotel.addressLine1
                }

                <br />

                {
                  hotel.addressLine2
                }
              </span>

              <ExternalLink
                size={14}
              />
            </a>
          ) : (
            <div className="sleeping-hotel-address">
              <MapPin
                size={16}
              />

              <span>
                {
                  hotel.addressLine1
                }

                <br />

                {
                  hotel.addressLine2
                }
              </span>
            </div>
          )}

          <p className="sleeping-hotel-distance">
            {
              hotel.distance
            }
          </p>

          <div className="sleeping-hotel-reservation">
            <p className="sleeping-hotel-reserve">
              To reserve, call the hotel at{" "}

              <a
                href={`tel:${hotel.phoneLink}`}
              >
                <Phone
                  size={14}
                />

                {
                  hotel.phone
                }
              </a>{" "}

              and ask for a room under our block.
            </p>

            <div className="sleeping-hotel-block">
              <span>
                Room Block
              </span>

              <strong>
                {
                  hotel.blockName
                }
              </strong>
            </div>
          </div>
        </div>

        <div className="sleeping-hotel-details">
          <HotelDetail
            label="Check In"
            value={
              hotel.checkInDate
            }
            detail={
              hotel.checkInTime
            }
          />

          <HotelDetail
            label="Check Out"
            value={
              hotel.checkOutDate
            }
            detail={
              hotel.checkOutTime
            }
          />

          <HotelDetail
            label="Price"
            value={
              hotel.priceLabel
            }
            detail={
              hotel.price
            }
          />

          <HotelDetail
            label="Reserve By"
            value={
              hotel.reserveBy
            }
          />
        </div>
      </div>
    </section>
  );
}

function HotelDetail({
  label,
  value,
  detail,
}) {
  return (
    <div className="sleeping-hotel-detail">
      <span>
        {
          label
        }
      </span>

      <strong>
        {
          value
        }
      </strong>

      {detail && (
        <p>
          {
            detail
          }
        </p>
      )}
    </div>
  );
}

export default SleepingArrangements;