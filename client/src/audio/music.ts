import { AUDIO_RANGE } from "./spatial.ts";

/** Định dạng nhạc dựng sẵn (tools/audio/compose): Vorbis cho đa số trình duyệt, AAC cho Safari / iOS. */
export type MusicFormat = "ogg" | "m4a";
/** Sự kiện có khúc ngắn (`event` của bài `kind: "jingle"` trong manifest). */
export type MusicEvent = "level_up" | "ring_absorb" | "arena_win" | "arena_lose" | "quest_accept" | "quest_complete";

/** Một bài trong `shared/assets/audio/music/manifest.json` (do `tools/audio/compose/compose.mjs` ghi). */
export interface MusicTrack {
  id: string;
  title: string;
  kind: "map" | "battle" | "jingle";
  maps?: string[];
  event?: string;
  loop: boolean;
  /** Độ dài file, làm tròn tới ms; điểm lặp là cả file (phát từ 0 tới hết rồi quay lại 0), độ dài đúng theo `musicLoopSeconds`. */
  seconds: number;
  files: Partial<Record<MusicFormat, { path: string; bytes: number }>>;
}
export interface MusicManifest { tracks: MusicTrack[]; }

export interface MusicStatus {
  format: MusicFormat;
  state: string;
  volume: number;
  map: string | null;
  battle: boolean;
  /** Bài đang phát (đã mờ vào hoặc đang mờ vào); null = im. */
  playing: string | null;
  jingle: MusicEvent | null;
  /** Các file đã tải (theo thứ tự), để thấy tải lười theo bản đồ. */
  fetched: string[];
}

export interface MusicOptions {
  load?: (url: string) => Promise<ArrayBuffer>;
  format?: MusicFormat;
  now?: () => number;
  log?: (text: string) => void;
}

export const MUSIC_MANIFEST_URL = "audio/music/manifest.json";
/** Thời gian mờ ra / mờ vào khi đổi bài (đổi bản đồ, vào / hết giao chiến). */
export const MUSIC_FADE_S = 1.5;
/** Nhạc nền hạ còn tỉ lệ này trong lúc khúc ngắn phát; hạ trong MUSIC_DUCK_ATTACK_S, trả lại trong MUSIC_DUCK_RELEASE_S. */
export const MUSIC_DUCK_GAIN = 0.3;
export const MUSIC_DUCK_ATTACK_S = 0.15;
export const MUSIC_DUCK_RELEASE_S = 0.8;
/** Hết giao chiến boss bao lâu (ms) mới mờ về nhạc bản đồ, để đánh giật cục không đổi bài liên tục. */
export const MUSIC_BATTLE_HOLD_MS = 4000;
/** Boss / thú vương trong tầm này (pixel thế giới) mới tính là đang giao chiến. */
export const MUSIC_BATTLE_RANGE = AUDIO_RANGE;
/** Số bài nền đã giải mã giữ trong bộ nhớ (mỗi bài ~30–40 MB PCM): bản đồ hiện tại, bài giao chiến, bản đồ vừa rời. */
export const MUSIC_CACHE_TRACKS = 3;
/** compose.mjs render ở MUSIC_RENDER_RATE Hz và bắt vòng lặp là bội MUSIC_LOOP_BLOCK mẫu (tools/audio/compose/README.md). */
export const MUSIC_RENDER_RATE = 44100;
export const MUSIC_LOOP_BLOCK = 1024;
/** Khúc ngắn ưu tiên cao hơn thì cắt khúc đang phát; bằng hoặc thấp hơn thì bỏ (hấp thụ hồn hoàn kéo theo lên cấp). */
export const MUSIC_EVENT_PRIORITY: Readonly<Record<MusicEvent, number>> = {
  arena_win: 5, arena_lose: 5, ring_absorb: 4, level_up: 3, quest_complete: 2, quest_accept: 1,
};

