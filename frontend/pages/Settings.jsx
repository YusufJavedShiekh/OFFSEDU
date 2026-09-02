import { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  Brain,
  Check,
  Clock3,
  Database,
  Globe,
  HardDrive,
  Info,
  Languages,
  Monitor,
  Moon,
  Palette,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Volume2,
} from "lucide-react";

const SETTINGS_KEY = "offsedu_settings";

const defaultSettings = {
  interfaceLanguage: "English",
  appearance: "Dark",
  compactMode: false,

  responseStyle: "Balanced",
  explanationLevel: "Detailed",
  aiLanguage: "English",
  creativity: "Medium",

  difficulty: "Medium",
  questionCount: "10",
  defaultMarks: "5",

  instantFeedback: true,
  shuffleQuestions: true,
  answerExplanations: true,
  allowRetry: true,

  voiceSpeed: "1.0x",
  autoRead: false,
  reducedMotion: false,

  notifications: true,
  studyReminders: true,
  dailyReminderTime: "20:00",
  quizResults: true,

  saveChatHistory: true,
  saveDocumentHistory: true,
  autoSave: true,

  aiModel: "Gemma",
  aiEngine: "Ollama",
  localFirst: true,
};

function getSavedSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);

    if (!saved) {
      return defaultSettings;
    }

    return {
      ...defaultSettings,
      ...JSON.parse(saved),
    };
  } catch {
    return defaultSettings;
  }
}

