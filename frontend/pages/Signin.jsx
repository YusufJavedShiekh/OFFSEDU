import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  UserPlus,
} from "lucide-react";

function SignIn() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    alert("Account creation will be connected to the backend later.");
  };

  return (
    <div className="min-h-screen bg-[#05070d] px-4 py-8 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md items-center justify-center">
        <div className="w-full">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to OFFSEDU
          </button>

          {/* Sign In Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl sm:p-8">
            {/* Header */}
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.08] ring-1 ring-white/10">
                <UserPlus className="h-6 w-6 text-slate-200" />
              </div>

              <h1 className="text-2xl font-semibold text-white">
                Create Account
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Create your OFFSEDU account and start learning smarter.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="signin-name"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Full Name
                </label>

                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                  <input
                    id="signin-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-white/20 focus:bg-white/[0.06]"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="signin-email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                  <input
                    id="signin-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        email: event.target.value,
                      })
                    }
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-white/20 focus:bg-white/[0.06]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="signin-password"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                  <input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        password: event.target.value,
                      })
                    }
                    placeholder="Create a password"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-white/20 focus:bg-white/[0.06]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-200"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <p className="mt-1.5 text-xs text-slate-600">
                  Password must contain at least 6 characters.
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="signin-confirm-password"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Confirm Password
                </label>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                  <input
                    id="signin-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={form.confirmPassword}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        confirmPassword: event.target.value,
                      })
                    }
                    placeholder="Confirm your password"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-white/20 focus:bg-white/[0.06]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-200"
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Create Account */}
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                <UserPlus className="h-4 w-4" />
                Create Account
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 border-t border-white/10 pt-6 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?
              </p>

              <Link
                to="/login"
                className="mt-2 inline-block text-sm font-medium text-slate-200 transition hover:text-white"
              >
                Login
              </Link>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-slate-600">
            OFFSEDU • Offline AI Study Assistant
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;