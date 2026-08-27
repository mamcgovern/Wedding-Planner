import {
  LogOut,
  Menu,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  NavLink,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

function Header() {
  const {
    user,
    logout,
  } = useAuth();

  const location =
    useLocation();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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
      <header className="site-header">
        <div className="site-header-inner">
          <NavLink
            to="/"
            className="site-brand"
          >
            <span className="site-brand-main">
              Maddie & Nick
            </span>

            <span className="site-brand-subtitle">
              April 24, 2027
            </span>
          </NavLink>

          <nav className="desktop-nav">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `site-nav-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/attire"
              className={({ isActive }) =>
                `site-nav-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              Attire
            </NavLink>

            <NavLink
              to="/timeline"
              className={({ isActive }) =>
                `site-nav-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              Timeline
            </NavLink>

            <NavLink
              to="/weekend"
              className={({ isActive }) =>
                `site-nav-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              Weekend
            </NavLink>

            {user ? (
              <>
                <NavLink
                  to="/admin"
                  className="site-admin-link"
                >
                  Planning
                </NavLink>

                <button
                  type="button"
                  className="site-logout-button"
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
              </>
            ) : (
              <NavLink
                to="/login"
                className="site-admin-link"
              >
                Admin
              </NavLink>
            )}
          </nav>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() =>
              setMobileOpen(
                (current) =>
                  !current
              )
            }
            aria-label="Toggle navigation"
            aria-expanded={
              mobileOpen
            }
          >
            {mobileOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <nav className="mobile-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `mobile-nav-link ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/attire"
            className={({ isActive }) =>
              `mobile-nav-link ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            Attire
          </NavLink>

          <NavLink
            to="/timeline"
            className={({ isActive }) =>
              `mobile-nav-link ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            Timeline
          </NavLink>

          <NavLink
            to="/weekend"
            className={({ isActive }) =>
              `mobile-nav-link ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            Weekend
          </NavLink>

          {user ? (
            <>
              <NavLink
                to="/admin"
                className="mobile-nav-link mobile-admin-link"
              >
                Planning
              </NavLink>

              <button
                type="button"
                className="mobile-nav-link mobile-logout-link"
                onClick={
                  handleLogout
                }
              >
                <LogOut
                  size={16}
                />

                Sign Out
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="mobile-nav-link mobile-admin-link"
            >
              Admin
            </NavLink>
          )}
        </nav>
      )}
    </>
  );
}

export default Header;