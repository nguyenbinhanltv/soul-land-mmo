// Bảng Tự động (Auto 2, mục 5.13): cài đặt tự săn, nút bật / tắt, giờ treo còn lại, và bảng tổng kết khi tự săn dừng. Client chỉ
// gửi ý định (`auto {op: "set", cfg}` / `on` / `off`); server kẹp lại bằng parseAuto, lưu theo tài khoản và trả tin `auto`.
import { AUTO_DEFAULTS, AUTO_LOOT_KINDS, AUTO_RADIUS, AUTO_RADIUS_MIN, ITEM_KINDS, MAX_CORE_STARS, MAX_YEARS, TILE,
  autoTimeText, formatHonTe, autoStatusText, autoRateText, parseAuto, type AutoSettings, type AutoSummary, type AutoRate, AUTO_HINT } from "../../shared/data.ts";
import type { AutoMsg, AutoStMsg } from "./net.ts";
import { closeCentrePanels } from "./panelStack.ts";
import { isUi2 } from "./uiKit.ts";
import "./ui2-auto.css";

/** GameScene cung cấp: gửi tin `auto`, tên ô đội hình (theo tin `vohons`) và tên hồn kỹ ở 4 ô của võ hồn đang ra trận. */
export interface AutoPanelCtx {
  send(op: "on" | "off" | "set" | "get", cfg?: AutoSettings): void;
  slotName(i: number): string;
  skillName(i: number): string;
}

const SKILL_KEYS = ["U", "I", "O", "P"];
/** Niên hạn mẫu (U3 #756): chỉ là lối tắt điền hai ô từ / đến; trần lấy từ MAX_YEARS, server vẫn kẹp lại bằng parseAuto. */
const YEAR_PRESETS: { label: string; years: [number, number] }[] = [
  { label: "1K–5K", years: [1000, 5000] }, { label: "10K–20K", years: [10000, 20000] }, { label: "50K+", years: [50000, MAX_YEARS] }];
/** Một lần bấm − / + ở ô niên hạn. */
const YEAR_STEP = 1000;
const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const pct = (v: number) => `${Math.round(v * 100)}%`;
/** Thời gian treo để hiển thị: dưới một phút thì ghi giây. */
const dur = (secs: number) => (secs < 60 ? `${Math.max(0, Math.round(secs))} giây` : autoTimeText(secs));

let ctx: AutoPanelCtx | null = null;
/** Việc tự săn đang làm (tin `autost`, AH2 #609): bảng, chữ trên đầu nhân vật và đường đi trên radar đọc từ đây; null khi không tự săn. */
let job: AutoStMsg | null = null;
export const autoJob = () => job;
/** Chữ ngắn của việc đang làm để hiện trên đầu nhân vật ("Đang đánh Sói Xám"); rỗng khi chưa có tin. */
export const autoJobText = () => (job ? autoStatusText(job) : "");
let last: AutoMsg | null = null;
/** Tổng kết lượt gần nhất (mục "Lượt vừa rồi", kèm giờ treo còn lại lúc dừng): chỉ thay khi tin mới có `sum`, xóa khi bật lại. */
let lastSum: { sum: AutoSummary; left: number } | null = null;
/** Thứ tự đầy đủ đang hiển thị của hai danh sách (ô bật trước theo thứ tự ưu tiên, ô tắt sau) và ô đang bật. */
const lists = { skills: { order: [0, 1, 2, 3], on: new Set<number>() }, slots: { order: [0, 1, 2, 3], on: new Set<number>() } };

/** Ô số niên hạn kèm hai nút − / + (vùng bấm 44 px, U3 #756). */
const stepper = (k: string, label: string) => `<div class="astp"><button type="button" data-step="${k}" data-d="-1" aria-label="${label}: giảm ${YEAR_STEP}">−</button>`
  + `<input type="number" min="0" max="${MAX_YEARS}" step="10" data-k="${k}" aria-label="${label} (năm)">`
  + `<button type="button" data-step="${k}" data-d="1" aria-label="${label}: tăng ${YEAR_STEP}">+</button></div>`;

const panel = () => document.getElementById("autoPanel");
const sumBox = () => document.getElementById("autoSum");

