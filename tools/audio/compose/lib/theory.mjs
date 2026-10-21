// Ký hiệu nhạc gọn cho bài viết bằng code: tên nốt -> số MIDI, câu nhạc theo ô nhịp, ngẫu nhiên có hạt giống.

const BASE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "D5", "F#4", "Bb3" -> số nốt MIDI (C4 = 60). */
export function midi(name) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!m) throw new Error(`Tên nốt sai: ${name}`);
  return 12 * (Number(m[3]) + 1) + BASE[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
}

/**
 * Câu nhạc viết theo ô nhịp, ngăn bằng "|". Mỗi token `nốt:độ dài` (đơn vị `unit` phách, mặc định móc đơn),
 * `-:n` là nghỉ, `D4+A4:4` là hợp âm, tiền tố `>` nhấn mạnh, `<` đánh nhẹ.
 * Mỗi ô phải đủ đúng `beatsPerBar` phách, sai thì báo lỗi kèm số ô (bắt lỗi chép nhạc).
 * @returns {{t:number,d:number,p:number,v:number}[]} t, d tính bằng phách.
 */
export function bars(str, { startBar = 0, beatsPerBar = 4, unit = 0.5, vel = 80, legato = 0.95 } = {}) {
  const out = [];
  str.split("|").map((s) => s.trim()).filter((s, i, a) => s || i < a.length - 1).forEach((bar, i) => {
    let pos = 0;
    for (const tok of bar.split(/\s+/).filter(Boolean)) {
      const m = /^([<>]?)([^:]+):(\d+(?:\.\d+)?)$/.exec(tok);
      if (!m) throw new Error(`Token sai "${tok}" ở ô ${startBar + i + 1}`);
      const len = Number(m[3]) * unit;
      if (m[2] !== "-") {
        const v = vel + (m[1] === ">" ? 18 : m[1] === "<" ? -18 : 0);
        for (const n of m[2].split("+")) out.push({ t: (startBar + i) * beatsPerBar + pos, d: len * legato, p: midi(n), v });
      }
      pos += len;
    }
    if (Math.abs(pos - beatsPerBar) > 1e-9) throw new Error(`Ô ${startBar + i + 1} dài ${pos} phách, cần ${beatsPerBar}: "${bar}"`);
  });
  return out;
}

/** Lặp một mẫu nốt (cùng độ dài `d` phách) cho từng ô, `pattern` là danh sách tên nốt hoặc "-" để nghỉ. */
export function pattern(names, { bar, beatsPerBar = 4, step = 0.5, vel = 70, legato = 1.8, accentFirst = 10 }) {
  return names.flatMap((n, i) => n === "-" ? [] : [{
    t: bar * beatsPerBar + i * step, d: step * legato, p: midi(n), v: vel + (i === 0 ? accentFirst : 0),
  }]);
}

/** Bộ sinh ngẫu nhiên có hạt giống (mulberry32): cùng hạt giống -> cùng bản nhạc. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
