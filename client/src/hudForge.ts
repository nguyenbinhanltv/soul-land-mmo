// Thợ rèn (cường hóa hồn cốt / hồn hạch / trang bị, may mắn, hợp thành, phân giải, đổi bộ) của HUD (tách nguyên văn từ hud.ts, Part of #885 bước 0a); hud.ts re-export để nơi gọi giữ nguyên.
import { NpcActions, NpcPage, npcDefOpen, npcPage, renderNpc } from "./hudNpc.ts";
import { boneOf, coreOf, coreSet, itemArt, itemColor, itemName } from "./hudBag.ts";
import { coreEnhText, corePicker, enhClose, enhOpen, enhTarget, enhText, enhancePicker } from "./hudRoster.ts";
import { itemDef, honTeParts, CORE_SETS, coreResetFee, BONE_MAX_ENHANCE, CORE_MAX_ENHANCE, CORE_MAX_SUBS } from "../../shared/data.ts";
import { artImg } from "./uiArt.ts";
import { EQUIP_ITEM, EQUIP_LUCK_MAX, EQUIP_SOUL, equipFrameKey, EQUIP_SLOTS, EQUIP_TIERS, EQUIP_MAX_TIER, EQUIP_ESSENCE, EQUIP_SALVAGE, EQUIP_SALVAGE_MAX, EQUIP_SYNTH_KEEP, equipName, equipTemplate, equipSlotDef, equipSynthStep, parseEquip } from "../../shared/data.ts";
import { toast } from "./feedback.ts";
import { isUi2 } from "./uiKit.ts";
import { lockWhy } from "./uiParts.ts";
import { confirmDialog } from "./confirmDialog.ts";
import type { EquipEnhPreview, EquipEnhDone, EquipLuckPreview, EquipLuckDone, EquipSynDone, EquipSalvDone } from "./net.ts";
import type { BagMsg, BagItem } from "./net.ts";

/**
 * Lò rèn: chọn một hồn cốt (đang gắn hoặc trong túi) để mở bảng cường hóa của bước 4.4 (enhancePicker, message `enhance` giữ
 * nguyên); nâng cấp hồn hạch ở trang riêng (renderForgeCores, 5.3). Bảng cường hóa vẫn mở được từ túi đồ / bảng hồn cốt như trước.
 */
export function renderForge(bag: BagMsg, act: NpcActions): HTMLElement {
  const again = () => renderNpc();
  const target = enhTarget ? bag.items.find((i) => i.id === enhTarget) : undefined;
  if (target && boneOf(target) && target.years !== null) {
    return enhancePicker(target as BagItem & { years: number }, bag.items, act, again); // nút "Đóng" của bảng về danh sách hồn cốt
  }
  if (enhTarget) enhClose();
  const box = document.createElement("div"); box.className = "forge";
  const h = document.createElement("b"); h.className = "shead"; h.textContent = "Cường hóa hồn cốt"; box.appendChild(h);
  const bones = bag.items.filter((i) => boneOf(i) && i.years !== null) as (BagItem & { years: number })[];
  bones.sort((a, b) => Number(b.vohon !== null) - Number(a.vohon !== null) || b.enhance - a.enhance || b.years - a.years);
  if (!bones.length) { const p = document.createElement("small"); p.textContent = "Chưa có hồn cốt nào. Hồn cốt rơi khi hạ hồn thú; hồn cốt dư dùng làm nguyên liệu."; box.appendChild(p); }
  for (const it of bones) {
    const b = document.createElement("button"); b.type = "button"; b.className = "aopt eopt noico"; b.style.setProperty("--c", itemColor(it));
    b.disabled = it.enhance >= BONE_MAX_ENHANCE;
    b.innerHTML = `<b></b><i></i><span></span>`;
    b.querySelector("b")!.textContent = itemName(it);
    b.querySelector("i")!.textContent = it.vohon !== null ? "đang gắn" : "trong túi";
    b.querySelector("span")!.textContent = enhText(it);
    b.addEventListener("click", () => { b.blur(); enhOpen(it.id); again(); });
    box.appendChild(b);
  }
  return box;
}

/**
 * Lò rèn, trang nâng cấp hồn hạch (bước 5.3): chọn một hồn hạch (đang gắn trước, rồi cấp cao, sao cao) để mở bảng nâng cấp
 * (corePicker, message `enhancecore`); nút "Đóng" của bảng về danh sách. Bảng vẫn mở được từ túi đồ / mục hồn hạch như hồn cốt.
 */
