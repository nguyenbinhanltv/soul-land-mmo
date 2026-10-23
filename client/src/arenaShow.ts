// G6 (#397): trình diễn PK / đấu trường. Chỉ hiển thị ở client, đọc ArenaState công khai; server vẫn quyết thắng thua, không đổi luật / số cân bằng.
// Hằng số ở đây là thời lượng / độ mạnh hiệu ứng, KHÔNG phải số cân bằng (số cân bằng ở shared/data.ts).
import Phaser from "phaser";
import { VOHON } from "../../shared/data.ts";
import { artUrl } from "./uiArt.ts";

type Level = "low" | "mid" | "high";
const FX_KEY = "soul-land-fx-v1"; // cùng khoá với tùy chọn hiệu ứng của G1 (#392)
function prefs(): { level: Level; reduce: boolean } {
  let reduce = false;
  try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { /* không có matchMedia */ }
  try {
    const r = JSON.parse(window.localStorage.getItem(FX_KEY) ?? "null");
    if (r && typeof r === "object") return { level: r.level === "low" || r.level === "high" ? r.level : "mid", reduce: typeof r.reduce === "boolean" ? r.reduce : reduce };
  } catch { /* hỏng thì dùng mặc định Vừa */ }
  return { level: "mid", reduce };
}

const FEED_MAX = 4, FEED_MS = 6000, SLOW_MS = 500, SLOW_K = 0.3, LOW_HP = 0.25, SKILL_MS = 3000;
const ZOOM: Record<Level, number> = { low: 1, mid: 1.12, high: 1.22 };
const BEAT_S: Record<Level, number> = { low: 1.2, mid: 0.9, high: 0.65 };

/** Móc âm thanh (trống mở trận, đếm ngược, tiếng ngân kết liễu, nhịp tim): để rỗng cho tới khi G2 #393 / G5 #396 merge (chỉ CC0, ghi art/CREDITS.md). */
export interface ArenaSfx { drum(): void; tick(n: number): void; finisher(): void; heart(): void }
const NO_SFX: ArenaSfx = { drum() {}, tick() {}, finisher() {}, heart() {} };

interface SideView { sid: string; name: string; elo: number; alive: number; total: number; pct: number }
interface ArenaView { phase: string; time: number; winner: number; sides: SideView[]; players: Map<string, { vh: number; hp: number; maxHp: number; dead: boolean }> }

