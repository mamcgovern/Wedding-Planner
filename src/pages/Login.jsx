import {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LockKeyhole,
  LogIn,
  LogOut,
} from "lucide-react";

import {
  useAuth,
} from "../context/AuthContext";

function Login() {
  const {
    user,
    isAdmin,
    loading,
    authError,
    signInWithGoogle,
    signOut,
  } = useAuth();

  const location =
    useLocation();

  const navigate =
    useNavigate();

  const [
    signingIn,
    setSigningIn,
  ] = useState(false);

  const [
    localError,
    setLocalError,
  ] = useState("");

  /*
   * IF SOMEONE CAME HERE FROM
   * A PROTECTED PAGE, SEND THEM
   * BACK THERE AFTER LOGIN.
   */

  const destination =
    location.state?.from ||
    "/admin";

  /*
   * APPROVED ADMIN ALREADY SIGNED IN
   */

  if (
    !loading &&
    user &&
    isAdmin
  ) {
    return (
      <Navigate
        to={
          destination
        }
        replace
      />
    );
  }

  const handleSignIn =
    async () => {
      setSigningIn(
        true
      );

      setLocalError(
        ""
      );

      try {
        await signInWithGoogle();

        /*
         * AuthContext will verify the
         * admin record after Firebase
         * updates the current user.
         *
         * We don't manually grant
         * access here.
         */
      } catch {
        setLocalError(
          "Google sign-in was not completed."
        );
      } finally {
        setSigningIn(
          false
        );
      }
    };

  const handleSignOut =
    async () => {
      setLocalError(
        ""
      );

      try {
        await signOut();
      } catch {
        setLocalError(
          "We couldn't sign you out."
        );
      }
    };

  /*
   * WAITING FOR FIREBASE
   */

  if (
    loading
  ) {
    return (
      <main className="page login-page">
        <section className="login-card">
          <div className="login-icon">
            <LockKeyhole
              size={25}
            />
          </div>

          <p className="page-eyebrow">
            Wedding Planning
          </p>

          <h1>
            Checking Access
          </h1>

          <p className="login-description">
            Just a moment while we check your planning
            access.
          </p>
        </section>
      </main>
    );
  }

  /*
   * SIGNED IN BUT NOT AUTHORIZED
   */

  if (
    user &&
    !isAdmin
  ) {
    return (
      <main className="page login-page">
        <section className="login-card">
          <div className="login-icon">
            <LockKeyhole
              size={25}
            />
          </div>

          <p className="page-eyebrow">
            Wedding Planning
          </p>

          <h1>
            Planning Access Required
          </h1>

          <p className="login-description">
            You're signed in as
          </p>

          <div className="login-current-user">
            {user.photoURL && (
              <img
                src={
                  user.photoURL
                }
                alt=""
              />
            )}

            <div>
              {user.displayName && (
                <strong>
                  {user.displayName}
                </strong>
              )}

              <span>
                {user.email}
              </span>
            </div>
          </div>

          <div className="login-access-message">
            <LockKeyhole
              size={17}
            />

            <p>
              This Google account does not have access
              to the private wedding planning area.
            </p>
          </div>

          <div className="login-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate(
                  "/"
                )
              }
            >
              Back to Wedding Site
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={
                handleSignOut
              }
            >
              <LogOut
                size={16}
              />

              Sign Out
            </button>
          </div>

          {(localError ||
            authError) && (
            <div className="auth-error">
              {localError ||
                authError}
            </div>
          )}
        </section>
      </main>
    );
  }

  /*
   * SIGNED OUT
   */

  return (
    <main className="page login-page">
      <section className="login-card">
        <div className="login-icon">
          <LockKeyhole
            size={25}
          />
        </div>

        <p className="page-eyebrow">
          Wedding Planning
        </p>

        <h1>
          Planner Login
        </h1>

        <p className="login-description">
          Sign in with an approved Google account to
          access the private wedding planning tools.
        </p>

        <button
          type="button"
          className="primary-button login-google-button"
          onClick={
            handleSignIn
          }
          disabled={
            signingIn
          }
        >
          <LogIn
            size={17}
          />

          {signingIn
            ? "Signing In..."
            : "Continue with Google"}
        </button>

        {(localError ||
          authError) && (
          <div className="auth-error">
            {localError ||
              authError}
          </div>
        )}
      </section>
    </main>
  );
}

export default Login;