// Đại Đấu Hồn Trường (hàng đợi, trực tiếp, thanh trận, kết thúc, bảng xếp hạng) của HUD (tách nguyên văn từ hud.ts, Part of #885 bước 0a); hud.ts re-export để nơi gọi giữ nguyên.
import { NpcActions, npcDefOpen, npcPage, renderNpc } from "./hudNpc.ts";
import { itemDef, formatHonTe, ARENA, type ArenaRecord } from "../../shared/data.ts";
import { mmss } from "./hudBoss.ts";
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;

// ---------- Đại Đấu Hồn Trường (mục 5.9, bước 7.2): đang tìm trận, thanh trận đấu, kết quả, bảng xếp hạng ----------
/** Tin riêng "arenaTop": ARENA.topN dòng đầu (dòng của mình có `me`), hạng của mình, lượt thắng có thưởng còn lại hôm nay. */
export interface ArenaTopMsg {
  list: { name: string; elo: number; wins: number; losses: number; draws: number; me: boolean }[];
  me: (ArenaRecord & { rank: number }) | null; start: number; left: number; queued: boolean;
}
/**
 * Tin "arena" k = "end": kết quả trận của mình (score 1 thắng, 0,5 hòa, 0 thua), Elo trước / sau, phần thưởng (null = không có).
 * `friendly` (9.7): cặp đã đấu đủ ARENA.pairDaily trận tính Elo hôm nay, trận này giao hữu (không đổi Elo, không thưởng, không mất lượt);
 * cũng đặt cho bên thắng trận bỏ cuộc (`reason` "noshow", #790). `eloCapped` (#791): hôm nay đã cộng đủ ARENA.eloDaily Elo, trận không cộng Elo / thưởng.
 */
export interface ArenaEndMsg {
  score: number; reason: string; why: string; foe: string; elo0: number; elo1: number; rec: ArenaRecord;
  reward: { honTe: number; code: string; qty: number; coin: number } | null; left: number; secs: number; friendly?: boolean; eloCapped?: boolean;
}
export let arenaQ: { elo: number; t0: number } | null = null;   // đang xếp hàng: Elo, lúc bắt đầu chờ (performance.now)
export let arenaTopMsg: ArenaTopMsg | null = null;
let arenaEndMsg: (ArenaEndMsg & { end: number; act: { back(): void; top(): void } }) | null = null;
let arenaLeaveAt = 0;                                    // bấm "Rời sân" lần đầu (giữa trận phải bấm hai lần: rời = thua)
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "±0");

/** Ô "Đang tìm đối thủ…" (tin "arena" k = "queue"): Elo, thời gian chờ, nút Hủy (chuột / chạm). null = ẩn. */
export function setArenaQueue(q: { elo: number; secs: number } | null, cancel: () => void) {
  arenaQ = q ? { elo: q.elo, t0: performance.now() - q.secs * 1000 } : null;
  const el = $("#arenaQ");
  if (!arenaQ) { el.hidden = true; el.innerHTML = ""; }
  else {
    el.innerHTML = `<span class="spin"></span><div><b>Đang tìm đối thủ…</b><small></small></div><button type="button">Hủy</button>`;
    el.querySelector("button")!.addEventListener("pointerdown", (e) => { e.preventDefault(); cancel(); });
    el.hidden = false; updateArenaQueue();
  }
  if (npcDefOpen?.role === "arena") renderNpc();
}
/** Mỗi lần cập nhật HUD: thời gian đã chờ. */
export function updateArenaQueue() {
  const s = arenaQ && $("#arenaQ small"); if (!s || !arenaQ) return;
  const txt = `Elo ${arenaQ.elo} · đã chờ ${mmss((performance.now() - arenaQ.t0) / 1000)}`;
  if (s.textContent !== txt) s.textContent = txt;
}

