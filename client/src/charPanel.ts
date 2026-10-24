// Bảng nhân vật "Hồn sư" (UI-2 #352, NV2 #456): búp bê 4 tab (Trang bị, Hồn cốt, Hồn hạch, Võ hồn), dải chọn võ hồn + nút Ra trận, chỉ số
// tách nhóm chính / phụ, bộ hồn hạch. Chỉ số tổng hợp là tin riêng "stats" do server tính (MapRoom.sendStats), client không tính lại.
// Gắn / tháo hồn cốt, hồn hạch làm ngay trên bảng: bấm ô thì Túi lọc và sáng món hợp (hud.setBagFocus), bấm món sáng thì gửi lệnh gắn có
// sẵn; server quyết định, client không đổi tạm: kết quả (kể cả lý do bị từ chối) lấy từ tin "log" (charLog) và state mới. Không nhảy sang Đội hình (V).
import { TIERS, VOHON, BONE_SLOTS, CORE_SLOTS, CORE_SET_2, CORE_SET_4, MAX_RINGS, TEAM_SIZE, EQUIP_SLOTS, EQUIP_TIERS, EQUIP_ITEM, equipTemplate, parseEquip, equipFrameKey, equipSlotIconKey, atBottleneck, tierOfYears, vohonIndex,
  ringSkill, loadoutOf, formatYears, coreSetCounts, coreSetIndex, coreSlotOf, boneSkillOf } from "../../shared/data.ts";
import type { OwnedVohons, BagItem, GearItem } from "./net.ts";
import { panelChanged, swapButton, raisePanel } from "./dualWindow.ts";
import { type DollTab, type ServerCommand, type SlotRef, acceptsItem, cardActions, gearAsBagItem, mountCommand, sameSlot, unmountCommand } from "./charBagContract.ts";
import { addZone, dragSource } from "./dragDrop.ts";
import { showCard } from "./actionCard.ts";
import { vohonCard } from "./cards.ts";
import { boneSvg } from "./boneIcons.ts";
import { skillImg, artImg } from "./uiArt.ts";
import { compareRows } from "./bag.ts";
import { coreSvg } from "./coreIcons.ts";
import { setTip, type TipSpec, type TipLine } from "./tooltip.ts";
import { itemColor, itemName, boneOf, coreOf, coreSet, coreLines, wornCores, boneIcon, yearsShort, boneFullText, boneSkillText, skillSpec, SKILL_KEYS,
  starSkillText, itemArt, toggleRoster, toggleBag, toggleReso, toggleWorld, toggleFriends, closeNpc, setBagFocus } from "./hud.ts";

/** Bộ chỉ số server gửi (kết quả calcStats). */
export interface StatBlock { maxHp: number; maxMp: number; atk: number; speed: number; crit: number; critMult: number; }
/** Tin riêng "stats": `total` là chỉ số thật của võ hồn `rowId`, `base` là khi không gắn hồn cốt / hồn hạch. */
export interface StatsMsg { rowId: number; total: StatBlock; base: StatBlock; gear?: { red: number; luck: number; weapon: { min: number; max: number } | null }; }
/** Thao tác của bảng: chỉ gửi lệnh server có sẵn (như bảng Đội hình / Túi); `switchTo`: ô đội 0..TEAM_SIZE − 1; `combat`: đang giao chiến (tin "squad"). */
export interface CharActions {
  portrait(vohon: string): string; ask(rowId: number | null): void;
  equipBone(itemId: string, rowId: number, slot: string): void; unequipBone(itemId: string): void;
  equipCore(itemId: string, rowId: number, slot: number): void; unequipCore(itemId: string): void;
  switchTo(teamSlot: number): void; combat(): boolean;
  /** NV3 (#457): gửi một lệnh gắn / tháo có sẵn (kéo thả, bấm đúp, thẻ thao tác); `gear`: trang bị hồn sư đang mặc (tin "gear"). Server quyết định, bảng không đổi tạm. */
  send(cmd: ServerCommand): void; gear(): GearItem[];
}

const $ = (s: string) => document.querySelector(s) as HTMLElement;
let charRow: number | null = null;   // võ hồn đang xem (null = võ hồn ra trận)
let again: (() => void) | null = null;
const BONE_AREA: Record<string, string> = { dau: "1 / 2", tay_trai: "2 / 1", tay_phai: "2 / 3", than: "3 / 2", chan_trai: "3 / 1", chan_phai: "3 / 3" };
const TABS: { id: DollTab; name: string }[] = [{ id: "equip", name: "Trang bị" }, { id: "bone", name: "Hồn cốt" }, { id: "core", name: "Hồn hạch" }, { id: "vohon", name: "Võ hồn" }];
/** Vị trí 10 ô trang bị kiểu Mir2 (khung trống, nội dung ở NV4): cột trái / cột phải quanh hình hồn sư, Áo đè lên thân. */
const EQUIP_LEFT = ["vu_khi", "vong_trai", "nhan_trai", "dai"], EQUIP_RIGHT = ["mu", "day_chuyen", "vong_phai", "nhan_phai", "giay"];
let tab: DollTab = "bone";            // tab búp bê đang xem
let selBone: string | null = null;    // ô hồn cốt đang chọn (mã vị trí): Túi lọc / sáng món hợp, thẻ dưới búp bê hiện món đang gắn
let selCore: number | null = null;    // ô hồn hạch đang chọn (0..CORE_SLOTS − 1)
let selEquip: string | null = null;   // ô trang bị trống đang chọn (mã ô EQUIP_SLOTS): Túi sáng món hợp ô
let notice: { text: string; bad: boolean } | null = null; // kết quả lệnh gắn / tháo vừa gửi (tin "log" của server)
let lastAct = 0, noticeTimer = 0;
let lastTap = { k: "", t: 0 };        // lần bấm ô búp bê gần nhất (nhận bấm đúp = tháo)
const DBL_MS = 350;
/** Bấm đúp cùng một ô (`key`) trong DBL_MS. Bấm lần đầu vẽ lại bảng nên không dùng sự kiện dblclick. */
const isDouble = (key: string) => { const n = performance.now(), d = lastTap.k === key && n - lastTap.t < DBL_MS; lastTap = d ? { k: "", t: 0 } : { k: key, t: n }; return d; };
const NOTICE_MS = 4000, WARN_COL = "#ffb35c"; // server báo từ chối bằng tin "log" màu này (MapRoom: warn / deny)

