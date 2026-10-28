// Phòng Bí Cảnh (mục 5.22, docs/design/bi-canh.md, bước P3): một lượt Luyện Hồn Cảnh solo. Lớp con của MapRoom trên sân `ARENA_MAP` (MVP dùng chung bản đồ sân đấu, chưa có bản đồ riêng):
// dùng lại nguyên vòng lặp, di chuyển, đánh thường, hồn kỹ, tiên cơ, Chân Thân, đổi võ hồn. Ở đây chỉ có luật riêng: các pha (chờ vào phòng, đếm ngược, giao đấu, kết quả), các sóng hồn thú
// theo kịch bản dữ liệu `BICANH.scenes[].waves`, chốt kết quả MỘT lần, thưởng Hồn Kinh Quyển theo số sóng đã hạ do server đếm, hoàn lượt khi lỗi hệ thống. Mọi thứ do server quyết; client chỉ gửi ý định.
// Lượt đã trừ ở bicanh.ts (`enterRun`) bằng vé `Ticket`; phòng chỉ mở bằng vé đó, một người, một lần.
import { Client, ServerError } from "colyseus";
import { MapRoom, seatAccount, type AuthData, type PData, type SeatPass } from "./MapRoom.ts";
import { BLOCKED, ARENA_END_CODE } from "./ArenaRoom.ts";
import { BICANH, BOSSES, MAX_RINGS, SPAWN_PLAYER_GAP, TIERS, TILE, ARENA_MAP, beastIndex, bicanhTomeKind, ringLimit, dir4 } from "../../../shared/data.ts";
import { store } from "../db.ts";
import { bicanhTickets, refundRun, releaseRun, type Ticket } from "./bicanh.ts";

type Phase = "wait" | "ready" | "fight" | "end";
type Reason = "win" | "dead" | "time" | "leave" | "noshow";
const REASON_TEXT: Record<Reason, string> = { win: "hạ hết các sóng", dead: "đội võ hồn gục hết", time: "hết giờ", leave: "rời phòng giữa chừng", noshow: "không vào phòng" };
const DENY_GAP_MS = 1000;
/** Tin ngoài trận bị chặn trong phòng Bí Cảnh: như sân đấu, thêm đổi túi (sắp xếp / khóa / tự bán) và `arena`; để túi chỉ đổi bởi phần thưởng và kết quả không lệch giữa RAM và DB. */
const ROOM_BLOCKED = [...BLOCKED, "arena", "sortbag", "lock", "autosell"];

export class BiCanhRoom extends MapRoom {
  maxClients = 1;
  ticket!: Ticket;
  phase: Phase = "wait";
  /** Giây còn lại của pha hiện tại (không đồng bộ state; client nhận qua tin `bicanh`). */
  time = 0;
  /** Phiên của người chơi (rỗng tới khi vào); kết quả đã chốt (finish chỉ chạy một lần); đã đưa người ra khỏi phòng. */
  sid = ""; done = false; kicked = false;
  /** Sóng hiện tại (−1 = chưa bắt đầu), hồn thú của sóng chưa hạ, số sóng đã hạ hết, giây nghỉ còn lại tới sóng kế. */
  /** Số hồn hoàn dùng tính niên hạn mọi sóng: chốt MỘT lần lúc vào phòng (võ hồn nhiều hồn hoàn nhất trong đội hình), đổi võ hồn giữa chừng không hạ độ khó. */
  ringsLocked = 0;
  wave = -1; waveBids = new Set<string>(); cleared = 0; gap = 0;
  private denyAt = new Map<string, number>();