export function closeAutoPanel() {
  const el = panel(); if (el) el.hidden = true;
  document.getElementById("autoBtn")?.setAttribute("aria-expanded", "false");
}
/** Mở / đóng bảng Tự động (nút "Tự động"); mở thì đóng các bảng giữa màn hình khác. Trả về true nếu vừa mở. */
export function toggleAutoPanel(open = !!panel()?.hidden) {
  const el = panel(); if (!el) return false;
  if (!open) { closeAutoPanel(); return false; }
  closeCentrePanels("autoPanel"); // đúng hàm đóng của từng bảng, không đặt `hidden` thô (#1044)
  el.hidden = false;
  document.getElementById("autoBtn")?.setAttribute("aria-expanded", "true");
  if (last) fill(last); // tên võ hồn / hồn kỹ có thể đã đổi từ lần trước
  ctx?.send("get"); // gợi ý hợp sức theo võ hồn ra trận hiện tại (AH4)
  return true;
}
export function closeAutoSum() { const el = sumBox(); if (el) el.hidden = true; }

/** Dựng bảng một lần cho mỗi phòng (GameScene.create); bộ nghe gỡ theo `signal` khi đổi bản đồ. */
export function bindAutoPanel(c: AutoPanelCtx, signal: AbortSignal) {
  ctx = c;
  const el = panel(); if (!el) return;
  const kinds = AUTO_LOOT_KINDS.map((k) => `<label class="achk apill"><input type="checkbox" data-kind="${k}"><i></i><span>${ITEM_KINDS[k].name}</span></label>`).join("");
  const stars = Array.from({ length: MAX_CORE_STARS }, (_, i) => `<option value="${i + 1}">${i + 1}★</option>`).join("");
  el.innerHTML = `
    <div class="rhead"><b>Tự động</b><button class="x" type="button" data-a="close" aria-label="Đóng bảng Tự động">×</button></div>
    <small class="anote" data-a="status"></small>
    <button class="buse absorb atoggle" type="button" data-a="toggle"></button>
    <div class="anote" data-a="job" aria-live="off" hidden><b></b><small data-a="rate"></small></div>
    <section class="asec"><b>Vùng săn</b>
      <div class="achips" role="radiogroup" aria-label="Vùng săn">
        <label class="achip"><input type="radio" name="ascope" value="map" data-scope><span>Toàn bản đồ</span></label>
        <label class="achip"><input type="radio" name="ascope" value="near" data-scope><span>Quanh chỗ đứng</span></label></div>
      <small>Toàn bản đồ: tự đi tới hồn thú gần nhất, không qua cổng.</small>
      <label class="arange">Bán kính quanh chỗ bật <output data-o="radius"></output>
        <input type="range" min="${AUTO_RADIUS_MIN / TILE}" max="${AUTO_RADIUS / TILE}" step="1" data-k="radius"></label>
      <b class="asub">Niên hạn hồn thú</b>
      <div class="achips" role="group" aria-label="Niên hạn mẫu">${YEAR_PRESETS.map((p, i) => `<button type="button" class="achip" data-preset="${i}" aria-pressed="false"><span>${p.label}</span></button>`).join("")}
        <button type="button" class="achip" data-preset="custom" aria-pressed="false"><span>Tuỳ chọn</span></button></div>
      <div class="aline"><span>Từ</span>${stepper("y0", "Niên hạn từ")}<span>đến</span>${stepper("y1", "Niên hạn đến")}<span>năm</span></div>
      <small class="ayerr" data-a="yerr" role="alert" hidden></small>
      <div class="anote" data-a="hint" hidden><small data-a="hintText"></small> <button class="buse" type="button" data-a="hintApply">Áp dụng</button></div>
      <small>Bỏ qua hồn thú người khác đang đánh. Hồn thú đánh mình thì luôn đánh trả.</small></section>
    <section class="asec"><b>Tinh anh, thú vương, boss</b>
      <label class="achk apill"><input type="checkbox" data-k="elite"><i></i><span>Tinh anh</span></label>
      <label class="achk apill"><input type="checkbox" data-k="king"><i></i><span>Tà hóa thú vương</span></label>
      <label class="achk apill"><input type="checkbox" data-k="world"><i></i><span>Boss thế giới</span></label>
      <label class="aline">Khi nào tới đánh <select data-k="bossMode">
        <option value="near">Khi gần (ưu tiên quái thường quanh mình)</option>
        <option value="always">Luôn ưu tiên (chạy tới bất kể xa)</option>
        <option value="off">Không đánh</option></select></label>
      <small>Xuất hiện trên bản đồ đang đứng thì tới đánh cùng mọi người (đóng góp theo tài khoản), chỉ khi còn nhận được thưởng. Né vùng báo trước, vùng độc; đổi võ hồn khống chế ngắt tích lực, phụ trợ thanh tẩy; ít máu thì lùi ra uống đan.</small></section>
    <section class="asec"><b>Hồn kỹ ưu tiên</b><small>Ô trên cùng tung trước; bỏ chọn thì không tung.</small><ol class="aorder" data-list="skills"></ol>
      <label class="arange">Chừa hồn lực <output data-o="mpKeep"></output><input type="range" min="0" max="0.9" step="0.05" data-k="mpKeep"></label></section>
    <section class="asec"><b>Võ hồn đổi tay</b>
      <label class="achk apill"><input type="checkbox" data-k="tienCo"><i></i><span>Võ hồn khác đầy năng lượng tiên cơ thì đổi tay vào tung, xong về võ hồn chính</span></label>
      <ol class="aorder" data-list="slots"></ol></section>
    <section class="asec"><b>Đan dược</b>
      <label class="arange">Uống đan hồi sinh lực khi dưới <output data-o="hp"></output><input type="range" min="0" max="0.95" step="0.05" data-k="hp"></label>
      <label class="arange">Uống đan hồi hồn lực khi dưới <output data-o="mp"></output><input type="range" min="0" max="0.95" step="0.05" data-k="mp"></label>
      <label class="achk apill"><input type="checkbox" data-k="stopNoPot"><i></i><span>Hết đan hồi sinh lực thì dừng</span></label>
      <label class="achk apill"><input type="checkbox" data-k="restNoPot"><i></i><span>Hết đan thì nghỉ hồi sinh lực rồi săn tiếp (không chọn dừng ở trên)</span></label></section>
    <section class="asec"><b>Nhặt đồ</b>
      <div class="aline"><label class="achk apill"><input type="checkbox" data-k="ringOn"><i></i><span>Hồn hoàn từ</span></label><input type="number" min="0" max="${MAX_YEARS}" step="10" data-k="ring" aria-label="Niên hạn hồn hoàn tối thiểu"> năm</div>
      <label class="achk apill"><input type="checkbox" data-k="bone"><i></i><span>Hồn cốt</span></label>
      <div class="aline"><label class="achk apill"><input type="checkbox" data-k="core"><i></i><span>Hồn hạch từ</span></label><select data-k="coreStar" aria-label="Sao hồn hạch tối thiểu">${stars}</select></div>
      ${kinds}
      <small>Hồn Tệ luôn vào thẳng túi. Không tự hấp thụ hồn hoàn.</small></section>
    <div class="brow"><button class="buse" type="button" data-a="reset">Về mặc định</button></div>
    <section class="asec" data-a="last" hidden><b>Lượt vừa rồi</b><div class="asum"></div></section>`;
  const on = { signal };
  if (isUi2()) { // UI v2: khung Giấy của kit, nút phụ cho ▲ ▼ / Áp dụng / Về mặc định (ui2-auto.css); nút bật / tắt đổi nút chính ↔ phụ theo trạng thái ở fill()
    el.classList.add("f2-giay-lon");
    for (const b of el.querySelectorAll("button.buse:not(.atoggle),button.rlink")) b.classList.add("f2-nut-phu");
    sumBox()?.classList.add("f2-giay-nho");
  }
  $("[data-a=close]", el)!.addEventListener("click", closeAutoPanel, on);
  $("[data-a=toggle]", el)!.addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); ctx?.send(last?.on ? "off" : "on"); }, on);
  $("[data-a=hintApply]", el)!.addEventListener("click", () => {
    const y = last?.hint?.best?.years, cfg = read(el); if (!y || !cfg) return;
    ctx?.send("set", { ...cfg, years: [y[0], y[1]] });
  }, on);
  $("[data-a=reset]", el)!.addEventListener("click", () => ctx?.send("set", structuredClone(AUTO_DEFAULTS)), on);
  // Kéo thanh trượt: chỉ đổi số hiển thị; thả ra (change) thì gửi cài đặt. Gõ ô niên hạn: báo lỗi ngay (từ > đến) nhưng chưa gửi.
  el.addEventListener("input", (e) => {
    const t = e.target as HTMLInputElement;
    if (t.type === "range") showRange(el, t); else if (t.dataset.k === "y0" || t.dataset.k === "y1") checkYears(el);
  }, on);
  // Space trên công tắc / chip đang có tiêu điểm là để bật / tắt: không cho nổi lên phím game (GameScene chặn Space để đánh).
  el.addEventListener("keydown", (e) => {
    const t = e.target as HTMLInputElement;
    if (e.code === "Space" && t.tagName === "INPUT" && (t.type === "checkbox" || t.type === "radio")) e.stopPropagation();
  }, on);
  // Niên hạn mẫu và nút − / +: đặt hai ô rồi gửi (chỉ khi từ ≤ đến).
  el.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-preset], button[data-step]"); if (!b) return;
    const y = (k: string) => $<HTMLInputElement>(`[data-k=${k}]`, el)!;
    if (b.dataset.preset === "custom") { y("y0").focus(); return; }
    if (b.dataset.preset) { const p = YEAR_PRESETS[Number(b.dataset.preset)]; y("y0").value = String(p.years[0]); y("y1").value = String(p.years[1]); }
    else { const i = y(b.dataset.step!); i.value = String(clampYears(Number(i.value) + Number(b.dataset.d) * YEAR_STEP)); }
    b.blur(); commit(el, true);
  }, on);
  // Ô đánh dấu / chọn / thanh trượt đổi xong thì bỏ tiêu điểm để phím game (Space, mũi tên, số) dùng lại ngay; ô số và chọn sao giữ tiêu điểm.
  el.addEventListener("change", (e) => {
    const t = e.target as HTMLInputElement; if (t.type === "checkbox" || t.type === "radio" || t.type === "range") t.blur();
    commit(el, t.dataset.k === "y0" || t.dataset.k === "y1");
  }, on);
  for (const key of ["skills", "slots"] as const) {
    $(`[data-list=${key}]`, el)!.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-mv]"); if (!b) return;
      const l = lists[key], i = Number(b.dataset.i), j = i + Number(b.dataset.mv);
      if (j < 0 || j >= l.order.length) return;
      [l.order[i], l.order[j]] = [l.order[j], l.order[i]];
      const cfg = read(el); if (cfg) ctx?.send("set", cfg);
    }, on);
  }
  const sum = sumBox();
  if (sum) sum.hidden = true;
  if (last) fill(last);
}

