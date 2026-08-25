import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;