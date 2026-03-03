import { useState, useEffect } from "react";

export default function RestTimer({ seconds, color, onDone }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) { onDone(); return; }
    const t = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const pct = (left / seconds) * 100;
  const urgent = left <= 10;

  return (
    <div style={{
      position:"fixed", bottom:76, left:"50%", transform:"translateX(-50%)",
      background:"#111", border:`1px solid ${urgent ? "#FF4500" : "#2a2a2a"}`,
      padding:"14px 28px", zIndex:100, minWidth:"220px", textAlign:"center",
      fontFamily:"'DM Mono','Courier New',monospace", transition:"border-color 0.3s"
    }}>
      <div style={{ fontSize:"9px", letterSpacing:"3px", color:"#555", marginBottom:"6px" }}>REST</div>
      <div style={{ fontSize:"32px", fontWeight:"700", color: urgent ? "#FF4500" : "#e0e0e0", marginBottom:"10px", transition:"color 0.3s" }}>
        {Math.floor(left/60)}:{String(left%60).padStart(2,"0")}
      </div>
      <div style={{ height:"2px", background:"#1a1a1a", overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background: urgent ? "#FF4500" : color, transition:"width 1s linear, background 0.3s" }} />
      </div>
      <button onClick={onDone} style={{
        marginTop:"10px", fontSize:"9px", letterSpacing:"2px", color:"#444",
        background:"none", border:"none", cursor:"pointer", fontFamily:"inherit"
      }}>SKIP ▶</button>
    </div>
  );
}
