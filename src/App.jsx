import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import SiteLayout from "./components/layout/SiteLayout";

import Attire from "./pages/Attire";
import AttireAssignments from "./pages/AttireAssignments";
import Home from "./pages/Home";
import ImportantDates from "./pages/ImportantDates";
import Login from "./pages/Login";
import SelectedOutfits from "./pages/SelectedOutfits";
import Weekend from "./pages/Weekend";

import Music from "./pages/weekend/Music";
import SleepingArrangements from "./pages/weekend/SleepingArrangements";
import Venue from "./pages/weekend/Venue";
import WeekendTimeline from "./pages/weekend/WeekendTimeline";

import AttireAdmin from "./pages/admin/AttireAdmin";
import Budget from "./pages/admin/Budget";
import Calendar from "./pages/admin/Calendar";
import Dashboard from "./pages/admin/Dashboard";
import Guests from "./pages/admin/Guests";
import Inventory from "./pages/admin/Inventory";
import MusicAdmin from "./pages/admin/MusicAdmin";
import Pins from "./pages/admin/Pins";
import SeatingChart from "./pages/admin/SeatingChart";
import Settings from "./pages/admin/Settings";
import SleepingAdmin from "./pages/admin/SleepingAdmin";
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
          path="/attire/assignments"
          element={
            <AttireAssignments />
          }
        />

        <Route
          path="/attire/selected"
          element={
            <SelectedOutfits />
          }
        />

        <Route
          path="/important-dates"
          element={
            <ImportantDates />
          }
        />

        <Route
          path="/weekend"
          element={
            <Weekend />
          }
        />

        <Route
          path="/weekend/timeline"
          element={
            <WeekendTimeline />
          }
        />

        <Route
          path="/weekend/events"
          element={
            <Navigate
              to="/weekend/timeline"
              replace
            />
          }
        />

        <Route
          path="/weekend/wedding-day"
          element={
            <Navigate
              to="/weekend/timeline"
              replace
            />
          }
        />

        <Route
          path="/weekend/music"
          element={
            <Music />
          }
        />

        <Route
          path="/weekend/venue"
          element={
            <Venue />
          }
        />

        <Route
          path="/weekend/sleeping"
          element={
            <SleepingArrangements />
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
          path="/admin/attire"
          element={
            <ProtectedPage>
              <AttireAdmin />
            </ProtectedPage>
          }
        />

        <Route
          path="/admin/music"
          element={
            <ProtectedPage>
              <MusicAdmin />
            </ProtectedPage>
          }
        />

        <Route
          path="/admin/sleeping"
          element={
            <ProtectedPage>
              <SleepingAdmin />
            </ProtectedPage>
          }
        />

        <Route
          path="/admin/guests"
          element={
            <ProtectedPage>
              <Guests />
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
          path="/admin/inventory"
          element={
            <ProtectedPage>
              <Inventory />
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