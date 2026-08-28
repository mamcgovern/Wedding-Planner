import {
  ExternalLink,
  MapPin,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import {
  useWedding,
} from "../../context/WeddingContext";

const venuePhotos = [
  {
    id: 1,
    src: "/images/venue/venue-exterior.jpg",
    alt: "Exterior of Windmill Hill Weddings and Events",
  },
  {
    id: 2,
    src: "/images/venue/venue-ceremony.jpg",
    alt: "Outdoor ceremony space at Windmill Hill",
  },
  {
    id: 3,
    src: "/images/venue/venue-reception.jpg",
    alt: "Reception space inside Windmill Hill",
  },
  {
    id: 4,
    src: "/images/venue/venue-barn.jpg",
    alt: "First floor of the barn at Windmill Hill",
  },
  {
    id: 5,
    src: "/images/venue/venue-bridal-suite-outside.jpg",
    alt: "Outside of the bridal suite at Windmill Hill",
  },
  {
    id: 6,
    src: "/images/venue/venue-bridal-suite.jpg",
    alt: "Interior of the bridal suite at Windmill Hill",
  },
  {
    id: 7,
    src: "/images/venue/venue-patio.jpg",
    alt: "The patio at Windmill Hill",
  },
  {
    id: 8,
    src: "/images/venue/venue-tractor.jpg",
    alt: "The John Deere Model A at Windmill Hill",
  },
  {
    id: 9,
    src: "/images/venue/venue-stairs.jpg",
    alt: "The stairs inside the barn at Windmill Hill",
  },
];

function Venue() {
  const {
    wedding,
    loading,
  } = useWedding();

  if (loading) {
    return (
      <main className="page">
        <div className="content-card">
          Loading venue information...
        </div>
      </main>
    );
  }

  const venueName =
    wedding.venueName ||
    "Windmill Hill Weddings & Events";

  const venueShortName =
    getVenueShortName(
      venueName
    );

  const venueLocation =
    wedding.venueLocation ||
    "Manchester, Iowa";

  const weddingDate =
    formatWeddingDate(
      wedding.weddingDate
    );

  const weddingDateShort =
    formatWeddingDateShort(
      wedding.weddingDate
    );

  const ceremonyTime =
    formatTime(
      wedding.ceremonyTime
    ) ||
    "3:00 PM";

  const receptionTime =
    buildTimeRange(
      wedding.receptionTime,
      wedding.receptionEndTime
    ) ||
    "5:00–10:00 PM";

  const venueDetails = [
    {
      label:
        "Location",

      value:
        venueLocation,
    },
    {
      label:
        "Ceremony",

      value:
        ceremonyTime,
    },
    {
      label:
        "Cocktail Hour",

      value:
        "3:30–5:00 PM",
    },
    {
      label:
        "Reception",

      value:
        receptionTime,
    },
  ];

  return (
    <main className="venue-page">
      <section className="venue-hero">
        <img
          className="venue-hero-image"
          src="/images/venue/venue-exterior.jpg"
          alt={venueName}
        />

        <div className="venue-hero-overlay" />

        <div className="venue-hero-content">
          <p className="venue-hero-eyebrow">
            Our Wedding Venue
          </p>

          <h1>
            {venueShortName}
          </h1>

          <p className="venue-hero-subtitle">
            Weddings & Events
          </p>

          <div className="venue-hero-location">
            <MapPin
              size={16}
            />

            <span>
              {venueLocation}
            </span>
          </div>
        </div>
      </section>

      <section className="venue-section venue-introduction">
        <div className="venue-section-heading">
          <p className="page-eyebrow">
            {venueLocation}
          </p>

          <h2>
            Where We&apos;ll Celebrate
          </h2>

          <p>
            {venueName} will be home to our ceremony,
            cocktail hour, and reception on{" "}
            {weddingDate}. We cannot wait to spend the
            day celebrating here with all of you.
          </p>
        </div>

        <div className="venue-feature">
          <div className="venue-feature-image">
            <img
              src="/images/venue/venue-ceremony.jpg"
              alt={`Wedding ceremony space at ${venueShortName}`}
            />
          </div>

          <div className="venue-feature-content">
            <p className="card-eyebrow">
              Wedding Day
            </p>

            <h2>
              Everything in One Place
            </h2>

            <p className="venue-feature-description">
              The ceremony and reception will both take
              place at {venueShortName}, so guests will
              not need to travel between locations during
              the wedding day.
            </p>

            <div className="venue-detail-grid">
              {venueDetails.map(
                (detail) => (
                  <div
                    className="venue-detail"
                    key={
                      detail.label
                    }
                  >
                    <span>
                      {
                        detail.label
                      }
                    </span>

                    <strong>
                      {
                        detail.value
                      }
                    </strong>
                  </div>
                )
              )}
            </div>

            <a
              href="https://maps.app.goo.gl/Wc4rUgvHspzAmapK9"
              target="_blank"
              rel="noreferrer"
              className="primary-button venue-directions-button"
            >
              <MapPin
                size={17}
              />

              View Directions

              <ExternalLink
                size={14}
              />
            </a>
          </div>
        </div>
      </section>

      <section className="venue-section venue-gallery-section">
        <div className="venue-section-heading">
          <p className="page-eyebrow">
            Take a Look Around
          </p>

          <h2>
            The Venue
          </h2>

          <p>
            A preview of the spaces where we will
            celebrate our wedding day.
          </p>
        </div>

        <div className="venue-gallery">
          {venuePhotos.map(
            (
              photo,
              index
            ) => (
              <figure
                className={`venue-gallery-item venue-gallery-item-${index + 1}`}
                key={
                  photo.id
                }
              >
                <img
                  src={
                    photo.src
                  }
                  alt={
                    photo.alt
                  }
                  loading={
                    index < 3
                      ? "eager"
                      : "lazy"
                  }
                />
              </figure>
            )
          )}
        </div>
      </section>

      <section className="venue-weekend">
        <div className="venue-weekend-content">
          <p className="card-eyebrow">
            More Than One Day
          </p>

          <h2>
            Our Wedding Weekend Home
          </h2>

          <p>
            The venue also includes a house where we and
            members of our wedding party can stay
            throughout the weekend. It gives us one place
            to prepare, celebrate, and enjoy a little
            extra time together before and after the
            wedding.
          </p>

          <Link
            to="/weekend/sleeping"
            className="secondary-button venue-weekend-link"
          >
            View Sleeping Arrangements
          </Link>
        </div>
      </section>

      <section className="venue-closing">
        <div className="venue-closing-content">
          <p className="page-eyebrow">
            {weddingDateShort}
          </p>

          <h2>
            Meet Us at {venueShortName}
          </h2>

          <p>
            We cannot wait to fill this beautiful place
            with some of our favorite people.
          </p>
        </div>
      </section>
    </main>
  );
}

function getVenueShortName(
  value
) {
  if (
    !value
  ) {
    return "Windmill Hill";
  }

  const shortName =
    value
      .replace(
        /\s+Weddings\s*&\s*Events.*$/i,
        ""
      )
      .trim();

  return (
    shortName ||
    value
  );
}

function formatWeddingDate(
  value
) {
  if (
    !value
  ) {
    return "April 24th, 2027";
  }

  const date =
    createLocalDate(
      value
    );

  if (
    !date
  ) {
    return "April 24th, 2027";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month:
        "long",

      day:
        "numeric",

      year:
        "numeric",
    }
  );
}

function formatWeddingDateShort(
  value
) {
  if (
    !value
  ) {
    return "April 24th, 2027";
  }

  return formatWeddingDate(
    value
  );
}

function createLocalDate(
  value
) {
  const [
    year,
    month,
    day,
  ] =
    String(
      value ||
      ""
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

function buildTimeRange(
  startTime,
  endTime
) {
  const start =
    formatTime(
      startTime
    );

  const end =
    formatTime(
      endTime
    );

  if (
    start &&
    end
  ) {
    return `${start}–${end}`;
  }

  return (
    start ||
    end ||
    ""
  );
}

function formatTime(
  value
) {
  if (
    !value
  ) {
    return "";
  }

  const [
    hour,
    minute,
  ] =
    value
      .split(":")
      .map(Number);

  if (
    Number.isNaN(
      hour
    ) ||
    Number.isNaN(
      minute
    )
  ) {
    return "";
  }

  const date =
    new Date();

  date.setHours(
    hour,
    minute,
    0,
    0
  );

  return date.toLocaleTimeString(
    "en-US",
    {
      hour:
        "numeric",

      minute:
        "2-digit",
    }
  );
}

export default Venue;