import { useState, useEffect } from "react";
import { DAYS, TAG_COLORS } from "./data.js";
import { todayKey, getLastWeights } from "./storage.js";
import RestTimer from "./RestTimer.jsx";

function buildLog(dayData) {
  const log = {};
  dayData.sections.forEach(sec =>
    sec.exercises.forEach(ex => {
      log[ex.id] = Array.from({ length: ex.targetSets }, () => ({ done: false, weight: "" }));
    })
  );
  return log;
}

function suggestDay() {
  const today = new Date().getDay(); // 0=일
  const map = { 1:"day1", 2:"day2", 3:"day3", 4:"day4", 5:"day5", 6:"day6", 0:"day1" };
  return map[today] || "day1";
}

export default function Tracker({ history, setHistory }) {
  const [activeDay, setActiveDay] = useState(suggestDay);
  const [logs, setLogs] = useState(() => {
    const init = {};
    DAYS.forEach(d => { init[d.id] = buildLog(d); });
    return init;
  });
  const [expanded, setExpanded] = useState({});
  const [restTimer, setRestTimer] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [workoutStarted, setWorkoutStarted] = useState(false);

  const day = DAYS.find(d => d.id === activeDay);
  const dayLog = logs[activeDay];

  useEffect(() => {
    if (!workoutStarted) return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [workoutStarted]);

  const toggleExpand = (id) =>
    setExpanded(p => ({ ...p, [id]: p[id] === undefined ? false : !p[id] }));

  const isExpanded = (id) => expanded[id] !== false;

  const toggleSet = (exId, si, restSec) => {
    if (!workoutStarted) setWorkoutStarted(true);
    setLogs(prev => {
      const updated = { ...prev };
      const sets = [...updated[activeDay][exId]];
      const wasDown = sets[si].done;
      sets[si] = { ...sets[si], done: !sets[si].done };
      updated[activeDay] = { ...updated[activeDay], [exId]: sets };
      if (!wasDown) setRestTimer({ seconds: restSec, color: day.color });
      // 히스토리 저장
      const today = todayKey();
      setHistory(h => ({
        ...h,
        [today]: { dayId: activeDay, logs: updated[activeDay], elapsed }
      }));
      return updated;
    });
  };

  const setWeight = (exId, si, val) => {
    setLogs(prev => {
      const updated = { ...prev };
      const sets = [...updated[activeDay][exId]];
      sets[si] = { ...sets[si], weight: val };
      updated[activeDay] = { ...updated[activeDay], [exId]: sets };
      return updated;
    });
  };

  const totalProgress = () => {
    let total = 0, done = 0;
    day.sections.forEach(sec =>
      sec.exercises.forEach(ex => {
        dayLog[ex.id].forEach(s => { total++; if (s.done) done++; });
      })
    );
    return { total, done, pct: total ? Math.round((done/total)*100) : 0 };
  };

  const exProgress = (exId, targetSets) => {
    const sets = dayLog[exId];
    return { done: sets.filter(s => s.done).length, total: targetSets };
  };

  const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const prog = totalProgress();
  const allDone = prog.done === prog.total && prog.total > 0;

  return (
    <div>
      {/* Header */}
      <div style={{ background:"#0d0d0d", borderBottom:"1px solid #1a1a1a", padding:"20px 20px 14px" }}>
        <div style={{ fontSize:"9px", letterSpacing:"4px", color:"#444", marginBottom:"4px" }}>NICK WALKER STYLE</div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"20px", fontWeight:"700" }}>운동 트래커</div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:"20px", fontWeight:"700", color: workoutStarted ? day.color : "#333" }}>{fmt(elapsed)}</div>
            <div style={{ fontSize:"8px", color:"#444", letterSpacing:"1px" }}>{workoutStarted ? "진행중" : "대기"}</div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginTop:"12px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
            <span style={{ fontSize:"8px", color:"#444", letterSpacing:"2px" }}>오늘 진행도</span>
            <span style={{ fontSize:"8px", color: day.color }}>{prog.done}/{prog.total} 세트 · {prog.pct}%</span>
          </div>
          <div style={{ height:"2px", background:"#1a1a1a" }}>
            <div style={{ height:"100%", width:`${prog.pct}%`, background: day.color, transition:"width 0.3s" }} />
          </div>
        </div>
      </div>

      {/* Day Tab */}
      <div style={{ display:"flex", borderBottom:"1px solid #1a1a1a", background:"#0d0d0d", position:"sticky", top:0, zIndex:10, overflowX:"auto" }}>
        {DAYS.map(d => (
          <button key={d.id} onClick={() => setActiveDay(d.id)} style={{
            flex:"0 0 auto", padding:"10px 14px", background:"none", border:"none", cursor:"pointer",
            borderBottom: activeDay === d.id ? `2px solid ${d.color}` : "2px solid transparent",
            color: activeDay === d.id ? d.color : "#333",
            fontSize:"9px", letterSpacing:"2px", fontFamily:"inherit", transition:"all 0.2s",
            whiteSpace:"nowrap"
          }}>
            <div style={{ fontWeight:"700" }}>{d.label}</div>
          </button>
        ))}
      </div>

      {/* Suggested badge */}
      <div style={{ padding:"10px 20px 0", display:"flex", gap:"8px", alignItems:"center" }}>
        <span style={{ fontSize:"9px", letterSpacing:"2px", color: day.color }}>{day.subtitle}</span>
        {activeDay === suggestDay() && (
          <span style={{ fontSize:"8px", padding:"1px 6px", background:"#1a1a1a", color:"#555", letterSpacing:"1px" }}>오늘 추천</span>
        )}
      </div>

      {/* Sections */}
      {day.sections.map((sec, si) => (
        <div key={si}>
          <div style={{ margin:"14px 20px 0", padding:"8px 12px", borderLeft:`3px solid ${sec.accent}`, background:"#111" }}>
            <div style={{ fontSize:"9px", letterSpacing:"2px", color: sec.accent }}>{sec.title}</div>
          </div>

          {sec.exercises.map(ex => {
            const sets = dayLog[ex.id];
            const ep = exProgress(ex.id, ex.targetSets);
            const allExDone = ep.done === ep.total;
            const tc = TAG_COLORS[ex.tag] || { bg:"#1a1a1a", text:"#888" };
            const lastWeights = getLastWeights(history, ex.id);
            const lastMax = lastWeights.length ? Math.max(...lastWeights) : null;
            const open = isExpanded(ex.id);

            return (
              <div key={ex.id} style={{
                margin:"6px 20px 0",
                border:`1px solid ${allExDone ? sec.accent+"55" : "#1a1a1a"}`,
                background: allExDone ? "#111" : "#0f0f0f",
                transition:"all 0.2s"
              }}>
                {/* Exercise Header */}
                <div onClick={() => toggleExpand(ex.id)} style={{ padding:"12px 14px", display:"flex", alignItems:"center", gap:"10px", cursor:"pointer" }}>
                  <div style={{
                    width:"22px", height:"22px", borderRadius:"50%", flexShrink:0,
                    background: allExDone ? sec.accent : "#1a1a1a",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize: allExDone ? "11px" : "8px",
                    color: allExDone ? "#000" : "#555",
                    transition:"all 0.2s"
                  }}>
                    {allExDone ? "✓" : `${ep.done}/${ep.total}`}
                  </div>

                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"12px", fontWeight:"600", color: allExDone ? "#555" : "#ddd", textDecoration: allExDone ? "line-through" : "none" }}>
                      {ex.name}
                    </div>
                    <div style={{ fontSize:"9px", color:"#444", marginTop:"2px" }}>
                      {ex.targetSets}세트 × {ex.reps}
                      {lastMax && <span style={{ color:"#555", marginLeft:"8px" }}>prev {lastMax}kg</span>}
                    </div>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"4px" }}>
                    <span style={{ fontSize:"7px", padding:"2px 5px", background: tc.bg, color: tc.text, letterSpacing:"1px" }}>{ex.tag}</span>
                    <span style={{ fontSize:"11px", color:"#2a2a2a" }}>{open ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Expanded: CUE + Sets */}
                {open && (
                  <div style={{ borderTop:"1px solid #141414" }}>
                    {/* CUE */}
                    <div style={{ padding:"10px 14px", borderLeft:`2px solid ${sec.accent}`, margin:"0 14px 10px", background:"#0a0a0a" }}>
                      <div style={{ fontSize:"7px", letterSpacing:"2px", color: sec.accent, marginBottom:"4px" }}>🎯 CUE</div>
                      <div style={{ fontSize:"11px", lineHeight:"1.7", color:"#999" }}>{ex.cue}</div>
                      <div style={{ fontSize:"10px", color:"#444", marginTop:"6px", lineHeight:"1.5" }}>💬 {ex.note}</div>
                    </div>

                    {/* Set rows */}
                    <div style={{ padding:"0 14px 12px" }}>
                      <div style={{ display:"grid", gridTemplateColumns:"28px 1fr 56px 40px", gap:"6px", marginBottom:"6px" }}>
                        {["SET","중량(kg)","이전","완료"].map(h => (
                          <div key={h} style={{ fontSize:"7px", color:"#333", letterSpacing:"1px" }}>{h}</div>
                        ))}
                      </div>

                      {sets.map((s, si) => (
                        <div key={si} style={{
                          display:"grid", gridTemplateColumns:"28px 1fr 56px 40px",
                          gap:"6px", alignItems:"center", marginBottom:"5px",
                          opacity: s.done ? 0.4 : 1, transition:"opacity 0.2s"
                        }}>
                          <div style={{ fontSize:"10px", color: s.done ? sec.accent : "#444", fontWeight:"700", textAlign:"center" }}>{si+1}</div>

                          <input
                            type="number" placeholder="—" value={s.weight}
                            onChange={e => setWeight(ex.id, si, e.target.value)}
                            style={{
                              background:"#0a0a0a", border:"1px solid #1e1e1e",
                              color:"#ddd", padding:"5px 8px", fontSize:"12px",
                              fontFamily:"inherit", outline:"none", width:"100%"
                            }}
                          />

                          <div style={{ fontSize:"9px", color:"#333", textAlign:"center" }}>
                            {lastWeights[si] ? `${lastWeights[si]}kg` : "—"}
                          </div>

                          <button onClick={() => toggleSet(ex.id, si, ex.rest)} style={{
                            width:"32px", height:"28px",
                            background: s.done ? sec.accent : "#1a1a1a",
                            border:`1px solid ${s.done ? sec.accent : "#2a2a2a"}`,
                            color: s.done ? "#000" : "#555",
                            cursor:"pointer", fontSize:"12px",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            margin:"0 auto", transition:"all 0.15s"
                          }}>
                            {s.done ? "✓" : "○"}
                          </button>
                        </div>
                      ))}

                      {/* Current max */}
                      {sets.some(s => s.weight) && (
                        <div style={{ marginTop:"6px", fontSize:"8px", color:"#444", borderTop:"1px solid #141414", paddingTop:"6px" }}>
                          오늘 최고&nbsp;
                          <span style={{ color: sec.accent }}>
                            {Math.max(...sets.filter(s=>s.weight).map(s=>parseFloat(s.weight)||0))}kg
                          </span>
                          {lastMax && <span style={{ color:"#444" }}> · 지난번 {lastMax}kg</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Complete */}
      {allDone && (
        <div style={{ margin:"24px 20px 0", padding:"20px", background:"#111", border:`1px solid ${day.color}44`, textAlign:"center" }}>
          <div style={{ fontSize:"24px", marginBottom:"8px" }}>🔥</div>
          <div style={{ fontSize:"11px", color: day.color, letterSpacing:"2px", marginBottom:"4px" }}>오늘 운동 완료</div>
          <div style={{ fontSize:"9px", color:"#444" }}>총 {fmt(elapsed)} · {prog.total}세트</div>
        </div>
      )}

      {restTimer && (
        <RestTimer seconds={restTimer.seconds} color={restTimer.color} onDone={() => setRestTimer(null)} />
      )}
    </div>
  );
}
