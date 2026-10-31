// Túi đồ, hồn tệ, thẻ thao tác, so sánh, tự bán của HUD (tách nguyên văn từ hud.ts, Part of #885 bước 0a); hud.ts re-export để nơi gọi giữ nguyên.
import { clearBadge } from "./badges.ts";
import { closeNpc, toggleFriends, toggleReso, toggleWorld } from "./hud.ts";
import { coreEnhText, coreLines, corePicker, enhClose, setEnhCoin, enhOpen, enhTarget, enhText, enhancePicker, openBones, openCores, toggleRoster } from "./hudRoster.ts";
import { TIERS, tierOfYears, ITEM_KINDS, DAN_CD, itemDef, honTeParts, RING_ITEM, tierBand, formatYears, MAX_RINGS, MAX_LEVEL, BONE_ITEM, BONE_SLOTS, BONE_STAT_NAMES, boneSlotIndex, boneStats, boneName, parseBone, BAG_SLOTS, BAG_PAGE, type BoneStat, type CoreStat, CORE_ITEM, CORE_SETS, coreSetIndex, parseCore, coreName, coreMainValue, coreStatText, CORE_SLOTS, CORE_STATS, coreSlotOf, boneSkillOf, BONE_MAX_ENHANCE, BONE_ENHANCE_MILESTONES, parseBoneSubs, sellPrice, formatHonTe, CORE_MAX_ENHANCE, CORE_MAX_SUBS, herbDef, HERB_MAX, HERB_PCT, RES_STAT_NAMES, AUTO_SELL_FREE, AUTO_SELL_BUYBACK, AUTO_SELL_GUARD, SELL_DEFAULTS, autoSellable, MAX_YEARS, MAX_CORE_STARS, type SellSettings } from "../../shared/data.ts";
import { boneSvg } from "./boneIcons.ts";
import { coreSvg } from "./coreIcons.ts";
import { artImg, shardImg, tintedUrl } from "./uiArt.ts";
import { setPanel } from "./charPanel.ts";
import { setCoinChip } from "./statChips.ts";
import { confirmDialog } from "./confirmDialog.ts";
import { panelChanged, swapButton } from "./dualWindow.ts";
import { setTip, type TipLine } from "./tooltip.ts";
import { BAG_GROUPS, BAG_SORTS, type BagSort, inGroup, rarityOf, noteSeen, isNew, markSeen, sortView, moveItem, clearOrder, wornFor, compareLines, compareRows } from "./bag.ts";
import { type CardActionId, type DollView, type DragSession, type ServerCommand, type SlotRef, acceptsItem, cardActions, currentFor, mountCommand, quickCommand, smartTarget, unmountCommand } from "./charBagContract.ts";
import { addZone, dragSource } from "./dragDrop.ts";
import { cardFor, compareFor, hideCard, hideCompare, showCard, showCompare } from "./actionCard.ts";
import { EQUIP_ITEM, equipFrameKey, equipIconChain, EQUIP_SLOTS, EQUIP_TIERS, EQUIP_MAX_TIER, equipName, equipTemplate, equipSlotDef, equipStats, equipAutoSalvageable, parseEquip } from "../../shared/data.ts";
import type { GearMsg } from "./net.ts";
import type { BagMsg, BagItem } from "./net.ts";
import { ringColor, boneSkillText } from "./hudBar.ts";
import { stateBox, searchField, matchQuery } from "./uiParts.ts";
import { itemInfoLines, shiftPart } from "./itemTip.ts";
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;
document.getElementById("bag")?.classList.add("f2-muc-lon");

// ---------- Túi đồ và Hồn Tệ (mục 5.7, bước 3.1): chỉ chính chủ nhận tin "bag" ----------
export function toggleBag(open = $("#bag").hidden) {
  $("#bag").hidden = !open;
  if (open) { toggleRoster(false); closeNpc(); toggleReso(false); toggleWorld(false); toggleFriends(false); } // Túi và Nhân vật mở cạnh nhau (NV1 #455)
  if (open) clearBadge("bag"); // đã xem túi: tắt chấm "món mới" (kho badges, đợt 4b)
  panelChanged("bag", open);
}

export let bagSel: string | null = null;  // id ô đang chọn để xem chi tiết / dùng
let bagCdEnd = 0;                  // performance.now() lúc hết hồi chiêu chung đan (server gửi số giây còn lại)

/** Hồn Tệ dạng HTML: mỗi phần kim / ngân / đồng một màu. */
export function honTeHtml(dong: number) {
  return honTeParts(dong).map((p) => `<span class="ht ${p.unit === "kim" ? "kim" : p.unit === "ngân" ? "ngan" : "dong"}">${p.n.toLocaleString("vi-VN")} ${p.unit}</span>`).join(" ");
}

/** Hồn cốt trong túi (bước 4.1): số năm, loài và vị trí; dữ liệu hỏng thì null (hiện như vật phẩm thường). */
export const boneOf = (it: BagItem) => (it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null);
/** Hồn hạch trong túi (bước 5.1): bộ, chỉ số chính, dòng phụ; dữ liệu hỏng thì null (hiện như vật phẩm thường). */
export const coreOf = (it: BagItem) => (it.code === CORE_ITEM ? parseCore(it.stats) : null);
/** Bộ hồn hạch theo mã (bộ lạ: undefined). */
export const coreSet = (set: string) => CORE_SETS[coreSetIndex(set)];
/** Tên hiển thị một ô (mã không còn trong ITEMS: "Vật phẩm lạ"); hồn hoàn kèm số năm; hồn cốt "Loài – Vị trí, N năm"; hồn hạch "Hồn hạch Bộ N★". */
export function itemName(it: BagItem) {
  const bone = boneOf(it);
  if (bone) return boneName(bone.beast, bone.slot, it.years!, it.enhance);
  const core = coreOf(it);
  if (core) return coreName(core.set, it.stars ?? 1, it.enhance);
  const eq = it.code === EQUIP_ITEM ? parseEquip(it.stats) : null;
  if (eq) return equipName(eq.tpl, it.enhance);
  return (itemDef(it.code)?.name ?? "Vật phẩm lạ") + (it.years !== null ? ` ${formatYears(it.years)}` : "");
}
/** Hồn hoàn trong túi: có số năm thì màu theo số năm (bảng 5.2). */
const isRing = (it: BagItem): it is BagItem & { years: number } => it.code === RING_ITEM && it.years !== null;
/** Đồ có màu theo số năm: hồn hoàn và hồn cốt. */
const hasYears = (it: BagItem): it is BagItem & { years: number } => (it.code === RING_ITEM || it.code === BONE_ITEM) && it.years !== null;
/** "Công +30", "Sinh lực +316": chỉ số chính của hồn cốt (boneStats, kèm cường hóa từ 4.4). */
export const boneStatText = (slot: string, years: number, enhance = 0) =>
  Object.entries(boneStats(slot, years, enhance)).map(([k, v]) => `${BONE_STAT_NAMES[k as BoneStat]} +${v}`).join(", ");
/** Chỉ số chính kèm các dòng phụ đã tung của một hồn cốt (#187, `stats.subs` do server tung): "Công +30, Chí mạng +2,1%". */
export const boneFullText = (it: BagItem & { years: number }) => {
  const b = boneOf(it); if (!b) return "";
  return [boneStatText(b.slot, it.years, it.enhance), ...parseBoneSubs(it.stats).map(([k, v]) => coreStatText(k, v))].join(", ");
};
/** Tên một mã dòng phụ trong danh sách có thể tung: dòng % ghi thêm "%" ("Công %"), để phân biệt với dòng phẳng cùng tên. */
export const subName = (k: CoreStat) => `${CORE_STATS[k].name}${CORE_STATS[k].pct && k.endsWith("_pct") ? " %" : ""}`;
/** Số năm gọn để ghi ở góc ô: "437", "1.760", "2,5v" (vạn năm). */
export const yearsShort = (y: number) => (y < 10000 ? y.toLocaleString("vi-VN") : `${(y / 10000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}v`);
/** Màu một ô: hồn hoàn, hồn cốt theo số năm; hồn hạch theo bộ; vật phẩm khác theo ITEMS. */
export const itemColor = (it: BagItem) => {
  const core = coreOf(it), eq = it.code === EQUIP_ITEM ? parseEquip(it.stats) : null;
  if (eq) return EQUIP_TIERS[equipTemplate(eq.tpl)!.tier].col;
  return hasYears(it) ? ringColor(tierOfYears(it.years)) : (core && coreSet(core.set)?.col) || (itemDef(it.code)?.col ?? "#9db3a2");
};
/**
 * Biểu tượng ảnh 32×32 của một món (10.8, key item_*): hồn cốt là bản xám tô màu niên hạn theo vị trí (item_hon_cot_<vị trí>); món khác
 * theo mã trong ITEMS rồi theo nhóm ITEM_KINDS. Chưa có ảnh thì "" (nơi gọi vẽ biểu tượng CSS / SVG cũ).
 */
