/**
 * Minimal VML samples for Storybook and tests.
 * Root must be <vml>, <videoml>, or <video-ml>; contains one or more <scene> elements.
 */

export const MINIMAL_VML = `<vml id="intro" fps="30" width="1920" height="1080">
  <scene id="opening" duration="3s">
    <layer id="main">
      <title-slide props='{"title":"Storybook demo","subtitle":"VideoML player"}'></title-slide>
    </layer>
  </scene>
</vml>`;

export const MULTI_SCENE_VML = `<vml id="demo" fps="30" width="1920" height="1080">
  <scene id="scene-1" duration="2s">
    <layer id="main">
      <title-slide props='{"title":"First scene"}'></title-slide>
    </layer>
  </scene>
  <scene id="scene-2" duration="2s">
    <layer id="main">
      <title-slide props='{"title":"Second scene","subtitle":"Sequence"}'></title-slide>
    </layer>
  </scene>
</vml>`;