  async onCreate(options: { mapId?: unknown; ticket?: unknown }) {
    // Mỗi vé đúng một phòng: lần mở thứ hai (kể cả client tự gọi create) bị từ chối.
    const t = typeof options?.ticket === "string" ? bicanhTickets.get(options.ticket) : undefined;
    if (!t || t.roomId || t.settled) throw new ServerError(400, "Phòng Bí Cảnh không tồn tại.");
    t.roomId = this.roomId; this.ticket = t;
    void this.setPrivate(true);
    await this.setup(ARENA_MAP);
    this.interest.all = true; // sân nhỏ: không lọc đồng bộ theo vùng
    this.phase = "wait"; this.time = BICANH.joinSecs;
    for (const k of ROOM_BLOCKED) this.onMessage(k, (c) => this.deny(c.sessionId, k, "Đang ở Bí Cảnh: không làm được việc này trong phòng."));
    this.onMessage("quest", (c, msg: { op: unknown }) => { if (msg?.op === "get") this.askQuest(c.sessionId); else this.log(c.sessionId, "Đang ở Bí Cảnh: nhiệm vụ để sau.", "#ffb35c"); });
  }

  /** Trước khi giữ chỗ (#235): token hợp lệ, chưa giữ quá số chỗ; không đối chiếu bản đồ đang đứng (seatAllowed kiểm vé). */
  static async onAuth(_token: string, options: { token?: unknown }) { return seatAccount(options?.token, null); }
  /** Chỉ đúng chủ vé, một lần, khi phòng chưa chốt. */
  seatAllowed(pass: SeatPass) { return pass.seatFor === this.ticket.accountId && !this.done && !this.ticket.joined; }
  async checkJoin(accountId: number) {
    if (accountId !== this.ticket.accountId) throw new ServerError(403, "Bạn không có vé vào phòng Bí Cảnh này.");
    if (this.done || this.ticket.settled) throw new ServerError(409, "Phòng Bí Cảnh đã kết thúc.");
    const [ch, looks, loc] = await Promise.all([store.getCharacter(accountId), store.getLooks(accountId), store.getLocation(accountId)]);
    if (!looks.chosen || !ch) throw new ServerError(403, "Chưa có hồn sư.");
    return { ch, looks, loc };
  }

  /** Vào phòng: đầy sinh lực, đứng bên trái sân quay mặt vào sân; bắt đầu đếm ngược (vé đã dùng, vào lần nữa không được). */
  onJoin(client: Client, o: unknown, auth: AuthData) {
    super.onJoin(client, o, auth);
    const p = this.state.players.get(client.sessionId)!, d = this.pdata.get(client.sessionId)!, sp = this.map.spawn;
    this.sid = client.sessionId; this.ticket.joined = true;
    p.x = Math.round(sp.x + sp.w * 0.25); p.y = Math.round(sp.y + sp.h * 0.5);
    d.dir = { x: 1, y: 0 }; p.dir = dir4(1, 0);
    this.ringsLocked = Math.max(p.rings.length, d.ch.rings.length, ...d.team.map((rid) => d.owned.find((v) => v.rowId === rid)?.rings.length ?? 0));
    this.phase = "ready"; this.time = BICANH.readySecs;
    client.send("bicanh", { k: "ready", id: this.ticket.scene.id, name: this.ticket.scene.name, waves: this.ticket.scene.waves.length, secs: BICANH.readySecs });
  }

  /** Rời phòng trước khi có kết quả (đóng tab, mất mạng, bấm rời) là thua, giữ phần sóng đã hạ (mục 5.22). */
  async onLeave(client: Client) {
    if (client.sessionId === this.sid && !this.done) this.finish("leave");
    await super.onLeave(client);
  }
  /** Rời phòng là về bản đồ cũ, không phải rời game: giữ danh sách mua lại của thương nhân (9.8). */
  override forgetBuyback() {}
  async onDispose() {
    try { await super.onDispose(); } finally {
      // Phòng đóng khi vé chưa chốt (hủy, hoặc phòng sập trước khi có kết quả): lỗi hệ thống, hoàn lượt.
      if (this.ticket) { await refundRun(this.ticket, "phòng đóng khi chưa chốt"); bicanhTickets.delete(this.ticket.id); }
    }
  }

