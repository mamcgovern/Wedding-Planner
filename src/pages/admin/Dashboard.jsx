import {
  CalendarDays,
  CircleDollarSign,
  ListTodo,
  Pin,
  Settings,
  TableProperties,
  UserRoundCheck,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

const planningLinks = [
  {
    title: "Tasks",
    description:
      "Manage planning tasks and public wedding-party deadlines.",
    path: "/admin/tasks",
    icon: ListTodo,
  },
  {
    title: "Calendar",
    description:
      "Manage tasks, events, and shared wedding-party dates.",
    path: "/admin/calendar",
    icon: CalendarDays,
  },
  {
    title: "Budget",
    description:
      "Track costs, payments, and balances.",
    path: "/admin/budget",
    icon: CircleDollarSign,
  },
  {
    title: "Vendors",
    description:
      "Keep vendor information and notes together.",
    path: "/admin/vendors",
    icon: UserRoundCheck,
  },
  {
    title: "Pins",
    description:
      "Save inspiration, links, and ideas.",
    path: "/admin/pins",
    icon: Pin,
  },
  {
    title: "Seating Chart",
    description:
      "Organize guests and table assignments.",
    path: "/admin/seating-chart",
    icon: TableProperties,
  },
  {
    title: "Settings",
    description:
      "Manage wedding details and website settings.",
    path: "/admin/settings",
    icon: Settings,
  },
];

function Dashboard() {
  return (
    <main className="page">
      <p className="page-eyebrow">
        Planning
      </p>

      <h1 className="page-title">
        Admin Dashboard
      </h1>

      <p className="page-description">
        Manage the private planning side of the
        wedding website.
      </p>

      <div className="admin-dashboard-grid">
        {planningLinks.map(
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
                className="admin-dashboard-card"
              >
                <div className="admin-dashboard-icon">
                  <Icon
                    size={20}
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

export default Dashboard;