/** Tin "arena" k = "live" (#280): trận đang đếm ngược / giao đấu; `secs` tính lúc server trả lời. */
export interface ArenaLiveMsg {
  list: { roomId: string; mode: string; sides: { name: string; elo: number }[]; phase: string; secs: number; watchers: number; max: number }[];
}
let arenaLiveMsg: (ArenaLiveMsg & { t0: number }) | null = null;
export let arenaLiveAt = -1e9;                                 // lần xin danh sách gần nhất (performance.now), server chỉ trả mỗi ARENA.topCd giây
export function arenaLiveAsk(act: NpcActions) { arenaLiveAt = performance.now(); act.arena("live"); }
/** Tin "arena" k = "live": lưu và vẽ lại trang danh sách nếu đang mở. */
export function setArenaLive(m: ArenaLiveMsg) {
  arenaLiveMsg = { list: Array.isArray(m.list) ? m.list : [], t0: performance.now() };
  if (npcDefOpen?.role === "arena" && npcPage === "live") renderNpc();
}
const liveSecs = (l: ArenaLiveMsg["list"][number], t0: number) => Math.max(0, l.secs - Math.floor((performance.now() - t0) / 1000));
const liveClock = (l: ArenaLiveMsg["list"][number], t0: number) => `${l.phase === "ready" ? "đếm ngược" : "còn"} ${mmss(liveSecs(l, t0))}`;
export function arenaLiveEl(act: NpcActions) {
  const box = document.createElement("div"); box.className = "alive";
  const m = arenaLiveMsg;
  if (!m) { const p = document.createElement("div"); p.className = "rnote"; p.textContent = "Đang xin danh sách…"; box.appendChild(p); return box; }
  if (!m.list.length) { const p = document.createElement("div"); p.className = "rnote"; p.textContent = "Chưa có trận nào đang diễn ra."; box.appendChild(p); return box; }
  for (const l of m.list) {
    const row = document.createElement("div"); row.className = "arow";
    const info = document.createElement("div"); info.className = "ainfo";
    const t = document.createElement("b"); t.textContent = `${l.mode} · ${l.sides.map((x) => `${x.name} (${x.elo})`).join("  ⚔  ")}`;
    const s = document.createElement("small"); s.textContent = `${l.phase === "ready" ? "Chuẩn bị" : "Giao đấu"} · `;
    const c = document.createElement("span"); c.className = "alvc"; c.dataset.i = String(m.list.indexOf(l)); c.textContent = liveClock(l, m.t0);
    s.append(c, ` · ${l.watchers}/${l.max} người xem`);
    info.append(t, s);
    const b = document.createElement("button"); b.type = "button"; b.className = "buse absorb"; b.textContent = "Xem"; b.disabled = l.watchers >= l.max;
    b.addEventListener("click", () => { b.blur(); act.arena("watch", l.roomId); });
    row.append(info, b); box.appendChild(row);
  }
  return box;
}
/** Mỗi lần cập nhật HUD: đồng hồ từng dòng của danh sách xem trận chạy tiếp giữa hai lần làm mới. */
export function updateArenaLive() {
  const m = arenaLiveMsg; if (!m || !$("#npc") || $("#npc").hidden) return;
  $("#npc").querySelectorAll<HTMLElement>(".alvc").forEach((e) => {
    const l = m.list[Number(e.dataset.i)], txt = l && liveClock(l, m.t0); if (txt && e.textContent !== txt) e.textContent = txt;
  });
}
/** Bảng xếp hạng (top ARENA.topN, dòng của mình sáng) kèm hạng / thành tích của mình và lượt thắng có thưởng còn lại. */
export function arenaRankEl(m: ArenaTopMsg | null) {
  const box = document.createElement("div"); box.className = "arank";
  if (!m) { box.textContent = "Đang tải bảng xếp hạng…"; return box; }
  const me = document.createElement("div"); me.className = "ame";
  me.textContent = m.me ? `Hạng ${m.me.rank} · Elo ${m.me.elo} · ${m.me.wins} thắng, ${m.me.losses} thua, ${m.me.draws} hòa`
    : `Chưa đấu trận nào (Elo khởi đầu ${m.start}).`;
  box.appendChild(me);
  const note = document.createElement("small");
  note.textContent = `Còn ${m.left}/${ARENA.dailyWins} trận thắng có thưởng hôm nay: ${formatHonTe(ARENA.winHonTe)} + ${ARENA.winShards} mảnh võ hồn mỗi trận.`;
  box.appendChild(note);
  const t = document.createElement("div"); t.className = "atable";
  t.innerHTML = `<div class="ar ah"><span>#</span><em>Hồn sư</em><i>Elo</i><i>T – B – H</i></div>`;
  m.list.forEach((r, i) => {
    const row = document.createElement("div"); row.className = "ar" + (r.me ? " me" : "");
    row.innerHTML = `<span>${i + 1}</span><em></em><i>${r.elo}</i><i>${r.wins} – ${r.losses} – ${r.draws}</i>`;
    row.querySelector("em")!.textContent = r.name;
    t.appendChild(row);
  });
  if (!m.list.length) { const e = document.createElement("small"); e.textContent = "Chưa ai đấu trận nào."; t.appendChild(e); }
  box.appendChild(t);
  return box;
}
/** Tin "arenaTop": vẽ lại trang xếp hạng trong hộp thoại NPC và bảng kết quả trận nếu đang mở. */
export function setArenaTop(m: ArenaTopMsg) {
  arenaTopMsg = m;
  if (npcDefOpen?.role === "arena") renderNpc();
  if (arenaEndMsg) renderArenaEnd();
}

