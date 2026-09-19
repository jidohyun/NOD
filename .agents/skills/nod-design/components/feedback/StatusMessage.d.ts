export interface StatusMessageProps {
  kind?: "info" | "loading" | "success" | "warning" | "error";
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function StatusMessage(props: StatusMessageProps): JSX.Element;
