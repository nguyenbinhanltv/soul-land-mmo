// Thanh kỹ năng / hồn cốt / chỉ số nhân vật và khung đội hình nhỏ của HUD (tách nguyên văn từ hud.ts, Part of #885 bước 2); hud.ts re-export để nơi gọi giữ nguyên.
import { TIERS, VOHON, ringLimit, tierOfYears, vohonIndex, SWITCH_CD, TIEN_CO_MAX, tienCoOf, skillPower, BUFF_IDS, BUFFS, buffBit, STATUS_IDS, STATUS, statusBit, formatYears, MAX_RINGS, atBottleneck, PHONG_LOI, starSkillMult, starCdMult, starTienCoMult, starRing, PLAYER_STATUS, BEAST_BUFF_IDS, BEAST_BUFFS, beastBuffBit, BONE_SLOTS, boneSlotIndex, boneName, BONE_ACTIVE_SLOTS, boneSkillOf, passiveText, buffPower, boneSkillMult, ringSkill, CHAN_THAN_RING, chanThanOf, chanThanStats, CHAN_THAN_SKILL_SLOT, CHAN_THAN_SKILL_CD, FUSION, FUSIONS, fusionsOf, type SkillDef, type ChanThanDef, type ChanThanStat } from "../../shared/data.ts";
import { artImg, artUrl, chanThanImg, fusionImg, skillImg } from "./uiArt.ts";
import { cbElementMark } from "./a11y.ts";
import { elementOfVohonIndex } from "./audio/soundMap.ts";
import { setTip, parseText, type TipLine, type TipSpec } from "./tooltip.ts";
import type { Vitals } from "../../shared/vitals.ts";
import type { OwnedVohons, Squad } from "./net.ts";
import { boneIcon, drawRecall, openBagTieuHao } from "./hud.ts";
import "./ui2-hud-stats.css";
import "./ui2-hud-act.css";
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;

export const ringColor = (t: number) => (t === 3 ? "#8a6bff" : TIERS[t].col);
/** Phím hồn kỹ 1–4 (từ bước 2.3a; phím số 1–4 dành cho đổi võ hồn trong đội). Mã phím là `Key` + chữ. */
export const SKILL_KEYS = ["U", "I", "O", "P"];
/** Phím kỹ năng hồn cốt chủ động (từ 4.3, chờ chốt) theo BONE_ACTIVE_SLOTS: Z đầu, X tay trái, C tay phải. */
export const BONE_SKILL_KEYS = ["Z", "X", "C"];

/** Hồi chiêu của hồn kỹ vòng `r` của võ hồn `stars` sao (9.5: vòng 1–4 từ 4★ ngắn hơn; server tính như nhau). */
export const skillCd = (s: SkillDef, r: number, stars: number) => s.cd * (starRing(r) ? starCdMult(stars) : 1);
export const cdText = (x: number) => String(Math.round(x * 100) / 100).replace(".", ",");
/** Dòng "Sao: hồn kỹ +x%…" của võ hồn `stars` sao (9.5, mục 5.1); 1★ thì "". */
export function starSkillText(stars: number) {
  if (starSkillMult(stars) <= 1) return "";
  const pct = (m: number) => `+${Math.round((m - 1) * 100)}%`;
  return `Sao: hồn kỹ ${pct(starSkillMult(stars))}` + (starCdMult(stars) < 1 ? `, hồi chiêu −${Math.round((1 - starCdMult(stars)) * 100)}%` : "")
    + `, tiên cơ riêng ${pct(starTienCoMult(stars))}`;
}
/** Chú thích một hồn kỹ của vòng `r` (chỉ số 0..9): tốn / hồi, sức mạnh theo số năm hồn hoàn (kèm sao võ hồn, 9.5), hoặc vòng cần để mở. */
export function skillSpec(s: SkillDef, r: number, rings: number[], years: number[] | null, stars: number): TipSpec {
  const has = r < rings.length, y = years?.[r] ?? (has ? TIERS[rings[r]].years : 0), sm = starRing(r) ? starSkillMult(stars) : 1;
  const lines: TipLine[] = [s.desc + "."];
  if (has) lines.push({ k: "Sức mạnh", v: `×${(skillPower(y) * sm).toFixed(2).replace(".", ",")}`, tone: "gem" },
    { k: "Hồn hoàn", v: `${y.toLocaleString("vi-VN")} năm${sm > 1 ? `, sao +${Math.round((sm - 1) * 100)}%` : ""}`, tone: "muted" });
  return { title: s.name, color: has ? TIERS[rings[r]].glow : undefined, border: has ? ringColor(rings[r]) : undefined,
    sub: `${s.ult ? "Tuyệt kỹ · " : ""}Vòng ${r + 1} · tốn ${s.cost} hồn lực · hồi ${cdText(skillCd(s, r, stars))} giây`, lines,
    foot: has ? undefined : `Mở khi có hồn hoàn thứ ${r + 1}.` };
}
// ---------- Ô kỹ năng dùng chung (UI-3, #353): hồi chiêu quét tròn + số giây, thiếu hồn lực, lý do trong chú thích ----------
/** Chú thích gốc của từng ô (chưa kèm lý do thiếu hồn lực); `cellTip` ghép lý do vào dòng cuối khi cần. */
const cellBase = new WeakMap<HTMLElement, TipSpec>();
/** Đặt chú thích gốc của ô kỹ năng; lý do đang áp dụng (`data-why`) giữ nguyên. */
function setCellTip(b: HTMLElement, spec: TipSpec | string) {
  const base = typeof spec === "string" ? parseText(spec) : spec;
  cellBase.set(b, base);
  setTip(b, b.dataset.why ? { ...base, foot: b.dataset.why } : base);
}
/** Giây còn lại, 1 chữ số thập phân khi dưới 3 giây (như đề xuất UI), làm tròn lên khi từ 3 giây. */
const cdLabel = (left: number) => (left < 0.05 ? "" : left < 3 ? left.toFixed(1).replace(".", ",") : String(Math.ceil(left)));
/**
 * Vẽ lại một ô kỹ năng mỗi khung hình (chỉ ghi DOM khi đổi): lớp quét tròn `--p` (phần hồi chiêu còn lại 0..1) và số giây,
 * nháy `.ready` một lần khi vừa hồi xong, `.nomp` khi hồn lực còn lại thấp hơn tiêu hao (số trên client, server vẫn kiểm lại, buff giảm
 * tiêu hao có thể làm số thật thấp hơn), lý do ghi ở dòng cuối chú thích. Ô khóa không quét, không báo thiếu hồn lực.
 */
