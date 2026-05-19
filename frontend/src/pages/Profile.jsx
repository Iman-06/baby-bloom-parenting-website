import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Flower2, Home, ClipboardPlus, MessageCircle, User, LogOut, Baby,
  Calendar, UserCircle, Pencil
} from "lucide-react";
import { getMe } from "../api/auth";
import { getChild, createChild } from "../api/child";
import LoadingSkeleton from "../components/LoadingSkeleton";

const navItems = [
  { name: "Dashboard", icon: Home, href: "/dashboard", active: false },
  { name: "Log Activity", icon: ClipboardPlus, href: "/log-activity", active: false },
  { name: "AI Chat", icon: MessageCircle, href: "/chat", active: false },
  { name: "Profile", icon: User, href: "/profile", active: true },
];

function calculateAge(dobStr) {
  if (!dobStr) return "";
  const dob = new Date(dobStr);
  const now = new Date();
  const months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years <= 0) {
    return `${Math.max(0, months)} month${Math.max(0, months) !== 1 ? "s" : ""}`;
  } else if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? "s" : ""}`;
  } else {
    return `${years} year${years !== 1 ? "s" : ""} ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMemberSince(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [parentInfo, setParentInfo] = useState(null);
  const [babyProfile, setBabyProfile] = useState(null);
  
  const [formData, setFormData] = useState({
    babyName: "",
    gender: "",
    dateOfBirth: "",
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await getMe();
        setParentInfo(user);
        
        try {
          const childData = await getChild();
          const currentChild = Array.isArray(childData) ? childData[0] : childData;
          setBabyProfile(currentChild);
        } catch (err) {
          // If 404, child doesn't exist
          if (err.response?.status !== 404) {
            console.error("Error fetching child:", err);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    
    try {
      await createChild({
        name: formData.babyName,
        gender: formData.gender,
        date_of_birth: formData.dateOfBirth
      });
      // Reload page state to refetch everything
      window.location.reload();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to create profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-2xl"><LoadingSkeleton /></div>
      </div>
    );
  }

  const hasProfile = !!babyProfile;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[oklch(0.94_0.02_340)] fixed left-0 top-0 h-full flex flex-col z-20">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[oklch(0.85_0.08_340)] to-[oklch(0.82_0.08_230)]" />
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[oklch(0.88_0.08_340)] to-[oklch(0.85_0.08_230)] flex items-center justify-center">
                <Flower2 className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[oklch(0.78_0.1_230)]" />
            </div>
            <span className="text-xl font-bold text-[oklch(0.45_0.08_340)]" style={{ fontFamily: "var(--font-display)" }}>
              Baby Bloom
            </span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    item.active
                      ? "bg-gradient-to-r from-[oklch(0.95_0.03_340)] to-[oklch(0.95_0.03_230)] text-[oklch(0.45_0.08_340)] font-medium"
                      : "text-muted-foreground hover:bg-[oklch(0.97_0.01_340)] hover:text-[oklch(0.45_0.08_340)]"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${item.active ? "text-[oklch(0.65_0.1_340)]" : ""}`} />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-[oklch(0.94_0.02_340)]">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[oklch(0.6_0.08_340)] hover:bg-[oklch(0.96_0.03_340)] hover:text-[oklch(0.5_0.1_340)] transition-all">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 relative">
        <div className="max-w-2xl mx-auto mt-4">
          {hasProfile && babyProfile ? (
            /* State 1: Profile Exists */
            <div className="bg-white rounded-3xl shadow-lg border border-[oklch(0.94_0.02_340)] p-8 relative z-10">
              <div className="flex flex-col items-center mb-6">
                <div className="w-32 h-32 rounded-full border-4 border-[oklch(0.88_0.08_340)] bg-gradient-to-br from-[oklch(0.95_0.04_340)] to-[oklch(0.95_0.04_230)] flex items-center justify-center mb-4 shadow-md">
                  <Baby className="w-16 h-16 text-[oklch(0.65_0.1_340)]" />
                </div>
                <h1 className="text-3xl font-bold text-[oklch(0.35_0.05_340)]" style={{ fontFamily: "var(--font-display)" }}>
                  {babyProfile.name}
                </h1>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <div className="bg-[oklch(0.98_0.02_230)] rounded-xl p-4 text-center">
                  <Calendar className="w-5 h-5 text-[oklch(0.65_0.1_230)] mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Age</p>
                  <p className="font-semibold text-[oklch(0.35_0.05_230)]">
                    {calculateAge(babyProfile.date_of_birth)}
                  </p>
                </div>

                <div className={`rounded-xl p-4 text-center ${babyProfile.gender === "female" ? "bg-[oklch(0.98_0.02_340)]" : babyProfile.gender === "male" ? "bg-[oklch(0.98_0.02_230)]" : "bg-[oklch(0.98_0.02_280)]"}`}>
                  <UserCircle className={`w-5 h-5 mx-auto mb-2 ${babyProfile.gender === "female" ? "text-[oklch(0.65_0.1_340)]" : babyProfile.gender === "male" ? "text-[oklch(0.65_0.1_230)]" : "text-[oklch(0.65_0.1_280)]"}`} />
                  <p className="text-xs text-muted-foreground mb-1">Gender</p>
                  <p className={`font-semibold capitalize ${babyProfile.gender === "female" ? "text-[oklch(0.45_0.08_340)]" : babyProfile.gender === "male" ? "text-[oklch(0.45_0.08_230)]" : "text-[oklch(0.45_0.08_280)]"}`}>
                    {babyProfile.gender}
                  </p>
                </div>

                <div className="bg-[oklch(0.98_0.03_80)] rounded-xl p-4 text-center">
                  <Calendar className="w-5 h-5 text-[oklch(0.65_0.1_80)] mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Date of Birth</p>
                  <p className="font-semibold text-[oklch(0.35_0.05_80)]">
                    {formatDate(babyProfile.date_of_birth)}
                  </p>
                </div>

                <div className="bg-[oklch(0.98_0.02_150)] rounded-xl p-4 text-center">
                  <User className="w-5 h-5 text-[oklch(0.55_0.12_150)] mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Member Since</p>
                  <p className="font-semibold text-[oklch(0.35_0.05_150)]">
                    {formatMemberSince(parentInfo?.created_at)}
                  </p>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-[oklch(0.9_0.03_340)] to-transparent mb-6" />

              <div className="text-center mb-8">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Parent Account</p>
                <p className="font-medium text-[oklch(0.4_0.05_340)]">{parentInfo?.name}</p>
                <p className="text-muted-foreground text-sm">{parentInfo?.email}</p>
              </div>

            </div>
          ) : (
            /* State 2: No Profile Yet */
            <div className="bg-white rounded-3xl shadow-lg border border-[oklch(0.94_0.02_340)] p-8 relative z-10">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[oklch(0.92_0.04_340)] to-[oklch(0.92_0.04_230)] flex items-center justify-center mx-auto mb-4">
                  <Baby className="w-10 h-10 text-[oklch(0.65_0.1_340)]" />
                </div>
                <h1 className="text-2xl font-bold text-[oklch(0.35_0.05_340)] mb-2" style={{ fontFamily: "var(--font-display)" }}>
                  Set Up Your Baby&apos;s Profile
                </h1>
                <p className="text-muted-foreground">
                  Tell us a little about your little one to get started
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="babyName" className="block text-sm font-medium text-[oklch(0.4_0.05_340)] mb-2">
                    Baby&apos;s Name
                  </label>
                  <input
                    type="text"
                    id="babyName"
                    name="babyName"
                    value={formData.babyName}
                    onChange={handleInputChange}
                    placeholder="Enter your baby's name"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[oklch(0.92_0.03_340)] bg-[oklch(0.99_0.005_340)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.78_0.1_230)] focus:border-transparent transition-all placeholder:text-muted-foreground/50"
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-[oklch(0.4_0.05_340)] mb-2">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[oklch(0.92_0.03_340)] bg-[oklch(0.99_0.005_340)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.78_0.1_230)] focus:border-transparent transition-all text-foreground"
                  >
                    <option value="" disabled>Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-[oklch(0.4_0.05_340)] mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 rounded-xl border border-[oklch(0.92_0.03_340)] bg-[oklch(0.99_0.005_340)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.78_0.1_230)] focus:border-transparent transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[oklch(0.8_0.1_340)] via-[oklch(0.78_0.09_300)] to-[oklch(0.78_0.1_230)] text-white font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all mt-6 disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isSubmitting ? "Creating..." : "Create Profile"}
                </button>
                
                {formError && (
                  <p className="text-sm text-red-500 text-center mt-2 bg-red-50 p-2 rounded-lg border border-red-100">
                    {formError}
                  </p>
                )}
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