/**
 * Mở / đóng bảng (phím C / H, nút "Hồn sư"); mở thì đóng các bảng cùng chỗ giữa màn hình (trừ Túi: NV1 #455, hai bảng mở cạnh nhau)
 * và xin chỉ số mới; đóng thì Túi thôi chế độ chọn món.
 */
export function toggleChar(open = $("#char").hidden) {
  const el = $("#char");
  if (el.hidden === !open) return open;
  el.hidden = !open; document.getElementById("charBtn")?.setAttribute("aria-expanded", String(open));
  if (open) { toggleRoster(false); toggleReso(false); toggleWorld(false); toggleFriends(false); closeNpc(); onOpen?.(); again?.(); }
  else { charRow = null; selBone = null; selCore = null; selEquip = null; notice = null; setBagFocus(null); }
  panelChanged("char", open);
  return open;
}
/** Mở / đóng một trong hai bảng Nhân vật / Túi (dùng cho nút ⇆ và thẻ chuyển). */
export const setPanel = (p: "char" | "bag", on: boolean) => { if (p === "char") toggleChar(on); else toggleBag(on); };
let onOpen: (() => void) | null = null;
/** Võ hồn đang xem trên bảng (null = võ hồn ra trận): GameScene xin "stats" đúng võ hồn này. */
export const charViewRow = () => charRow;
export const isCharOpen = () => !$("#char").hidden;
/** GameScene đăng ký: việc làm mỗi lần mở bảng (xin "stats"). */
export function onCharOpen(fn: () => void) { onOpen = fn; }

/**
 * Tin "log" của server (GameScene): trong NOTICE_MS sau một lệnh gắn / tháo / ra trận gửi từ bảng này thì hiện ngay trên bảng
 * (màu cảnh báo = bị từ chối, kèm lý do). Tin log vẫn vào khung chat như thường.
 */
export function charLog(text: string, col?: string) {
  if (!isCharOpen() || performance.now() - lastAct > NOTICE_MS) return;
  notice = { text, bad: col === WARN_COL };
  clearTimeout(noticeTimer); noticeTimer = window.setTimeout(() => { notice = null; again?.(); }, NOTICE_MS + 2000);
  again?.();
}
/** Gửi một lệnh từ bảng: bắt đầu cửa sổ nhận tin log và bỏ thông báo cũ. */
const send = (fn: () => void) => { lastAct = performance.now(); notice = null; fn(); };

const pct = (x: number, frac = 1) => `${(x * 100).toLocaleString("vi-VN", { maximumFractionDigits: frac })}%`;
const num = (x: number) => Math.round(x).toLocaleString("vi-VN");
const mk = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = "") => {
  const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e;
};

/** Chú thích một món đang gắn (hồn cốt / hồn hạch): tiêu đề theo màu niên hạn / bộ, dòng chỉ số. */
function wornTip(it: BagItem): TipSpec {
  const bone = boneOf(it), core = coreOf(it);
  const lines: TipLine[] = [];
  let sub = "", color: string | undefined;
  if (bone && it.years !== null) {
    const t = tierOfYears(it.years); color = TIERS[t].glow; sub = `Hồn cốt · ${TIERS[t].color} (${formatYears(it.years)})`;
    lines.push(boneFullText(it as BagItem & { years: number }));
    const sk = boneSkillText(bone.beast, bone.slot, it.years, it.enhance); if (sk) lines.push({ v: sk, tone: "gem" });
  } else if (core) {
    const cs = coreSet(core.set); sub = `Hồn hạch · bộ ${cs ? `${cs.name} (${cs.tag})` : "lạ"}`; lines.push(...coreLines(it));
  }
  if (it.enhance) lines.push({ k: "Cường hóa", v: `+${it.enhance}`, tone: "good" });
  return { title: itemName(it), color, border: itemColor(it), sub, lines, foot: "Bấm để chọn ô; tháo ở thẻ bên dưới" };
}

/** Chú thích một món trang bị đang mặc: bậc, cấp vật phẩm, từng chỉ số (chính, dòng phụ, công vũ khí, giảm sát thương, may mắn) từ `compareRows` dùng chung với bảng so sánh. */
function equipTip(it: BagItem, slotName: string): TipSpec {
  const eq = parseEquip(it.stats), tpl = equipTemplate(eq?.tpl), t = tpl && EQUIP_TIERS[tpl.tier];
  const f = (x: number) => x.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
  const lines: TipLine[] = (compareRows(it, null) ?? []).map((r) => ({ k: r.k, v: r.newText ?? `+${f(r.neu)}${r.pct ? "%" : ""}`, tone: "good" as const }));
  if (it.enhance) lines.unshift({ k: "Cường hóa", v: `+${it.enhance}`, tone: "good" });
  return { title: itemName(it), color: itemColor(it), border: itemColor(it), sub: `Trang bị hồn sư · ${slotName}${t ? ` · ${t.name} (${t.color})` : ""}${eq ? ` · cấp vật phẩm ${eq.ilvl}` : ""}`, lines,
    foot: "Bấm: thẻ thao tác · bấm đúp hoặc kéo ra Túi: tháo" };
}

