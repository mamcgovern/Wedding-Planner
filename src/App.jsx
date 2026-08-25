import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

import Budget from "./pages/Budget";
import Calendar from "./pages/Calendar";
import Dashboard from "./pages/Dashboard";
import Files from "./pages/Files";
import Guests from "./pages/Guests";
import Login from "./pages/Login";
import Pins from "./pages/Pins";
import SeatingChart from "./pages/SeatingChart";
import Settings from "./pages/Settings";
import Tasks from "./pages/Tasks";
import Timeline from "./pages/Timeline";
import Vendors from "./pages/Vendors";

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/tasks"
          element={<Tasks />}
        />

        <Route
          path="/calendar"
          element={<Calendar />}
        />

        <Route
          path="/pins"
          element={<Pins />}
        />

        <Route
          path="/guests"
          element={<Guests />}
        />

        <Route
          path="/seating-chart"
          element={<SeatingChart />}
        />

        <Route
          path="/budget"
          element={<Budget />}
        />

        <Route
          path="/vendors"
          element={<Vendors />}
        />

        <Route
          path="/timeline"
          element={<Timeline />}
        />

        <Route
          path="/files"
          element={<Files />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;