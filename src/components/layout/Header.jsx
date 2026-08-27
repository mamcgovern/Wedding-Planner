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

import {
  useWedding,
} from "../../context/WeddingContext";

function Header() {
  const {
    user,
    isAdmin,
    signOut,
  } = useAuth();

  const {
    wedding,
  } = useWedding();

  const location =
    useLocation();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [
    location.pathname,
  ]);

  const handleLogout =
    async () => {
      try {
        await signOut();
      } catch (error) {
        console.error(
          "Error signing out:",
          error
        );
      }
    };

  const coupleName =
    buildCoupleName(
      wedding.brideName,
      wedding.groomName
    );

  const weddingDate =
    formatWeddingDate(
      wedding.weddingDate
    );

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <NavLink
            to="/"
            className="site-brand"
          >
            <span className="site-brand-main">
              {coupleName}
            </span>

            <span className="site-brand-subtitle">
              {weddingDate}
            </span>
          </NavLink>

          <nav className="desktop-nav">
            <NavLink
              to="/"
              end
              className={({
                isActive,
              }) =>
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
              className={({
                isActive,
              }) =>
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
              to="/important-dates"
              className={({
                isActive,
              }) =>
                `site-nav-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              Important Dates
            </NavLink>

            <NavLink
              to="/weekend"
              className={({
                isActive,
              }) =>
                `site-nav-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              Weekend
            </NavLink>

            {user && isAdmin ? (
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
            ) : user ? (
              <>
                <NavLink
                  to="/login"
                  className="site-admin-link"
                >
                  Access
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
              <X
                size={22}
              />
            ) : (
              <Menu
                size={22}
              />
            )}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <nav className="mobile-nav">
          <NavLink
            to="/"
            end
            className={({
              isActive,
            }) =>
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
            className={({
              isActive,
            }) =>
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
            to="/important-dates"
            className={({
              isActive,
            }) =>
              `mobile-nav-link ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            Important Dates
          </NavLink>

          <NavLink
            to="/weekend"
            className={({
              isActive,
            }) =>
              `mobile-nav-link ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            Weekend
          </NavLink>

          {user && isAdmin ? (
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
          ) : user ? (
            <>
              <NavLink
                to="/login"
                className="mobile-nav-link mobile-admin-link"
              >
                Access
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

function buildCoupleName(
  brideName,
  groomName
) {
  const brideFirst =
    getFirstName(
      brideName
    );

  const groomFirst =
    getFirstName(
      groomName
    );

  if (
    brideFirst &&
    groomFirst
  ) {
    return `${brideFirst} & ${groomFirst}`;
  }

  if (
    brideFirst
  ) {
    return brideFirst;
  }

  if (
    groomFirst
  ) {
    return groomFirst;
  }

  return "Our Wedding";
}

function getFirstName(
  value
) {
  return String(
    value ||
    ""
  )
    .trim()
    .split(
      /\s+/
    )[0];
}

function formatWeddingDate(
  value
) {
  if (
    !value
  ) {
    return "Wedding";
  }

  const [
    year,
    month,
    day,
  ] =
    value
      .split(
        "-"
      )
      .map(
        Number
      );

  const date =
    new Date(
      year,
      month -
        1,
      day
    );

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

export default Header;