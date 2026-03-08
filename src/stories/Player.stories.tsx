import type { Meta, StoryObj } from "@storybook/react";
import { VideomlDomPlayer, VideomlPlayer } from "../react.js";
import { MINIMAL_VML, MULTI_SCENE_VML } from "./sample-vml.js";

const meta: Meta<typeof VideomlDomPlayer> = {
  title: "Player/VideomlDomPlayer",
  component: VideomlDomPlayer,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    width: { control: { type: "number" } },
    height: { control: { type: "number" } },
    layoutMode: { control: "select", options: ["frame", "container"] },
    autoPlay: { control: "boolean" },
    clockMode: { control: "select", options: ["bounded", "live"] },
    loop: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof VideomlDomPlayer>;

export const Default: Story = {
  args: {
    xml: MINIMAL_VML,
    width: 1280,
    height: 720,
    autoPlay: true,
    clockMode: "bounded",
    loop: true,
  },
  render: (args) => (
    <div style={{ width: 800, maxWidth: "100%" }}>
      <VideomlDomPlayer {...args} />
    </div>
  ),
};

export const MultiScene: Story = {
  args: {
    xml: MULTI_SCENE_VML,
    width: 1280,
    height: 720,
    autoPlay: true,
    clockMode: "bounded",
    loop: true,
  },
  render: (args) => (
    <div style={{ width: 800, maxWidth: "100%" }}>
      <VideomlDomPlayer {...args} />
    </div>
  ),
};

export const Paused: Story = {
  args: {
    xml: MINIMAL_VML,
    width: 1280,
    height: 720,
    autoPlay: false,
    clockMode: "bounded",
    loop: true,
  },
  render: (args) => (
    <div style={{ width: 800, maxWidth: "100%" }}>
      <VideomlDomPlayer {...args} />
    </div>
  ),
};

export const ContainerLayoutMode: Story = {
  args: {
    xml: MINIMAL_VML,
    width: 1280,
    height: 720,
    autoPlay: false,
    clockMode: "bounded",
    loop: true,
    layoutMode: "container",
  },
  render: (args) => (
    <div style={{ width: 800, maxWidth: "100%" }}>
      <VideomlDomPlayer {...args} />
    </div>
  ),
};

export const WithTransport: StoryObj<typeof VideomlPlayer> = {
  args: {
    xml: MULTI_SCENE_VML,
    width: 1280,
    height: 720,
    autoPlay: false,
    clockMode: "bounded",
    loop: true,
    transport: { mode: "overlay-autohide", autoHideMs: 1600, keyboardShortcuts: true },
  },
  render: (args) => (
    <div style={{ width: 800, maxWidth: "100%" }}>
      <VideomlPlayer {...args} />
    </div>
  ),
};

export const WithTransportAndAudio: StoryObj<typeof VideomlPlayer> = {
  args: {
    xml: MULTI_SCENE_VML,
    width: 1280,
    height: 720,
    autoPlay: false,
    clockMode: "bounded",
    loop: true,
    transport: { mode: "overlay-autohide", autoHideMs: 1600, keyboardShortcuts: true },
    audioSrc: "/sample.wav",
  },
  render: (args) => (
    <div style={{ width: 800, maxWidth: "100%" }}>
      <VideomlPlayer {...args} />
    </div>
  ),
};
