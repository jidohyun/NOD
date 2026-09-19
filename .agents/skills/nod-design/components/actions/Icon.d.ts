export interface IconProps {
  /** Material Symbols Outlined glyph name, e.g. "search", "bookmark_add" */
  name: string;
  /** 20 (secondary), 24 (default), 32–48 (decorative) */
  size?: 20 | 24 | 32 | 48 | number;
  fill?: 0 | 1;
  /** Accessible name; omit for decorative icons */
  label?: string;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