  private deny(id: string, key: string, text: string) {
    const k = `${id}:${key}`, now = Date.now();
    if (now - (this.denyAt.get(k) ?? 0) < DENY_GAP_MS) return;
    this.denyAt.set(k, now); this.log(id, text, "#ffb35c");
  }
  /** Đánh, hồn kỹ, Chân Thân chỉ khi đang giao đấu (như sân đấu). */
  private fighting(id: string) {
    if (this.phase === "fight") return true;
    this.deny(id, "act", this.phase === "end" ? "Phòng Bí Cảnh đã kết thúc." : "Chưa vào trận: đợi đếm ngược xong.");
    return false;
  }
  attack(id: string) { if (this.fighting(id)) super.attack(id); }
  skill(c: Client, i: number) { if (this.fighting(c.sessionId)) super.skill(c, i); }
  boneSkill(c: Client, i: number) { if (this.fighting(c.sessionId)) super.boneSkill(c, i); }
  chanThan(c: Client) { if (this.fighting(c.sessionId)) super.chanThan(c); }
  switchSlot(c: Client, slot: number) { if (this.phase !== "end") super.switchSlot(c, slot); }
  /** Không mời / nhận lời mời tổ đội trong phòng solo. */
  async partyAction(id: string, m: unknown) {
    const op = (m as { op?: unknown } | null)?.op;
    if (op === "invite" || op === "accept") return this.log(id, "Đang ở Bí Cảnh: mời / nhận tổ đội sau.", "#ffb35c");
    await super.partyAction(id, m);
  }
  /** Võ hồn đã gục không hồi trong phòng; đội hình, võ hồn ra trận, vị trí trong DB giữ như trước khi vào (không ghi). */
  tickDowns(_id: string, _dt: number) {}
  persistTeam(_d: PData) {}
  /** Trong phòng chỉ túi đồ có thể đổi (phần thưởng): không ghi võ hồn hay vị trí. */
  async write(id: string) {
    const d = this.pdata.get(id); if (!d) return false;
    const bag = this.unsavedBag(d); if (!bag) return true;
    try { await store.saveBag(d.accountId, bag); } catch (e) { d.bagDirty = true; throw e; }
    d.tongPend.splice(0, bag.tongPts?.length ?? 0);
    return true;
  }

  // ---------- Luật phòng ----------
  /**
   * Hạ hồn thú trong phòng: chỉ tính sóng, KHÔNG kinh nghiệm, Hồn Tệ, hồn hoàn / hồn cốt / hồn hạch / trang bị rơi (luật chung 6, mục 5.22): thưởng chỉ theo bảng thưởng của phụ bản (finish).
   * Chỉ hồn thú do kịch bản sinh (waveBids) mới tính vào sóng.
   */
  killBeast(bid: string, _by: string) {
    const b = this.state.beasts.get(bid); if (!b) return;
    this.state.beasts.delete(bid); this.bdata.delete(bid);
    this.waveBids.delete(bid);
    this.broadcast("fx", { k: "wave", x: b.x, y: b.y, r: TIERS[b.tier].size + 10, col: TIERS[b.tier].glow });
  }