export function renderForgeCores(bag: BagMsg, act: NpcActions): HTMLElement {
  const again = () => renderNpc();
  const target = enhTarget ? bag.items.find((i) => i.id === enhTarget) : undefined;
  if (target && coreOf(target)) return corePicker(target, bag.items, act, again);
  if (enhTarget) enhClose();
  const box = document.createElement("div"); box.className = "forge";
  const h = document.createElement("b"); h.className = "shead"; h.textContent = "Nâng cấp hồn hạch"; box.appendChild(h);
  const cores = bag.items.filter((i) => coreOf(i));
  cores.sort((a, b) => Number(b.vohon !== null) - Number(a.vohon !== null) || b.enhance - a.enhance || (b.stars ?? 1) - (a.stars ?? 1));
  if (!cores.length) { const p = document.createElement("small"); p.textContent = "Chưa có hồn hạch nào. Hồn hạch rơi khi hạ hồn thú; hồn hạch dư dùng làm nguyên liệu."; box.appendChild(p); }
  for (const it of cores) {
    const b = document.createElement("button"); b.type = "button"; b.className = "aopt eopt noico"; b.style.setProperty("--c", itemColor(it));
    b.disabled = it.enhance >= CORE_MAX_ENHANCE;
    b.innerHTML = `<b></b><i></i><span></span>`;
    b.querySelector("b")!.textContent = itemName(it);
    b.querySelector("i")!.textContent = it.vohon !== null ? "đang gắn" : "trong túi";
    b.querySelector("span")!.textContent = `${coreEnhText(it)} · ${coreOf(it)!.subs.length}/${CORE_MAX_SUBS} dòng phụ`;
    b.addEventListener("click", () => { b.blur(); enhOpen(it.id); again(); });
    box.appendChild(b);
  }
  return box;
}

/** Ô biểu tượng nhỏ của một trang bị hồn sư trong danh sách Thợ rèn: ảnh món + khung viền theo bậc (E5); thiếu ảnh thì chỉ còn khung / ô trống. */
const equipIcon = (stats: BagItem["stats"]) => {
  const t = equipTemplate(parseEquip(stats)?.tpl);
  return `<span class="eico">${itemArt({ code: EQUIP_ITEM, years: null, stats })}${t ? artImg(equipFrameKey(t.tier), "efr") : ""}</span>`;
};
/** Các dòng "tên: giá trị" của bảng xem trước (server tính, client chỉ hiển thị). UI v2: dòng "Tỉ lệ thành công" kèm thanh tỉ lệ (hình, không chỉ chữ %). */
const addRows = (box: HTMLElement, rows: [string, string][]) => {
  for (const [k, v] of rows) {
    const r = document.createElement("div"); r.className = "erow"; r.innerHTML = `<b></b><span></span>`; r.querySelector("b")!.textContent = k; r.querySelector("span")!.textContent = v;
    const pct = isUi2() && k === "Tỉ lệ thành công" ? parseInt(v, 10) : NaN;
    if (pct >= 0 && pct <= 100) { r.classList.add("erate"); r.setAttribute("role", "meter"); r.setAttribute("aria-valuenow", String(pct)); r.setAttribute("aria-valuemin", "0"); r.setAttribute("aria-valuemax", "100"); r.setAttribute("aria-label", k); r.insertAdjacentHTML("beforeend", `<i class="sbar"><i></i></i>`); (r.querySelector(".sbar i") as HTMLElement).style.width = `${pct}%`; }
    box.appendChild(r);
  }
};
type ForgeFx = { kind: "ok" | "fail" | "break"; page: NpcPage; until: number; at: number };
const FORGE_FX_MS = 900;
let forgeFx: ForgeFx | null = null; // hiệu ứng kết quả của trang Thợ rèn (E5): xanh sáng / đỏ rung / vỡ; giữ qua các lần vẽ lại (tin bag / gear về ngay sau kết quả)
/** Ghi hiệu ứng cho `page`, chỉ khi đúng trang đó đang mở (kết quả về lúc đã đóng / sang trang khác thì không bật lại lần sau). */
const setFx = (kind: ForgeFx["kind"], page: NpcPage) => { const t = performance.now(); forgeFx = npcDefOpen && npcPage === page ? { kind, page, at: t, until: t + FORGE_FX_MS } : null; };
/** Gắn lớp hiệu ứng lên hộp Thợ rèn vừa dựng; vẽ lại giữa chừng thì `animation-delay` âm để không chạy lại từ đầu. */
const takeFx = (box: HTMLElement, page: NpcPage) => {
  if (!forgeFx || forgeFx.page !== page || performance.now() >= forgeFx.until) { if (forgeFx && performance.now() >= forgeFx.until) forgeFx = null; return; }
  box.classList.add(`fx-${forgeFx.kind}`); box.style.animationDelay = `-${((performance.now() - forgeFx.at) / 1000).toFixed(3)}s`;
};
let gearPick: string | null = null; // trang bị đang chọn ở trang "Cường hóa trang bị hồn sư" của Thợ rèn (E3)
let gearPrev: EquipEnhPreview | null = null; // tin xem trước gần nhất (server tính, client chỉ hiển thị)
let gearCharm = false; // đang chọn dùng Bùa Hộ Mệnh
let gearConfirm = false; // đã bấm nút đỏ lần đầu: bấm lần nữa mới gửi
/** Tin "equipenhp" (E3): xem trước lần cường hóa tiếp theo. */
export function equipEnhPreview(m: EquipEnhPreview) { if (m.id === gearPick) { gearPrev = m; if (npcDefOpen && npcPage === "forgegear") renderNpc(); } }
/** Tin "equipenhd" (E3): xong một lần cường hóa; bỏ trạng thái xác nhận, món bị phá hủy thì về danh sách. */
export function equipEnhDone(m: EquipEnhDone) {
  gearConfirm = false; if (m.destroyed && m.id === gearPick) { gearPick = null; gearPrev = null; }
  setFx(m.destroyed ? "break" : m.ok ? "ok" : "fail", "forgegear");
  toast("info", m.destroyed ? "Trang bị bị phá hủy" : m.ok ? `Cường hóa thành công +${m.to}` : m.charmUsed ? `Thất bại, Bùa Hộ Mệnh giữ +${m.to}` : `Cường hóa thất bại (+${m.to})`);
  if (npcDefOpen && npcPage === "forgegear") renderNpc();
}
/** Vẽ lại hộp thoại NPC khi trang bị đang mặc đổi (tin "gear"). */
export function npcRefresh() { if (npcDefOpen) renderNpc(); }
const failText = (f: EquipEnhPreview["fail"]) => !f ? "" : f.kind === "keep" ? "giữ nguyên cấp" : f.kind === "down" ? `tụt ${f.n} cấp` : f.kind === "reset" ? `về +${f.to}` : "món bị PHÁ HỦY (không có Bùa Hộ Mệnh)";
/**
 * Lò rèn, trang cường hóa trang bị hồn sư (E3; trang đẹp ở E5): chọn món (đang mặc hoặc trong túi), xem bảng xem trước do server tính (tỉ lệ, đá,
 * phí, hậu quả thất bại), có thể dùng Bùa Hộ Mệnh. Nút chuyển ĐỎ và phải bấm hai lần khi thất bại có thể tụt cấp hoặc phá hủy.
 */
