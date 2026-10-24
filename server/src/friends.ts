// Bạn bè và chặn (mục 5.9 "Bạn bè", #195). Mỗi người tự thêm vào danh sách của mình (tối đa FRIEND_MAX), chỉ khi hai bên đã thêm
// nhau mới thấy nhau đang online và ở bản đồ / kênh nào. Chặn (tối đa BLOCK_MAX) lọc tin riêng, lời mời tổ đội, lời thêm bạn và chat
// bản đồ / tổ đội / thế giới của người bị chặn; chặn thì tự bỏ người đó khỏi danh sách bạn bè.
// File này giữ danh sách của người đang trong game (khóa theo accountId; nạp ở onAuth, bỏ khi rời phòng) và luật. MapRoom ghi DB phần
// của chính người gửi qua chuỗi lưu (không ghi chéo tài khoản khác), rồi phát mỗi FriendNote lên presence FRIEND_TOPIC để phòng đang
// giữ người nhận (có thể ở bản đồ khác) gửi lại bảng bạn bè.
// Nhiều tiến trình (REDIS_URL, #326): mỗi lần danh sách của người đang trong game đổi, tiến trình giữ người đó phát danh sách (chỉ số
// tài khoản) lên FRIEND_STATE_TOPIC và ghi tài liệu presence STATE_KEY; tiến trình khác giữ bản sao để kiểm phía người gửi (đã bị
// chặn chưa) và thấy bạn online / vị trí (đã bị xóa / chặn thì thôi thấy ngay). Không có Redis thì không phát, không ghi.
import { FRIEND_MAX, BLOCK_MAX } from "../../shared/data.ts";
import { nameKey } from "./names.ts";
import { presenceBackend, PRESENCE_HEARTBEAT_MS, PRESENCE_TTL_MS, type PresenceBackend } from "./presence.ts";
import type { SocialPeer, SocialRow } from "./db.ts";

/** Kênh presence: mọi phòng nghe, gửi lại tin riêng "friends" (và log) cho người chơi của mình có trong `to`. */
export const FRIEND_TOPIC = "friend";
/** Kênh presence (nhiều tiến trình, #326): danh sách bạn bè / chặn của một người đang trong game vừa đổi, hoặc người đó rời phòng. */
export const FRIEND_STATE_TOPIC = "friend:state";
/** Tài liệu presence: danh sách của mọi người đang trong game (tiến trình mở sau nạp lúc khởi động). */
const STATE_KEY = "friend:state";
/** Lease sống của một tiến trình: mục STATE_KEY của tiến trình hết lease (chết / bị kill) là mục ma, bị dọn lúc ghi và lúc nạp (#120). */
const workerKey = (id: string) => `friend:worker:${id}`;
/** Số lần ghi liên tiếp không khóa được tài liệu STATE_KEY thì bỏ lượt chờ (lần đổi danh sách sau ghi lại bản mới nhất). */
const FLUSH_TRIES = 3;

/** Danh sách của một người đang trong game: bạn bè / chặn (tài khoản -> tên), `fans`: tài khoản đã thêm người này làm bạn. */
interface Social { sid: string; name: string; friends: Map<number, string>; blocks: Map<number, string>; fans: Set<number>; }
/**
 * Danh sách chia sẻ qua presence (chỉ số tài khoản) của phiên `sid`. `v`: bộ đếm tăng dần của tiến trình giữ phiên, chỉ so trong cùng
 * một phiên (không so đồng hồ giữa các tiến trình).
 */
interface Shared { sid: string; v: number; friends: number[]; blocks: number[]; w?: string; }
/**
 * Tin FRIEND_STATE_TOPIC: `w` tiến trình phát (tự bỏ tin của mình). `enter`: phiên `sid` vừa vào phòng, mọi phiên khác của tài khoản
 * đã kết thúc (phiên mới chỉ mở sau khi phiên cũ nhả tài khoản, mục 6). `gone`: phiên `sid` rời phòng (`friends` là danh sách lúc rời).
 */
