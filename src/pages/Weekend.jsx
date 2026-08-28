import {
  ArrowRight,
  BedDouble,
  MapPin,
  Music2,
  Rows3,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

const weekendPages = [
  {
    eyebrow:
      "Schedule",

    title:
      "Weekend Timeline",

    description:
      "Rehearsal plans, wedding-day details, and the full schedule for the weekend.",

    path:
      "/weekend/timeline",

    icon:
      Rows3,
  },
  {
    eyebrow:
      "Soundtrack",

    title:
      "Music",

    description:
      "Ceremony music, reception songs, and the playlist for the weekend.",

    path:
      "/weekend/music",

    icon:
      Music2,
  },
  {
    eyebrow:
      "Location",

    title:
      "Venue",

    description:
      "Photos, directions, and helpful information about the wedding venue.",

    path:
      "/weekend/venue",

    icon:
      MapPin,
  },
  {
    eyebrow:
      "Staying With Us",

    title:
      "Sleeping Arrangements",

    description:
      "Rooms, beds, and sleeping assignments for anyone staying at the venue house.",

    path:
      "/weekend/sleeping",

    icon:
      BedDouble,
  },
];

function Weekend() {
  return (
    <main className="page weekend-page">
      <header className="weekend-heading">
        <p className="page-eyebrow">
          Wedding Weekend
        </p>

        <h1 className="page-title">
          Weekend
        </h1>

        <p className="page-description">
          Everything you need for the wedding weekend,
          including the schedule, venue, music, and
          sleeping arrangements.
        </p>
      </header>

      <div className="weekend-grid">
        {weekendPages.map(
          (item) => {
            const Icon =
              item.icon;

            return (
              <Link
                key={
                  item.path
                }
                to={
                  item.path
                }
                className="weekend-card"
              >
                <div className="weekend-card-icon">
                  <Icon
                    size={22}
                  />
                </div>

                <div className="weekend-card-content">
                  <p className="card-eyebrow">
                    {
                      item.eyebrow
                    }
                  </p>

                  <h2>
                    {
                      item.title
                    }
                  </h2>

                  <p>
                    {
                      item.description
                    }
                  </p>

                  <span className="weekend-card-link">
                    View Details

                    <ArrowRight
                      size={16}
                    />
                  </span>
                </div>
              </Link>
            );
          }
        )}
      </div>

      <section className="weekend-note">
        <p className="card-eyebrow">
          April 23–25, 2027
        </p>

        <h2>
          A Full Weekend Together
        </h2>

        <p>
          Check back here as the wedding gets closer for
          any updates to the weekend schedule or other
          important details.
        </p>
      </section>
    </main>
  );
}

export default Weekend;