import { useState } from "react";
import Tracker from "./Tracker.jsx";
import History from "./History.jsx";
import Volume from "./Volume.jsx";
import { useLocalStorage } from "./storage.js";

const TABS = [
  { id: "tracker", label: "트래커", icon: "⚡" },
  { id: "history", label: "히스토리", icon: "📋" },
  { id: "volume",  label: "볼륨",    icon: "📊" },
];

export default function App() {
  const [tab, setTab] = useState("tracker");
  const [history, setHistory] = useLocalStorage("nw_history", {});

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", fontFamily:"'DM Mono','Courier New',monospace", color:"#e0e0e0", paddingBottom:"64px" }}>
      {tab === "tracker"  && <Tracker history={history} setHistory={setHistory} />}
      {tab === "history"  && <History history={history} />}
      {tab === "volume"   && <Volume  history={history} />}

      {/* Bottom Nav */}
      <nav style={{
        position:"fixed", bottom:0, left:0, right:0,
        background:"#0d0d0d", borderTop:"1px solid #1a1a1a",
        display:"flex", zIndex:50, height:"64px"
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, background:"none", border:"none", cursor:"pointer",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"3px",
            color: tab === t.id ? "#e0e0e0" : "#444",
            borderTop: tab === t.id ? "2px solid #e0e0e0" : "2px solid transparent",
            fontFamily:"inherit", transition:"all 0.2s"
          }}>
            <span style={{ fontSize:"18px" }}>{t.icon}</span>
            <span style={{ fontSize:"9px", letterSpacing:"1px" }}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
