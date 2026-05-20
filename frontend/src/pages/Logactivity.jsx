import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Flower2, Home, ClipboardPlus, MessageCircle, User, LogOut,
  Moon, Thermometer, Droplets, Baby, Wind, CheckCircle2, AlertCircle,
} from "lucide-react";
import { getChild } from "../api/child";
import {
  logSleep, logTemperature, logDiaper,
  logFeeding, logCrying, getActivities,
} from "../api/activities";

// ── sidebar nav ──────────────────────────────────────────────
const navItems = [
  { name: "Dashboard",    icon: Home,          href: "/dashboard",    active: false },
  { name: "Log Activity", icon: ClipboardPlus, href: "/log-activity", active: true  },
  { name: "AI Chat",      icon: MessageCircle, href: "/chat",         active: false },
  { name: "Profile",      icon: User,          href: "/profile",      active: false },
];

// ── activity tab definitions ─────────────────────────────────
const TABS = [
  {
    key:         "sleep",
    label:       "Sleep",
    Icon:        Moon,
    accent:      "230",
    description: "Log a sleep session with start and end time",
  },
  {
    key:         "temperature",
    label:       "Temperature",
    Icon:        Thermometer,
    accent:      "150",
    description: "Record a temperature reading (34–42 °C)",
  },
  {
    key:         "diaper",
    label:       "Diaper",
    Icon:        Droplets,
    accent:      "80",
    description: "Log the number of diaper changes",
  },
  {
    key:         "feeding",
    label:       "Feeding",
    Icon:        Baby,
    accent:      "340",
    description: "Log the number of feeding sessions",
  },
  {
    key:         "crying",
    label:       "Crying",
    Icon:        Wind,
    accent:      "280",
    description: "Record crying duration in minutes",
  },
];