export function itemArt(it: Pick<BagItem, "code" | "years" | "stats">) {
  if (it.code === EQUIP_ITEM) { // trang bị hồn sư (E6): ảnh mẫu → hình ô → ảnh chung (equipIconChain)
    for (const k of equipIconChain(parseEquip(it.stats)?.tpl)) { const img = artImg(k, "ico art"); if (img) return img; }
    return "";
  }
  const bone = it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null;
  if (bone) { const u = tintedUrl(`item_hon_cot_${bone.slot}`, ringColor(tierOfYears(it.years!))); return u ? `<img class="ico art" src="${u}" alt="" draggable="false">` : ""; }
  const def = itemDef(it.code), kind = def?.kind;
  // Hồn hoàn tô theo màu niên hạn; mảnh võ hồn, rương (màu hào quang thú vương / boss), tiên thảo theo `col` của món (ảnh chung
  // của nhóm, uiArt.tintedUrl lấy độ sáng rồi nhân màu; rương và tiên thảo là bản xám, #170).
  if (kind === "manh_vo_hon" && def?.vohon) { const s = shardImg(def.vohon, def.col); if (s) return s; }
  const tint = it.code === RING_ITEM && it.years !== null ? ringColor(tierOfYears(it.years))
    : kind === "manh_vo_hon" || kind === "ruong" || kind === "tien_thao" ? def!.col : null;
  if (tint) { const u = tintedUrl(`item_${kind}`, tint); if (u) return `<img class="ico art" src="${u}" alt="" draggable="false">`; }
  if (it.code === CORE_ITEM) { const c = coreOf(it as BagItem); if (c) return coreIcon(c.set); }
  return artImg(`item_${it.code}`, "ico art") || (kind ? artImg(`item_${kind}`, "ico art") : "");
}
/** Biểu tượng hồn cốt ở vị trí `slot` tô màu `col` (ảnh xám item_hon_cot_*), không có ảnh thì SVG điểm ảnh cũ (#695: mọi chỗ dùng chung một kiểu). */
export const boneIcon = (slot: string, col: string) => {
  const u = tintedUrl(`item_hon_cot_${slot}`, col);
  return u ? `<img class="ico art bone" src="${u}" alt="" draggable="false">` : boneSvg(slot);
};

/** Ô hồn cốt trống: cùng ảnh, tô xám (CSS `.bcell.empty` làm mờ). */
export const boneEmptyIcon = (slot: string) => boneIcon(slot, "#8c8c8c");
/** Biểu tượng hồn hạch của bộ `set` (item_hon_hach_<bộ>, màu bộ vẽ sẵn), bộ lạ / trống thì ảnh chung item_hon_hach, chưa có ảnh thì SVG cũ (#696). */
export const coreIcon = (set: string) =>
  artImg(`item_hon_hach_${set}`, "ico art core") || artImg("item_hon_hach", "ico art core") || coreSvg(set);

/**
 * Một võ hồn trong bộ sưu tập khi chọn nơi hấp thụ hồn hoàn (GameScene tính bằng absorbChance / absorbSecs của shared/data.ts,
 * chỉ để hiển thị; server quyết định). `reason` khác rỗng: không chọn được (chưa bình cảnh, đủ 10 vòng, vượt quá 100%).
 */
export interface AbsorbOption { rowId: number; name: string; col: string; level: number; slot: number; limit: number; over: number; fail: number | null; secs: number; active: boolean; reason: string; }
/** Một võ hồn sở hữu trong bảng chọn dùng tiên thảo (BĐ6b): số cây loại này đã dùng `n` (tối đa HERB_MAX). */
export interface HerbOption { rowId: number; name: string; col: string; level: number; active: boolean; n: number; }
/**
 * Thao tác trên túi đồ: client chỉ gửi id ô (và võ hồn được chọn để hấp thụ), server kiểm tra rồi gửi lại túi mới.
 * `absorbOptions`: các võ hồn và rủi ro khi hấp thụ hồn hoàn `years` năm; `combat`: đang giao chiến (tin "squad");
 * `refresh`: xin lại danh sách võ hồn (cấp võ hồn không ra trận có thể đã đổi).
 */
export interface BagActions {
  use(id: string): void; absorb(id: string, vohonId: number): void; discard(id: string): void; open(id: string): void;
  sort(): void; // sắp xếp + gộp chồng cả túi (#215), server làm
  lock(id: string): void; autoSell(cfg: SellSettings): void; // khoá / mở khoá ô, bộ lọc tự bán (#216)
  absorbOptions(years: number): AbsorbOption[]; combat(): boolean; refresh(): void;
  herb(id: string, vohonId: number): void; herbOptions(code: string): HerbOption[]; // tiên thảo (BĐ6b)
  active(): number | null; equipBone(id: string, slot?: string): void; equipCore(id: string, slot?: number): void; // UI-1: võ hồn ra trận, gắn nhanh (kéo thả / nút) cho võ hồn đó
  enhance(targetId: string, materialIds: string[]): void; enhanceCore(targetId: string, materialIds: string[]): void;
  equipGear(id: string): void; unequipGear(slot: number): void; gear(): GearMsg | null; // trang bị hồn sư (5.15, E1): giao diện tối thiểu, bản đẹp ở E5
  /** NV3 (#457): võ hồn đang xem trên búp bê (nhận hồn cốt / hồn hạch khi kéo, bấm đúp), null = chưa có; gửi một lệnh gắn / tháo có sẵn (ServerCommand). */
  viewRow(): number | null; send(cmd: ServerCommand): void;
}
let lastTap = { id: "", t: 0 };       // lần bấm ô túi gần nhất (nhận bấm đúp: DBL_MS)
const DBL_MS = 350;
let bagConfirm: string | null = null; // id ô vừa bấm "Bỏ" lần đầu: bấm lần nữa mới bỏ hẳn
let pickRing: string | null = null;   // id hồn hoàn đang mở bảng chọn võ hồn để hấp thụ
let pickVh: number | null = null;     // võ hồn đang chọn trong bảng đó (chờ xác nhận)
let pickHerb: string | null = null;   // id ô tiên thảo đang mở bảng chọn võ hồn (BĐ6b); võ hồn đang chọn dùng chung pickVh
const pct = (x: number) => `${Math.round(x * 100)}%`;
const secTxt = (x: number) => `${String(x).replace(".", ",")} giây`;

/**
 * Nút "Dùng" riêng của loại món trên thẻ thao tác (NV3 #457), cùng việc với các nút ở khung chi tiết: đan, Hồi Thành Phù, Ủy Thác Lệnh, hấp thụ hồn
 * hoàn, mở rương, tiên thảo. `quick` (bấm đúp) chỉ có với đan hồi sinh lực / hồn lực: việc nặng hơn (hấp thụ, rương, phù) bắt bấm thẻ cho chắc.
 */
function useAction(it: BagItem, act: BagActions, again: () => void): { label: string; run(): void; quick?(): void } | null {
  const def = itemDef(it.code);
  if (def && (def.hp || def.mp)) { const run = () => act.use(it.id); return { label: "Dùng", run, quick: run }; }
  if (def?.recall) return { label: "Dùng", run: () => { act.use(it.id); toggleBag(false); } };
  if (def?.auto) return { label: "Dùng", run: () => act.use(it.id) };
  if (isRing(it)) return { label: "Hấp thụ…", run: () => { bagSel = it.id; pickRing = it.id; pickVh = null; act.refresh(); again(); } };
  if (def?.kind === "ruong") return { label: "Mở rương", run: () => act.open(it.id) };
  if (def?.kind === "tien_thao") return { label: "Dùng cho…", run: () => { bagSel = it.id; pickHerb = it.id; pickVh = null; act.refresh(); again(); } };
  return null;
}

/**
 * Bảng chọn võ hồn để dùng tiên thảo `it` (BĐ6b, mục 5.7): mỗi võ hồn sở hữu một dòng ghi số cây loại này đã dùng; đủ HERB_MAX thì
 * không chọn được. Chọn một dòng rồi bấm xác nhận (tiên thảo mất khi dùng, chỉ số tăng vĩnh viễn); server kiểm tra lại.
 */