function paintCell(b: HTMLElement, left: number, full: number, mp: number, cost: number) {
  const locked = b.classList.contains("locked");
  const p = locked || left <= 0 || full <= 0 ? 0 : Math.round(Math.min(1, left / full) * 100) / 100, txt = locked ? "" : cdLabel(left);
  if (b.dataset.p !== String(p)) { b.dataset.p = String(p); (b.querySelector(".ui-cd") as HTMLElement).style.setProperty("--p", String(p)); }
  const num = b.querySelector(".cdn"); if (num && num.textContent !== txt) num.textContent = txt;
  const cooling = p > 0;
  if (b.dataset.cool === "1" && !cooling && !locked) { b.classList.add("ready"); window.setTimeout(() => b.classList.remove("ready"), 900); }
  b.dataset.cool = cooling ? "1" : "0";
  const nomp = !locked && cost > 0 && mp < cost;
  b.classList.toggle("nomp", nomp);
  const disabled = String(locked);
  if (b.getAttribute("aria-disabled") !== disabled) b.setAttribute("aria-disabled", disabled);
  const state = b.querySelector(".sk-state"), stateText = locked ? "Khóa" : nomp ? "Thiếu lực" : "";
  if (state && state.textContent !== stateText) state.textContent = stateText;
  const why = nomp ? `Thiếu hồn lực: cần ${cost}, còn ${Math.floor(mp)}` : "";
  if ((b.dataset.why ?? "") !== why) { b.dataset.why = why; const base = cellBase.get(b); if (base) setTip(b, why ? { ...base, foot: why } : base); }
}
let lastMp = 0; // hồn lực hiện tại (updateStats ghi), để ô dung hợp tự đánh dấu thiếu hồn lực

let slotCd: number[] = [];  // hồi chiêu đầy của hồn kỹ ở từng ô (vẽ lớp phủ hồi chiêu trong updateStats)
let avaDef: ChanThanDef | null = null; // Võ Hồn Chân Thân của võ hồn ra trận (nút R), null = võ hồn chưa có
/** Hồn kỹ Chân Thân (9.6) hiện ở nút P khi đang biến hình; null = võ hồn chưa có Chân Thân. */
interface SlotView { name: string; icon: string; art: string; col: string; label: string; tip: TipSpec | string; cost: number; cd: number; tier: number; locked?: boolean; empty?: boolean }
let ctSlot: SlotView | null = null;
let pSlot: SlotView | null = null; // nội dung gốc của nút P (để trả lại khi hết Chân Thân)
/** Tráo nút P giữa hồn kỹ đang mang và hồn kỹ Chân Thân (class `ct`: viền vàng). Chỉ hiển thị; server quyết định ô P tung gì. */
function setCtSlot(b: HTMLElement, on: boolean) {
  const sp = b.querySelectorAll<HTMLElement>("span");
  if (on) pSlot = { name: sp[1].textContent ?? "", icon: sp[0].textContent ?? "", art: sp[0].classList.contains("skart") ? sp[0].innerHTML : "", col: sp[0].style.color, label: b.getAttribute("aria-label") ?? "",
    tip: cellBase.get(b) ?? "", cost: Number(b.dataset.cost), cd: Number(b.dataset.cdfull), tier: Number(b.dataset.tier ?? -1), locked: b.classList.contains("locked"), empty: b.classList.contains("empty") };
  const v = on ? ctSlot : pSlot; if (!v) return;
  b.classList.toggle("ct", on); b.classList.toggle("locked", !on && !!v.locked); b.classList.toggle("empty", !on && !!v.empty); // ô P trống vẫn hiện hồn kỹ Chân Thân khi biến hình
  b.dataset.cool = "0"; // đổi nội dung ô không phải "vừa hồi xong" (paintCell không nháy .ready)
  if (v.art) sp[0].innerHTML = v.art; else sp[0].textContent = v.icon;
  sp[0].classList.toggle("skart", !!v.art); sp[0].style.color = v.col; sp[1].textContent = v.name;
  b.dataset.cost = String(v.cost); b.dataset.cdfull = String(v.cd);
  if (v.tier >= 0) b.dataset.tier = String(v.tier); else delete b.dataset.tier;
  b.setAttribute("aria-label", v.label); setCellTip(b, v.tip);
}
/** Nút HUD: chuột / bút chạy ngay ở pointerdown (không chờ nhả); chạm chạy ở click (cuộn / kéo không kích hoạt), bàn phím (detail 0) cũng ở click.
 * Loại con trỏ ghi từ pointerdown vì click của Safari iOS / WebView không phải PointerEvent (pointerType undefined). */
function bindPress(b: HTMLElement, run: () => void) {
  let touchDown = false;
  b.addEventListener("pointerdown", (e) => { e.preventDefault(); touchDown = e.pointerType === "touch"; if (!touchDown) run(); });
  b.addEventListener("click", (e) => { if (e.detail === 0 || touchDown) { touchDown = false; run(); } });
}

/**
 * Thanh kỹ năng: đánh thường, 4 ô hồn kỹ mang theo của võ hồn ra trận (từ 8.1a theo `loadout`: chỉ số vòng ở từng ô U / I / O / P,
 * -1 = trống; vòng 1–4 riêng nếu có, không thì dùng chung; tên, biểu tượng, chú thích kèm sức mạnh theo số năm hồn hoàn), nút R Võ
 * Hồn Chân Thân (8.1a, chỉ khi võ hồn có dữ liệu; khóa tới vòng 7), hấp thụ. `years`: số năm từng hồn hoàn (tin riêng "vohons");
 * chưa có thì lấy mốc của bậc. `stars`: sao võ hồn ra trận (9.5: sức mạnh và hồi chiêu vòng 1–4). Nút G Võ Hồn Dung Hợp Kỹ (#193)
 * khi võ hồn ra trận có cặp trong FUSIONS và `fusion` (sân đấu cấm dung hợp nên không hiện).
 */
