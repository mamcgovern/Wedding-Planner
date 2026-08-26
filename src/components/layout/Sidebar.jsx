import {
  CalendarDays,
  CircleDollarSign,
  FileText,
  Heart,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Pin,
  Settings,
  TableProperties,
  Users,
  UserRoundCheck,
  X,
} from "lucide-react";

import {
  NavLink,
  useLocation,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import { useAuth } from "../../context/AuthContext";

const navigationGroups = [
  {
    label: "Planning",
    items: [
      {
        label: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
        end: true,
      },
      {
        label: "Tasks",
        path: "/tasks",
        icon: ListTodo,
      },
      {
        label: "Calendar",
        path: "/calendar",
        icon: CalendarDays,
      },
      {
        label: "Pins",
        path: "/pins",
        icon: Pin,
      },
    ],
  },
  {
    label: "Guests",
    items: [
      {
        label: "Guest List",
        path: "/guests",
        icon: Users,
      },
      {
        label: "Seating Chart",
        path: "/seating-chart",
        icon: TableProperties,
      },
    ],
  },
  {
    label: "Wedding",
    items: [
      {
        label: "Budget",
        path: "/budget",
        icon: CircleDollarSign,
      },
      {
        label: "Vendors",
        path: "/vendors",
        icon: UserRoundCheck,
      },
      {
        label: "Timeline",
        path: "/timeline",
        icon: CalendarDays,
      },
      {
        label: "Files",
        path: "/files",
        icon: FileText,
      },
    ],
  },
];

function Sidebar() {
  const { user, logout } =
    useAuth();

  const location =
    useLocation();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  /*
   * CLOSE MOBILE MENU
   * AFTER NAVIGATION
   */

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /*
   * PREVENT BACKGROUND
   * SCROLL WHEN OPEN
   */

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow =
        "";

      return;
    }

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [mobileOpen]);

  const handleLogout =
    async () => {
      try {
        await logout();
      } catch (error) {
        console.error(
          "Error signing out:",
          error
        );
      }
    };

  return (
    <>
      <header className="mobile-app-header">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={() =>
            setMobileOpen(true)
          }
          aria-label="Open navigation"
          aria-expanded={
            mobileOpen
          }
        >
          <Menu
            size={21}
          />
        </button>

        <NavLink
          to="/"
          className="mobile-app-brand"
        >
          <Heart
            size={17}
            fill="currentColor"
          />

          <div>
            <strong>
              Wedding Planner
            </strong>

            <span>
              Our wedding
            </span>
          </div>
        </NavLink>

        <div className="mobile-header-spacer" />
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() =>
            setMobileOpen(false)
          }
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`sidebar ${
          mobileOpen
            ? "sidebar-mobile-open"
            : ""
        }`}
      >
        <div className="sidebar-header">
          <NavLink
            to="/"
            className="sidebar-brand"
          >
            <div className="sidebar-brand-icon">
              <Heart
                size={19}
                fill="currentColor"
              />
            </div>

            <div className="sidebar-brand-text">
              <strong>
                Wedding Planner
              </strong>

              <span>
                Planning together
              </span>
            </div>
          </NavLink>

          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={() =>
              setMobileOpen(false)
            }
            aria-label="Close navigation"
          >
            <X
              size={20}
            />
          </button>
        </div>

        <nav className="sidebar-navigation">
          {navigationGroups.map(
            (group) => (
              <div
                className="sidebar-nav-group"
                key={
                  group.label
                }
              >
                <span className="sidebar-nav-label">
                  {group.label}
                </span>

                <div className="sidebar-nav-items">
                  {group.items.map(
                    (item) => {
                      const Icon =
                        item.icon;

                      return (
                        <NavLink
                          key={
                            item.path
                          }
                          to={
                            item.path
                          }
                          end={
                            item.end
                          }
                          className={({
                            isActive,
                          }) =>
                            `sidebar-nav-link ${
                              isActive
                                ? "active"
                                : ""
                            }`
                          }
                        >
                          <span className="sidebar-nav-icon">
                            <Icon
                              size={17}
                            />
                          </span>

                          <span>
                            {
                              item.label
                            }
                          </span>
                        </NavLink>
                      );
                    }
                  )}
                </div>
              </div>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `sidebar-nav-link sidebar-settings-link ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <span className="sidebar-nav-icon">
              <Settings
                size={17}
              />
            </span>

            <span>
              Settings
            </span>
          </NavLink>

          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {getInitial(
                user
              )}
            </div>

            <div className="sidebar-user-info">
              <strong>
                {getUserName(
                  user
                )}
              </strong>

              <span>
                {user?.email ||
                  ""}
              </span>
            </div>

            <button
              type="button"
              className="sidebar-logout-button"
              onClick={
                handleLogout
              }
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut
                size={16}
              />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function getUserName(
  user
) {
  if (
    user?.displayName
  ) {
    return user.displayName;
  }

  if (
    user?.email
  ) {
    return user.email.split(
      "@"
    )[0];
  }

  return "Planner";
}

function getInitial(
  user
) {
  const name =
    getUserName(user);

  return (
    name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() ||
    "W"
  );
}

export default Sidebar;