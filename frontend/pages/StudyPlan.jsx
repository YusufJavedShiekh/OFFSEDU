import { useState } from "react";

function StudyPlan() {
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [studyHours, setStudyHours] = useState("2");
  const [difficulty, setDifficulty] = useState("Medium");
  const [topics, setTopics] = useState("");
  const [showPlan, setShowPlan] = useState(false);

  const generatePlan = () => {
    setShowPlan(true);
  };

  const resetPlan = () => {
    setShowPlan(false);
  };

  const plan = [
    {
      day: "Day 1",
      topic: "Introduction & Fundamentals",
      duration: "60 min",
      status: "Start",
    },
    {
      day: "Day 2",
      topic: "Core Concepts",
      duration: "90 min",
      status: "Start",
    },
    {
      day: "Day 3",
      topic: "Important Topics",
      duration: "120 min",
      status: "Start",
    },
    {
      day: "Day 4",
      topic: "Advanced Concepts",
      duration: "90 min",
      status: "Start",
    },
    {
      day: "Day 5",
      topic: "Revision & Practice",
      duration: "120 min",
      status: "Start",
    },
    {
      day: "Day 6",
      topic: "Weak Areas",
      duration: "90 min",
      status: "Start",
    },
    {
      day: "Day 7",
      topic: "Final Revision & Test",
      duration: "120 min",
      status: "Start",
    },
  ];

  return (
    <div className="min-h-screen bg-[#05070d] px-6 py-8 text-white sm:px-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-slate-500">
            AI Learning Planner
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Study Plan
          </h1>

          <p className="mt-2 text-slate-400">
            Create a personalized study schedule with Gemma AI.
          </p>
        </div>

        {!showPlan && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">

            {/* Subject */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium">
                Subject / Course
              </label>

              <input
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Example: Database Management System"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-white/30"
              />
            </div>

            {/* Exam + Hours */}
            <div className="mb-6 grid gap-6 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Exam Date
                </label>

                <input
                  type="date"
                  value={examDate}
                  onChange={(event) => setExamDate(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#080b13] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Daily Study Hours
                </label>

                <select
                  value={studyHours}
                  onChange={(event) => setStudyHours(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#080b13] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                >
                  <option value="1">1 Hour</option>
                  <option value="2">2 Hours</option>
                  <option value="3">3 Hours</option>
                  <option value="4">4 Hours</option>
                  <option value="5">5 Hours</option>
                  <option value="6">6+ Hours</option>
                </select>
              </div>

            </div>

            {/* Difficulty */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium">
                Difficulty Level
              </label>

              <div className="grid grid-cols-3 gap-3">

                {["Easy", "Medium", "Hard"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      difficulty === level
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-black/20 text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {level}
                  </button>
                ))}

              </div>
            </div>

            {/* Topics */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Topics to Study
              </label>

              <textarea
                value={topics}
                onChange={(event) => setTopics(event.target.value)}
                rows={5}
                placeholder={`Enter topics separated by commas...

Example:
DBMS Introduction, ER Model, SQL, Normalization, Transactions`}
                className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-white/30"
              />
            </div>

            {/* Preview */}
            <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-5">

              <h2 className="mb-4 text-sm font-semibold">
                Plan Configuration
              </h2>

              <div className="grid gap-4 sm:grid-cols-3">

                <div>
                  <p className="text-xs text-slate-500">
                    Subject
                  </p>

                  <p className="mt-1 truncate text-sm">
                    {subject || "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Daily Study
                  </p>

                  <p className="mt-1 text-sm">
                    {studyHours} {studyHours === "1" ? "Hour" : "Hours"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Difficulty
                  </p>

                  <p className="mt-1 text-sm">
                    {difficulty}
                  </p>
                </div>

              </div>
            </div>

            {/* Generate */}
            <button
              type="button"
              onClick={generatePlan}
              className="mt-8 w-full rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-slate-200"
            >
              Generate Study Plan
            </button>

          </div>
        )}

        {/* Generated Plan */}
        {showPlan && (
          <div>

            {/* Plan Header */}
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">

              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

                <div>
                  <p className="text-sm text-slate-500">
                    Personalized Study Plan
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    {subject || "My Study Plan"}
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    {difficulty} difficulty • {studyHours}{" "}
                    {studyHours === "1" ? "hour" : "hours"} per day
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetPlan}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  Create New Plan
                </button>

              </div>

              {/* Stats */}
              <div className="mt-6 grid gap-3 sm:grid-cols-3">

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-slate-500">
                    Duration
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    7 Days
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-slate-500">
                    Daily Goal
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {studyHours}h
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-slate-500">
                    Progress
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    0%
                  </p>
                </div>

              </div>

            </div>

            {/* Topics */}
            {topics && (
              <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">

                <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">
                  Your Topics
                </p>

                <div className="flex flex-wrap gap-2">
                  {topics
                    .split(",")
                    .map((topic) => topic.trim())
                    .filter(Boolean)
                    .map((topic, index) => (
                      <span
                        key={index}
                        className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300"
                      >
                        {topic}
                      </span>
                    ))}
                </div>

              </div>
            )}

            {/* Schedule */}
            <div className="mb-6">

              <div className="mb-4">
                <h2 className="text-xl font-semibold">
                  Weekly Schedule
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Follow each session and track your learning progress.
                </p>
              </div>

              <div className="space-y-3">

                {plan.map((item, index) => (
                  <div
                    key={item.day}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
                  >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                      {/* Day */}
                      <div className="flex items-center gap-4 sm:w-36">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-xs font-semibold">
                          {index + 1}
                        </div>

                        <div>
                          <p className="text-sm font-semibold">
                            {item.day}
                          </p>

                          <p className="text-xs text-slate-500">
                            Study Session
                          </p>
                        </div>

                      </div>

                      {/* Topic */}
                      <div className="flex-1">

                        <p className="text-sm font-medium">
                          {item.topic}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Focus on understanding concepts and making notes.
                        </p>

                      </div>

                      {/* Duration */}
                      <div className="flex items-center gap-3">

                        <span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400">
                          {item.duration}
                        </span>

                        <button
                          type="button"
                          className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white hover:text-black"
                        >
                          {item.status}
                        </button>

                      </div>

                    </div>

                  </div>
                ))}

              </div>

            </div>

            {/* AI Tip */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

              <p className="text-xs uppercase tracking-wider text-slate-500">
                AI Study Tip
              </p>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                Study consistently instead of trying to complete everything
                in one session. After each topic, spend a few minutes
                reviewing your notes and testing yourself.
              </p>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default StudyPlan;