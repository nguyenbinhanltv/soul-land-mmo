// Bảng chỉnh ráp phụ thể (#1192; mở bằng `?thu=phuthe&sua=1`, chỉ GM / dev): chỉnh dx, dy, scale của (giới, hướng) đang xem bằng kéo thả trên khung hình, phím mũi tên, lăn chuột, ô số;
// hoàn tác / làm lại; xem clip idle / walk / attack / cast / hurt (có dừng khung); lưu = tải anchor.json hoặc chép JSON rồi `node tools/assets/phuthe-anchor-apply.mjs <tệp>` (không có quyền ghi nào ở server).
import { PHU_DIRS } from "./phutheAnim.ts";
import { PHU_SCALE_RANGE, phuAnchorJson, type PhuAnchorTable } from "./phutheAnchor.ts";
import { PHU_SHIFT_MAX, PhuHistory, clampScale, clampShift, phuAssignTable, phuDragDelta, phuNudge, phuStep, phuWheelScale } from "./phutheEdit.ts";

export const PHU_EDITOR_W = 320;
export interface EditHost {
  id(): string; table(): PhuAnchorTable; sex(): "m" | "f"; setSex(s: "m" | "f"): void; row(): number; flip(): boolean; zoom(): number;
  state(): string; setState(s: string): void; setPaused(p: boolean): void; canvas(): HTMLCanvasElement; save(): void;
}
const CLIPS: [string, string][] = [["idle", "Đứng"], ["walk", "Đi"], ["attack", "Đánh"], ["cast", "Thi triển"], ["hurt", "Bị đánh"]];
const CSS = "position:fixed;right:0;top:0;bottom:0;z-index:60;overflow:auto;box-sizing:border-box;padding:10px;background:#0d1a14ee;color:#eef;font:13px/1.45 system-ui;border-left:1px solid #4a6;";