  /** Sinh sóng kế: tuổi = yearsPct × giới hạn niên hạn của vòng kế tiếp của võ hồn nhiều hồn hoàn nhất trong đội hình lúc vào phòng (`ringsLocked`, không vượt tầm vòng đó); sóng có `elite` kèm một tinh anh. */
  nextWave() {
    const sc = this.ticket.scene, w = sc.waves[++this.wave], p = this.state.players.get(this.sid); if (!w || !p) return;
    const years = Math.max(10, Math.round(ringLimit(Math.min(MAX_RINGS, this.ringsLocked + 1)) * w.yearsPct)), ids = sc.beasts.map((id) => beastIndex(id)).filter((i) => i >= 0);
    const place = () => {
      const maxX = this.map.MW * TILE, maxY = this.map.MH * TILE;
      for (let k = 0; k < 60; k++) {
        const x = 3 * TILE + Math.random() * (maxX - 6 * TILE), y = 3 * TILE + Math.random() * (maxY - 6 * TILE);
        if (!this.map.hits(x, y, 6, 4) && Math.hypot(p.x - x, p.y - y) >= SPAWN_PLAYER_GAP) return { x, y };
      }
      return { x: maxX * 0.75, y: maxY * 0.5 };
    };
    for (let i = 0; i < w.n; i++) { const { x, y } = place(); this.waveBids.add(this.addBeast(0, years, ids[Math.floor(Math.random() * ids.length)], x, y)); }
    if (w.elite) {
      const elites = BOSSES.map((b, i) => (b.rank === 1 ? i : -1)).filter((i) => i >= 0), { x, y } = place();
      if (elites.length) this.waveBids.add(this.addBeast(0, years, elites[this.ringsLocked % elites.length], x, y, 1));
    }
    this.clients.getById(this.sid)?.send("bicanh", { k: "wave", wave: this.wave + 1, of: sc.waves.length, n: this.waveBids.size, elite: w.elite, secs: this.time });
  }

  tick(dt: number) {
    super.tick(dt);
    this.time = Math.max(0, this.time - dt);
    if (this.phase === "wait") { if (this.time <= 0 && !this.done) this.cancel(); return; }
    if (this.phase === "ready" && this.time <= 0) {
      this.phase = "fight"; this.time = this.ticket.scene.fightSecs;
      const d = this.pdata.get(this.sid); if (d) d.inv = 0; // bỏ khung bất tử lúc vào (đếm ngược không ai bị đánh)
      this.clients.getById(this.sid)?.send("bicanh", { k: "fight", secs: this.time, waves: this.ticket.scene.waves.length });
      this.nextWave();
    } else if (this.phase === "fight") {
      for (const bid of this.waveBids) if (!this.state.beasts.has(bid)) this.waveBids.delete(bid); // biến mất (hook test) cũng coi là hạ
      const p = this.state.players.get(this.sid), sc = this.ticket.scene;
      if (!p || p.dead) this.finish("dead");
      else if (this.time <= 0) this.finish("time");
      else if (this.gap > 0) { if ((this.gap -= dt) <= 0) { this.gap = 0; this.nextWave(); } }
      else if (!this.waveBids.size && this.wave >= 0) {
        this.cleared = this.wave + 1;
        this.clients.getById(this.sid)?.send("bicanh", { k: "clear", wave: this.cleared, of: sc.waves.length, tomes: sc.waves.slice(0, this.cleared).reduce((a, x) => a + x.tomes, 0) });
        if (this.cleared >= sc.waves.length) this.finish("win"); else this.gap = BICANH.waveGapSecs;
      }
    } else if (this.phase === "end" && this.time <= 0 && !this.kicked) {
      this.kicked = true;
      for (const c of this.clients) c.leave(ARENA_END_CODE);
    }
  }

  /** Không ai vào phòng trong BICANH.joinSecs giây: hủy, hoàn lượt (người chơi chưa nhận gì; lượt đã trừ ở enterRun). */
  cancel() {
    this.done = true; this.kicked = true; this.phase = "end";
    void refundRun(this.ticket, "không vào phòng").then(() => this.disconnect());
  }

