"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  mountVmlPlayer,
  type VmlPlayerController,
  type VmlPlayerOptions,
} from "./runtime.js";
import {
  TransportControls,
  type TransportControlsAppearance,
  type TransportTimeDisplayFormat,
} from "./transport-controls.js";

export * from "./transport-controls.js";

export type VideomlDomPlayerProps = Omit<VmlPlayerOptions, "onError"> & {
  width?: number;
  height?: number;
  className?: string;
};

export function VideomlDomPlayer({
  xml,
  overlays,
  width = 1280,
  height = 720,
  autoPlay = true,
  clockMode = "live",
  loop = false,
  layoutMode = "frame",
  syncGroup,
  onTimeUpdate,
  onXmlChange,
  onController,
  className,
}: VideomlDomPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const timelineId = useMemo(
    () => syncGroup ?? `timeline-${Math.random().toString(36).slice(2)}`,
    [syncGroup],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cleanup = mountVmlPlayer(container, {
      xml,
      overlays,
      autoPlay,
      clockMode,
      loop,
      layoutMode,
      syncGroup: timelineId,
      onTimeUpdate,
      onXmlChange,
      onController,
      onError: setError,
    });

    return cleanup;
  }, [xml, overlays, autoPlay, clockMode, loop, layoutMode, timelineId, onTimeUpdate, onXmlChange, onController]);

  const aspectRatio = width && height ? `${width} / ${height}` : undefined;
  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "auto",
        aspectRatio,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.65)",
            color: "#fca5a5",
            fontSize: 13,
            padding: 16,
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

export type VideomlTransportOptions = {
  mode?: "overlay-autohide" | "always";
  autoHideMs?: number;
  keyboardShortcuts?: boolean;
  appearance?: TransportControlsAppearance;
  showResetButton?: boolean;
  showFrameNumber?: boolean;
  timeDisplayFormat?: TransportTimeDisplayFormat;
};

export type VideomlPlayerProps = Omit<VideomlDomPlayerProps, "onController"> & {
  transport?: boolean | VideomlTransportOptions;
  audioSrc?: string;
  onController?: (controller: VmlPlayerController) => void;
};

type NormalizedTransport = Required<VideomlTransportOptions> & { enabled: boolean };

const defaultTransportOptions: Required<VideomlTransportOptions> = {
  mode: "overlay-autohide",
  autoHideMs: 1600,
  keyboardShortcuts: true,
  appearance: "overlay",
  showResetButton: true,
  showFrameNumber: false,
  timeDisplayFormat: "clock",
};

const normalizeTransport = (
  transport: boolean | VideomlTransportOptions | undefined,
): NormalizedTransport => {
  if (transport === false) return { ...defaultTransportOptions, enabled: false };
  if (transport === true || transport == null) return { ...defaultTransportOptions, enabled: true };
  const explicitlyProvidedOptions = Object.fromEntries(
    Object.entries(transport).filter(([, optionValue]) => optionValue !== undefined),
  ) as VideomlTransportOptions;
  return { ...defaultTransportOptions, ...explicitlyProvidedOptions, enabled: true };
};

