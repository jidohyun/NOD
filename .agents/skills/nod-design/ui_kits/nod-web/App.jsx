import React from "react";
import { Landing } from "./Landing.jsx";
import { Library } from "./Library.jsx";
const seed = [
  { id: 1, title: "Manifest V3 migration guide", hostname: "developer.chrome.com", url: "https://developer.chrome.com/docs/extensions/develop/migrate", savedAt: "2026년 9월 13일" },
  { id: 2, title: "Cloudflare D1: 서버리스 SQL 데이터베이스 시작하기", hostname: "developers.cloudflare.com", url: "https://developers.cloudflare.com/d1/get-started/", savedAt: "2026년 9월 12일" },
  { id: 3, title: "브라우저 확장 프로그램으로 읽을 페이지를 저장하는 가장 단순한 방법과 그 과정에서 배운 것들", hostname: "web.dev", url: "https://web.dev/articles/save-for-later", savedAt: "2026년 9월 10일" },
  { id: 4, title: "Designing with hand-drawn borders", hostname: "smashingmagazine.com", url: "https://www.smashingmagazine.com/hand-drawn-borders", savedAt: "2026년 9월 2일" },
];
const user = { name: "지도현", email: "dnp@dnp.im" };
export function App({ initialScreen = "landing", initialState = "ready" }) {
  const [screen, setScreen] = React.useState(initialScreen);
  const [state, setState] = React.useState(initialState);
  const [articles, setArticles] = React.useState(seed);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState(null);
  const [landingMsg, setLandingMsg] = React.useState(undefined);
  const load = (next = "ready") => { setState("loading"); setTimeout(() => setState(next), 700); };
  const visible = query ? articles.filter((a) => (a.title + a.hostname).toLowerCase().includes(query.toLowerCase())) : articles;
  if (screen === "landing") return <Landing message={landingMsg} onLogin={() => { setScreen("library"); load(initialState === "error" ? "error" : "ready"); }} />;
  return (
    <Library user={user} state={state} articles={visible} query={query} status={status} hasMore={!query && state === "ready" && visible.length >= 4}
      showNotice={initialState === "notice"}
      onLogout={() => { setScreen("landing"); setLandingMsg("로그인이 필요합니다. Google 계정으로 다시 시작해 주세요."); }}
      onSearch={(q) => { setQuery(q.trim()); load(); }}
      onDelete={(a) => { if (window.confirm(`“${a.title}” 링크를 삭제할까요?`)) { setArticles((xs) => xs.filter((x) => x.id !== a.id)); setStatus({ kind: "success", text: "링크를 삭제했습니다." }); } }}
      onLoadMore={() => setStatus({ kind: "info", text: "더 불러올 링크가 없습니다." })}
      onRetry={() => load("ready")} />
  );
}
