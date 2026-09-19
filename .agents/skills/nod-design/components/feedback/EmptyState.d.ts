export interface EmptyStateProps {
  icon?: string;
  /** error → light red area with a concrete explanation and retry */
  tone?: "neutral" | "error";
  title: string;
  children?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: React.CSSProperties;
}
export declare function EmptyState(props: EmptyStateProps): JSX.Element;
