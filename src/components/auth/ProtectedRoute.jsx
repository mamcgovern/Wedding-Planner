import { Navigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({ children }) {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-heart">♡</div>
        <p>Loading your wedding planner...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;