function herbPicker(it: BagItem, act: BagActions, again: () => void) {
  const box = document.createElement("div"); box.className = "apick";
  const h = herbDef(it.code), opts = act.herbOptions(it.code).sort((a, b) => Number(a.n >= HERB_MAX) - Number(b.n >= HERB_MAX) || Number(b.active) - Number(a.active));
  if (pickVh !== null && !opts.some((o) => o.rowId === pickVh && o.n < HERB_MAX)) pickVh = null;
  if (pickVh === null) pickVh = opts.find((o) => o.n < HERB_MAX)?.rowId ?? null;
  const head = document.createElement("small");
  head.textContent = `Chọn võ hồn dùng ${h?.name ?? "tiên thảo"} (+${HERB_PCT}% ${h ? RES_STAT_NAMES[h.stat].toLowerCase() : "chỉ số"} vĩnh viễn, tối đa ${HERB_MAX} cây mỗi võ hồn):`;
  box.appendChild(head);
  for (const o of opts) {
    const b = document.createElement("button"); b.className = "aopt" + (o.rowId === pickVh ? " sel" : "");
    b.disabled = o.n >= HERB_MAX;
    b.innerHTML = `<b style="color:${o.col}"></b><span>Cấp ${o.level}${o.active ? " · đang ra trận" : ""}</span><i>${o.n >= HERB_MAX ? "đã đủ" : "đã dùng"} ${o.n}/${HERB_MAX} cây</i>`;
    b.querySelector("b")!.textContent = o.name;
    b.addEventListener("click", () => { b.blur(); pickVh = o.rowId; again(); });
    box.appendChild(b);
  }
  const o = opts.find((x) => x.rowId === pickVh && x.n < HERB_MAX);
  const row = document.createElement("div"); row.className = "brow";
  if (o && h) {
    const ok = document.createElement("button"); ok.className = "buse absorb"; ok.textContent = `Dùng cho ${o.name}`;
    ok.addEventListener("click", () => { ok.blur(); act.herb(it.id, o.rowId); if (it.qty <= 1) { pickHerb = null; pickVh = null; } });
    row.appendChild(ok);
  }
  const no = document.createElement("button"); no.className = "buse drop"; no.textContent = "Thôi";
  no.addEventListener("click", () => { no.blur(); pickHerb = null; pickVh = null; again(); });
  row.appendChild(no);
  box.appendChild(row);
  return box;
}

/**
 * Bảng chọn võ hồn để hấp thụ hồn hoàn `ring` (mục 5.2): mỗi võ hồn một dòng ghi vòng kế tiếp, giới hạn, % vượt và tỉ lệ thất bại;
 * chọn một dòng thì hiện ô xác nhận, cảnh báo đỏ khi có rủi ro mất hồn hoàn.
 */
function absorbPicker(ring: BagItem & { years: number }, act: BagActions, again: () => void) {
  const box = document.createElement("div"); box.className = "apick";
  const opts = act.absorbOptions(ring.years).sort((a, b) => Number(!!a.reason) - Number(!!b.reason) || Number(b.active) - Number(a.active));
  if (pickVh !== null && !opts.some((o) => o.rowId === pickVh && !o.reason)) pickVh = null;
  if (pickVh === null) pickVh = opts.find((o) => !o.reason)?.rowId ?? null;
  const head = document.createElement("small");
  head.textContent = `Chọn võ hồn hấp thụ hồn hoàn ${formatYears(ring.years)} (chỉ võ hồn đang ở bình cảnh):`;
  box.appendChild(head);
  for (const o of opts) {
    const b = document.createElement("button"); b.className = "aopt" + (o.rowId === pickVh ? " sel" : "") + (o.fail ? " risk" : "");
    b.disabled = !!o.reason;
    const st = o.reason || (o.fail ? `vượt ${o.over}% · <em>${pct(o.fail)} thất bại</em>` : "trong giới hạn · chắc chắn thành công");
    b.innerHTML = `<b style="color:${o.col}"></b><span>Cấp ${o.level}${o.active ? " · đang ra trận" : ""}${o.slot <= MAX_RINGS ? ` · vòng ${o.slot}: giới hạn ${formatYears(o.limit)}` : ""}</span><i>${st}</i>`;
    b.querySelector("b")!.textContent = o.name;
    b.addEventListener("click", () => { b.blur(); pickVh = o.rowId; again(); });
    box.appendChild(b);
  }
  if (!opts.some((o) => !o.reason)) {
    const n = document.createElement("p"); n.textContent = "Chưa có võ hồn nào ở bình cảnh hấp thụ được hồn hoàn này. Săn hồn thú để lên cấp 10, 20, 30…";
    box.appendChild(n);
  }
  const o = opts.find((x) => x.rowId === pickVh && !x.reason);
  const row = document.createElement("div"); row.className = "brow";
  if (o) {
    const c = document.createElement("div"); c.className = "aconf" + (o.fail ? " risk" : "");
    const w = o.fail
      ? `⚠ Vượt giới hạn vòng ${o.slot} (${formatYears(o.limit)}) ${o.over}%: ${pct(o.fail)} thất bại. Thất bại thì MẤT hồn hoàn này, ngoài ra không bị phạt gì.`
      : `Trong giới hạn vòng ${o.slot} (tối đa ${formatYears(o.limit)}): chắc chắn thành công, ${o.name} lên cấp ${Math.min(MAX_LEVEL, o.level + 1)}.`;
    c.innerHTML = `<b></b><small></small>`;
    c.querySelector("b")!.textContent = w;
    c.querySelector("small")!.textContent = `Hấp thụ mất ${secTxt(o.secs)}: đứng yên, không giao chiến; di chuyển hoặc bị đánh thì hủy, không mất gì.`
      + (act.combat() ? " Đang giao chiến: rời xa hồn thú vài giây rồi hấp thụ." : "");
    box.appendChild(c);
    const ok = document.createElement("button"); ok.className = "buse absorb" + (o.fail ? " risk" : "");
    ok.textContent = o.fail ? `Chấp nhận ${pct(o.fail)} rủi ro, hấp thụ` : "Xác nhận hấp thụ";
    ok.addEventListener("click", () => { ok.blur(); act.absorb(ring.id, o.rowId); pickRing = null; pickVh = null; toggleBag(false); });
    row.appendChild(ok);
  }
  const no = document.createElement("button"); no.className = "buse drop"; no.textContent = "Thôi";
  no.addEventListener("click", () => { no.blur(); pickRing = null; pickVh = null; again(); });
  row.appendChild(no);
  box.appendChild(row);
  requestAnimationFrame(() => row.scrollIntoView({ block: "nearest" })); // túi cao: cuộn tới nút xác nhận
  return box;
}

/**
 * Chế độ chọn món cho một ô của bảng Nhân vật (NV2 #456): Túi chuyển sang nhóm `group`, món hợp ô (`match`) sáng viền vàng, món khác mờ;
 * bấm món sáng thì gọi `pick` (bảng Nhân vật gửi lệnh gắn có sẵn, server quyết định), không mở chi tiết. `key` đổi thì Túi vẽ lại.
 */
export interface BagFocus { key: string; group: string; label: string; match(it: BagItem): boolean; pick(it: BagItem): void; cancel(): void; }
let bagFocus: BagFocus | null = null;
document.addEventListener("dual-layout", () => bagRefresh?.());
export let bagRefresh: (() => void) | null = null; // vẽ lại túi bằng tin "bag" gần nhất (null = chưa vẽ lần nào)
/** Đặt / bỏ chế độ chọn món. Chỉ vẽ lại Túi khi `key` đổi (bảng Nhân vật vẽ lại mỗi tin state nhưng ô chọn không đổi). */
export function setBagFocus(f: BagFocus | null) {
  const changed = (f?.key ?? null) !== (bagFocus?.key ?? null);
  bagFocus = f;
  if (!changed) return;
  if (f) { bagGroup = f.group; bagQuery = ""; bagPage = 0; bagSel = null; sellOpen = false; }
  bagRefresh?.();
}

/** Số ô túi của tài khoản theo tin "bag" gần nhất (từ 9.8 mở rộng được; trước tin đầu tiên là mức khởi đầu). */
export let bagCap = BAG_SLOTS;
export const setBagCap = (n: number) => { bagCap = n; };
export let bagGroup = "all";              // nhóm lọc đang chọn (UI-1, BAG_GROUPS)
let bagQuery = "", bagSearchFocus = false;  // ô tìm (UI v2, không dấu): chữ đang gõ; vẽ lại túi xong thì trả con trỏ về ô
let bagSortMode: BagSort = "tay";  // cách xếp thứ tự hiển thị (UI-1, chỉ phía client)
export let bagPage = 0; // trang túi đang xem (#215: mỗi trang BAG_PAGE ô)
/**
 * Bảng túi đồ: Hồn Tệ, các trang BAG_PAGE ô (#215; tab trang có vạch mức đầy, trang đầy viền đỏ), lưới ô của trang đang xem (số
 * lượng ở góc ô, đồ cùng loại đã được server gộp), nút "Sắp xếp" (server sắp và gộp chồng trên cả túi), chi tiết ô đang chọn và nút
 * "Dùng". Client chỉ gửi id ô muốn dùng; server kiểm tra và gửi lại túi mới.
 */