export function renderForgeGear(el: HTMLElement, bag: BagMsg, act: NpcActions) {
  const box = document.createElement("div"); box.className = "forge"; el.appendChild(box); takeFx(box, "forgegear");
  const h = document.createElement("b"); h.className = "shead"; h.textContent = "Cường hóa trang bị hồn sư"; box.appendChild(h);
  const worn = (act.gear()?.items ?? []).map((g) => ({ id: g.id, name: equipName(parseEquip(g.stats)?.tpl, g.enhance), enhance: g.enhance, where: `đang mặc (${EQUIP_SLOTS[g.slot]?.name ?? "?"})`, stats: g.stats }));
  const loose = bag.items.filter((i) => i.code === EQUIP_ITEM && i.vohon === null).map((i) => ({ id: i.id, name: itemName(i), enhance: i.enhance, where: "trong túi", stats: i.stats }));
  const all = [...worn, ...loose], pick = gearPick ? all.find((x) => x.id === gearPick) : undefined;
  if (!pick) {
    gearPick = null; gearPrev = null;
    if (!all.length) { const p = document.createElement("small"); p.textContent = "Chưa có trang bị hồn sư nào để cường hóa."; box.appendChild(p); }
    for (const it of all) {
      const b = document.createElement("button"); b.type = "button"; b.className = "aopt eopt"; b.style.setProperty("--c", EQUIP_TIERS[equipTemplate(parseEquip(it.stats)?.tpl ?? "")?.tier ?? 0]?.col ?? "#9db3a2");
      b.innerHTML = `${equipIcon(it.stats)}<b></b><i></i><span></span>`;
      b.querySelector("b")!.textContent = it.name; b.querySelector("i")!.textContent = it.where;
      b.addEventListener("click", () => { b.blur(); gearPick = it.id; gearPrev = null; gearCharm = false; gearConfirm = false; act.equipEnhPreview(it.id); renderNpc(); });
      box.appendChild(b);
    }
    return;
  }
  const info = document.createElement("small"); box.appendChild(info);
  const back = document.createElement("button"); back.type = "button"; back.className = "aopt drop"; back.textContent = "Chọn trang bị khác";
  back.addEventListener("click", () => { gearPick = null; gearPrev = null; gearConfirm = false; renderNpc(); });
  const pv = gearPrev && gearPrev.id === pick.id ? gearPrev : null;
  if (!pv) { info.textContent = `${pick.name}: đang tải bảng xem trước…`; box.appendChild(back); return; }
  if (pv.to === null) { info.textContent = `${pick.name} đã cường hóa tối đa.`; box.appendChild(back); return; }
  const stone = pv.stone ? itemDef(pv.stone)?.name ?? pv.stone : "";
  const rows: [string, string][] = [["Món", `${pick.name} (${pick.where})`], ["Cấp", `+${pv.enhance} → +${pv.to}`], ["Tỉ lệ thành công", `${Math.round(pv.p * 100)}%`],
    ["Đá cần", `${pv.qty} ${stone} (có ${pv.have})`], ["Phí", honTeParts(pv.fee).map((x) => `${x.n.toLocaleString("vi-VN")} ${x.unit}`).join(" ") || "0"],
    ["Nếu thất bại", failText(pv.fail)], ["Đá và phí mất cả khi thất bại", ""]];
  addRows(box, rows);
  const destroy = pv.fail?.kind === "destroy";
  if (destroy) {
    const l = document.createElement("label"); l.className = "echarm"; const c = document.createElement("input"); c.type = "checkbox"; c.checked = gearCharm && pv.charm > 0; c.disabled = pv.charm <= 0;
    c.addEventListener("change", () => { gearCharm = c.checked; gearConfirm = false; renderNpc(); });
    l.appendChild(c); l.appendChild(document.createTextNode(` Dùng Bùa Hộ Mệnh (có ${pv.charm}): thất bại giữ nguyên cấp, mất 1 bùa`)); box.appendChild(l);
  }
  const risky = pv.fail?.kind === "down" || pv.fail?.kind === "reset" || (destroy && !(gearCharm && pv.charm > 0));
  const poor = pv.have < pv.qty || pv.honTe < pv.fee, go = document.createElement("button"); go.type = "button";
  go.className = `aopt ${risky ? "danger" : "absorb"}`; if (risky && !isUi2()) go.style.background = "#a82a2a";
  go.disabled = poor || pv.busy || act.combat();
  go.textContent = poor ? "Không đủ đá hoặc Hồn Tệ" : act.combat() ? "Đang giao chiến" : risky ? (gearConfirm ? `Bấm lần nữa: ${destroy ? "có thể PHÁ HỦY" : "có thể tụt cấp"}` : `Cường hóa (${destroy ? "nguy cơ phá hủy" : "có thể tụt cấp"})`) : "Cường hóa";
  go.addEventListener("click", () => {
    go.blur();
    if (risky && !gearConfirm) { gearConfirm = true; renderNpc(); return; }
    gearConfirm = false; act.equipEnh(pick.id, destroy && gearCharm && pv.charm > 0);
  });
  box.appendChild(go); box.appendChild(back);
  lockWhy(go, poor ? "Không đủ đá hoặc Hồn Tệ." : pv.busy ? "Đang xử lý lượt trước, chờ máy chủ trả lời." : act.combat() ? "Đang giao chiến: rời xa hồn thú vài giây rồi làm tiếp." : null);
}

