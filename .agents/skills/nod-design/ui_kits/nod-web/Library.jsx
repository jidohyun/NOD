import React from "react";
import { Header } from "./Header.jsx";
import { Button } from "../../components/actions/Button.jsx";
import { IconButton } from "../../components/actions/IconButton.jsx";
import { TextInput } from "../../components/forms/TextInput.jsx";
import { LinkRow } from "../../components/display/LinkRow.jsx";
import { InfoCard } from "../../components/display/InfoCard.jsx";
import { Badge } from "../../components/display/Badge.jsx";
import { StatusMessage } from "../../components/feedback/StatusMessage.jsx";
import { EmptyState } from "../../components/feedback/EmptyState.jsx";
import { SkeletonRow } from "../../components/feedback/SkeletonRow.jsx";
import { Notice } from "../../components/feedback/Notice.jsx";
const Step = ({ n, children }) => (
  <li style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, lineHeight: 1.5, color: "var(--text-primary)" }}>
    <span aria-hidden="true" style={{ flex: "0 0 auto", width: 24, height: 24, display: "grid", placeItems: "center", borderRadius: "var(--radius-pill)", background: "var(--color-brand)", border: "var(--border-doodle)", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 12 }}>{n}</span>
    <span>{children}</span>
  </li>
);
export function Library({ user, articles = [], state = "ready", query = "", hasMore = false, status, onLogout, onSearch, onDelete, onLoadMore, onRetry, showNotice = false }) {
  const [q, setQ] = React.useState(query);
  const [revoke, setRevoke] = React.useState({ kind: "info", text: "" });
  const [notice, setNotice] = React.useState(showNotice);
  const count = state === "loading" ? "링크를 불러오는 중입니다." : state === "error" ? "링크를 불러오지 못했습니다." : query ? `“${query}” 검색 결과 ${articles.length}개` : `저장한 링크 ${articles.length}개`;
  const doRevoke = () => { setRevoke({ kind: "loading", text: "연결을 해제하는 중입니다." }); setTimeout(() => setRevoke({ kind: "success", text: "모든 확장 프로그램 연결을 해제했습니다." }), 900); };
  return (
    <div className="nod-dots" style={{ minHeight: "100dvh" }}>
      <Header user={user} onLogout={onLogout} />
      <main style={{ width: "min(var(--max-app), calc(100% - 2 * var(--gutter-desktop)))", margin: "0 auto", padding: "clamp(24px, 4vw, 48px) 0 72px", display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", alignItems: "start", gap: "clamp(32px, 5vw, 64px)" }}>
        <section aria-labelledby="library-title" style={{ display: "grid", gap: 16 }}>
          <div>
            <h1 id="library-title" style={{ fontSize: "var(--text-page)", lineHeight: 1.2, fontWeight: 700 }}>저장한 링크</h1>
            <p id="library-count" style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>{count}</p>
          </div>
          {notice ? <Notice title="Chrome에서 바로 저장" actionLabel="확장 프로그램 연결" onDismiss={() => setNotice(false)}>NOD 확장 프로그램을 연결하면, 보고 있는 탭을 툴바 아이콘 한 번으로 저장할 수 있습니다.</Notice> : null}
          <form role="search" onSubmit={(e) => { e.preventDefault(); onSearch?.(q); }}>
            <TextInput label="저장한 링크 검색" hideLabel icon="search" type="search" name="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="제목이나 출처로 검색" autoComplete="off" spellCheck="false" aria-describedby="library-count"
              trailing={<IconButton icon="arrow_forward" label="검색" size={36} type="submit" />} />
          </form>
          <StatusMessage kind={status?.kind || "info"}>{status?.text}</StatusMessage>
          <ul aria-live="polite" style={{ margin: 0, padding: 0, display: "grid", gap: 12 }}>
            {state === "loading" ? [1, 2, 3].map((i) => <SkeletonRow key={i} />) : null}
            {state === "error" ? <EmptyState tone="error" icon="wifi_off" title="링크를 불러오지 못했어요" actionLabel="다시 시도" onAction={onRetry}>링크를 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.</EmptyState> : null}
            {state === "ready" && articles.length === 0 ? (query
              ? <EmptyState icon="search_off" title="찾는 링크가 없어요">다른 검색어로 다시 찾아보세요.</EmptyState>
              : <EmptyState icon="bookmark_add" title="아직 저장한 링크가 없어요">Chrome 툴바에서 NOD 아이콘을 눌러 첫 링크를 저장해 보세요.</EmptyState>) : null}
            {state === "ready" ? articles.map((a) => <LinkRow key={a.id} title={a.title} hostname={a.hostname} url={a.url} savedAt={a.savedAt} onDelete={() => onDelete?.(a)} />) : null}
          </ul>
          {state === "ready" && hasMore ? <div><Button variant="secondary" onClick={onLoadMore}>더 보기</Button></div> : null}
        </section>
        <aside aria-labelledby="extension-title" style={{ display: "grid", gap: 16 }}>
          <InfoCard icon="extension" iconTint="var(--surface-mint)" title="Chrome에서 바로 저장" style={{ transform: "rotate(1deg)" }}>
            <p style={{ margin: "0 0 16px", fontSize: 14 }}>NOD 확장 프로그램을 연결하면, 보고 있는 탭을 툴바 아이콘 한 번으로 저장할 수 있습니다.</p>
            <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12 }}>
              <Step n="1">읽고 있는 아티클에서 Chrome 툴바의 NOD 아이콘을 누릅니다.</Step>
              <Step n="2">처음에는 Google 로그인과 확장 프로그램 연결을 완료합니다.</Step>
              <Step n="3">연결 후 원래 아티클이 저장됩니다. 다음부터는 한 번만 누르면 됩니다.</Step>
            </ol>
          </InfoCard>
          <section style={{ padding: 20, border: "2px dashed var(--border-subtle)", borderRadius: "var(--radius-panel)", display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Badge tone="mint" icon="extension">확장 프로그램</Badge></div>
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>다른 기기에서의 확장 프로그램 연결을 모두 끊을 수 있습니다.</p>
            <div><Button variant="text" size="sm" loading={revoke.kind === "loading"} onClick={doRevoke}>모든 확장 프로그램 연결 해제</Button></div>
            <StatusMessage kind={revoke.kind}>{revoke.text}</StatusMessage>
          </section>
        </aside>
      </main>
    </div>
  );
}