export function renderBag(bag: BagMsg, act: BagActions) {
  bagCap = bag.slots; setEnhCoin(bag.honTe); setCoinChip(bag.honTe);
  bagCdEnd = performance.now() + Math.max(0, bag.cd) * 1000;
  const el = $("#bag"); el.innerHTML = "";
  const items = bag.items.filter((i) => i.vohon === null);
  if (bagSel && !items.some((i) => i.id === bagSel)) bagSel = null;
  if (bagConfirm !== bagSel) bagConfirm = null;
  if (pickRing !== bagSel) { pickRing = null; pickVh = null; }
  const again = () => renderBag({ ...bag, cd: Math.max(0, (bagCdEnd - performance.now()) / 1000) }, act);
  bagRefresh = again;
  const head = document.createElement("div"); head.className = "rhead";
  head.innerHTML = `<b>Túi đồ (${items.length}/${bag.slots})</b><span><button class="x" aria-label="Đóng">×</button></span>`;
  head.querySelector("span")!.prepend(swapButton("bag", setPanel));
  head.querySelector(".x")!.addEventListener("click", () => toggleBag(false));
  el.appendChild(head);
  const coin = document.createElement("div"); coin.className = "coin";
  coin.innerHTML = `<i class="coinico"></i><span>Hồn Tệ:</span> ${honTeHtml(bag.honTe)}`;
  coin.title = `${bag.honTe.toLocaleString("vi-VN")} đồng (1 ngân = 100 đồng, 1 kim = 100 ngân)`;
  el.appendChild(coin);

  // UI-1: lọc theo nhóm và xếp thứ tự hiển thị chỉ ở client (nút "Sắp xếp" gộp / xếp thật vẫn do server). `view` = cả túi đã xếp, `shown` = sau lọc.
  noteSeen(items);
  // Đồ đang mặc chỉ dẫn sang Hồn sư, không chiếm dung lượng Túi.
  const gear = act.gear();
  const wornItems: BagItem[] = [...bag.items.filter((i) => i.vohon !== null), ...(gear?.items ?? []).map((g) => ({ ...g, kind: "trang_bi", qty: 1, years: null, stars: null, vohon: null }))];
  const wornIds = new Set(wornItems.map((i) => i.id));
  const group = document.body.classList.contains("dual-win") && !bagFocus ? "all" : bagGroup;
  const view = sortView([...items, ...wornItems], bagSortMode), filtered = group !== "all" || bagQuery !== "", active = act.active();
  let shown = view.filter((i) => inGroup(i, group) && matchQuery(itemName(i), bagQuery));
  // NV3 (#457): hàm thuần của charBagContract nhìn túi + trang bị đang mặc + võ hồn đang xem trên búp bê; dựng lúc cần (tin mới về thì vẽ lại cả bảng).
  const dollView = (): DollView => ({ rowId: act.viewRow(), bag: bag.items, gear: act.gear()?.items ?? [] });
  const useOf = (it: BagItem) => useAction(it, act, again);
  for (const k of [cardFor(), compareFor()]) if (k && !items.some((i) => i.id === k)) { hideCard(); hideCompare(); break; } // món của thẻ / bảng so sánh đã rời túi (bán, tháo…)
  const quick = (it: BagItem) => { const cmd = quickCommand(it, dollView()); if (cmd) act.send(cmd); else useOf(it)?.quick?.(); };
  const bagArea = (d: DragSession) => ("bagIndex" in d.from ? null : unmountCommand(d.item, d.from) ? { ok: true } : { ok: false, why: "Không tháo được món này." });
  const bagAreaDrop = (d: DragSession) => { const c = "bagIndex" in d.from ? null : unmountCommand(d.item, d.from); if (c) act.send(c); };
  const openCard = (id: string) => {
    const it = items.find((i) => i.id === id), anchor = document.querySelector<HTMLElement>(`#bag .bslot[data-id="${CSS.escape(id)}"]`);
    if (!it || !anchor) return;
    const v = dollView(), u = useOf(it), acts = cardActions(it, { view: v, useLabel: u?.label ?? null });
    showCard(anchor, itemName(it), itemColor(it), it.lock ? "Đang khóa" : "", acts, (a) => runCard(it, a, v, u), it.id);
  };
  const runCard = (it: BagItem, a: CardActionId, v: DollView, u: ReturnType<typeof useAction>) => {
    if (a === "mount") quick(it);
    else if (a === "use") u?.run();
    else if (a === "lock" || a === "unlock") act.lock(it.id);
    else if (a === "salvage") confirmDialog({ title: "Phân giải?", body: `${itemName(it)} sẽ bị phân giải thành vật liệu, không lấy lại được.`, confirm: "Phân giải", danger: true }, () => act.send({ msg: "equipsalvage", data: { ids: [it.id] } }));
    else if (a === "compare") {
      const w = currentFor(it, v), rows = compareRows(it, w?.cur ?? null); if (!rows) return;
      const who = (x: BagItem) => ({ name: itemName(x), color: itemColor(x) });
      showCompare({ itemId: it.id, cur: w?.cur ? who(w.cur) : null, neu: who(it), rows, mount: cardActions(it, { view: v }).some((c) => c.id === "mount") ? (it.code === EQUIP_ITEM ? "Mặc" : "Gắn") : null, onMount: () => quick(it) });
    }
  };
  addZone({ el, kind: "area", test: bagArea, drop: bagAreaDrop }); // kéo từ búp bê thả vào Túi = tháo
  if (bagFocus) shown = [...shown.filter((i) => !wornIds.has(i.id) && bagFocus!.match(i)), ...shown.filter((i) => !wornIds.has(i.id) && !bagFocus!.match(i))]; // món hợp ô lên trước
  el.appendChild(bagTools(bag, items, again));
  el.appendChild(bagSearch(again));
  if (bagFocus) {
    const n = shown.filter(bagFocus.match).length, fb = document.createElement("div"); fb.className = "bfocus";
    fb.innerHTML = `<small></small><button type="button" class="buse drop f2-nut-phu">Thôi</button>`;
    fb.querySelector("small")!.textContent = n ? `${bagFocus.label}: bấm một món sáng để gắn (${n} món hợp).` : `${bagFocus.label}: túi không có món nào hợp ô này.`;
    fb.querySelector("button")!.addEventListener("click", () => { bagFocus?.cancel(); });
    el.appendChild(fb);
  }

  const displaySlots = Math.max(bag.slots, view.length);
  const pages = Math.max(1, Math.ceil(displaySlots / BAG_PAGE));
  bagPage = Math.max(0, Math.min(pages - 1, bagPage));
  const bar = document.createElement("div"); bar.className = "bpages";
  for (let p = 0; p < pages; p++) {
    const cap = Math.max(0, Math.min(BAG_PAGE, bag.slots - p * BAG_PAGE));
    const n = shown.slice(p * BAG_PAGE, (p + 1) * BAG_PAGE).filter((i) => !wornIds.has(i.id)).length;
    const b = document.createElement("button"); b.className = "bpg f2-nut-phu" + (p === bagPage ? " cur" : "") + (cap > 0 && n >= cap ? " full" : n === 0 ? " none" : "");
    b.innerHTML = `<b>${p + 1}</b><i style="--f:${cap ? n / cap : 0}"></i>`;
    b.title = cap ? `Trang ${p + 1}: ${n}/${cap} ô túi${n >= cap ? " (đầy)" : ""}` : `Trang ${p + 1}: đồ đang mặc (không chiếm ô túi)`; b.setAttribute("aria-label", b.title);
    b.setAttribute("aria-pressed", String(p === bagPage));
    b.addEventListener("click", () => { b.blur(); bagPage = p; again(); });
    bar.appendChild(b);
  }
  // Tự bán từ xa (#216): nút mở bộ lọc (thay chỗ chi tiết ô), chữ ghi đang bật hay tắt.
  const sell = { ...SELL_DEFAULTS, ...(bag.sell ?? {}) }, sb = document.createElement("button");
  sb.className = "buse bsellbtn f2-nut-phu" + (sell.on ? " on" : ""); sb.textContent = sell.on ? "Tự bán: bật" : "Tự bán: tắt";
  sb.title = "Bộ lọc tự bán từ xa khi túi gần đầy"; sb.setAttribute("aria-pressed", String(sellOpen));
  sb.addEventListener("click", () => { sb.blur(); sellOpen = !sellOpen; if (sellOpen) bagSel = null; again(); });
  head.querySelector("span")!.prepend(sb);
  const sort = document.createElement("button"); sort.className = "buse bsort f2-nut-phu"; sort.textContent = "Sắp xếp";
  sort.title = "Gộp đồ cùng loại chưa đầy ô và xếp lại cả túi (mọi trang) theo loại, số năm, sao.";
  sort.disabled = items.length < 2;
  sort.addEventListener("click", () => { sort.blur(); clearOrder(); bagSortMode = "tay"; act.sort(); });
  head.querySelector("span")!.prepend(sort);
  el.appendChild(bar);
  if (active !== null) el.appendChild(bagEquipStrip(bag.items, active, act, dollView()));

  const grid = document.createElement("div"); grid.className = "bgrid";
  for (let k = bagPage * BAG_PAGE; k < Math.min(displaySlots, (bagPage + 1) * BAG_PAGE); k++) {
    const it = shown[k], b = document.createElement("button");
    b.className = "bslot ui-cell f2-o" + (it ? "" : " empty") + (it && it.id === bagSel ? " sel" : "") + (it && bagFocus ? (bagFocus.match(it) ? " hint" : " dim") : "");
    // Kéo thả (NV3 #457, dragDrop.ts): thả lên ô túi khác = đổi chỗ (chỉ khi không lọc; thứ tự nhớ ở trình duyệt); kéo từ búp bê thả lên ô túi = tháo.
    addZone({ el: b, kind: "cell", test: (d) => ("bagIndex" in d.from ? (!filtered && (!it || !wornIds.has(it.id)) && d.item.id !== it?.id ? { ok: true } : null) : bagArea(d)), drop: (d) => {
      if ("bagIndex" in d.from) { const loose = view.filter((i) => !wornIds.has(i.id)); moveItem(loose, d.item.id, it ? loose.indexOf(it) : loose.length); bagSortMode = "tay"; again(); } else bagAreaDrop(d); } });
    if (it) {
      const def = itemDef(it.code);
      b.dataset.id = it.id; if (def?.cd) b.dataset.cd = def.cd;
      if (!wornIds.has(it.id)) dragSource(b, () => (it.id ? { item: it, from: { bagIndex: k } } : null));
      const rare = rarityOf(it);
      // Viền theo độ hiếm: hồn hoàn / hồn cốt theo bậc niên hạn (itemColor), hồn hạch theo sao (token --rare-N); món khác màu theo ITEMS.
      b.style.setProperty("--c", coreOf(it) && rare >= 0 ? `var(--rare-${rare})` : itemColor(it));
      if (rare >= 0) b.dataset.rare = String(rare);
      const eq = it.code === EQUIP_ITEM ? parseEquip(it.stats) : null, etpl = equipTemplate(eq?.tpl); // trang bị hồn sư (E5): khung theo bậc, "+N", may mắn ở góc
      if (etpl) b.dataset.etier = String(etpl.tier);
      const core = coreOf(it), corner = hasYears(it) ? yearsShort(it.years) : core ? `${it.stars ?? 1}★` : eq?.luck ? `M${eq.luck}` : it.qty > 1 ? String(it.qty) : "";
      const bone = boneOf(it), icon = itemArt(it) || (bone ? boneIcon(bone.slot, itemColor(it)) : core ? coreIcon(core.set) : `<i class="ico ${def?.kind ?? "unknown"}"></i>`);
      b.innerHTML = `${icon}${etpl ? artImg(equipFrameKey(etpl.tier), "efr") : ""}${corner ? `<small>${corner}</small>` : ""}${(bone || core || etpl) && it.enhance ? `<b class="enh">+${it.enhance}</b>` : ""}${it.lock ? `<i class="lk" aria-hidden="true"></i>` : ""}${isNew(it.id) ? `<i class="nw" aria-hidden="true"></i>` : ""}<div class="cd"></div>`;
      if (etpl && !wornIds.has(it.id) && gear?.upgrades?.includes(it.id)) {
        const up = document.createElement("span"); up.className = "gear-up"; up.textContent = "↑";
        up.setAttribute("aria-label", "Tăng Sức mạnh đội hình"); b.appendChild(up);
      }
      if (etpl && !wornIds.has(it.id) && it.id === bagSel) {
        const wear = document.createElement("span"); wear.className = "gear-wear f2-nut-phu"; wear.textContent = "Mặc";
        wear.setAttribute("role", "button"); wear.tabIndex = 0; wear.setAttribute("aria-label", `Mặc ${itemName(it)}`);
        const equip = (e: Event) => { e.preventDefault(); e.stopPropagation(); act.equipGear(it.id); };
        wear.addEventListener("pointerdown", equip);
        wear.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); });
        wear.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") equip(e); });
        b.appendChild(wear);
      }
      if (wornIds.has(it.id)) {
        const mark = document.createElement("i"); mark.className = "bworn"; mark.setAttribute("aria-hidden", "true"); b.appendChild(mark);
      }
      b.setAttribute("aria-label", (etpl ? `${itemName(it)} (${EQUIP_TIERS[etpl.tier].name})` : hasYears(it) ? `${bone ? "Hồn cốt " : ""}${itemName(it)} (${TIERS[tierOfYears(it.years)].color})` : core ? itemName(it) : `${itemName(it)}, ${it.qty} món`)
        + (it.lock ? ", đang khoá" : "") + (wornIds.has(it.id) ? ", đang mặc · xem ở Hồn sư" : ""));
      // Chú thích dùng chung (UI-0): tiêu đề theo màu niên hạn (glow trên tấm mực), dòng phụ nhóm vật phẩm / số năm, chỉ số hồn cốt / hồn hạch.
      const tier = hasYears(it) ? tierOfYears(it.years) : -1;
      if (tier >= 0) b.dataset.tier = String(tier);
      const lines: TipLine[] = [];
      if (bone) lines.push(boneFullText(it as BagItem & { years: number })); else if (core) lines.push(...coreLines(it));
      if (it.qty > 1) lines.push({ k: "Số lượng", v: `×${it.qty}`, tone: "gem" });
      // So sánh với món đang gắn của võ hồn ra trận (chỉ số ▲ xanh / ▼ đỏ); máy cảm ứng: chạm giữ ra chú thích, chạm một lần xem ở khung chi tiết.
      const worn = currentFor(it, dollView()), cmp = worn && compareLines(it, worn, worn.cur ? itemName(worn.cur) : null);
      lines.push(...itemInfoLines(it));   // so sánh + món đang mặc song song chỉ hiện khi giữ Shift (itemTip.ts)
      setTip(b, { title: itemName(it) + (it.lock ? " (khoá)" : ""), color: tier >= 0 ? TIERS[tier].glow : undefined, border: itemColor(it),
        sub: tier >= 0 ? `${bone ? "Hồn cốt" : "Hồn hoàn"} · ${TIERS[tier].color} (${TIERS[tier].age})` : def ? ITEM_KINDS[def.kind].name : undefined,
        lines,
        shift: shiftPart(cmp ?? null, worn?.cur ?? null, worn?.cur ? itemName(worn.cur) : null, worn?.cur ? itemColor(worn.cur) : "") });
      b.addEventListener("click", () => {
        b.blur(); markSeen(it.id);
        if (wornIds.has(it.id)) { setPanel("char", true); return; }
        // Bấm đúp = mặc thông minh. Bấm lần đầu vẽ lại túi (ô bị thay) nên không dùng sự kiện dblclick: so thời điểm hai lần bấm cùng một món.
        if (bagFocus?.match(it)) return bagFocus.pick(it); // đang chọn món cho một ô của bảng Nhân vật: gắn luôn (server quyết định), không tính bấm đúp
        const now = performance.now(), dbl = lastTap.id === it.id && now - lastTap.t < DBL_MS;
        lastTap = dbl ? { id: "", t: 0 } : { id: it.id, t: now };
        if (dbl) { hideCard(); return quick(it); }
        bagSel = bagSel === it.id ? null : it.id; sellOpen = false; enhClose(); again();
        if (bagSel) openCard(it.id); else hideCard();
      });
      b.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.shiftKey) { e.preventDefault(); if (wornIds.has(it.id)) { setPanel("char", true); return; } hideCard(); quick(it); } }); // Shift+Enter: mặc nhanh
    } else { b.disabled = true; b.setAttribute("aria-label", "Ô trống"); }
    grid.appendChild(b);
  }
  el.appendChild(grid);
  if (!view.length) el.appendChild(stateBox({ kind: "empty", text: "Túi đang trống.", hint: "Săn hồn thú hoặc nhặt vật phẩm để có đồ." }));
  else if (view.length && !shown.length) el.appendChild(stateBox({ kind: "empty", text: bagQuery ? "Không có món nào khớp." : "Nhóm này chưa có món.", hint: bagQuery ? "Xoá bớt chữ trong ô tìm để xem lại." : "Chọn nhóm khác." }));

  if (sellOpen) { el.appendChild(sellBox(bag, sell, act)); return finishBag(el); }
  const info = document.createElement("div"); info.className = "binfo";
  const sel = items.find((i) => i.id === bagSel), def = sel && itemDef(sel.code);
  if (sel) {
    info.innerHTML = `<b></b><small></small><p></p>`;
    info.querySelector("b")!.textContent = `${itemName(sel)}${sel.qty > 1 ? ` ×${sel.qty}` : ""}${sel.lock ? " · đang khoá" : ""}`;
    info.querySelector("b")!.style.color = def ? itemColor(sel) : "";
    const band = hasYears(sel) ? tierBand(tierOfYears(sel.years)) : null, bone = boneOf(sel), slot = bone ? BONE_SLOTS[boneSlotIndex(bone.slot)] : null;
    const core = coreOf(sel), cset = core ? coreSet(core.set) : undefined;
    info.querySelector("small")!.textContent = !def ? "Không rõ loại" : ITEM_KINDS[def.kind].name
      + (slot && bone ? ` · ${slot.name} (kỹ năng ${slot.active ? "chủ động" : "bị động"}${(() => { const k = boneSkillOf(bone.beast, bone.slot); return k ? ` ${k.active ? k.sk.name : k.ps.name}` : ""; })()})` : "")
      + (core ? ` · Bộ ${cset ? `${cset.name} (${cset.tag})` : "lạ"}` : "")
      + (hasYears(sel) && band ? ` · ${TIERS[tierOfYears(sel.years)].color} (${band[0].toLocaleString("vi-VN")} – ${band[1].toLocaleString("vi-VN")} năm)` : "")
      + (def.cd ? ` · hồi chiêu chung ${DAN_CD} giây` : "");
    // Hồn cốt (4.1): chỉ số gốc theo số năm, dòng phụ đã tung ở các mốc (#187), cấp cường hóa, đang gắn hay chưa.
    if (bone && slot) {
      const st = document.createElement("div"), subs = parseBoneSubs(sel.stats); st.className = "bstat";
      const rows: [string, string][] = [["Chỉ số chính", boneStatText(bone.slot, sel.years!, sel.enhance)]];
      subs.forEach(([k, v], i) => rows.push([`Dòng phụ ${i + 1}`, coreStatText(k, v)]));
      if (!subs.length) rows.push(["Dòng phụ", `Chưa có: mỗi mốc ${BONE_ENHANCE_MILESTONES.map((x) => `+${x}`).join(", ")} thêm 1 dòng ngẫu nhiên`]);
      rows.push(["Kỹ năng", boneSkillText(bone.beast, bone.slot, sel.years!, sel.enhance) || "Không có"], ["Cường hóa", enhText(sel)], ["Đang gắn", "Chưa gắn"]);
      for (const [k, v] of rows) { const a = document.createElement("span"), b = document.createElement("b"); a.textContent = k; b.textContent = v; st.append(a, b); }
      info.insertBefore(st, info.querySelector("p"));
    }
    // Hồn hạch (5.1): sao, chỉ số chính (theo sao), dòng phụ đã tung, nâng cấp, đang gắn hay chưa, hiệu ứng bộ (có tác dụng từ 5.2,
    // gắn bằng nút "Gắn…").
    if (core) {
      const stars = sel.stars ?? 1, st = document.createElement("div"); st.className = "bstat";
      const rows: [string, string][] = [["Sao", "★".repeat(stars) + ` (${core.subs.length}/${CORE_MAX_SUBS} dòng phụ)`], ["Chỉ số chính", coreStatText(core.main, coreMainValue(core.main, stars, sel.enhance))]];
      core.subs.forEach(([k, v], i) => rows.push([`Dòng phụ ${i + 1}`, coreStatText(k, v)]));
      if (!core.subs.length) rows.push(["Dòng phụ", "Không có"]);
      rows.push(["Nâng cấp", coreEnhText(sel)], ["Đang gắn", "Chưa gắn"]);
      if (cset) rows.push(["Bộ 2 món", cset.set2], ["Bộ 4 món", cset.set4]);
      for (const [k, v] of rows) {
        const a = document.createElement("span"), b = document.createElement("b"); a.textContent = k; b.textContent = v;
        if (k === "Chỉ số chính") b.style.color = cset?.col ?? ""; st.append(a, b);
      }
      st.classList.add("core");
      info.insertBefore(st, info.querySelector("p"));
    }
    const eq = sel.code === EQUIP_ITEM ? parseEquip(sel.stats) : null;
    if (eq) info.insertBefore(equipBox(sel, eq, act.gear()), info.querySelector("p"));
    const worn = currentFor(sel, dollView()), cmp = worn && compareLines(sel, worn, worn.cur ? itemName(worn.cur) : null);
    if (cmp) info.insertBefore(compareBox(cmp), info.querySelector("p"));
    const ready = isRing(sel) ? act.absorbOptions(sel.years).filter((o) => !o.reason).length : 0;
    info.querySelector("p")!.textContent = (def?.desc ?? "Vật phẩm không còn trong trò chơi, vẫn được giữ trong túi.")
      + (isRing(sel) ? (ready ? ` Có ${ready} võ hồn ở bình cảnh hấp thụ được.` : " Chưa có võ hồn nào ở bình cảnh hấp thụ được hồn hoàn này.") : "");
    const row = document.createElement("div"); row.className = "brow";
    const btn = (text: string, cls: string, fn: () => void) => {
      const b = document.createElement("button"); b.className = "buse " + cls + (cls.includes("absorb") ? " f2-nut-chinh" : " f2-nut-phu"); b.textContent = text;
      b.addEventListener("click", () => { b.blur(); fn(); }); row.appendChild(b); return b;
    };
    if (def && (def.hp || def.mp)) btn("Dùng", "use", () => act.use(sel.id)).dataset.cd = def.cd ?? "";
    if (def?.recall) btn("Dùng", "absorb", () => { act.use(sel.id); toggleBag(false); }); // Hồi Thành Phù (11.2): niệm rồi về thành
    if (def?.auto) btn("Dùng", "absorb", () => act.use(sel.id)); // Ủy Thác Lệnh (Auto 2): cộng giờ treo tự săn
    if (isRing(sel) && pickRing === sel.id) { info.appendChild(absorbPicker(sel, act, again)); el.appendChild(info); return finishBag(el); }
    if (isRing(sel)) btn("Hấp thụ…", "absorb", () => { pickRing = sel.id; pickVh = null; act.refresh(); again(); });
    if (def?.vohon) btn("Mở / lên sao…", "use", () => toggleRoster(true)); // mảnh võ hồn (3.4): nút ở bảng đội hình
    if (eq) btn("Mặc", "absorb", () => act.equipGear(sel.id)); // trang bị hồn sư (5.15): ô theo mẫu, đổi chỗ nếu ô đã có món
    if (def?.kind === "ruong") btn("Mở rương", "absorb", () => act.open(sel.id)); // rương thú vương (BĐ5): server tung phần thưởng
    if (def?.kind === "tien_thao" && pickHerb === sel.id) { info.appendChild(herbPicker(sel, act, again)); el.appendChild(info); return finishBag(el); }
    if (def?.kind === "tien_thao") btn("Dùng cho…", "absorb", () => { pickHerb = sel.id; pickVh = null; act.refresh(); again(); }); // BĐ6b
    if (bone && hasYears(sel) && enhTarget === sel.id) { info.appendChild(enhancePicker(sel, bag.items, act, again)); el.appendChild(info); return finishBag(el); }
    if (bone && active !== null) btn("Gắn nhanh", "absorb", () => act.equipBone(sel.id)); // UI-1: gắn thẳng cho võ hồn ra trận, không mở bảng đội hình
    if (bone) btn("Gắn…", "use", () => openBones(sel.id, bone.slot)); // hồn cốt (4.2): gắn ở bảng đội hình
    if (bone && sel.enhance < BONE_MAX_ENHANCE) btn("Cường hóa…", "use", () => { enhOpen(sel.id); again(); }); // 4.4
    if (core && enhTarget === sel.id) { info.appendChild(corePicker(sel, bag.items, act, again)); el.appendChild(info); return finishBag(el); }
    if (core && active !== null) btn("Gắn nhanh", "absorb", () => act.equipCore(sel.id, coreQuickSlot(sel, bag.items, active)));
    if (core) btn("Gắn…", "use", () => openCores(sel.id)); // hồn hạch (5.2): gắn ở bảng đội hình
    if (core && sel.enhance < CORE_MAX_ENHANCE) btn("Nâng cấp…", "use", () => { enhOpen(sel.id); again(); }); // 5.3
    // Khoá (#216): món khoá không bị bán (tay hay tự bán), bỏ, làm nguyên liệu; server kiểm tra lại.
    btn(sel.lock ? "Mở khoá" : "Khoá", "use", () => act.lock(sel.id)).title = sel.lock ? "Mở khoá để bán / bỏ được" : "Khoá: không bán, bỏ hay làm nguyên liệu";
    if (!sel.lock) btn(bagConfirm === sel.id ? "Bỏ hẳn?" : "Bỏ", "drop", () => {
      if (bagConfirm === sel.id) { bagConfirm = null; act.discard(sel.id); } else { bagConfirm = sel.id; again(); }
    });
    info.appendChild(row);
  } else info.innerHTML = `<small>Chọn một ô để xem, dùng, hấp thụ hoặc bỏ vật phẩm.</small>`;
  el.appendChild(info);
  finishBag(el);
}

