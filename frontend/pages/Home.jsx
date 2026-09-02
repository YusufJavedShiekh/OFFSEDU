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
    glow: "rgba(34,211,238,0.45)",
  },
  {
    title: "Explain",
    description: "Understand difficult concepts in simple language.",
    path: "/explain",
    icon: Brain,
    color: "violet",
    glow: "rgba(167,139,250,0.45)",
  },
  {
    title: "Quiz",
    description: "Practice with AI-generated questions.",
    path: "/quiz",
    icon: Zap,
    color: "amber",
    glow: "rgba(251,191,36,0.45)",
  },
  {
    title: "Test Paper",
    description: "Create short and long answer practice papers.",
    path: "/test-paper",
    icon: FileText,
    color: "emerald",
    glow: "rgba(52,211,153,0.45)",
  },
  {
    title: "Study Plan",
    description: "Build a personalized study schedule.",
    path: "/study-plan",
    icon: CalendarDays,
    color: "blue",
    glow: "rgba(96,165,250,0.45)",
  },
  {
    title: "Documents",
    description: "Organize your subjects and study material.",
    path: "/documents",
    icon: Files,
    color: "pink",
    glow: "rgba(244,114,182,0.45)",
  },
  {
    title: "File Tools",
    description: "Compress, preview and manage study files.",
    path: "/file-tools",
    icon: Wrench,
    color: "orange",
    glow: "rgba(251,146,60,0.45)",
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

  /*
    Smooth manual animation using requestAnimationFrame.
    This avoids the CSS transform conflict from animate-spin.
  */
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
    <div className="min-h-[calc(100vh-80px)] overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[42%] h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[0.018] blur-3xl" />

        <div className="absolute left-[15%] top-[25%] h-64 w-64 rounded-full bg-violet-500/[0.015] blur-3xl" />

        <div className="absolute bottom-[10%] right-[10%] h-72 w-72 rounded-full bg-blue-500/[0.015] blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "70px 70px",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <Sparkles size={13} className="text-cyan-300" />

            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
              Local AI Study Environment
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Your Study.
            <span className="block bg-gradient-to-r from-cyan-300 via-violet-300 to-blue-300 bg-clip-text text-transparent">
              Reimagined.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            OFFSEDU is your personal AI study environment for learning,
            practicing, planning and managing your study material.
          </p>
        </div>

        {/* STUDY UNIVERSE */}
        <div
          className="relative mx-auto mt-10 h-[570px] w-full max-w-[900px] sm:h-[620px]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => {
            setIsPaused(false);
            setActiveFeature(null);
          }}
        >
          {/* OUTER ORBIT */}
          <div className="absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.055] sm:h-[550px] sm:w-[550px]" />

          {/* SECOND ORBIT */}
          <div className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/[0.045] sm:h-[420px] sm:w-[420px]" />

          {/* ROTATING ORBIT CONTENT */}
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
                      {/* GLOW */}
                      <div
                        className={`absolute -inset-5 rounded-[28px] opacity-20 blur-2xl transition-all duration-500 group-hover:opacity-70 ${
                          styles.bg
                        }`}
                      />

                      {/* ICON CARD */}
                      <div
                        className={`relative flex h-[76px] w-[76px] items-center justify-center rounded-[22px] border backdrop-blur-xl transition-all duration-300 sm:h-[88px] sm:w-[88px] ${
                          styles.border
                        } ${
                          styles.bg
                        } ${
                          styles.glow
                        } ${
                          isActive
                            ? "scale-125"
                            : "group-hover:scale-110"
                        }`}
                      >
                        {/* INNER RING */}
                        <div
                          className={`absolute inset-2 rounded-[17px] border opacity-30 ${
                            styles.border
                          }`}
                        />

                        {/* ICON */}
                        <Icon
                          size={34}
                          strokeWidth={1.7}
                          className={`relative z-10 transition-all duration-300 sm:h-9 sm:w-9 ${
                            styles.icon
                          } ${
                            isActive
                              ? "drop-shadow-[0_0_12px_currentColor]"
                              : ""
                          }`}
                        />

                        {/* SMALL LIGHT */}
                        <span
                          className={`absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full opacity-80 shadow-[0_0_10px_currentColor] ${
                            styles.dot
                          }`}
                        />
                      </div>

                      {/* LABEL */}
                      <div className="absolute left-1/2 top-full mt-3 w-28 -translate-x-1/2 text-center">
                        <p
                          className={`text-[10px] font-semibold transition-all duration-300 sm:text-xs ${
                            isActive
                              ? styles.icon
                              : "text-slate-500 group-hover:text-white"
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

          {/* CENTER CORE */}
          <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
            {/* PULSE RINGS */}
            <div className="absolute -inset-12 animate-ping rounded-full border border-cyan-400/[0.04] duration-[3000ms]" />

            <div className="absolute -inset-20 rounded-full border border-violet-400/[0.025]" />

            <div className="relative flex h-36 w-36 flex-col items-center justify-center rounded-full border border-white/15 bg-[#080b12]/95 shadow-[0_0_100px_rgba(56,189,248,0.08)] backdrop-blur-xl sm:h-44 sm:w-44">
              {/* CORE ICON */}
              <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.06] shadow-[0_0_30px_rgba(34,211,238,0.12)]">
                <Sparkles
                  size={27}
                  strokeWidth={1.5}
                  className="text-cyan-200"
                />

                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
              </div>

              <p className="text-sm font-bold tracking-[0.18em] text-white">
                OFFSEDU
              </p>

              <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-slate-600">
                AI CORE
              </p>
            </div>
          </div>
        </div>

        {/* ACTIVE FEATURE INFO */}
        <div className="mx-auto -mt-1 min-h-[48px] max-w-lg text-center">
          {activeFeature ? (
            <div className="animate-in fade-in duration-300">
              <p className="text-xs font-semibold text-white">
                {activeFeature}
              </p>

              <p className="mt-1 text-[10px] text-slate-600">
                {
                  features.find(
                    (item) =>
                      item.title === activeFeature,
                  )?.description
                }
              </p>
            </div>
          ) : (
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-700">
              Hover over a module to explore
            </p>
          )}
        </div>

        {/* CONTROLS */}
        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={rotateLeft}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-600 transition hover:border-cyan-400/20 hover:bg-cyan-400/[0.05] hover:text-cyan-300"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={resetRotation}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] uppercase tracking-wider text-slate-600 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
          >
            Reset Orbit
          </button>

          <button
            type="button"
            onClick={rotateRight}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-600 transition hover:border-violet-400/20 hover:bg-violet-400/[0.05] hover:text-violet-300"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* QUICK START */}
        <div className="mx-auto mt-10 max-w-5xl">
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400">
              Quick Start
            </p>

            <p className="mt-1 text-[10px] text-slate-700">
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

        {/* FOOTER */}
        <div className="flex items-center justify-center gap-2 py-8">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/60 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />

          <span className="text-[9px] uppercase tracking-[0.18em] text-slate-700">
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
      className={`group rounded-2xl border p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${styles.border} ${styles.bg}`}
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
          <p className="text-xs font-semibold text-slate-300 group-hover:text-white">
            {title}
          </p>

          <p className="mt-1 truncate text-[10px] text-slate-600">
            {description}
          </p>
        </div>

        <ArrowRight
          size={14}
          className="text-slate-700 transition-all group-hover:translate-x-1 group-hover:text-slate-400"
        />
      </div>
    </Link>
  );
}

export default Home;