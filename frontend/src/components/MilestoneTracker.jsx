// src/components/MilestoneTracker.jsx
import React from "react";
import { Baby, Eye, Footprints, Hand, Smile, Volume2, Star, Zap } from "lucide-react";

const MILESTONES = [
  {
    months: 1,
    label: "1 Month",
    title: "Newborn Awareness",
    description: "Focuses on faces within 12 inches, startles to sounds, makes a small fist.",
    Icon: Baby,
  },
  {
    months: 2,
    label: "2 Months",
    title: "First Smiles",
    description: "Smiles socially for the first time, follows moving objects with eyes, holds head up briefly.",
    Icon: Smile,
  },
  {
    months: 3,
    label: "3 Months",
    title: "Hand Discovery",
    description: "Vision still developing — cannot see clearly yet. Discovers hands, coos and gurgles, recognises your voice.",
    Icon: Hand,
  },
  {
    months: 4,
    label: "4 Months",
    title: "Laughs & Lifts",
    description: "Laughs out loud for the first time, holds head steady, pushes up on arms during tummy time.",
    Icon: Volume2,
  },
  {
    months: 6,
    label: "6 Months",
    title: "Sight & Sitting",
    description: "Vision significantly improves — starts seeing well! Sits with support, rolls both ways, may start solid foods, babbles.",
    Icon: Eye,
  },
  {
    months: 9,
    label: "9 Months",
    title: "Pulls to Stand",
    description: "Pulls up to standing, begins crawling, waves bye-bye, uses pincer grasp, says mama/dada.",
    Icon: Footprints,
  },
  {
    months: 12,
    label: "12 Months",
    title: "First Steps!",
    description: "Begins walking (first steps!), says 1–3 words, points to objects, can drink from a cup.",
    Icon: Zap,
  },
  {
    months: 18,
    label: "18 Months",
    title: "Running & Talking",
    description: "Runs, says 10+ words, feeds self with a spoon, climbs on furniture.",
    Icon: Star,
  },
];

function getAgeMonths(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  return (
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())
  );
}

export default function MilestoneTracker({ dateOfBirth, childName }) {
  const ageMonths = getAgeMonths(dateOfBirth);

  // Index of the next milestone not yet reached
  const nextIdx =
    ageMonths !== null
      ? MILESTONES.findIndex((m) => m.months > ageMonths)
      : -1;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[oklch(0.94_0.02_340)] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2
            className="font-semibold text-[oklch(0.35_0.05_340)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Developmental Milestones
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {ageMonths !== null
              ? `${childName || "Baby"} is ${ageMonths} month${ageMonths !== 1 ? "s" : ""} old`
              : "Add a child profile to track milestones"}
          </p>
        </div>
        {ageMonths !== null && (
          <span className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-[oklch(0.92_0.04_340)] to-[oklch(0.92_0.04_230)] text-[oklch(0.45_0.08_340)] font-medium">
            {ageMonths}mo
          </span>
        )}
      </div>

      {/* Milestone list */}
      <div className="space-y-2.5">
        {MILESTONES.map((m, i) => {
          const achieved = ageMonths !== null && ageMonths >= m.months + 1;
          const current  = ageMonths !== null && !achieved && ageMonths >= m.months - 1;
          const isNext   = i === nextIdx;

          return (
            <div
              key={m.months}
              className={`flex gap-3 p-3.5 rounded-xl border transition-all ${
                achieved
                  ? "bg-[oklch(0.97_0.02_150)] border-[oklch(0.88_0.06_150)]"
                  : isNext
                  ? "bg-[oklch(0.96_0.03_230)] border-[oklch(0.82_0.08_230)] ring-2 ring-[oklch(0.78_0.1_230)] ring-offset-1"
                  : "bg-[oklch(0.99_0.01_340)] border-[oklch(0.93_0.02_340)]"
              }`}
            >
              {/* Icon bubble */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  achieved
                    ? "bg-[oklch(0.88_0.08_150)]"
                    : isNext
                    ? "bg-[oklch(0.88_0.08_230)]"
                    : "bg-[oklch(0.92_0.02_340)]"
                }`}
              >
                <m.Icon
                  className={`w-4 h-4 ${
                    achieved
                      ? "text-[oklch(0.45_0.12_150)]"
                      : isNext
                      ? "text-[oklch(0.45_0.12_230)]"
                      : "text-[oklch(0.65_0.06_340)]"
                  }`}
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                  {achieved && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[oklch(0.85_0.08_150)] text-[oklch(0.35_0.1_150)] font-medium">
                      Achieved ✓
                    </span>
                  )}
                  {isNext && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[oklch(0.85_0.08_230)] text-[oklch(0.35_0.1_230)] font-medium">
                      Next milestone 🌟
                    </span>
                  )}
                  {!achieved && !isNext && ageMonths !== null && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[oklch(0.93_0.02_340)] text-[oklch(0.55_0.05_340)] font-medium">
                      Upcoming
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-[oklch(0.35_0.05_340)] mt-0.5">
                  {m.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {m.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed">
        Milestones are approximate. Every baby develops at their own pace.
        Consult your pediatrician with any concerns.
      </p>
    </div>
  );
}