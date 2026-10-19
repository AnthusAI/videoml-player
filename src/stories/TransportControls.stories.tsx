import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TransportControls, type TransportControlsProps } from "../transport-controls.js";
import { VideomlPlayer } from "../react.js";
import { MULTI_SCENE_VML } from "./sample-vml.js";

type SimulatedTransportArgs = Omit<
  TransportControlsProps,
  "isPlaying" | "currentTimeSec" | "onTogglePlayback" | "onSeek" | "onReset"
>;

function SimulatedTransportClock(transportArgs: SimulatedTransportArgs) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    let previousAnimationTimestamp: number | null = null;
    let animationFrameHandle = 0;
    const advanceClock = (animationTimestamp: number) => {
      const elapsedSec = previousAnimationTimestamp == null ? 0 : (animationTimestamp - previousAnimationTimestamp) / 1000;
      previousAnimationTimestamp = animationTimestamp;
      setCurrentTimeSec((previousTimeSec) => (previousTimeSec + elapsedSec) % Math.max(transportArgs.durationSec, 0.001));
      animationFrameHandle = requestAnimationFrame(advanceClock);
    };
    animationFrameHandle = requestAnimationFrame(advanceClock);
    return () => cancelAnimationFrame(animationFrameHandle);
  }, [isPlaying, transportArgs.durationSec]);

  return (
    <div style={{ width: 640, maxWidth: "100%", background: "#1f2937" }}>
      <TransportControls
        {...transportArgs}
        isPlaying={isPlaying}
        currentTimeSec={currentTimeSec}
        onTogglePlayback={() => setIsPlaying((wasPlaying) => !wasPlaying)}
        onSeek={setCurrentTimeSec}
        onReset={() => {
          setIsPlaying(false);
          setCurrentTimeSec(0);
        }}
      />
    </div>
  );
}

const meta: Meta<typeof SimulatedTransportClock> = {
  title: "Player/TransportControls",
  component: SimulatedTransportClock,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    appearance: { control: "select", options: ["overlay", "bar"] },
    timeDisplayFormat: { control: "select", options: ["clock", "seconds"] },
    showFrameNumber: { control: "boolean" },
    framesPerSecond: { control: { type: "number" } },
    durationSec: { control: { type: "number" } },
    disabled: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof SimulatedTransportClock>;

export const Overlay: Story = {
  args: { durationSec: 42, framesPerSecond: 30, appearance: "overlay" },
};

export const Bar: Story = {
  args: { durationSec: 42, framesPerSecond: 30, appearance: "bar" },
};

export const SecondsWithFrameNumber: Story = {
  args: {
    durationSec: 12.5,
    framesPerSecond: 30,
    appearance: "bar",
    timeDisplayFormat: "seconds",
    showFrameNumber: true,
  },
};

export const WithTrailingContent: Story = {
  args: {
    durationSec: 42,
    framesPerSecond: 30,
    appearance: "overlay",
    trailingContent: (
      <button type="button" style={{ fontSize: 12 }}>
        Exit fullscreen
      </button>
    ),
  },
};

export const Disabled: Story = {
  args: { durationSec: 42, framesPerSecond: 30, disabled: true },
};

export const PlayerWithTransportAlwaysVisible: StoryObj<typeof VideomlPlayer> = {
  render: () => (
    <div style={{ width: 800, maxWidth: "100%" }}>
      <VideomlPlayer
        xml={MULTI_SCENE_VML}
        transport={{ mode: "always", appearance: "bar", showFrameNumber: true, timeDisplayFormat: "seconds" }}
      />
    </div>
  ),
};