/**
 * Safari và mọi trình duyệt trên iOS / iPadOS (đều là WebKit) dùng m4a: giải mã Vorbis trong WebAudio ở đó không chắc chắn dù
 * `canPlayType` có thể báo được. Trình duyệt khác dùng ogg nếu phát được Vorbis.
 */
export function pickMusicFormat(nav?: { userAgent?: string; maxTouchPoints?: number }, canPlay?: (type: string) => string): MusicFormat {
  const ua = nav?.userAgent ?? "";
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && (nav?.maxTouchPoints ?? 0) > 1);
  const safari = /Safari\//.test(ua) && !/Chrome\/|Chromium\/|Edg\/|OPR\/|Firefox\//.test(ua);
  if (ios || safari) return "m4a";
  return canPlay?.('audio/ogg; codecs="vorbis"') ? "ogg" : "m4a";
}

/** Độ dài vòng thật (giây) từ `seconds` đã làm tròn của manifest: lấy bội MUSIC_LOOP_BLOCK mẫu gần nhất. */
export function musicLoopSeconds(seconds: number): number {
  return (Math.round((seconds * MUSIC_RENDER_RATE) / MUSIC_LOOP_BLOCK) * MUSIC_LOOP_BLOCK) / MUSIC_RENDER_RATE;
}

function browserMusicFormat(): MusicFormat {
  try {
    const el = document.createElement("audio");
    return pickMusicFormat(navigator, (type) => el.canPlayType(type));
  } catch { return "m4a"; }
}

export interface MusicBeast { x: number; y: number; rank: number; hp: number; aggro: boolean; parts: number; }

/**
 * Đang giao chiến boss thế giới / thú vương (rank ≥ 2, mục 5.4): con còn sống trong MUSIC_BATTLE_RANGE đang hung hăng hoặc đã có
 * người góp sát thương. Chỉ đọc state server đã đồng bộ (hồn thú ở gần, 11.4).
 */
export function bossEngaged(beasts: { forEach(cb: (b: MusicBeast) => void): void }, me: { x: number; y: number }): boolean {
  let on = false;
  beasts.forEach((b) => {
    if (!on && b.rank >= 2 && b.hp > 0 && (b.aggro || b.parts > 0) && Math.hypot(b.x - me.x, b.y - me.y) < MUSIC_BATTLE_RANGE) on = true;
  });
  return on;
}

async function fetchBytes(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.arrayBuffer();
}

/** decodeAudioData dạng promise; Safari cũ chỉ có dạng callback. */
function decodeAudio(context: BaseAudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const p = context.decodeAudioData(data, resolve, reject) as Promise<AudioBuffer> | undefined;
    if (p && typeof p.then === "function") p.then(resolve, reject);
  });
}

function fade(param: AudioParam, to: number, at: number, seconds: number): void {
  param.cancelScheduledValues(at);
  param.setValueAtTime(param.value, at);
  param.linearRampToValueAtTime(to, at + seconds);
}

interface Voice { id: string; source: AudioBufferSourceNode; gain: GainNode; }
interface JingleVoice { event: MusicEvent; source: AudioBufferSourceNode; }

/**
 * Nhạc nền theo bản đồ, bài giao chiến boss và khúc ngắn (#134). Sống theo AudioContext (dùng chung qua các lần đổi bản đồ, xem
 * `sharedAudioContext`) nên chuyển bài mờ chéo được khi scene cũ đã tắt. Tải lười: chỉ tải manifest và bài đang cần.
 * Đồ thị: bài nền → gain riêng (mờ vào / ra) → `duck` → `bus` (Tổng × Nhạc) → loa; khúc ngắn → `bus` (không bị hạ).
 * Context bị trình duyệt chặn (chưa tương tác) hay bị Phaser treo khi tab ẩn thì nguồn đứng yên theo context.
 */
