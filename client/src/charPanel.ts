// Bảng nhân vật "Hồn sư" (UI-2, #352): búp bê trang bị (hồn cốt quanh hình võ hồn, hàng hồn hạch), hồn hoàn theo màu niên hạn, chỉ số tách
// nhóm chính / phụ, bộ hồn hạch. Chỉ hiển thị: chỉ số tổng hợp là tin riêng "stats" do server tính (MapRoom.sendStats, đúng công thức
// calcStats dùng khi đánh), client không tính lại. Gắn / tháo / đổi võ hồn làm ở bảng Đội hình (V): ô trên bảng này mở bảng đó đúng chỗ.
import { TIERS, VOHON, BONE_SLOTS, CORE_SLOTS, CORE_SET_2, CORE_SET_4, MAX_RINGS, TEAM_SIZE, atBottleneck, tierOfYears, vohonIndex,
  ringSkill, loadoutOf, formatYears, coreSetCounts, coreSetIndex, coreSlotOf, boneSkillOf } from "../../shared/data.ts";
import type { OwnedVohons, BagItem } from "./net.ts";
import { boneSvg } from "./boneIcons.ts";
import { coreSvg } from "./coreIcons.ts";
import { setTip, type TipSpec, type TipLine } from "./tooltip.ts";
import { itemColor, itemName, boneOf, coreOf, coreSet, coreLines, wornCores, boneIcon, yearsShort, boneFullText, boneSkillText, skillSpec, SKILL_KEYS,
  starSkillText, toggleRoster, toggleBag, toggleReso, toggleWorld, toggleFriends, closeNpc, openBones, openCores } from "./hud.ts";

/** Bộ chỉ số server gửi (kết quả calcStats). */
export interface StatBlock { maxHp: number; maxMp: number; atk: number; speed: number; crit: number; critMult: number; }
/** Tin riêng "stats": `total` là chỉ số thật của võ hồn `rowId`, `base` là khi không gắn hồn cốt / hồn hạch. */
export interface StatsMsg { rowId: number; total: StatBlock; base: StatBlock; }
export interface CharActions { portrait(vohon: string): string; ask(rowId: number | null): void; }

const $ = (s: string) => document.querySelector(s) as HTMLElement;
let charRow: number | null = null;   // võ hồn đang xem (null = võ hồn ra trận)
let again: (() => void) | null = null;
const BONE_AREA: Record<string, string> = { dau: "1 / 2", tay_trai: "2 / 1", tay_phai: "2 / 3", than: "3 / 2", chan_trai: "3 / 1", chan_phai: "3 / 3" };

