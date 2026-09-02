import { useState } from "react";
import {
  User,
  Mail,
  CalendarDays,
  Clock3,
  Trophy,
  BookOpen,
  Target,
  Award,
  Pencil,
  X,
  Check,
  ShieldCheck,
  Brain,
  GraduationCap,
} from "lucide-react";

function Profile() {
  const [editOpen, setEditOpen] = useState(false);

  const [profile, setProfile] = useState({
    name: "OFFSEDU Student",
    email: "student@example.com",
    bio: "Learning smarter with AI-powered study tools.",
  });

  const [editProfile, setEditProfile] = useState(profile);

  const openEdit = () => {
    setEditProfile(profile);
    setEditOpen(true);
  };

  const saveProfile = () => {
    setProfile(editProfile);
    setEditOpen(false);
  };

  const stats = [
    {
      label: "Study Time",
      value: "24h",
      icon: Clock3,
      description: "This month",
    },
    {
      label: "Quizzes",
      value: "18",
      icon: Target,
      description: "Completed",
    },
    {
      label: "Subjects",
      value: "7",
      icon: BookOpen,
      description: "Learning",
    },
    {
      label: "Avg. Score",
      value: "86%",
      icon: Trophy,
      description: "Overall",
    },
  ];

  const recentActivity = [
    {
      icon: Brain,
      title: "Completed a Quiz",
      description: "Database Management System",
      time: "2 hours ago",
    },
    {
      icon: BookOpen,
      title: "Studied a Document",
      description: "Computer Networks Notes",
      time: "Yesterday",
    },
    {
      icon: GraduationCap,
      title: "Created Study Plan",
      description: "DBMS Examination Preparation",
      time: "2 days ago",
    },
  ];

  const achievements = [
    {
      icon: Award,
      title: "Quiz Starter",
      description: "Completed your first quiz",
    },
    {
      icon: Target,
      title: "Focused Learner",
      description: "Completed 10 quizzes",
    },
    {
      icon: BookOpen,
      title: "Knowledge Builder",
      description: "Studied 5 subjects",
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div>
          <p className="text-sm font-medium text-slate-400">Account</p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Profile
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Manage your profile and track your learning progress.
          </p>
        </div>

        {/* Profile Hero */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/[0.08] ring-1 ring-white/10">
                  <User className="h-9 w-9 text-slate-200" />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold text-white sm:text-2xl">
                    {profile.name}
                  </h2>

                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{profile.email}</span>
                  </div>

                  <p className="mt-2 text-sm text-slate-400">
                    {profile.bio}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openEdit}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.09] hover:text-white"
              >
                <Pencil className="h-4 w-4" />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Account Status */}
          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06]">
                  <ShieldCheck className="h-5 w-5 text-slate-200" />
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    Local & Private
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Your study data stays on your device.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06]">
                  <CalendarDays className="h-5 w-5 text-slate-200" />
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    Member Since
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    September 2026
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">
              Learning Overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your study activity at a glance.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
                      <Icon className="h-5 w-5 text-slate-300" />
                    </div>

                    <span className="text-xs text-slate-500">
                      {stat.description}
                    </span>
                  </div>

                  <p className="mt-5 text-2xl font-semibold text-white">
                    {stat.value}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Activity + Learning Profile */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="border-b border-white/10 p-5 sm:p-6">
              <h2 className="font-semibold text-white">Recent Activity</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your latest learning activities.
              </p>
            </div>

            <div className="divide-y divide-white/10">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;

                return (
                  <div
                    key={activity.title}
                    className="flex gap-4 p-5 sm:p-6"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
                      <Icon className="h-5 w-5 text-slate-300" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col justify-between gap-1 sm:flex-row">
                        <p className="text-sm font-medium text-white">
                          {activity.title}
                        </p>

                        <span className="text-xs text-slate-500">
                          {activity.time}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-400">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Learning Profile */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="border-b border-white/10 p-5 sm:p-6">
              <h2 className="font-semibold text-white">
                Learning Profile
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your current study preferences.
              </p>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    Preferred Language
                  </span>

                  <span className="text-sm font-medium text-white">
                    English
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    Explanation Level
                  </span>

                  <span className="text-sm font-medium text-white">
                    Detailed
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    Difficulty
                  </span>

                  <span className="text-sm font-medium text-white">
                    Medium
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    Daily Study Goal
                  </span>

                  <span className="text-sm font-medium text-white">
                    2 Hours
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Achievements */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 p-5 sm:p-6">
            <h2 className="font-semibold text-white">Achievements</h2>

            <p className="mt-1 text-sm text-slate-500">
              Milestones from your learning journey.
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;

              return (
                <div
                  key={achievement.title}
                  className="rounded-xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
                      <Icon className="h-5 w-5 text-slate-200" />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-white">
                        {achievement.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <div className="pb-6 text-center text-xs text-slate-600">
          OFFSEDU • Offline AI Study Assistant
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f17] shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="font-semibold text-white">
                  Edit Profile
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Update your profile information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5 p-5">
              <div>
                <label
                  htmlFor="profile-name"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Name
                </label>

                <input
                  id="profile-name"
                  type="text"
                  value={editProfile.name}
                  onChange={(event) =>
                    setEditProfile({
                      ...editProfile,
                      name: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-white/20 focus:bg-white/[0.06]"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email
                </label>

                <input
                  id="profile-email"
                  type="email"
                  value={editProfile.email}
                  onChange={(event) =>
                    setEditProfile({
                      ...editProfile,
                      email: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-white/20 focus:bg-white/[0.06]"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-bio"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Bio
                </label>

                <textarea
                  id="profile-bio"
                  rows={3}
                  value={editProfile.bio}
                  onChange={(event) =>
                    setEditProfile({
                      ...editProfile,
                      bio: event.target.value,
                    })
                  }
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-white/20 focus:bg-white/[0.06]"
                  placeholder="Tell us about yourself"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t border-white/10 px-5 py-4">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveProfile}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                <Check className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;