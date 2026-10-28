// Nhiệm vụ (khung theo dõi, trang nhiệm vụ, khảo hạch hằng ngày, tông môn) của HUD (tách nguyên văn từ hud.ts, Part of #885 bước 0a); hud.ts re-export để nơi gọi giữ nguyên.
import { NpcActions, npcDefOpen, renderNpc, tongBoardMsg, tongMsg } from "./hudNpc.ts";
import { tierOfYears, MAPS, NPCS, formatHonTe, QUESTS, QUEST_STARTER, QUEST_AFTER, questChain, questRewardText, questBoneText, type QuestReward, type QuestStep, DAILY } from "../../shared/data.ts";
import { resolveQuestMarker } from "./nameplate.ts";
import type { QuestMsg, DailyMsg } from "./net.ts";
import { TONG_MON, TONG_POINTS, TONG_WEEK_MIN, TONG_WEEK_REWARD, tongDef, type TongRank } from "../../shared/data.ts";
import { ringColor } from "./hudBar.ts";
import { isUi2 } from "./uiKit.ts";
import { stateBox } from "./uiParts.ts";
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;

// ---------- Nhiệm vụ: chuỗi cố định (tân thủ của Ngọc Tiểu Cương, chương 2 của Triệu Vô Cực…; mục 5.8, bước 6.2, #190) ----------
let questMsg: QuestMsg | null = null; // tin "quest" gần nhất của chuỗi tân thủ (tiến độ do server giữ)
const questMsgs = new Map<string, QuestMsg>(); // tin "quest" gần nhất của từng chuỗi cố định (kể cả tân thủ)
const questFold = new Set<string>();  // mã chuỗi đang thu gọn trong khung theo dõi
export let dailyMsg: DailyMsg | null = null; // tin "daily" gần nhất (khảo hạch hằng ngày, server giữ tiến độ)
let dailyFold = false;
/** Tiến độ chuỗi mà NPC `id` giao (null = NPC không giao nhiệm vụ, chưa nhận tin "quest", hoặc chuỗi chưa mở theo QUEST_AFTER). */
export const questOf = (id: string) => {
  const q = [...questMsgs.values()].find((m) => questChain(m.chain)?.giver === id), after = q && QUEST_AFTER[q.chain];
  return q && (!after || questMsgs.get(after)?.status === "done") ? q : null;
};
/**
 * Chuỗi cố định đang theo dõi (#190, chung cho mọi chuỗi trong QUESTS): đã có tin "quest", đã mở (chuỗi QUEST_AFTER của nó đã xong),
 * chưa xong cả chuỗi; theo thứ tự QUESTS. Khung theo dõi, dấu NPC và chỉ đường bản đồ nhỏ cùng đọc danh sách này.
 */
export function questTracked(): QuestMsg[] {
  return QUESTS.map((c) => questMsgs.get(c.id)).filter((q): q is QuestMsg => !!q && q.status !== "done" && questOf(questChain(q.chain)?.giver ?? "") === q);
}
/** Tin "quest": vẽ lại khung theo dõi, và hộp thoại nếu đang mở với NPC giao nhiệm vụ. */
export function setQuest(q: QuestMsg) {
  questMsgs.set(q.chain, q);
  if (q.chain === QUEST_STARTER) questMsg = q;
  renderQuestTracker();
  if (npcDefOpen && questOf(npcDefOpen.id)) renderNpc();
}
const giverOf = (chain: string) => { const c = questChain(chain); return { c, npc: NPCS.find((n) => n.id === c?.giver), where: c ? MAPS[c.map]?.name : "" }; };
/** Các mục tiêu của bước `s` kèm tiến độ x/N (`prog` null = chưa nhận: chỉ ghi số cần). */
function questGoals(s: QuestStep, prog: number[] | null) {
  const box = document.createElement("div");
  s.goals.forEach((g, i) => {
    const n = prog ? Math.min(g.n, prog[i] ?? 0) : null, row = document.createElement("div");
    row.className = "qg" + (n !== null && n >= g.n ? " ok" : "");
    row.innerHTML = "<span></span><em></em>";
    row.querySelector("span")!.textContent = (n !== null && n >= g.n ? "√ " : "• ") + g.text;
    row.querySelector("em")!.textContent = n === null ? `×${g.n}` : `${n}/${g.n}`;
    box.appendChild(row);
  });
  return box;
}
/**
 * Khung theo dõi trên màn hình: mỗi chuỗi cố định đang theo dõi một mục (questTracked: tân thủ, rồi chương 2 khi đã mở… tên bài, mục
 * tiêu x/N, gợi ý gặp / quay về NPC giao bài; xong cả chuỗi thì bỏ mục đó), rồi mục "Hằng ngày" (khảo hạch của Phất Lan Đức); bấm /
 * chạm tiêu đề từng mục để thu gọn. Không còn gì để theo dõi thì ẩn.
 */
