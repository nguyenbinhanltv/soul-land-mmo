import { browserMusicFormat, decodeAudio, fetchBytes, type MusicFormat } from "./music.ts";

/** Một clip trong `audio/sfx/manifest.json` (tools/audio/process-sfx.mjs): vị trí trong audio sprite của gói. */
export interface SfxClip { id: string; group: string; pack: string; start: number; duration: number; }
export interface SfxSource { title: string; author: string; url: string; license: string; }
interface SfxManifest { packs: Record<string, { files: Partial<Record<MusicFormat, { path: string }>> }>; clips: SfxClip[]; sources?: SfxSource[]; }
/** Một lần phát: bộ đệm giải mã của cả gói + đoạn cần phát. */
export interface SfxPick { buffer: AudioBuffer; start: number; duration: number; id: string; group: string; }

export const SFX_MANIFEST_URL = "audio/sfx/manifest.json";
/** Gói tải lỗi (mạng chập): chờ chừng này ms rồi mới thử lại, tránh gọi lại mỗi tiếng. */
export const SFX_RETRY_MS = 15_000;

/** Tiền tố nhóm → gói (nhóm bước chân / hồn hoàn / giao diện nhỏ và tải ngay; thú, kỹ năng, môi trường, PK tải khi cần dùng lần đầu). */
export function packOfGroup(group: string): string | null {
  if (/^(swing|hit)-/.test(group)) return "combat";
  if (group.startsWith("skill-")) return "skill";
  if (group.startsWith("beast-")) return "beast";
  if (group.startsWith("ring-")) return "world";
  if (group.startsWith("step-")) return "steps";
  if (group.startsWith("amb-wind-lanh")) return "amb-lanh";
  if (group.startsWith("amb-fountain")) return "amb-nuoc";
  if (group.startsWith("amb-")) return "amb";
  if (group.startsWith("ui-")) return "ui";
  if (group.startsWith("pk-")) return "pk";
  return null;
}

export interface SfxBankOptions {
  load?: (url: string) => Promise<ArrayBuffer>;
  format?: MusicFormat;
  now?: () => number;
  random?: () => number;
}

/**
 * Kho tiếng mẫu (G2, #393): tải lười manifest + từng gói audio sprite (Vorbis / AAC theo trình duyệt), giải mã một lần, giữ trong RAM.
 * `pick(nhóm)` trả null khi gói chưa sẵn sàng (đang tải hoặc lỗi): người gọi lùi về tiếng tổng hợp. Chọn biến thể ngẫu nhiên,
 * không lặp liền biến thể vừa phát.
 */
export class SfxBank {
  private readonly context: BaseAudioContext;
  private readonly load: (url: string) => Promise<ArrayBuffer>;
  private readonly fmt: MusicFormat;
  private readonly now: () => number;
  private readonly random: () => number;
  private manifest: Promise<SfxManifest | null> | null = null;
  private groups = new Map<string, SfxClip[]>();
  private sourceList: SfxSource[] = [];
  private readonly packs = new Map<string, AudioBuffer>();
  private readonly loading = new Map<string, Promise<void>>();
  private readonly failedAt = new Map<string, number>();
  private readonly last = new Map<string, string>();

  constructor(context: BaseAudioContext, options: SfxBankOptions = {}) {
    this.context = context;
    this.load = options.load ?? fetchBytes;
    this.fmt = options.format ?? browserMusicFormat();
    this.now = options.now ?? (() => performance.now());
    this.random = options.random ?? Math.random;
  }

  get format(): MusicFormat { return this.fmt; }
  ready(pack: string): boolean { return this.packs.has(pack); }
  /** Nguồn và giấy phép của các tiếng (trang nghe thử, màn giới thiệu). */
  sources(): SfxSource[] { return this.sourceList; }
  /** Danh sách nhóm đã biết (sau khi manifest tải xong), cho trang nghe thử. */
  clips(): SfxClip[] { return [...this.groups.values()].flat(); }

  /** Tải manifest (một lần; lỗi thì lượt sau tải lại sau SFX_RETRY_MS). */
  loadManifest(): Promise<SfxManifest | null> {
    if (this.manifest) return this.manifest;
    const p = this.load(SFX_MANIFEST_URL).then((bytes) => {
      const m = JSON.parse(new TextDecoder().decode(bytes)) as SfxManifest;
      if (!Array.isArray(m?.clips) || !m.packs) throw new Error("manifest SFX sai khung");
      this.groups = new Map();
      this.sourceList = m.sources ?? [];
      for (const c of m.clips) { const list = this.groups.get(c.group) ?? []; list.push(c); this.groups.set(c.group, list); }
      return m;
    }).catch(() => {
      this.failedAt.set("*", this.now());
      if (this.manifest === p) this.manifest = null;
      return null;
    });
    this.manifest = p;
    return p;
  }

  /** Bắt đầu tải gói (nếu chưa có / chưa thất bại gần đây). Không chờ. */
  ensure(pack: string): Promise<void> {
    if (this.packs.has(pack)) return Promise.resolve();
    const running = this.loading.get(pack);
    if (running) return running;
    const failed = Math.max(this.failedAt.get(pack) ?? -Infinity, this.failedAt.get("*") ?? -Infinity);
    if (this.now() - failed < SFX_RETRY_MS) return Promise.resolve();
    const p = this.loadManifest().then(async (m) => {
      const path = m?.packs[pack]?.files[this.fmt]?.path;
      if (!path) throw new Error(`không có gói ${pack}`);
      this.packs.set(pack, await decodeAudio(this.context, await this.load(`audio/${path}`)));
    }).catch(() => { this.failedAt.set(pack, this.now()); }).finally(() => { this.loading.delete(pack); });
    this.loading.set(pack, p);
    return p;
  }

  /** Một clip cụ thể theo mã (trang nghe thử); null khi gói chưa sẵn sàng. */
  pickClip(id: string): SfxPick | null {
    const clip = this.clips().find((c) => c.id === id), buffer = clip && this.packs.get(clip.pack);
    return clip && buffer ? { buffer, start: clip.start, duration: clip.duration, id: clip.id, group: clip.group } : null;
  }

  pick(group: string): SfxPick | null {
    const pack = packOfGroup(group);
    if (!pack) return null;
    const buffer = this.packs.get(pack), list = this.groups.get(group);
    if (!buffer || !list?.length) { void this.ensure(pack); return null; }
    let choice = list[Math.floor(this.random() * list.length) % list.length];
    if (list.length > 1 && choice.id === this.last.get(group)) choice = list[(list.indexOf(choice) + 1) % list.length];
    this.last.set(group, choice.id);
    return { buffer, start: choice.start, duration: choice.duration, id: choice.id, group };
  }
}