export class MusicPlayer {
  private readonly context: AudioContext;
  private readonly bus: GainNode;
  private readonly duck: GainNode;
  private readonly load: (url: string) => Promise<ArrayBuffer>;
  private readonly now: () => number;
  private readonly log: (text: string) => void;
  private fmt: MusicFormat;
  private manifest: Promise<MusicManifest | null> | null = null;
  private readonly buffers = new Map<string, Promise<AudioBuffer | null>>();
  private readonly jingles = new Map<string, Promise<AudioBuffer | null>>();
  private readonly fetched: string[] = [];
  private volume = 0;
  private map: string | null = null;
  private battleUntil = 0;
  private battle = false;
  private voice: Voice | null = null;
  private jingleVoice: JingleVoice | null = null;
  private pending: Promise<void> = Promise.resolve();
  private jinglePending: Promise<void> = Promise.resolve();

  constructor(context: AudioContext, options: MusicOptions = {}) {
    this.context = context;
    this.load = options.load ?? fetchBytes;
    this.now = options.now ?? (() => performance.now());
    this.log = options.log ?? (() => {});
    this.fmt = options.format ?? browserMusicFormat();
    this.bus = context.createGain();
    this.duck = context.createGain();
    this.bus.gain.value = 0;
    this.duck.connect(this.bus);
    this.bus.connect(context.destination);
  }

  get format(): MusicFormat { return this.fmt; }

  status(): MusicStatus {
    return { format: this.fmt, state: this.context.state, volume: this.volume, map: this.map, battle: this.battle,
      playing: this.voice?.id ?? null, jingle: this.jingleVoice?.event ?? null, fetched: [...this.fetched] };
  }

  /** Chờ các lượt đổi bài / khúc ngắn đang tải xong (bài thử chờ theo trạng thái, không ngủ cố định). */
  async whenIdle(): Promise<void> {
    for (;;) {
      const p = this.pending, j = this.jinglePending;
      await Promise.all([p, j]);
      if (p === this.pending && j === this.jinglePending) return;
    }
  }

  /** Âm lượng bus Nhạc (Tổng × Nhạc, 0 khi tắt tiếng). Bằng 0 thì mờ bài đang phát và không tải bài mới. */
  setVolume(volume: number): void {
    const v = Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0, wasSilent = this.volume <= 0;
    this.volume = v;
    const t = this.context.currentTime;
    this.bus.gain.cancelScheduledValues(t);
    this.bus.gain.setValueAtTime(v, t);
    if (wasSilent !== v <= 0) this.sync();
  }

  /** Bản đồ đang đứng (`mapId` trong state); null = ngừng nhạc nền. Sang bản đồ khác là hết giao chiến ngay, không chờ giữ. */
  setMap(mapId: string | null): void {
    if (mapId === this.map) return;
    this.map = mapId;
    this.battle = false;
    this.battleUntil = 0;
    this.sync();
  }

  /** Gọi mỗi khung: đang giao chiến boss / thú vương thì phát bài giao chiến; hết giao chiến MUSIC_BATTLE_HOLD_MS mới mờ về. */
  setBattle(on: boolean): void {
    if (on) this.battleUntil = Infinity;
    else if (this.battleUntil === Infinity) this.battleUntil = this.now() + MUSIC_BATTLE_HOLD_MS;
    const active = this.now() < this.battleUntil;
    if (active === this.battle) return;
    this.battle = active;
    this.sync();
  }

  /** Khúc ngắn một lần, tạm hạ nhạc nền. Như SFX: context không chạy (chưa tương tác, tab ẩn) hoặc bus Nhạc im thì bỏ. */
  jingle(event: MusicEvent): void {
    if (!this.audible()) return;
    const cur = this.jingleVoice;
    if (cur && MUSIC_EVENT_PRIORITY[cur.event] >= MUSIC_EVENT_PRIORITY[event]) return;
    this.jinglePending = this.jinglePending.then(() => this.playJingle(event)).catch(() => {});
  }

  /** Ngừng hẳn (mất kết nối): mờ nhạc nền, cắt khúc ngắn. */
  stop(): void {
    try { this.jingleVoice?.source.stop(); } catch { /* đã dừng */ }
    this.jingleVoice = null;
    this.setMap(null);
  }

