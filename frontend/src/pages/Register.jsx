import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Flower2 } from "lucide-react";
import { registerUser, loginUser } from "../api/auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 1. Register
      await registerUser({ name, email, password });
      
      // 2. Login immediately after
      const response = await loginUser({ email, password });
      localStorage.setItem("token", response.access_token);
      
      // 3. Redirect
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-[oklch(0.92_0.06_340)] rounded-full blur-3xl opacity-40 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[oklch(0.92_0.05_230)] rounded-full blur-3xl opacity-40 translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-[oklch(0.95_0.04_340)] rounded-full blur-2xl opacity-30" />

      {/* Register Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_40px_-12px_oklch(0.8_0.08_340)] p-8 relative z-10">
        {/* Logo */}
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
        <p className="text-center text-muted-foreground mb-8 text-lg">
          Let&apos;s get you started
        </p>

        {/* Register Form */}
        <form className="space-y-5" onSubmit={handleRegister}>
          {/* Full Name Input */}
          <div className="space-y-2">
            <label
              htmlFor="fullname"
              className="text-sm font-medium text-foreground/80 block"
            >
              Full Name
            </label>
            <input
              id="fullname"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl border border-[oklch(0.92_0.03_340)] bg-white text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[oklch(0.82_0.08_230)] focus:border-transparent transition-all"
            />
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground/80 block"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl border border-[oklch(0.92_0.03_340)] bg-white text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[oklch(0.82_0.08_230)] focus:border-transparent transition-all"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground/80 block"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-xl border border-[oklch(0.92_0.03_340)] bg-white text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[oklch(0.82_0.08_230)] focus:border-transparent transition-all"
            />
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[oklch(0.82_0.1_340)] via-[oklch(0.8_0.08_300)] to-[oklch(0.82_0.1_230)] text-white font-semibold shadow-lg shadow-[oklch(0.85_0.08_340)]/30 hover:shadow-xl hover:shadow-[oklch(0.85_0.08_340)]/40 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:pointer-events-none"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
          
          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-500 text-center mt-2 bg-red-50 p-2 rounded-lg border border-red-100">
              {error}
            </p>
          )}
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[oklch(0.7_0.12_340)] hover:text-[oklch(0.6_0.14_340)] font-medium transition-colors"
          >
            Login here
          </Link>
        </p>
      </div>
    </main>
  );
}
