import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import SiteLayout from "./components/layout/SiteLayout";

import Attire from "./pages/Attire";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Timeline from "./pages/Timeline";
import Weekend from "./pages/Weekend";

import Dashboard from "./pages/admin/Dashboard";

function App() {
  return (
    <Routes>
      <Route
        element={
          <SiteLayout />
        }
      >
        <Route
          path="/"
          element={
            <Home />
          }
        />

        <Route
          path="/attire"
          element={
            <Attire />
          }
        />

        <Route
          path="/timeline"
          element={
            <Timeline />
          }
        />

        <Route
          path="/weekend"
          element={
            <Weekend />
          }
        />

        <Route
          path="/login"
          element={
            <Login />
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;