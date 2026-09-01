import {
  BedDouble,
  CalendarDays,
  CircleDollarSign,
  Images,
  ListChecks,
  MapPinned,
  Music2,
  Settings,
  Shirt,
  Store,
  UsersRound,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

const planningTools = [
  {
    title:
      "Tasks",

    description:
      "Planning tasks, deadlines, and public wedding-party reminders.",

    path:
      "/admin/tasks",

    icon:
      ListChecks,
  },
  {
    title:
      "Calendar",

    description:
      "Events, schedules, subevents, and your wedding planning calendar.",

    path:
      "/admin/calendar",

    icon:
      CalendarDays,
  },
  {
    title:
      "Photos",

    description:
      "Create photo albums, upload photos, manage guest uploads, and control album visibility.",

    path:
      "/admin/photos",

    icon:
      Images,
  },
  {
    title:
      "Attire",

    description:
      "Manage wedding-party outfits, colors, shoes, and attire assignments.",

    path:
      "/admin/attire",

    icon:
      Shirt,
  },
  {
    title:
      "Music",

    description:
      "Prelude music, ceremony songs, special dances, and reception music.",

    path:
      "/admin/music",

    icon:
      Music2,
  },
  {
    title:
      "Sleeping Arrangements",

    description:
      "Manage rooms, sleeping spaces, assignments, and hotel information.",

    path:
      "/admin/sleeping",

    icon:
      BedDouble,
  },
  {
    title:
      "Budget",

    description:
      "Track wedding spending, estimates, and payments.",

    path:
      "/admin/budget",

    icon:
      CircleDollarSign,
  },
  {
    title:
      "Vendors",

    description:
      "Keep vendor contact information and planning details together.",

    path:
      "/admin/vendors",

    icon:
      Store,
  },
  {
    title:
      "Pins",

    description:
      "Save inspiration, links, photos, and ideas for the wedding.",

    path:
      "/admin/pins",

    icon:
      MapPinned,
  },
  {
    title:
      "Seating Chart",

    description:
      "Organize guests and build your reception seating arrangement.",

    path:
      "/admin/seating-chart",

    icon:
      UsersRound,
  },
  {
    title:
      "Settings",

    description:
      "Update wedding details used throughout the website.",

    path:
      "/admin/settings",

    icon:
      Settings,
  },
];

function Dashboard() {
  return (
    <main className="page admin-dashboard">
      <p className="page-eyebrow">
        Wedding Planner
      </p>

      <h1 className="page-title">
        Planning
      </h1>

      <p className="page-description">
        Manage the private planning side of the wedding
        and the information shared with the wedding party.
      </p>

      <div className="admin-dashboard-grid">
        {planningTools.map(
          (tool) => {
            const Icon =
              tool.icon;

            return (
              <Link
                key={
                  tool.path
                }
                to={
                  tool.path
                }
                className="admin-dashboard-card"
              >
                <div className="admin-dashboard-icon">
                  <Icon
                    size={22}
                  />
                </div>

                <div>
                  <h2>
                    {tool.title}
                  </h2>

                  <p>
                    {tool.description}
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

export default Dashboard;