type StateMsg = Shared & { w: string; acc: number; enter?: boolean; gone?: boolean };
/** Bản sao một phiên của người đang trong game ở tiến trình khác. */
interface Mirror { v: number; friends: Set<number>; blocks: Set<number>; }
/** Bản sao theo tài khoản: các phiên đang trong game, và vài phiên đã kết thúc gần nhất (tin cũ của chúng tới sau bị bỏ). */
interface Remote { live: Map<string, Mirror>; ended: string[]; }
const ENDED_KEEP = 8;
/** Danh sách đọc được của một người đang trong game (ở tiến trình này hoặc bản sao). */
interface Lists { friends: { has(id: number): boolean }; blocks: { has(id: number): boolean }; }
/** Tài liệu STATE_KEY: tài khoản -> phiên -> danh sách. */
type StateDoc = Record<string, Record<string, Shared>>;
/**
 * Thông báo cho các tài khoản `to`: phòng của họ gửi lại bảng bạn bè (luôn), kèm dòng log `text` (nếu có). `added`: `acc` vừa thêm
 * người nhận vào danh sách bạn bè (người nhận đã chặn `acc` thì phòng bỏ phần này, mục 5.9).
 */
export interface FriendNote { to: number[]; text?: string; added?: { acc: number; name: string } }
/** Kết quả một thao tác: lỗi (báo riêng người gửi, không đổi gì), hoặc lần ghi DB của chính người gửi và các thông báo cần phát. */
export type FriendResult = { error: string } | { write: { other: number; friend?: boolean; block?: boolean }; notes: FriendNote[] };
/** Một mục trong bảng bạn bè gửi cho chính chủ: `map` / `ch` chỉ có khi hai bên đã thêm nhau và người đó đang trong game. */
export interface FriendEntry { name: string; mutual: boolean; map?: string; ch?: number; }

/** Tìm `name` trong `m` (theo nameKey). */
function find(m: Map<number, string>, name: string): SocialPeer | null {
  const key = nameKey(name);
  for (const [id, n] of m) if (nameKey(n) === key) return { id, name: n };
  return null;
}

/**
 * Bạn bè / chặn của một tiến trình. `backend`: presence chung giữa các tiến trình (null = một tiến trình, không chia sẻ); `id` phân
 * biệt tiến trình (bài thử giả lập hai tiến trình trên cùng một LocalBackend).
 */
export class FriendHub {
  private readonly social = new Map<number, Social>();
  private readonly remote = new Map<number, Remote>();
  private lastV = 0;
  private readonly pending = new Map<number, Shared & { gone?: boolean }>();
  private flushing: Promise<void> | null = null;
  private readonly sub = (m: StateMsg) => this.apply(m);
  /** Đã nạp tài liệu STATE_KEY (khởi động). */
  readonly ready: Promise<void>;

  constructor(private readonly backend: PresenceBackend | null, private readonly id = backend?.workerId ?? "") {
    if (!backend) { this.ready = Promise.resolve(); return; }
    void Promise.resolve(backend.presence.subscribe(FRIEND_STATE_TOPIC, this.sub));
    const beat = () => backend.putJson(workerKey(this.id), 1, PRESENCE_TTL_MS);
    this.beatT = setInterval(() => { void beat().catch((e) => console.error("Không gia hạn lease worker bạn bè", e)); }, PRESENCE_HEARTBEAT_MS);
    this.beatT.unref();
    this.ready = beat().then(() => backend.getJson<StateDoc>(STATE_KEY)).then(async (doc) => {
      const alive = await this.aliveWorkers(Object.values(doc ?? {}).flatMap((ses) => Object.values(ses).map((e) => e.w)));
      // Tài khoản đã có tin tới trước bản chụp (hoặc đang ở tiến trình này) thì tin đó mới hơn: bỏ mục trong tài liệu; mục của tiến trình chết cũng bỏ.
      for (const [key, ses] of Object.entries(doc ?? {})) {
        const acc = Number(key);
        if (!this.remote.has(acc) && !this.social.has(acc)) for (const e of Object.values(ses)) if (e.w && alive.has(e.w)) this.apply({ ...e, acc, w: "" });
      }
    }).catch((e) => console.error("Không đọc được danh sách bạn bè / chặn từ presence", e));
  }
  private beatT: ReturnType<typeof setInterval> | undefined;

