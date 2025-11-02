"use client";

import { History, Settings } from "lucide-react";

interface ActionBarProps {
  onHistory: () => void;
  onSettings: () => void;
}

const ActionButton = ({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="group inline-flex items-center gap-1.5 rounded-lg border border-[var(--control-border)] bg-[var(--control-surface)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition hover:bg-[var(--control-surface-hover)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-transparent disabled:text-[var(--control-disabled)]"
  >
    {icon}
    <span>{label}</span>
  </button>
);

export const ActionBar = ({
  onHistory,
  onSettings,
}: ActionBarProps) => (
  <section
    className="w-full shrink-0 space-y-2.5 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-xs text-[var(--text-secondary)] backdrop-blur-xl"
    style={{ boxShadow: "var(--shadow)" }}
  >
    <div className="flex flex-wrap items-center gap-1.5">
      <ActionButton
        icon={<History size={16} />}
        label="History"
        onClick={onHistory}
      />
      <ActionButton
        icon={<Settings size={16} />}
        label="Settings"
        onClick={onSettings}
      />
    </div>
  </section>
);
