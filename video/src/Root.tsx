import React from "react";
import { Composition } from "remotion";
import { NodIntro } from "./NodIntro";
import { TOTAL_FRAMES, FPS, WIDTH, HEIGHT } from "./styles/theme";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="NodIntro"
      component={NodIntro}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