  /** Trong `ids` (tiến trình ghi mục STATE_KEY; thiếu = bản ghi cũ không rõ chủ), những tiến trình còn lease; tiến trình này luôn sống. */
  private async aliveWorkers(ids: (string | undefined)[]) {
    const others = [...new Set(ids.filter((w): w is string => !!w && w !== this.id))];
    const leases = await this.backend!.getJsonMany<number>(others.map(workerKey));
    return new Set([this.id, ...others.filter((_, i) => leases[i] !== null)]);
  }

  /** Thôi nghe presence và nhả lease (bài thử). */
  close() {
    this.backend?.presence.unsubscribe(FRIEND_STATE_TOPIC, this.sub);
    clearInterval(this.beatT);
    void this.backend?.delete(workerKey(this.id));
  }

  /** Các lần ghi tài liệu STATE_KEY đang chờ đã xong (bài thử). */
  async settled() { while (this.flushing) await this.flushing; }

  /**
   * Danh sách của `acc` đang trong game: ở tiến trình này, không thì bản sao từ tiến trình khác. Bản sao tạm có nhiều phiên (tin tới lệch
   * thứ tự) thì gộp theo hướng chặt: chặn nếu phiên nào cũng chặn được tính, là bạn chỉ khi mọi phiên đều có.
   */
  private lists(acc: number): Lists | undefined {
    const s = this.social.get(acc); if (s) return s;
    return this.merged(this.remote.get(acc));
  }

  private merged(r: Remote | undefined): Lists | undefined {
    const live = r ? [...r.live.values()] : [];
    if (live.length <= 1) return live[0];
    return { friends: { has: (id) => live.every((m) => m.friends.has(id)) }, blocks: { has: (id) => live.some((m) => m.blocks.has(id)) } };
  }

  /** Phiên `sid` trong bản sao `r` đã kết thúc: bỏ khỏi `live`, tin của nó tới sau bị bỏ. */
  private end(r: Remote, sid: string) { r.live.delete(sid); r.ended.push(sid); if (r.ended.length > ENDED_KEEP) r.ended.shift(); }

  /** Có phiên mới `sid` của tài khoản: mọi phiên khác trong bản sao `r` đã kết thúc. */
  private endAll(r: Remote, sid?: string) { for (const x of [...r.live.keys()]) if (x !== sid) this.end(r, x); }

  /** Bạn bè (theo bản sao gộp) của tài khoản trong bản sao `r`. */
  private mergedFriends(r: Remote) {
    const l = this.merged(r), first = r.live.values().next().value;
    return l && first ? [...first.friends].filter((f) => l.friends.has(f)) : [];
  }

  /**
   * Tin FRIEND_STATE_TOPIC (hoặc một mục của tài liệu lúc khởi động): cập nhật bản sao, và `fans` của người ở tiến trình này mà người
   * kia vừa thêm / bỏ (rời phòng thì vẫn giữ: như leave, để bảng vẫn đúng hai bên đã thêm nhau sau khi người kia ngoại tuyến). Cùng
   * phiên thì theo `v`; tin của phiên đã kết thúc (rời, hoặc có phiên mới vào sau) bị bỏ.
   */
  private apply(m: StateMsg) {
    if (!m || typeof m.acc !== "number" || typeof m.v !== "number" || m.w === this.id) return;
    const sid = String(m.sid);
    let r = this.remote.get(m.acc);
    if (!r) this.remote.set(m.acc, r = { live: new Map(), ended: [] });
    if (r.ended.includes(sid) || (r.live.get(sid)?.v ?? -1) >= m.v) return;
    const before = this.mergedFriends(r), friends = new Set(Array.isArray(m.friends) ? m.friends : []);
    if (m.enter) this.endAll(r, sid);
    if (m.gone) this.end(r, sid);
    else r.live.set(sid, { v: m.v, friends, blocks: new Set(Array.isArray(m.blocks) ? m.blocks : []) });
    // `fans` theo danh sách gộp trước / sau tin; phiên cuối rời thì giữ danh sách lúc rời (như leave).
    const after = r.live.size ? new Set(this.mergedFriends(r)) : new Set(before);
    for (const f of after) this.social.get(f)?.fans.add(m.acc);
    for (const f of before) if (!after.has(f)) this.social.get(f)?.fans.delete(m.acc);
  }