/** Mở Túi (nếu đang đóng) ở chế độ chọn món cho ô vừa bấm; màn hẹp (một bảng một lúc) thì Túi nổi lên, màn rộng giữ bảng này ở trên. */
function openBagFor() {
  const el = document.getElementById("bag");
  if (el?.hidden) toggleBag(true);
  raisePanel(document.body.classList.contains("ui-w560") ? "bag" : "char"); // màn hẹp: Túi nổi lên kể cả khi đã mở sẵn (bảng kia bị ẩn)
}
/** Sau khi chọn món: màn hẹp thì đưa bảng Nhân vật nổi lại để thấy kết quả. */
const backToChar = () => raisePanel("char");

/** Thẻ dưới búp bê cho ô đang chọn: món đang gắn (chỉ số, nút Tháo) hoặc lời nhắc chọn món trong Túi. */
function slotCard(title: string, cur: BagItem | undefined, hint: string, lines: string[], unequip: (it: BagItem) => void, close: () => void) {
  const box = mk("div", "binfo cpick");
  box.appendChild(mk("b", "", cur ? itemName(cur) : title)); if (cur) (box.firstChild as HTMLElement).style.color = itemColor(cur);
  box.appendChild(mk("small", "", cur ? title : hint));
  if (cur) for (const l of lines) box.appendChild(mk("p", "", l));
  const row = mk("div", "brow");
  if (cur) {
    const off = mk("button", "buse drop", "Tháo về túi"); off.type = "button"; off.setAttribute("aria-label", `Tháo ${itemName(cur)} về túi đồ`);
    off.addEventListener("click", () => { off.blur(); unequip(cur); });
    row.appendChild(off);
    box.appendChild(mk("small", "", hint));
  }
  const x = mk("button", "buse", "Bỏ chọn"); x.type = "button"; x.addEventListener("click", () => { x.blur(); close(); });
  row.appendChild(x); box.appendChild(row);
  return box;
}

/**
 * Vẽ bảng: `data` võ hồn sở hữu, `items` túi (món có `vohon` là món đang gắn), `stats` tin "stats" mới nhất (null = chưa nhận),
 * `act` thao tác. Chọn võ hồn ở dải thẻ trên cùng (mặc định võ hồn ra trận).
 */