const clampYears = (v: number) => Math.min(MAX_YEARS, Math.max(0, Math.round(v) || 0));
const yearsOf = (el: HTMLElement): [number, number] => [clampYears(Number($<HTMLInputElement>("[data-k=y0]", el)!.value)), clampYears(Number($<HTMLInputElement>("[data-k=y1]", el)!.value))];

/** Kiểm niên hạn (từ ≤ đến, trong 0..MAX_YEARS): sai thì ô đỏ + chú thích; đồng thời sáng nút mẫu khớp. Trả về true nếu hợp lệ. */
function checkYears(el: HTMLElement) {
  const [a, b] = yearsOf(el), ok = a <= b;
  for (const k of ["y0", "y1"]) $<HTMLInputElement>(`[data-k=${k}]`, el)!.toggleAttribute("aria-invalid", !ok);
  const err = $("[data-a=yerr]", el)!; err.hidden = ok;
  if (!ok) err.textContent = `Niên hạn "từ" (${a.toLocaleString("vi-VN")}) đang lớn hơn "đến" (${b.toLocaleString("vi-VN")}): sửa lại thì mới lưu.`;
  const hit = ok ? YEAR_PRESETS.findIndex((p) => p.years[0] === a && p.years[1] === b) : -1;
  for (const p of el.querySelectorAll<HTMLButtonElement>("button[data-preset]")) {
    const on = p.dataset.preset === "custom" ? ok && hit < 0 : Number(p.dataset.preset) === hit;
    p.classList.toggle("on", on); p.setAttribute("aria-pressed", String(on));
  }
  return ok;
}