export function buildSkills(vh: number, rings: number[], years: number[] | null, loadout: readonly number[], act: (k: string) => void, stars = 1, fusion = true) {
  const el = $("#skills"); el.innerHTML = ""; slotCd = [];
  $("#itemActions").replaceChildren();
  const mk = (key: string, label: string, name: string, col: string, action: string, icon = "", locked = false, i?: number, tip: TipSpec | string = "",
    tier = -1, cost = 0, cdFull = 0, art = "") => {
    const b = document.createElement("button"); b.className = "sk ui-cell f2-o" + (locked ? " locked" : "");
    if (i !== undefined) b.dataset.i = String(i);
    if (tier >= 0 && !locked) b.dataset.tier = String(tier);   // viền theo màu hồn hoàn (--tier-N)
    b.dataset.cost = String(cost); b.dataset.cdfull = String(cdFull);
    b.innerHTML = `<b class="key">${key}</b><span class="ico" style="color:${col}"></span><span class="sk-name"></span><div class="ui-cd" aria-hidden="true"></div><em class="cdn" aria-hidden="true"></em><em class="sk-state" aria-hidden="true"></em>`;
    const sp = b.querySelectorAll("span"); if (art) { sp[0].insertAdjacentHTML("afterbegin", art); sp[0].classList.add("skart"); } else sp[0].textContent = icon;
    sp[1].textContent = name;
    b.setAttribute("aria-label", label);
    setCellTip(b, tip || { title: label, foot: `Phím ${key}` });
    b.setAttribute("aria-disabled", String(locked));
    b.querySelector(".sk-state")!.textContent = locked ? "Khóa" : "";
    const run = () => { if (!b.classList.contains("locked")) act(action); };
    bindPress(b, run);
    el.appendChild(b);
  };
  mk("J", "Đánh thường", "Đánh", VOHON[vh].col, "attack", "", false, undefined, "Đánh thường · phím J", -1, 0, 0, artImg("gi_menu_arena"));
  const id = VOHON[vh].id;
  loadout.forEach((r, i) => {
    const s = r >= 0 ? ringSkill(id, r) : null; slotCd[i] = s ? skillCd(s, r, stars) : 1;
    if (!s) {
      mk(SKILL_KEYS[i], `Ô hồn kỹ ${i + 1}: trống`, "Trống", "#666", `skill${i}`, "", true, i, { title: `Ô hồn kỹ ${i + 1}: trống`, lines: ["Chọn hồn kỹ mang theo ở bảng đội hình (V)."] });
      el.lastElementChild!.classList.add("empty"); // ô trống: chỉ viền mờ, không biểu tượng khóa
      return;
    }
    const has = r < rings.length;
    mk(SKILL_KEYS[i], `Ô hồn kỹ ${i + 1}: ${s.name} (vòng ${r + 1})${has ? "" : " (khóa)"}`, has ? s.name : `Vòng ${r + 1}`, has ? ringColor(rings[r]) : "#666",
      `skill${i}`, s.icon, !has, i, skillSpec(s, r, rings, years, stars), has ? rings[r] : -1, s.cost, skillCd(s, r, stars), skillImg(id, r));
  });
  avaDef = chanThanOf(id); el.classList.toggle("ava", !!avaDef);
  if (avaDef) {
    const ri = CHAN_THAN_RING - 1, has = rings.length > ri, y = years?.[ri] ?? (has ? TIERS[rings[ri]].years : 0);
    const st = has ? chanThanStats(avaDef, y) : avaDef.stats;
    mk(AVA_KEY, `Võ Hồn Chân Thân: ${avaDef.name}${has ? "" : " (khóa)"}`, has ? "Chân Thân" : `Vòng ${CHAN_THAN_RING}`, has ? ringColor(rings[ri]) : "#666", "chanthan", avaDef.icon, !has, undefined,
      { title: `Võ Hồn Chân Thân – ${avaDef.name}`, color: has ? TIERS[rings[ri]].glow : undefined,
        sub: `Vòng ${CHAN_THAN_RING} · biến hình ${avaDef.secs} giây · tốn ${avaDef.cost} hồn lực · hồi ${avaDef.cd} giây`,
        lines: [avaDef.desc + ".", `Khi biến hình, ô ${SKILL_KEYS[CHAN_THAN_SKILL_SLOT]} thành ${avaDef.skill.name}.`,
          ...(has ? [{ k: `Hồn hoàn ${y.toLocaleString("vi-VN")} năm`, v: chanThanText(st), tone: "gem" as const }] : [])],
        foot: has ? undefined : `Mở khi có hồn hoàn thứ ${CHAN_THAN_RING}.` }, has ? rings[ri] : -1, avaDef.cost, avaDef.cd, chanThanImg(id));
    el.lastElementChild!.classList.add("ava");
    // Hồn kỹ Chân Thân (9.6): nút P đổi sang hồn kỹ này khi đang biến hình (updateStats tráo nội dung, viền vàng).
    const s = avaDef.skill;
    ctSlot = { name: s.name, icon: s.icon, art: chanThanImg(id, true), col: has ? TIERS[rings[ri]].glow : "#666", label: `Hồn kỹ Chân Thân: ${s.name}`, cost: s.cost, cd: s.cd, tier: has ? rings[ri] : -1,
      tip: { title: s.name, color: has ? TIERS[rings[ri]].glow : undefined, sub: `Hồn kỹ Chân Thân · thay ô ${SKILL_KEYS[CHAN_THAN_SKILL_SLOT]} khi biến hình · tốn ${s.cost} hồn lực · hồi ${cdText(s.cd)} giây`,
        lines: [s.desc + ".", ...(has ? [{ k: "Sức mạnh", v: `×${skillPower(y).toFixed(2).replace(".", ",")}`, tone: "gem" as const },
          { k: `Hồn hoàn vòng ${CHAN_THAN_RING}`, v: `${y.toLocaleString("vi-VN")} năm`, tone: "muted" as const }] : [])] } };
  } else ctSlot = null;
  // Võ Hồn Dung Hợp Kỹ (#193, mục 5.9): mời đồng đội gần nhất, hoặc hưởng ứng khi được mời; server chọn người và kiểm mọi điều kiện.
  const fus = fusion ? fusionsOf(id) : [];
  el.classList.toggle("fus", fus.length > 0); fusBtn = null;
  if (fus.length) {
    const has = rings.length >= FUSION.minRings, mate = (f: (typeof FUSIONS)[number]) => VOHON[vohonIndex(f.pair[0] === id ? f.pair[1] : f.pair[0])]?.name ?? "";
    const tip = `Võ Hồn Dung Hợp Kỹ (phím ${FUSION_KEY}): ` + fus.map((f) => `${f.name} cùng đồng đội tổ đội ra trận ${mate(f)}: ${f.desc}`).join("; ")
      + `. Bấm để mời đồng đội gần nhất; đồng đội bấm ${FUSION_KEY} trong ${cdText(FUSION.window)} giây thì chiêu nổ ở điểm giữa hai người.`
      + ` Đứng cách nhau dưới ${FUSION.r} pixel, mỗi người tốn ${FUSION.cost} hồn lực, hồi ${FUSION.cd} giây (của hồn sư: đổi võ hồn không làm mới).`;
    mk(FUSION_KEY, `Võ Hồn Dung Hợp Kỹ: ${fus.map((f) => f.name).join(" / ")}${has ? "" : " (khóa)"}`, has ? "Dung hợp" : `Vòng ${FUSION.minRings}`,
      has ? VOHON[vh].col : "#666", "fusion", fus[0].icon, !has, undefined, has ? tip : { ...parseText(tip), foot: `Cần ít nhất ${FUSION.minRings} hồn hoàn.` }, -1, FUSION.cost, FUSION.cd, fusionImg(fus[0].name));
    fusBtn = el.lastElementChild as HTMLElement; fusBtn.classList.add("fus");
    fusLabel = fusBtn.querySelectorAll("span")[1];
  }
  mk("E", "Nhặt hồn hoàn", "Nhặt", "#ffe08a", "pickup", "", false, undefined, { title: "Nhặt hồn hoàn", lines: ["Nhặt hồn hoàn ở gần nhân vật."], foot: "Phím E" }, -1, 0, 0, artImg("item_hon_hoan"));
  $("#itemActions").appendChild(el.lastElementChild!);
  const bag = document.createElement("button"); bag.className = "sk ui-cell f2-o";
  bag.innerHTML = `<b class="key">B</b><span class="ico skart">${artImg("gi_menu_bag")}</span><span class="sk-name">Tiêu hao</span>`;
  bag.setAttribute("aria-label", "Mở túi dùng vật phẩm tiêu hao (B)");
  setTip(bag, { title: "Vật phẩm tiêu hao", lines: ["Mở túi để dùng đan, phù và vật phẩm."], foot: "Phím B · Túi đồ" });
  bag.addEventListener("click", () => {
    openBagTieuHao();
  });
  $("#itemActions").appendChild(bag);
}

