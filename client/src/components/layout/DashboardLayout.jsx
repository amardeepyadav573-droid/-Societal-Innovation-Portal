import { useState } from "react";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import AIChatbot from "../ai/AIChatbot";
import "./DashboardLayout.css";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen((current) => !current);
  };

  return (
    <div
      className={`dashboard-shell ${
        sidebarOpen ? "sidebar-open" : "sidebar-closed"
      }`}
    >
      <Navbar
        onMenu={toggleSidebar}
        sidebarOpen={sidebarOpen}
      />

      <Sidebar
        open={sidebarOpen}
        onClose={closeSidebar}
      />

      <main className="dashboard-main">
        {children}
      </main>

      <AIChatbot />
    </div>
  );
}