/** Gửi cài đặt sau khi người chơi đổi; niên hạn sai (từ > đến): sửa chính ô niên hạn thì không gửi, đổi ô khác thì gửi kèm niên hạn đang lưu. Ô niên hạn vượt trần thì kẹp về MAX_YEARS ngay ở ô. */
function commit(el: HTMLElement, yearsChanged = false) {
  const [a, b] = yearsOf(el);
  $<HTMLInputElement>("[data-k=y0]", el)!.value = String(a); $<HTMLInputElement>("[data-k=y1]", el)!.value = String(b);
  const cfg = read(el); if (!cfg) return;
  if (!checkYears(el)) {
    if (yearsChanged) return; // đang sửa niên hạn: không gửi (server trả tin sẽ ghi đè số đang gõ), ô đỏ chờ sửa tiếp
    cfg.years = [...last!.cfg.years]; // đổi ô khác khi niên hạn đang sai: vẫn lưu, với niên hạn đang có
  }
  ctx?.send("set", cfg);
}

function showRange(el: HTMLElement, t: HTMLInputElement) {
  const o = $<HTMLOutputElement>(`[data-o=${t.dataset.k}]`, el); if (!o) return;
  o.value = t.dataset.k === "radius" ? `${t.value} ô` : pct(Number(t.value));
}

