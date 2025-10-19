"use client";

import { ClipboardPaste, FolderOpen, History, Settings } from "lucide-react";

interface ActionBarProps {
  onClipboard: () => void;
  onFile: () => void;
  onHistory: () => void;
  onSettings: () => void;
  isProcessing: boolean;
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
    className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-600 dark:hover:bg-gray-700"
  >
    {icon}
    <span>{label}</span>
  </button>
);

export const ActionBar = ({
  onClipboard,
  onFile,
  onHistory,
  onSettings,
  isProcessing,
}: ActionBarProps) => (
  <section className="w-full shrink-0 space-y-2 rounded-md border border-gray-200 bg-white p-3 text-xs dark:border-gray-700 dark:bg-gray-800">
    <div className="flex flex-wrap gap-2">
      <ActionButton
        icon={<ClipboardPaste size={16} />}
        label="Clipboard"
        onClick={onClipboard}
        disabled={isProcessing}
      />
      <ActionButton
        icon={<FolderOpen size={16} />}
        label="Select File"
        onClick={onFile}
        disabled={isProcessing}
      />
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
