export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  /** Required accessible name describing the action */
  label: string;
  tone?: "default" | "danger";
  /** Hit area, min 44 */
  size?: number;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