function renderQuestTracker() {
  const el = $("#quest"); el.innerHTML = "";
  let any = false;
  for (const q of questTracked()) any = renderChainTracker(el, q) || any;
  const daily = renderDailyTracker(el);
  el.hidden = !any && !daily;
}
/**
 * Nút bấm / chạm của khung theo dõi (#190): `pointerdown` + preventDefault như thanh hồn kỹ (chạm trên điện thoại không phải lúc nào
 * cũng sinh `click`); `click` không kèm số lần nhấn chuột (detail 0) là Enter / Space từ bàn phím.
 */
function onTap(b: HTMLElement, fn: () => void) {
  b.addEventListener("pointerdown", (e) => { if (e.button === 0) { e.preventDefault(); fn(); } });
  b.addEventListener("click", (e) => { if (e.detail === 0) fn(); });
}
function renderChainTracker(el: HTMLElement, q: QuestMsg) {
  const { c, npc, where } = giverOf(q.chain), s = c?.steps[q.step];
  if (!c || !s) return false;
  const fold = questFold.has(q.chain), sec = document.createElement("div"); sec.className = "qsec"; sec.dataset.chain = q.chain;
  const head = document.createElement("button"); head.type = "button"; head.className = "qhead"; head.setAttribute("aria-expanded", String(!fold));
  head.innerHTML = "<b></b><i></i>";
  head.querySelector("b")!.textContent = `${s.name}${q.status === "offer" ? " !" : q.status === "ready" ? " ?" : ""}`;
  head.querySelector("i")!.textContent = `${q.step + 1}/${c.steps.length} ${fold ? "▸" : "▾"}`;
  head.title = fold ? `Mở mục ${c.name}` : `Thu gọn mục ${c.name}`;
  onTap(head, () => { if (!questFold.delete(q.chain)) questFold.add(q.chain); renderQuestTracker(); });
  sec.appendChild(head);
  const sub = document.createElement("small"); sub.textContent = c.name; sec.appendChild(sub);
  el.appendChild(sec);
  if (fold) return true;
  el = sec;
  const tip = (text: string) => { const t = document.createElement("div"); t.className = "qtip"; t.textContent = text; el.appendChild(t); };
  if (q.status === "offer") { tip(`Gặp ${npc?.name ?? "NPC"} ở ${where} để nhận bài này.`); return true; }
  el.appendChild(questGoals(s, q.prog));
  if (s.reward.bones?.length) el.appendChild(questRewardEl({ honTe: 0, items: [], bones: s.reward.bones }, "Thưởng thêm")); // hồn cốt (#285)
  if (q.status === "ready") tip(`Đã xong: quay về gặp ${npc?.name ?? "NPC"} ở ${where} để nhận thưởng.`);
  else { const d = document.createElement("small"); d.textContent = s.desc; el.appendChild(d); }
  return true;
}
/** Dòng "Phần thưởng: …" của một bài; hồn cốt thưởng (#285) tô màu theo niên hạn như hồn hoàn. */
function questRewardEl(r: QuestReward, label = "Phần thưởng") {
  const el = document.createElement("span"); el.className = "qrew";
  const rest = questRewardText({ ...r, bones: [] });
  el.append(`${label}: ${rest}`);
  (r.bones ?? []).forEach((b, i) => {
    if (rest || i) el.append(", ");
    const c = document.createElement("b"); c.style.color = ringColor(tierOfYears(b.years)); c.textContent = questBoneText(b); el.appendChild(c);
  });
  return el;
}
/** Trang nhiệm vụ trong hộp thoại NPC giao nhiệm vụ: lời giao + mục tiêu + thưởng + "Nhận", tiến độ, lời khi trả + "Trả", lời kết. */
export function renderQuestPage(el: HTMLElement, act: NpcActions) {
  const q = npcDefOpen ? questOf(npcDefOpen.id) : null, c = q && questChain(q.chain);
  const say = (t: string) => { const p = document.createElement("p"); p.className = "nline"; p.textContent = t; el.appendChild(p); };
  if (!q || !c) { say("…"); return; }
  if (q.status === "done") { say(c.finale); const k = document.createElement("small"); k.className = "rnote"; k.textContent = `Đã học xong cả ${c.steps.length} bài của "${c.name}".`; el.appendChild(k); return; }
  const s = c.steps[q.step];
  const box = document.createElement("div"); box.className = "qbox";
  const h = document.createElement("b"); h.textContent = `Bài ${q.step + 1}/${c.steps.length}: ${s.name}`; box.appendChild(h);
  const d = document.createElement("span"); d.textContent = s.desc; box.appendChild(d);
  box.appendChild(questGoals(s, q.status === "offer" ? null : q.prog));
  box.appendChild(questRewardEl(s.reward));
  const lines = q.status === "ready" ? s.done : q.status === "offer" ? s.offer : [s.desc];
  if (q.status !== "active") for (const t of lines) say(t);
  else say("Chưa xong đâu. Làm đủ các mục tiêu rồi quay lại báo ta.");
  el.appendChild(box);
  const row = document.createElement("div"); row.className = "brow";
  const b = document.createElement("button"); b.type = "button"; b.className = "buse " + (q.status === "active" ? "use" : "absorb");
  b.textContent = q.status === "offer" ? "Nhận nhiệm vụ" : q.status === "ready" ? "Trả nhiệm vụ, nhận thưởng" : "Đang làm…";
  b.disabled = q.status === "active";
  b.addEventListener("click", () => { b.blur(); act.quest(q.status === "offer" ? "accept" : "turnin", q.chain === QUEST_STARTER ? undefined : q.chain); });
  row.appendChild(b); el.appendChild(row);
}
/** Mã NPC giao nhiệm vụ (để GameScene vẽ dấu "!" / "?" trên đầu), kể cả người ra khảo hạch hằng ngày. */
export const QUEST_GIVERS = new Set([...QUESTS.map((c) => c.giver), DAILY.giver]);
/**
 * Dấu trên đầu NPC `id`: "offer" có bài mới, "ready" có bài chờ trả, "active" đang làm, null = không có gì (xong hết / không giao).
 * Người ra khảo hạch hằng ngày gộp cả bộ bài: chờ trả trước, rồi bài mới, rồi đang làm.
 */