// ---------- Võ Hồn Dung Hợp Kỹ (#193, mục 5.9): nút G, lời nhắc có đếm ngược, ô hồi chiêu ----------
/** Phím Võ Hồn Dung Hợp Kỹ: mời, hoặc hưởng ứng khi đang được mời. */
export const FUSION_KEY = "G";
let fusCdEnd = 0; // performance.now() lúc hết hồi chiêu dung hợp của hồn sư (theo tin riêng `fusion done` / `vohons.fcd`)
/** Lời mời đang chờ: `ask` = mình được mời (B), `wait` = mình mời, chờ đồng đội; `i` cặp trong FUSIONS, `who` tên người kia. */
let fusPend: { k: "ask" | "wait"; i: number; who: string; end: number; ms: number } | null = null;
let fusTxt = "", fusBtn: HTMLElement | null = null; // nút G hiện tại (buildSkills dựng lại thì đổi)
let fusLabel: HTMLElement | null = null; // nhãn của nút G
/** Đã gửi `join`: chờ server trả `done` / `cancel`, phím G và nút không gửi lại (bấm hai lần không ra lỗi "chưa có lời mời"). */
let fusSent = false;
/** Hồi chiêu dung hợp còn `secs` giây (server gửi; đổi võ hồn không làm mới vì thuộc hồn sư). */
export function setFusionCd(secs: number) { fusCdEnd = performance.now() + Math.max(0, secs) * 1000; }
/**
 * Việc phím G / nút gửi: "join" khi đang được mời, "" khi vừa hưởng ứng hoặc đang chờ đồng đội (không gửi lại), không thì "start". Gọi
 * nghĩa là sẽ gửi: "join" thì khóa tới khi server trả `done` / `cancel`. Server vẫn kiểm lại và báo lý do.
 */
export function fusionOp(): "join" | "start" | "" {
  if (fusSent || fusPend?.k === "wait") return ""; // đang chờ đồng đội hưởng ứng: không mời lại
  if (fusPend?.k !== "ask") return "start";
  fusSent = true; $("#fusion").querySelector("button")?.setAttribute("disabled", ""); return "join";
}
/**
 * Khung nhắc dung hợp kỹ (tin riêng `fusion`): B thấy "Dung hợp [G]" kèm đếm ngược `t` giây và nút chạm được (gọi `join`); A thấy
 * đang chờ ai hưởng ứng. `null` thì ẩn (xong, hủy, đổi bản đồ). Tên người chơi gán bằng textContent. Đếm ngược và thanh `aria-hidden`
 * để trình đọc màn hình chỉ đọc tên chiêu và nút, không đọc lại mỗi 0,1 giây.
 */
