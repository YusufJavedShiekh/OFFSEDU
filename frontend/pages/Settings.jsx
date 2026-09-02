import { useState } from "react";
import {
  Accessibility,
  Bell,
  Bot,
  Check,
  ChevronDown,
  Clock3,
  Cpu,
  Database,
  Eye,
  Globe,
  Info,
  Languages,
  MessageSquare,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  Shield,
  Sparkles,
  Trash2,
  Volume2,
  Zap,
} from "lucide-react";

const languages = [
  "English",
  "Hindi",
  "Marathi",
  "Urdu",
];

const responseStyles = [
  "Balanced",
  "Concise",
  "Detailed",
  "Exam Focused",
];

const explanationLevels = [
  "Simple",
  "Detailed",
  "Advanced",
];

const difficulties = [
  "Easy",
  "Medium",
  "Hard",
];

const questionCounts = [
  "5",
  "10",
  "20",
  "30",
];

const marksOptions = [
  "1",
  "2",
  "3",
  "5",
  "10",
  "20",
];

const voiceSpeeds = [
  "0.75x",
  "1x",
  "1.25x",
  "1.5x",
  "2x",
];

const themes = [
  {
    id: "dark",
    name: "Dark",
    description: "Recommended for focused study",
    icon: Moon,
  },
  {
    id: "system",
    name: "System",
    description: "Follow your device appearance",
    icon: Monitor,
  },
];