  private audible(): boolean { return this.volume > 0 && this.context.state === "running"; }

  private sync(): void {
    this.pending = this.pending.then(() => this.apply()).catch((e) => this.log(`lỗi đổi bài: ${String(e)}`));
  }

  private loadManifest(): Promise<MusicManifest | null> {
    this.manifest ??= this.load(MUSIC_MANIFEST_URL).then((data) => {
      const m = JSON.parse(new TextDecoder().decode(data)) as MusicManifest;
      return Array.isArray(m?.tracks) ? m : null;
    }).catch((e) => { this.log(`không tải được manifest nhạc: ${String(e)}`); return null; });
    return this.manifest;
  }

  private pick(m: MusicManifest): MusicTrack | null {
    if (this.volume <= 0 || !this.map) return null;
    const battle = this.battle ? m.tracks.find((t) => t.kind === "battle") : undefined;
    return battle ?? m.tracks.find((t) => t.kind === "map" && t.maps?.includes(this.map!)) ?? null;
  }

  private async apply(): Promise<void> {
    const m = this.volume > 0 && this.map ? await this.loadManifest() : null;
    const track = m ? this.pick(m) : null;
    if ((track?.id ?? null) === (this.voice?.id ?? null)) return;
    const buffer = track ? await this.cached(this.buffers, track, MUSIC_CACHE_TRACKS) : null;
    // Trong lúc tải đã đổi ý (đổi bản đồ tiếp, hết giao chiến): lượt sync sau trong chuỗi sẽ xử lý.
    if (m && (this.pick(m)?.id ?? null) !== (track?.id ?? null)) return;
    this.crossfade(track, buffer);
  }

  private crossfade(track: MusicTrack | null, buffer: AudioBuffer | null): void {
    const context = this.context, t = context.currentTime, old = this.voice;
    if (old) {
      fade(old.gain.gain, 0, t, MUSIC_FADE_S);
      try { old.source.stop(t + MUSIC_FADE_S + 0.05); } catch { /* đã dừng */ }
    }
    this.voice = null;
    if (track && buffer) {
      const source = context.createBufferSource(), gain = context.createGain();
      source.buffer = buffer;
      source.loop = true;
      // Lặp cả buffer; chỉ khi bộ giải mã đệm thêm mẫu ở cuối (dài hơn vòng thật) mới cắt ở đúng độ dài vòng.
      const loop = musicLoopSeconds(track.seconds);
      source.loopStart = 0;
      source.loopEnd = loop < buffer.duration - 1 / buffer.sampleRate ? loop : 0;
      gain.gain.value = 0;
      fade(gain.gain, 1, t, MUSIC_FADE_S);
      source.connect(gain);
      gain.connect(this.duck);
      source.addEventListener("ended", () => { source.disconnect(); gain.disconnect(); }, { once: true });
      source.start(t);
      this.voice = { id: track.id, source, gain };
    }
    this.log(`${old?.id ?? "(im)"} → ${this.voice?.id ?? "(im)"} · bản đồ ${this.map ?? "-"}${this.battle ? " · giao chiến" : ""} · ${this.fmt} · context ${context.state}`);
  }

