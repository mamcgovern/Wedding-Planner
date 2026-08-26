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
  useAuth,
} from "../context/AuthContext";

function Login() {
  const {
    user,
    login,
  } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

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

  useEffect(() => {
    setError("");
  }, [
    email,
    password,
  ]);

  if (user) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setLoading(true);
      setError("");

      try {
        await login(
          email.trim(),
          password
        );

        navigate(
          from,
          {
            replace: true,
          }
        );
      } catch (firebaseError) {
        console.error(
          "Login error:",
          firebaseError
        );

        setError(
          "We couldn't sign you in. Check your email and password and try again."
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
          Sign in to access planning
          tools and edit wedding
          information.
        </p>

        <form
          className="login-form"
          onSubmit={
            handleSubmit
          }
        >
          <label className="form-field">
            <span>
              Email
            </span>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              autoComplete="email"
              required
            />
          </label>

          <label className="form-field">
            <span>
              Password
            </span>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p className="login-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading
              ? "Signing In..."
              : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default Login;