/**
 * Thanh trận đấu ở đầu màn hình (phòng ArenaRoom): hai bên (tên, Elo, sinh lực cả đội theo %, số võ hồn còn đứng), đồng hồ của pha
 * (chờ vào sân, chuẩn bị, giao đấu), nút "Rời sân" (giữa trận bấm hai lần: rời = thua). null = ẩn.
 */
export function showArena(a: { phase: string; time: number; me: string; friendly: boolean; watchers: number; sides: { sid: string; name: string; elo: number; pct: number; alive: number; total: number }[];
    watch?: { follow: number; who: string; winner: number; pick(side: number): void } } | null,
  leave: () => void) {
  const el = $("#arenaBar"); document.body.classList.toggle("arena", !!a);
  if (!a) { el.hidden = true; el.innerHTML = ""; document.body.classList.remove("watching"); return; }
  if (!el.firstChild) {
    el.innerHTML = `<div class="aside a0"><b></b><small></small><div class="bar"><i></i><span></span></div></div>
      <div class="aclock"><b></b><small></small><em class="awatch" hidden></em><button type="button" class="aleave">Rời sân</button></div>
      <div class="aside a1"><b></b><small></small><div class="bar"><i></i><span></span></div></div>`;
    el.querySelector(".aleave")!.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (el.classList.contains("watching")) return leave();
      const fight = el.dataset.phase === "fight" || el.dataset.phase === "ready";
      if (fight && performance.now() - arenaLeaveAt > 3000) { arenaLeaveAt = performance.now(); el.querySelector(".aleave")!.textContent = "Rời = thua?"; return; }
      leave();
    });
  }
  el.hidden = false; el.dataset.phase = a.phase;
  const w = a.watch; el.classList.toggle("watching", !!w); document.body.classList.toggle("watching", !!w);
  a.sides.forEach((s, i) => {
    const box = el.querySelector(`.a${i}`) as HTMLElement; if (!box) return;
    const me = !w && s.sid.split(",").includes(a.me);
    box.classList.toggle("me", me);
    box.classList.toggle("follow", !!w && w.follow === i);
    if (w && !(box as HTMLElement & { _p?: boolean })._p) { (box as HTMLElement & { _p?: boolean })._p = true; box.addEventListener("pointerdown", (e) => { e.preventDefault(); arenaPick(i); }); }
    const name = `${s.name || "…"}${me ? " (đội của bạn)" : ""}`;
    if (box.querySelector("b")!.textContent !== name) box.querySelector("b")!.textContent = name;
    box.querySelector("small")!.textContent = `Elo ${s.elo}${s.sid ? "" : " · chưa vào sân"}${w && w.follow === i && w.who ? ` · theo dõi ${w.who}` : ""}`;
    (box.querySelector(".bar i") as HTMLElement).style.width = `${Math.round(s.pct * 1000) / 10}%`;
    box.querySelector(".bar span")!.textContent = `${Math.round(s.pct * 100)}% · ${s.alive}/${s.total} võ hồn`;
  });
  const ph = a.phase === "wait" ? "Chờ đối thủ vào sân" : a.phase === "ready" ? "Chuẩn bị" : a.phase === "fight" ? "Giao đấu" : "Kết thúc";
  el.querySelector(".aclock b")!.textContent = a.phase === "end" ? "–" : mmss(a.time);
  el.querySelector(".aclock small")!.textContent = a.friendly ? `${ph} · giao hữu` : ph;
  el.classList.toggle("friendly", a.friendly);
  el.title = a.friendly ? `Giao hữu: hai bạn đã đấu đủ ${ARENA.pairDaily} trận tính Elo hôm nay, trận này không đổi Elo, không thưởng.` : "";
  const lb = el.querySelector(".aleave")!, aw = el.querySelector(".awatch") as HTMLElement;
  aw.hidden = !w && !a.watchers; aw.textContent = w ? `Đang xem · ${a.watchers} người xem` : `${a.watchers} người xem`;
  arenaPick = w?.pick ?? (() => {});
  el.title = w ? "Bấm tên một bên để đổi người theo dõi (bên có hai người thì bấm lần nữa để đổi sang đồng đội)." : el.title;
  if (w) { lb.textContent = "Rời xem"; renderWatchEnd(a.phase === "end" ? a : null, a.sides, w.winner, leave); return; }
  renderWatchEnd(null, a.sides, -1, leave);
  if (performance.now() - arenaLeaveAt > 3000 && lb.textContent !== "Rời sân") lb.textContent = "Rời sân";
}
let arenaPick: (side: number) => void = () => {};
/** Bảng kết quả của người xem (không có dòng Elo / thưởng của mình): bên thắng, sinh lực / số võ hồn còn đứng mỗi bên, nút về bản đồ cũ. null = ẩn. */
function renderWatchEnd(a: { time: number } | null, sides: { name: string; elo: number; pct: number; alive: number; total: number }[], winner: number, back: () => void) {
  const el = $("#arenaEnd");
  if (!a) { if (el.dataset.w) { el.dataset.w = ""; el.hidden = true; el.innerHTML = ""; } return; }
  if (!el.dataset.w) {
    el.dataset.w = "1"; el.hidden = false; el.className = "panel watchend"; el.innerHTML = "";
    const h = document.createElement("h2"); el.appendChild(h);
    for (let i = 0; i < 2; i++) { const l = document.createElement("div"); l.className = "aline"; el.appendChild(l); }
    const row = document.createElement("div"); row.className = "brow";
    const b = document.createElement("button"); b.type = "button"; b.className = "buse absorb"; b.textContent = "Về bản đồ cũ";
    b.addEventListener("click", () => { b.blur(); back(); }); row.appendChild(b); el.appendChild(row);
    const k = document.createElement("small"); k.className = "rnote"; el.appendChild(k);
  }
  const set = (e: Element | null, t: string) => { if (e && e.textContent !== t) e.textContent = t; };
  const win = winner === 0 || winner === 1 ? sides[winner] : null;
  set(el.querySelector("h2"), win ? `${win.name} thắng` : "Hòa");
  el.querySelectorAll(".aline").forEach((l, i) => { const s = sides[i]; if (s) set(l, `${s.name} (Elo ${s.elo}): ${Math.round(s.pct * 100)}% sinh lực · ${s.alive}/${s.total} võ hồn còn đứng`); });
  set(el.querySelector("small"), `Tự về bản đồ cũ sau ${Math.max(0, Math.ceil(a.time))} giây.`);
}

