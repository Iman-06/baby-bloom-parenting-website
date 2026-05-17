import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Flower2,
  Sparkles,
  AlertTriangle,
  X,
  Home,
  ClipboardPlus,
  MessageCircle,
  User,
  LogOut,
  Plus,
  Moon,
  Baby,
  Droplets,
  Thermometer,
  ChevronRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { getMe } from "../api/auth";
import { getChild } from "../api/child";
import { getActiveAlerts } from "../api/alerts";
import { getDailySummary } from "../api/summary";
import LoadingSkeleton from "../components/LoadingSkeleton";

const weeklyData = [
  { day: "Mon", sleep: 8.5, feedings: 5, diapers: 4 },
  { day: "Tue", sleep: 7.2, feedings: 4, diapers: 5 },
  { day: "Wed", sleep: 9.0, feedings: 6, diapers: 3 },
  { day: "Thu", sleep: 6.8, feedings: 4, diapers: 4 },
  { day: "Fri", sleep: 8.0, feedings: 5, diapers: 5 },
  { day: "Sat", sleep: 7.5, feedings: 4, diapers: 3 },
  { day: "Sun", sleep: 8.5, feedings: 4, diapers: 3 },
];

const monthlyData = [
  { week: "Week 1", sleep: 56, feedings: 32, diapers: 28 },
  { week: "Week 2", sleep: 52, feedings: 30, diapers: 25 },
  { week: "Week 3", sleep: 58, feedings: 35, diapers: 30 },
  { week: "Week 4", sleep: 54, feedings: 28, diapers: 26 },
];