export function VideomlPlayer({
  xml,
  overlays,
  width = 1280,
  height = 720,
  autoPlay = false,
  clockMode = "bounded",
  loop = true,
  layoutMode = "frame",
  syncGroup,
  onTimeUpdate,
  onXmlChange,
  onController,
  className,
  transport = true,
  audioSrc,
}: VideomlPlayerProps) {
  const transportConfig = useMemo(() => normalizeTransport(transport), [transport]);
  const [controller, setController] = useState<VmlPlayerController | null>(null);
  const [timeSec, setTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [framesPerSecond, setFramesPerSecond] = useState(30);
  const [isPlaying, setIsPlaying] = useState(Boolean(autoPlay));
  const [controlsVisible, setControlsVisible] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current != null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const showTransport = useCallback(() => {
    if (!transportConfig.enabled) return;
    clearHideTimer();
    setControlsVisible(true);
    if (transportConfig.mode === "overlay-autohide" && isPlaying) {
      hideTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, transportConfig.autoHideMs);
    }
  }, [transportConfig, isPlaying]);

  useEffect(() => {
    if (!transportConfig.enabled) return;
    if (transportConfig.mode === "always" || !isPlaying) {
      clearHideTimer();
      setControlsVisible(true);
      return;
    }
    showTransport();
    return clearHideTimer;
  }, [transportConfig, isPlaying, showTransport]);

  useEffect(() => clearHideTimer, []);

  useEffect(() => {
    if (!controller) return;
    const unsubscribe = controller.subscribe((time, duration) => {
      setTimeSec(time);
      setDurationSec(duration);
      setIsPlaying(controller.isPlaying());
      setFramesPerSecond(controller.getFramesPerSecond());
      onTimeUpdate?.(time, duration);
    });
    return unsubscribe;
  }, [controller, onTimeUpdate]);

  useEffect(() => {
    if (!controller || !audioSrc) return;
    if (!isPlaying) {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        controller.pause();
      });
    }
  }, [controller, audioSrc, isPlaying]);

  useEffect(() => {
    if (!controller || !audioSrc || !isPlaying) return;
    const tick = () => {
      const audio = audioRef.current;
      if (!audio) return;
      controller.seek(audio.currentTime || 0);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [controller, audioSrc, isPlaying]);

  const applyController = useCallback(
    (next: VmlPlayerController) => {
      setController(next);
      onController?.(next);
    },
    [onController],
  );

  const seekTo = useCallback(
    (nextTime: number) => {
      if (!controller) return;
      const max = Number.isFinite(durationSec) && durationSec > 0 ? durationSec : controller.getDuration();
      const clamped = Math.max(0, Math.min(nextTime, max > 0 ? max : nextTime));
      controller.seek(clamped);
      if (audioRef.current) {
        audioRef.current.currentTime = clamped;
      }
      setTimeSec(clamped);
      setDurationSec(Math.max(durationSec, controller.getDuration()));
      showTransport();
    },
    [controller, durationSec, showTransport],
  );

  const togglePlay = useCallback(() => {
    if (!controller) return;
    if (controller.isPlaying()) {
      controller.pause();
      if (audioRef.current) audioRef.current.pause();
    } else {
      controller.play();
      if (audioRef.current) {
        const playPromise = audioRef.current.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => controller.pause());
        }
      }
    }
    setIsPlaying(controller.isPlaying());
    showTransport();
  }, [controller, showTransport]);

  const resetToStart = useCallback(() => {
    if (!controller) return;
    controller.pause();
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    seekTo(0);
  }, [controller, seekTo]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!transportConfig.enabled || !transportConfig.keyboardShortcuts || !controller) return;
    if (event.key === " " || event.key === "k" || event.key === "K") {
      event.preventDefault();
      togglePlay();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      seekTo(timeSec - 1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      seekTo(timeSec + 1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      seekTo(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      seekTo(durationSec);
    }
  };

  const showControls = !transportConfig.enabled || transportConfig.mode === "always" || controlsVisible;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", width: "100%", outline: "none" }}
      tabIndex={transportConfig.keyboardShortcuts ? 0 : -1}
      onKeyDown={onKeyDown}
      onMouseMove={showTransport}
      onMouseEnter={showTransport}
      onTouchStart={showTransport}
      onFocus={showTransport}
    >
      {audioSrc ? (
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="auto"
          onLoadedMetadata={() => {
            const audioDuration = audioRef.current?.duration;
            if (Number.isFinite(audioDuration) && audioDuration) {
              setDurationSec(audioDuration);
            }
          }}
          onPause={() => {
            if (controller?.isPlaying()) {
              controller.pause();
            }
          }}
          onEnded={() => {
            controller?.pause();
          }}
          style={{ display: "none" }}
        />
      ) : null}

      <VideomlDomPlayer
        xml={xml}
        overlays={overlays}
        width={width}
        height={height}
        autoPlay={autoPlay}
        clockMode={clockMode}
        loop={loop}
        layoutMode={layoutMode}
        syncGroup={syncGroup}
        onXmlChange={onXmlChange}
        onController={applyController}
      />

      {transportConfig.enabled ? (
        <TransportControls
          isPlaying={isPlaying}
          currentTimeSec={timeSec}
          durationSec={durationSec}
          framesPerSecond={framesPerSecond}
          onTogglePlayback={togglePlay}
          onSeek={seekTo}
          onReset={transportConfig.showResetButton ? resetToStart : undefined}
          showFrameNumber={transportConfig.showFrameNumber}
          timeDisplayFormat={transportConfig.timeDisplayFormat}
          appearance={transportConfig.appearance}
          disabled={!controller}
          style={
            transportConfig.appearance === "bar"
              ? undefined
              : {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: showControls ? "flex" : "none",
                }
          }
        />
      ) : null}
    </div>
  );
}