export function renderChar(data: OwnedVohons, items: BagItem[], stats: StatsMsg | null, act: CharActions) {
  const el = $("#char"); again = () => renderChar(data, items, stats, act);
  if (el.hidden) return;
  const keep = el.scrollTop;
  el.innerHTML = "";
  const prevRow = charRow;
  if (charRow === null || !data.list.some((v) => v.rowId === charRow)) charRow = data.active;
  const v = data.list.find((x) => x.rowId === charRow) ?? data.list[0]; if (!v) return;
  if (prevRow !== charRow) { selBone = null; selCore = null; }
  const def = VOHON[Math.max(0, vohonIndex(v.vohon))], rings = v.rings.map(tierOfYears);
  const rerender = () => again?.();
  // NV3 (#457): ô búp bê vừa nhận thả (xanh / đỏ theo acceptsItem), vừa là nguồn kéo khi đang có món (kéo ra Túi = tháo; ô cùng loại = đổi chỗ).
  // Thả về chính ô cũ hoặc thả sai chỗ: không gửi gì, bóng bay về. Server từ chối thì lý do hiện ở thông báo trên bảng (charLog).
  const rv = { rowId: v.rowId };
  const wire = (b: HTMLElement, ref: SlotRef, worn: BagItem | undefined) => {
    addZone({ el: b, kind: "slot",
      test: (d) => ("bagIndex" in d.from || !sameSlot(d.from, ref) ? acceptsItem(ref, d.item, rv) : { ok: true }),
      drop: (d) => { if (!("bagIndex" in d.from) && sameSlot(d.from, ref)) return; const c = mountCommand(d.item, ref, rv); if (c) send(() => act.send(c)); } });
    if (worn) {
      dragSource(b, () => ({ item: worn, from: ref }));
      b.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.shiftKey) { e.preventDefault(); const c = unmountCommand(worn, ref); if (c) send(() => act.send(c)); } }); // Shift+Enter: tháo nhanh
    }
  };
  /** Bấm đúp ô đang có món = tháo về túi (true nếu đã xử lý). */
  const dblUnmount = (b: HTMLElement, ref: SlotRef, worn: BagItem | undefined) => {
    if (!worn || !isDouble(`${ref.tab}:${ref.slot}:${ref.rowId}`)) return false;
    const c = unmountCommand(worn, ref); if (c) send(() => act.send(c));
    selBone = null; selCore = null; b.blur(); rerender(); return true;
  };
  const pickTab = (t: DollTab) => { tab = t; selBone = null; selCore = null; selEquip = null; notice = null; rerender(); };

  // Đầu bảng: tên, nút sang Đội hình (nâng cao: thức tỉnh, dung hợp, danh sách), đóng.
  const head = mk("div", "rhead");
  head.innerHTML = `<b>Hồn sư</b><span><button class="rlink" type="button">Đội hình</button><button class="x" type="button" aria-label="Đóng">×</button></span>`;
  head.querySelector("span")!.prepend(swapButton("char", setPanel));
  head.querySelector(".x")!.addEventListener("click", () => toggleChar(false));
  head.querySelector(".rlink")!.addEventListener("click", () => toggleRoster(true));
  el.appendChild(head);

  // Dải chọn võ hồn trong đội (4 ô): quyết định võ hồn nhận hồn cốt / hồn hạch; võ hồn ra trận có dấu ◆. Cuối dải: nút Ra trận.
  const strip = mk("div", "cstrip");
  const tabs = mk("div", "ctabs"); tabs.setAttribute("role", "tablist");
  const inTeam = data.team.map((r) => data.list.find((x) => x.rowId === r)).filter((x): x is NonNullable<typeof x> => !!x);
  if (!inTeam.some((x) => x.rowId === v.rowId)) inTeam.push(v);
  for (const o of inTeam.slice(0, TEAM_SIZE + 1)) {
    const od = VOHON[Math.max(0, vohonIndex(o.vohon))], b = mk("button", "ui-tab");
    b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(o.rowId === v.rowId)); b.style.setProperty("--c", od.col);
    b.textContent = `${od.name}${o.rowId === data.active ? " ◆" : ""}`;
    b.addEventListener("click", () => { b.blur(); charRow = o.rowId; selBone = null; selCore = null; act.ask(o.rowId); rerender(); });
    tabs.appendChild(b);
  }
  strip.appendChild(tabs);
  const teamAt = data.team.indexOf(v.rowId), isActive = v.rowId === data.active;
  const go = mk("button", "buse use cgo", isActive ? "Đang ra trận" : "Ra trận"); go.type = "button";
  go.disabled = isActive || teamAt < 0;
  go.title = isActive ? `${def.name} đang ra trận` : teamAt < 0 ? `${def.name} chưa trong đội: xếp đội ở bảng Đội hình (V)` : `Đổi ${def.name} ra trận`;
  go.setAttribute("aria-label", go.title);
  go.addEventListener("click", () => { go.blur(); send(() => act.switchTo(teamAt)); });
  strip.appendChild(go);
  el.appendChild(strip);

  // Bốn tab búp bê.
  const mine = items.filter((i) => i.vohon === v.rowId && coreOf(i)), bySlot = new Map<number, BagItem>();
  for (const it of mine) { const s = coreSlotOf(it.stats); if (s >= 0) bySlot.set(s, it); }
  const worn = new Map<string, BagItem & { years: number }>();
  for (const it of items) { const b = boneOf(it); if (b && it.vohon === v.rowId && it.years !== null) worn.set(b.slot, it as BagItem & { years: number }); }
  const dtabs = mk("div", "cdtabs"); dtabs.setAttribute("role", "tablist");
  const gearBy = new Map<string, GearItem>();
  for (const g of act.gear()) { const sid = EQUIP_SLOTS[g.slot]?.id; if (sid) gearBy.set(sid, g); }
  const counts: Record<DollTab, string> = { equip: `${gearBy.size}/${EQUIP_SLOTS.length}`, bone: `${worn.size}/${BONE_SLOTS.length}`, core: `${bySlot.size}/${CORE_SLOTS}`, vohon: `${inTeam.length}/${TEAM_SIZE}` };
  for (const t of TABS) {
    const b = mk("button", "ui-tab"); b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(tab === t.id)); b.dataset.tab = t.id;
    b.innerHTML = `${t.name} <small>${counts[t.id]}</small>`;
    b.addEventListener("click", () => { b.blur(); pickTab(t.id); });
    dtabs.appendChild(b);
  }
  el.appendChild(dtabs);
  if (notice) { const n = mk("small", "cnote" + (notice.bad ? " warn" : " ok"), notice.text); n.setAttribute("role", "status"); el.appendChild(n); }
  if (act.combat() && (tab === "bone" || tab === "core")) el.appendChild(mk("small", "cnote warn", "Đang giao chiến: rời xa hồn thú vài giây rồi mới gắn / tháo được."));

  const body = mk("div", "cbody"); el.appendChild(body);
  const left = mk("div", "ccolL"), right = mk("div", "ccolR"); body.append(left, right);

  const setsEl = mk("div", "csets");
  const counts6 = coreSetCounts(wornCores(mine));

  if (tab === "equip") {
    // --- Trang bị (NV4 #458): 10 ô kiểu Mir2, ảnh món + khung viền theo bậc + "+N"; ô trống là hình bóng của ô. Đọc từ tin riêng "gear";
    // mặc / tháo bằng equipgear / unequipgear (NV3: kéo thả, bấm đúp, thẻ thao tác). Bấm ô trống: Túi sáng món hợp ô, bấm món là mặc. ---
    left.appendChild(mk("small", "cshead", `Trang bị hồn sư (${gearBy.size}/${EQUIP_SLOTS.length})`));
    const fig = mk("div", "edoll");
    const cell = (id: string) => {
      const s = EQUIP_SLOTS.find((x) => x.id === id)!, g = gearBy.get(id), it = g && gearAsBagItem(g), ref: SlotRef = { tab: "equip", slot: id, rowId: null };
      const tpl = it ? equipTemplate(parseEquip(it.stats)?.tpl) : undefined;
      const b = mk("button", "bcell ecell ui-cell" + (it ? "" : " empty") + (selEquip === id ? " sel" : "")); b.type = "button"; b.dataset.slot = id;
      b.setAttribute("aria-pressed", String(selEquip === id));
      if (it) {
        b.style.setProperty("--c", itemColor(it)); b.dataset.etier = String(tpl?.tier ?? 0);
        const art = itemArt(it);
        b.innerHTML = `${art}${tpl ? artImg(equipFrameKey(tpl.tier), "efr") : ""}`;
        if (!art) b.appendChild(mk("span", "", itemName(it)));
        if (it.enhance) b.appendChild(mk("b", "enh", `+${it.enhance}`));
        b.setAttribute("aria-label", `Ô ${s.name}: ${itemName(it)}${tpl ? `, ${EQUIP_TIERS[tpl.tier].name}` : ""}`);
        setTip(b, equipTip(it, s.name));
      } else {
        b.innerHTML = artImg(equipSlotIconKey(s.id), "ico art esil");
        b.appendChild(mk("span", "", s.name)); b.setAttribute("aria-label", `Ô ${s.name}: trống`);
        setTip(b, { title: `Ô ${s.name} trống`, lines: ["Trang bị thuộc hồn sư, dùng chung cho cả đội."], foot: "Bấm để chọn món trong Túi · kéo món từ Túi thả vào · bấm đúp món trong Túi để mặc" });
      }
      wire(b, ref, it);
      b.addEventListener("click", () => {
        if (!it) { b.blur(); selEquip = selEquip === id ? null : id; if (selEquip) openBagFor(); rerender(); return; }
        if (dblUnmount(b, ref, it)) return;
        showCard(b, itemName(it), itemColor(it), `Trang bị hồn sư · ${s.name}`, cardActions(it, { view: { rowId: v.rowId, bag: items, gear: act.gear() }, worn: true }),
          (a) => { const c = a === "unmount" ? unmountCommand(it, ref) : null; if (c) send(() => act.send(c)); });
      });
      return b;
    };
    const col = (ids: string[], cls: string) => { const c = mk("div", "ecol " + cls); for (const id of ids) c.appendChild(cell(id)); return c; };
    const mid = mk("div", "emid"), src = act.portrait(v.vohon);
    mid.innerHTML = src ? `<img alt="" src="${src}">` : `<i class="dot"></i>`;
    mid.appendChild(cell("ao")); // Áo đè lên thân hình hồn sư (Mir2)
    fig.append(col(EQUIP_LEFT, "l"), mid, col(EQUIP_RIGHT, "r"));
    left.appendChild(fig);
    const es = selEquip ? EQUIP_SLOTS.find((x) => x.id === selEquip) : undefined;
    if (es) left.appendChild(mk("small", "cnote ok", `Ô ${es.name} trống: bấm một món sáng viền vàng trong Túi để mặc.`));
    left.appendChild(mk("small", "rnote", "Trang bị thuộc hồn sư (không phụ thuộc võ hồn đang xem). Kéo từ Túi thả vào ô (xanh = hợp, đỏ = sai ô), bấm đúp món trong Túi để mặc nhanh; kéo món đang mặc ra Túi hoặc bấm đúp để tháo."));
  } else if (tab === "bone") {
    // --- Hồn cốt: 6 ô quanh hình võ hồn ---
    const fig = mk("div", "bfig cdoll"); fig.style.setProperty("--c", def.col);
    const mid = mk("div", "bmid"); mid.style.gridArea = "2 / 2";
    const src = act.portrait(v.vohon);
    mid.innerHTML = src ? `<img alt="" src="${src}">` : `<i class="dot"></i>`;
    mid.appendChild(mk("small", "", def.name));
    mid.appendChild(mk("small", "cstar", `${v.stars}★ · cấp ${v.level}`));
    fig.appendChild(mid);
    for (const s of BONE_SLOTS) {
      const it = worn.get(s.id), b = mk("button", "bcell ui-cell" + (it ? "" : " empty") + (selBone === s.id ? " sel" : ""));
      b.type = "button"; b.style.gridArea = BONE_AREA[s.id]; b.dataset.slot = s.id;
      if (it) { b.style.setProperty("--c", itemColor(it)); b.dataset.tier = String(tierOfYears(it.years)); }
      const kb = it ? boneOf(it) : null, k = kb ? boneSkillOf(kb.beast, s.id) : null, kname = k ? (k.active ? k.sk.name : k.ps.name) : "";
      b.innerHTML = `${it ? boneIcon(s.id, itemColor(it)) : boneSvg(s.id)}<span>${s.name}</span>${it ? `<small>${yearsShort(it.years)}</small>` : ""}${it?.enhance ? `<b class="enh">+${it.enhance}</b>` : ""}${kname ? "<em></em>" : ""}`;
      if (kname) b.querySelector("em")!.textContent = kname;
      b.setAttribute("aria-label", `Ô ${s.name}: ${it ? itemName(it) : "trống"}`); b.setAttribute("aria-pressed", String(selBone === s.id));
      setTip(b, it ? wornTip(it) : { title: `Ô ${s.name} trống`, lines: [`Hồn cốt ${s.name.toLowerCase()}, kỹ năng ${s.active ? "chủ động" : "bị động"}.`], foot: "Bấm để chọn món trong Túi" });
      const ref: SlotRef = { tab: "bone", slot: s.id, rowId: v.rowId };
      wire(b, ref, it);
      b.addEventListener("click", () => { if (dblUnmount(b, ref, it)) return; b.blur(); selBone = selBone === s.id ? null : s.id; if (selBone) openBagFor(); rerender(); });
      fig.appendChild(b);
    }
    left.append(mk("small", "cshead", "Hồn cốt"), fig);
    const cs = selBone ? BONE_SLOTS.find((x) => x.id === selBone) : undefined;
    if (cs) {
      const cur = worn.get(cs.id), kb = cur ? boneOf(cur) : null;
      left.appendChild(slotCard(cur ? `Đang gắn ở ô ${cs.name} của ${def.name}` : `Ô ${cs.name} trống`, cur,
        `Bấm một hồn cốt ${cs.name.toLowerCase()} sáng viền vàng trong Túi để gắn vào ${def.name}${cur ? " (món đang gắn về túi)" : ""}.`,
        cur && kb ? [`Cộng: ${boneFullText(cur)}.`, boneSkillText(kb.beast, cs.id, cur.years, cur.enhance)].filter(Boolean) : [],
        (it) => send(() => act.unequipBone(it.id)), () => { selBone = null; rerender(); }));
    } else left.appendChild(mk("small", "rnote", "Bấm một ô để mở Túi: món hợp ô sáng lên, bấm món là gắn vào võ hồn đang chọn."));
  } else if (tab === "core") {
    // --- Hồn hạch: vòng đan điền 6 ô quanh tâm; bộ 2 / 4 món sáng màu bộ ---
    const sets = [...counts6].sort((a, b) => b[1] - a[1] || coreSetIndex(a[0]) - coreSetIndex(b[0]));
    const top = sets[0], topSet = top ? coreSet(top[0]) : undefined;
    const ring = mk("div", "cring6"); ring.style.setProperty("--c", def.col);
    for (let s = 0; s < CORE_SLOTS; s++) {
      const it = bySlot.get(s), c = it ? coreOf(it) : null, n = c ? counts6.get(c.set) ?? 0 : 0, cs = c ? coreSet(c.set) : undefined;
      const b = mk("button", "bcell ccell ui-cell" + (it ? "" : " empty") + (selCore === s ? " sel" : "") + (n >= CORE_SET_2 ? " seton" : ""));
      b.type = "button"; b.dataset.slot = String(s);
      const a = ((-90 + (360 / CORE_SLOTS) * s) * Math.PI) / 180;
      b.style.left = `${50 + 37 * Math.cos(a)}%`; b.style.top = `${50 + 37 * Math.sin(a)}%`;
      if (it) b.style.setProperty("--c", itemColor(it));
      if (n >= CORE_SET_2 && cs) b.style.setProperty("--sc", cs.col);
      b.innerHTML = `${coreSvg(c?.set ?? "")}${it ? `<small>${it.stars ?? 1}★</small>` : ""}${it?.enhance ? `<b class="enh">+${it.enhance}</b>` : ""}`;
      b.setAttribute("aria-label", `Ô hồn hạch ${s + 1}: ${it ? itemName(it) : "trống"}${n >= CORE_SET_2 && cs ? `, bộ ${cs.name} đang kích hoạt` : ""}`); b.setAttribute("aria-pressed", String(selCore === s));
      setTip(b, it ? wornTip(it) : { title: `Ô hồn hạch ${s + 1} trống`, lines: ["Nhận mọi hồn hạch."], foot: "Bấm để chọn món trong Túi" });
      const ref: SlotRef = { tab: "core", slot: s, rowId: v.rowId };
      wire(b, ref, it);
      b.addEventListener("click", () => { if (dblUnmount(b, ref, it)) return; b.blur(); selCore = selCore === s ? null : s; if (selCore !== null) openBagFor(); rerender(); });
      ring.appendChild(b);
    }
    const mid = mk("div", "cmid"); if (topSet) mid.style.setProperty("--sc", topSet.col);
    mid.innerHTML = `<b></b><small></small>`;
    mid.querySelector("b")!.textContent = topSet ? topSet.name : "Đan điền";
    mid.querySelector("small")!.textContent = top ? `${top[1]} / ${top[1] >= CORE_SET_2 ? CORE_SET_4 : CORE_SET_2} món` : `${bySlot.size}/${CORE_SLOTS} ô`;
    ring.appendChild(mid);
    left.append(mk("small", "cshead", `Hồn hạch (${bySlot.size}/${CORE_SLOTS})`), ring);
    if (selCore !== null) {
      const cur = bySlot.get(selCore), c = cur ? coreOf(cur) : null, cs = c ? coreSet(c.set) : undefined;
      left.appendChild(slotCard(cur ? `Đang gắn ở ô ${selCore + 1} · bộ ${cs ? `${cs.name} (${cs.tag})` : "lạ"}` : `Ô hồn hạch ${selCore + 1} trống`, cur,
        `Bấm một hồn hạch sáng viền vàng trong Túi để gắn vào ô ${selCore + 1} của ${def.name}${cur ? " (món đang gắn về túi)" : ""}.`,
        cur ? [coreLines(cur).join(" · ")] : [], (it) => send(() => act.unequipCore(it.id)), () => { selCore = null; rerender(); }));
    } else left.appendChild(mk("small", "rnote", `${CORE_SET_2} món cùng bộ nhận hiệu ứng 2 món, ${CORE_SET_4} món nhận thêm hiệu ứng 4 món; ô nào cũng nhận mọi hồn hạch. Bấm một ô để mở Túi chọn món.`));
  } else {
    // --- Võ hồn: đội 4 ô, ra trận, 10 vòng màu niên hạn, sao, cấp ---
    left.appendChild(mk("small", "cshead", `Đội (${inTeam.filter((x) => data.team.includes(x.rowId)).length}/${TEAM_SIZE})`));
    const team = mk("div", "cteam");
    data.team.forEach((rowId, i) => {
      const o = data.list.find((x) => x.rowId === rowId), od = o && VOHON[Math.max(0, vohonIndex(o.vohon))];
      if (o && od) {
        const c = vohonCard(od, { level: o.level, stars: o.stars, rings: o.rings, slot: i + 1, active: o.rowId === data.active }, "button");
        c.classList.toggle("view", o.rowId === v.rowId); c.setAttribute("aria-pressed", String(o.rowId === v.rowId));
        c.addEventListener("click", () => { c.blur(); charRow = o.rowId; act.ask(o.rowId); rerender(); });
        team.appendChild(c);
      } else {
        const c = mk("div", "vcardx cempty"); c.innerHTML = `<i class="csl">${i + 1}</i><span>Ô trống</span><small>Xếp ở Đội hình (V)</small>`; c.setAttribute("aria-label", `Ô đội ${i + 1}: trống`);
        team.appendChild(c);
      }
    });
    left.appendChild(team);
    left.appendChild(mk("small", "cshead", `Hồn hoàn (${v.rings.length}/${MAX_RINGS})`));
    const col = mk("div", "crings"), loadout = loadoutOf(v.vohon, v.skills);
    for (let r = 0; r < MAX_RINGS; r++) {
      const open = r < v.rings.length, sk = ringSkill(v.vohon, r), at = loadout.indexOf(r);
      const b = mk("button", "cring ui-cell" + (open ? "" : " empty locked"));
      b.type = "button";
      if (open) b.dataset.tier = String(rings[r]);
      let need = 1; while (!atBottleneck(need, r)) need++; // cấp bình cảnh mở vòng thứ r + 1 (cùng hàm server dùng)
      b.innerHTML = `<i class="rdot"></i>${sk && open ? skillImg(v.vohon, r, "sico") : ""}<span></span><em></em>`;
      b.querySelector("span")!.textContent = open ? `${r + 1}. ${sk?.name ?? TIERS[rings[r]].color}` : `${r + 1}. Chưa mở`;
      b.querySelector("em")!.textContent = open ? (at >= 0 ? SKILL_KEYS[at] : "") : `Cấp ${need}`;
      b.setAttribute("aria-label", open ? `Vòng ${r + 1}: ${TIERS[rings[r]].color}, ${formatYears(v.rings[r])}${sk ? `, hồn kỹ ${sk.name}` : ""}` : `Vòng ${r + 1}: chưa mở, mở ở cấp ${need}`);
      if (sk) setTip(b, skillSpec(sk, r, rings, v.rings, v.stars));
      else setTip(b, open ? { title: `Vòng ${r + 1}: ${TIERS[rings[r]].color}`, color: TIERS[rings[r]].glow, border: TIERS[rings[r]].col, lines: [`${formatYears(v.rings[r])}.`, "Chưa có hồn kỹ ở vòng này (bản sau): vòng chỉ tăng chỉ số."] }
        : { title: `Vòng ${r + 1}: chưa mở`, lines: [`Hấp thụ hồn hoàn khi tới bình cảnh cấp ${need}.`] });
      col.appendChild(b);
    }
    left.appendChild(col);
    const adv = mk("button", "rlink cadv", "Đội hình (V): thức tỉnh, dung hợp, danh sách võ hồn…"); adv.type = "button";
    adv.addEventListener("click", () => { adv.blur(); toggleRoster(true); });
    left.appendChild(adv);
  }

  // Bộ hồn hạch đang có của võ hồn này (đủ 2 / 4 món thì hiệu ứng sáng).
  if (!counts6.size) setsEl.appendChild(mk("small", "", `Chưa có bộ: ${CORE_SET_2} món cùng bộ nhận hiệu ứng 2 món, ${CORE_SET_4} món nhận thêm hiệu ứng 4 món.`));
  for (const [set, n] of [...counts6].sort((a, b) => b[1] - a[1] || coreSetIndex(a[0]) - coreSetIndex(b[0]))) {
    const cs = coreSet(set), row = mk("div", "cset" + (n >= CORE_SET_2 ? " on" : ""));
    if (cs) row.style.setProperty("--c", cs.col);
    row.innerHTML = `${coreSvg(set)}<span><b></b><small></small><small></small></span>`;
    row.querySelector("b")!.textContent = `${cs ? `${cs.name} (${cs.tag})` : "Bộ lạ"} · ${n} món`;
    const [s2, s4] = row.querySelectorAll("small");
    s2.textContent = `${n >= CORE_SET_2 ? "✓" : `${n}/${CORE_SET_2}`} 2 món: ${cs?.set2 ?? "không rõ"}`; s2.classList.toggle("on", n >= CORE_SET_2);
    s4.textContent = `${n >= CORE_SET_4 ? "✓" : `${n}/${CORE_SET_4}`} 4 món: ${cs?.set4 ?? "không rõ"}`; s4.classList.toggle("on", n >= CORE_SET_4);
    setsEl.appendChild(row);
  }

  // --- Chỉ số: nhóm chính / phụ (số từ tin "stats" của server) ---
  const st = stats && stats.rowId === v.rowId ? stats : null;
  right.appendChild(mk("small", "cshead", "Chỉ số"));
  const box = mk("div", "cstats");
  const group = (name: string) => { box.appendChild(mk("small", "cgroup", name)); };
  const row = (name: string, tip: string, val: string, extra: string, lbl: string) => {
    const r = mk("div", "cstat"); r.tabIndex = 0;
    r.append(mk("span", "", name), mk("b", "", val)); if (extra) r.appendChild(mk("em", "", extra));
    r.setAttribute("aria-label", `${name} ${val}${extra ? `, ${extra}` : ""}`);
    setTip(r, { title: name, lines: [tip, ...(lbl ? [{ v: lbl, tone: "good" as const }] : [])] });
    box.appendChild(r);
  };
  if (!st) box.appendChild(mk("small", "", "Đang nhận chỉ số từ máy chủ…"));
  else {
    const { total: t, base: b } = st, d = (x: number, y: number, f = num) => (Math.round(x - y) > 0 ? `+${f(x - y)}` : "");
    const dp = (x: number, y: number) => (x - y > 1e-9 ? `+${pct(x - y)}` : "");
    const src = "từ hồn cốt, hồn hạch";
    group("Chính");
    row("Sinh lực", "Chịu được bao nhiêu sát thương trước khi gục.", num(t.maxHp), d(t.maxHp, b.maxHp), d(t.maxHp, b.maxHp) && `${d(t.maxHp, b.maxHp)} ${src}`);
    row("Hồn lực", "Tiêu hao khi tung hồn kỹ; hồi dần theo thời gian.", num(t.maxMp), d(t.maxMp, b.maxMp), d(t.maxMp, b.maxMp) && `${d(t.maxMp, b.maxMp)} ${src}`);
    row("Công", "Sức đánh gốc của đòn thường và hồn kỹ.", num(t.atk), d(t.atk, b.atk), d(t.atk, b.atk) && `${d(t.atk, b.atk)} ${src}`);
    group("Phụ");
    row("Tốc độ", "Tốc độ đi bộ; ngoài giao chiến chạy nhanh hơn.", num(t.speed), "", "");
    row("Chí mạng", "Tỉ lệ đòn đánh vào hồn thú gây chí mạng.", pct(t.crit), dp(t.crit, b.crit), dp(t.crit, b.crit) && `${dp(t.crit, b.crit)} ${src}`);
    row("Sát thương chí mạng", "Hệ số nhân sát thương khi đòn chí mạng.", `×${t.critMult.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}`,
      t.critMult - b.critMult > 1e-9 ? `+${(t.critMult - b.critMult).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}` : "", "");
  }
  if (st?.gear && (st.gear.weapon || st.gear.red > 0 || st.gear.luck > 0)) { // chỉ số riêng của trang bị hồn sư (server tính, đã nằm trong số trên)
    group("Từ trang bị hồn sư");
    if (st.gear.weapon) row("Công mỗi đòn", "Công cộng từ vũ khí: mỗi đòn tung ngẫu nhiên trong khoảng này.", `${num(st.gear.weapon.min)}–${num(st.gear.weapon.max)}`, "", "");
    if (st.gear.red > 0) row("Giảm sát thương nhận", "Phần trang bị giảm sát thương nhận (cộng với bị động hồn cốt, có trần).", pct(st.gear.red), "", "");
    if (st.gear.luck > 0) row("May mắn", "Vũ khí / dây chuyền: càng cao đòn vũ khí càng hay ra công lớn.", String(st.gear.luck), "", "");
  }
  right.appendChild(box);
  right.appendChild(mk("small", "cshead", "Bộ hồn hạch")); right.appendChild(setsEl);
  const stx = starSkillText(v.stars);
  if (stx) right.appendChild(mk("small", "rnote", stx));

  const foot = mk("small", "rnote", "Số liệu do máy chủ tính, dùng đúng khi đánh. Gắn / tháo ngay trên bảng; nâng cao (thức tỉnh, dung hợp, danh sách võ hồn) ở bảng Đội hình (V). Phím H / C mở / đóng.");
  el.appendChild(foot);
  el.scrollTop = keep;

  // Ô đang chọn quyết định chế độ chọn món của Túi (đặt cuối: dùng dữ liệu vừa vẽ; Túi chỉ vẽ lại khi ô chọn đổi).
  const mkFocus = (key: string, group: string, label: string, match: (it: BagItem) => boolean, mount: (it: BagItem) => void) =>
    setBagFocus({ key, group, label, match: (it) => it.vohon === null && match(it),
      pick: (it) => { send(() => mount(it)); selBone = null; selCore = null; selEquip = null; backToChar(); rerender(); },
      cancel: () => { selBone = null; selCore = null; selEquip = null; rerender(); } });
  if (tab === "bone" && selBone) {
    const slot = selBone, s = BONE_SLOTS.find((x) => x.id === slot)!;
    mkFocus(`bone:${v.rowId}:${slot}`, "hon_cot", `Hồn cốt ${s.name.toLowerCase()} cho ${def.name}`, (it) => boneOf(it)?.slot === slot, (it) => act.equipBone(it.id, v.rowId, slot));
  } else if (tab === "core" && selCore !== null) {
    const slot = selCore;
    mkFocus(`core:${v.rowId}:${slot}`, "hon_hach", `Hồn hạch cho ô ${slot + 1} của ${def.name}`, (it) => !!coreOf(it), (it) => act.equipCore(it.id, v.rowId, slot));
  } else if (tab === "equip" && selEquip && !gearBy.has(selEquip)) {
    const slot = selEquip, s = EQUIP_SLOTS.find((x) => x.id === slot)!;
    mkFocus(`equip:${slot}`, "all", `Trang bị ô ${s.name}`, (it) => it.code === EQUIP_ITEM && equipTemplate(parseEquip(it.stats)?.tpl)?.slot === slot,
      (it) => act.send({ msg: "equipgear", data: { id: it.id } }));
  } else setBagFocus(null);
}