function getSaved(key, fallback) {
  const value = localStorage.getItem(key);

  if (value === null) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function Settings() {
  // GENERAL
  const [language, setLanguage] = useState(
    getSaved("offsedu_language", "English"),
  );

  const [theme, setTheme] = useState(
    getSaved("offsedu_theme", "dark"),
  );

  const [compactMode, setCompactMode] = useState(
    getSaved("offsedu_compact_mode", false),
  );

  // AI
  const [responseStyle, setResponseStyle] =
    useState(
      getSaved(
        "offsedu_response_style",
        "Balanced",
      ),
    );

  const [explanationLevel, setExplanationLevel] =
    useState(
      getSaved(
        "offsedu_explanation_level",
        "Simple",
      ),
    );

  const [aiLanguage, setAiLanguage] =
    useState(
      getSaved(
        "offsedu_ai_language",
        "English",
      ),
    );

  const [creativity, setCreativity] = useState(
    getSaved("offsedu_creativity", 40),
  );

  // STUDY
  const [difficulty, setDifficulty] =
    useState(
      getSaved(
        "offsedu_difficulty",
        "Medium",
      ),
    );

  const [questionCount, setQuestionCount] =
    useState(
      getSaved(
        "offsedu_question_count",
        "10",
      ),
    );

  const [defaultMarks, setDefaultMarks] =
    useState(
      getSaved(
        "offsedu_default_marks",
        "5",
      ),
    );

  // QUIZ
  const [instantFeedback, setInstantFeedback] =
    useState(
      getSaved(
        "offsedu_instant_feedback",
        true,
      ),
    );

  const [shuffleQuestions, setShuffleQuestions] =
    useState(
      getSaved(
        "offsedu_shuffle_questions",
        true,
      ),
    );

  const [showExplanations, setShowExplanations] =
    useState(
      getSaved(
        "offsedu_show_explanations",
        true,
      ),
    );

  const [allowRetry, setAllowRetry] = useState(
    getSaved("offsedu_allow_retry", true),
  );

  // VOICE
  const [voiceSpeed, setVoiceSpeed] = useState(
    getSaved("offsedu_voice_speed", "1x"),
  );

  const [autoRead, setAutoRead] = useState(
    getSaved("offsedu_auto_read", false),
  );

  const [reducedMotion, setReducedMotion] =
    useState(
      getSaved(
        "offsedu_reduced_motion",
        false,
      ),
    );

  // NOTIFICATIONS
  const [notifications, setNotifications] =
    useState(
      getSaved(
        "offsedu_notifications",
        true,
      ),
    );

  const [studyReminders, setStudyReminders] =
    useState(
      getSaved(
        "offsedu_study_reminders",
        true,
      ),
    );

  const [quizResults, setQuizResults] =
    useState(
      getSaved(
        "offsedu_quiz_results",
        true,
      ),
    );

  const [reminderTime, setReminderTime] =
    useState(
      getSaved(
        "offsedu_reminder_time",
        "19:00",
      ),
    );

  // DATA
  const [saveChats, setSaveChats] = useState(
    getSaved("offsedu_save_chats", true),
  );

  const [saveDocuments, setSaveDocuments] =
    useState(
      getSaved(
        "offsedu_save_documents",
        true,
      ),
    );

  const [autoSave, setAutoSave] = useState(
    getSaved("offsedu_autosave", true),
  );

  const [saved, setSaved] = useState(false);

  const saveSettings = () => {
    const settings = {
      offsedu_language: language,
      offsedu_theme: theme,
      offsedu_compact_mode: compactMode,

      offsedu_response_style: responseStyle,
      offsedu_explanation_level:
        explanationLevel,
      offsedu_ai_language: aiLanguage,
      offsedu_creativity: creativity,

      offsedu_difficulty: difficulty,
      offsedu_question_count: questionCount,
      offsedu_default_marks: defaultMarks,

      offsedu_instant_feedback:
        instantFeedback,
      offsedu_shuffle_questions:
        shuffleQuestions,
      offsedu_show_explanations:
        showExplanations,
      offsedu_allow_retry: allowRetry,

      offsedu_voice_speed: voiceSpeed,
      offsedu_auto_read: autoRead,
      offsedu_reduced_motion:
        reducedMotion,

      offsedu_notifications: notifications,
      offsedu_study_reminders:
        studyReminders,
      offsedu_quiz_results: quizResults,
      offsedu_reminder_time: reminderTime,

      offsedu_save_chats: saveChats,
      offsedu_save_documents:
        saveDocuments,
      offsedu_autosave: autoSave,
    };

    Object.entries(settings).forEach(
      ([key, value]) => {
        localStorage.setItem(
          key,
          JSON.stringify(value),
        );
      },
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const resetSettings = () => {
    const confirmed = window.confirm(
      "Reset all OFFSEDU settings to their default values?",
    );

    if (!confirmed) return;

    const keys = [
      "offsedu_language",
      "offsedu_theme",
      "offsedu_compact_mode",
      "offsedu_response_style",
      "offsedu_explanation_level",
      "offsedu_ai_language",
      "offsedu_creativity",
      "offsedu_difficulty",
      "offsedu_question_count",
      "offsedu_default_marks",
      "offsedu_instant_feedback",
      "offsedu_shuffle_questions",
      "offsedu_show_explanations",
      "offsedu_allow_retry",
      "offsedu_voice_speed",
      "offsedu_auto_read",
      "offsedu_reduced_motion",
      "offsedu_notifications",
      "offsedu_study_reminders",
      "offsedu_quiz_results",
      "offsedu_reminder_time",
      "offsedu_save_chats",
      "offsedu_save_documents",
      "offsedu_autosave",
    ];

    keys.forEach((key) =>
      localStorage.removeItem(key),
    );

    window.location.reload();
  };

  const clearLocalData = () => {
    const confirmed = window.confirm(
      "This will delete OFFSEDU's locally stored demo data, including subjects and settings. Continue?",
    );

    if (!confirmed) return;

    localStorage.clear();

    window.location.reload();
  };

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
              <SettingsIcon
                size={21}
                className="text-white"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Settings
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Customize your OFFSEDU experience.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={resetSettings}
            className="flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-slate-500 transition hover:bg-white/[0.07] hover:text-white"
          >
            <RotateCcw size={14} />
            Reset Settings
          </button>

        </div>

        <div className="space-y-5">

          {/* GENERAL */}
          <SettingsSection
            icon={Globe}
            title="General"
            description="Basic interface and appearance preferences"
          >

            <SettingRow
              title="Interface Language"
              description="Language used throughout the application."
            >
              <Select
                value={language}
                onChange={setLanguage}
                options={languages}
              />
            </SettingRow>

            <SettingRow
              title="Appearance"
              description="Choose your preferred visual theme."
              stacked
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {themes.map((item) => {
                  const Icon = item.icon;
                  const active =
                    theme === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setTheme(item.id)
                      }
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                        active
                          ? "border-white/20 bg-white/[0.08] ring-1 ring-white/10"
                          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05]">
                        <Icon
                          size={17}
                          className="text-slate-400"
                        />
                      </div>

                      <div className="flex-1">
                        <p className="text-xs font-medium text-white">
                          {item.name}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-600">
                          {item.description}
                        </p>
                      </div>

                      {active && (
                        <Check
                          size={16}
                          className="text-slate-300"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </SettingRow>

            <SettingToggle
              icon={Palette}
              title="Compact Mode"
              description="Use tighter spacing for more content on screen."
              enabled={compactMode}
              onChange={() =>
                setCompactMode(
                  (value) => !value,
                )
              }
            />

          </SettingsSection>

          {/* AI */}
          <SettingsSection
            icon={Bot}
            title="AI Preferences"
            description="Customize how Gemma responds and explains"
          >

            <SettingRow
              title="AI Response Style"
              description="Default style for chatbot responses."
            >
              <Select
                value={responseStyle}
                onChange={setResponseStyle}
                options={responseStyles}
              />
            </SettingRow>

            <SettingRow
              title="Explanation Level"
              description="Default complexity for AI explanations."
            >
              <Select
                value={explanationLevel}
                onChange={setExplanationLevel}
                options={explanationLevels}
              />
            </SettingRow>

            <SettingRow
              title="AI Explanation Language"
              description="Language Gemma should use for explanations."
            >
              <Select
                value={aiLanguage}
                onChange={setAiLanguage}
                options={languages}
              />
            </SettingRow>

            <SettingRow
              title="AI Creativity"
              description="Higher values produce more varied responses."
              stacked
            >
              <div className="flex items-center gap-4">

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={creativity}
                  onChange={(event) =>
                    setCreativity(
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                  className="w-full accent-white"
                />

                <span className="w-10 text-right text-xs font-medium text-white">
                  {creativity}%
                </span>

              </div>

              <div className="mt-2 flex justify-between text-[10px] text-slate-700">
                <span>Focused</span>
                <span>Creative</span>
              </div>
            </SettingRow>

          </SettingsSection>

          {/* STUDY */}
          <SettingsSection
            icon={BookOpenIcon}
            title="Study Preferences"
            description="Set defaults for quizzes and test papers"
          >

            <SettingRow
              title="Default Difficulty"
              description="Starting difficulty for generated questions."
            >
              <Select
                value={difficulty}
                onChange={setDifficulty}
                options={difficulties}
              />
            </SettingRow>

            <SettingRow
              title="Default Question Count"
              description="Number of questions used by default."
            >
              <Select
                value={questionCount}
                onChange={setQuestionCount}
                options={questionCounts}
                suffix=" Questions"
              />
            </SettingRow>

            <SettingRow
              title="Default Marks"
              description="Default marks per test-paper question."
            >
              <Select
                value={defaultMarks}
                onChange={setDefaultMarks}
                options={marksOptions}
                suffix=" Marks"
              />
            </SettingRow>

          </SettingsSection>

          {/* QUIZ */}
          <SettingsSection
            icon={Zap}
            title="Quiz Preferences"
            description="Control your MCQ quiz experience"
          >

            <SettingToggle
              icon={Check}
              title="Instant Feedback"
              description="Show whether your selected answer is correct immediately."
              enabled={instantFeedback}
              onChange={() =>
                setInstantFeedback(
                  (value) => !value,
                )
              }
            />

            <SettingToggle
              icon={RefreshCwIcon}
              title="Shuffle Questions"
              description="Randomize question order when starting a quiz."
              enabled={shuffleQuestions}
              onChange={() =>
                setShuffleQuestions(
                  (value) => !value,
                )
              }
            />

            <SettingToggle
              icon={Eye}
              title="Show Answer Explanations"
              description="Show explanations after answering quiz questions."
              enabled={showExplanations}
              onChange={() =>
                setShowExplanations(
                  (value) => !value,
                )
              }
            />

            <SettingToggle
              icon={RotateCcw}
              title="Allow Quiz Retry"
              description="Allow completed quizzes to be attempted again."
              enabled={allowRetry}
              onChange={() =>
                setAllowRetry(
                  (value) => !value,
                )
              }
            />

          </SettingsSection>

          {/* VOICE */}
          <SettingsSection
            icon={Volume2}
            title="Voice & Accessibility"
            description="Audio and accessibility preferences"
          >

            <SettingRow
              title="Voice Speed"
              description="Playback speed for AI voice explanations."
            >
              <Select
                value={voiceSpeed}
                onChange={setVoiceSpeed}
                options={voiceSpeeds}
              />
            </SettingRow>

            <SettingToggle
              icon={Volume2}
              title="Auto Read Explanations"
              description="Automatically read AI explanations when available."
              enabled={autoRead}
              onChange={() =>
                setAutoRead(
                  (value) => !value,
                )
              }
            />

            <SettingToggle
              icon={Accessibility}
              title="Reduced Motion"
              description="Reduce interface animations and transitions."
              enabled={reducedMotion}
              onChange={() =>
                setReducedMotion(
                  (value) => !value,
                )
              }
            />

          </SettingsSection>

          {/* NOTIFICATIONS */}
          <SettingsSection
            icon={Bell}
            title="Notifications"
            description="Manage study reminders and alerts"
          >

            <SettingToggle
              icon={Bell}
              title="Notifications"
              description="Enable OFFSEDU notifications."
              enabled={notifications}
              onChange={() =>
                setNotifications(
                  (value) => !value,
                )
              }
            />

            <SettingToggle
              icon={Clock3}
              title="Study Reminders"
              description="Receive reminders for planned study sessions."
              enabled={studyReminders}
              onChange={() =>
                setStudyReminders(
                  (value) => !value,
                )
              }
            />

            <SettingRow
              title="Daily Reminder Time"
              description="Preferred time for your study reminder."
            >
              <input
                type="time"
                value={reminderTime}
                onChange={(event) =>
                  setReminderTime(
                    event.target.value,
                  )
                }
                className="rounded-xl border border-white/10 bg-[#0b0f18] px-4 py-2.5 text-sm text-white outline-none focus:border-white/20"
              />
            </SettingRow>

            <SettingToggle
              icon={Check}
              title="Quiz Results"
              description="Notify when a quiz result is ready."
              enabled={quizResults}
              onChange={() =>
                setQuizResults(
                  (value) => !value,
                )
              }
            />

          </SettingsSection>

          {/* DATA */}
          <SettingsSection
            icon={Database}
            title="Data & Privacy"
            description="Control locally stored study information"
          >

            <SettingToggle
              icon={MessageSquare}
              title="Save Chat History"
              description="Keep your AI conversations available in chat history."
              enabled={saveChats}
              onChange={() =>
                setSaveChats(
                  (value) => !value,
                )
              }
            />

            <SettingToggle
              icon={Database}
              title="Save Document History"
              description="Keep uploaded document metadata in your library."
              enabled={saveDocuments}
              onChange={() =>
                setSaveDocuments(
                  (value) => !value,
                )
              }
            />

            <SettingToggle
              icon={SaveIcon}
              title="Auto Save Preferences"
              description="Automatically preserve your application preferences."
              enabled={autoSave}
              onChange={() =>
                setAutoSave(
                  (value) => !value,
                )
              }
            />

            <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

              <div>
                <p className="text-sm font-medium text-slate-300">
                  Clear Local Data
                </p>

                <p className="mt-1 max-w-xl text-xs leading-5 text-slate-600">
                  Delete locally stored settings, subjects and demo
                  application data from this browser.
                </p>
              </div>

              <button
                type="button"
                onClick={clearLocalData}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-slate-500 transition hover:bg-white/[0.07] hover:text-white"
              >
                <Trash2 size={15} />
                Clear Data
              </button>

            </div>

          </SettingsSection>

          {/* LOCAL AI */}
          <SettingsSection
            icon={Cpu}
            title="Local AI Engine"
            description="Information about the OFFSEDU AI runtime"
          >

            <div className="px-5 py-5 sm:px-6">

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
                    <Sparkles
                      size={20}
                      className="text-slate-300"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">

                      <p className="text-sm font-semibold text-white">
                        Gemma
                      </p>

                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-slate-600">
                        Local
                      </span>

                    </div>

                    <p className="mt-1 text-xs text-slate-600">
                      AI engine powered through the planned Ollama integration.
                    </p>
                  </div>

                  <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                    Backend Pending
                  </span>

                </div>

              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">

                <InfoCard
                  icon={Cpu}
                  label="Runtime"
                  value="Ollama"
                />

                <InfoCard
                  icon={Bot}
                  label="Model"
                  value="Gemma"
                />

                <InfoCard
                  icon={Shield}
                  label="Privacy"
                  value="Local First"
                />

              </div>

            </div>

          </SettingsSection>

          {/* ABOUT */}
          <SettingsSection
            icon={Info}
            title="About OFFSEDU"
            description="Application information"
          >

            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">

              <InfoCard
                icon={SettingsIcon}
                label="Application"
                value="OFFSEDU"
              />

              <InfoCard
                icon={Zap}
                label="Version"
                value="1.0.0"
              />

              <InfoCard
                icon={Bot}
                label="AI"
                value="Gemma"
              />

              <InfoCard
                icon={Languages}
                label="Languages"
                value="4"
              />

            </div>

          </SettingsSection>

        </div>

        {/* SAVE BAR */}
        <div className="sticky bottom-4 mt-6 flex justify-end">

          <button
            type="button"
            onClick={saveSettings}
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-2xl transition hover:bg-slate-200"
          >
            {saved ? (
              <>
                <Check size={17} />
                Settings Saved
              </>
            ) : (
              <>
                <Save size={17} />
                Save Settings
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* COMPONENTS */
/* -------------------------------------------------- */

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">

      <div className="border-b border-white/10 px-5 py-4 sm:px-6">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05]">
            <Icon
              size={17}
              className="text-slate-400"
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">
              {title}
            </h2>

            <p className="mt-0.5 text-xs text-slate-600">
              {description}
            </p>
          </div>

        </div>

      </div>

      <div className="divide-y divide-white/10">
        {children}
      </div>

    </section>
  );
}

function SettingRow({
  title,
  description,
  children,
  stacked = false,
}) {
  return (
    <div
      className={`px-5 py-5 sm:px-6 ${
        stacked
          ? "space-y-4"
          : "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      }`}
    >

      <div>
        <p className="text-sm font-medium text-slate-300">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-600">
          {description}
        </p>
      </div>

      <div className={stacked ? "" : "sm:shrink-0"}>
        {children}
      </div>

    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  suffix = "",
}) {
  return (
    <div className="relative">

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="min-w-44 appearance-none rounded-xl border border-white/10 bg-[#0b0f18] py-2.5 pl-4 pr-10 text-sm text-white outline-none focus:border-white/20"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
            {suffix}
          </option>
        ))}
      </select>

      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
      />

    </div>
  );
}

function SettingToggle({
  icon: Icon,
  title,
  description,
  enabled,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">

      <div className="flex min-w-0 items-start gap-3">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
          <Icon
            size={16}
            className="text-slate-500"
          />
        </div>

        <div>
          <p className="text-sm font-medium text-slate-300">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-600">
            {description}
          </p>
        </div>

      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
          enabled
            ? "border-white/20 bg-white/[0.15]"
            : "border-white/10 bg-white/[0.04]"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full transition-all ${
            enabled
              ? "left-6 bg-white"
              : "left-1 bg-slate-600"
          }`}
        />
      </button>

    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">

      <div className="flex items-center gap-2">

        {Icon && (
          <Icon
            size={14}
            className="text-slate-600"
          />
        )}

        <p className="text-[10px] uppercase tracking-wider text-slate-700">
          {label}
        </p>

      </div>

      <p className="mt-2 text-xs font-medium text-slate-400">
        {value}
      </p>

    </div>
  );
}

/*
 * Small icon aliases keep the main JSX readable.
 */
function BookOpenIcon(props) {
  return (
    <svg
      {...props}
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 4h6a4 4 0 0 1 4 4v12a4 4 0 0 0-4-4H2z" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v12a4 4 0 0 1 4-4h6z" />
    </svg>
  );
}

function RefreshCwIcon(props) {
  return (
    <svg
      {...props}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

function SaveIcon(props) {
  return (
    <svg
      {...props}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

export default Settings;