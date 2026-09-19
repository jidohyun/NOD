export interface BrandProps {
  /** Logo height in px (wordmark renders ~1.15× this) */
  size?: number;
  /** wordmark: horizontal logo. mark: square icon (dark tile) */
  variant?: "wordmark" | "mark";
  href?: string;
  style?: React.CSSProperties;
}
export declare function Brand(props: BrandProps): JSX.Element;
