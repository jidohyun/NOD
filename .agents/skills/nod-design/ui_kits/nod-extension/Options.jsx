import React from "react";
import { Button } from "../../components/actions/Button.jsx";
import { TextInput } from "../../components/forms/TextInput.jsx";
import { Badge } from "../../components/display/Badge.jsx";
import { StatusMessage } from "../../components/feedback/StatusMessage.jsx";
import { Brand } from "../../components/navigation/Brand.jsx";
const Panel = ({ title, children }) => (
  <section style={{ background: "var(--surface-card)", border: "var(--border-doodle)", borderRadius: "var(--radius-doodle)", padding: 24, display: "grid", gap: 12 }}>
    {title ? <h2 style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>{title}</h2> : null}{children}
  </section>
);
export function Options() {
  const [origin, setOrigin] = React.useState("https://nod-archive.com");
  const [connected, setConnected] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [status, setStatus] = React.useState({ kind: "info", text: "No activity yet." });
  const connect = () => { setChecking(true); setTimeout(() => { setChecking(false); setConnected(true); setStatus({ kind: "success", text: "Connected to " + origin }); }, 900); };
  return (
    <div className="nod-dots" style={{ minHeight: "100dvh" }}>
      <main style={{ maxWidth: 672, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}><Brand size={28} /><Badge tone="mint" icon="extension">Chrome</Badge></div>
        <h1 style={{ fontSize: "var(--text-page)", lineHeight: 1.2, fontWeight: 700 }}>NOD Save</h1>
        <p style={{ margin: "8px 0 24px", fontSize: 16, lineHeight: 1.6, color: "var(--text-secondary)" }}>Save links from Chrome to your NOD library. The extension only sends a page URL and title.</p>
        <div style={{ display: "grid", gap: 20 }}>
          <Panel>
            <form onSubmit={(e) => { e.preventDefault(); setStatus({ kind: "success", text: "Saved origin " + origin }); }} style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10, alignItems: "end" }}>
                <TextInput label="NOD service origin" type="url" inputMode="url" required value={origin} onChange={(e) => setOrigin(e.target.value)} />
                <Button variant="secondary" type="submit" style={{ minHeight: 48 }}>Save origin</Button>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>Use HTTPS, or <code style={{ fontFamily: "var(--font-mono)", background: "var(--surface-subtle)", padding: "1px 6px", borderRadius: 6 }}>http://localhost:8787</code> for local development.</p>
            </form>
          </Panel>
          <Panel title="Account connection">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {checking ? <StatusMessage kind="loading">Checking connection…</StatusMessage> : connected ? <Badge tone="success">Connected</Badge> : <Badge tone="warning">Not connected</Badge>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <Button icon="login" loading={checking} onClick={connect}>Connect account</Button>
              <Button variant="secondary" disabled={!connected} onClick={() => { setConnected(false); setStatus({ kind: "info", text: "Disconnected this browser." }); }}>Disconnect this browser</Button>
              <Button variant="text" iconAfter="open_in_new" href={origin} target="_blank" rel="noopener">Open NOD library</Button>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>Connect opens Google sign-in in Chrome. Disconnect removes this browser’s saved NOD credential; revoke credentials from your NOD library.</p>
          </Panel>
          <Panel title="Last activity"><StatusMessage kind={status.kind}>{status.text}</StatusMessage></Panel>
        </div>
      </main>
    </div>
  );
}
