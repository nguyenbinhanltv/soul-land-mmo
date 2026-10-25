// S2 (#548): sinh danh sách việc quay cho cap.mjs (trang thử ?thu=fx) hoặc real.mjs (game thật) từ danh sách võ hồn.
//   node tools/assets/skill-vfx/preview/jobs.mjs --vohon lam_dien_ba_vuong_long,hao_thien_chuy --kind fx|real [--short ld,ht] > jobs.json
// Mỗi võ hồn 11 việc: vòng 1–6, 8, 9, 10 (khóa 0–5, 7, 8, 9), Chân Thân `ct`, tiên cơ `tc`; fx: hai bản `sau` (sheet) / `truoc` (sv=0).
const a = process.argv.slice(2), g = (n, d = "") => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : d; };
const ids = g("--vohon").split(",").filter(Boolean), kind = g("--kind", "fx"), short = g("--short").split(",");
const KEYS = ["0", "1", "2", "3", "4", "5", "7", "8", "9", "ct", "tc"], out = [];
ids.forEach((id, n) => {
  const s = short[n] || id.slice(0, 2);
  if (kind === "fx") { for (const k of KEYS) for (const [sv, t] of [[1, "sau"], [0, "truoc"]]) out.push({ name: `${s}_${k}_${t}`, q: `skill=${id}:${k}&wait=700&sv=${sv}` }); return; }
  // game thật: 4 ô hồn kỹ mang theo mỗi lượt; tiên cơ không kích được bằng hook test nên bỏ (kiểm ở trang thử)
  [[0, 1, 2, 3], [4, 5, 7, 8]].forEach((slots) => slots.forEach((r, i) => out.push({ name: `${s}_${r}`, vohon: id, slots, cast: i, dur: 2000, beasts: [{ dx: 40, dy: 20 }] })));
  out.push({ name: `${s}_9`, vohon: id, slots: [9, 0, 1, 2], cast: 0, dur: 2800, beasts: [{ dx: 40, dy: 20 }] });
  out.push({ name: `${s}_ct`, vohon: id, slots: [0, 1, 2, 3], cast: "ct", dur: 2800, beasts: [{ dx: 40, dy: 20 }] });
});
console.log(JSON.stringify(out, null, 1));