export function questMarker(id: string) {
  const statuses = questTracked().filter((q) => questChain(q.chain)?.giver === id).map((q) => q.status);
  if (id === DAILY.giver) statuses.push(...(dailyMsg?.list ?? []).map((q) => q.status));
  return resolveQuestMarker(statuses);
}
export function dailyMark(): "offer" | "ready" | "active" | null {
  const l = dailyMsg?.list ?? [];
  return l.some((x) => x.status === "ready") ? "ready" : l.some((x) => x.status === "offer") ? "offer" : l.some((x) => x.status === "active") ? "active" : null;
}

// ---------- Khảo hạch hằng ngày của Phất Lan Đức (mục 5.8 "Nhiệm vụ hằng ngày") ----------
/** Tin "daily": vẽ lại khung theo dõi (mục "Hằng ngày") và hộp thoại nếu đang mở với Phất Lan Đức. */
export function setDaily(m: DailyMsg) {
  dailyMsg = m;
  renderQuestTracker();
  if (npcDefOpen?.id === DAILY.giver) renderNpc();
}
/** Mục "Hằng ngày" hiện trong khung theo dõi khi đã xong chuỗi tân thủ, đã nhận bài hôm nay, hoặc đang ở bản đồ của Phất Lan Đức. */
const dailyShown = (mapId: string) => !!dailyMsg &&
  (questMsg?.status === "done" || dailyMsg.list.some((x) => x.status !== "offer") || mapId === DAILY.map);