  /** Chia sẻ danh sách của `acc` (phiên `s.sid`) với tiến trình khác: phát ngay (trước FriendNote của cùng thao tác) rồi ghi tài liệu. */
  private share(acc: number, s: Social, kind?: "enter" | "gone") {
    const b = this.backend; if (!b) return;
    const v = ++this.lastV;
    const e: Shared = { sid: s.sid, v, friends: [...s.friends.keys()], blocks: [...s.blocks.keys()] };
    const flags = kind ? { [kind]: true } : {};
    void Promise.resolve(b.presence.publish(FRIEND_STATE_TOPIC, { ...e, w: this.id, acc, ...flags }))
      .catch((err) => console.error("Không phát được danh sách bạn bè / chặn lên presence", err));
    this.pending.set(acc, kind === "gone" ? { ...e, gone: true } : e);
    this.flushing ??= this.flush();
  }

  /**
   * Ghi các danh sách đang chờ vào tài liệu STATE_KEY dưới lock (gộp nhiều lần đổi thành một lần ghi). Mỗi tài khoản: bỏ các phiên đã
   * biết là kết thúc (`ended` của bản sao, gồm phiên cũ mà lần vào phòng ở đây đã kết thúc; không bỏ phiên lạ, có thể mới hơn), rời
   * thì xóa đúng phiên đó; bản của phiên đã rời ở tiến trình này (ghi trễ) không ghi lại.
   */
  private async flush() {
    const b = this.backend!;
    let fails = 0;
    while (this.pending.size) {
      const batch = [...this.pending]; this.pending.clear();
      const ok = await b.withLock<StateDoc>(STATE_KEY, `${this.id}:friend:${batch[0][1].v}`, 5000, async (old) => {
        const doc = old ?? {};
        const alive = await this.aliveWorkers(Object.values(doc).flatMap((ses) => Object.values(ses).map((e) => e.w)));
        for (const [acc, ses] of Object.entries(doc)) {
          for (const [sid, e] of Object.entries(ses)) if (!e.w || !alive.has(e.w)) delete ses[sid];
          if (!Object.keys(ses).length) delete doc[acc];
        }
        for (const [acc, { gone, ...e }] of batch) {
          const ses = { ...doc[acc] };
          for (const x of this.remote.get(acc)?.ended ?? []) delete ses[x];
          if (gone) delete ses[e.sid];
          else if (this.social.get(acc)?.sid === e.sid && (ses[e.sid]?.v ?? -1) <= e.v) ses[e.sid] = { ...e, w: this.id };
          if (Object.keys(ses).length) doc[acc] = ses; else delete doc[acc];
        }
        return doc;
      }, 0).catch((err) => { console.error("Không ghi được danh sách bạn bè / chặn vào presence", err); return true; });
      if (ok) { fails = 0; continue; }
      // Không khóa được (tranh chấp lâu): ghi lại các mục chưa có bản mới hơn chờ ghi, tối đa FLUSH_TRIES lần liên tiếp; quá thì bỏ
      // (lần đổi danh sách kế tiếp của tài khoản đó ghi lại bản mới nhất).
      if (++fails >= FLUSH_TRIES) { console.error(`Không khóa được danh sách bạn bè / chặn trong presence sau ${FLUSH_TRIES} lần: bỏ lượt ghi.`); fails = 0; continue; }
      console.error("Không khóa được danh sách bạn bè / chặn trong presence: ghi lại.");
      for (const [acc, e] of batch) if (!this.pending.has(acc)) this.pending.set(acc, e);
    }
    this.flushing = null;
  }