// ---------- Lò rèn: khắc may mắn bằng Thần Hồn (vũ khí, dây chuyền) ----------
let luckPick: string | null = null, luckPrev: EquipLuckPreview | null = null; // món đang chọn và bảng xem trước server tính
/** Tin "equipluckp": xem trước lần khắc may mắn kế tiếp. */
export function equipLuckPreview(m: EquipLuckPreview) { if (m.id === luckPick) { luckPrev = m; if (npcDefOpen && npcPage === "forgeluck") renderNpc(); } }
/** Tin "equipluckd": xong một lần khắc; hiệu ứng thành / bại như cường hóa. */
export function equipLuckDone(m: EquipLuckDone) {
  setFx(m.ok ? "ok" : "fail", "forgeluck");
  toast("info", m.ok ? `Khắc may mắn thành công: M${m.to}` : `Khắc may mắn thất bại, giữ M${m.to}`);
  if (npcDefOpen && npcPage === "forgeluck") renderNpc();
}
const luckReason = (r: EquipLuckPreview["reason"], max: number) => r === "slot" ? "Chỉ vũ khí và dây chuyền khắc may mắn được." : r === "max" ? `Món đã đạt may mắn tối đa M${max}.` : r === "worn" ? `Tổng may mắn hai ô đang mặc đã đạt tối đa M${max}.` : "";
/**
 * Lò rèn, trang khắc may mắn: chọn vũ khí / dây chuyền (đang mặc hoặc trong túi), bảng xem trước do server tính (tỉ lệ, Thần Hồn). 1 Thần Hồn mỗi lần,
 * thất bại mất Thần Hồn, may mắn giữ nguyên, món không bị phá (không cần xác nhận hai lần). Tỉ lệ chỉ hiển thị, server tung và kiểm lại.
 */
