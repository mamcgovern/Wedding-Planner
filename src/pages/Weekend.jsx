import {
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
    title:
      "Music",

    description:
      "Ceremony music, reception songs, and other wedding music.",

    path:
      "/weekend/music",

    icon:
      Music2,
  },
  {
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
    title:
      "Sleeping Arrangements",

    description:
      "Rooms, beds, and sleeping assignments for the wedding weekend.",

    path:
      "/weekend/sleeping",

    icon:
      BedDouble,
  },
];

function Weekend() {
  return (
    <main className="page weekend-page">
      <p className="page-eyebrow">
        Wedding Weekend
      </p>

      <h1 className="page-title">
        Weekend
      </h1>

      <p className="page-description">
        Everything the wedding party needs to know for
        the wedding weekend, all in one place.
      </p>

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
                    size={21}
                  />
                </div>

                <div>
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
                </div>
              </Link>
            );
          }
        )}
      </div>
    </main>
  );
}

export default Weekend;