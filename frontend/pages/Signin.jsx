import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function SignIn() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

  const handleCreateAccount = (event) => {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    alert(
      "Account creation will be connected to the OFFSEDU backend later.",
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#063b3b] via-[#06272d] to-[#03070b] text-slate-100">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[450px] w-[450px] rounded-full bg-teal-500/10 blur-3xl" />

        <div className="absolute -right-32 top-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="absolute bottom-[-200px] left-1/3 h-[450px] w-[450px] rounded-full bg-teal-400/5 blur-3xl" />
      </div>

      {/* Back */}
      <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-400 backdrop-blur-xl transition hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft size={17} />

          <span className="hidden sm:inline">Back to OFFSEDU</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>

      {/* Main */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-20 sm:px-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-7 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-300/20 bg-teal-400/10">
                <span className="text-xl font-bold text-teal-300">O</span>
              </div>

              <span className="text-2xl font-semibold tracking-tight text-white">
                OFFSEDU
              </span>
            </Link>

            <p className="mt-3 text-sm text-slate-500">
              Start your local AI-powered learning journey
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-white/10 bg-[#061214]/75 p-6 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:p-8">
            {/* Header */}
            <div className="mb-7">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-300/10 bg-teal-400/10 text-teal-300">
                <User size={21} />
              </div>

              <h1 className="text-2xl font-semibold text-white">
                Create your account
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create an OFFSEDU account to manage your learning experience.
              </p>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-5">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="signup-name"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Full name
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    id="signup-name"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Your full name"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-700 transition focus:border-teal-400/30 focus:bg-black/30"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-700 transition focus:border-teal-400/30 focus:bg-black/30"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="signup-password"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-11 text-sm text-white outline-none placeholder:text-slate-700 transition focus:border-teal-400/30 focus:bg-black/30"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-300"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="Enter password again"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-11 text-sm text-white outline-none placeholder:text-slate-700 transition focus:border-teal-400/30 focus:bg-black/30"
                  />

                  <button
                    type="button"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-400/10 bg-red-400/[0.04] px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* Terms */}
              <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-slate-600">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/10 bg-black/20 accent-teal-400"
                />

                <span>
                  I agree to use OFFSEDU responsibly and understand that
                  backend authentication will be connected later.
                </span>
              </label>

              {/* Create Account */}
              <button
                type="submit"
                className="w-full rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 active:scale-[0.99]"
              >
                Create Account
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/[0.06]" />

              <span className="text-xs text-slate-700">OR</span>

              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            {/* Login */}
            <div className="text-center">
              <p className="text-sm text-slate-500">
                Already have an account?
              </p>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-2 text-sm font-medium text-teal-400 transition hover:text-teal-300"
              >
                Login to OFFSEDU
              </button>
            </div>

            {/* Privacy */}
            <div className="mt-7 flex items-start gap-3 rounded-2xl border border-teal-300/10 bg-teal-400/[0.03] p-4">
              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-teal-400"
              />

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Local & Private
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  OFFSEDU is being designed around a local-first architecture
                  so your learning experience can remain private.
                </p>
              </div>
            </div>

            {/* Small status */}
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-700">
              <Check size={14} />
              Frontend authentication UI ready
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-slate-700">
            © 2026 OFFSEDU · Local · Private · AI-powered learning
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;