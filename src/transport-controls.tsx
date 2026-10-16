"use client";

import type { CSSProperties, ReactNode } from "react";

export type TransportControlsAppearance = "overlay" | "bar";

export type TransportTimeDisplayFormat = "clock" | "seconds";

export type TransportControlsProps = {
  isPlaying: boolean;
  currentTimeSec: number;
  durationSec: number;
  onTogglePlayback: () => void;
  onSeek: (timeSec: number) => void;
  onReset?: () => void;
  framesPerSecond?: number;
  showFrameNumber?: boolean;
  timeDisplayFormat?: TransportTimeDisplayFormat;
  appearance?: TransportControlsAppearance;
  trailingContent?: ReactNode;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
};

export const formatTransportClock = (timeSec: number) => {
  const nonNegativeSeconds = Number.isFinite(timeSec) ? Math.max(0, timeSec) : 0;
  const wholeMinutes = Math.floor(nonNegativeSeconds / 60);
  const remainingWholeSeconds = Math.floor(nonNegativeSeconds % 60);
  return `${String(wholeMinutes).padStart(2, "0")}:${String(remainingWholeSeconds).padStart(2, "0")}`;
};

export const formatTransportSeconds = (timeSec: number) => {
  const nonNegativeSeconds = Number.isFinite(timeSec) ? Math.max(0, timeSec) : 0;
  return `${nonNegativeSeconds.toFixed(2)}s`;
};

export const computeTransportFrameNumber = (timeSec: number, framesPerSecond: number) => {
  if (!Number.isFinite(timeSec) || !Number.isFinite(framesPerSecond) || framesPerSecond <= 0) return 0;
  return Math.floor(Math.max(0, timeSec) * framesPerSecond);
};

const MINIMUM_SCRUBBER_RANGE_SEC = 0.001;

const appearanceContainerStyles: Record<TransportControlsAppearance, CSSProperties> = {
  overlay: {
    background: "linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0.2), transparent)",
    color: "#e5e7eb",
  },
  bar: {
    background: "#111827",
    color: "#d1d5db",
    borderTop: "1px solid #374151",
  },
};

const transportButtonStyle: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(17,24,39,0.72)",
  color: "#f9fafb",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  flexShrink: 0,
};

const timeReadoutStyle: CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 12,
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
};

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 4.5v15l13-7.5z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" />
      <rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 3v6h6" />
    </svg>
  );
}

export function TransportControls({
  isPlaying,
  currentTimeSec,
  durationSec,
  onTogglePlayback,
  onSeek,
  onReset,
  framesPerSecond = 30,
  showFrameNumber = false,
  timeDisplayFormat = "clock",
  appearance = "overlay",
  trailingContent,
  disabled = false,
  className,
  style,
}: TransportControlsProps) {
  const scrubberMaximumSec = Math.max(MINIMUM_SCRUBBER_RANGE_SEC, Number.isFinite(durationSec) ? durationSec : 0);
  const scrubberValueSec = Math.min(Math.max(0, Number.isFinite(currentTimeSec) ? currentTimeSec : 0), scrubberMaximumSec);
  const scrubberStepSec = framesPerSecond > 0 ? 1 / framesPerSecond : 0.01;
  const formatTime = timeDisplayFormat === "seconds" ? formatTransportSeconds : formatTransportClock;
  const playbackButtonLabel = isPlaying ? "Pause" : "Play";

  return (
    <div
      className={className}
      data-videoml-transport=""
      data-appearance={appearance}
      role="group"
      aria-label="Transport controls"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "8px 12px 10px",
        boxSizing: "border-box",
        ...appearanceContainerStyles[appearance],
        ...style,
      }}
    >
      <input
        type="range"
        aria-label="Seek"
        aria-valuetext={`${formatTime(scrubberValueSec)} of ${formatTime(durationSec)}`}
        min={0}
        max={scrubberMaximumSec}
        step={scrubberStepSec}
        value={scrubberValueSec}
        disabled={disabled}
        onChange={(event) => onSeek(Number(event.target.value))}
        style={{ width: "100%", margin: 0, cursor: disabled ? "default" : "pointer" }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          aria-label={playbackButtonLabel}
          title={playbackButtonLabel}
          disabled={disabled}
          onClick={onTogglePlayback}
          style={transportButtonStyle}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        {onReset ? (
          <button
            type="button"
            aria-label="Reset"
            title="Reset"
            disabled={disabled}
            onClick={onReset}
            style={transportButtonStyle}
          >
            <ResetIcon />
          </button>
        ) : null}
        <span style={{ ...timeReadoutStyle, marginLeft: "auto" }}>
          {formatTime(scrubberValueSec)} / {formatTime(durationSec)}
          {showFrameNumber ? (
            <>
              <span style={{ opacity: 0.5, margin: "0 6px" }}>•</span>
              Frame {computeTransportFrameNumber(scrubberValueSec, framesPerSecond)}
            </>
          ) : null}
        </span>
        {trailingContent}
      </div>
    </div>
  );
}
