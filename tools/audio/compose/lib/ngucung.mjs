// Nhạc tu tiên / kiếm hiệp nhẹ nhàng: thang ngũ cung Trung Hoa (cung, thương, giốc, chủy, vũ), giai điệu viết theo bậc (1–5),
// tiết tấu chậm, nhiều khoảng lặng. Dùng chung cho bài nền và lớp giao chiến cùng điệu (`chienStem`).
// Nhạc cụ Trung Hoa lấy từ DSK Asian DreamZ (bộ tiếng phụ, bank 1): 0 tỳ bà, 1 tỳ bà rung, 3 cổ tranh, 4 nhị hồ, 5 sáo trúc (ban-di), 6 bộ gõ.
import { bars, midi } from "./theory.mjs";

/** Khoảng cách (nửa cung) từ chủ âm tới 5 bậc của từng điệu; mỗi điệu là một cách xoay của cùng năm âm. */
export const MODES = {
  cung: [0, 2, 4, 7, 9],
  thuong: [0, 2, 5, 7, 10],
  giốc: [0, 3, 5, 8, 10],
  chuy: [0, 2, 5, 7, 9],
  vu: [0, 3, 5, 7, 10],
};

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteName = (p) => `${NAMES[p % 12]}${Math.floor(p / 12) - 1}`;

/** Bậc thứ `i` (0 = chủ âm, tăng dần, qua quãng tám) -> số nốt MIDI trên chủ âm `tonic`. */
export function degreeNote(tonic, mode, i) {
  const sc = MODES[mode];
  return midi(tonic) + 12 * Math.floor(i / 5) + sc[((i % 5) + 5) % 5];
}

/**
 * Giai điệu theo bậc ngũ cung: token `bậc[' hoặc ,]:độ dài` (bậc 1–5, dấu ' lên quãng tám, dấu , xuống), `-:n` nghỉ,
 * tiền tố `>` / `<` nhấn / nhẹ. `base` là chỉ số bậc của bậc 1 (5 bậc = một quãng tám). Trả về nốt như `bars()`.
 */
