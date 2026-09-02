import {
  Bell,
  Check,
  ChevronDown,
  Globe2,
  LogIn,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const languages = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "mr", label: "Marathi" },
  { code: "ur", label: "Urdu" },
];

const searchItems = [
  { title: "Home", path: "/" },
  { title: "AI Chat", path: "/chat" },
  { title: "Explain", path: "/explain" },
  { title: "Quiz", path: "/quiz" },
  { title: "Test Paper", path: "/test-paper" },
  { title: "Study Plan", path: "/study-plan" },
  { title: "Documents", path: "/documents" },
  { title: "File Tools", path: "/file-tools" },
  { title: "Profile", path: "/profile" },
  { title: "Settings", path: "/settings" },
];

const initialNotifications = [
  {
    id: 1,
    title: "Welcome to OFFSEDU",
    message: "Your local AI study workspace is ready.",
    read: false,
  },
  {
    id: 2,
    title: "Study Plan",
    message: "Create a personalized study plan.",
    read: false,
  },
  {
    id: 3,
    title: "Documents",
    message: "Upload your study materials to get started.",
    read: true,
  },
];

function getPageTitle(pathname) {
  const page = searchItems.find((item) => item.path === pathname);
  return page?.title || "OFFSEDU";
}

function Navbar({ onMobileMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [languageOpen, setLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState(
    initialNotifications,
  );

  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useRef(null);
  const languageRef = useRef(null);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const pageTitle = getPageTitle(location.pathname);

  const filteredSearchItems = searchItems.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const currentLanguage =
    languages.find(
      (language) => language.code === selectedLanguage,
    ) || languages[0];

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setSearchOpen(false);
      }

      if (
        languageRef.current &&
        !languageRef.current.contains(event.target)
      ) {
        setLanguageOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setLanguageOpen(false);
        setNotificationOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setSearchTerm("");
    setLanguageOpen(false);
    setNotificationOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (filteredSearchItems.length === 0) {
      return;
    }

    navigate(filteredSearchItems[0].path);
    setSearchOpen(false);
    setSearchTerm("");
  };

  const handleLanguageChange = (languageCode) => {
    setSelectedLanguage(languageCode);
    setLanguageOpen(false);
  };

  const markAllAsRead = () => {
    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        read: true,
      })),
    );
  };

  const markNotificationAsRead = (id) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification,
      ),
    );
  };

  const handleLogin = () => {
    alert("Login page will be connected later.");
  };

  const handleSignIn = () => {
    alert("Sign In page will be connected later.");
  };

  const handleSignOut = () => {
    setProfileOpen(false);
    alert(
      "Sign out will be connected to the authentication system later.",
    );
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#05070d]/95 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* =========================
            LEFT SECTION
        ========================== */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile Menu */}
          <button
            type="button"
            onClick={onMobileMenuClick}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* Page Title */}
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-white sm:text-xl">
              {pageTitle}
            </h1>

            <p className="hidden text-xs text-slate-500 sm:block">
              Your local AI study workspace
            </p>
          </div>
        </div>

        {/* =========================
            RIGHT SECTION
        ========================== */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* =========================
              SEARCH
          ========================== */}
          <div ref={searchRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setSearchOpen((previous) => !previous);
                setLanguageOpen(false);
                setNotificationOpen(false);
                setProfileOpen(false);
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                searchOpen
                  ? "border-white/20 bg-white/[0.08] text-white"
                  : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
              }`}
              aria-label="Search"
            >
              <Search size={19} />
            </button>

            {searchOpen && (
              <div className="absolute right-0 top-12 w-[280px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f17] shadow-2xl sm:w-[340px]">
                <form
                  onSubmit={handleSearchSubmit}
                  className="border-b border-white/10 p-3"
                >
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3">
                    <Search
                      size={17}
                      className="shrink-0 text-slate-500"
                    />

                    <input
                      type="text"
                      autoFocus
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(event.target.value)
                      }
                      placeholder="Search pages..."
                      className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                    />

                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="text-slate-500 transition hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </form>

                <div className="max-h-72 overflow-y-auto p-2">
                  {filteredSearchItems.length > 0 ? (
                    filteredSearchItems.map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => {
                          navigate(item.path);
                          setSearchOpen(false);
                          setSearchTerm("");
                        }}
                        className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        {item.title}
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-6 text-center text-sm text-slate-500">
                      No pages found
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* =========================
              LANGUAGE
          ========================== */}
          <div ref={languageRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setLanguageOpen((previous) => !previous);
                setSearchOpen(false);
                setNotificationOpen(false);
                setProfileOpen(false);
              }}
              className={`flex h-10 items-center gap-2 rounded-xl border px-2.5 transition sm:px-3 ${
                languageOpen
                  ? "border-white/20 bg-white/[0.08] text-white"
                  : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
              }`}
              aria-label="Language"
            >
              <Globe2 size={18} />

              <span className="hidden text-sm sm:block">
                {currentLanguage.label}
              </span>

              <ChevronDown
                size={15}
                className={`hidden transition-transform sm:block ${
                  languageOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {languageOpen && (
              <div className="absolute right-0 top-12 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f17] p-2 shadow-2xl">
                <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-600">
                  Language
                </p>

                {languages.map((language) => (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() =>
                      handleLanguageChange(language.code)
                    }
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                      selectedLanguage === language.code
                        ? "bg-white/[0.08] text-white"
                        : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <span>{language.label}</span>

                    {selectedLanguage === language.code && (
                      <Check size={16} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* =========================
              NOTIFICATIONS
          ========================== */}
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationOpen((previous) => !previous);
                setSearchOpen(false);
                setLanguageOpen(false);
                setProfileOpen(false);
              }}
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                notificationOpen
                  ? "border-white/20 bg-white/[0.08] text-white"
                  : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
              }`}
              aria-label="Notifications"
            >
              <Bell size={19} />

              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-white" />
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 top-12 w-[310px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f17] shadow-2xl sm:w-[360px]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Notifications
                    </h3>

                    <p className="text-xs text-slate-500">
                      {unreadCount} unread
                    </p>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-xs text-slate-400 transition hover:text-white"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto p-2">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() =>
                        markNotificationAsRead(notification.id)
                      }
                      className={`flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-white/[0.05] ${
                        !notification.read
                          ? "bg-white/[0.03]"
                          : ""
                      }`}
                    >
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-400" />

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200">
                          {notification.title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {notification.message}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="mx-1 hidden h-7 w-px bg-white/10 sm:block" />

          {/* =========================
              LOGIN BUTTON
          ========================== */}
          <button
            type="button"
            onClick={handleLogin}
            className="hidden h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-3 text-sm font-medium text-white transition hover:bg-white/[0.13] sm:flex"
          >
            <LogIn size={17} />
            <span>Login</span>
          </button>

          {/* =========================
              SIGN IN BUTTON
          ========================== */}
          <button
            type="button"
            onClick={handleSignIn}
            className="hidden h-10 items-center gap-2 rounded-xl border border-white/10 bg-transparent px-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white md:flex"
          >
            <UserPlus size={17} />
            <span>Sign In</span>
          </button>

          {/* =========================
              PROFILE
          ========================== */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((previous) => !previous);
                setSearchOpen(false);
                setLanguageOpen(false);
                setNotificationOpen(false);
              }}
              className={`flex h-10 items-center gap-2 rounded-xl border px-2 transition ${
                profileOpen
                  ? "border-white/20 bg-white/[0.08]"
                  : "border-transparent hover:border-white/10 hover:bg-white/[0.05]"
              }`}
              aria-label="Profile menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.08] text-slate-300">
                <User size={17} />
              </div>

              <div className="hidden text-left md:block">
                <p className="text-xs font-medium text-white">
                  Student
                </p>

                <p className="text-[10px] text-slate-500">
                  Local Account
                </p>
              </div>

              <ChevronDown
                size={15}
                className={`hidden text-slate-500 transition-transform md:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f17] p-2 shadow-2xl">
                <div className="border-b border-white/10 px-3 py-3">
                  <p className="text-sm font-semibold text-white">
                    OFFSEDU Student
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    student@example.com
                  </p>
                </div>

                <div className="py-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <User size={17} />
                    Profile
                  </Link>

                  <Link
                    to="/settings"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <Settings size={17} />
                    Settings
                  </Link>
                </div>

                <div className="border-t border-white/10 pt-2">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <LogOut size={17} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;