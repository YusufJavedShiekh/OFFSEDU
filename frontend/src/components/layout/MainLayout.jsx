import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100">

      {/* SIDEBAR */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
      />

      {/* MOBILE OVERLAY */}
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* MAIN AREA */}
      <div
        className={`min-h-screen transition-all duration-300 ${
          collapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {/* NAVBAR */}
        <Navbar
          onMobileMenuClick={toggleMobileSidebar}
        />

        {/* PAGE CONTENT */}
        <main className="min-h-[calc(100vh-80px)]">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;