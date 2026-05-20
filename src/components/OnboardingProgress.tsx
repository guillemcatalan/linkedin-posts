"use client";

const STEPS = ["Account", "LinkedIn", "Writing style"];

export default function OnboardingProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-3 mb-10">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  done
                    ? "bg-accent text-bg"
                    : active
                      ? "border-2 border-accent text-accent"
                      : "border border-border text-text-secondary"
                }`}
              >
                {done ? "✓" : step}
              </div>
              <span
                className={`text-sm ${active ? "text-fg font-medium" : "text-text-secondary"}`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-8 h-px ${done ? "bg-accent" : "bg-border"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
