import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Flower2 } from "lucide-react";
import { loginUser } from "../api/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("parent@babybloom.com");
  const [password, setPassword] = useState("supersecret123");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await loginUser({ email, password });
      localStorage.setItem("token", response.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to log in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[oklch(0.97_0.02_340)] to-[oklch(0.97_0.02_230)] p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-[oklch(0.92_0.06_340)] opacity-40 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-[oklch(0.92_0.06_230)] opacity-40 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-[oklch(0.90_0.05_340)] opacity-30 blur-2xl" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl shadow-[oklch(0.8_0.05_340)]/20 p-8 sm:p-10">
        {/* Logo and App Name */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[oklch(0.88_0.08_340)] to-[oklch(0.85_0.08_230)] flex items-center justify-center">
              <Flower2 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[oklch(0.78_0.1_230)]" />
          </div>
          <h1 className="text-3xl font-bold text-[oklch(0.45_0.08_340)]" style={{ fontFamily: "var(--font-display)" }}>
            Baby Bloom
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-center text-muted-foreground mb-8 text-lg">
          Welcome back, super parent! 💕
        </p>

        {/* Login Form */}
        <form className="space-y-5" onSubmit={handleLogin}>
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground/80 block">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[oklch(0.92_0.03_340)] bg-[oklch(0.99_0.005_340)] text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[oklch(0.78_0.1_230)] focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground/80 block">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[oklch(0.92_0.03_340)] bg-[oklch(0.99_0.005_340)] text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[oklch(0.78_0.1_230)] focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>



          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[oklch(0.75_0.12_340)] via-[oklch(0.78_0.1_300)] to-[oklch(0.78_0.1_230)] shadow-lg shadow-[oklch(0.75_0.12_340)]/30 hover:shadow-xl hover:shadow-[oklch(0.75_0.12_340)]/40 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:pointer-events-none"
          >
            {isLoading ? "Logging in..." : "Sign In"}
          </button>
          
          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-500 text-center mt-2 bg-red-50 p-2 rounded-lg border border-red-100">
              {error}
            </p>
          )}
        </form>

        {/* Register Link */}
        <p className="text-center mt-8 text-muted-foreground">
          {"Don't have an account? "}
          <Link
            to="/register"
            className="text-[oklch(0.65_0.1_340)] hover:text-[oklch(0.55_0.12_340)] font-semibold transition-colors hover:underline"
          >
            Register here
          </Link>
        </p>
      </div>
    </main>
  );
}