/** Dòng chỉ số của một món trang bị (E1, mục 5.15): ô, bậc, chỉ số chính / công vũ khí, dòng phụ, may mắn, kèm so với món đang mặc ở ô đó. */
function equipBox(it: BagItem, eq: NonNullable<ReturnType<typeof parseEquip>>, gear: GearMsg | null) {
  const tpl = equipTemplate(eq.tpl)!, slot = equipSlotDef(tpl.slot), st = equipStats([{ ...eq, enhance: it.enhance }]);
  const box = document.createElement("div"); box.className = "bstat";
  const rows: [string, string][] = [["Ô", slot.name], ["Bậc", `${EQUIP_TIERS[tpl.tier].name} (${EQUIP_TIERS[tpl.tier].color})`], ["Cấp vật phẩm", String(eq.ilvl)]];
  if (st.weapon) rows.push(["Công mỗi đòn", `${st.weapon.min}–${st.weapon.max}`]);
  for (const k of Object.keys(st.bonus) as CoreStat[]) if (st.bonus[k]) rows.push([CORE_STATS[k].name, coreStatText(k, st.bonus[k]).replace(/^.*? \+/, "+")]);
  if (st.red) rows.push(["Giảm sát thương nhận", `${(st.red * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`]);
  if (st.luck) rows.push(["May mắn", String(st.luck)]);
  const cur = gear?.items.find((g) => g.slot === EQUIP_SLOTS.findIndex((s) => s.id === tpl.slot));
  rows.push(["Đang mặc", cur ? equipName(parseEquip(cur.stats)?.tpl, cur.enhance) : "Ô trống"]);
  for (const [k, v] of rows) { const a = document.createElement("span"), b = document.createElement("b"); a.textContent = k; b.textContent = v; box.append(a, b); }
  return box;
}