/** Mở / đóng bảng (phím H, nút "Hồn sư"); mở thì đóng các bảng cùng chỗ giữa màn hình và xin chỉ số mới. */
export function toggleChar(open = $("#char").hidden) {
  const el = $("#char");
  if (el.hidden === !open) return open;
  el.hidden = !open; document.getElementById("charBtn")?.setAttribute("aria-expanded", String(open));
  if (open) { toggleRoster(false); toggleBag(false); toggleReso(false); toggleWorld(false); toggleFriends(false); closeNpc(); onOpen?.(); again?.(); }
  else charRow = null;
  return open;
}
let onOpen: (() => void) | null = null;
/** Võ hồn đang xem trên bảng (null = võ hồn ra trận): GameScene xin "stats" đúng võ hồn này. */
export const charViewRow = () => charRow;
export const isCharOpen = () => !$("#char").hidden;
/** GameScene đăng ký: việc làm mỗi lần mở bảng (xin "stats"). */
export function onCharOpen(fn: () => void) { onOpen = fn; }

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
  return { title: itemName(it), color, border: itemColor(it), sub, lines, foot: "Bấm để gắn / tháo ở bảng Đội hình" };
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
  if (charRow === null || !data.list.some((v) => v.rowId === charRow)) charRow = data.active;
  const v = data.list.find((x) => x.rowId === charRow) ?? data.list[0]; if (!v) return;
  const def = VOHON[Math.max(0, vohonIndex(v.vohon))], rings = v.rings.map(tierOfYears);

  // Đầu bảng: tên, nút sang Đội hình, đóng.
  const head = mk("div", "rhead");
  head.innerHTML = `<b>Hồn sư</b><span><button class="rlink" type="button">Đội hình</button><button class="x" type="button" aria-label="Đóng">×</button></span>`;
  head.querySelector(".x")!.addEventListener("click", () => toggleChar(false));
  head.querySelector(".rlink")!.addEventListener("click", () => toggleRoster(true));
  el.appendChild(head);

  // Dải chọn võ hồn trong đội (4 ô); võ hồn ra trận có dấu ◆.
  const tabs = mk("div", "ctabs"); tabs.setAttribute("role", "tablist");
  const inTeam = data.team.map((r) => data.list.find((x) => x.rowId === r)).filter((x): x is NonNullable<typeof x> => !!x);
  if (!inTeam.some((x) => x.rowId === v.rowId)) inTeam.push(v);
  for (const o of inTeam.slice(0, TEAM_SIZE + 1)) {
    const od = VOHON[Math.max(0, vohonIndex(o.vohon))], b = mk("button", "ui-tab");
    b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(o.rowId === v.rowId)); b.style.setProperty("--c", od.col);
    b.textContent = `${od.name}${o.rowId === data.active ? " ◆" : ""}`;
    b.addEventListener("click", () => { b.blur(); charRow = o.rowId; act.ask(o.rowId); again?.(); });
    tabs.appendChild(b);
  }
  el.appendChild(tabs);

  const body = mk("div", "cbody"); el.appendChild(body);
  const left = mk("div", "ccolL"), right = mk("div", "ccolR"); body.append(left, right);

  // --- Búp bê: 6 ô hồn cốt quanh hình võ hồn ---
  const worn = new Map<string, BagItem & { years: number }>();
  for (const it of items) { const b = boneOf(it); if (b && it.vohon === v.rowId && it.years !== null) worn.set(b.slot, it as BagItem & { years: number }); }
  const fig = mk("div", "bfig cdoll"); fig.style.setProperty("--c", def.col);
  const mid = mk("div", "bmid"); mid.style.gridArea = "2 / 2";
  const src = act.portrait(v.vohon);
  mid.innerHTML = src ? `<img alt="" src="${src}">` : `<i class="dot"></i>`;
  mid.appendChild(mk("small", "", def.name));
  mid.appendChild(mk("small", "cstar", `${"★".repeat(v.stars)} cấp ${v.level}`));
  fig.appendChild(mid);
  for (const s of BONE_SLOTS) {
    const it = worn.get(s.id), b = mk("button", "bcell ui-cell" + (it ? "" : " empty"));
    b.type = "button"; b.style.gridArea = BONE_AREA[s.id];
    if (it) { b.style.setProperty("--c", itemColor(it)); b.dataset.tier = String(tierOfYears(it.years)); }
    const kb = it ? boneOf(it) : null, k = kb ? boneSkillOf(kb.beast, s.id) : null, kname = k ? (k.active ? k.sk.name : k.ps.name) : "";
    b.innerHTML = `${it ? boneIcon(s.id, itemColor(it)) : boneSvg(s.id)}<span>${s.name}</span>${it ? `<small>${yearsShort(it.years)}</small>` : ""}${it?.enhance ? `<b class="enh">+${it.enhance}</b>` : ""}${kname ? "<em></em>" : ""}`;
    if (kname) b.querySelector("em")!.textContent = kname;
    b.setAttribute("aria-label", `Ô ${s.name}: ${it ? itemName(it) : "trống"}`);
    setTip(b, it ? wornTip(it) : { title: `Ô ${s.name} trống`, lines: [`Hồn cốt ${s.name.toLowerCase()}, kỹ năng ${s.active ? "chủ động" : "bị động"}.`], foot: "Bấm để gắn ở bảng Đội hình" });
    b.addEventListener("click", () => { b.blur(); toggleChar(false); openBones("", s.id, v.rowId); });
    fig.appendChild(b);
  }
  left.appendChild(fig);

  // --- Hồn hạch: hàng 6 ô ---
  const mine = items.filter((i) => i.vohon === v.rowId && coreOf(i)), bySlot = new Map<number, BagItem>();
  for (const it of mine) { const s = coreSlotOf(it.stats); if (s >= 0) bySlot.set(s, it); }
  left.appendChild(mk("small", "cshead", "Hồn hạch"));
  const crow = mk("div", "crow");
  for (let s = 0; s < CORE_SLOTS; s++) {
    const it = bySlot.get(s), c = it ? coreOf(it) : null, b = mk("button", "bcell ccell ui-cell" + (it ? "" : " empty"));
    b.type = "button"; if (it) b.style.setProperty("--c", itemColor(it));
    b.innerHTML = `${coreSvg(c?.set ?? "")}${it ? `<small>${it.stars ?? 1}★</small>` : ""}${it?.enhance ? `<b class="enh">+${it.enhance}</b>` : ""}`;
    b.setAttribute("aria-label", `Ô hồn hạch ${s + 1}: ${it ? itemName(it) : "trống"}`);
    setTip(b, it ? wornTip(it) : { title: `Ô hồn hạch ${s + 1} trống`, lines: ["Nhận mọi hồn hạch."], foot: "Bấm để gắn ở bảng Đội hình" });
    b.addEventListener("click", () => { b.blur(); toggleChar(false); openCores("", v.rowId, s); });
    crow.appendChild(b);
  }
  left.appendChild(crow);

  // --- Bộ hồn hạch ---
  const counts = coreSetCounts(wornCores(mine)), sets = mk("div", "csets");
  if (!counts.size) sets.appendChild(mk("small", "", `Chưa có bộ: ${CORE_SET_2} món cùng bộ nhận hiệu ứng 2 món, ${CORE_SET_4} món nhận thêm hiệu ứng 4 món.`));
  for (const [set, n] of [...counts].sort((a, b) => b[1] - a[1] || coreSetIndex(a[0]) - coreSetIndex(b[0]))) {
    const cs = coreSet(set), row = mk("div", "cset" + (n >= CORE_SET_2 ? " on" : ""));
    if (cs) row.style.setProperty("--c", cs.col);
    row.innerHTML = `${coreSvg(set)}<span><b></b><small></small><small></small></span>`;
    row.querySelector("b")!.textContent = `${cs ? `${cs.name} (${cs.tag})` : "Bộ lạ"} · ${n} món`;
    const [s2, s4] = row.querySelectorAll("small");
    s2.textContent = `${n >= CORE_SET_2 ? "✓" : `${n}/${CORE_SET_2}`} 2 món: ${cs?.set2 ?? "không rõ"}`; s2.classList.toggle("on", n >= CORE_SET_2);
    s4.textContent = `${n >= CORE_SET_4 ? "✓" : `${n}/${CORE_SET_4}`} 4 món: ${cs?.set4 ?? "không rõ"}`; s4.classList.toggle("on", n >= CORE_SET_4);
    sets.appendChild(row);
  }
  left.appendChild(sets);

  // --- Hồn hoàn: cột 10 vòng, vòng màu theo niên hạn; rê chuột ra hồn kỹ ---
  right.appendChild(mk("small", "cshead", `Hồn hoàn (${v.rings.length}/${MAX_RINGS})`));
  const col = mk("div", "crings"), loadout = loadoutOf(v.vohon, v.skills);
  for (let r = 0; r < MAX_RINGS; r++) {
    const open = r < v.rings.length, sk = ringSkill(v.vohon, r), at = loadout.indexOf(r);
    const b = mk("button", "cring ui-cell" + (open ? "" : " empty locked"));
    b.type = "button";
    if (open) b.dataset.tier = String(rings[r]);
    let need = 1; while (!atBottleneck(need, r)) need++; // cấp bình cảnh mở vòng thứ r + 1 (cùng hàm server dùng)
    b.innerHTML = `<i class="rdot"></i><span><b></b><small></small></span>`;
    b.querySelector("b")!.textContent = open ? `${r + 1}. ${TIERS[rings[r]].color}` : `${r + 1}. Chưa mở`;
    b.querySelector("small")!.textContent = open ? `${formatYears(v.rings[r])}${sk ? ` · ${sk.name}${at >= 0 ? ` [${SKILL_KEYS[at]}]` : ""}` : ""}` : `Mở ở cấp ${need}`;
    b.setAttribute("aria-label", open ? `Vòng ${r + 1}: ${TIERS[rings[r]].color}, ${formatYears(v.rings[r])}${sk ? `, hồn kỹ ${sk.name}` : ""}` : `Vòng ${r + 1}: chưa mở, mở ở cấp ${need}`);
    if (sk) setTip(b, skillSpec(sk, r, rings, v.rings, v.stars));
    else setTip(b, open ? { title: `Vòng ${r + 1}: ${TIERS[rings[r]].color}`, color: TIERS[rings[r]].glow, border: TIERS[rings[r]].col, lines: [`${formatYears(v.rings[r])}.`, "Chưa có hồn kỹ ở vòng này (bản sau): vòng chỉ tăng chỉ số."] }
      : { title: `Vòng ${r + 1}: chưa mở`, lines: [`Hấp thụ hồn hoàn khi tới bình cảnh cấp ${need}.`] });
    col.appendChild(b);
  }
  right.appendChild(col);

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
  right.appendChild(box);
  const stx = starSkillText(v.stars);
  if (stx) right.appendChild(mk("small", "rnote", stx));

  const foot = mk("small", "rnote", "Số liệu do máy chủ tính, dùng đúng khi đánh. Gắn / tháo hồn cốt, hồn hạch và đổi võ hồn ở bảng Đội hình (V). Phím H mở / đóng.");
  el.appendChild(foot);
  el.scrollTop = keep;
}
