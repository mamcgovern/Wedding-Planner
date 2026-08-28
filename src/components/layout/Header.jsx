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

const publicLinks = [
  {
    label:
      "Home",

    path:
      "/",

    end:
      true,
  },
  {
    label:
      "Attire",

    path:
      "/attire",
  },
  {
    label:
      "Important Dates",

    path:
      "/important-dates",
  },
  {
    label:
      "Weekend",

    path:
      "/weekend",
  },
];

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
    setMobileOpen(
      false
    );
  }, [
    location.pathname,
  ]);

  useEffect(() => {
    if (
      !mobileOpen
    ) {
      return undefined;
    }

    const handleEscape =
      (event) => {
        if (
          event.key ===
          "Escape"
        ) {
          setMobileOpen(
            false
          );
        }
      };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [
    mobileOpen,
  ]);

  const handleLogout =
    async () => {
      try {
        await signOut();

        setMobileOpen(
          false
        );
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
            aria-label={`${coupleName} wedding home`}
          >
            <span className="site-brand-main">
              {
                coupleName
              }
            </span>

            <span className="site-brand-subtitle">
              {
                weddingDate
              }
            </span>
          </NavLink>

          <nav
            className="desktop-nav"
            aria-label="Main navigation"
          >
            <div className="desktop-public-nav">
              {publicLinks.map(
                (link) => (
                  <NavLink
                    key={
                      link.path
                    }
                    to={
                      link.path
                    }
                    end={
                      link.end
                    }
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
                    {
                      link.label
                    }
                  </NavLink>
                )
              )}
            </div>

            <div className="desktop-admin-nav">
              {user &&
              isAdmin ? (
                <>
                  <NavLink
                    to="/admin"
                    className={({
                      isActive,
                    }) =>
                      `site-admin-link ${
                        isActive
                          ? "active"
                          : ""
                      }`
                    }
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
            </div>
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
            aria-label={
              mobileOpen
                ? "Close navigation"
                : "Open navigation"
            }
            aria-expanded={
              mobileOpen
            }
            aria-controls="mobile-navigation"
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
        <>
          <button
            type="button"
            className="mobile-nav-backdrop"
            onClick={() =>
              setMobileOpen(
                false
              )
            }
            aria-label="Close navigation"
          />

          <nav
            id="mobile-navigation"
            className="mobile-nav"
            aria-label="Mobile navigation"
          >
            <div className="mobile-nav-heading">
              <span>
                Wedding Menu
              </span>

              <span>
                {
                  weddingDate
                }
              </span>
            </div>

            <div className="mobile-public-links">
              {publicLinks.map(
                (link) => (
                  <NavLink
                    key={
                      link.path
                    }
                    to={
                      link.path
                    }
                    end={
                      link.end
                    }
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
                    {
                      link.label
                    }
                  </NavLink>
                )
              )}
            </div>

            <div className="mobile-admin-section">
              <p className="mobile-admin-label">
                Planning
              </p>

              {user &&
              isAdmin ? (
                <>
                  <NavLink
                    to="/admin"
                    className={({
                      isActive,
                    }) =>
                      `mobile-nav-link mobile-admin-link ${
                        isActive
                          ? "active"
                          : ""
                      }`
                    }
                  >
                    Planning Dashboard
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
                  Admin Login
                </NavLink>
              )}
            </div>
          </nav>
        </>
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
    return `${groomFirst} & ${brideFirst}`;
  }

  if (
    groomFirst
  ) {
    return groomFirst;
  }

  if (
    brideFirst
  ) {
    return brideFirst;
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
    String(
      value
    )
      .split("-")
      .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return "Wedding";
  }

  const date =
    new Date(
      year,
      month - 1,
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