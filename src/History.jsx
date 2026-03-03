import { DAYS } from "./data.js";

export default function History({ history }) {
  const dates = Object.keys(history).sort().reverse();

  if (dates.length === 0) {
    return (
      <div style={{ padding:"60px 20px", textAlign:"center" }}>
        <div style={{ fontSize:"32px", marginBottom:"12px" }}>📋</div>
        <div style={{ fontSize:"11px", color:"#444", letterSpacing:"2px" }}>아직 기록이 없다</div>
        <div style={{ fontSize:"10px", color:"#333", marginTop:"6px" }}>운동 완료 후 여기에 쌓인다</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background:"#0d0d0d", borderBottom:"1px solid #1a1a1a", padding:"20px 20px 16px" }}>
        <div style={{ fontSize:"9px", letterSpacing:"4px", color:"#444", marginBottom:"4px" }}>WORKOUT LOG</div>
        <div style={{ fontSize:"20px", fontWeight:"700" }}>히스토리</div>
        <div style={{ fontSize:"9px", color:"#444", marginTop:"4px" }}>{dates.length}회 기록됨</div>
      </div>

      {dates.map(date => {
        const session = history[date];
        const day = DAYS.find(d => d.id === session.dayId);
        if (!day) return null;

        let totalSets = 0, doneSets = 0, totalVol = 0;
        day.sections.forEach(sec =>
          sec.exercises.forEach(ex => {
            const sets = session.logs?.[ex.id] || [];
            sets.forEach(s => {
              totalSets++;
              if (s.done) {
                doneSets++;
                totalVol += parseFloat(s.weight) || 0;
              }
            });
          })
        );

        const d = new Date(date);
        const dateLabel = `${d.getMonth()+1}/${d.getDate()} (${["일","월","화","수","목","금","토"][d.getDay()]})`;

        return (
          <div key={date} style={{ margin:"12px 20px 0", border:"1px solid #1a1a1a", background:"#0f0f0f" }}>
            <div style={{ padding:"14px 16px", borderLeft:`3px solid ${day.color}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:"11px", fontWeight:"700", color:"#ddd" }}>{dateLabel}</div>
                  <div style={{ fontSize:"9px", color: day.color, marginTop:"2px", letterSpacing:"1px" }}>{day.label} — {day.subtitle}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:"11px", color: doneSets === totalSets ? day.color : "#555" }}>
                    {doneSets}/{totalSets} 세트
                  </div>
                  {totalVol > 0 && <div style={{ fontSize:"9px", color:"#444", marginTop:"2px" }}>총 {totalVol.toLocaleString()}kg</div>}
                </div>
              </div>

              {/* Per exercise summary */}
              <div style={{ marginTop:"10px", display:"flex", flexDirection:"column", gap:"4px" }}>
                {day.sections.flatMap(sec => sec.exercises).map(ex => {
                  const sets = session.logs?.[ex.id] || [];
                  const doneS = sets.filter(s => s.done);
                  const maxW = Math.max(...doneS.map(s => parseFloat(s.weight)||0).filter(w=>w>0), 0);
                  if (doneS.length === 0) return null;
                  return (
                    <div key={ex.id} style={{ display:"flex", justifyContent:"space-between", fontSize:"9px" }}>
                      <span style={{ color:"#555" }}>{ex.name}</span>
                      <span style={{ color:"#444" }}>
                        {doneS.length}세트{maxW > 0 ? ` · ${maxW}kg` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ height:"20px" }} />
    </div>
  );
}
