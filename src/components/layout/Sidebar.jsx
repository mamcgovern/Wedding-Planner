import {
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  Heart,
  Home,
  Images,
  Settings,
  TableProperties,
  Users,
  UserRound,
  Clock3,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigationSections = [
  {
    label: null,
    items: [
      {
        name: "Dashboard",
        path: "/",
        icon: Home,
      },
    ],
  },
  {
    label: "Planning",
    items: [
      {
        name: "Tasks",
        path: "/tasks",
        icon: ClipboardCheck,
      },
      {
        name: "Calendar",
        path: "/calendar",
        icon: CalendarDays,
      },
      {
        name: "Pins & Ideas",
        path: "/pins",
        icon: Images,
      },
    ],
  },
  {
    label: "Guests",
    items: [
      {
        name: "Guest List",
        path: "/guests",
        icon: Users,
      },
      {
        name: "Seating Chart",
        path: "/seating-chart",
        icon: TableProperties,
      },
    ],
  },
  {
    label: "Finances",
    items: [
      {
        name: "Budget",
        path: "/budget",
        icon: CircleDollarSign,
      },
      {
        name: "Vendors",
        path: "/vendors",
        icon: UserRound,
      },
    ],
  },
  {
    label: "Wedding",
    items: [
      {
        name: "Timeline",
        path: "/timeline",
        icon: Clock3,
      },
      {
        name: "Files",
        path: "/files",
        icon: FileText,
      },
    ],
  },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Heart className="sidebar-brand-icon" size={20} strokeWidth={1.6} />

        <div>
          <p className="sidebar-brand-title">Wedding Planner</p>
          <p className="sidebar-brand-subtitle">Maddie & Nick</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navigationSections.map((section, index) => (
          <div className="sidebar-section" key={section.label ?? index}>
            {section.label && (
              <p className="sidebar-section-label">{section.label}</p>
            )}

            <div className="sidebar-links">
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      `sidebar-link${isActive ? " active" : ""}`
                    }
                  >
                    <Icon size={18} strokeWidth={1.7} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `sidebar-link${isActive ? " active" : ""}`
          }
        >
          <Settings size={18} strokeWidth={1.7} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;