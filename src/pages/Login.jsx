import {
  useState,
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

function Login() {
  const {
    user,
    loginWithGoogle,
  } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const destination =
    location.state?.from ||
    "/admin";

  if (user) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  const handleLogin =
    async () => {
      setLoading(true);
      setError("");

      try {
        await loginWithGoogle();

        navigate(
          destination,
          {
            replace: true,
          }
        );
      } catch (firebaseError) {
        console.error(
          "Google login error:",
          firebaseError
        );

        setError(
          "We couldn't sign you in with Google. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <main className="page login-page">
      <div className="login-panel">
        <div className="login-copy">
          <p className="page-eyebrow">
            Admin
          </p>

          <h1 className="page-title">
            Wedding Planning
          </h1>

          <p className="page-description">
            Sign in to manage the private planning
            side of the wedding website.
          </p>
        </div>

        <div className="content-card login-card">
          <p className="card-eyebrow">
            Private Access
          </p>

          <h2>
            Admin Login
          </h2>

          <p>
            Use your Google account to access the
            wedding planner.
          </p>

          {error && (
            <p className="login-error">
              {error}
            </p>
          )}

          <button
            type="button"
            className="primary-button"
            onClick={
              handleLogin
            }
            disabled={
              loading
            }
          >
            {loading
              ? "Signing In..."
              : "Continue with Google"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default Login;