export function renderForgeLuck(el: HTMLElement, bag: BagMsg, act: NpcActions) {
  const box = document.createElement("div"); box.className = "forge"; el.appendChild(box); takeFx(box, "forgeluck");
  const h = document.createElement("b"); h.className = "shead"; h.textContent = "Khắc may mắn"; box.appendChild(h);
  const hasLuck = (stats: BagItem["stats"]) => { const e = parseEquip(stats), t = equipTemplate(e?.tpl ?? ""); return !!t && !!equipSlotDef(t.slot).luck; };
  const worn = (act.gear()?.items ?? []).filter((g) => hasLuck(g.stats)).map((g) => ({ id: g.id, name: equipName(parseEquip(g.stats)?.tpl, g.enhance), luck: parseEquip(g.stats)?.luck ?? 0, where: `đang mặc (${EQUIP_SLOTS[g.slot]?.name ?? "?"})`, stats: g.stats }));
  const loose = bag.items.filter((i) => i.code === EQUIP_ITEM && i.vohon === null && hasLuck(i.stats)).map((i) => ({ id: i.id, name: itemName(i), luck: parseEquip(i.stats)?.luck ?? 0, where: "trong túi", stats: i.stats }));
  const all = [...worn, ...loose], pick = luckPick ? all.find((x) => x.id === luckPick) : undefined;
  const soulName = itemDef(EQUIP_SOUL)?.name ?? "Thần Hồn";
  if (!pick) {
    luckPick = null; luckPrev = null;
    const p = document.createElement("small"); p.textContent = all.length ? `Khắc may mắn tốn 1 ${soulName} mỗi lần (rơi từ phân giải Chí Bảo). Thất bại mất ${soulName}, giữ may mắn, món không bị phá.` : "Chưa có vũ khí hay dây chuyền nào để khắc may mắn."; box.appendChild(p);
    for (const it of all) {
      const b = document.createElement("button"); b.type = "button"; b.className = "aopt eopt"; b.style.setProperty("--c", EQUIP_TIERS[equipTemplate(parseEquip(it.stats)?.tpl ?? "")?.tier ?? 0]?.col ?? "#9db3a2");
      b.innerHTML = `${equipIcon(it.stats)}<b></b><i></i><span class="eluck"></span>`;
      b.querySelector("b")!.textContent = it.name; b.querySelector("i")!.textContent = it.where; b.querySelector(".eluck")!.textContent = `May mắn M${it.luck}/${EQUIP_LUCK_MAX}`;
      b.addEventListener("click", () => { b.blur(); luckPick = it.id; luckPrev = null; act.equipLuckPreview(it.id); renderNpc(); });
      box.appendChild(b);
    }
    return;
  }
  const info = document.createElement("small"); box.appendChild(info);
  const back = document.createElement("button"); back.type = "button"; back.className = "aopt drop"; back.textContent = "Chọn trang bị khác";
  back.addEventListener("click", () => { luckPick = null; luckPrev = null; renderNpc(); });
  const pv = luckPrev && luckPrev.id === pick.id ? luckPrev : null;
  if (!pv) { info.textContent = `${pick.name}: đang tải bảng xem trước…`; box.appendChild(back); return; }
  const rows: [string, string][] = [["Món", `${pick.name} (${pick.where})`], ["May mắn", pv.to === null ? `M${pv.luck}/${pv.max}` : `M${pv.luck} → M${pv.to}`]];
  if (pv.to !== null) rows.push(["Tỉ lệ thành công", `${Math.round(pv.p * 100)}%`], ["Cần", `1 ${soulName} (có ${pv.soul})`], ["Nếu thất bại", `mất 1 ${soulName}, giữ M${pv.luck}, món không bị phá`]);
  addRows(box, rows);
  if (pv.to === null) { info.textContent = luckReason(pv.reason, pv.max); box.appendChild(back); return; }
  const poor = pv.soul < 1, go = document.createElement("button"); go.type = "button"; go.className = "aopt absorb";
  go.disabled = poor || pv.busy || act.combat();
  go.textContent = poor ? `Không đủ ${soulName}` : act.combat() ? "Đang giao chiến" : "Khắc may mắn";
  go.addEventListener("click", () => { go.blur(); act.equipLuck(pick.id); });
  box.appendChild(go); box.appendChild(back);
  lockWhy(go, poor ? `Không đủ ${soulName}.` : pv.busy ? "Đang xử lý lượt trước, chờ máy chủ trả lời." : act.combat() ? "Đang giao chiến: rời xa hồn thú vài giây rồi làm tiếp." : null);
}