/** Đọc bảng thành cài đặt (server kẹp lại bằng parseAuto). */
function read(el: HTMLElement): AutoSettings | null {
  if (!last) return null;
  const v = (k: string) => $<HTMLInputElement>(`[data-k=${k}]`, el)!;
  const num = (k: string) => Number(v(k).value) || 0;
  const picked = (key: "skills" | "slots") => {
    const l = lists[key], box = $(`[data-list=${key}]`, el)!;
    l.on = new Set(l.order.filter((i) => $<HTMLInputElement>(`input[data-on="${i}"]`, box)?.checked));
    return l.order.filter((i) => l.on.has(i));
  };
  const scope = $<HTMLInputElement>("input[data-scope]:checked", el)?.value === "near" ? "near" : "map";
  return { scope, radius: num("radius"), years: [num("y0"), num("y1")], hp: num("hp"), mp: num("mp"), mpKeep: num("mpKeep"),
    skills: picked("skills"), slots: picked("slots"), ring: v("ringOn").checked ? num("ring") : -1, bone: v("bone").checked,
    core: v("core").checked, coreStar: Number($<HTMLSelectElement>("[data-k=coreStar]", el)!.value) || 1,
    kinds: AUTO_LOOT_KINDS.filter((k) => $<HTMLInputElement>(`[data-kind=${k}]`, el)?.checked),
    stopNoPot: v("stopNoPot").checked, restNoPot: v("restNoPot").checked, tienCo: v("tienCo").checked, elite: v("elite").checked, king: v("king").checked, world: v("world").checked,
    bossMode: parseAuto({ bossMode: v("bossMode").value }).bossMode };
}

