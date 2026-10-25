// Nền môi trường vòng lặp (#622): một bản thu liền mạch phát suốt khi ở bản đồ có nền (sóng Hải Thần Đảo, hang Lõi Tinh Đấu, hầm Đấu Hồn Trường),
// chồng dưới nhạc nền và dưới lớp chồng ngẫu nhiên (ambientLayers.ts). Đổi bản đồ thì mờ ra / mờ vào chéo nhau; tải lười từng file theo bản đồ.
// Sống theo AudioContext như nhạc nền (`ambientBedFor`), không theo scene: mỗi lần đổi bản đồ / kênh GameScene bị hủy và AudioManager mới được tạo,
// nhưng bộ phát và bộ nhớ đệm đã giải mã vẫn còn nên nền cũ mờ ra chứ không bị cắt, file không tải lại. AudioManager chỉ đặt âm lượng
// (thanh Môi trường × Tổng, 0 khi Tắt tiếng) và hạ nền khi đông tiếng.
import { AMBIENT_BEDS, AMBIENT_BED_FADE_S, AMBIENT_BED_RETRY_S, ambientBedFile } from "./ambientLayers.ts";
import { browserMusicFormat, decodeAudio, fetchBytes, type MusicFormat } from "./music.ts";

export interface AmbientBedOptions {
  load?: (url: string) => Promise<ArrayBuffer>;
  format?: MusicFormat;
  now?: () => number;
  random?: () => number;
}

interface Playing { id: string; src: AudioBufferSourceNode; gain: GainNode }

export class AmbientBed {
  private readonly context: AudioContext;
  /** Hạ nền khi đông tiếng (`duckFor`), nối trước bus âm lượng. */
  private readonly duck: GainNode;
  private readonly bus: GainNode;
  private volume = 0;
  private readonly load: (url: string) => Promise<ArrayBuffer>;
  private readonly fmt: MusicFormat;
  private readonly now: () => number;
  private readonly random: () => number;
  private readonly cache = new Map<string, Promise<AudioBuffer>>();
  private readonly failedAt = new Map<string, number>();
  private readonly playing = new Set<Playing>();
  private wanted = "";
  private disposed = false;
  /** Đã dừng hẳn (mất kết nối): scene cũ vẫn gọi `setMap` mỗi 250 ms nên phải bỏ qua cho tới khi có AudioManager mới (`resume`). */
  private halted = false;
  /** Các file đã yêu cầu tải (để bot / bài thử thấy tải lười). */
  readonly fetched: string[] = [];

  constructor(context: AudioContext, options: AmbientBedOptions = {}) {
    this.context = context;
    this.bus = context.createGain();
    this.duck = context.createGain();
    this.bus.gain.value = 0;
    this.duck.gain.value = 1;
    this.duck.connect(this.bus);
    this.bus.connect(context.destination);
    this.load = options.load ?? fetchBytes;
    this.fmt = options.format ?? browserMusicFormat();
    this.now = options.now ?? Date.now;
    this.random = options.random ?? Math.random;
  }

  /** Nền đang nghe thấy (đã hoặc đang mờ vào); null = bản đồ không có nền. */
  get current(): string | null { for (const p of this.playing) if (p.id === this.wanted) return p.id; return null; }

  /** Âm lượng bus Môi trường (Tổng × Môi trường, 0 khi tắt tiếng). Bằng 0 thì không tải nền mới. */
  setVolume(volume: number): void {
    const v = Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0, t = this.context.currentTime ?? 0;
    this.volume = v;
    this.bus.gain.cancelScheduledValues?.(t);
    this.bus.gain.setValueAtTime(v, t);
    this.bus.gain.value = v;
  }

