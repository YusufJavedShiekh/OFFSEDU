import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  LogIn,
} from "lucide-react";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    alert("Login will be connected to the backend later.");
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

          {/* Login Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl sm:p-8">
            {/* Header */}
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.08] ring-1 ring-white/10">
                <LogIn className="h-6 w-6 text-slate-200" />
              </div>

              <h1 className="text-2xl font-semibold text-white">
                Welcome Back
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Login to continue your OFFSEDU learning journey.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                  <input
                    id="login-email"
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
                  htmlFor="login-password"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        password: event.target.value,
                      })
                    }
                    placeholder="Enter your password"
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
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    alert("Password recovery will be connected later.")
                  }
                  className="text-xs text-slate-400 transition hover:text-white"
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                <LogIn className="h-4 w-4" />
                Login
              </button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 border-t border-white/10 pt-6 text-center">
              <p className="text-sm text-slate-500">
                Don't have an account?
              </p>

              <Link
                to="/signin"
                className="mt-2 inline-block text-sm font-medium text-slate-200 transition hover:text-white"
              >
                Create an account
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

export default Login;