  /**
   * Kết quả (một lần, theo vé): số sóng đã hạ hết do server đếm (`cleared`); thưởng quyển theo các sóng đó, kẹp trần quyển nhận mỗi ngày Bí Cảnh (BICANH.tomeDailyCap, tính ở boss_claims theo `ticket.day`).
   * Quyển ghi vào túi và tăng bộ đếm ngày trong MỘT transaction (`store.claimBoss`) trong chuỗi lưu của người chơi, trên BẢN SAO túi (túi đang chơi chỉ đổi sau khi DB xác nhận). DB lỗi thì không thưởng và hoàn lượt.
   * Tin `bicanh {k: "end"}` gửi sau khi DB xác nhận. Người rời giữa chừng nhận phần các sóng đã xong (finish chạy trước khi MapRoom.onLeave lưu), không nhận thêm.
   */
  finish(reason: Reason) {
    if (this.done) return;
    this.done = true; this.phase = "end"; this.time = BICANH.endSecs;
    for (const bid of [...this.state.beasts.keys()]) { this.state.beasts.delete(bid); this.bdata.delete(bid); }
    this.waveBids.clear();
    const t = this.ticket, sc = t.scene, sid = this.sid, d = this.pdata.get(sid), p = this.state.players.get(sid);
    if (p && d && p.dead) d.deadT = Infinity; // gục thì nằm lại tới khi rời phòng
    if (t.settled) return; // đã chốt (hoàn lượt) ở nơi khác
    t.settled = true;
    const tomes = sc.waves.slice(0, this.cleared).reduce((a, w) => a + w.tomes, 0), win = reason === "win";
    const report = (extra: Record<string, unknown>) => this.clients.getById(sid)?.send("bicanh", { k: "end", win, reason, why: REASON_TEXT[reason], cleared: this.cleared, of: sc.waves.length, tomes: 0, secs: this.time, ...extra });
    const save = async () => {
      if (tomes <= 0) return report({});
      if (!d) { console.error(`[bí cảnh] tài khoản #${t.accountId} không còn trong phòng lúc chốt: ${tomes} quyển không ghi được`); return; }
      try {
        const got = await store.bossClaims(t.accountId, t.day, bicanhTomeKind), give = Math.min(tomes, Math.max(0, BICANH.tomeDailyCap - got));
        if (give <= 0) return report({ capped: true });
        const items = d.bag, dirty = d.bagDirty;
        d.bag = items.map((it) => ({ ...it, stats: it.stats == null ? null : structuredClone(it.stats) }));
        const qty = this.addItem(d, BICANH.tome, give), after = d.bag, snap = this.bagSnapshot(d);
        d.bag = items; d.bagDirty = dirty;
        if (qty <= 0) return report({ full: true });
        const n = await store.claimBoss(t.accountId, t.day, bicanhTomeKind, BICANH.tomeDailyCap, snap, qty);
        if (n === null) return report({ capped: true });
        if (this.pdata.get(sid) === d) { d.bag = after; this.sendBag(sid); }
        report({ tomes: qty, capped: give < tomes, full: qty < give });
      } catch (e) {
        console.error(`[bí cảnh] không lưu được thưởng tài khoản #${t.accountId}`, e);
        await releaseRun(t, "không lưu được kết quả");
        this.log(sid, "Không lưu được kết quả Bí Cảnh: quyển chưa nhận, lượt đã được hoàn lại.", "#ff8a8a");
        report({ err: "Không lưu được kết quả: quyển chưa nhận, lượt đã được hoàn lại.", refunded: true });
      }
    };
    if (d) this.chain(d, save); else void save();
  }

  /** Hook kiểm thử (GAME_TEST=1): `bcfast {s}` rút giây còn lại của pha hiện tại xuống `s`; còn lại như MapRoom. */
  async testHook(c: Client, m: unknown) {
    const o = (typeof m === "object" && m !== null ? m : {}) as Record<string, unknown>;
    if (process.env.GAME_TEST === "1" && o.op === "bcfast") {
      this.time = Math.min(this.time, Math.max(0, Number(o.s) || 0));
      this.sendVohons(c);
      c.send("test", { op: "bcfast", enabled: true, phase: this.phase, wave: this.wave, cleared: this.cleared, beasts: [...this.waveBids] });
      return;
    }
    await super.testHook(c, m);
  }
}