function Settings() {
  const [settings, setSettings] = useState(getSavedSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setSettings(getSavedSettings());
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const updateSetting = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  };

  const saveSettings = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2200);
  };

  const resetSettings = () => {
    const confirmed = window.confirm(
      "Reset all OFFSEDU settings to their default values?",
    );

    if (!confirmed) return;

    setSettings(defaultSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2200);
  };

  const clearLocalData = () => {
    const confirmed = window.confirm(
      "This will remove saved OFFSEDU settings and local study data. Continue?",
    );

    if (!confirmed) return;

    localStorage.clear();

    setSettings(defaultSettings);

    alert("Local OFFSEDU data has been cleared.");
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-gradient-to-br from-[#063b3b] via-[#06272d] to-[#03070b] px-4 py-6 sm:px-6 lg:px-8">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-20 h-[420px] w-[420px] rounded-full bg-teal-500/10 blur-3xl" />

        <div className="absolute right-[-120px] top-1/4 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="absolute bottom-[-180px] left-1/3 h-[420px] w-[420px] rounded-full bg-teal-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-300/20 bg-teal-400/10 text-teal-300">
              <SettingsIcon size={22} />
            </div>

            <div>
              <p className="text-sm font-medium text-teal-300">
                Customize OFFSEDU
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Settings
              </h1>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Configure your interface, AI behavior, study preferences, voice,
            notifications and local privacy settings.
          </p>
        </div>

        <div className="space-y-5">
          {/* General */}
          <SettingsSection
            icon={Palette}
            title="General"
            description="Basic interface and appearance preferences."
          >
            <SettingRow
              icon={Languages}
              title="Interface Language"
              description="Language used throughout the OFFSEDU interface."
            >
              <Select
                value={settings.interfaceLanguage}
                onChange={(value) =>
                  updateSetting("interfaceLanguage", value)
                }
                options={["English", "Hindi", "Marathi", "Urdu"]}
              />
            </SettingRow>

            <SettingRow
              icon={Monitor}
              title="Appearance"
              description="Choose how OFFSEDU looks."
            >
              <Select
                value={settings.appearance}
                onChange={(value) => updateSetting("appearance", value)}
                options={["Dark", "System", "Light"]}
              />
            </SettingRow>

            <SettingRow
              icon={BookOpen}
              title="Compact Mode"
              description="Use a more compact layout with less spacing."
            >
              <SettingToggle
                enabled={settings.compactMode}
                onChange={(value) => updateSetting("compactMode", value)}
              />
            </SettingRow>
          </SettingsSection>

          {/* AI Preferences */}
          <SettingsSection
            icon={Brain}
            title="AI Preferences"
            description="Control how the local AI responds to you."
          >
            <SettingRow
              icon={Sparkles}
              title="Response Style"
              description="Choose the general style of AI responses."
            >
              <Select
                value={settings.responseStyle}
                onChange={(value) => updateSetting("responseStyle", value)}
                options={["Concise", "Balanced", "Detailed"]}
              />
            </SettingRow>

            <SettingRow
              icon={BookOpen}
              title="Explanation Level"
              description="Set the default depth of explanations."
            >
              <Select
                value={settings.explanationLevel}
                onChange={(value) =>
                  updateSetting("explanationLevel", value)
                }
                options={["Simple", "Detailed", "Exam Focused"]}
              />
            </SettingRow>

            <SettingRow
              icon={Languages}
              title="AI Language"
              description="Preferred language for AI-generated responses."
            >
              <Select
                value={settings.aiLanguage}
                onChange={(value) => updateSetting("aiLanguage", value)}
                options={["English", "Hindi", "Marathi", "Urdu"]}
              />
            </SettingRow>

            <SettingRow
              icon={Sparkles}
              title="Creativity"
              description="Controls how varied AI responses can be."
            >
              <Select
                value={settings.creativity}
                onChange={(value) => updateSetting("creativity", value)}
                options={["Low", "Medium", "High"]}
              />
            </SettingRow>
          </SettingsSection>

          {/* Study Preferences */}
          <SettingsSection
            icon={BookOpen}
            title="Study Preferences"
            description="Set defaults for your study and question generation."
          >
            <SettingRow
              icon={TargetIcon}
              title="Default Difficulty"
              description="Default difficulty for generated study content."
            >
              <Select
                value={settings.difficulty}
                onChange={(value) => updateSetting("difficulty", value)}
                options={["Easy", "Medium", "Hard"]}
              />
            </SettingRow>

            <SettingRow
              icon={BookOpen}
              title="Question Count"
              description="Default number of questions for quizzes."
            >
              <Select
                value={settings.questionCount}
                onChange={(value) => updateSetting("questionCount", value)}
                options={["5", "10", "20", "30"]}
              />
            </SettingRow>

            <SettingRow
              icon={BookOpen}
              title="Default Marks"
              description="Default marks used in question paper generation."
            >
              <Select
                value={settings.defaultMarks}
                onChange={(value) => updateSetting("defaultMarks", value)}
                options={["1", "2", "5", "10", "15", "20"]}
              />
            </SettingRow>
          </SettingsSection>

          {/* Quiz */}
          <SettingsSection
            icon={Check}
            title="Quiz Preferences"
            description="Customize your quiz experience."
          >
            <SettingRow
              icon={Check}
              title="Instant Feedback"
              description="Show whether an answer is correct immediately."
            >
              <SettingToggle
                enabled={settings.instantFeedback}
                onChange={(value) =>
                  updateSetting("instantFeedback", value)
                }
              />
            </SettingRow>

            <SettingRow
              icon={RefreshCw}
              title="Shuffle Questions"
              description="Randomize the order of quiz questions."
            >
              <SettingToggle
                enabled={settings.shuffleQuestions}
                onChange={(value) =>
                  updateSetting("shuffleQuestions", value)
                }
              />
            </SettingRow>

            <SettingRow
              icon={BookOpen}
              title="Answer Explanations"
              description="Show explanations after answering questions."
            >
              <SettingToggle
                enabled={settings.answerExplanations}
                onChange={(value) =>
                  updateSetting("answerExplanations", value)
                }
              />
            </SettingRow>

            <SettingRow
              icon={RefreshCw}
              title="Allow Retry"
              description="Allow completed quizzes to be attempted again."
            >
              <SettingToggle
                enabled={settings.allowRetry}
                onChange={(value) => updateSetting("allowRetry", value)}
              />
            </SettingRow>
          </SettingsSection>

          {/* Voice */}
          <SettingsSection
            icon={Volume2}
            title="Voice & Accessibility"
            description="Configure voice playback and accessibility behavior."
          >
            <SettingRow
              icon={Volume2}
              title="Voice Speed"
              description="Default playback speed for AI voice."
            >
              <Select
                value={settings.voiceSpeed}
                onChange={(value) => updateSetting("voiceSpeed", value)}
                options={["0.75x", "1.0x", "1.25x", "1.5x", "2.0x"]}
              />
            </SettingRow>

            <SettingRow
              icon={Volume2}
              title="Auto Read"
              description="Automatically read AI responses aloud when voice is available."
            >
              <SettingToggle
                enabled={settings.autoRead}
                onChange={(value) => updateSetting("autoRead", value)}
              />
            </SettingRow>

            <SettingRow
              icon={Monitor}
              title="Reduced Motion"
              description="Reduce interface animations and transitions."
            >
              <SettingToggle
                enabled={settings.reducedMotion}
                onChange={(value) =>
                  updateSetting("reducedMotion", value)
                }
              />
            </SettingRow>
          </SettingsSection>

          {/* Notifications */}
          <SettingsSection
            icon={Bell}
            title="Notifications"
            description="Manage study and quiz notifications."
          >
            <SettingRow
              icon={Bell}
              title="Notifications"
              description="Enable OFFSEDU notifications."
            >
              <SettingToggle
                enabled={settings.notifications}
                onChange={(value) =>
                  updateSetting("notifications", value)
                }
              />
            </SettingRow>

            <SettingRow
              icon={Clock3}
              title="Study Reminders"
              description="Receive reminders for your study schedule."
            >
              <SettingToggle
                enabled={settings.studyReminders}
                onChange={(value) =>
                  updateSetting("studyReminders", value)
                }
              />
            </SettingRow>

            <SettingRow
              icon={Clock3}
              title="Daily Reminder Time"
              description="Preferred time for your daily study reminder."
            >
              <input
                type="time"
                value={settings.dailyReminderTime}
                onChange={(event) =>
                  updateSetting("dailyReminderTime", event.target.value)
                }
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300 outline-none focus:border-teal-400/30"
              />
            </SettingRow>

            <SettingRow
              icon={TrophyIcon}
              title="Quiz Results"
              description="Show notifications when quiz results are ready."
            >
              <SettingToggle
                enabled={settings.quizResults}
                onChange={(value) => updateSetting("quizResults", value)}
              />
            </SettingRow>
          </SettingsSection>

          {/* Data & Privacy */}
          <SettingsSection
            icon={ShieldCheck}
            title="Data & Privacy"
            description="Control what OFFSEDU stores locally."
          >
            <SettingRow
              icon={Database}
              title="Save Chat History"
              description="Keep your conversations available locally."
            >
              <SettingToggle
                enabled={settings.saveChatHistory}
                onChange={(value) =>
                  updateSetting("saveChatHistory", value)
                }
              />
            </SettingRow>

            <SettingRow
              icon={BookOpen}
              title="Save Document History"
              description="Remember recently used study documents."
            >
              <SettingToggle
                enabled={settings.saveDocumentHistory}
                onChange={(value) =>
                  updateSetting("saveDocumentHistory", value)
                }
              />
            </SettingRow>

            <SettingRow
              icon={Save}
              title="Auto Save"
              description="Automatically save supported local settings and progress."
            >
              <SettingToggle
                enabled={settings.autoSave}
                onChange={(value) => updateSetting("autoSave", value)}
              />
            </SettingRow>

            <div className="border-t border-white/[0.06] pt-4">
              <button
                type="button"
                onClick={clearLocalData}
                className="inline-flex items-center gap-2 rounded-xl border border-red-400/10 bg-red-400/[0.04] px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-400/[0.08]"
              >
                <Trash2 size={17} />
                Clear Local Data
              </button>
            </div>
          </SettingsSection>

          {/* Local AI */}
          <SettingsSection
            icon={HardDrive}
            title="Local AI Engine"
            description="Information about the local AI setup."
          >
            <SettingRow
              icon={Brain}
              title="AI Model"
              description="Model intended for local AI responses."
            >
              <Select
                value={settings.aiModel}
                onChange={(value) => updateSetting("aiModel", value)}
                options={["Gemma"]}
              />
            </SettingRow>

            <SettingRow
              icon={Database}
              title="AI Engine"
              description="Local engine planned for running the model."
            >
              <Select
                value={settings.aiEngine}
                onChange={(value) => updateSetting("aiEngine", value)}
                options={["Ollama"]}
              />
            </SettingRow>

            <SettingRow
              icon={ShieldCheck}
              title="Local First"
              description="Prefer local processing whenever supported."
            >
              <SettingToggle
                enabled={settings.localFirst}
                onChange={(value) => updateSetting("localFirst", value)}
              />
            </SettingRow>

            <div className="rounded-2xl border border-teal-300/10 bg-teal-400/[0.035] p-4">
              <div className="flex gap-3">
                <Info
                  size={18}
                  className="mt-0.5 shrink-0 text-teal-300"
                />

                <p className="text-xs leading-5 text-slate-500">
                  The local AI engine and backend integration can be connected
                  later. These settings prepare the frontend for the local
                  OFFSEDU architecture.
                </p>
              </div>
            </div>
          </SettingsSection>

          {/* About */}
          <SettingsSection
            icon={Info}
            title="About OFFSEDU"
            description="Application and project information."
          >
            <InfoRow label="Application" value="OFFSEDU" />
            <InfoRow label="Version" value="1.0.0" />
            <InfoRow label="AI Model" value="Gemma" />
            <InfoRow
              label="Supported Languages"
              value="English · Hindi · Marathi · Urdu"
            />
            <InfoRow
              label="Architecture"
              value="Local-first"
            />
          </SettingsSection>

          {/* Bottom Actions */}
          <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6">
              {saved && (
                <div className="flex items-center gap-2 text-sm text-teal-300">
                  <Check size={17} />
                  Settings saved successfully.
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={resetSettings}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
              >
                <RefreshCw size={17} />
                Reset Settings
              </button>

              <button
                type="button"
                onClick={saveSettings}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
              >
                <Save size={17} />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#061214]/65 p-5 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-6">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-teal-300/10 bg-teal-400/10 text-teal-300">
          <Icon size={20} />
        </div>

        <div>
          <h2 className="font-semibold text-white">{title}</h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {children}
      </div>
    </section>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <div className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <Icon
            size={17}
            className="mt-0.5 shrink-0 text-slate-600"
          />
        )}

        <div>
          <h3 className="text-sm font-medium text-slate-300">
            {title}
          </h3>

          <p className="mt-1 max-w-xl text-xs leading-5 text-slate-600">
            {description}
          </p>
        </div>
      </div>

      <div className="shrink-0 sm:ml-6">{children}</div>
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-w-[150px] rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300 outline-none transition focus:border-teal-400/30"
    >
      {options.map((option) => (
        <option
          key={option}
          value={option}
          className="bg-slate-900 text-white"
        >
          {option}
        </option>
      ))}
    </select>
  );
}

function SettingToggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative h-7 w-12 rounded-full border transition ${
        enabled
          ? "border-teal-400/30 bg-teal-400/20"
          : "border-white/10 bg-white/[0.05]"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full transition-all ${
          enabled
            ? "left-6 bg-teal-300"
            : "left-1 bg-slate-600"
        }`}
      />
    </button>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-500">{label}</span>

      <span className="text-sm font-medium text-slate-300 sm:text-right">
        {value}
      </span>
    </div>
  );
}

function TargetIcon(props) {
  return <BookOpen {...props} />;
}

function TrophyIcon(props) {
  return <Sparkles {...props} />;
}

export default Settings;