/** Ghi trạng thái và cài đặt từ tin `auto` lên bảng (không dựng lại các ô nhập để không mất tiêu điểm). */
function fill(m: AutoMsg) {
  const el = panel(); if (!el || !$("[data-a=status]", el)) return;
  const c = m.cfg;
  $("[data-a=status]", el)!.textContent = `${m.on ? "Đang tự săn" : "Đang tắt"} · còn ${dur(m.left)} treo`
    + (m.bonus > 0 ? ` (trong đó ${dur(m.bonus)} từ Ủy Thác Lệnh)` : "") + `. Mỗi ngày ${autoTimeText(m.max)} miễn phí.`;
  const t = $("[data-a=toggle]", el)!;
  t.innerHTML = `${m.on ? "Tắt tự động" : "Bật tự động tại đây"} <kbd>T</kbd>`;
  t.classList.toggle("absorb", !m.on);
  el.dataset.on = m.on ? "1" : "0";
  if (isUi2()) { t.classList.toggle("f2-nut-chinh", !m.on); t.classList.toggle("f2-nut-phu", m.on); }
  const set = (k: string, val: string | number | boolean) => {
    const i = $<HTMLInputElement>(`[data-k=${k}]`, el)!;
    if (typeof val === "boolean") i.checked = val; else i.value = String(val);
    if (i.type === "range") showRange(el, i);
  };
  for (const i of el.querySelectorAll<HTMLInputElement>("input[data-scope]")) i.checked = i.value === c.scope;
  // Bán kính chỉ dùng khi săn quanh chỗ đứng.
  set("radius", c.radius); $<HTMLInputElement>("[data-k=radius]", el)!.disabled = c.scope !== "near"; set("y0", c.years[0]); set("y1", c.years[1]); checkYears(el); set("mpKeep", c.mpKeep); set("tienCo", c.tienCo);
  set("hp", c.hp); set("mp", c.mp); set("stopNoPot", c.stopNoPot); set("restNoPot", c.restNoPot); set("elite", c.elite); set("king", c.king); set("world", c.world); set("bossMode", c.bossMode);
  set("ringOn", c.ring >= 0); set("ring", Math.max(0, c.ring)); set("bone", c.bone); set("core", c.core);
  $<HTMLSelectElement>("[data-k=coreStar]", el)!.value = String(c.coreStar);
  for (const k of AUTO_LOOT_KINDS) { const i = $<HTMLInputElement>(`[data-kind=${k}]`, el); if (i) i.checked = c.kinds.includes(k); }
  order(el, "skills", c.skills, (i) => `${SKILL_KEYS[i]} · ${ctx?.skillName(i) || "chưa có hồn kỹ"}`);
  order(el, "slots", c.slots, (i) => `Ô ${i + 1} · ${ctx?.slotName(i) || "trống"}`);
  fillHint(el, m);
  fillJob(el);
  const box = $("[data-a=last]", el)!;
  box.hidden = !lastSum;
  if (lastSum) renderSum($(".asum", box)!, lastSum.sum, lastSum.left);
}

/**
 * Gợi ý khoảng niên hạn hợp sức (AH4, #611): server tính bằng offlineFight với chỉ số võ hồn ra trận (tin `auto`.hint, chỉ ở bản đồ săn);
 * nút "Áp dụng" đặt khoảng niên hạn của cài đặt theo vùng tốt nhất.
 */
function fillHint(el: HTMLElement, m: AutoMsg) {
  const box = $("[data-a=hint]", el); if (!box) return;
  const h = m.hint; box.hidden = !h;
  if (!h) return;
  const b = h.best, apply = $<HTMLButtonElement>("[data-a=hintApply]", el)!;
  apply.hidden = !b;
  const ok = h.rows.filter((r) => r.years), hard = h.rows.length - ok.length;
  const parts = [...ok.map((r) => `${r.zone} ${r.years![0]}–${r.years![1]} năm (~${Math.round(r.secs)} giây/con)`), ...(hard ? [`${hard} vùng còn quá sức`] : [])];
  $("[data-a=hintText]", el)!.textContent = (b ? `Gợi ý hợp sức: ${b.zone}, ${b.years![0]}–${b.years![1]} năm (hạ một con ~${Math.round(b.secs)} giây, tối đa ${AUTO_HINT.maxSecs} giây).`
    : "Võ hồn ra trận hiện chưa đánh nổi vùng nào ở đây trong thời gian hợp lý.") + (parts.length > 1 ? ` Từng vùng: ${parts.join("; ")}.` : "");
}

/** Việc đang làm và thống kê theo giờ trong bảng (AH2, #609): ẩn khi không tự săn; chưa đủ AUTO_STATUS.minSecs thì chưa có số. */
function fillJob(el: HTMLElement) {
  const box = $("[data-a=job]", el); if (!box) return;
  box.hidden = !job;
  if (!job) return;
  $("b", box)!.textContent = autoStatusText(job);
  $("[data-a=rate]", box)!.textContent = job.rate ? ` ${rateLine(job.rate)}` : " · Đang đo thống kê theo giờ…";
}
/** "· Mỗi giờ: 1,2 N kinh nghiệm · … Hồn Tệ · 30 đồ" (cửa sổ trượt AUTO_STATUS.window giây). */
const rateLine = (r: AutoRate) => `· Mỗi giờ: ${autoRateText(r[0])} kinh nghiệm · ${r[1] ? formatHonTe(r[1]) : "0"} Hồn Tệ · ${autoRateText(r[2])} đồ`;