export function setFusionPending(p: { k: "ask" | "wait"; i: number; who: string; t: number } | null, join?: () => void) {
  const el = $("#fusion"); fusTxt = ""; fusSent = false;
  fusPend = p && FUSIONS[p.i] ? { k: p.k, i: p.i, who: p.who, end: performance.now() + p.t * 1000, ms: Math.max(1, p.t * 1000) } : null;
  if (!fusPend) { el.hidden = true; el.innerHTML = ""; return; }
  const ask = fusPend.k === "ask";
  el.classList.toggle("ask", ask);
  el.innerHTML = `<div class="ft"></div><small class="left" aria-hidden="true"></small><div class="bar" aria-hidden="true"><i></i></div>${ask ? `<button type="button">Dung hợp<kbd>${FUSION_KEY}</kbd></button>` : ""}`;
  const f = FUSIONS[fusPend.i];
  const fart = fusionImg(f.name, "fart");
  el.querySelector(".ft")!.textContent = `${fart ? "" : `${f.icon} `}Dung hợp kỹ ${f.name}`;
  if (fart) el.querySelector(".ft")!.insertAdjacentHTML("afterbegin", fart);
  el.querySelector(".ft")!.appendChild(document.createElement("small")).textContent = ask ? `${fusPend.who} mời hưởng ứng` : `Chờ ${fusPend.who} hưởng ứng`;
  // pointerdown cho chuột / chạm (nhanh, như nút cổng); click cho bàn phím / trình đọc màn hình. fusionOp chặn gửi hai lần.
  const btn = el.querySelector("button");
  btn?.addEventListener("pointerdown", (e) => { e.preventDefault(); join?.(); });
  btn?.addEventListener("click", () => join?.());
  el.hidden = false;
  updateFusion();
}
/** Mỗi khung hình: đếm ngược lời nhắc, ô hồi chiêu và nhãn của nút G. */
export function updateFusion() {
  const now = performance.now(), b = fusBtn;
  if (b && fusLabel) {
    const locked = b.classList.contains("locked");
    paintCell(b, Math.max(0, fusCdEnd - now) / 1000, FUSION.cd, lastMp, FUSION.cost);
    const ask = !locked && fusPend?.k === "ask" && !fusSent;
    if (b.classList.contains("ask") !== ask) b.classList.toggle("ask", ask);
    const txt = locked ? `Vòng ${FUSION.minRings}` : ask ? "Hưởng ứng" : fusPend ? "Đang chờ" : "Dung hợp";
    if (fusLabel.textContent !== txt) fusLabel.textContent = txt;
  }
  if (!fusPend) return;
  const left = Math.max(0, fusPend.end - now), sec = (left / 1000).toFixed(1).replace(".", ","), el = $("#fusion");
  (el.querySelector(".bar i") as HTMLElement).style.width = (left / fusPend.ms) * 100 + "%"; // mỗi khung hình: thanh co mượt
  const txt = `còn ${sec} giây`;
  if (txt === fusTxt) return;
  fusTxt = txt; el.querySelector("small.left")!.textContent = txt;
}
/** Phím Võ Hồn Chân Thân (8.1a, chờ chốt): R, không trùng phím nào đang dùng. */
export const AVA_KEY = "R";
const CT_NAMES: Record<ChanThanStat, string> = { atk: "công", def: "giảm sát thương nhận", spd: "tốc độ", crit: "chí mạng", mp: "giảm tiêu hao hồn lực", hp: "sinh lực tối đa" };
/** "công +47%, sinh lực tối đa +28%…" cho chỉ số Chân Thân. */
export const chanThanText = (st: Partial<Record<ChanThanStat, number>>) =>
  (Object.entries(st) as [ChanThanStat, number][]).map(([k, v]) => `${CT_NAMES[k]} +${Math.round(v * 100)}%`).join(", ");

/** Hồn cốt đang gắn trên võ hồn ra trận (từ tin riêng "bag"): loài, vị trí, số năm, cấp cường hóa (4.4). */
export interface WornBone { beast: string; slot: string; years: number; enhance?: number; }
export const pow2 = (x: number) => x.toFixed(2).replace(".", ",");
/**
 * Mô tả kỹ năng hồn cốt (tooltip, bảng hồn cốt): chủ động kèm tiêu hao / hồi chiêu / sức mạnh, bị động kèm số thật theo số năm;
 * từ 4.4 nhân hệ số mốc cường hóa (boneSkillMult).
 */
export function boneSkillText(beast: string, slot: string, years: number, enhance = 0) {
  const k = boneSkillOf(beast, slot); if (!k) return "";
  const m = boneSkillMult(enhance), up = m > 1 ? ` (mốc cường hóa ×${pow2(m)})` : "";
  if (k.active) return `${k.sk.name} (chủ động): ${k.sk.desc}. Tốn ${k.sk.cost} hồn lực, hồi ${String(k.sk.cd).replace(".", ",")} giây, sức mạnh ×${pow2(skillPower(years) * m)}${up}.`;
  return `${k.ps.name} (bị động): ${passiveText(k.ps, buffPower(years) * m)}${up}.`;
}
let boneCd: number[] = [];
/**
 * Kỹ năng hồn cốt của võ hồn ra trận (bước 4.3): 3 nút chủ động (Z / X / C: đầu, tay trái, tay phải; biểu tượng vị trí vẽ bằng
 * điểm ảnh, màu theo niên hạn) cạnh thanh hồn kỹ, và ô bị động (thân, hai chân) viền nét đứt cạnh hiệu ứng có lợi. Ô chưa gắn
 * hồn cốt thì mờ. Chỉ hiển thị; server kiểm tra lại mọi thứ.
 */
