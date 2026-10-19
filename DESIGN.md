# Player design and roadmap

## Purpose

The VideoML Player is the **core video library**: you drop it on a page and get a full video experience—playback plus standard controls. The goal is “your web page becomes a TV”: play, pause, seek, reset, time display, and whatever else belongs in a basic video UI. Products like Babulus are built *on top* of this; they add agents, authoring, and content workflows, but the video technology and standard controls live here.

## Naming: transport controls

The industry term for the control bar (play, pause, reset/rewind, seek, time display) is **transport** or **transport controls**. We use that terminology:

- **TransportControls**: the UI component that provides play, pause, reset-to-start, seek (scrubber), and current time/duration (and optionally frame).
- A **player with transport** is the full surface: the VML playback area plus the transport controls underneath (or overlaid).

So:

- **VideomlDomPlayer** = headless playback (VML XML → DOM + timeline). No UI controls.
- **TransportControls** = the controls component, usable on its own with any playback source.
- **Player with transport** = VideomlDomPlayer + TransportControls, so embedders get a complete “video on the page” experience by default.

## Current state

- **VideomlDomPlayer** (React) and **&lt;vml-player&gt;** (web component): headless playback primitive.
- **TransportControls** (React): presentational transport bar. It owns no clock; the host passes `isPlaying`, `currentTimeSec`, `durationSec` and handlers (`onTogglePlayback`, `onSeek`, optional `onReset`). Options: `framesPerSecond` (scrubber steps by one frame), `showFrameNumber`, `timeDisplayFormat` (`"clock"` or `"seconds"`), `appearance` (`"overlay"` or `"bar"`), `trailingContent` for host buttons such as exit-fullscreen, plus `className`/`style`. Products with their own renderer (for example Babulus's ScriptData preview) can use it instead of a bespoke control bar.
- **VideomlPlayer** (React): reference player with built-in transport controls, rendered with `TransportControls`.
  - `layoutMode`: `"frame"` (default) or `"container"`.
    - `"frame"` locks scene CSS/layout to composition dimensions (for example 1920x1080) and scales the full stage to fit.
    - `"container"` keeps legacy behavior where scene layout resolves directly against container pixels.
  - `transport`: `true | false | { mode?: "overlay-autohide" | "always"; autoHideMs?: number; keyboardShortcuts?: boolean; appearance?: "overlay" | "bar"; showResetButton?: boolean; showFrameNumber?: boolean; timeDisplayFormat?: "clock" | "seconds" }`. The `"bar"` appearance renders below the stage instead of over it.
  - `audioSrc`: optional audio track used as playback clock source for synchronized scrubbing/playback.
- **Runtime controller API**: `onController` provides `play/pause/seek/getTime/getDuration/getFramesPerSecond/isPlaying/subscribe`.
- **Storybook**: includes headless and transport-enabled player variants, and standalone `TransportControls` stories.

## Direction

1. **Keep transport in core**: products should consume `VideomlPlayer` instead of re-implementing transport bars.
2. **Keep the headless player** as the primitive: advanced or custom UIs can still use `VideomlDomPlayer` and custom controls.
3. **Default to frame-locked rendering** for deterministic typography/layout in preview and production.
4. **Expand transport features in core** over time (chapter markers, playback rate, frame stepping) without pushing duplicated logic downstream.

This file will be updated as we add transport and related components.
