import { useState } from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  Edit3,
  Flame,
  GraduationCap,
  Mail,
  Save,
  ShieldCheck,
  Target,
  Trophy,
  User,
  X,
} from "lucide-react";

const initialProfile = {
  name: "OFFSEDU Student",
  email: "student@example.com",
  bio: "Learning with AI, one topic at a time.",
};

const recentActivity = [
  {
    title: "Completed DBMS Quiz",
    detail: "Scored 90% in Database Management System",
    time: "Today",
    icon: Trophy,
  },
  {
    title: "Studied for 2 hours",
    detail: "Focused on Transactions and Normalization",
    time: "Yesterday",
    icon: Clock3,
  },
  {
    title: "Created a Study Plan",
    detail: "Weekly preparation plan created",
    time: "2 days ago",
    icon: Target,
  },
  {
    title: "Added study material",
    detail: "Database Management System notes",
    time: "3 days ago",
    icon: BookOpen,
  },
];

const achievements = [
  {
    title: "First Quiz",
    description: "Completed your first quiz",
    icon: GraduationCap,
  },
  {
    title: "Consistent Learner",
    description: "Maintained a regular study routine",
    icon: Flame,
  },
  {
    title: "Quiz Master",
    description: "Completed multiple practice quizzes",
    icon: Trophy,
  },
  {
    title: "Study Organizer",
    description: "Created your first study plan",
    icon: Target,
  },
];

function Profile() {
  const [profile, setProfile] = useState(initialProfile);
  const [editForm, setEditForm] = useState(initialProfile);
  const [editOpen, setEditOpen] = useState(false);

  const openEdit = () => {
    setEditForm(profile);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
  };

  const saveProfile = () => {
    const name = editForm.name.trim();
    const email = editForm.email.trim();
    const bio = editForm.bio.trim();

    if (!name || !email) {
      alert("Name and email are required.");
      return;
    }

    setProfile({
      name,
      email,
      bio,
    });

    setEditOpen(false);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-gradient-to-br from-[#063b3b] via-[#06272d] to-[#03070b] px-4 py-6 sm:px-6 lg:px-8">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-20 h-[420px] w-[420px] rounded-full bg-teal-500/10 blur-3xl" />

        <div className="absolute right-[-120px] top-1/4 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="absolute bottom-[-180px] left-1/3 h-[420px] w-[420px] rounded-full bg-teal-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-300/20 bg-teal-400/10 text-teal-300">
              <User size={22} />
            </div>

            <div>
              <p className="text-sm font-medium text-teal-300">
                Account
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Profile
              </h1>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Manage your learning profile and keep track of your progress in
            OFFSEDU.
          </p>
        </div>

        {/* Profile Hero */}
        <section className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-[#061214]/70 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="relative p-5 sm:p-7">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-teal-400/5 blur-3xl" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* Avatar */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-teal-300/20 bg-teal-400/10 text-2xl font-semibold text-teal-300">
                  {profile.name
                    .split(" ")
                    .map((word) => word[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold text-white">
                      {profile.name}
                    </h2>

                    <span className="inline-flex items-center gap-1 rounded-full border border-teal-300/15 bg-teal-400/10 px-2.5 py-1 text-[11px] font-medium text-teal-300">
                      <CheckCircle2 size={12} />
                      Student
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <Mail size={15} />
                    <span className="break-all">{profile.email}</span>
                  </div>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                    {profile.bio || "No bio added yet."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openEdit}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-teal-300/15 hover:bg-teal-400/[0.06] hover:text-white"
              >
                <Edit3 size={17} />
                Edit Profile
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Clock3}
            label="Study Time"
            value="24h"
            description="Total learning time"
          />

          <StatCard
            icon={BookOpen}
            label="Quizzes"
            value="18"
            description="Completed quizzes"
          />

          <StatCard
            icon={GraduationCap}
            label="Subjects"
            value="7"
            description="Active subjects"
          />

          <StatCard
            icon={Trophy}
            label="Avg. Score"
            value="86%"
            description="Quiz performance"
          />
        </section>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          {/* Recent Activity */}
          <section className="rounded-3xl border border-white/10 bg-[#061214]/65 p-5 backdrop-blur-xl sm:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-white">
                  Recent Activity
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Your latest learning activities.
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
                <Clock3 size={18} />
              </div>
            </div>

            <div className="space-y-3">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;

                return (
                  <div
                    key={activity.title}
                    className="flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 transition hover:border-teal-300/10 hover:bg-white/[0.04]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-sm font-medium text-slate-200">
                          {activity.title}
                        </h3>

                        <span className="text-xs text-slate-600">
                          {activity.time}
                        </span>
                      </div>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {activity.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Learning Profile */}
          <section className="rounded-3xl border border-white/10 bg-[#061214]/65 p-5 backdrop-blur-xl sm:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-white">
                  Learning Profile
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Your current study preferences.
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
                <Target size={18} />
              </div>
            </div>

            <div className="space-y-3">
              <PreferenceRow
                label="Preferred Difficulty"
                value="Medium"
              />

              <PreferenceRow
                label="Study Language"
                value="English"
              />

              <PreferenceRow
                label="Daily Study Goal"
                value="2 Hours"
              />

              <PreferenceRow
                label="Response Style"
                value="Balanced"
              />

              <PreferenceRow
                label="Quiz Questions"
                value="10"
              />
            </div>
          </section>
        </div>

        {/* Achievements */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-[#061214]/65 p-5 backdrop-blur-xl sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">
                Achievements
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Milestones from your learning journey.
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
              <Award size={18} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;

              return (
                <div
                  key={achievement.title}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 transition hover:border-teal-300/10 hover:bg-white/[0.04]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-teal-300/10 bg-teal-400/10 text-teal-300">
                    <Icon size={20} />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-white">
                    {achievement.title}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {achievement.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Privacy */}
        <section className="mt-6 rounded-3xl border border-teal-300/10 bg-teal-400/[0.035] p-5 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h3 className="font-medium text-white">
                Local & Private
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Your OFFSEDU profile is designed around local-first
                functionality. Cloud account features can be connected later.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="py-8 text-center">
          <p className="text-xs text-slate-600">
            OFFSEDU · AI-powered local learning environment
          </p>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#071214] p-6 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Edit Profile
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Update your local profile information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEdit}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Full Name
                </label>

                <input
                  type="text"
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-teal-400/30"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email
                </label>

                <input
                  type="email"
                  value={editForm.email}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-teal-400/30"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Bio
                </label>

                <textarea
                  rows={4}
                  value={editForm.bio}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      bio: event.target.value,
                    }))
                  }
                  placeholder="Tell us a little about yourself..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-teal-400/30"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeEdit}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveProfile}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
              >
                <Save size={17} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#061214]/65 p-4 backdrop-blur-xl sm:p-5">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
          <Icon size={19} />
        </div>

        <span className="text-xl font-semibold text-white">
          {value}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-300">
        {label}
      </p>

      <p className="mt-1 text-xs text-slate-600">
        {description}
      </p>
    </div>
  );
}

function PreferenceRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
      <span className="text-xs text-slate-500">{label}</span>

      <span className="text-xs font-medium text-slate-300">
        {value}
      </span>
    </div>
  );
}

export default Profile;