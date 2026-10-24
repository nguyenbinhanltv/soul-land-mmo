// Kiểm thử bảng pháp tướng (shared/data.ts PHAP_TUONG) và hàm thuần (client/src/phapTuongMath.ts), không cần server / trình duyệt.
// Chạy: npm run test:phaptuong --prefix client (Node >= 22.18 tự bỏ kiểu của file .ts).
import { readFileSync, existsSync } from "node:fs";
import {
  PHAP_TUONG, PT_STAGES, PT_STRIKE, PT_FORM, PT_DIRS, PT_BACK_DIRS, PT_ATTACK_N, PT_CUTIN_SEC, PT_OTHERS_K, VOHON, CHAN_THAN, phapTuongOf, phapTuongStage, MAX_RINGS,
} from "../../shared/data.ts";
import { ptRow, ptIsBack, ptStrikeFrame, ptStrikeCurve } from "../src/phapTuongMath.ts";

let fails = 0;
const ok = (c, msg) => { console.log(`${c ? "✓" : "✗"} ${msg}`); if (!c) fails++; };

// ---- bảng dữ liệu: mọi võ hồn có mục, công thức hợp lệ
ok(VOHON.length === 25, `25 võ hồn (có ${VOHON.length})`);
const missing = VOHON.filter((v) => !PHAP_TUONG[v.id]).map((v) => v.id);
ok(missing.length === 0, `mọi võ hồn có mục PHAP_TUONG${missing.length ? ": thiếu " + missing.join(", ") : ""}`);
ok(Object.keys(PHAP_TUONG).every((k) => VOHON.some((v) => v.id === k)), "không có mục thừa (mã lạ)");
ok(VOHON.every((v) => !CHAN_THAN[v.id] || PHAP_TUONG[v.id]), "mọi võ hồn có Chân Thân đều có pháp tướng");
const bad = [];
for (const [id, d] of Object.entries(PHAP_TUONG)) {
  const m = d.motion;
  if (d.sheet !== `pt_${id}`) bad.push(`${id}: sheet`);
  if (d.formula !== "sinh_vat" && d.formula !== "vat_the") bad.push(`${id}: công thức`);
  if (!["V", "S", "P", "B", "T", "O", "D"].includes(d.group)) bad.push(`${id}: nhóm`);
  if (!["dien", "lua", "bang", "la", "hon", "doc", "khoi"].includes(d.hat)) bad.push(`${id}: hạt`);
  if (!(d.scale > 0.3 && d.scale <= 1.5) || Math.abs(d.dx) > 40 || Math.abs(d.dy) > 40) bad.push(`${id}: cỡ / độ lệch`);
  if (d.glow !== undefined && !/^#[0-9a-f]{6}$/i.test(d.glow)) bad.push(`${id}: màu`);
  if (!(m.bobSec > 0.5 && m.bobSec < 4) || m.bob < 0 || m.bob > 6 || m.sway < 0 || m.sway > 8 || m.lag < 0 || m.lag >= 1 || m.pulse < 0 || m.pulse > 1
    || m.swing < 0 || m.swing > 45 || m.lunge < 0 || m.lunge > 20 || m.pivot < 0 || m.pivot > 120 || Math.abs(m.spin) > 90) bad.push(`${id}: tham số chuyển động`);
  if (d.formula === "vat_the" && !(d.group === "V" || d.group === "O" || d.group === "P")) bad.push(`${id}: vật thể sai nhóm`);
  if (d.formula === "sinh_vat" && (d.group === "V" || d.group === "O" || d.group === "P")) bad.push(`${id}: sinh vật sai nhóm`);
}
ok(bad.length === 0, `mọi mục hợp lệ (công thức, nhóm, hạt, cỡ, tham số)${bad.length ? ": " + bad.join("; ") : ""}`);
ok(phapTuongOf("khong_co") === null && phapTuongOf("hao_thien_chuy")?.scale === 0.85, "phapTuongOf: mã lạ → null, giá trị H1 của Hạo Thiên Chùy");
ok(PHAP_TUONG.lam_dien_ba_vuong_long.formula === "sinh_vat" && PHAP_TUONG.hao_thien_chuy.formula === "vat_the", "Lam Điện = sinh vật, Hạo Thiên Chùy = vật thể");

// ---- ảnh thật trong manifest (`pt_<mã>`) khớp bảng: cỡ, độ lệch, lớp; sheet có mặt, đủ 16 × 5 khung
const man = JSON.parse(readFileSync(new URL("../../shared/assets/sprites/manifest.json", import.meta.url), "utf8"));
const entries = (man.sprites ?? []).filter((e) => typeof e !== "string" && /^pt_/.test(e.key));
const pts = entries.filter((e) => !/_glow$/.test(e.key)), glows = entries.filter((e) => /_glow$/.test(e.key));
const mis = [];
for (const e of pts) {
  const id = e.key.slice(3), d = PHAP_TUONG[id];
  if (!d) { mis.push(`${e.key}: không có mục PHAP_TUONG`); continue; }
  const m = e.pt ?? {};
  if (m.scale !== d.scale || m.dx !== d.dx || m.dy !== d.dy) mis.push(`${id}: scale / dx / dy lệch manifest (${m.scale},${m.dx},${m.dy})`);
  if (JSON.stringify(m.back) !== JSON.stringify(PT_BACK_DIRS)) mis.push(`${id}: lớp sau lệch`);
  const f = new URL(`../../shared/assets/sprites/phaptuong/${id}.png`, import.meta.url);
  if (!existsSync(f)) mis.push(`${id}: thiếu sheet`);
  else { const b = readFileSync(f); if (b.readUInt32BE(16) !== 160 * 16 || b.readUInt32BE(20) !== 160 * 5) mis.push(`${id}: sheet không phải 2560×800`); }
}
// lớp sáng riêng `pt_<mã>_glow` (cùng bố cục 2560×800) phải đi kèm một sheet thân cùng mã
for (const e of glows) {
  const id = e.key.slice(3, -5), f = new URL(`../../shared/assets/sprites/phaptuong/${id}_glow.png`, import.meta.url);
  if (!pts.some((x) => x.key === `pt_${id}`)) mis.push(`${e.key}: không có sheet thân pt_${id}`);
  else if (!existsSync(f)) mis.push(`${e.key}: thiếu file`);
  else { const b = readFileSync(f); if (b.readUInt32BE(16) !== 160 * 16 || b.readUInt32BE(20) !== 160 * 5) mis.push(`${e.key}: không phải 2560×800`); }
}
ok(mis.length === 0, `${pts.length} pháp tướng thật + ${glows.length} lớp sáng trong manifest khớp bảng PHAP_TUONG${mis.length ? ": " + mis.join("; ") : ""}`);

// ---- tiến hóa theo vòng
ok(PT_STAGES.length === 4 && PT_STAGES.every((s, i) => s.rings === 7 + i), "4 bậc cho vòng 7..10");
ok(PT_STAGES.every((s, i) => i === 0 || (s.alpha >= PT_STAGES[i - 1].alpha && s.glow > PT_STAGES[i - 1].glow && s.hat >= PT_STAGES[i - 1].hat && s.aura > PT_STAGES[i - 1].aura)),
  "bậc cao hơn rõ hơn (alpha, glow, hạt, hào quang không giảm)");
ok(PT_STAGES[0].hat === 0 && PT_STAGES[1].hat > 0, "vòng 7 chưa có hạt, vòng 8 có hạt");
ok(phapTuongStage(7).rings === 7 && phapTuongStage(8).rings === 8 && phapTuongStage(9).rings === 9 && phapTuongStage(MAX_RINGS).rings === 10 && phapTuongStage(3).rings === 7, "phapTuongStage theo số vòng");

// ---- hướng, lớp
ok(JSON.stringify(PT_DIRS) === '["s","se","e","ne","n"]' && JSON.stringify(PT_BACK_DIRS) === '["s","se","e"]', "5 hướng vẽ; s / se / e sau thân");
const R = (d) => ptRow(d);
ok(R("s").row === 0 && !R("s").flip && R("se").row === 1 && R("e").row === 2 && R("ne").row === 3 && R("n").row === 4, "hàng sheet theo hướng");
ok(R("sw").flip && R("sw").dir === "se" && R("w").flip && R("w").dir === "e" && R("nw").flip && R("nw").dir === "ne", "sw / w / nw lật gương từ se / e / ne");
ok(ptIsBack("e") && ptIsBack("s") && !ptIsBack("ne") && !ptIsBack("n"), "ne / n vẽ trước thân");

// ---- đòn đánh: lấy đà → ra đòn → dừng hình → thu về
const T = PT_STRIKE.windup + PT_STRIKE.hit + PT_STRIKE.stop + PT_STRIKE.recover;
ok(ptStrikeFrame(-0.01) === -1 && ptStrikeFrame(T + 0.01) === -1, "ngoài khoảng đánh: không phát khung đánh");
ok(ptStrikeFrame(0) === 0 && ptStrikeFrame(T - 0.001) > PT_ATTACK_N - 2 && ptStrikeFrame(T - 0.001) < PT_ATTACK_N, "khung đánh chạy từ đầu tới cuối sheet");
let mono = true, last = -1;
for (let t = 0; t < T; t += 0.005) { const f = ptStrikeFrame(t); if (f < last - 1e-9) mono = false; last = f; }
ok(mono, "khung đánh không lùi");
const s0 = PT_STRIKE.windup + PT_STRIKE.hit;
ok(ptStrikeFrame(s0 + 0.001) === ptStrikeFrame(s0 + PT_STRIKE.stop - 0.001), "dừng hình: giữ nguyên một khung ra đòn");
const frames60 = Math.round(PT_STRIKE.stop * 60);
ok(frames60 >= 2 && frames60 <= 3, `dừng hình ${frames60} khung ở 60 FPS (2–3)`);
ok(ptStrikeCurve(PT_STRIKE.windup * 0.99) < -0.4 && ptStrikeCurve(s0 + 0.01) === 1 && Math.abs(ptStrikeCurve(T - 0.001)) < 0.05 && ptStrikeCurve(0) === 0, "đà đòn: lùi lấy đà, 1 lúc ra đòn / dừng, về 0");
// biến hình ~1,2 s: các mốc theo thứ tự
ok(PT_FORM.column < PT_FORM.rise0 && PT_FORM.rise0 < PT_FORM.rise1 && PT_FORM.rise1 <= PT_FORM.roar && PT_FORM.roar < PT_FORM.total && Math.abs(PT_FORM.total - 1.2) < 0.01, "chuỗi biến hình ~1,2 s: vòng sáng → cột sáng → hiện từ dưới lên → gầm → giữ");
ok(PT_CUTIN_SEC >= 0.4 && PT_CUTIN_SEC <= 0.6, "cut-in khoảng 0,5 giây");
ok(PT_OTHERS_K.low < PT_OTHERS_K.mid && PT_OTHERS_K.mid < PT_OTHERS_K.high && PT_OTHERS_K.high < 1, "người khác thấy nhẹ hơn mình, tăng theo mức Thấp / Vừa / Cao");

console.log(fails ? `\n${fails} lỗi` : "\nXong, không lỗi.");
process.exit(fails ? 1 : 0);
