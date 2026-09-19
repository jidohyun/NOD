export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Explicit label (required; use hideLabel for visually hidden) */
  label: string;
  hideLabel?: boolean;
  hint?: string;
  /** Error message; sets aria-invalid and red border */
  error?: string;
  /** Leading Material Symbols icon */
  icon?: string;
  /** Trailing element, e.g. <IconButton icon="search" /> */
  trailing?: React.ReactNode;
}
export declare function TextInput(props: TextInputProps): JSX.Element;