  /**
   * Phòng nhận người chơi (onJoin): giữ danh sách vừa nạp từ DB (onAuth, sau lần ghi cuối của phiên cũ). `fans` của DB có thể thiếu /
   * thừa lần thêm / xóa của người khác chưa ghi xong hoặc xảy ra lúc người này đang chuyển phòng: với bạn đang trong game thì lấy theo
   * danh sách của họ (đúng nhất, kể cả ở tiến trình khác), để khi họ rời game bảng vẫn biết hai bên đã thêm nhau chưa.
   */
  enter(acc: number, sid: string, name: string, row: SocialRow) {
    const s: Social = { sid, name, friends: new Map(row.friends.map((p) => [p.id, p.name])), blocks: new Map(row.blocks.map((p) => [p.id, p.name])),
      fans: new Set(row.fans) };
    for (const f of s.friends.keys()) { const o = this.lists(f); if (o) { if (o.friends.has(acc)) s.fans.add(f); else s.fans.delete(f); } }
    // Bản sao của chính tài khoản này (phiên ở tiến trình khác, kể cả tiến trình đã chết) đã kết thúc: rời phòng ở đây không rơi về nó.
    const own = this.remote.get(acc); if (own) this.endAll(own);
    this.social.set(acc, s);
    this.share(acc, s, "enter");
  }

  /**
   * Phiên `sid` rời phòng: bỏ danh sách khỏi RAM (phòng mới nạp lại từ DB). Bạn đang trong game ghi nhận `acc` có họ (`fans`), để sau
   * khi `acc` ngoại tuyến bảng của họ vẫn đúng hai bên đã thêm nhau (kể cả khi họ nạp DB lúc lần thêm của `acc` chưa ghi xong).
   */
  leave(acc: number, sid: string) {
    const s = this.social.get(acc); if (s?.sid !== sid) return;
    for (const f of s.friends.keys()) this.social.get(f)?.fans.add(acc);
    this.social.delete(acc);
    this.share(acc, s, "gone");
  }

  /** `by` đang trong game (ở bất kỳ tiến trình nào) và đã chặn `who`. */
  blocked(by: number, who: number) { return !!this.lists(by)?.blocks.has(who); }

  /**
   * `a` và `b` đã thêm nhau chưa, nhìn từ phía `a` (đang trong game ở tiến trình này): `a` có `b`, và `b` có `a` (đọc danh sách của `b`
   * nếu `b` đang trong game, không thì theo `fans` của `a` nạp từ DB và cập nhật khi người khác thêm / bỏ), `b` không chặn `a`.
   */
  private mutual(a: number, b: number) {
    const s = this.social.get(a), o = this.lists(b);
    return !!s?.friends.has(b) && (o ? o.friends.has(a) && !o.blocks.has(a) : s.fans.has(b));
  }

  /**
   * Người đang trong game (mọi tiến trình) đã thêm nhau với `acc` (`acc` đang trong game ở đây): cần gửi lại bảng bạn bè khi `acc` vào /
   * rời game, đổi bản đồ / kênh. Chỉ duyệt danh sách của `acc` (tối đa FRIEND_MAX), không duyệt mọi người đang online.
   */
  mutualOnline(acc: number) { return [...(this.social.get(acc)?.friends.keys() ?? [])].filter((o) => !!this.lists(o)?.friends.has(acc)); }

  /** Hồn sư tên `name` có trong danh sách bạn bè hoặc chặn của `acc` (tra không cần DB). */
  known(acc: number, name: string): SocialPeer | null {
    const s = this.social.get(acc);
    return s ? find(s.friends, name) ?? find(s.blocks, name) : null;
  }

  /** `acc` thêm `t` vào danh sách bạn bè của mình; `t` nhận lời "X đã thêm bạn…" (trừ khi `t` đã chặn `acc`). */
  add(acc: number, t: SocialPeer): FriendResult {
    const s = this.social.get(acc); if (!s) return { error: "Chưa nạp xong danh sách bạn bè, thử lại sau giây lát." };
    if (t.id === acc) return { error: "Không thể tự thêm chính mình vào danh sách bạn bè." };
    if (s.friends.has(t.id)) return { error: `${t.name} đã có trong danh sách bạn bè.` };
    if (s.blocks.has(t.id)) return { error: `Bạn đang chặn ${t.name}: bỏ chặn trước rồi mới thêm bạn.` };
    if (s.friends.size >= FRIEND_MAX) return { error: `Danh sách bạn bè đã đủ ${FRIEND_MAX} người: xóa bớt rồi thêm.` };
    s.friends.set(t.id, t.name);
    this.social.get(t.id)?.fans.add(acc);
    this.share(acc, s);
    return { write: { other: t.id, friend: true }, notes: [
      { to: [acc], text: `Đã thêm ${t.name} vào danh sách bạn bè.` },
      { to: [t.id], added: { acc, name: s.name } },
    ] };
  }