/** Tin `autost` mới (việc đang làm); chỉ nhận khi đang tự săn. */
export function setAutoStatus(m: AutoStMsg) {
  if (!last?.on) return;
  job = m;
  const el = panel(); if (el && !el.hidden) fillJob(el);
}

/** Danh sách thứ tự: ô bật theo thứ tự ưu tiên, ô tắt ở sau; mỗi dòng một ô chọn và hai nút lên / xuống. */
function order(el: HTMLElement, key: "skills" | "slots", picked: number[], label: (i: number) => string) {
  const l = lists[key];
  l.on = new Set(picked);
  l.order = [...picked, ...[0, 1, 2, 3].filter((i) => !l.on.has(i))];
  const box = $(`[data-list=${key}]`, el)!; box.innerHTML = "";
  l.order.forEach((i, k) => {
    const li = document.createElement("li");
    li.innerHTML = `<label class="achk apill"><input type="checkbox" data-on="${i}"><i></i><span></span></label>`
      + `<button type="button" class="rlink" data-mv="-1" data-i="${k}" aria-label="Lên">▲</button>`
      + `<button type="button" class="rlink" data-mv="1" data-i="${k}" aria-label="Xuống">▼</button>`;
    $<HTMLInputElement>("input", li)!.checked = l.on.has(i);
    $("label span", li)!.textContent = label(i);
    box.appendChild(li);
  });
}

function renderSum(box: HTMLElement, s: AutoSummary, left: number) {
  const rows: [string, string][] = [["Thời gian", dur(s.secs)], ["Hồn thú đã hạ", s.kills.toLocaleString("vi-VN")],
    ["Kinh nghiệm", s.xp.toLocaleString("vi-VN")], ["Hồn Tệ", s.coins ? formatHonTe(s.coins) : "0"],
    ["Đồ nhặt", s.loot.length ? s.loot.map(([n, q]) => `${n} ×${q}`).join(", ") : "Không có"], ["Giờ treo còn lại", dur(left)]];
  // Tự bán từ xa trong lượt (#216): Hồn Tệ đã tính trong dòng "Hồn Tệ"; đồ đã bán không còn trong "Đồ nhặt".
  if (s.sold) rows.splice(4, 0, ["Đã tự bán", `${s.sold[0].toLocaleString("vi-VN")} món, +${formatHonTe(s.sold[1])}`]);
  if (s.rate) rows.push(["Mỗi giờ", `${autoRateText(s.rate[0])} kinh nghiệm · ${s.rate[1] ? formatHonTe(s.rate[1]) : "0"} Hồn Tệ · ${autoRateText(s.rate[2])} đồ`]);
  box.innerHTML = "";
  for (const [k, v] of rows) {
    const a = document.createElement("span"), b = document.createElement("b"); a.textContent = k; b.textContent = v; box.append(a, b);
  }
}

/** Tin `auto` mới: cập nhật bảng; có tổng kết (tự săn vừa dừng, đã treo ít nhất 1 giây) thì mở bảng tổng kết kèm lý do dừng. */
export function setAutoMsg(m: AutoMsg) {
  last = m;
  if (!m.on) job = null;
  // Tin `auto` không kèm `sum` (đổi cài đặt, từ chối bật…) không xóa mục "Lượt vừa rồi".
  if (m.on) lastSum = null; else if (m.sum) lastSum = { sum: m.sum, left: m.left };
  fill(m);
  const el = sumBox(); if (!el) return;
  if (m.on) { el.hidden = true; return; }
  if (!m.sum || m.sum.secs < 1) return;
  el.innerHTML = `<div class="rhead"><b>Tổng kết tự động</b><button class="x" type="button" aria-label="Đóng tổng kết">×</button></div>`
    + `<small class="anote"></small><div class="asum"></div>`;
  $("small", el)!.textContent = m.why ? `Đã dừng: ${m.why}` : "Đã dừng.";
  renderSum($(".asum", el)!, m.sum, m.left);
  $("button", el)!.addEventListener("click", closeAutoSum);
  el.hidden = false;
}
