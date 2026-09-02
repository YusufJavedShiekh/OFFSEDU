import {
  BookOpen,
  Brain,
  ChevronLeft,
  ClipboardList,
  FileText,
  FolderOpen,
  Home,
  MessageSquare,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigationItems = [
  {
    label: "Home",
    path: "/",
    icon: Home,
  },
  {
    label: "AI Chat",
    path: "/chat",
    icon: MessageSquare,
  },
  {
    label: "Explain",
    path: "/explain",
    icon: Brain,
  },
  {
    label: "Quiz",
    path: "/quiz",
    icon: ClipboardList,
  },
  {
    label: "Test Paper",
    path: "/test-paper",
    icon: FileText,
  },
  {
    label: "Study Plan",
    path: "/study-plan",
    icon: BookOpen,
  },
  {
    label: "Documents",
    path: "/documents",
    icon: FolderOpen,
  },
  {
    label: "File Tools",
    path: "/file-tools",
    icon: Sparkles,
  },
];

function Sidebar({
  collapsed,
  setCollapsed,
  mobileSidebarOpen,
  setMobileSidebarOpen,
}) {
  return (
    <>
      {/* =========================
          DESKTOP SIDEBAR
      ========================== */}
      <aside
        className={`fixed left-0 top-0 z-50 hidden h-screen flex-col border-r border-white/10 bg-[#080b12] transition-all duration-300 lg:flex ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Logo */}
        <div
          className={`flex h-20 shrink-0 items-center border-b border-white/10 ${
            collapsed ? "justify-center" : "justify-between px-5"
          }`}
        >
          {collapsed ? (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-white transition hover:bg-white/[0.1]"
              title="Expand sidebar"
            >
              <Sparkles size={20} />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.07] text-white">
                  <Sparkles size={20} />
                </div>

                <div>
                  <h1 className="text-base font-semibold tracking-wide text-white">
                    OFFSEDU
                  </h1>

                  <p className="text-[10px] uppercase tracking-widest text-slate-500">
                    AI Study Space
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
                title="Collapse sidebar"
              >
                <ChevronLeft size={18} />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {!collapsed && (
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Workspace
            </p>
          )}

          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `group relative flex h-11 items-center rounded-xl transition-all duration-200 ${
                      collapsed ? "justify-center" : "gap-3 px-3"
                    } ${
                      isActive
                        ? "bg-white/[0.08] text-white ring-1 ring-white/10"
                        : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-white" />
                      )}

                      <Icon
                        size={19}
                        strokeWidth={1.8}
                        className={
                          isActive
                            ? "text-white"
                            : "text-slate-500 group-hover:text-slate-300"
                        }
                      />

                      {!collapsed && (
                        <span className="truncate text-sm font-medium">
                          {item.label}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Bottom */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <NavLink
            to="/settings"
            title={collapsed ? "Settings" : undefined}
            className={({ isActive }) =>
              `group relative flex h-11 items-center rounded-xl transition-all duration-200 ${
                collapsed ? "justify-center" : "gap-3 px-3"
              } ${
                isActive
                  ? "bg-white/[0.08] text-white ring-1 ring-white/10"
                  : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-white" />
                )}

                <Settings
                  size={19}
                  strokeWidth={1.8}
                  className={
                    isActive
                      ? "text-white"
                      : "text-slate-500 group-hover:text-slate-300"
                  }
                />

                {!collapsed && (
                  <span className="text-sm font-medium">
                    Settings
                  </span>
                )}
              </>
            )}
          </NavLink>

          {!collapsed && (
            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3">
              <p className="text-[11px] font-medium text-slate-300">
                Local & Private
              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-600">
                Your study workspace is designed to work with local AI.
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* =========================
          MOBILE SIDEBAR
      ========================== */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-white/10 bg-[#080b12] shadow-2xl transition-transform duration-300 lg:hidden ${
          mobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* Mobile Header */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.07] text-white">
              <Sparkles size={20} />
            </div>

            <div>
              <h1 className="text-base font-semibold tracking-wide text-white">
                OFFSEDU
              </h1>

              <p className="text-[10px] uppercase tracking-widest text-slate-500">
                AI Study Space
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Workspace
          </p>

          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex h-11 items-center gap-3 rounded-xl px-3 transition-all duration-200 ${
                      isActive
                        ? "bg-white/[0.08] text-white ring-1 ring-white/10"
                        : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-white" />
                      )}

                      <Icon
                        size={19}
                        strokeWidth={1.8}
                        className={
                          isActive
                            ? "text-white"
                            : "text-slate-500 group-hover:text-slate-300"
                        }
                      />

                      <span className="text-sm font-medium">
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Mobile Bottom */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <NavLink
            to="/settings"
            onClick={() => setMobileSidebarOpen(false)}
            className={({ isActive }) =>
              `group relative flex h-11 items-center gap-3 rounded-xl px-3 transition-all duration-200 ${
                isActive
                  ? "bg-white/[0.08] text-white ring-1 ring-white/10"
                  : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-white" />
                )}

                <Settings
                  size={19}
                  strokeWidth={1.8}
                  className={
                    isActive
                      ? "text-white"
                      : "text-slate-500 group-hover:text-slate-300"
                  }
                />

                <span className="text-sm font-medium">
                  Settings
                </span>
              </>
            )}
          </NavLink>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;