/** Ô gửi kèm khi gắn nhanh hồn hạch: đủ ô thì ô của món yếu nhất (đúng món bảng so sánh nói sẽ bị thay), còn ô trống thì để server chọn. */
const coreQuickSlot = (it: BagItem, items: BagItem[], active: number) => {
  const cur = wornFor(it, items, active)?.cur;
  const s = cur ? coreSlotOf(cur.stats) : -1;
  return s >= 0 ? s : undefined;
};

/** Ô tìm của túi (UI v2): lọc theo tên không dấu, kết hợp với chip nhóm; gõ xong vẽ lại túi (về trang 1) và trả con trỏ về ô. */
function bagSearch(again: () => void) {
  const { root, input } = searchField({ label: "Tìm món trong túi", value: bagQuery, onInput: (q) => { bagQuery = q; bagPage = 0; bagSearchFocus = true; again(); } });
  if (bagSearchFocus) { bagSearchFocus = false; queueMicrotask(() => { input.focus({ preventScroll: true }); input.setSelectionRange(input.value.length, input.value.length); }); }
  return root;
}

/** Hàng công cụ của túi (UI-1): chip lọc theo nhóm (kèm số món) và hộp chọn cách xếp; đổi gì thì vẽ lại túi, không gửi gì lên server. */
function bagTools(bag: BagMsg, items: BagItem[], again: () => void) {
  const box = document.createElement("div"); box.className = "bfilter"; box.setAttribute("role", "tablist");
  for (const g of BAG_GROUPS) {
    const n = items.filter((i) => inGroup(i, g.id)).length;
    if (g.id !== "all" && !n && bagGroup !== g.id) continue; // nhóm trống không hiện (trừ nhóm đang chọn)
    const b = document.createElement("button"); b.type = "button"; b.className = "ui-tab f2-tab" + (bagGroup === g.id ? " on" : "");
    b.textContent = g.id === "all" ? g.name : `${g.name} ${n}`; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(bagGroup === g.id)); // .ui-tab[aria-selected] (cả khung gỗ) tô tab đang chọn
    b.addEventListener("click", () => { b.blur(); bagGroup = g.id; bagPage = 0; bagSel = null; again(); });
    box.appendChild(b);
  }
  const s = document.createElement("select"); s.className = "bsortsel"; s.setAttribute("aria-label", "Cách xếp thứ tự hiển thị");
  s.title = "Xếp thứ tự hiển thị\nChỉ đổi cách xem trên máy bạn; nút Sắp xếp mới gộp và xếp thật ở server.";
  for (const m of BAG_SORTS) { const o = document.createElement("option"); o.value = m.id; o.textContent = m.id === "tay" ? "Xếp: mặc định" : `Xếp: ${m.name.toLowerCase()}`; o.selected = m.id === bagSortMode; s.appendChild(o); }
  s.addEventListener("change", () => { bagSortMode = s.value as BagSort; if (bagSortMode === "tay") clearOrder(); again(); });
  box.appendChild(s);
  return box;
}