const navItems = [
  { name: "Dashboard", icon: Home, href: "/dashboard", active: true },
  { name: "Log Activity", icon: ClipboardPlus, href: "/log-activity", active: false },
  { name: "AI Chat", icon: MessageCircle, href: "/chat", active: false },
  { name: "Profile", icon: User, href: "/profile", active: false },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("daily");
  
  // Data State
  const [user, setUser] = useState(null);
  const [child, setChild] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [summary, setSummary] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const userData = await getMe();
        setUser(userData);
        
        const childData = await getChild();
        // Handle if API returns an array or single object
        const currentChild = Array.isArray(childData) ? childData[0] : childData;
        setChild(currentChild);
        
        if (currentChild && currentChild.id) {
          const today = new Date().toISOString().split('T')[0];
          
          // Fetch alerts and summary in parallel
          const [alertsRes, summaryRes] = await Promise.allSettled([
            getActiveAlerts(currentChild.id),
            getDailySummary(currentChild.id, today)
          ]);
          
          if (alertsRes.status === 'fulfilled' && alertsRes.value) {
            setAlerts(Array.isArray(alertsRes.value) ? alertsRes.value : [alertsRes.value]);
          }
          
          if (summaryRes.status === 'fulfilled' && summaryRes.value) {
            setSummary(summaryRes.value);
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsSummaryLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const dismissAlert = () => {
    const newAlerts = [...alerts];
    newAlerts.splice(currentAlertIndex, 1);
    setAlerts(newAlerts);
    if (currentAlertIndex >= newAlerts.length) {
      setCurrentAlertIndex(Math.max(0, newAlerts.length - 1));
    }
  };

  const nextAlert = () => {
    setCurrentAlertIndex((prev) => (prev + 1) % alerts.length);
  };

  const chartData = activeTab === "weekly" ? weeklyData : monthlyData;
  const chartKey = activeTab === "weekly" ? "day" : "week";

  const computedStats = summary ? {
    naps: { total: 0, hours: `${summary.total_sleep_hours}h`, last: "--" },
    food: { times: summary.total_feedings, last: "--" },
    diapers: { wet: summary.total_diapers, dirty: 0, last: "--" },
    temperature: { value: summary.avg_temperature, last: "--" },
  } : {
    naps: { total: 0, hours: "0h", last: "--" },
    food: { times: 0, last: "--" },
    diapers: { wet: 0, dirty: 0, last: "--" },
    temperature: { value: "0", last: "--" },
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[oklch(0.94_0.02_340)] fixed left-0 top-0 h-full flex flex-col">
        {/* Pink accent border */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[oklch(0.85_0.08_340)] to-[oklch(0.82_0.08_230)]" />

        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[oklch(0.88_0.08_340)] to-[oklch(0.85_0.08_230)] flex items-center justify-center">
                <Flower2 className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[oklch(0.78_0.1_230)]" />
            </div>
            <span
              className="text-xl font-bold text-[oklch(0.45_0.08_340)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Baby Bloom
            </span>
          </div>
        </div>

        {/* Navigation */}
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

        {/* Logout Button */}
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

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Baby Profile Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[oklch(0.92_0.04_340)] to-[oklch(0.92_0.04_230)] flex items-center justify-center">
                <Baby className="w-8 h-8 text-[oklch(0.65_0.1_340)]" />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold text-[oklch(0.35_0.05_340)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {child?.name || "Baby"}
                </h1>
                <p className="text-muted-foreground" style={{ fontFamily: "var(--font-display)" }}>
                  {/* Ideally this would be calculated from child.date_of_birth */}
                  {child?.date_of_birth ? "Growing fast!" : "Welcome!"}
                </p>
              </div>
            </div>

            {/* Log Activity Button */}
            <button
              onClick={() => navigate('/log-activity')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[oklch(0.8_0.1_340)] via-[oklch(0.78_0.09_300)] to-[oklch(0.78_0.1_230)] text-white font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-5 h-5" />
              Log Activity
            </button>
          </div>

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <div className="bg-[oklch(0.95_0.04_30)] rounded-2xl p-5 relative border border-[oklch(0.9_0.06_30)] shadow-sm">
              <button
                type="button"
                onClick={dismissAlert}
                className="absolute top-4 right-4 text-[oklch(0.5_0.08_30)] hover:text-[oklch(0.4_0.1_30)] transition-colors"
                aria-label="Dismiss alert"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-start gap-3 pr-8">
                <div className="w-10 h-10 rounded-full bg-[oklch(0.9_0.06_30)] flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-[oklch(0.6_0.15_30)]" />
                </div>
                <div className="flex-1">
                  <p className="text-[oklch(0.35_0.05_30)] leading-relaxed pt-2">
                    {alerts[currentAlertIndex]?.message || alerts[currentAlertIndex]?.rule_name || "New alert triggered."}
                  </p>
                  
                  {alerts.length > 1 && (
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-[oklch(0.5_0.08_30)] font-medium">
                        Alert {currentAlertIndex + 1} of {alerts.length}
                      </span>
                      <button 
                        onClick={nextAlert}
                        className="flex items-center gap-1 text-[oklch(0.45_0.1_30)] hover:text-[oklch(0.35_0.1_30)] font-semibold transition-colors"
                      >
                        Next Alert <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Summary Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-[oklch(0.94_0.02_340)] overflow-hidden">
            {/* Tab Switcher */}
            <div className="flex border-b border-[oklch(0.94_0.02_340)]">
              {["daily", "weekly", "monthly"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-6 py-4 font-medium transition-all capitalize ${
                    activeTab === tab
                      ? "text-[oklch(0.45_0.08_340)] border-b-2 border-[oklch(0.75_0.12_340)] bg-[oklch(0.99_0.01_340)]"
                      : "text-muted-foreground hover:text-[oklch(0.45_0.08_340)] hover:bg-[oklch(0.98_0.01_340)]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "daily" ? (
                <div className="space-y-6">
                  {/* Today's Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Naps Card */}
                    <div className="bg-[oklch(0.98_0.02_230)] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Moon className="w-5 h-5 text-[oklch(0.65_0.1_230)]" />
                        <span className="font-semibold text-[oklch(0.4_0.05_230)]">Naps</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Times</p>
                          <p className="font-bold text-[oklch(0.35_0.05_230)] text-lg">{computedStats.naps.total}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Hours</p>
                          <p className="font-bold text-[oklch(0.35_0.05_230)] text-lg">{computedStats.naps.hours}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last</p>
                          <p className="font-bold text-[oklch(0.35_0.05_230)] text-lg">{computedStats.naps.last}</p>
                        </div>
                      </div>
                    </div>

                    {/* Food Card */}
                    <div className="bg-[oklch(0.98_0.02_340)] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Baby className="w-5 h-5 text-[oklch(0.65_0.1_340)]" />
                        <span className="font-semibold text-[oklch(0.4_0.05_340)]">Feeding</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Times</p>
                          <p className="font-bold text-[oklch(0.35_0.05_340)] text-lg">{computedStats.food.times}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last</p>
                          <p className="font-bold text-[oklch(0.35_0.05_340)] text-lg">{computedStats.food.last}</p>
                        </div>
                      </div>
                    </div>

                    {/* Diapers Card */}
                    <div className="bg-[oklch(0.98_0.03_80)] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Droplets className="w-5 h-5 text-[oklch(0.65_0.1_80)]" />
                        <span className="font-semibold text-[oklch(0.4_0.05_80)]">Diapers</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Wet</p>
                          <p className="font-bold text-[oklch(0.35_0.05_80)] text-lg">{computedStats.diapers.wet}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Dirty</p>
                          <p className="font-bold text-[oklch(0.35_0.05_80)] text-lg">{computedStats.diapers.dirty}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last</p>
                          <p className="font-bold text-[oklch(0.35_0.05_80)] text-lg">{computedStats.diapers.last}</p>
                        </div>
                      </div>
                    </div>

                    {/* Temperature Card */}
                    <div className="bg-[oklch(0.98_0.02_150)] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Thermometer className="w-5 h-5 text-[oklch(0.55_0.12_150)]" />
                        <span className="font-semibold text-[oklch(0.4_0.05_150)]">Temperature</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Temp</p>
                          <p className="font-bold text-[oklch(0.35_0.05_150)] text-lg">{computedStats.temperature.value}°C</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last</p>
                          <p className="font-bold text-[oklch(0.35_0.05_150)] text-lg">{computedStats.temperature.last}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Summary */}
                  <div className="border-l-4 border-[oklch(0.78_0.1_230)] pl-4 py-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-[oklch(0.75_0.12_340)]" />
                      <h3
                        className="font-semibold text-[oklch(0.35_0.05_340)]"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        Today&apos;s Summary
                      </h3>
                    </div>
                    {isSummaryLoading ? (
                      <div className="mt-2">
                        <LoadingSkeleton />
                      </div>
                    ) : summary ? (
                      <p className="text-foreground/80 leading-relaxed mb-3">
                        {summary.text || summary.content || summary}
                      </p>
                    ) : (
                      <p className="text-foreground/60 leading-relaxed mb-3 italic">
                        Summary unavailable — please log some activities first
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">AI generated — for informational purposes only</p>
                  </div>
                </div>
              ) : (
                <div>
                  <h3
                    className="text-lg font-semibold text-[oklch(0.35_0.05_340)] mb-4"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {activeTab === "weekly" ? "Weekly" : "Monthly"} Overview
                  </h3>
                  {/* Bar Chart */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.02 340)" vertical={false} />
                        <XAxis
                          dataKey={chartKey}
                          tick={{ fill: "oklch(0.5 0.02 340)", fontSize: 13 }}
                          axisLine={{ stroke: "oklch(0.9 0.02 340)" }}
                          tickLine={false}
                        />
                        <YAxis tick={{ fill: "oklch(0.5 0.02 340)", fontSize: 13 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid oklch(0.92 0.02 340)",
                            borderRadius: "12px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          }}
                        />
                        <Legend
                          wrapperStyle={{ paddingTop: "20px" }}
                          formatter={(value) => <span style={{ color: "oklch(0.4 0.02 340)" }}>{value}</span>}
                        />
                        <Bar dataKey="sleep" name="Sleep (hrs)" fill="oklch(0.78 0.1 230)" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="feedings" name="Feedings" fill="oklch(0.75 0.12 340)" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="diapers" name="Diapers" fill="oklch(0.82 0.08 80)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
