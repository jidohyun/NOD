export interface NavItemProps {
  icon: string;
  label: string;
  /** 20% brand tint + dashed charcoal border */
  selected?: boolean;
  href?: string;
  onClick?: React.MouseEventHandler;
  style?: React.CSSProperties;
}
export declare function NavItem(props: NavItemProps): JSX.Element;
