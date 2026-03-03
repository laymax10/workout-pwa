import { useState, useEffect } from "react";

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);

  return [value, setValue];
}

// 오늘 날짜 키 (YYYY-MM-DD)
export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// 특정 운동의 마지막 세션 중량 가져오기
export function getLastWeights(history, exId) {
  const dates = Object.keys(history).sort().reverse();
  for (const date of dates) {
    const session = history[date];
    if (session?.logs?.[exId]) {
      const weights = session.logs[exId]
        .map(s => parseFloat(s.weight))
        .filter(w => !isNaN(w) && w > 0);
      if (weights.length > 0) return weights;
    }
  }
  return [];
}

// 주간 볼륨 계산
export function getWeeklyVolume(history) {
  const weeks = {};
  Object.entries(history).forEach(([date, session]) => {
    const d = new Date(date);
    const week = getWeekLabel(d);
    if (!weeks[week]) weeks[week] = { sets: 0, volume: 0, label: week };
    if (session?.logs) {
      Object.values(session.logs).forEach(sets => {
        sets.forEach(s => {
          if (s.done) {
            weeks[week].sets += 1;
            const w = parseFloat(s.weight) || 0;
            weeks[week].volume += w;
          }
        });
      });
    }
  });
  return Object.values(weeks).slice(-8);
}

function getWeekLabel(d) {
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay() + 1);
  return `${start.getMonth()+1}/${start.getDate()}`;
}