export function mountPhutheEditor(h: EditHost): void {
  const hist = new PhuHistory(), box = document.createElement("div");
  box.style.cssText = CSS + `width:${PHU_EDITOR_W}px`;
  const btn = (id: string, t: string, tip = "") => `<button id="${id}" title="${tip}" style="padding:3px 7px">${t}</button>`;
  const num = (k: string, t: string, min: number, max: number, step: number) => `<label style="display:flex;align-items:center;gap:6px;margin:3px 0"><span style="width:44px">${t}</span><input type="number" id="n${k}" min="${min}" max="${max}" step="${step}" style="width:84px"><input type="range" id="r${k}" min="${min}" max="${max}" step="${step}" style="flex:1"></label>`;
  box.innerHTML = `
    <b style="font-size:15px">Chỉnh ráp phụ thể</b> <small>(GM / dev)</small>
    <div id="et" style="margin:6px 0;color:#9fd"></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px"><span>Giới:</span>${btn("sm", "Nam")}${btn("sf", "Nữ", "Thân thử là nam, giới nữ chỉ chỉnh số")}</div>
    ${num("dx", "dx", -PHU_SHIFT_MAX, PHU_SHIFT_MAX, 0.25)}${num("dy", "dy", -PHU_SHIFT_MAX, PHU_SHIFT_MAX, 0.25)}${num("sc", "scale", PHU_SCALE_RANGE[0], PHU_SCALE_RANGE[1], 0.01)}
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">${btn("eu", "↶ Hoàn tác", "Ctrl+Z")}${btn("er", "↷ Làm lại", "Ctrl+Y / Ctrl+Shift+Z")}${btn("e0", "Đặt lại hướng này")}${btn("ec", "Chép sang giới kia", "Chép dx, dy, scale của hướng này sang cùng hướng của giới còn lại")}</div>
    <div style="margin:6px 0"><div>Clip:</div><div style="display:flex;gap:4px;flex-wrap:wrap">${CLIPS.map(([k, t]) => btn("c" + k, t)).join("")}${btn("ep", "Dừng khung", "Dừng ở khung đang xem để kéo cho chuẩn")}</div></div>
    <div style="margin:8px 0;display:flex;gap:6px;flex-wrap:wrap">${btn("ed", "Lưu: tải anchor.json", "Tải mục võ hồn này; ghi vào repo bằng lệnh bên dưới")}${btn("ey", "Sao chép JSON")}</div>
    <div id="es" style="min-height:18px;color:#ff9"></div>
    <details open style="margin-top:8px"><summary>Cách dùng</summary><ul style="margin:4px 0 0 16px;padding:0">
      <li>Kéo thả trên khung hình: dời phụ thể "Sau"; lăn chuột: đổi scale.</li>
      <li>Phím mũi tên: nhích 1 điểm ảnh (Shift 5, Ctrl 0,25); <kbd>+</kbd> / <kbd>-</kbd>: scale ±0,01; Ctrl+Z / Ctrl+Y: hoàn tác / làm lại.</li>
      <li>Chữ thập xanh = giữa lưng thân LPC (điểm đích); chọn hướng ở thanh trên, mỗi hướng và mỗi giới chỉnh riêng.</li>
      <li>Ghi vào repo: lưu tệp rồi chạy <code>node tools/assets/phuthe-anchor-apply.mjs &lt;tệp tải về&gt;</code>.</li></ul></details>`;
  document.body.appendChild(box);
  const $ = <T extends HTMLElement>(id: string) => box.querySelector<T>("#" + id)!, inp = (id: string) => $<HTMLInputElement>(id);
  let paused = false, burst = false;
  const cur = () => h.table()[h.sex()][h.row()];
  const say = (t: string) => { $("es").textContent = t; };
  const refresh = () => {
    const a = cur();
    $("et").textContent = `${h.id()} · hướng ${PHU_DIRS[h.row()]} · ${h.sex() === "f" ? "nữ" : "nam"} · ${h.state()}`;
    for (const [k, v] of [["dx", a.dx], ["dy", a.dy], ["sc", a.scale]] as const) for (const p of ["n", "r"]) { const e = inp(p + k); if (document.activeElement !== e) e.value = String(Math.round(v * 100) / 100); }
    $("eu").toggleAttribute("disabled", !hist.canUndo); $("er").toggleAttribute("disabled", !hist.canRedo);
    for (const [id, on] of [["sm", h.sex() === "m"], ["sf", h.sex() === "f"]] as const) $(id).style.fontWeight = on ? "700" : "400";
    for (const [k] of CLIPS) $("c" + k).style.fontWeight = h.state() === k ? "700" : "400";
    $("ep").textContent = paused ? "▶ Chạy tiếp" : "Dừng khung";
  };
  /** Một thay đổi: lưu ảnh chụp để hoàn tác (`coalesce` = cùng một cú kéo / chuỗi phím thì chỉ chụp lần đầu), sửa, lưu sessionStorage. */
  const change = (fn: (a: ReturnType<typeof cur>) => void, coalesce = false) => {
    const t = h.table(); if (!(coalesce && burst)) hist.push(t);
    burst = coalesce; fn(cur()); t.manual = true; h.save(); refresh();
  };
  const nudge = (dx: number, dy: number, sc = 0) => change((a) => { a.dx = clampShift(a.dx + dx); a.dy = clampShift(a.dy + dy); a.scale = clampScale(a.scale + sc); }, true);
  const walk = (undo: boolean) => { const t = h.table(), p = undo ? hist.undo(t) : hist.redo(t); if (!p) return; phuAssignTable(t, p); burst = false; h.save(); refresh(); };
  const setNum = (k: "dx" | "dy" | "sc", v: number) => change((a) => { if (k === "sc") a.scale = clampScale(v); else a[k] = clampShift(v); });
  for (const k of ["dx", "dy", "sc"] as const) for (const p of ["n", "r"]) inp(p + k).oninput = () => { const v = inp(p + k).valueAsNumber; if (Number.isFinite(v)) setNum(k, v); };
  $("sm").onclick = () => { h.setSex("m"); refresh(); }; $("sf").onclick = () => { h.setSex("f"); refresh(); };
  $("eu").onclick = () => walk(true); $("er").onclick = () => walk(false);
  $("e0").onclick = () => change((a) => Object.assign(a, { dx: 0, dy: 0, scale: 1 }));
  $("ec").onclick = () => { const o = h.sex() === "m" ? "f" : "m", s = cur(); change(() => Object.assign(h.table()[o][h.row()], { dx: s.dx, dy: s.dy, scale: s.scale })); say(`Đã chép sang ${o === "f" ? "nữ" : "nam"}.`); };
  for (const [k] of CLIPS) $("c" + k).onclick = () => { h.setState(k); refresh(); };
  $("ep").onclick = () => { paused = !paused; h.setPaused(paused); refresh(); };
  const json = () => JSON.stringify({ [h.id()]: phuAnchorJson(h.table()) }, null, 1) + "\n";
  $("ed").onclick = () => {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([json()], { type: "application/json" }));
    a.download = "anchor.json"; a.click(); URL.revokeObjectURL(a.href); say("Đã tải anchor.json. Chạy: node tools/assets/phuthe-anchor-apply.mjs <tệp>");
  };
  $("ey").onclick = () => { void navigator.clipboard?.writeText(json()).then(() => say("Đã sao chép JSON."), () => say("Không sao chép được, dùng nút tải.")); };
  // kéo thả trên khung hình
  let drag: { x: number; y: number } | null = null;
  window.addEventListener("pointerdown", (e) => { if (e.target !== h.canvas() || e.button !== 0) return; drag = { x: e.clientX, y: e.clientY }; burst = false; }); // chỉ bấm không kéo thì không chụp lịch sử (không xóa hàng làm lại): `nudge` tự chụp ở lần dời đầu
  window.addEventListener("pointermove", (e) => { if (!drag) return; const [dx, dy] = phuDragDelta(e.clientX - drag.x, e.clientY - drag.y, h.zoom(), h.flip()); drag = { x: e.clientX, y: e.clientY }; if (dx || dy) nudge(dx, dy); });
  window.addEventListener("pointerup", () => { drag = null; burst = false; });
  window.addEventListener("wheel", (e) => { if (e.target !== h.canvas()) return; e.preventDefault(); change((a) => { a.scale = phuWheelScale(a.scale, e.deltaY); }); }, { passive: false });
  window.addEventListener("keydown", (e) => {
    const t = e.target as HTMLElement; if ((t.tagName === "INPUT" && (t as HTMLInputElement).type !== "range") || t.tagName === "SELECT") return;
    const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    if (mod && k === "z") { e.preventDefault(); walk(!e.shiftKey); return; }
    if (mod && k === "y") { e.preventDefault(); walk(false); return; }
    const n = phuNudge(e.key, phuStep(e.shiftKey, e.ctrlKey), h.flip());
    if (n) { e.preventDefault(); nudge(n[0], n[1]); } else if (e.key === "+" || e.key === "=" || e.key === "-") { e.preventDefault(); nudge(0, 0, e.key === "-" ? -0.01 : 0.01); }
  });
  window.addEventListener("keyup", (e) => { if (e.key.startsWith("Arrow") || e.key === "+" || e.key === "=" || e.key === "-") burst = false; });
  setInterval(refresh, 250); // hướng đổi (chọn tay hoặc hướng thân đổi) thì ô số theo
  refresh();
}