  /** Gửi lại bảng cho `other` (không báo) khi `acc` vừa bỏ / chặn: chỉ khi `other` đang trong game và có `acc` (bảng của họ đổi). */
  private peerNote(other: number, acc: number): FriendNote[] { return this.lists(other)?.friends.has(acc) ? [{ to: [other] }] : []; }

  /** `acc` bỏ `name` khỏi danh sách bạn bè của mình; người kia (nếu đang trong game) chỉ được gửi lại bảng, không báo. */
  remove(acc: number, name: string): FriendResult {
    const s = this.social.get(acc), t = s && find(s.friends, name);
    if (!s || !t) return { error: `${name} không có trong danh sách bạn bè.` };
    s.friends.delete(t.id);
    this.social.get(t.id)?.fans.delete(acc);
    this.share(acc, s);
    return { write: { other: t.id, friend: false }, notes: [{ to: [acc], text: `Đã xóa ${t.name} khỏi danh sách bạn bè.` }, ...this.peerNote(t.id, acc)] };
  }

  /** `acc` chặn `t` (tự bỏ khỏi danh sách bạn bè của `acc`); người bị chặn không được báo, chỉ được gửi lại bảng. */
  block(acc: number, t: SocialPeer): FriendResult {
    const s = this.social.get(acc); if (!s) return { error: "Chưa nạp xong danh sách chặn, thử lại sau giây lát." };
    if (t.id === acc) return { error: "Không thể tự chặn chính mình." };
    if (s.blocks.has(t.id)) return { error: `${t.name} đã ở trong danh sách chặn.` };
    if (s.blocks.size >= BLOCK_MAX) return { error: `Danh sách chặn đã đủ ${BLOCK_MAX} người: bỏ chặn bớt rồi chặn.` };
    s.blocks.set(t.id, t.name);
    if (s.friends.delete(t.id)) this.social.get(t.id)?.fans.delete(acc);
    this.share(acc, s);
    return { write: { other: t.id, block: true }, notes: [
      { to: [acc], text: `Đã chặn ${t.name}: không nhận tin, lời mời tổ đội, lời thêm bạn của người này.` }, ...this.peerNote(t.id, acc),
    ] };
  }

  /** `acc` bỏ chặn `name`. */
  unblock(acc: number, name: string): FriendResult {
    const s = this.social.get(acc), t = s && find(s.blocks, name);
    if (!s || !t) return { error: `${name} không có trong danh sách chặn.` };
    s.blocks.delete(t.id);
    this.share(acc, s);
    return { write: { other: t.id, block: false }, notes: [{ to: [acc], text: `Đã bỏ chặn ${t.name}.` }] };
  }

  /**
   * Bảng bạn bè của `acc` (tin riêng "friends"): mỗi bạn kèm đã thêm nhau chưa; bản đồ / kênh (`where`, null = không trong game) chỉ
   * có khi đã thêm nhau. Danh sách chặn là tên.
   */
  view(acc: number, where: (acc: number) => { mapId: string; ch: number } | null) {
    const s = this.social.get(acc);
    const list: FriendEntry[] = [...(s?.friends ?? [])].map(([id, name]) => {
      const m = this.mutual(acc, id), w = m ? where(id) : null;
      return { name, mutual: m, ...(w ? { map: w.mapId, ch: w.ch } : {}) };
    });
    return { list, blocks: [...(s?.blocks.values() ?? [])] };
  }

  /** `acc` đã có `other` trong danh sách bạn bè. */
  has(acc: number, other: number) { return !!this.social.get(acc)?.friends.has(other); }
}

/** Bạn bè / chặn của tiến trình server: chia sẻ qua presence chỉ khi chạy Redis (nhiều tiến trình). */
export const friends = new FriendHub(presenceBackend.mode === "redis" ? presenceBackend : null);