  /** Đông tiếng: hạ nền còn `depth` rồi giữ `ms`, sau đó trả lại (cùng nhịp với `AudioManager.duckAmbient`). */
  duckFor(depth: number, ms: number): void {
    const g = this.duck.gain, t = this.context.currentTime ?? 0, end = Math.max(t + ms / 1000, t + 0.06);
    g.cancelScheduledValues?.(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(depth, t + 0.06);
    g.setValueAtTime(depth, end);
    g.linearRampToValueAtTime(1, end + 0.5);
  }

  /** Gọi mỗi lần báo môi trường (~250 ms): chỉ làm gì khi bản đồ đổi hoặc nền cần tải lại sau lỗi. `null` = ngừng nền (mất kết nối). */
  setMap(mapId: string | null): void {
    if (this.disposed || this.halted) return;
    const want = mapId ?? "";
    if (want !== this.wanted) {
      this.wanted = want;
      for (const p of this.playing) if (p.id !== want) this.fadeOut(p);
    }
    if (!mapId || this.volume <= 0 || !AMBIENT_BEDS[mapId] || [...this.playing].some((p) => p.id === mapId)) return;
    const failed = this.failedAt.get(mapId);
    if (failed !== undefined && this.now() - failed < AMBIENT_BED_RETRY_S * 1000) return;
    void this.start(mapId);
  }

  private bufferFor(mapId: string): Promise<AudioBuffer> {
    let p = this.cache.get(mapId);
    if (!p) {
      const url = ambientBedFile(mapId, this.fmt);
      this.fetched.push(url);
      p = this.load(url).then((data) => decodeAudio(this.context, data));
      this.cache.set(mapId, p);
    }
    return p;
  }

  private async start(mapId: string): Promise<void> {
    let buffer: AudioBuffer;
    try {
      buffer = await this.bufferFor(mapId);
    } catch {
      this.cache.delete(mapId);
      this.failedAt.set(mapId, this.now());
      return;
    }
    // Trong lúc tải đã đổi bản đồ khác, hoặc nền này đã được bật bởi lần gọi trước: bỏ.
    if (this.disposed || this.wanted !== mapId || [...this.playing].some((p) => p.id === mapId)) return;
    const c = this.context, t = c.currentTime ?? 0;
    const gain = c.createGain();
    gain.gain.value = 0;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(AMBIENT_BEDS[mapId].gain, t + AMBIENT_BED_FADE_S);
    gain.connect(this.duck);
    const src = c.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(gain);
    // Vào giữa vòng ở chỗ ngẫu nhiên: mỗi lần vào bản đồ không nghe lại cùng đoạn đầu (mối nối vòng đã liền nên đâu cũng được).
    src.start(0, (buffer.duration || 0) * this.random());
    const entry: Playing = { id: mapId, src, gain };
    this.playing.add(entry);
  }

  private fadeOut(p: Playing): void {
    this.playing.delete(p);
    const g = p.gain.gain, t = this.context.currentTime ?? 0;
    if (typeof g.cancelScheduledValues === "function") g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(0, t + AMBIENT_BED_FADE_S);
    try { p.src.stop(t + AMBIENT_BED_FADE_S + 0.1); } catch { /* đã dừng */ }
    p.src.addEventListener?.("ended", () => { p.gain.disconnect(); });
  }

  /** Mờ ra rồi dừng hẳn mọi nền (mất kết nối) cho tới khi `resume`. */
  stop(): void { this.setMap(null); this.halted = true; }

  /** Có AudioManager mới (scene mới sau Vào lại / đi cổng): cho phát tiếp. */
  resume(): void { this.halted = false; }

  dispose(): void {
    this.disposed = true;
    for (const p of [...this.playing]) {
      this.playing.delete(p);
      try { p.src.stop(); } catch { /* đã dừng */ }
      p.gain.disconnect();
    }
    this.bus.disconnect();
  }
}

const beds = new WeakMap<object, AmbientBed>();
let lastBed: AmbientBed | null = null;

/** Một bộ phát nền cho mỗi AudioContext (sống qua các scene); không có context (bot, trình duyệt không WebAudio) thì null. */
export function ambientBedFor(context: AudioContext | null | undefined, options?: AmbientBedOptions): AmbientBed | null {
  if (!context) return null;
  let bed = beds.get(context);
  bed?.resume();
  if (!bed) {
    try { bed = new AmbientBed(context, options); } catch { return null; }
    beds.set(context, bed);
    lastBed = bed;
  }
  return bed;
}

/** Mất kết nối (màn "Đã rời bản đồ"): dừng hẳn nền của bộ phát dùng chung, cùng chỗ gọi với `stopMusic`; scene cũ gọi tiếp cũng im, chỉ AudioManager mới phát lại. */
export function stopAmbientBed(): void { lastBed?.stop(); }
