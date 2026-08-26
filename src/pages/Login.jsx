import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useState,
} from "react";

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

  const from =
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

  const handleGoogleLogin =
    async () => {
      setLoading(true);
      setError("");

      try {
        await loginWithGoogle();

        navigate(
          from,
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
      <div className="login-card content-card">
        <p className="page-eyebrow">
          Admin
        </p>

        <h1 className="page-title">
          Planner Login
        </h1>

        <p className="page-description">
          Sign in with Google to
          access planning tools and
          edit wedding information.
        </p>

        {error && (
          <p className="login-error">
            {error}
          </p>
        )}

        <button
          type="button"
          className="primary-button google-login-button"
          onClick={
            handleGoogleLogin
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
    </main>
  );
}

export default Login;