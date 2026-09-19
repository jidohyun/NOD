/** @startingPoint section="Display" subtitle="저장한 링크 한 행 — 제목·출처·날짜·URL·삭제" viewport="700x200" */
export interface LinkRowProps {
  title: string;
  hostname: string;
  url: string;
  /** Formatted date, e.g. "2026년 9월 13일" */
  savedAt: string;
  onDelete?: () => void;
  /** Disables delete without shifting layout */
  deleting?: boolean;
  style?: React.CSSProperties;
}
export declare function LinkRow(props: LinkRowProps): JSX.Element;
