import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Lightbulb,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";

const defaultTopics = [
  "Introduction",
  "Important Concepts",
  "Core Topics",
  "Numerical Problems",
  "Revision",
];

const dayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const fallbackTopics = [
  "Review important concepts",
  "Practice questions",
  "Revise difficult topics",
  "Solve previous questions",
  "Quick revision",
];

function StudyPlan() {
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState("2");
  const [difficulty, setDifficulty] = useState("Medium");
  const [topics, setTopics] = useState("");

  const [studyPlan, setStudyPlan] = useState([]);
  const [isGenerated, setIsGenerated] = useState(false);

  const [studyTip, setStudyTip] = useState(
    "Break large topics into smaller sessions and revise them regularly.",
  );

  const parsedTopics = useMemo(() => {
    const customTopics = topics
      .split("\n")
      .map((topic) => topic.trim())
      .filter(Boolean);

    return customTopics.length > 0 ? customTopics : defaultTopics;
  }, [topics]);

  const generatePlan = () => {
    const generatedTopics =
      parsedTopics.length > 0 ? parsedTopics : fallbackTopics;

    const plan = dayNames.map((day, index) => {
      const topic = generatedTopics[index % generatedTopics.length];

      const sessionType =
        index === 6
          ? "Revision & Test"
          : index % 3 === 0
            ? "Concept Learning"
            : index % 3 === 1
              ? "Practice"
              : "Revision";

      return {
        day,
        topic,
        sessionType,
        hours: Number(dailyHours),
        completed: false,
      };
    });

    setStudyPlan(plan);
    setIsGenerated(true);

    const tips = [
      "Use active recall instead of repeatedly reading the same notes.",
      "Keep difficult topics for the time of day when your concentration is highest.",
      "Take short breaks between study sessions to maintain focus.",
      "After learning a topic, solve a few questions without looking at your notes.",
      "Reserve the final study day mainly for revision and self-testing.",
    ];

    setStudyTip(tips[Math.floor(Math.random() * tips.length)]);
  };

  const toggleComplete = (index) => {
    setStudyPlan((currentPlan) =>
      currentPlan.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, completed: !item.completed }
          : item,
      ),
    );
  };

  const deleteDay = (index) => {
    setStudyPlan((currentPlan) =>
      currentPlan.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const createNewPlan = () => {
    setStudyPlan([]);
    setIsGenerated(false);
    setSubject("");
    setExamDate("");
    setDailyHours("2");
    setDifficulty("Medium");
    setTopics("");
    setStudyTip(
      "Break large topics into smaller sessions and revise them regularly.",
    );
  };

  const completedCount = studyPlan.filter((item) => item.completed).length;

  const totalHours = studyPlan.reduce(
    (total, item) => total + Number(item.hours),
    0,
  );

  const progress =
    studyPlan.length > 0
      ? Math.round((completedCount / studyPlan.length) * 100)
      : 0;

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-gradient-to-br from-[#063b3b] via-[#06272d] to-[#03070b] px-4 py-6 sm:px-6 lg:px-8">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-teal-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-300/20 bg-teal-400/10 text-teal-300">
              <GraduationCap size={23} />
            </div>

            <div>
              <p className="text-sm font-medium text-teal-300">
                AI Study Planner
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Study Plan
              </h1>
            </div>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Create a structured study schedule based on your subject, exam
            date, available study time and difficulty level.
          </p>
        </div>

        {!isGenerated ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Form */}
            <div className="rounded-3xl border border-white/10 bg-[#061214]/70 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-teal-300">
                  <Target size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-white">
                    Plan Configuration
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tell OFFSEDU how you want to study.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Subject */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Subject / Course
                  </label>

                  <div className="relative">
                    <BookOpen
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Database Management System"
                      className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-teal-400/40 focus:bg-black/30"
                    />
                  </div>
                </div>

                {/* Exam Date */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Exam Date
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-teal-400/40"
                    />
                  </div>
                </div>

                {/* Hours + Difficulty */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Daily Study Hours
                    </label>

                    <div className="relative">
                      <Clock3
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                      <select
                        value={dailyHours}
                        onChange={(e) => setDailyHours(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-teal-400/40"
                      >
                        <option value="1" className="bg-slate-900">
                          1 Hour
                        </option>
                        <option value="2" className="bg-slate-900">
                          2 Hours
                        </option>
                        <option value="3" className="bg-slate-900">
                          3 Hours
                        </option>
                        <option value="4" className="bg-slate-900">
                          4 Hours
                        </option>
                        <option value="5" className="bg-slate-900">
                          5 Hours
                        </option>
                        <option value="6" className="bg-slate-900">
                          6+ Hours
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Difficulty
                    </label>

                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-teal-400/40"
                    >
                      <option value="Easy" className="bg-slate-900">
                        Easy
                      </option>
                      <option value="Medium" className="bg-slate-900">
                        Medium
                      </option>
                      <option value="Hard" className="bg-slate-900">
                        Hard
                      </option>
                    </select>
                  </div>
                </div>

                {/* Topics */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-300">
                      Topics
                    </label>

                    <span className="text-xs text-slate-600">
                      One topic per line
                    </span>
                  </div>

                  <textarea
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    rows={7}
                    placeholder={`Example:\nIntroduction to DBMS\nER Model\nNormalization\nTransactions\nSQL`}
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-teal-400/40 focus:bg-black/30"
                  />
                </div>

                {/* Generate */}
                <button
                  type="button"
                  onClick={generatePlan}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500/90 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 active:scale-[0.99]"
                >
                  <Sparkles size={18} />
                  Generate Study Plan
                </button>
              </div>
            </div>

            {/* Side information */}
            <div className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-[#061214]/60 p-6 backdrop-blur-xl">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400/10 text-teal-300">
                  <CalendarDays size={23} />
                </div>

                <h2 className="text-xl font-semibold text-white">
                  Plan smarter.
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  OFFSEDU divides your topics into manageable study sessions
                  so you can stay consistent instead of trying to finish
                  everything at once.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    "Organize topics across the week",
                    "Balance learning and revision",
                    "Track completed sessions",
                    "Keep your preparation structured",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3"
                    >
                      <CheckCircle2
                        size={17}
                        className="shrink-0 text-teal-400"
                      />
                      <span className="text-sm text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-teal-300/10 bg-teal-400/[0.04] p-6 backdrop-blur-xl">
                <div className="flex items-start gap-3">
                  <Lightbulb
                    size={21}
                    className="mt-0.5 shrink-0 text-teal-300"
                  />

                  <div>
                    <h3 className="font-medium text-white">Study Tip</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {studyTip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Plan header */}
            <div className="rounded-3xl border border-white/10 bg-[#061214]/70 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm text-teal-300">
                    <Sparkles size={17} />
                    Generated Study Plan
                  </div>

                  <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                    {subject || "Your Study Plan"}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                      {difficulty} difficulty
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                      {dailyHours} hrs/day
                    </span>

                    {examDate && (
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                        Exam: {examDate}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={createNewPlan}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <RotateCcw size={17} />
                  Create New Plan
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                icon={CalendarDays}
                label="Study Days"
                value={studyPlan.length}
              />

              <StatCard
                icon={Clock3}
                label="Total Hours"
                value={`${totalHours}h`}
              />

              <StatCard
                icon={CheckCircle2}
                label="Completed"
                value={completedCount}
              />

              <StatCard
                icon={Target}
                label="Progress"
                value={`${progress}%`}
              />
            </div>

            {/* Progress */}
            <div className="rounded-3xl border border-white/10 bg-[#061214]/65 p-5 backdrop-blur-xl sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">
                    Overall Progress
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Complete sessions as you finish them.
                  </p>
                </div>

                <span className="text-sm font-semibold text-teal-300">
                  {progress}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-teal-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Weekly schedule */}
            <div className="grid gap-4">
              {studyPlan.map((item, index) => (
                <div
                  key={`${item.day}-${index}`}
                  className={`group rounded-2xl border p-4 transition sm:p-5 ${
                    item.completed
                      ? "border-teal-400/20 bg-teal-400/[0.05]"
                      : "border-white/10 bg-[#061214]/65 hover:border-teal-300/15 hover:bg-[#071719]/80"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={() => toggleComplete(index)}
                      aria-label={`Mark ${item.day} as ${
                        item.completed ? "incomplete" : "complete"
                      }`}
                      className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
                        item.completed
                          ? "border-teal-400/30 bg-teal-400/15 text-teal-300"
                          : "border-white/10 bg-white/[0.04] text-slate-600 hover:border-teal-400/20 hover:text-teal-300"
                      }`}
                    >
                      <CheckCircle2 size={20} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-teal-300">
                            {item.day}
                          </p>

                          <h3
                            className={`mt-1 font-semibold ${
                              item.completed
                                ? "text-slate-500 line-through"
                                : "text-white"
                            }`}
                          >
                            {item.topic}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteDay(index)}
                          aria-label={`Delete ${item.day}`}
                          className="self-start rounded-lg p-2 text-slate-600 opacity-100 transition hover:bg-red-500/10 hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs text-slate-400">
                          {item.sessionType}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs text-slate-400">
                          {item.hours} hour{item.hours !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tip */}
            <div className="rounded-3xl border border-teal-300/10 bg-teal-400/[0.04] p-5 backdrop-blur-xl sm:p-6">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
                  <Lightbulb size={19} />
                </div>

                <div>
                  <h3 className="font-medium text-white">
                    AI Study Tip
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {studyTip}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer action */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={createNewPlan}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
              >
                <Plus size={17} />
                Create Another Study Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#061214]/65 p-4 backdrop-blur-xl">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
        <Icon size={18} />
      </div>

      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default StudyPlan;