/** Bảng kết quả trận (tin "arena" k = "end"): thắng / thua / hòa, lý do, Elo trước → sau, phần thưởng, bảng xếp hạng, nút về bản đồ. */
export function arenaEnd(m: ArenaEndMsg | null, act: { back(): void; top(): void }) {
  arenaEndMsg = m ? { ...m, end: performance.now() + m.secs * 1000, act } : null;
  if (!m) { const el = $("#arenaEnd"); el.hidden = true; el.innerHTML = ""; el.dataset.w = ""; return; }
  $("#arenaEnd").dataset.w = "";
  renderArenaEnd();
}
function renderArenaEnd() {
  const m = arenaEndMsg, el = $("#arenaEnd"); if (!m) return;
  el.hidden = false; el.innerHTML = "";
  el.className = "panel " + (m.score === 1 ? "win" : m.score === 0 ? "lose" : "draw");
  const h = document.createElement("h2"); h.textContent = m.score === 1 ? "Thắng!" : m.score === 0 ? "Thua" : "Hòa"; el.appendChild(h);
  const line = (text: string, cls = "") => { const p = document.createElement("div"); p.className = "aline " + cls; p.textContent = text; el.appendChild(p); };
  const noshow = m.reason === "noshow";
  if (m.friendly) line(noshow ? "Đối thủ bỏ cuộc: trận không tính Elo, không thưởng." : `Trận giao hữu: hai bạn đã đấu đủ ${ARENA.pairDaily} trận tính Elo hôm nay (đặt lại 00:00 giờ Việt Nam).`, "afriend");
  else if (m.eloCapped) line(`Hôm nay bạn đã cộng đủ ${ARENA.eloDaily} Elo: trận này không cộng Elo, không thưởng (đặt lại 00:00 giờ Việt Nam).`, "afriend");
  line(`Đối thủ ${m.foe}: ${m.why}.`);
  line(m.friendly ? `Elo giữ nguyên: ${m.elo1}` : `Elo ${m.elo0} → ${m.elo1} (${signed(m.elo1 - m.elo0)})`, "aelo");
  line(`Thành tích: ${m.rec.wins} thắng · ${m.rec.losses} thua · ${m.rec.draws} hòa`);
  if (m.friendly) line(noshow ? "Không thưởng, không tính thành tích, không mất lượt thắng có thưởng." : "Giao hữu không thưởng, không tính thành tích, không mất lượt thắng có thưởng.");
  else if (m.reward) {
    const shard = m.reward.qty ? ` + ${m.reward.qty} ${itemDef(m.reward.code)?.name ?? m.reward.code}` : "";
    line(`Thưởng: ${formatHonTe(m.reward.honTe)}${shard}${m.reward.coin ? " (túi đầy: mảnh đổi ra Hồn Tệ)" : ""}`, "arew");
  } else if (m.score === 1 && !m.eloCapped) line("Hết lượt thắng có thưởng hôm nay (Elo vẫn tính).");
  else if (m.score === 0 && noshow) line("Bỏ cuộc bị tính như thua: trừ Elo, không mất kinh nghiệm hay đồ.");
  else line("Thua không mất gì: không mất kinh nghiệm hay đồ.");
  line(`Còn ${m.left}/${ARENA.dailyWins} trận thắng có thưởng hôm nay.`);
  el.appendChild(arenaRankEl(arenaTopMsg));
  const row = document.createElement("div"); row.className = "brow";
  const b = document.createElement("button"); b.type = "button"; b.className = "buse absorb"; b.textContent = "Về bản đồ cũ";
  b.addEventListener("click", () => { b.blur(); m.act.back(); }); row.appendChild(b);
  const t = document.createElement("button"); t.type = "button"; t.className = "buse use"; t.textContent = "Xem lại bảng xếp hạng";
  t.addEventListener("click", () => { t.blur(); m.act.top(); }); row.appendChild(t);
  el.appendChild(row);
  const k = document.createElement("small"); k.className = "rnote acd"; el.appendChild(k);
  updateArenaEnd();
}
/** Mỗi lần cập nhật HUD: số giây trước khi tự về bản đồ cũ. */
export function updateArenaEnd() {
  const m = arenaEndMsg, k = m && $("#arenaEnd .acd"); if (!m || !k) return;
  const txt = `Tự về bản đồ cũ sau ${Math.max(0, Math.ceil((m.end - performance.now()) / 1000))} giây.`;
  if (k.textContent !== txt) k.textContent = txt;
}
