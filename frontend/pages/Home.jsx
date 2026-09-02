import { Link } from "react-router-dom";
import {
  ArrowRight,
  Brain,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Files,
  MessageCircle,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

const features = [
  {
    title: "AI Chat",
    description: "Ask Gemma anything and learn through conversation.",
    path: "/chat",
    icon: MessageCircle,
    color: "cyan",
  },
  {
    title: "Explain",
    description: "Understand difficult concepts in simple language.",
    path: "/explain",
    icon: Brain,
    color: "violet",
  },
  {
    title: "Quiz",
    description: "Practice with AI-generated questions.",
    path: "/quiz",
    icon: Zap,
    color: "amber",
  },
  {
    title: "Test Paper",
    description: "Create short and long answer practice papers.",
    path: "/test-paper",
    icon: FileText,
    color: "emerald",
  },
  {
    title: "Study Plan",
    description: "Build a personalized study schedule.",
    path: "/study-plan",
    icon: CalendarDays,
    color: "blue",
  },
  {
    title: "Documents",
    description: "Organize your subjects and study material.",
    path: "/documents",
    icon: Files,
    color: "pink",
  },
  {
    title: "File Tools",
    description: "Compress, preview and manage study files.",
    path: "/file-tools",
    icon: Wrench,
    color: "orange",
  },
];

const colorClasses = {
  cyan: {
    border: "border-cyan-400/30",
    bg: "bg-cyan-400/[0.08]",
    icon: "text-cyan-300",
    glow: "shadow-[0_0_35px_rgba(34,211,238,0.22)]",
    dot: "bg-cyan-300",
  },

  violet: {
    border: "border-violet-400/30",
    bg: "bg-violet-400/[0.08]",
    icon: "text-violet-300",
    glow: "shadow-[0_0_35px_rgba(167,139,250,0.22)]",
    dot: "bg-violet-300",
  },

  amber: {
    border: "border-amber-400/30",
    bg: "bg-amber-400/[0.08]",
    icon: "text-amber-300",
    glow: "shadow-[0_0_35px_rgba(251,191,36,0.22)]",
    dot: "bg-amber-300",
  },

  emerald: {
    border: "border-emerald-400/30",
    bg: "bg-emerald-400/[0.08]",
    icon: "text-emerald-300",
    glow: "shadow-[0_0_35px_rgba(52,211,153,0.22)]",
    dot: "bg-emerald-300",
  },

  blue: {
    border: "border-blue-400/30",
    bg: "bg-blue-400/[0.08]",
    icon: "text-blue-300",
    glow: "shadow-[0_0_35px_rgba(96,165,250,0.22)]",
    dot: "bg-blue-300",
  },

  pink: {
    border: "border-pink-400/30",
    bg: "bg-pink-400/[0.08]",
    icon: "text-pink-300",
    glow: "shadow-[0_0_35px_rgba(244,114,182,0.22)]",
    dot: "bg-pink-300",
  },

  orange: {
    border: "border-orange-400/30",
    bg: "bg-orange-400/[0.08]",
    icon: "text-orange-300",
    glow: "shadow-[0_0_35px_rgba(251,146,60,0.22)]",
    dot: "bg-orange-300",
  },
};

function Home() {
  const [rotation, setRotation] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);

  useEffect(() => {
    let animationFrame;
    let lastTime = performance.now();

    const animate = (currentTime) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;

      if (!isPaused) {
        setRotation((previous) => previous + delta * 0.018);
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [isPaused]);

  const rotateLeft = () => {
    setRotation((value) => value - 35);
  };

  const rotateRight = () => {
    setRotation((value) => value + 35);
  };

  const resetRotation = () => {
    setRotation(0);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      {/* =========================================================
          TEAL GRADIENT BACKGROUND
      ========================================================== */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Particle Wave Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/backgrounds/particle-wave.jpg')",
          }}
        />

        {/* Deep Teal → Cyan → Blue → Black Gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(2,28,30,0.96) 0%, rgba(4,55,57,0.88) 28%, rgba(7,63,73,0.80) 48%, rgba(14,38,57,0.88) 68%, rgba(3,9,18,0.96) 100%)",
          }}
        />

        {/* Teal Atmospheric Glow - Left */}
        <div
          className="absolute -left-40 top-10 h-[520px] w-[520px] rounded-full blur-[130px]"
          style={{
            background: "rgba(13,148,136,0.20)",
          }}
        />

        {/* Cyan Atmospheric Glow - Center */}
        <div
          className="absolute left-[30%] top-[25%] h-[420px] w-[420px] rounded-full blur-[140px]"
          style={{
            background: "rgba(20,184,166,0.10)",
          }}
        />

        {/* Deep Blue Glow - Right */}
        <div
          className="absolute right-[-180px] top-[15%] h-[600px] w-[600px] rounded-full blur-[150px]"
          style={{
            background: "rgba(14,116,144,0.14)",
          }}
        />

        {/* Center Readability Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, rgba(2,25,28,0.08) 0%, rgba(2,10,18,0.38) 62%, rgba(1,5,10,0.82) 100%)",
          }}
        />

        {/* Bottom Fade */}
        <div
          className="absolute inset-x-0 bottom-0 h-80"
          style={{
            background:
              "linear-gradient(to top, rgba(2,7,12,0.96), transparent)",
          }}
        />

        {/* Subtle Technical Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "70px 70px",
          }}
        />
      </div>

      {/* =========================================================
          MAIN CONTENT
      ========================================================== */}
      <div className="relative z-10 mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-300/15 bg-black/30 px-3 py-1.5 backdrop-blur-md">
            <Sparkles size={13} className="text-teal-300" />

            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-300">
              Local AI Study Environment
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Your Study.
            <span className="block bg-gradient-to-r from-teal-200 via-cyan-200 to-slate-200 bg-clip-text text-transparent">
              Reimagined.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            OFFSEDU is your personal AI study environment for learning,
            practicing, planning and managing your study material.
          </p>
        </div>

        {/* =========================================================
            STUDY UNIVERSE
        ========================================================== */}
        <div
          className="relative mx-auto mt-10 h-[570px] w-full max-w-[900px] sm:h-[620px]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => {
            setIsPaused(false);
            setActiveFeature(null);
          }}
        >
          {/* OUTER ORBIT */}
          <div className="absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-100/[0.10] sm:h-[550px] sm:w-[550px]" />

          {/* SECOND ORBIT */}
          <div className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-teal-100/[0.08] sm:h-[420px] sm:w-[420px]" />

          {/* ROTATING ORBIT */}
          <div
            className="absolute inset-0"
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const styles = colorClasses[feature.color];

              const angle =
                (index / features.length) * Math.PI * 2;

              const radius =
                typeof window !== "undefined" &&
                window.innerWidth < 640
                  ? 215
                  : 265;

              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              const isActive =
                activeFeature === feature.title;

              return (
                <div
                  key={feature.title}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                  }}
                >
                  {/* COUNTER ROTATION */}
                  <div
                    style={{
                      transform: `rotate(${-rotation}deg)`,
                    }}
                  >
                    <Link
                      to={feature.path}
                      onMouseEnter={() =>
                        setActiveFeature(feature.title)
                      }
                      onMouseLeave={() =>
                        setActiveFeature(null)
                      }
                      className="group relative block"
                    >
                      {/* FEATURE GLOW */}
                      <div
                        className={`absolute -inset-5 rounded-[28px] opacity-20 blur-2xl transition-all duration-500 group-hover:opacity-70 ${styles.bg}`}
                      />

                      {/* ICON CARD */}
                      <div
                        className={`relative flex h-[76px] w-[76px] items-center justify-center rounded-[22px] border bg-black/45 backdrop-blur-xl transition-all duration-300 sm:h-[88px] sm:w-[88px] ${styles.border} ${styles.glow} ${
                          isActive
                            ? "scale-125"
                            : "group-hover:scale-110"
                        }`}
                      >
                        {/* INNER RING */}
                        <div
                          className={`absolute inset-2 rounded-[17px] border opacity-30 ${styles.border}`}
                        />

                        {/* ICON */}
                        <Icon
                          size={34}
                          strokeWidth={1.7}
                          className={`relative z-10 transition-all duration-300 sm:h-9 sm:w-9 ${styles.icon} ${
                            isActive
                              ? "drop-shadow-[0_0_12px_currentColor]"
                              : ""
                          }`}
                        />

                        {/* STATUS DOT */}
                        <span
                          className={`absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full opacity-80 shadow-[0_0_10px_currentColor] ${styles.dot}`}
                        />
                      </div>

                      {/* LABEL */}
                      <div className="absolute left-1/2 top-full mt-3 w-28 -translate-x-1/2 text-center">
                        <p
                          className={`text-[10px] font-semibold transition-all duration-300 sm:text-xs ${
                            isActive
                              ? styles.icon
                              : "text-slate-300 group-hover:text-white"
                          }`}
                        >
                          {feature.title}
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* =====================================================
              CENTER CORE
          ====================================================== */}
          <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
            {/* PULSE RING */}
            <div className="absolute -inset-12 animate-ping rounded-full border border-teal-300/[0.06] duration-[3000ms]" />

            {/* OUTER RING */}
            <div className="absolute -inset-20 rounded-full border border-cyan-300/[0.035]" />

            {/* CORE */}
            <div className="relative flex h-36 w-36 flex-col items-center justify-center rounded-full border border-teal-200/15 bg-[#061316]/90 shadow-[0_0_100px_rgba(20,184,166,0.10)] backdrop-blur-xl sm:h-44 sm:w-44">
              {/* CORE ICON */}
              <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-300/20 bg-teal-400/[0.07] shadow-[0_0_30px_rgba(20,184,166,0.14)]">
                <Sparkles
                  size={27}
                  strokeWidth={1.5}
                  className="text-teal-200"
                />

                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.8)]" />
              </div>

              <p className="text-sm font-bold tracking-[0.18em] text-white">
                OFFSEDU
              </p>

              <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-slate-500">
                AI CORE
              </p>
            </div>
          </div>
        </div>

        {/* ACTIVE FEATURE INFO */}
        <div className="mx-auto -mt-1 min-h-[48px] max-w-lg text-center">
          {activeFeature ? (
            <div>
              <p className="text-xs font-semibold text-white">
                {activeFeature}
              </p>

              <p className="mt-1 text-[10px] text-slate-300">
                {
                  features.find(
                    (item) =>
                      item.title === activeFeature,
                  )?.description
                }
              </p>
            </div>
          ) : (
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
              Hover over a module to explore
            </p>
          )}
        </div>

        {/* =========================================================
            CONTROLS
        ========================================================== */}
        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={rotateLeft}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-200/10 bg-black/30 text-slate-300 backdrop-blur-md transition hover:border-teal-300/25 hover:bg-teal-400/[0.06] hover:text-teal-200"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={resetRotation}
            className="rounded-xl border border-teal-200/10 bg-black/30 px-4 py-2 text-[10px] uppercase tracking-wider text-slate-300 backdrop-blur-md transition hover:border-teal-200/20 hover:bg-white/[0.06] hover:text-white"
          >
            Reset Orbit
          </button>

          <button
            type="button"
            onClick={rotateRight}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-200/10 bg-black/30 text-slate-300 backdrop-blur-md transition hover:border-teal-300/25 hover:bg-teal-400/[0.06] hover:text-teal-200"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* =========================================================
            QUICK START
        ========================================================== */}
        <div className="mx-auto mt-10 max-w-5xl">
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-200">
              Quick Start
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Start studying with one click.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <QuickCard
              icon={MessageCircle}
              title="Ask Gemma"
              description="Start an AI study conversation"
              path="/chat"
              color="cyan"
            />

            <QuickCard
              icon={Brain}
              title="Explain a Topic"
              description="Make difficult concepts simple"
              path="/explain"
              color="violet"
            />

            <QuickCard
              icon={CalendarDays}
              title="Create Study Plan"
              description="Build your personalized schedule"
              path="/study-plan"
              color="blue"
            />
          </div>
        </div>

        {/* =========================================================
            FOOTER
        ========================================================== */}
        <div className="flex items-center justify-center gap-2 py-8">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-300/70 shadow-[0_0_8px_rgba(45,212,191,0.5)]" />

          <span className="text-[9px] uppercase tracking-[0.18em] text-slate-400">
            Local AI · Gemma · Ollama
          </span>
        </div>
      </div>
    </div>
  );
}

function QuickCard({
  icon: Icon,
  title,
  description,
  path,
  color,
}) {
  const styles = colorClasses[color];

  return (
    <Link
      to={path}
      className={`group rounded-2xl border bg-black/35 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${styles.border} ${styles.bg}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${styles.border} ${styles.bg}`}
        >
          <Icon
            size={18}
            className={styles.icon}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
            {title}
          </p>

          <p className="mt-1 truncate text-[10px] text-slate-400">
            {description}
          </p>
        </div>

        <ArrowRight
          size={14}
          className="text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-slate-200"
        />
      </div>
    </Link>
  );
}

export default Home;