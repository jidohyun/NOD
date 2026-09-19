/** @startingPoint section="Display" subtitle="안내 카드 — 손그림 테두리, 스케치 그림자" viewport="700x300" */
export interface InfoCardProps {
  /** Decorative icon placed on an organic tinted blob */
  icon?: string;
  /** Blob color, default lavender */
  iconTint?: string;
  title?: string;
  children?: React.ReactNode;
  /** Degrees, decorative only: ±1–1.5 cards, ±3 frames */
  tilt?: number;
  /** "24px" default, "40px" for explanatory cards */
  padding?: string;
  style?: React.CSSProperties;
}
export declare function InfoCard(props: InfoCardProps): JSX.Element;
