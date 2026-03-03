import { useState } from "react";
import { getWeeklyVolume } from "./storage.js";
import { DAYS } from "./data.js";

export default function Volume({ history }) {
  const [mode, setMode] = useState("sets"); // sets | volume
  const weeks = getWeeklyVolume(history);

  const maxVal = weeks.length ? Math.max(...weeks.map(w => mode === "sets" ? w.sets : w.volume), 1) : 1;

  // 부위별 볼륨 분석
  const categoryVolume = { push: { sets:0, vol:0 }, pull: { sets:0, vol:0 }, legs: { sets:0, vol:0 } };
  Object.values(history).forEach(session => {
    const day = DAYS.find(d => d.id === session.dayId);
    if (!day) return;
    day.sections.forEach(sec =>
      sec.exercises.forEach(ex => {
        const sets = session.logs?.[ex.id] || [];
        sets.forEach(s => {
          if (s.done) {
            categoryVolume[day.category].sets++;
            categoryVolume[day.category].vol += parseFloat(s.weight) || 0;
          }
        });
      })
    );
  });

  const catColors = { push: "#FF4500", pull: "#00C896", legs: "#FFD700" };
  const catLabels = { push: "밀기", pull: "당기기", legs: "하체" };
  const totalSets = Object.values(categoryVolume).reduce((a,b) => a + b.sets, 0);

  if (Object.keys(history).length === 0) {
    return (
      <div style={{ padding:"60px 20px", textAlign:"center" }}>
        <div style={{ fontSize:"32px", marginBottom:"12px" }}>📊</div>
        <div style={{ fontSize:"11px", color:"#444", letterSpacing:"2px" }}>아직 데이터가 없다</div>
        <div style={{ fontSize:"10px", color:"#333", marginTop:"6px" }}>운동 기록이 쌓이면 그래프가 생긴다</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background:"#0d0d0d", borderBottom:"1px solid #1a1a1a", padding:"20px 20px 16px" }}>
        <div style={{ fontSize:"9px", letterSpacing:"4px", color:"#444", marginBottom:"4px" }}>PROGRESS</div>
        <div style={{ fontSize:"20px", fontWeight:"700" }}>볼륨 분석</div>
      </div>

      {/* Mode toggle */}
      <div style={{ display:"flex", margin:"16px 20px 0", border:"1px solid #1a1a1a" }}>
        {[["sets","주간 세트수"],["volume","주간 총볼륨"]].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex:1, padding:"10px", background: mode===m ? "#1a1a1a" : "none",
            border:"none", cursor:"pointer", color: mode===m ? "#e0e0e0" : "#444",
            fontSize:"9px", letterSpacing:"1px", fontFamily:"inherit", transition:"all 0.2s"
          }}>{label}</button>
        ))}
      </div>

      {/* Bar Chart */}
      <div style={{ margin:"16px 20px 0", background:"#0f0f0f", border:"1px solid #1a1a1a", padding:"16px" }}>
        <div style={{ fontSize:"9px", letterSpacing:"2px", color:"#555", marginBottom:"14px" }}>
          {mode === "sets" ? "주간 완료 세트수" : "주간 총 볼륨 (kg)"}
        </div>

        {weeks.length === 0 ? (
          <div style={{ fontSize:"10px", color:"#333", textAlign:"center", padding:"20px" }}>데이터 없음</div>
        ) : (
          <div style={{ display:"flex", alignItems:"flex-end", gap:"6px", height:"120px" }}>
            {weeks.map((w, i) => {
              const val = mode === "sets" ? w.sets : w.volume;
              const h = Math.max((val / maxVal) * 100, 2);
              const isLast = i === weeks.length - 1;
              return (
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"4px", height:"100%" }}>
                  <div style={{ fontSize:"7px", color: isLast ? "#e0e0e0" : "#444" }}>
                    {mode === "sets" ? val : val > 999 ? `${(val/1000).toFixed(1)}k` : val}
                  </div>
                  <div style={{ flex:1, display:"flex", alignItems:"flex-end", width:"100%" }}>
                    <div style={{
                      width:"100%", height:`${h}%`,
                      background: isLast ? "#e0e0e0" : "#2a2a2a",
                      transition:"height 0.4s ease", minHeight:"2px"
                    }} />
                  </div>
                  <div style={{ fontSize:"7px", color:"#444", whiteSpace:"nowrap" }}>{w.label}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category breakdown */}
      {totalSets > 0 && (
        <div style={{ margin:"12px 20px 0", background:"#0f0f0f", border:"1px solid #1a1a1a", padding:"16px" }}>
          <div style={{ fontSize:"9px", letterSpacing:"2px", color:"#555", marginBottom:"14px" }}>부위별 누적 세트</div>
          {Object.entries(categoryVolume).map(([cat, data]) => {
            if (data.sets === 0) return null;
            const pct = Math.round((data.sets / totalSets) * 100);
            return (
              <div key={cat} style={{ marginBottom:"12px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                  <span style={{ fontSize:"10px", color: catColors[cat] }}>{catLabels[cat]}</span>
                  <span style={{ fontSize:"9px", color:"#555" }}>{data.sets}세트 · {pct}%</span>
                </div>
                <div style={{ height:"3px", background:"#1a1a1a" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background: catColors[cat], transition:"width 0.4s" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Personal records */}
      <PRSection history={history} />

      <div style={{ height:"20px" }} />
    </div>
  );
}

function PRSection({ history }) {
  const prs = {};
  DAYS.forEach(day =>
    day.sections.forEach(sec =>
      sec.exercises.forEach(ex => { prs[ex.id] = { name: ex.name, max: 0, color: day.color }; })
    )
  );

  Object.values(history).forEach(session => {
    Object.entries(session.logs || {}).forEach(([exId, sets]) => {
      sets.forEach(s => {
        const w = parseFloat(s.weight) || 0;
        if (s.done && prs[exId] && w > prs[exId].max) prs[exId].max = w;
      });
    });
  });

  const records = Object.values(prs).filter(p => p.max > 0).sort((a,b) => b.max - a.max);
  if (records.length === 0) return null;

  return (
    <div style={{ margin:"12px 20px 0", background:"#0f0f0f", border:"1px solid #1a1a1a", padding:"16px" }}>
      <div style={{ fontSize:"9px", letterSpacing:"2px", color:"#555", marginBottom:"14px" }}>개인 최고 중량 (PR)</div>
      {records.map((r, i) => (
        <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
          <span style={{ fontSize:"10px", color:"#666" }}>{r.name}</span>
          <span style={{ fontSize:"11px", fontWeight:"700", color: r.color }}>{r.max}kg</span>
        </div>
      ))}
    </div>
  );
}