/** Dải gắn nhanh (UI-1): 6 ô hồn cốt và ô hồn hạch của võ hồn ra trận; kéo món từ lưới thả vào là gửi đúng lệnh gắn (NV3: ô xanh / đỏ như búp bê, server kiểm tra vị trí). */
function bagEquipStrip(items: BagItem[], vohon: number, act: BagActions, view: DollView) {
  const box = document.createElement("div"); box.className = "bequip";
  const lab = document.createElement("small"); lab.textContent = "Gắn nhanh:"; box.appendChild(lab);
  const mine = items.filter((i) => i.vohon === vohon), rv = { rowId: vohon };
  const cell = (cls: string, html: string, ref: SlotRef, target: (it: BagItem) => SlotRef | null) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "bq ui-cell " + cls; b.innerHTML = html;
    addZone({ el: b, kind: "slot", test: (d) => ("bagIndex" in d.from ? acceptsItem(ref, d.item, rv) : null),
      drop: (d) => { const t = target(d.item), c = t && mountCommand(d.item, t, { rowId: vohon }); if (c) act.send(c); } });
    box.appendChild(b); return b;
  };
  for (const s of BONE_SLOTS) {
    const it = mine.find((i) => boneOf(i)?.slot === s.id), ref: SlotRef = { tab: "bone", slot: s.id, rowId: vohon };
    const b = cell(`bone${it ? "" : " empty"}`, it ? `${boneIcon(s.id, itemColor(it))}<small>${yearsShort(it.years!)}</small>` : boneEmptyIcon(s.id), ref, () => ref);
    b.setAttribute("aria-label", `Ô ${s.name}: ${it ? itemName(it) : "trống"}`);
    if (it) { b.dataset.tier = String(tierOfYears(it.years!)); b.style.setProperty("--c", itemColor(it)); }
    setTip(b, { title: it ? itemName(it) : `Ô ${s.name} trống`, color: it ? TIERS[tierOfYears(it.years!)].glow : undefined, sub: `Hồn cốt · ${s.name}`,
      lines: it ? [boneFullText(it as BagItem & { years: number })] : [], foot: "Kéo hồn cốt từ túi thả vào để gắn" });
  }
  const cores = mine.filter((i) => coreOf(i));
  const cb = cell("core" + (cores.length ? "" : " empty"), `${coreIcon("")}<small>${cores.length}/${CORE_SLOTS}</small>`, { tab: "core", slot: 0, rowId: vohon },
    (it) => smartTarget(it, { ...view, rowId: vohon }));
  cb.setAttribute("aria-label", `Hồn hạch đang gắn ${cores.length}/${CORE_SLOTS}`);
  setTip(cb, { title: `Hồn hạch ${cores.length}/${CORE_SLOTS}`, lines: cores.map((c) => itemName(c)), foot: "Kéo hồn hạch từ túi thả vào để gắn (vào ô trống đầu tiên)" });
  return box;
}

/** Khung so sánh trong chi tiết ô (UI-1): cùng nội dung chú thích so sánh, cho máy cảm ứng và người không rê chuột. */
function compareBox(lines: TipLine[]) {
  const box = document.createElement("div"); box.className = "bstat bcmp";
  for (const ln of lines) {
    if (typeof ln === "string") continue;
    const a = document.createElement("span");
    if (!ln.k) { a.textContent = ln.v; a.className = "bcmpnote"; box.append(a); continue; }
    const b = document.createElement("b");
    a.textContent = ln.k; b.textContent = ln.v; if (ln.tone) b.className = `t-${ln.tone}`;
    box.append(a, b);
  }
  return box;
}