export function buildBoneSkills(worn: WornBone[], act: (k: string) => void) {
  const el = $("#bskills"); el.innerHTML = ""; boneCd = [];
  BONE_ACTIVE_SLOTS.forEach((slot, i) => {
    const s = BONE_SLOTS[boneSlotIndex(slot)], w = worn.find((x) => x.slot === slot), k = w ? boneSkillOf(w.beast, slot) : null;
    const sk = k?.active ? k.sk : null, col = w ? ringColor(tierOfYears(w.years)) : "#666";
    boneCd[i] = sk?.cd ?? 1;
    const b = document.createElement("button"); b.className = "sk bsk ui-cell f2-o" + (sk ? "" : " locked empty"); b.dataset.b = String(i);
    if (w) b.dataset.tier = String(tierOfYears(w.years)); // cả hồn cốt bị động (ô mờ nhưng giữ viền màu niên hạn)
    b.dataset.cost = String(sk?.cost ?? 0);
    b.innerHTML = `<b class="key">${BONE_SKILL_KEYS[i]}</b><i></i><span class="ico skart" style="color:${col}">${boneIcon(slot, col)}</span><span class="sk-name"></span><div class="ui-cd" aria-hidden="true"></div><em class="cdn" aria-hidden="true"></em><em class="sk-state" aria-hidden="true"></em>`;
    b.querySelector("i")!.textContent = sk?.icon ?? "";
    b.querySelectorAll("span")[1].textContent = sk?.name ?? s.name;
    b.setAttribute("aria-label", sk ? `Kỹ năng hồn cốt ${s.name}: ${sk.name}` : `Kỹ năng hồn cốt ${s.name}: chưa có`);
    setCellTip(b, w && sk ? { title: boneName(w.beast, slot, w.years, w.enhance), color: TIERS[tierOfYears(w.years)].glow, sub: `Hồn cốt ${s.name} · tốn ${sk.cost} hồn lực · hồi ${cdText(sk.cd)} giây`,
        lines: [boneSkillText(w.beast, slot, w.years, w.enhance)] }
      : { title: `Ô ${s.name}: chưa gắn hồn cốt`, lines: ["Gắn hồn cốt ở bảng đội hình (V) để có kỹ năng chủ động."] });
    b.querySelector(".sk-state")!.textContent = sk ? "" : "Khóa";
    b.setAttribute("aria-disabled", String(!sk));
    const run = () => { if (!b.classList.contains("locked")) act(`bone${i}`); };
    bindPress(b, run);
    el.appendChild(b);
  });
  const pas = $("#bpas"); pas.innerHTML = "";
  for (const w of worn) {
    const k = boneSkillOf(w.beast, w.slot); if (!k || k.active) continue;
    const c = document.createElement("span"); c.className = "passive"; c.textContent = k.ps.name;
    c.style.color = ringColor(tierOfYears(w.years));
    c.title = `${boneName(w.beast, w.slot, w.years, w.enhance)}\n${boneSkillText(w.beast, w.slot, w.years, w.enhance)}`;
    pas.appendChild(c);
  }
}

/** Tên các trạng thái đang có trên hồn thú (khung mục tiêu), kèm số tầng nếu cộng dồn. */
export function statusText(b: { st: number; burn: number; poison: number; armor: number; allure: number; lock: number; buff?: number }) {
  const n: Record<string, number> = { burn: b.burn, poison: b.poison, armor: b.armor, allure: b.allure, lock: b.lock };
  // Hiệu ứng có lợi của hồn thú (Cuồng nộ của tinh anh, BĐ4) đứng trước, in đậm.
  const buffs = BEAST_BUFF_IDS.filter((k) => (b.buff ?? 0) & beastBuffBit(k)).map((k) => `<b style="color:${BEAST_BUFFS[k].col}">${BEAST_BUFFS[k].name}</b>`);
  return [...buffs, ...STATUS_IDS.filter((s) => b.st & statusBit(s))
    .map((s) => `<span style="color:${STATUS[s].col}">${STATUS[s].name}${n[s] > 1 ? ` ×${n[s]}` : ""}</span>`)].join(" · ");
}