// ---------- Lò rèn: hợp thành 3 → 1 và phân giải trang bị hồn sư (E4; trang đẹp ở E5) ----------
let synMain: string | null = null, synSac: string[] = [], synConfirm = false; // hợp thành: món chính, hai món hiến tế, đã bấm nút lần đầu
const salvSel = new Set<string>(); // phân giải: các món đang chọn
/** Đặt lại trạng thái trang Thợ rèn khi mở trang (gọi từ hudNpc.ts; biến import không gán được). */
export const forgeReset = {
  gear() { gearPick = null; gearConfirm = false; },
  luck() { luckPick = null; },
  synth() { synMain = null; synSac = []; synConfirm = false; },
  salv() { salvSel.clear(); },
};
/** Các trang bị hồn sư trong túi (không khoá) kèm bậc và ô; món đang mặc không nằm trong túi nên không xuất hiện. */
const looseEquip = (bag: BagMsg) => bag.items.flatMap((i) => {
  const t = i.code === EQUIP_ITEM && i.vohon === null && !i.lock ? equipTemplate(parseEquip(i.stats)?.tpl ?? "") : undefined;
  return t ? [{ it: i, tier: t.tier, slot: t.slot }] : [];
});
const honTeText = (n: number) => honTeParts(n).map((x) => `${x.n.toLocaleString("vi-VN")} ${x.unit}`).join(" ") || "0";
const equipBtn = (box: HTMLElement, it: BagItem, tier: number, note: string, on: boolean, click: () => void) => {
  const b = document.createElement("button"); b.type = "button"; b.className = "aopt eopt" + (on ? " on" : ""); b.style.setProperty("--c", EQUIP_TIERS[tier]?.col ?? "#9db3a2");
  b.innerHTML = `${equipIcon(it.stats)}<b></b><i></i><span></span>`; b.querySelector("b")!.textContent = (on ? "√ " : "") + itemName(it); b.querySelector("i")!.textContent = note;
  b.addEventListener("click", () => { b.blur(); click(); }); box.appendChild(b);
};
const synFailText = (tier: number) => {
  const s = equipSynthStep(tier); if (!s) return "";
  return s.all ? `mất cả 3 món${s.refund ? `, hoàn ${Math.floor(s.essence * s.refund)} Tinh Hoa Đường Môn` : ""}` : `mất 2 món hiến tế${s.mainLoss ? `, món chính tụt ${s.mainLoss} cấp cường hóa` : ""}`;
};
/** Tin "equipsynd" (E4): xong một lần hợp thành; bỏ chọn, báo kết quả. */
export function equipSynDone(m: EquipSynDone) {
  synMain = null; synSac = []; synConfirm = false; setFx(m.ok ? "ok" : m.enhance === null ? "break" : "fail", "forgesynth");
  toast("info", m.ok ? `Hợp thành thành công: ${EQUIP_TIERS[m.from + 1].name}` : m.enhance === null ? "Hợp thành thất bại: mất cả 3 món" : "Hợp thành thất bại");
  if (npcDefOpen && npcPage === "forgesynth") renderNpc();
}
/** Tin "equipsalvd" (E4): xong phân giải; bỏ chọn, báo tổng nhận được. */
export function equipSalvDone(m: EquipSalvDone) {
  salvSel.clear(); if (!m.auto) setFx("ok", "forgesalv");
  toast("info", `${m.auto ? "Tự phân giải" : "Phân giải"} ${m.n} trang bị`, `+${honTeText(m.coin)}${m.items.map((x) => `, ${x.qty} ${itemDef(x.code)?.name ?? x.code}`).join("")}`);
  if (npcDefOpen && npcPage === "forgesalv") renderNpc();
}
/**
 * Lò rèn, trang hợp thành 3 → 1 (E4): chọn món chính rồi 2 món hiến tế cùng bậc, cùng ô (không khoá, không mặc). Tỉ lệ, phí và hậu quả thất bại lấy từ
 * EQUIP_SYNTH (chỉ hiển thị; server tính và kiểm lại). Nút chuyển đỏ, bấm hai lần vì thất bại luôn mất đồ.
 */