// ── helpers ───────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function LogActivityPage() {
  const navigate = useNavigate();

  const [child,      setChild]      = useState(null);
  const [activeTab,  setActiveTab]  = useState("sleep");
  const [date,       setDate]       = useState(todayStr());
  const [todayLogs,  setTodayLogs]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [toast,      setToast]      = useState(null);

  // form values
  const [sleepStart, setSleepStart]  = useState("");
  const [sleepEnd,   setSleepEnd]    = useState("");
  const [tempVal,    setTempVal]     = useState("");
  const [diaperCnt,  setDiaperCnt]   = useState("");
  const [feedingCnt, setFeedingCnt]  = useState("");
  const [cryingMins, setCryingMins]  = useState("");

  // ── load child ─────────────────────────────────────────────
  useEffect(() => {
    getChild()
      .then((data) => {
        const c = Array.isArray(data) ? data[0] : data;
        setChild(c);
        if (c?.id) {
          localStorage.setItem("child_id",   c.id);
          localStorage.setItem("child_name", c.name);
        }
      })
      .catch(() => {});
  }, []);

  // ── load today's logs when date or child changes ──────────
  useEffect(() => {
    if (!child?.id) return;
    getActivities(child.id, date)
      .then(setTodayLogs)
      .catch(() => setTodayLogs(null));
  }, [child, date]);

  function flash(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  // ── submit handler ────────────────────────────────────────
  async function handleSubmit(e) {
  e.preventDefault();
  if (!child?.id) {
    flash("No child profile found — please create one in Profile first.", false);
    return;
  }
  setLoading(true);
  try {
    if (activeTab === "sleep") {
      if (!sleepStart || !sleepEnd) { 
        flash("Please fill in both times.", false); 
        return; 
      }
      await logSleep(child.id, { start_time: sleepStart, end_time: sleepEnd });
      setSleepStart(""); 
      setSleepEnd("");
    } else if (activeTab === "temperature") {
      if (!tempVal) { 
        flash("Please enter a temperature.", false); 
        return; 
      }
      await logTemperature(child.id, { value: parseFloat(tempVal) });
      setTempVal("");
    } else if (activeTab === "diaper") {
      if (!diaperCnt) { 
        flash("Please enter the number of diaper changes.", false); 
        return; 
      }
      await logDiaper(child.id, { count: parseInt(diaperCnt) });
      setDiaperCnt("");
    } else if (activeTab === "feeding") {
      if (!feedingCnt) { 
        flash("Please enter the number of feedings.", false); 
        return; 
      }
      await logFeeding(child.id, { count: parseInt(feedingCnt) });
      setFeedingCnt("");
    } else if (activeTab === "crying") {
      if (!cryingMins) { 
        flash("Please enter crying duration.", false); 
        return; 
      }
      await logCrying(child.id, { duration_mins: parseInt(cryingMins) });
      setCryingMins("");
    }
    flash("Logged successfully!");
    
    // IMPORTANT: Clear todayLogs FIRST, then fetch fresh data
    setTodayLogs(null);
    const freshLogs = await getActivities(child.id, date);
    setTodayLogs(freshLogs);
    
  } catch (err) {
    console.error("Error:", err.response?.data);
    const detail = err?.response?.data?.detail;
    flash(typeof detail === "string" ? detail : "Something went wrong.", false);
  } finally {
    setLoading(false);
  }
}

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const tab = TABS.find((t) => t.key === activeTab);

  // ── shared input class ────────────────────────────────────
  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-[oklch(0.92_0.03_340)] bg-[oklch(0.99_0.005_340)] text-foreground placeholder:text-muted-foreground/60 transition-all focus:outline-none focus:ring-2 focus:ring-[oklch(0.78_0.1_230)] focus:border-transparent";

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Sidebar ── */}
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
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[oklch(0.6_0.08_340)] hover:bg-[oklch(0.96_0.03_340)] hover:text-[oklch(0.5_0.1_340)] transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Page header */}
          <div>
            <h1 className="text-2xl font-bold text-[oklch(0.35_0.05_340)]" style={{ fontFamily: "var(--font-display)" }}>
              Log Activity
            </h1>
            <p className="text-muted-foreground mt-1">
              Tracking {child?.name || "your baby"}'s day
            </p>
          </div>

          {/* Date selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-[oklch(0.4_0.05_340)]">Date</label>
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => setDate(e.target.value)}
              className="border border-[oklch(0.92_0.03_340)] rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.78_0.1_230)] focus:border-transparent transition-all"
            />
          </div>

          {/* Activity tab pills */}
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === t.key
                    ? "bg-gradient-to-r from-[oklch(0.8_0.1_340)] via-[oklch(0.78_0.09_300)] to-[oklch(0.78_0.1_230)] text-white shadow-md"
                    : "bg-white text-muted-foreground border border-[oklch(0.92_0.03_340)] hover:border-[oklch(0.85_0.06_340)] hover:text-[oklch(0.45_0.08_340)]"
                }`}
              >
                <t.Icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Log form card */}
          <div className="bg-white rounded-2xl shadow-sm border border-[oklch(0.94_0.02_340)] p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-9 h-9 rounded-xl bg-[oklch(0.96_0.03_${tab.accent})] flex items-center justify-center`}>
                <tab.Icon className={`w-5 h-5 text-[oklch(0.55_0.12_${tab.accent})]`} />
              </div>
              <div>
                <h2 className="font-semibold text-[oklch(0.35_0.05_340)]">Log {tab.label}</h2>
                <p className="text-xs text-muted-foreground">{tab.description}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Sleep */}
              {activeTab === "sleep" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[oklch(0.4_0.05_340)] mb-1.5">
                      Start time
                    </label>
                    <input
                      type="datetime-local"
                      value={sleepStart}
                      onChange={(e) => setSleepStart(e.target.value)}
                      required
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[oklch(0.4_0.05_340)] mb-1.5">
                      End time
                    </label>
                    <input
                      type="datetime-local"
                      value={sleepEnd}
                      onChange={(e) => setSleepEnd(e.target.value)}
                      required
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {/* Temperature */}
              {activeTab === "temperature" && (
                <div>
                  <label className="block text-sm font-medium text-[oklch(0.4_0.05_340)] mb-1.5">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="34"
                    max="42"
                    value={tempVal}
                    onChange={(e) => setTempVal(e.target.value)}
                    placeholder="e.g. 37.2"
                    required
                    className={inputCls}
                  />
                </div>
              )}

              {/* Diaper */}
              {activeTab === "diaper" && (
                <div>
                  <label className="block text-sm font-medium text-[oklch(0.4_0.05_340)] mb-1.5">
                    Number of diaper changes
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={diaperCnt}
                    onChange={(e) => setDiaperCnt(e.target.value)}
                    placeholder="e.g. 4"
                    required
                    className={inputCls}
                  />
                </div>
              )}

              {/* Feeding */}
              {activeTab === "feeding" && (
                <div>
                  <label className="block text-sm font-medium text-[oklch(0.4_0.05_340)] mb-1.5">
                    Number of feeding sessions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={feedingCnt}
                    onChange={(e) => setFeedingCnt(e.target.value)}
                    placeholder="e.g. 6"
                    required
                    className={inputCls}
                  />
                </div>
              )}

              {/* Crying */}
              {activeTab === "crying" && (
                <div>
                  <label className="block text-sm font-medium text-[oklch(0.4_0.05_340)] mb-1.5">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={cryingMins}
                    onChange={(e) => setCryingMins(e.target.value)}
                    placeholder="e.g. 15"
                    required
                    className={inputCls}
                  />
                </div>
              )}

              {/* Toast */}
              {toast && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
                  toast.ok
                    ? "bg-[oklch(0.96_0.03_150)] text-[oklch(0.35_0.08_150)] border border-[oklch(0.88_0.06_150)]"
                    : "bg-[oklch(0.97_0.03_30)] text-[oklch(0.4_0.1_30)] border border-[oklch(0.9_0.06_30)]"
                }`}>
                  {toast.ok
                    ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                    : <AlertCircle  className="w-4 h-4 shrink-0" />}
                  {toast.msg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[oklch(0.8_0.1_340)] via-[oklch(0.78_0.09_300)] to-[oklch(0.78_0.1_230)] text-white font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? "Saving…" : `Save ${tab.label}`}
              </button>
            </form>
          </div>

          {/* Today's logged entries */}
          {todayLogs && (
            <div className="bg-white rounded-2xl shadow-sm border border-[oklch(0.94_0.02_340)] p-6">
              <h2 className="font-semibold text-[oklch(0.35_0.05_340)] mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Logged on {date}
              </h2>
              <div className="space-y-5">
                <LogSection
                  icon={Moon} hue="230" title="Sleep"
                  items={todayLogs.sleep}
                  render={(e) => `${fmtTime(e.start_time)} → ${fmtTime(e.end_time)}`}
                />
                <LogSection
                  icon={Thermometer} hue="150" title="Temperature"
                  items={todayLogs.temperature}
                  render={(e) => `${e.value} °C at ${fmtTime(e.logged_at)}`}
                />
                <LogSection
                  icon={Droplets} hue="80" title="Diapers"
                  items={todayLogs.diaper}
                  render={(e) => `${e.count} change${e.count !== 1 ? "s" : ""} at ${fmtTime(e.logged_at)}`}
                />
                <LogSection
                  icon={Baby} hue="340" title="Feedings"
                  items={todayLogs.feeding}
                  render={(e) => `${e.count} feeding${e.count !== 1 ? "s" : ""} at ${fmtTime(e.logged_at)}`}
                />
                <LogSection
                  icon={Wind} hue="280" title="Crying"
                  items={todayLogs.crying}
                  render={(e) => `${e.duration_mins} min at ${fmtTime(e.logged_at)}`}
                />
              </div>

              {/* empty state */}
              {["sleep","temperature","diaper","feeding","crying"].every(
                (k) => !todayLogs[k] || todayLogs[k].length === 0
              ) && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No activity logged for this date yet.
                </p>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// ── sub-component: one category of logged items ───────────────
function LogSection({ icon: Icon, hue, title, items, render }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg bg-[oklch(0.96_0.03_${hue})] flex items-center justify-center`}>
          <Icon className={`w-4 h-4 text-[oklch(0.55_0.12_${hue})]`} />
        </div>
        <span className="text-sm font-semibold text-[oklch(0.4_0.05_340)]">{title}</span>
        <span className="ml-auto text-xs text-muted-foreground">{items.length} entr{items.length === 1 ? "y" : "ies"}</span>
      </div>
      <ul className="space-y-1 pl-9">
        {items.map((item) => (
          <li key={item.id} className="text-sm text-foreground/80 bg-[oklch(0.98_0.01_340)] rounded-lg px-3 py-1.5">
            {render(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}