let ringsKey = "", buffKey = "";
/** Một ô trên thanh hiệu ứng: biểu tượng status_<mã> 24×24 (10.8) kèm tên khi rê chuột / đọc màn hình; mã chưa có ảnh thì ghi tên. */
function statusChip(id: string, name: string, col: string, cls = "") {
  const c = document.createElement("span"); c.className = cls; c.style.color = col;
  const img = artImg(`status_${id}`, "sti");
  if (img) { c.classList.add("art"); c.innerHTML = img; c.title = name; c.setAttribute("aria-label", name); } else c.textContent = name;
  return c;
}
let leiTipSet = false;
let lastVhName = ""; // updateStats chạy mỗi khung: chỉ ghi tên + chú thích khi tên đổi (không gán lại title mỗi khung)
/** `v`: dữ liệu riêng của chính mình (tin `vit`, đã đếm lùi hồi chiêu tới khung này): hồn lực, kinh nghiệm, hồi chiêu (#949). */
export function updateStats(p: any, v: Vitals) {
  const vhName = VOHON[p.vh].name;
  $("#vhGlyph").textContent = vhName.slice(0, 1);
  $("#vhPortrait").setAttribute("aria-label", `Biểu tượng ${vhName}`);
  const vhLabel = cbElementMark(elementOfVohonIndex(p.vh)) + vhName; // mù màu (#600): nhãn hệ cạnh tên, tắt thì chỉ tên
  if (vhLabel !== lastVhName) { lastVhName = vhLabel; $("#vhName").textContent = vhLabel; setTip($("#vhName"), vhLabel); }
  $("#vhName").style.color = VOHON[p.vh].col;
  $("#lvl").textContent = `Cấp ${p.level}`;
  $("#hpFill").style.width = (p.hp / Math.max(1, p.maxHp)) * 100 + "%"; $("#hpTxt").textContent = `Sinh lực ${p.hp} / ${p.maxHp}`;
  $("#mpFill").style.width = (v.mp / Math.max(1, v.maxMp)) * 100 + "%"; $("#mpTxt").textContent = `Hồn lực ${v.mp} / ${v.maxMp}`;
  const xpBar = $(".stats .bar.xp"), maxed = !v.xpNeed && !atBottleneck(p.level, p.rings.length);
  xpBar.hidden = maxed; // cấp tối đa: ẩn cả thanh kinh nghiệm (không còn gì để tích)
  if (!v.xpNeed) {
    $("#xpFill").style.width = "100%";
    if (!maxed) $("#xpTxt").textContent = `Bình cảnh: cần hồn hoàn thứ ${p.rings.length + 1}`;
  }
  else { $("#xpFill").style.width = (v.xp / v.xpNeed) * 100 + "%"; $("#xpTxt").textContent = `Kinh nghiệm ${v.xp} / ${v.xpNeed}`; }
  // Phong Lôi Chi Lực (2.5c): chỉ hiện khi Lam Điện Bá Vương Long ra trận; đầy thì sáng viền (tự tung Lôi Động Minh Thiên khi đánh trúng).
  const lei = VOHON[p.vh].id === PHONG_LOI.vohon, bar = $("#leiBar");
  bar.hidden = !lei; if (!leiTipSet) { leiTipSet = true; setTip(bar, PHONG_LOI.skill.desc); } // chú thích đặt một lần, không gán lại mỗi khung
  if (lei) {
    $("#leiFill").style.width = (p.lei / PHONG_LOI.max) * 100 + "%"; bar.classList.toggle("full", p.lei >= PHONG_LOI.max);
    $("#leiTxt").textContent = `${PHONG_LOI.name} ${p.lei} / ${PHONG_LOI.max}`;
  }
  const rings: number[] = [...p.rings];
  const key = rings.join(",") + "|" + p.level;
  if (key !== ringsKey) {
    ringsKey = key; // hồn hoàn rút thành chip n/10 (bấm mở bảng Hồn Cốt); chi tiết từng vòng ở chú thích
    $("#ringChipTxt").textContent = `${rings.length}/${MAX_RINGS}`;
    const slot = rings.length + 1, lim = slot <= MAX_RINGS ? `Vòng ${slot}: giới hạn ${formatYears(ringLimit(slot))}, cấp ${slot * 10}` : `Đủ ${MAX_RINGS} hồn hoàn`;
    $("#ringChip").title = `Hồn hoàn ${rings.length}/${MAX_RINGS}\n${rings.map((t, i) => `Vòng ${i + 1}: ${TIERS[t].age}`).concat(lim).join("\n")}`;
  }
  // Hiệu ứng có lợi, rồi trạng thái bất lợi do chiêu báo trước của hồn thú gây (từ 3.5, viền đỏ).
  const buffs = BUFF_IDS.filter((b) => p.buff & buffBit(b)).join(",") + "|" + p.st + "|" + (p.han ?? 0);
  if (buffs !== buffKey) {
    buffKey = buffs; const el = $("#buffs"); el.innerHTML = "";
    for (const b of BUFF_IDS) if (p.buff & buffBit(b)) el.appendChild(statusChip(b, BUFFS[b].name, BUFFS[b].col));
    // Tầng Hàn (#163, Cực Hàn): ô ghi số tầng / số tầng thì đóng băng.
    for (const s of PLAYER_STATUS) if (p.st & statusBit(s))
      el.appendChild(statusChip(s, s === "chill" ? `${STATUS[s].name} ${p.han ?? 0}/${STATUS[s].max}` : STATUS[s].name, STATUS[s].col, "debuff"));
  }
  // Hồn kỹ Chân Thân (9.6): đang biến hình thì nút P mang hồn kỹ Chân Thân, hồi chiêu riêng `ctCd`; hết thì trả nút P cũ.
  const pb = document.querySelector<HTMLElement>(`.sk[data-i="${CHAN_THAN_SKILL_SLOT}"]`), ctOn = !!ctSlot && p.ava > 0;
  if (pb && pb.classList.contains("ct") !== ctOn) setCtSlot(pb, ctOn);
  lastMp = v.mp;
  document.querySelectorAll<HTMLElement>(".sk[data-i]").forEach((b) => {
    const i = Number(b.dataset.i), ct = b.classList.contains("ct");
    paintCell(b, ct ? v.ctCd : v.cds[i] ?? 0, ct ? CHAN_THAN_SKILL_CD : slotCd[i] || 1, v.mp, Number(b.dataset.cost));
  });
  // Võ Hồn Chân Thân (8.1a): đang biến hình thì nút sáng kèm giây còn lại, xong thì hiện hồi chiêu.
  const av = document.querySelector<HTMLElement>(".sk.ava");
  if (av && avaDef) {
    av.classList.toggle("on", p.ava > 0);
    paintCell(av, p.ava > 0 ? 0 : v.avaCd, avaDef.cd, v.mp, p.ava > 0 ? 0 : avaDef.cost);
    const label = av.querySelectorAll("span")[1], txt = av.classList.contains("locked") ? `Vòng ${CHAN_THAN_RING}` : p.ava > 0 ? `${Math.ceil(p.ava)} giây` : "Chân Thân";
    if (label.textContent !== txt) label.textContent = txt;
  }
  document.querySelectorAll<HTMLElement>(".sk[data-b]").forEach((b) => {
    const i = Number(b.dataset.b); paintCell(b, v.bcds[i] ?? 0, boneCd[i] || 1, v.mp, Number(b.dataset.cost));
  });
  const ch = $("#channel");
  if (p.absorb > 0) {
    ch.style.display = "block"; $("#chFill").style.width = p.absorb * 100 + "%";
    const a = absorbing, sec = (x: number) => x.toFixed(1).replace(".", ",");
    const txt = a ? `${a.label} · ${sec(Math.min(a.secs, p.absorb * a.secs))} / ${sec(a.secs)} giây` : "Đang hấp thụ hồn hoàn…";
    const lb = ch.querySelector<HTMLElement>(".label")!;
    if (lb.textContent !== txt) lb.textContent = txt;
    ch.classList.toggle("risk", !!a?.risk);
    if (a) ch.style.setProperty("--c", a.col);
  } else if (!drawRecall(ch)) ch.style.display = "none"; // 11.2: thanh niệm truyền tống dùng chung chỗ
}

/** Hấp thụ đang chạy (tin riêng "absorbing" từ server): chữ trên thanh tiến độ, tổng số giây, có rủi ro thất bại không. */
let absorbing: { label: string; secs: number; risk: boolean; col: string } | null = null;
export function setAbsorbing(a: typeof absorbing) { absorbing = a; }

// ---------- Đội hình võ hồn (mục 5.1): thanh 4 ô trong trận và bảng xếp đội ----------
export const vohonDef = (id: string) => VOHON[Math.max(0, vohonIndex(id))];
export const ownedById = (data: OwnedVohons, rowId: number) => data.list.find((v) => v.rowId === rowId);

