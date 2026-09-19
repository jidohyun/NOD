export interface BadgeProps {
  tone?: "neutral" | "brand" | "mint" | "lavender" | "success" | "warning" | "error";
  /** Override the status icon; status tones include one by default (meaning never by color alone) */
  icon?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Badge(props: BadgeProps): JSX.Element;