  private async playJingle(event: MusicEvent): Promise<void> {
    const m = await this.loadManifest();
    const track = m?.tracks.find((t) => t.kind === "jingle" && t.event === event);
    if (!track) return;
    const buffer = await this.cached(this.jingles, track, Infinity);
    const cur = this.jingleVoice;
    if (!buffer || !this.audible() || (cur && MUSIC_EVENT_PRIORITY[cur.event] >= MUSIC_EVENT_PRIORITY[event])) return;
    try { cur?.source.stop(); } catch { /* đã dừng */ }
    const context = this.context, t = context.currentTime, end = t + buffer.duration;
    const source = context.createBufferSource(), voice: JingleVoice = { event, source };
    source.buffer = buffer;
    source.connect(this.bus);
    const g = this.duck.gain;
    fade(g, MUSIC_DUCK_GAIN, t, MUSIC_DUCK_ATTACK_S);
    g.setValueAtTime(MUSIC_DUCK_GAIN, end);
    g.linearRampToValueAtTime(1, end + MUSIC_DUCK_RELEASE_S);
    source.addEventListener("ended", () => { if (this.jingleVoice === voice) this.jingleVoice = null; source.disconnect(); }, { once: true });
    source.start(t);
    this.jingleVoice = voice;
    this.log(`khúc ngắn ${event} (${track.id}), nhạc nền hạ còn ${MUSIC_DUCK_GAIN}`);
  }

  /** Bộ đệm bài đã giải mã, cũ nhất bị bỏ khi quá `limit` (nguồn đang phát vẫn giữ buffer của nó). */
  private cached(cache: Map<string, Promise<AudioBuffer | null>>, track: MusicTrack, limit: number): Promise<AudioBuffer | null> {
    let p = cache.get(track.id);
    if (p) cache.delete(track.id);
    else p = this.decode(track);
    cache.set(track.id, p);
    while (cache.size > limit) cache.delete(cache.keys().next().value!);
    return p;
  }

  /** Tải và giải mã theo định dạng đã chọn; ogg hỏng thì thử m4a và dùng m4a từ đó. */
  private async decode(track: MusicTrack): Promise<AudioBuffer | null> {
    for (const fmt of this.fmt === "ogg" ? (["ogg", "m4a"] as const) : (["m4a"] as const)) {
      const file = track.files[fmt];
      if (!file) continue;
      try {
        this.fetched.push(file.path);
        const buffer = await decodeAudio(this.context, await this.load(file.path));
        if (fmt !== this.fmt) { this.fmt = fmt; this.log(`ogg không giải mã được, chuyển sang ${fmt}`); }
        return buffer;
      } catch (e) {
        this.log(`không tải / giải mã được ${file.path}: ${String(e)}`);
      }
    }
    return null;
  }
}

/** `?music=log`: ghi mỗi lần đổi bài vào console và gắn `window.__music` để xem `status()` (bằng chứng, đo bằng Chrome headless). */
const MUSIC_LOG = typeof location !== "undefined" && new URLSearchParams(location.search).get("music") === "log";

const players = new WeakMap<object, MusicPlayer>();

/** Một bộ phát nhạc cho mỗi AudioContext; không có context (bot, trình duyệt không WebAudio) thì null. */
export function musicPlayerFor(context: AudioContext | null | undefined, options?: MusicOptions): MusicPlayer | null {
  if (!context) return null;
  let player = players.get(context);
  if (!player) {
    try {
      player = new MusicPlayer(context, options ?? (MUSIC_LOG ? { log: (text) => console.info(`[nhạc] ${text}`) } : {}));
    } catch { return null; }
    players.set(context, player);
    if (MUSIC_LOG) (globalThis as { __music?: MusicPlayer }).__music = player;
  }
  return player;
}

let shared: AudioContext | null | undefined;

/**
 * AudioContext dùng chung cho mọi Phaser.Game (mỗi lần đổi bản đồ main.ts tạo game mới): truyền vào `audio.context` để Phaser chỉ
 * treo chứ không đóng context khi hủy game, nhờ đó nhạc nền sống qua lần đổi bản đồ và mờ chéo sang bài mới.
 */
export function sharedAudioContext(): AudioContext | undefined {
  if (shared === undefined) {
    const Ctor = globalThis.AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    try { shared = Ctor ? new Ctor() : null; } catch { shared = null; }
  }
  return shared ?? undefined;
}

/** Mất kết nối (màn "Đã rời bản đồ"): ngừng nhạc của context dùng chung. */
export function stopMusic(): void {
  if (shared) players.get(shared)?.stop();
}