function teamTip(b: HTMLElement, state = b.dataset.sub ?? "") {
  setTip(b, { title: b.dataset.name ?? "Ô đội hình trống", sub: [b.dataset.level, state === b.dataset.level ? "" : state].filter(Boolean).join(" · "),
    lines: [...(b.dataset.tc ? [b.dataset.tc] : ["Chọn võ hồn ở bảng Đội hình (V)."]), ...(b.classList.contains("down") ? ["Hồi lại ngoài giao chiến hoặc khi về doanh trại."] : [])], foot: `Phím ${Number(b.dataset.slot) + 1} · Đổi võ hồn` });
}

/** Thanh đội hình trong trận: mỗi ô một nút (phím 1–4 hoặc chạm) để đổi sang võ hồn đó. */
export function buildTeam(data: OwnedVohons, sw: (slot: number) => void) {
  const el = $("#team"); el.innerHTML = "";
  data.team.forEach((rowId, i) => {
    const v = ownedById(data, rowId), def = v && vohonDef(v.vohon), on = rowId === data.active;
    const b = document.createElement("button"); b.className = "tm ui-cell f2-o" + (on ? " on" : "") + (v ? "" : " locked empty");
    b.dataset.slot = String(i);
    if (def) b.style.setProperty("--c", def.col);
    if (v) b.dataset.row = String(rowId);
    // Chỉ avatar tròn + số cấp + thanh sinh lực mỏng (không tên; tên và hồn kỹ tiên cơ ở chú thích). `small` giữ cho updateTeam, ẩn bằng CSS.
    const pic = def ? artUrl(`portrait_${def.id}`) : null;
    b.innerHTML = `<b class="key">${i + 1}</b><span class="av">${pic ? `<img src="${pic}" alt="" draggable="false">` : ""}</span><b class="lv"></b><small></small><i class="hpb"><i></i></i><i class="enb"><i></i></i><div class="ui-cd"></div><em class="cdn"></em>`;
    b.querySelector(".lv")!.textContent = v ? String(v.level) : "";
    b.dataset.name = def?.name ?? "Ô đội hình trống";
    b.dataset.level = v ? `Cấp ${v.level}` : "";
    b.dataset.sub = v ? (on ? "Ra trận" : `Cấp ${v.level}`) : "";
    b.querySelector("small")!.textContent = b.dataset.sub;
    b.dataset.label = def ? `Ô ${i + 1}: ${def.name}, cấp ${v!.level}${on ? ", đang ra trận" : ""}` : `Ô ${i + 1}: trống`;
    if (def) b.dataset.tc = `${tienCoOf(def.id).name}: ${tienCoOf(def.id).desc}`;
    b.setAttribute("aria-label", b.dataset.label);
    b.setAttribute("aria-disabled", String(!v));
    teamTip(b);
    const run = () => { if (v) sw(i); };
    bindPress(b, run);
    el.appendChild(b);
  });
}

let squad: Squad = { combat: false, list: [] };
/**
 * Nhận tin riêng "squad" (sinh lực, võ hồn đã gục, năng lượng tiên cơ); updateTeam vẽ lại mỗi khung hình. Trả về các võ hồn
 * vừa đầy năng lượng (để báo một lần).
 */
export function setSquad(s: Squad) {
  const filled = s.list.filter((x) => x.en >= TIEN_CO_MAX && (squad.list.find((o) => o.rowId === x.rowId)?.en ?? 0) < TIEN_CO_MAX);
  squad = s;
  return filled.map((x) => x.rowId);
}

/**
 * Mỗi khung hình: thanh sinh lực từng võ hồn trong đội (ô ra trận lấy sinh lực trong state), võ hồn đã gục làm mờ kèm thời gian
 * hồi, thanh năng lượng tiên cơ (ô chưa ra trận đầy năng lượng thì sáng viền, chữ "Tiên cơ!"), và hồi chiêu đổi võ hồn
 * (swCd / SWITCH_CD) phủ lên các ô chưa ra trận.
 */
export function updateTeam(me: { hp: number; maxHp: number }, v: Vitals) {
  const k = Math.max(0, Math.min(1, v.swCd / SWITCH_CD));
  document.querySelectorAll<HTMLElement>(".tm").forEach((b) => {
    const on = b.classList.contains("on"), s = squad.list.find((x) => String(x.rowId) === b.dataset.row);
    const down = !!s?.down, hp = on ? me.hp : s?.hp ?? 0, max = on ? me.maxHp : s?.maxHp ?? 0, en = s?.en ?? 0;
    const full = !on && !down && en >= TIEN_CO_MAX;
    b.classList.toggle("down", down);
    b.classList.toggle("full", full);
    const enFill = b.querySelector(".enb i") as HTMLElement | null;
    if (enFill) enFill.style.width = Math.max(0, Math.min(1, en / TIEN_CO_MAX)) * 100 + "%";
    b.classList.toggle("paused", down && squad.combat);
    const fill = b.querySelector(".hpb i") as HTMLElement | null;
    if (fill) fill.style.width = (max ? Math.max(0, Math.min(1, hp / max)) * 100 : 100) + "%";
    const sub = down ? `Gục · ${s!.down}s` : full ? "Tiên cơ!" : b.dataset.sub ?? "";
    const small = b.querySelector("small")!;
    if (small.textContent !== sub) {
      small.textContent = sub;
      teamTip(b, down ? `${sub}${squad.combat ? " · chờ hết giao chiến" : ""}` : sub);
      if (b.dataset.label) b.setAttribute("aria-label", b.dataset.label + (down ? `, ${sub}` : full ? ", đủ năng lượng tiên cơ" : ""));
    }
    const left = on || down || b.classList.contains("locked") ? 0 : Math.max(0, v.swCd), p = left > 0 ? Math.round(k * 100) / 100 : 0;
    if (b.dataset.p !== String(p)) { b.dataset.p = String(p); (b.querySelector(".ui-cd") as HTMLElement).style.setProperty("--p", String(p)); }
    const num = b.querySelector(".cdn"), txt = cdLabel(left); if (num && num.textContent !== txt) num.textContent = txt;
  });
}
