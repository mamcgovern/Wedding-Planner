import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  LoaderCircle,
} from "lucide-react";

import {
  useAuth,
} from "../../context/AuthContext";

function ProtectedRoute({
  children,
}) {
  const {
    user,
    isAdmin,
    loading,
  } = useAuth();

  const location =
    useLocation();

  /*
   * WAIT UNTIL BOTH FIREBASE AUTH
   * AND ADMIN AUTHORIZATION HAVE
   * FINISHED LOADING.
   */

  if (
    loading
  ) {
    return (
      <main className="page protected-route-loading">
        <LoaderCircle
          size={28}
          className="spinner"
        />

        <p>
          Checking planning access...
        </p>
      </main>
    );
  }

  /*
   * NOT SIGNED IN
   */

  if (
    !user
  ) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    );
  }

  /*
   * SIGNED IN, BUT NOT AN
   * APPROVED WEDDING ADMIN
   */

  if (
    !isAdmin
  ) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          unauthorized:
            true,
        }}
      />
    );
  }

  /*
   * APPROVED ADMIN
   */

  return children;
}

export default ProtectedRoute;