let trackerMap = "";
/** Bản đồ đang đứng (GameScene gọi khi vào bản đồ): quyết định có hiện mục "Hằng ngày" khi chưa nhận bài nào. */
export function setTrackerMap(mapId: string) { trackerMap = mapId; renderQuestTracker(); }
/** Khảo hạch hằng ngày gần nhất (GameScene chấm mục tiêu lên bản đồ nhỏ); mục "Hằng ngày" đang ẩn thì chỉ trả bài đã nhận. */
export function dailyList() {
  const l = dailyMsg?.list ?? [];
  return dailyShown(trackerMap) ? l : l.filter((x) => x.status === "active" || x.status === "ready");
}
/** Mục "Hằng ngày" trong khung theo dõi: bài đã nhận (mục tiêu x/N), bài chưa nhận / đã xong tóm một dòng; bấm tiêu đề để thu gọn. */
function renderDailyTracker(el: HTMLElement) {
  const m = dailyMsg; if (!m || !dailyShown(trackerMap)) return false;
  const npc = NPCS.find((n) => n.id === DAILY.giver), where = MAPS[DAILY.map]?.name ?? "";
  const done = m.list.filter((x) => x.status === "done").length, mark = dailyMark();
  const sec = document.createElement("div"); sec.className = "qsec";
  const head = document.createElement("button"); head.type = "button"; head.className = "qhead"; head.setAttribute("aria-expanded", String(!dailyFold));
  head.innerHTML = "<b></b><i></i>";
  head.querySelector("b")!.textContent = `Hằng ngày${mark === "offer" ? " !" : mark === "ready" ? " ?" : ""}`;
  head.querySelector("i")!.textContent = `${done}/${m.list.length} ${dailyFold ? "▸" : "▾"}`;
  head.title = dailyFold ? "Mở mục Hằng ngày" : "Thu gọn mục Hằng ngày";
  onTap(head, () => { dailyFold = !dailyFold; renderQuestTracker(); });
  sec.appendChild(head);
  const sub = document.createElement("small"); sub.textContent = DAILY.name; sec.appendChild(sub);
  el.appendChild(sec);
  if (dailyFold) return true;
  const tip = (text: string) => { const t = document.createElement("div"); t.className = "qtip"; t.textContent = text; sec.appendChild(t); };
  for (const q of m.list) {
    if (q.status !== "active" && q.status !== "ready") continue;
    const s = questChain(q.chain)?.steps[0]; if (!s) continue;
    const n = document.createElement("div"); n.className = "qname"; n.textContent = s.name; sec.appendChild(n);
    sec.appendChild(questGoals(s, q.prog));
  }
  const offer = m.list.filter((x) => x.status === "offer").length, ready = m.list.filter((x) => x.status === "ready").length;
  if (ready) tip(`Đã xong ${ready} bài: gặp ${npc?.name ?? "NPC"} ở ${where} để nhận thưởng.`);
  if (offer) tip(`Còn ${offer} bài chưa nhận: gặp ${npc?.name ?? "NPC"} ở ${where}.`);
  if (done === m.list.length) { const k = document.createElement("small"); k.textContent = "Đã xong khảo hạch hôm nay · bài mới lúc 0:00 (giờ Việt Nam)."; sec.appendChild(k); }
  return true;
}
/** Trang khảo hạch trong hộp thoại Phất Lan Đức: mỗi bài một khung (mục tiêu, thưởng, lời giao / lời trả) và nút nhận / trả riêng. */
/** Trang tông vụ hôm nay (#197) ở sứ giả tông mình: như khảo hạch hằng ngày, thưởng Hồn Tệ và điểm tông. */
export function renderTongTasks(el: HTMLElement, act: NpcActions) {
  const say = (t: string) => { const p = document.createElement("p"); p.className = "nline"; p.textContent = t; el.appendChild(p); };
  const l = tongMsg?.tasks;
  if (!l?.length) { if (isUi2()) el.appendChild(stateBox({ kind: tongMsg ? "empty" : "loading", text: tongMsg ? "Hôm nay chưa có tông vụ." : "Đang tải tông vụ…", hint: tongMsg ? "Nửa đêm có bài mới." : undefined, rows: 3 })); else say("…"); return; }
  say(l.every((x) => x.status === "done") ? questChain(l[0].chain)?.finale ?? "" :
    `Tông vụ hôm nay ${l.length} bài, mỗi bài ${TONG_POINTS} điểm tông. Nửa đêm có bài mới, bài dở dang bỏ luôn.`);
  l.forEach((q, i) => {
    const s = questChain(q.chain)?.steps[0]; if (!s) return;
    const box = document.createElement("div"); box.className = "qbox" + (q.status === "done" ? " qdone" : "");
    const h = document.createElement("b"); h.textContent = `Bài ${i + 1}/${l.length}: ${s.name}${q.status === "done" ? " (đã xong)" : ""}`; box.appendChild(h);
    if (q.status !== "done") {
      const d = document.createElement("span"); d.textContent = s.desc; box.appendChild(d);
      box.appendChild(questGoals(s, q.status === "offer" ? null : q.prog));
      const r = document.createElement("span"); r.className = "qrew"; r.textContent = `Phần thưởng: ${questRewardText(s.reward)}, ${TONG_POINTS} điểm tông`; box.appendChild(r);
      const line = q.status === "offer" ? s.offer.at(-1) : q.status === "ready" ? s.done[0] : "";
      if (line) { const p = document.createElement("i"); p.className = "qsay"; p.textContent = line; box.appendChild(p); }
      const b = document.createElement("button"); b.type = "button"; b.className = "buse " + (q.status === "active" ? "use" : "absorb");
      b.textContent = q.status === "offer" ? "Nhận bài" : q.status === "ready" ? "Trả bài, nhận thưởng" : "Đang làm…";
      b.disabled = q.status === "active";
      b.addEventListener("click", () => { b.blur(); act.tong(q.status === "offer" ? "accept" : "turnin", undefined, q.chain); });
      box.appendChild(b);
    }
    el.appendChild(box);
  });
}

