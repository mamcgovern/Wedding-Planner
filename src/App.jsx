import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import SiteLayout from "./components/layout/SiteLayout";

import Attire from "./pages/Attire";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Timeline from "./pages/Timeline";
import Weekend from "./pages/Weekend";

function App() {
  return (
    <Routes>
      <Route
        element={<SiteLayout />}
      >
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/attire"
          element={<Attire />}
        />

        <Route
          path="/timeline"
          element={<Timeline />}
        />

        <Route
          path="/weekend"
          element={<Weekend />}
        />

        <Route
          path="/login"
          element={<Login />}
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