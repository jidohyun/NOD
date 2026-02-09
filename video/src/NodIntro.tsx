import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { ArticleScene } from "./scenes/ArticleScene";
import { ClickScene } from "./scenes/ClickScene";
import { AiScene } from "./scenes/AiScene";
import { KnowledgeScene } from "./scenes/KnowledgeScene";
import { BrandScene } from "./scenes/BrandScene";
import { ADJUSTED_SCENE_DURATION, TRANSITION_DURATION } from "./styles/theme";

export const NodIntro: React.FC = () => {
  const fadeTiming = linearTiming({ durationInFrames: TRANSITION_DURATION });

  return (
    <TransitionSeries>
      {/* Scene 1: Blog article reading */}
      <TransitionSeries.Sequence durationInFrames={ADJUSTED_SCENE_DURATION}>
        <ArticleScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={fadeTiming}
      />

      {/* Scene 2: Extension click */}
      <TransitionSeries.Sequence durationInFrames={ADJUSTED_SCENE_DURATION}>
        <ClickScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={fadeTiming}
      />

      {/* Scene 3: AI analysis */}
      <TransitionSeries.Sequence durationInFrames={ADJUSTED_SCENE_DURATION}>
        <AiScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={fadeTiming}
      />

      {/* Scene 4: Knowledge accumulation */}
      <TransitionSeries.Sequence durationInFrames={ADJUSTED_SCENE_DURATION}>
        <KnowledgeScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={fadeTiming}
      />

      {/* Scene 5: Brand */}
      <TransitionSeries.Sequence durationInFrames={ADJUSTED_SCENE_DURATION}>
        <BrandScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