/** Trang bảng tông tuần (#197): điểm trung bình thành viên hoạt động từng tông, top cá nhân tông mình, thưởng tuần trước. */
export function renderTongRank(el: HTMLElement, act: NpcActions) {
  const m = tongBoardMsg, mine = tongMsg?.tong ?? "";
  const say = (t: string) => { const p = document.createElement("p"); p.className = "nline"; p.textContent = t; el.appendChild(p); };
  if (!m) { if (isUi2()) el.appendChild(stateBox({ kind: "loading", text: "Đang tải bảng tông…", rows: 4 })); else say("…"); return; }
  const UI2 = isUi2();
  const table = (rows: TongRank[], first: string[]) => {
    const tb = document.createElement("div"); tb.className = "qbox" + (UI2 ? " tong-bang" : "");
    const sorted = TONG_MON.map((t) => rows.find((r) => r.tong === t.id) ?? { tong: t.id, active: 0, avg: 0 }).sort((a, b) => b.avg - a.avg);
    const best = Math.max(1, ...sorted.map((r) => r.avg));
    for (const r of sorted) {
      const t = tongDef(r.tong), line = document.createElement("span");
      line.textContent = `${first.includes(r.tong) ? "★ " : ""}${t?.name ?? r.tong}: ${r.avg.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} điểm trung bình, ${r.active} người hoạt động`;
      if (t) line.style.color = t.col;
      if (r.tong === mine) line.style.fontWeight = "bold";
      tb.appendChild(line);
      if (UI2) { // thanh so điểm trung bình với tông đứng đầu (hình, kèm số ở dòng trên); tông mình có vạch trái dày
        line.classList.add("trow"); if (r.tong === mine) line.classList.add("me");
        const bar = document.createElement("i"); bar.className = "tbar"; bar.style.setProperty("--p", `${Math.round((r.avg / best) * 100)}%`); if (t) bar.style.setProperty("--c", t.col);
        tb.appendChild(bar);
      }
    }
    return tb;
  };
  const cur = m.cur.tongs, best = Math.max(0, ...cur.filter((r) => r.active > 0).map((r) => r.avg));
  say(`Tuần này: ngươi có ${m.me} điểm tông (cần ${m.min} điểm để là thành viên hoạt động). Xếp theo điểm trung bình của thành viên hoạt động.`);
  el.appendChild(table(cur, cur.filter((r) => r.active > 0 && r.avg === best).map((r) => r.tong)));
  const top = m.cur.top[mine] ?? [];
  if (top.length) {
    const tb = document.createElement("div"); tb.className = "qbox";
    const h = document.createElement("b"); h.textContent = `Top ${tongDef(mine)?.name ?? ""} tuần này`; tb.appendChild(h);
    top.forEach((x, i) => { const s2 = document.createElement("span"); s2.textContent = `${i + 1}. ${x.name}: ${x.points} điểm`; tb.appendChild(s2); });
    el.appendChild(tb);
  }
  const L = m.last, R = L.reward ? TONG_WEEK_REWARD[L.reward] : null;
  say(`Tuần trước: ${L.first.length ? `hạng nhất ${L.first.map((x) => tongDef(x)?.name ?? x).join(", ")}` : "chưa tông nào có thành viên hoạt động"}; ngươi có ${L.points} điểm${L.tong ? ` ở ${tongDef(L.tong)?.name ?? L.tong}` : ""}.`);
  el.appendChild(table(L.board.tongs, L.first));
  const b = document.createElement("button"); b.type = "button"; b.className = "buse absorb";
  b.textContent = L.claimed ? "Đã nhận thưởng tuần trước" : R ? `Nhận thưởng tuần: ${formatHonTe(R.honTe)} và ${R.shards} mảnh võ hồn` : `Tuần trước chưa đủ ${TONG_WEEK_MIN} điểm: không có thưởng`;
  b.disabled = L.claimed || !R;
  b.addEventListener("click", () => { b.blur(); act.tong("claim"); });
  el.appendChild(b);
}

