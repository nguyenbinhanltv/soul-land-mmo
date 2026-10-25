// Nền môi trường vòng lặp (#622): một bản thu liền mạch phát suốt khi ở bản đồ có nền (sóng Hải Thần Đảo, hang Lõi Tinh Đấu, hầm Đấu Hồn Trường),
// chồng dưới nhạc nền và dưới lớp chồng ngẫu nhiên (ambientLayers.ts). Đổi bản đồ thì mờ ra / mờ vào chéo nhau; tải lười từng file theo bản đồ.
// Đi qua bus Môi trường của AudioManager nên thanh Môi trường, Tắt tiếng và hạ nền khi đông tiếng áp dụng như mọi tiếng môi trường khác.
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
  private readonly dest: AudioNode;
  private readonly load: (url: string) => Promise<ArrayBuffer>;
  private readonly fmt: MusicFormat;
  private readonly now: () => number;
  private readonly random: () => number;
  private readonly cache = new Map<string, Promise<AudioBuffer>>();
  private readonly failedAt = new Map<string, number>();
  private readonly playing = new Set<Playing>();
  private wanted = "";
  private disposed = false;
  /** Các file đã yêu cầu tải (để bot / bài thử thấy tải lười). */
  readonly fetched: string[] = [];

  constructor(context: AudioContext, dest: AudioNode, options: AmbientBedOptions = {}) {
    this.context = context;
    this.dest = dest;
    this.load = options.load ?? fetchBytes;
    this.fmt = options.format ?? browserMusicFormat();
    this.now = options.now ?? Date.now;
    this.random = options.random ?? Math.random;
  }

  /** Nền đang nghe thấy (đã hoặc đang mờ vào); null = bản đồ không có nền. */
  get current(): string | null { for (const p of this.playing) if (p.id === this.wanted) return p.id; return null; }

  /** Gọi mỗi lần báo môi trường (~250 ms): chỉ làm gì khi bản đồ đổi hoặc nền cần tải lại sau lỗi. */
  setMap(mapId: string): void {
    if (this.disposed) return;
    const changed = mapId !== this.wanted;
    if (changed) {
      this.wanted = mapId;
      for (const p of this.playing) if (p.id !== mapId) this.fadeOut(p);
    }
    if (!AMBIENT_BEDS[mapId] || [...this.playing].some((p) => p.id === mapId)) return;
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
    gain.connect(this.dest);
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

  dispose(): void {
    this.disposed = true;
    for (const p of [...this.playing]) {
      this.playing.delete(p);
      try { p.src.stop(); } catch { /* đã dừng */ }
      p.gain.disconnect();
    }
  }
}
