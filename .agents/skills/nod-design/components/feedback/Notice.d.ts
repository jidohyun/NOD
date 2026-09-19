export interface NoticeProps {
  icon?: string;
  title?: string;
  children: React.ReactNode;
  /** Connection CTA label, e.g. "확장 프로그램 연결" */
  actionLabel?: string;
  onAction?: () => void;
  /** Shows the close button when provided */
  onDismiss?: () => void;
  style?: React.CSSProperties;
}
export declare function Notice(props: NoticeProps): JSX.Element;