export function melody(str, { tonic, mode, base = 0, ...opts }) {
  const text = str.replace(/([<>]?)([1-5])([',]*):/g, (_, acc, d, oct) => {
    const shift = [...oct].reduce((s, c) => s + (c === "'" ? 5 : -5), 0);
    return `${acc}${noteName(degreeNote(tonic, mode, base + Number(d) - 1 + shift))}:`;
  });
  return bars(text, opts);
}

/** Dải âm quét lên (kiểu lướt cổ tranh): `count` bậc liền nhau từ bậc `from`, mỗi nốt cách `step` phách, bắt đầu ở phách `t`. */
export function sweep({ tonic, mode, from, count, t, step = 0.25, vel = 60, d = 1.5 }) {
  return Array.from({ length: count }, (_, k) => ({
    t: t + k * step, d, p: degreeNote(tonic, mode, from + k), v: Math.round(vel * (0.8 + 0.2 * (k / Math.max(1, count - 1)))),
  }));
}

/**
 * Dựng bài từ khuôn chung: 4 đoạn 8 ô (A A' B A), mỗi đoạn có giai điệu, bè nhị hồ, gốc theo ô (bậc 1–5).
 * Lớp: lead (sáo / tiêu dẫn), erhu (bè), tranh (rải chậm, lướt cuối câu), qin (gốc trầm như cổ cầm), pad, chuông, mõ / trống nhỏ (`perc`).
 * Trả về nốt và gốc theo ô (cho lớp giao chiến).
 */
export function buildSong(spec) {
  const { tonic, mode, sections, perc } = spec;
  const notes = [];
  const add = (ch, list) => notes.push(...list.map((n) => ({ ...n, ch })));
  const note = (i) => degreeNote(tonic, mode, i);
  const roots = [];
  sections.forEach((sec, s) => {
    const s0 = s * 8;
    if (sec.lead) add(sec.leadCh ?? "lead", melody(sec.lead, { tonic, mode, base: sec.leadBase ?? spec.leadBase, startBar: s0, vel: sec.leadVel ?? spec.leadVel ?? 76, legato: 0.98 }));
    if (sec.erhu) add("erhu", melody(sec.erhu, { tonic, mode, base: spec.erhuBase, startBar: s0, vel: sec.erhuVel ?? 62, legato: 1 }));
    sec.roots.forEach((deg, k) => {
      const bar = s0 + k, r = deg - 1;
      roots.push(deg);
      // Nền: ba nốt ngân của gốc (gốc, quãng năm, nốt màu), rất nhỏ.
      for (const i of [r, r + 3, r + 7]) notes.push({ ch: "pad", t: bar * 4, d: 4 * 0.98, p: note(i), v: spec.padVel ?? 40 });
      // Cổ cầm (tranh trầm): gốc ở phách 1 (dài), quãng năm ở phách 3 ở ô chẵn.
      notes.push({ ch: "qin", t: bar * 4, d: 3.2, p: note(r), v: 66 });
      if (k % 2 === 1) notes.push({ ch: "qin", t: bar * 4 + 2.5, d: 1.4, p: note(r + 3), v: 50 });
      // Tranh rải chậm: mẫu theo đoạn (chỉ số vào `pool`, -1 nghỉ), chỉ vài nốt mỗi ô, còn lại để trống.
      const pool = [r + 5, r + 8, r + 10, r + 7, r + 12, r + 8];
      (sec.arp ?? spec.arp).forEach((slot, j) => {
        if (slot < 0) return;
        notes.push({ ch: "tranh", t: bar * 4 + j * 0.5, d: 2.2, p: note(pool[slot]), v: (spec.arpVel ?? 54) + (j === 0 ? 8 : 0) });
      });
      // Lướt tranh cuối mỗi câu 4 ô, trừ khi đoạn tắt.
      if (k % 4 === 3 && sec.sweep !== false) add("tranh", sweep({ tonic, mode, from: r + 5, count: 7, t: bar * 4 + 3, step: 0.14, vel: 52, d: 2.5 }));
      // Chuông / khánh đầu đoạn (và giữa đoạn nếu bài muốn).
      if (k === 0) notes.push({ ch: "bell", t: bar * 4, d: 3, p: note(r + 10), v: s % 2 === 0 ? 58 : 48 });
      if (k === 4 && spec.bellMid) notes.push({ ch: "bell", t: bar * 4, d: 3, p: note(r + 12), v: 40 });
      if (perc) notes.push(...perc({ bar, k, s }));
    });
  });
  return { notes, roots };
}

const CH = (key, name, channel, program, bank, o = {}) => ({
  key, name, channel, program, ...(bank === undefined ? {} : { bank }), volume: 100, pan: 64, reverb: 60, ...o,
});

/** Kênh nhạc cụ chung; bài ghi đè từng kênh bằng `over`. Bank 1 = DSK Asian DreamZ, không bank = GeneralUser GS. */
export function channels(over = {}) {
  const base = {
    lead: CH("lead", "Sáo trúc (ban-di)", 1, 5, 1, { pan: 62, reverb: 80, expr: true, vibrato: 30, humanTicks: 3, phrase: 4, volume: 96 }),
    lead2: CH("lead2", "Tiêu (xiao)", 2, 77, undefined, { pan: 70, reverb: 85, expr: true, vibrato: 40, bend: 0.3, bendDepth: 0.6, humanTicks: 3, phrase: 4, volume: 88 }),
    erhu: CH("erhu", "Nhị hồ", 3, 4, 1, { pan: 46, reverb: 80, expr: true, vibrato: 40, humanTicks: 3, phrase: 4, volume: 80 }),
    tranh: CH("tranh", "Cổ tranh", 4, 3, 1, { pan: 78, reverb: 70, humanVel: 7, humanTicks: 4, groove: true, volume: 100 }),
    qin: CH("qin", "Cổ cầm (tranh trầm)", 5, 3, 1, { pan: 56, reverb: 75, humanVel: 4, humanTicks: 5, volume: 96 }),
    pad: CH("pad", "Nền ngân", 6, 89, undefined, { pan: 64, reverb: 100, chorus: 40, expr: true, humanVel: 2, volume: 56 }),
    bell: CH("bell", "Chuông / khánh", 7, 14, undefined, { pan: 60, reverb: 100, humanTicks: 2, volume: 70 }),
    mo: CH("mo", "Mõ gỗ", 8, 6, 1, { pan: 72, reverb: 40, humanVel: 6, humanTicks: 3, volume: 100 }),
  };
  for (const [k, v] of Object.entries(over)) base[k] = { ...base[k], ...v };
  return Object.values(base);
}

// Tỳ bà gảy nhanh: 16 móc kép mỗi ô, lên rồi xuống trên 8 nốt của gốc.
const PIPA_SEQ = [0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1];

/**
 * Lớp giao chiến cùng điệu với bài nền (cùng bpm, số ô): tỳ bà gảy nhanh quanh gốc theo ô, trống nhỏ, nhị hồ kéo căng, khánh nhấn đầu đoạn.
 * Gốc theo ô lấy từ `base.ngucung.roots`; chuyển êm do client kéo âm lượng như các lớp giao chiến khác.
 */
export function chienStem(base, { id, title, of }) {
  const { tonic, mode, roots } = base.ngucung, notes = [];
  const add = (ch, t, d, p, v) => notes.push({ ch, t, d, p, v });
  const note = (i) => degreeNote(tonic, mode, i);
  roots.forEach((deg, bar) => {
    const r = deg - 1, t0 = bar * 4;
    const pool = [r + 5, r + 7, r + 8, r + 10, r + 12];
    PIPA_SEQ.forEach((idx, k) => add("pipa", t0 + k * 0.25, 0.3, note(pool[idx]), k % 4 === 0 ? 86 : 62));
    // Trống nhỏ: phách 1, 2.5, 3, 4.5, thêm dồn cuối ô lẻ.
    for (const [s, v] of [[0, 98], [1.5, 70], [2, 84], [3.5, 66]]) add("drum", t0 + s, 0.25, 68, v);
    if (bar % 2 === 1) for (let k = 0; k < 4; k++) add("drum", t0 + 3 + k * 0.25, 0.2, 68, 56 + k * 10);
    // Nhị hồ kéo căng: nốt dài trên gốc, mỗi hai ô một nốt.
    if (bar % 2 === 0) add("erhu", t0, 7.6, note(r + 10), 70);
    // Khánh nhấn đầu mỗi 8 ô.
    if (bar % 8 === 0) add("bell", t0, 3, note(r + 5), 76);
  });
  return {
    id, title, kind: "stem", of, bpm: base.bpm, beatsPerBar: 4, bars: base.bars, mono: true, bitrate: "48k", mix: { lufs: -21 },
    channels: [
      CH("pipa", "Tỳ bà gảy nhanh", 1, 0, 1, { pan: 64, reverb: 45, humanVel: 5, humanTicks: 2, groove: true, volume: 100 }),
      CH("drum", "Trống nhỏ", 2, 6, 1, { pan: 60, reverb: 55, humanVel: 5, humanTicks: 1, volume: 100 }),
      CH("erhu", "Nhị hồ kéo căng", 3, 4, 1, { pan: 46, reverb: 80, expr: true, vibrato: 50, volume: 84 }),
      CH("bell", "Khánh / chuông", 4, 14, undefined, { pan: 60, reverb: 100, volume: 76 }),
    ],
    notes,
  };
}
