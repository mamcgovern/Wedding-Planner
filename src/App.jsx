import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";

import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import Pins from "./pages/Pins";
import Guests from "./pages/Guests";
import SeatingChart from "./pages/SeatingChart";
import Budget from "./pages/Budget";
import Vendors from "./pages/Vendors";
import Timeline from "./pages/Timeline";
import Files from "./pages/Files";
import Settings from "./pages/Settings";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/pins" element={<Pins />} />
        <Route path="/guests" element={<Guests />} />
        <Route path="/seating-chart" element={<SeatingChart />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/files" element={<Files />} />
        <Route path="/settings" element={<Settings />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;