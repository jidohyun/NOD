/** @startingPoint section="Actions" subtitle="손그림 테두리 버튼 — 주요/보조/민트/텍스트" viewport="700x260" */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary: 노란 배경 + 3px 손그림 테두리. secondary: 흰 배경. mint: 민트 배경. plain: 일반 12px 모서리. text: 테두리 없는 텍스트 버튼 */
  variant?: "primary" | "secondary" | "mint" | "plain" | "text";
  size?: "sm" | "md" | "lg";
  /** Material Symbols name shown before the label */
  icon?: string;
  iconAfter?: string;
  /** Shows spinner, keeps layout width stable */
  loading?: boolean;
  disabled?: boolean;
  /** Renders as <a> */
  href?: string;
  children: React.ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;
