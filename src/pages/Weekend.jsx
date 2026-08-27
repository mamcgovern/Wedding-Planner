import {
  BedDouble,
  CalendarDays,
  MapPin,
  Music2,
  PartyPopper,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

const weekendPages = [
  {
    title: "Weekend Events",
    description:
      "Rehearsal, dinner, wedding events, and other plans for the weekend.",
    path: "/weekend/events",
    icon: PartyPopper,
  },
  {
    title: "Wedding Day Schedule",
    description:
      "A detailed wedding-day schedule for the wedding party.",
    path: "/weekend/wedding-day",
    icon: CalendarDays,
  },
  {
    title: "Music",
    description:
      "Ceremony music, reception songs, and other wedding music.",
    path: "/weekend/music",
    icon: Music2,
  },
  {
    title: "Venue",
    description:
      "Photos, directions, and helpful information about the wedding venue.",
    path: "/weekend/venue",
    icon: MapPin,
  },
  {
    title: "Sleeping Arrangements",
    description:
      "Airbnb rooms, beds, and sleeping assignments for the wedding weekend.",
    path: "/weekend/sleeping",
    icon: BedDouble,
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