const el = (cls: string, html = "") => { const d = document.createElement("div"); d.className = cls; d.innerHTML = html; return d; };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export class ArenaShow {
  private vs = el("avs"); private feed = el("afeed"); private big = el("abig"); private lowhp = el("alow");
  private phase = ""; private alive: number[] | null = null; private skills = new Map<string, { name: string; t: number }>();
  private shown = false; private lastN = -1; private finished = false; private beatT = 0;

  constructor(private scene: Phaser.Scene, private sfx: ArenaSfx = NO_SFX) {
    for (const e of [this.vs, this.feed, this.big, this.lowhp]) { e.hidden = true; document.body.appendChild(e); }
    this.vs.setAttribute("aria-hidden", "true"); this.big.setAttribute("aria-hidden", "true"); this.lowhp.setAttribute("aria-hidden", "true");
  }

  destroy() { for (const e of [this.vs, this.feed, this.big, this.lowhp]) e.remove(); this.scene.tweens.timeScale = 1; }

  /** Ghi lại tên hồn kỹ vừa tung (tin fx "soulring") để bảng hạ gục biết kẻ hạ gục dùng chiêu gì. */
  noteSkill(id: string, name: string) { this.skills.set(id, { name, t: performance.now() }); }

  update(a: ArenaView, me: string, watching: boolean) {
    const pf = prefs(), now = performance.now();
    if (a.phase !== this.phase) this.onPhase(a, pf);
    this.phase = a.phase;
    if (a.phase === "ready") this.countdown(a, pf);
    this.kills(a, now);
    this.lowHp(a, me, watching, pf);
    this.feed.querySelectorAll<HTMLElement>("[data-t]").forEach((e) => { if (now - Number(e.dataset.t) > FEED_MS) e.remove(); });
  }

  private face(a: ArenaView, s: SideView) {
    const p = s.sid.split(",").map((x) => a.players.get(x)).find((x) => x), id = p ? VOHON[p.vh]?.id : undefined;
    const src = id ? artUrl(`portrait_${id}`) : null;
    return `<div class="avf">${src ? `<img src="${esc(src)}" alt="">` : ""}<b>${esc(s.name || "…")}</b><small>Elo ${s.elo}</small></div>`;
  }

  private onPhase(a: ArenaView, pf: { level: Level; reduce: boolean }) {
    if (a.phase === "ready" && !this.shown && a.sides.length === 2) {
      this.shown = true; this.finished = false; this.lastN = -1;
      this.vs.innerHTML = `${this.face(a, a.sides[0])}<div class="avm"><span>VS</span><em></em></div>${this.face(a, a.sides[1])}`;
      this.vs.classList.toggle("calm", pf.reduce || pf.level === "low");
      this.vs.hidden = false; this.sfx.drum();
    } else if (a.phase === "fight") {
      this.vs.hidden = true;
      if (this.shown) this.flash("CHIẾN!", "go");
    } else if (a.phase === "end" && this.phase === "fight" && !this.finished) {
      this.finished = true; this.finisher(a, pf);
    }
  }

  private countdown(a: ArenaView, pf: { level: Level; reduce: boolean }) {
    const n = Math.max(0, Math.ceil(a.time)), t = this.vs.querySelector("em");
    if (!t || n > 3 || n === this.lastN) return;
    this.lastN = n; t.textContent = n ? String(n) : "";
    if (n) { this.sfx.tick(n); t.classList.remove("pop"); void (t as HTMLElement).offsetWidth; if (!pf.reduce) t.classList.add("pop"); }
  }

  private flash(text: string, cls: string) {
    this.big.hidden = false; this.big.className = `abig ${cls}`; this.big.textContent = text;
    this.big.style.animation = "none"; void this.big.offsetWidth; this.big.style.animation = "";
    window.setTimeout(() => { this.big.hidden = true; }, 1400);
  }

  private kills(a: ArenaView, now: number) {
    const cur = a.sides.map((s) => s.alive);
    if (this.alive && a.phase === "fight") a.sides.forEach((s, i) => {
      if (cur[i] >= (this.alive![i] ?? cur[i])) return;
      const foe = a.sides[1 - i]; if (!foe) return;
      const hit = foe.sid.split(",").map((id) => this.skills.get(id)).filter((k) => k && now - k.t < SKILL_MS).sort((x, y) => y!.t - x!.t)[0];
      const row = el("akill", `<b>${esc(foe.name || "…")}</b> hạ <b>${esc(s.name || "…")}</b> bằng <i>${esc(hit?.name ?? "đòn thường")}</i>`);
      row.dataset.t = String(now); this.feed.hidden = false; this.feed.prepend(row);
      while (this.feed.children.length > FEED_MAX) this.feed.lastElementChild!.remove();
    });
    this.alive = a.phase === "wait" ? null : cur;
  }

  private lowHp(a: ArenaView, me: string, watching: boolean, pf: { level: Level; reduce: boolean }) {
    const p = a.players.get(me), on = !watching && a.phase === "fight" && !!p && !p.dead && p.maxHp > 0 && p.hp / p.maxHp < LOW_HP;
    this.lowhp.hidden = !on;
    if (!on) return;
    this.lowhp.classList.toggle("calm", pf.reduce);
    this.lowhp.style.setProperty("--beat", `${BEAT_S[pf.level]}s`);
    const now = performance.now();
    if (!pf.reduce && now - this.beatT > BEAT_S[pf.level] * 1000) { this.beatT = now; this.sfx.heart(); }
  }

  /** Đòn kết liễu: chậm 0,5 s + zoom vào bên thua + chữ thắng / thua lớn; Thấp / Giảm chuyển động chỉ hiện chữ. */
  private finisher(a: ArenaView, pf: { level: Level; reduce: boolean }) {
    const w = a.winner, cam = this.scene.cameras.main, fancy = !pf.reduce && pf.level !== "low";
    this.sfx.finisher();
    if (fancy) {
      const z0 = cam.zoom, tw = this.scene.tweens;
      tw.timeScale = SLOW_K;
      cam.zoomTo(z0 * ZOOM[pf.level], 250);
      window.setTimeout(() => { tw.timeScale = 1; cam.zoomTo(z0, 600); }, SLOW_MS);
    }
    window.setTimeout(() => this.flash(w === 0 || w === 1 ? `${a.sides[w]?.name ?? ""} thắng` : "Hòa", w === 0 || w === 1 ? "win" : "draw"), fancy ? SLOW_MS : 0);
  }
}