export function renderDailyPage(el: HTMLElement, act: NpcActions) {
  const m = dailyMsg;
  const say = (t: string, to: HTMLElement = el) => { const p = document.createElement("p"); p.className = "nline"; p.textContent = t; to.appendChild(p); };
  if (!m) { say("…"); return; }
  const done = m.list.filter((x) => x.status === "done").length;
  say(done === m.list.length ? questChain(m.list[0]?.chain ?? "")?.finale ?? "" : `Khảo hạch hôm nay ${m.list.length} bài, làm bài nào trước cũng được. Nửa đêm ta đổi bài mới, bài dở dang bỏ luôn!`);
  m.list.forEach((q, i) => {
    const s = questChain(q.chain)?.steps[0]; if (!s) return;
    const box = document.createElement("div"); box.className = "qbox" + (q.status === "done" ? " qdone" : "");
    const h = document.createElement("b"); h.textContent = `Bài ${i + 1}/${m.list.length}: ${s.name}${q.status === "done" ? " (đã xong)" : ""}`; box.appendChild(h);
    if (q.status !== "done") {
      const d = document.createElement("span"); d.textContent = s.desc; box.appendChild(d);
      box.appendChild(questGoals(s, q.status === "offer" ? null : q.prog));
      box.appendChild(questRewardEl(s.reward));
      const line = q.status === "offer" ? s.offer.at(-1) : q.status === "ready" ? s.done[0] : "";
      if (line) { const p = document.createElement("i"); p.className = "qsay"; p.textContent = line; box.appendChild(p); }
      const b = document.createElement("button"); b.type = "button"; b.className = "buse " + (q.status === "active" ? "use" : "absorb");
      b.textContent = q.status === "offer" ? "Nhận bài" : q.status === "ready" ? "Trả bài, nhận thưởng" : "Đang làm…";
      b.disabled = q.status === "active";
      b.addEventListener("click", () => { b.blur(); act.quest(q.status === "offer" ? "accept" : "turnin", q.chain); });
      box.appendChild(b);
    }
    el.appendChild(box);
  });
}