let sellOpen = false; // đang mở bộ lọc tự bán thay cho chi tiết ô (#216)
/** Mức chọn của bộ lọc tự bán (chỉ là lựa chọn giao diện; server kẹp bằng parseSell). */
const SELL_RING: [number, string][] = [[0, "Không bán"], [100, "Dưới 100 năm"], [1000, "Dưới 1.000 năm"], [10000, "Dưới 10.000 năm"],
  [100000, "Dưới 100.000 năm"], [MAX_YEARS + 1, "Mọi niên hạn"]];
const SELL_BONE: [number, string][] = [[0, "Không bán"], [1, "Chưa cường hóa (+0)"], [5, "Dưới +5"], [10, "Dưới +10"]];
const SELL_SALV: [number, string][] = [[0, "Không tự phân giải"], ...EQUIP_TIERS.slice(0, EQUIP_MAX_TIER).map((t, i): [number, string] => [i + 1, i ? `${EQUIP_TIERS[0].name} – ${t.name}` : t.name])];
const SELL_SALV_ENH: [number, string][] = [[1, "Chỉ món +0"], [4, "Tới +3"], [7, "Tới +6"], [11, "Tới +10"]];
const SELL_CORE: [number, string][] = [[1, "Không bán"],
  ...Array.from({ length: MAX_CORE_STARS - 2 }, (_, i): [number, string] => [i + 2, i ? `1★ – ${i + 1}★` : "1★"])];
/**
 * Bộ lọc tự bán từ xa (#216, mục 5.7 "Tự bán"): bật / tắt, hồn hoàn dưới X năm, cho bán vạn năm, hồn cốt dưới mức cường hóa, hồn hạch
 * dưới N sao, mảnh võ hồn; xem trước số ô đang hợp bộ lọc (autoSellable, chỉ để hiển thị). Đổi gì thì gửi ngay `autosell {cfg}`.
 */
function sellBox(bag: BagMsg, cfg: SellSettings, act: BagActions) {
  const box = document.createElement("div"); box.className = "binfo bsell";
  const send = (patch: Partial<SellSettings>) => act.autoSell({ ...cfg, ...patch });
  const head = document.createElement("b"); head.textContent = "Tự bán từ xa"; box.appendChild(head);
  const tg = document.createElement("button"); tg.type = "button"; tg.className = "buse " + (cfg.on ? "drop" : "absorb");
  tg.textContent = cfg.on ? "Tắt tự bán" : "Bật tự bán"; tg.setAttribute("aria-pressed", String(cfg.on));
  tg.addEventListener("click", () => { tg.blur(); send({ on: !cfg.on }); });
  box.appendChild(tg);
  const pick = (label: string, list: [number, string][], v: number, key: "ring" | "bone" | "core" | "salv" | "salvEnh") => {
    const l = document.createElement("label"); l.className = "achk"; l.textContent = label + " ";
    const s = document.createElement("select");
    for (const [n, t] of list) { const o = document.createElement("option"); o.value = String(n); o.textContent = t; o.selected = n === v; s.appendChild(o); }
    if (!list.some(([n]) => n === v)) { const o = document.createElement("option"); o.value = String(v); o.textContent = `(${v})`; o.selected = true; s.appendChild(o); }
    s.addEventListener("change", () => send({ [key]: Number(s.value) }));
    l.appendChild(s); box.appendChild(l);
  };
  const check = (label: string, v: boolean, key: "high" | "shard") => {
    const l = document.createElement("label"); l.className = "achk";
    const c = document.createElement("input"); c.type = "checkbox"; c.checked = v;
    c.addEventListener("change", () => { c.blur(); send({ [key]: c.checked }); });
    l.append(c, ` ${label}`); box.appendChild(l);
  };
  pick("Hồn hoàn", SELL_RING, cfg.ring, "ring");
  pick("Hồn cốt", SELL_BONE, cfg.bone, "bone");
  pick("Hồn hạch chưa nâng cấp", SELL_CORE, cfg.core, "core");
  check("Mảnh võ hồn", cfg.shard, "shard");
  pick("Tự phân giải trang bị hồn sư", SELL_SALV, cfg.salv, "salv"); // E4: mặc định tắt, độc lập với nút bật tự bán
  if (cfg.salv > 0) pick("… với cường hóa", SELL_SALV_ENH, cfg.salvEnh, "salvEnh");
  check(`Cho bán cả hồn hoàn, hồn cốt từ ${AUTO_SELL_GUARD.toLocaleString("vi-VN")} năm (vạn năm) trở lên`, cfg.high, "high");
  const now = bag.items.filter((i) => autoSellable({ ...i, locked: i.lock }, cfg));
  const salvNow = bag.items.filter((i) => equipAutoSalvageable({ ...i, locked: i.lock }, cfg)).length;
  const gain = now.reduce((a, i) => a + (sellPrice(i) ?? 0) * i.qty, 0);
  const pv = document.createElement("small");
  pv.textContent = now.length ? `Lúc này túi có ${now.length} ô hợp bộ lọc (≈ +${formatHonTe(gain)}).` : "Lúc này không có ô nào hợp bộ lọc.";
  box.appendChild(pv);
  if (cfg.salv > 0) { const sv = document.createElement("small"); sv.textContent = `Tự phân giải: túi còn dưới ${AUTO_SELL_FREE} ô trống thì phân giải ${salvNow} trang bị đang hợp bộ lọc (không khoá, không mặc; không cho kinh nghiệm).`; box.appendChild(sv); }
  const n = document.createElement("small");
  n.textContent = `Bật thì khi túi còn dưới ${AUTO_SELL_FREE} ô trống (hoặc tự săn thấy túi đầy), đồ hợp bộ lọc được bán từ xa đúng giá thương nhân trong thành. `
    + "Không bao giờ bán món khoá, món đang gắn, hồn hoàn đang hấp thụ. Đan, phù chú, lệnh bài, rương, tiên thảo thương nhân không mua nên không bán. "
    + `${AUTO_SELL_BUYBACK} món tự bán gần nhất mua lại được đúng giá ở thương nhân (về túi ở trạng thái khoá). Ủy thác offline không tự bán.`;
  box.appendChild(n);
  return box;
}

function finishBag(el: HTMLElement) {
  const note = document.createElement("small"); note.className = "rnote";
  note.textContent = `Kéo thả (điện thoại: giữ một chút rồi kéo) để đổi chỗ ô hoặc gắn vào búp bê / dải "Gắn nhanh"; bấm một lần mở thẻ thao tác, bấm đúp (hoặc Shift+Enter) để mặc nhanh; chọn nhóm và cách xếp ở đầu túi. Đồ cùng loại tự gộp vào một ô; mỗi hồn hoàn, hồn cốt, hồn hạch một ô (góc ô: số năm hoặc số sao). Mỗi trang ${BAG_PAGE} ô, mở rộng túi ở thương nhân trong thành. Hồi Huyết Đan và Hồi Hồn Đan dùng chung hồi chiêu. Phím B mở / đóng, Esc đóng.`;
  el.appendChild(note);
  updateBag();
}

/** Mỗi lần cập nhật HUD: lớp phủ hồi chiêu chung trên ô đan và chữ trên nút "Dùng". */
export function updateBag() {
  if ($("#bag").hidden) return;
  const left = Math.max(0, (bagCdEnd - performance.now()) / 1000), k = Math.min(1, left / DAN_CD);
  document.querySelectorAll<HTMLElement>("#bag .bslot[data-cd]").forEach((b) => { (b.querySelector(".cd") as HTMLElement).style.height = k * 100 + "%"; });
  const btn = document.querySelector<HTMLButtonElement>("#bag .buse.use");
  if (btn && btn.dataset.cd) {
    const txt = left > 0 ? `Đang hồi · ${Math.ceil(left)}s` : "Dùng";
    if (btn.textContent !== txt) { btn.textContent = txt; btn.disabled = left > 0; }
  }
}

let beforeBagFromBar: (() => void) | null = null;
/** GameScene đặt hàm dọn các bảng phủ (Cài đặt, Tự động, bản đồ vùng) trước khi nút "Tiêu hao" mở Túi (trước kia đi qua nút Túi ở cột trái). */
export function onBeforeBagFromBar(fn: () => void) { beforeBagFromBar = fn; }
/** Nút "Tiêu hao" ở thanh kỹ năng (hudBar.ts): mở túi ở nhóm tiêu hao. */
export function openBagTieuHao() {
  bagGroup = "tieu_hao"; bagPage = 0; bagSel = null;
  if ($("#bag").hidden) { beforeBagFromBar?.(); toggleBag(true); }
  bagRefresh?.();
}