export function renderForgeSynth(el: HTMLElement, bag: BagMsg, act: NpcActions) {
  const box = document.createElement("div"); box.className = "forge"; el.appendChild(box); takeFx(box, "forgesynth");
  const h = document.createElement("b"); h.className = "shead"; h.textContent = "Hợp thành trang bị (3 → 1)"; box.appendChild(h);
  const all = looseEquip(bag), main = synMain ? all.find((x) => x.it.id === synMain) : undefined;
  if (synMain && !main) { synMain = null; synSac = []; }
  const same = (x: { tier: number; slot: string }, y: { tier: number; slot: string }) => x.tier === y.tier && x.slot === y.slot;
  if (!main) {
    const pool = all.filter((x) => equipSynthStep(x.tier) && all.filter((y) => y.it.id !== x.it.id && same(x, y)).length >= 2);
    const info = document.createElement("small"); box.appendChild(info);
    info.textContent = pool.length ? "Chọn MÓN CHÍNH (cấp cường hóa được giữ một nửa). Cần thêm 2 món cùng bậc, cùng ô, không khoá, không đang mặc làm hiến tế."
      : "Chưa đủ 3 trang bị cùng bậc, cùng ô (không khoá, không đang mặc) để hợp thành.";
    for (const x of pool) equipBtn(box, x.it, x.tier, `${EQUIP_TIERS[x.tier].name} · ${EQUIP_SLOTS.find((s) => s.id === x.slot)?.name ?? ""}`, false, () => { synMain = x.it.id; synSac = []; synConfirm = false; renderNpc(); });
    return;
  }
  synSac = synSac.filter((id) => all.some((x) => x.it.id === id && x.it.id !== main.it.id && same(x, main)));
  const step = equipSynthStep(main.tier)!, ess = bag.items.filter((i) => i.code === EQUIP_ESSENCE).reduce((n, i) => n + i.qty, 0);
  const rows: [string, string][] = [["Món chính", itemName(main.it)], ["Hợp thành", `${EQUIP_TIERS[main.tier].name} → ${EQUIP_TIERS[main.tier + 1].name}`],
    ["Tỉ lệ thành công", `${Math.round(step.p * 100)}%`], ["Cấp cường hóa mới", `+${Math.floor(main.it.enhance * EQUIP_SYNTH_KEEP)} (giữ ${Math.round(EQUIP_SYNTH_KEEP * 100)}%)`],
    ["Phí", honTeText(step.fee)], ...(step.essence ? [["Tinh Hoa Đường Môn", `${step.essence} (có ${ess})`] as [string, string]] : []),
    ["Nếu thất bại", synFailText(main.tier)], ["Phí và Tinh Hoa mất cả khi thất bại", ""]];
  addRows(box, rows);
  const sh = document.createElement("small"); sh.textContent = `Chọn 2 món hiến tế (${synSac.length}/2):`; box.appendChild(sh);
  for (const x of all.filter((y) => y.it.id !== main.it.id && same(y, main)))
    equipBtn(box, x.it, x.tier, "hiến tế", synSac.includes(x.it.id), () => { synSac = synSac.includes(x.it.id) ? synSac.filter((i) => i !== x.it.id) : [...synSac, x.it.id].slice(-2); synConfirm = false; renderNpc(); });
  const poor = bag.honTe < step.fee || ess < step.essence, go = document.createElement("button"); go.type = "button"; go.className = "aopt danger"; if (!isUi2()) go.style.background = "#a82a2a";
  go.disabled = poor || synSac.length !== 2 || act.combat();
  go.textContent = poor ? "Không đủ Hồn Tệ hoặc Tinh Hoa" : act.combat() ? "Đang giao chiến" : synSac.length !== 2 ? "Chọn đủ 2 món hiến tế" : synConfirm ? "Bấm lần nữa: hợp thành" : "Hợp thành (có thể mất đồ)";
  go.addEventListener("click", () => { go.blur(); if (!synConfirm) { synConfirm = true; renderNpc(); return; } synConfirm = false; act.equipSynth(main.it.id, synSac); });
  box.appendChild(go);
  lockWhy(go, poor ? "Không đủ Hồn Tệ hoặc Tinh Hoa." : synSac.length !== 2 ? "Chọn đủ 2 món hiến tế." : act.combat() ? "Đang giao chiến: rời xa hồn thú vài giây rồi làm tiếp." : null);
  const back = document.createElement("button"); back.type = "button"; back.className = "aopt drop"; back.textContent = "Chọn món chính khác";
  back.addEventListener("click", () => { synMain = null; synSac = []; synConfirm = false; renderNpc(); }); box.appendChild(back);
}
/**
 * Lò rèn, trang phân giải trang bị (E4): chọn nhiều món (không khoá, không mặc, tối đa EQUIP_SALVAGE_MAX), nút chọn nhanh theo bậc. Hồn Tệ theo bảng
 * EQUIP_SALVAGE (hiển thị số tối thiểu, chưa tính nguyên liệu ngẫu nhiên); không cho kinh nghiệm. Bấm hai lần; server kiểm lại và ghi một transaction.
 */
export function renderForgeSalv(el: HTMLElement, bag: BagMsg, act: NpcActions) {
  const box = document.createElement("div"); box.className = "forge"; el.appendChild(box); takeFx(box, "forgesalv");
  const h = document.createElement("b"); h.className = "shead"; h.textContent = "Phân giải trang bị"; box.appendChild(h);
  const all = looseEquip(bag).sort((a, b) => a.tier - b.tier || a.it.enhance - b.it.enhance);
  for (const id of [...salvSel]) if (!all.some((x) => x.it.id === id)) salvSel.delete(id);
  if (!all.length) { const p = document.createElement("small"); p.textContent = "Không có trang bị nào để phân giải (món khoá và món đang mặc không phân giải được)."; box.appendChild(p); return; }
  const quick = document.createElement("div"); quick.className = "erow";
  for (let t = 0; t < EQUIP_MAX_TIER; t++) {
    if (!all.some((x) => x.tier === t)) continue;
    const q = document.createElement("button"); q.type = "button"; q.className = "aopt"; q.textContent = `Chọn mọi ${EQUIP_TIERS[t].name}`;
    q.addEventListener("click", () => { q.blur(); salvSel.clear(); for (const x of all.filter((y) => y.tier === t).slice(0, EQUIP_SALVAGE_MAX)) salvSel.add(x.it.id); renderNpc(); });
    quick.appendChild(q);
  }
  const clr = document.createElement("button"); clr.type = "button"; clr.className = "aopt drop"; clr.textContent = "Bỏ chọn";
  clr.addEventListener("click", () => { clr.blur(); salvSel.clear(); renderNpc(); }); quick.appendChild(clr); box.appendChild(quick);
  for (const x of all) equipBtn(box, x.it, x.tier, `${EQUIP_TIERS[x.tier].name} · +${x.it.enhance}`, salvSel.has(x.it.id), () => {
    if (salvSel.has(x.it.id)) salvSel.delete(x.it.id); else if (salvSel.size < EQUIP_SALVAGE_MAX) salvSel.add(x.it.id); renderNpc();
  });
  const picked = all.filter((x) => salvSel.has(x.it.id)), coin = picked.reduce((n, x) => n + Math.round(EQUIP_SALVAGE[x.tier].coin * (1 + x.it.enhance / 5)), 0);
  const info = document.createElement("small");
  info.textContent = picked.length ? `Đã chọn ${picked.length}/${EQUIP_SALVAGE_MAX} món: nhận ${honTeText(coin)} cùng đá / Tinh Hoa / Thần Hồn theo bậc (ngẫu nhiên). Không cho kinh nghiệm; túi phải còn chỗ cho nguyên liệu.`
    : `Chọn trang bị cần phân giải (tối đa ${EQUIP_SALVAGE_MAX} món mỗi lần).`;
  box.appendChild(info);
  const go = document.createElement("button"); go.type = "button"; go.className = "aopt danger"; if (!isUi2()) go.style.background = "#a82a2a";
  go.disabled = !picked.length || act.combat();
  go.textContent = act.combat() ? "Đang giao chiến" : !picked.length ? "Chưa chọn món nào" : `Phân giải ${picked.length} món`;
  go.addEventListener("click", () => { go.blur(); confirmDialog({ title: "Phân giải?", body: `${picked.length} món sẽ bị phân giải, nhận ${honTeText(coin)} cùng vật liệu theo bậc; không lấy lại được.`, confirm: `Phân giải ${picked.length} món`, danger: true }, () => act.equipSalvage(picked.map((x) => x.it.id))); });
  box.appendChild(go);
  lockWhy(go, !picked.length ? "Chưa chọn món nào để phân giải." : act.combat() ? "Đang giao chiến: rời xa hồn thú vài giây rồi làm tiếp." : null);
}

