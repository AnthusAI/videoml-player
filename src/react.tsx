"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { mountVmlPlayer, type VmlPlayerOptions } from "./runtime.js";

export type VideomlDomPlayerProps = Omit<VmlPlayerOptions, "onError"> & {
  width?: number;
  height?: number;
  className?: string;
};

export function VideomlDomPlayer({
  xml,
  width = 1280,
  height = 720,
  autoPlay = true,
  clockMode = "live",
  loop = false,
  syncGroup,
  onTimeUpdate,
  onXmlChange,
  className,
}: VideomlDomPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const timelineId = useMemo(() => syncGroup ?? `timeline-${Math.random().toString(36).slice(2)}`, [syncGroup]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cleanup = mountVmlPlayer(container, {
      xml,
      autoPlay,
      clockMode,
      loop,
      syncGroup: timelineId,
      onTimeUpdate,
      onXmlChange,
      onError: setError,
    });

    return cleanup;
  }, [xml, autoPlay, clockMode, loop, timelineId, onTimeUpdate, onXmlChange]);

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
        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-muted p-6 text-center text-sm text-muted-foreground">
          {error}
        </div>
      )}
    </div>
  );
}
