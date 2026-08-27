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

import Budget from "./pages/admin/Budget";
import Calendar from "./pages/admin/Calendar";
import Dashboard from "./pages/admin/Dashboard";
import Pins from "./pages/admin/Pins";
import SeatingChart from "./pages/admin/SeatingChart";
import Settings from "./pages/admin/Settings";
import Tasks from "./pages/admin/Tasks";
import Vendors from "./pages/admin/Vendors";

function ProtectedPage({
  children,
}) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}

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
            <ProtectedPage>
              <Dashboard />
            </ProtectedPage>
          }
        />

        <Route
          path="/admin/tasks"
          element={
            <ProtectedPage>
              <Tasks />
            </ProtectedPage>
          }
        />

        <Route
          path="/admin/calendar"
          element={
            <ProtectedPage>
              <Calendar />
            </ProtectedPage>
          }
        />

        <Route
          path="/admin/budget"
          element={
            <ProtectedPage>
              <Budget />
            </ProtectedPage>
          }
        />

        <Route
          path="/admin/vendors"
          element={
            <ProtectedPage>
              <Vendors />
            </ProtectedPage>
          }
        />

        <Route
          path="/admin/pins"
          element={
            <ProtectedPage>
              <Pins />
            </ProtectedPage>
          }
        />

        <Route
          path="/admin/seating-chart"
          element={
            <ProtectedPage>
              <SeatingChart />
            </ProtectedPage>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedPage>
              <Settings />
            </ProtectedPage>
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