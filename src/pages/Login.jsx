import { useState } from "react";
import {
  Heart,
  LoaderCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    setError("");
    setSubmitting(true);

    try {
      await loginWithGoogle();
      navigate("/");
    } catch (firebaseError) {
      console.error(firebaseError);

      if (firebaseError.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled.");
      } else {
        setError("Something went wrong while signing in with Google.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-heart">
            <Heart size={23} strokeWidth={1.5} />
          </div>

          <p className="page-eyebrow">Wedding Planner</p>

          <h1>Welcome</h1>

          <p>
            Sign in to access your shared wedding planner.
          </p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <button
          type="button"
          className="google-button"
          onClick={handleGoogleLogin}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <LoaderCircle
                size={18}
                className="spinner"
              />
              Signing in...
            </>
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.38Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.63-2.39l-3.24-2.51c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.12H3.05v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.94A6 6 0 0 1 6.08 12c0-.67.11-1.33.31-1.94V7.47H3.05A10 10 0 0 0 2 12c0 1.61.38 3.14 1.05 4.53l3.34-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.94c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.96 2.95 14.7 2 12 2a10 10 0 0 0-8.95 5.47l3.34 2.59C7.18 7.7 9.39 5.94 12 5.94Z"
      />
    </svg>
  );
}

export default Login;