let setPick: string | null = null; // hồn hạch đang chọn ở trang "Đổi bộ hồn hạch" của Thợ rèn
/**
 * Lò rèn, trang đổi bộ hồn hạch (#283): chọn một hồn hạch rồi một bộ đích khác bộ hiện tại (message `coreset`); phí theo sao
 * (coreResetFee), server kiểm tra lại khoảng cách, giao chiến và Hồn Tệ.
 */
export function renderForgeSets(el: HTMLElement, bag: BagMsg, act: NpcActions) {
  const box = document.createElement("div"); box.className = "forge"; el.appendChild(box);
  const h = document.createElement("b"); h.className = "shead"; h.textContent = "Đổi bộ hồn hạch"; box.appendChild(h);
  const target = setPick ? bag.items.find((i) => i.id === setPick) : undefined, tc = target && coreOf(target);
  if (!target || !tc) {
    setPick = null;
    const cores = bag.items.filter((i) => coreOf(i));
    cores.sort((a, b) => Number(b.vohon !== null) - Number(a.vohon !== null) || (b.stars ?? 1) - (a.stars ?? 1) || b.enhance - a.enhance);
    if (!cores.length) { const p = document.createElement("small"); p.textContent = "Chưa có hồn hạch nào để đổi bộ."; box.appendChild(p); }
    for (const it of cores) {
      const b = document.createElement("button"); b.type = "button"; b.className = "aopt eopt"; b.style.setProperty("--c", itemColor(it));
      b.innerHTML = `<b></b><i></i><span></span>`;
      b.querySelector("b")!.textContent = itemName(it);
      b.querySelector("i")!.textContent = it.vohon !== null ? "đang gắn" : "trong túi";
      b.querySelector("span")!.textContent = `Phí đổi bộ ${honTeParts(coreResetFee(it.stars ?? 1)).map((x) => `${x.n.toLocaleString("vi-VN")} ${x.unit}`).join(" ")}`;
      b.addEventListener("click", () => { b.blur(); setPick = it.id; renderNpc(); });
      box.appendChild(b);
    }
    return;
  }
  const fee = coreResetFee(target.stars ?? 1), poor = bag.honTe < fee;
  const info = document.createElement("small");
  info.textContent = `${itemName(target)} hiện thuộc ${coreSet(tc.set)?.name ?? "Bộ lạ"}. Giữ nguyên sao, cấp, điểm, chỉ số và dòng phụ; phí ${honTeParts(fee).map((x) => `${x.n.toLocaleString("vi-VN")} ${x.unit}`).join(" ")} mỗi lần đổi.`
    + (poor ? " Không đủ Hồn Tệ." : "") + (act.combat() ? " Đang giao chiến: rời xa hồn thú vài giây rồi mới đổi được." : "");
  box.appendChild(info);
  for (const s of CORE_SETS) {
    const b = document.createElement("button"); b.type = "button"; b.className = "aopt eopt"; b.style.setProperty("--c", s.col);
    b.innerHTML = `<b></b><i></i><span></span>`;
    b.querySelector("b")!.textContent = s.name;
    b.querySelector("i")!.textContent = s.id === tc.set ? "bộ hiện tại" : "";
    b.querySelector("span")!.textContent = `2 món: ${s.set2} · 4 món: ${s.set4}`;
    b.disabled = s.id === tc.set || poor;
    b.addEventListener("click", () => { b.blur(); act.coreSet(target.id, s.id); });
    box.appendChild(b);
  }
  const back = document.createElement("button"); back.type = "button"; back.className = "aopt drop"; back.textContent = "Chọn hồn hạch khác";
  back.addEventListener("click", () => { setPick = null; renderNpc(); }); box.appendChild(back);
}
