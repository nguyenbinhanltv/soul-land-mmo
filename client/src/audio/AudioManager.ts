import { AUDIO_STORAGE_KEY, DEFAULT_AUDIO_SETTINGS, loadAudioSettings, saveAudioSettings, type AudioSettings, type AudioStorage } from "./settings.ts";
import { spatialMix, type AudioPoint } from "./spatial.ts";
import { SFX_PARAMS, type SfxId } from "./sfxData.ts";
import { createZzFxBuffer } from "./zzfx.ts";
import { musicPlayerFor, type MusicPlayer } from "./music.ts";
import { SfxBank, type SfxBankOptions } from "./sfxBank.ts";
import { LOUD_FX, SKILL_PHASE_OF_FX, SWING_FX, ringGlowMix, type BeastFamily, type Element, type Material, type Weapon } from "./soundMap.ts";

interface SoundManagerHost {
  context?: AudioContext;
  setMute(muted: boolean): void;
  setVolume(volume: number): void;
}

export interface AudioEvent {
  k?: string;
  x?: number;
  y?: number;
  id?: string;
  bid?: string;
  crit?: boolean;
  heal?: boolean;
  shield?: boolean;
  result?: string;
  he?: string;
}

/** Ngữ cảnh chọn tiếng cho một tin `fx` (GameScene suy từ võ hồn / hồn thú của người phát). */
export interface FxSoundInfo { weapon?: Weapon; element?: Element; family?: BeastFamily; tier?: number; boss?: boolean; }

export type AudioSourceResolver = (message: AudioEvent) => AudioPoint | null;

/** Kênh trộn: Nhạc (MusicPlayer) tách riêng; còn Hiệu ứng, Giao diện, Môi trường (bước chân, tiếng địa hình). */
export type AudioChannel = "sfx" | "ui" | "ambient";

export interface SampleOptions {
  channel?: AudioChannel;
  /** Nhân âm lượng (mặc định 1). */
  gain?: number;
  /** Nhân cao độ (mặc định 1), sau biến thể ngẫu nhiên. */
  rate?: number;
  /** Ưu tiên khi hết chỗ: điểm = ưu tiên × độ to theo khoảng cách, tiếng điểm thấp nhất bị cắt nhường chỗ. */
  priority?: number;
  /** Tầm nghe (mặc định AUDIO_RANGE trong spatial.ts). */
  range?: number;
  /** Mức đưa vào vang (0 – 1). */
  wet?: number;
  /** Hạ nhạc nền còn tỉ lệ này một lúc (tiếng lớn). */
  duck?: number;
  duckMs?: number;
}

export const AUDIO_MAX_ACTIVE = 16;
export const SFX_REPEAT_WINDOW_MS = 50;
/** Biến thể ngẫu nhiên mỗi lần phát để không lặp nhàm: cao độ ±5 %, âm lượng ±10 %. */
export const SFX_PITCH_VARY = 0.05;
export const SFX_GAIN_VARY = 0.1;
/** Mặc định hạ nhạc khi có tiếng lớn (gầm boss, hồn kỹ vòng cao). */
export const LOUD_DUCK = { depth: 0.55, ms: 800 } as const;

export function resolveAudioSource(message: AudioEvent, fallback: AudioSourceResolver): AudioPoint | null {
  if (Number.isFinite(message.x) && Number.isFinite(message.y)) return { x: message.x!, y: message.y! };
  return fallback(message);
}

const storage = (): AudioStorage | null => {
  try { return window.localStorage; } catch { return null; }
};

const eventSfx: Readonly<Record<string, SfxId>> = {
  wpopen: "waypoint_cast", wpcast: "waypoint_cast", wpgo: "waypoint_go", tele: "combat_status", teleEnd: "waypoint_go", teleHit: "combat_hit",
  slash: "combat_attack", trail: "combat_attack", arc: "combat_attack", claw: "combat_attack", burst: "combat_hit", wave: "skill_neutral",
  soulring: "skill_neutral", ult: "skill_neutral", avatar: "skill_neutral", bone: "skill_neutral", combo: "combat_crit", pull: "combat_status",
  buff: "combat_shield", fly: "skill_wind", zone: "skill_neutral", bolt: "skill_lightning", zap: "skill_lightning", rage: "boss_warn",
  dispel: "combat_status", roar: "boss_warn", tienco: "skill_neutral", absorbed: "ring_absorb_success", egg: "combat_hit",
};

const skillSfxByHe: Readonly<Record<string, SfxId>> = {
  cuong_cong: "skill_fire", man_cong: "skill_wind", khong_che: "skill_ice", phu_tro: "skill_light",
};

/** Ưu tiên mặc định của tiếng tổng hợp theo nhóm: giao diện luôn nghe, tiếng chiến đấu hơn tiếng thường. */
const synthPriority = (id: SfxId) => (id.startsWith("ui_") ? 4 : id.startsWith("boss_") ? 3 : id.startsWith("combat_") || id.startsWith("skill_") ? 1.2 : 1);

interface Voice { node: AudioBufferSourceNode; gain: GainNode; score: number; send: GainNode | null; }

export class AudioManager {
  private readonly host: SoundManagerHost;
  private readonly context: AudioContext | null;
  private readonly sfxBus: GainNode | null;
  private readonly uiBus: GainNode | null;
  private readonly ambientBus: GainNode | null;
  private readonly listener: () => AudioPoint | null;
  private readonly sourceResolver: AudioSourceResolver;
  private settings: AudioSettings;
  private readonly voices = new Set<Voice>();
  private readonly bufferCache = new Map<SfxId, AudioBuffer>();
  private readonly lastPlayedAt = new Map<string, number>();
  private readonly random: () => number;
  private reverb: ConvolverNode | null = null;
  /** Nhạc nền / khúc ngắn (music.ts): sống theo AudioContext, không theo scene; null khi không có WebAudio (bot, headless). */
  readonly music: MusicPlayer | null;
  /** Kho tiếng mẫu CC0 (G2, #393); null khi không có WebAudio. Chưa tải xong thì các nhóm mẫu lùi về tiếng tổng hợp. */
  readonly bank: SfxBank | null;

  constructor(scene: { sound: unknown }, listener: () => AudioPoint | null, sourceResolver: AudioSourceResolver = () => null,
    options: { bank?: SfxBankOptions; random?: () => number } = {}) {
    this.host = scene.sound as SoundManagerHost;
    this.context = this.host.context ?? null;
    const bus = () => { const g = this.context!.createGain(); g.connect(this.context!.destination); return g; };
    this.sfxBus = this.context ? bus() : null;
    this.uiBus = this.context ? bus() : null;
    this.ambientBus = this.context ? bus() : null;
    this.music = musicPlayerFor(this.context);
    this.bank = this.context ? new SfxBank(this.context, options.bank) : null;
    this.random = options.random ?? Math.random;
    this.listener = listener;
    this.sourceResolver = sourceResolver;
    this.settings = loadAudioSettings(storage());
    this.applySettings();
  }

  /** Số tiếng đang phát (tối đa AUDIO_MAX_ACTIVE). */
  get activeVoices(): number { return this.voices.size; }

  getSettings(): AudioSettings { return { ...this.settings }; }

  updateSettings(patch: Partial<AudioSettings>): AudioSettings {
    this.settings = { ...this.settings, ...patch };
    saveAudioSettings(storage(), this.settings);
    this.applySettings();
    return this.getSettings();
  }

  bindUnlock(signal: AbortSignal): void {
    const unlock = () => { void this.unlock(); };
    for (const type of ["pointerdown", "keydown", "touchstart"] as const) window.addEventListener(type, unlock, { signal, once: true, passive: true });
  }

  async unlock(): Promise<void> {
    if (!this.context) return;
    try { await this.context.resume(); } catch { /* trình duyệt có thể vẫn chặn tự phát */ }
    // Gói nhỏ và dùng ngay (đánh, trúng, bước chân, hồn hoàn) tải sẵn; gói kỹ năng và hồn thú tải khi dùng lần đầu.
    for (const pack of ["combat", "steps", "world"]) void this.bank?.ensure(pack);
  }

  /** Tiếng tổng hợp (zzfx): giao diện và tiếng nhỏ chưa có mẫu. Tiếng `ui_*` đi kênh Giao diện, còn lại kênh Hiệu ứng. */
  play(id: SfxId, source?: AudioPoint | null): void {
    const context = this.context, params = SFX_PARAMS[id];
    if (!context || !params || context.state !== "running" || this.settings.muted) return;
    const now = Date.now(), lastPlayedAt = this.lastPlayedAt.get(id);
    if (lastPlayedAt !== undefined && now - lastPlayedAt < SFX_REPEAT_WINDOW_MS) return;
    const listener = source ? this.listener() : null;
    if (source && !listener) return;
    const mix = source ? spatialMix(source, listener!) : { volume: 1, pan: 0 };
    if (!mix) return;
    const vary = this.vary();
    const score = synthPriority(id) * mix.volume;
    if (!this.admit(score)) return;
    let buffer = this.bufferCache.get(id);
    if (!buffer) {
      buffer = createZzFxBuffer(context, params);
      this.bufferCache.set(id, buffer);
    }
    const node = context.createBufferSource();
    node.buffer = buffer;
    if (node.playbackRate) node.playbackRate.value = vary.rate;
    this.startVoice(node, mix.volume * vary.gain, mix.pan, (id.startsWith("ui_") ? this.uiBus : this.sfxBus) ?? context.destination, score);
    this.lastPlayedAt.set(id, now);
    node.start();
  }

  /**
   * Tiếng mẫu CC0 theo nhóm (sfx-catalog.json): chọn ngẫu nhiên một biến thể, đổi cao độ ±5 % / âm lượng ±10 %, trộn theo khoảng cách
   * và lệch trái / phải, vào kênh `opts.channel`. Hết chỗ thì tiếng điểm thấp nhất (xa, kém ưu tiên) bị cắt.
   * Trả false chỉ khi mẫu chưa có (gói đang tải / lỗi) để người gọi lùi về tiếng tổng hợp; bỏ qua vì tắt tiếng, xa, hết chỗ vẫn là true.
   */
  playGroup(group: string, source?: AudioPoint | null, opts: SampleOptions = {}): boolean {
    const context = this.context;
    if (!context || !this.bank) return true;
    if (context.state !== "running" || this.settings.muted) return true;
    const now = Date.now(), last = this.lastPlayedAt.get(group);
    if (last !== undefined && now - last < SFX_REPEAT_WINDOW_MS) return true;
    const listener = source ? this.listener() : null;
    if (source && !listener) return true;
    const mix = source ? spatialMix(source, listener!, opts.range) : { volume: 1, pan: 0 };
    if (!mix) return true;
    const pick = this.bank.pick(group);
    if (!pick) return false;
    this.lastPlayedAt.set(group, now);
    this.startSample(pick, mix, opts);
    return true;
  }

  /** Phát đúng một clip theo mã (trang nghe thử `?thu=am`): không biến thể, không giới hạn lặp. */
  playClip(clipId: string, opts: SampleOptions = {}): boolean {
    const context = this.context, pick = this.bank?.pickClip(clipId);
    if (!context || !pick || context.state !== "running" || this.settings.muted) return false;
    this.startSample(pick, { volume: 1, pan: 0 }, { ...opts, priority: opts.priority ?? 9 }, false);
    return true;
  }

  handleDamage(message: AudioEvent, material: Material = "thit"): void {
    const source = this.resolveSource(message);
    if (!source) return;
    if (message.heal) return this.play("combat_heal", source);
    if (message.shield) return this.play("combat_shield", source);
    const group = `hit-${material}`;
    if (message.crit) {
      if (!this.playGroup(group, source, { gain: 1.3, rate: 0.92, priority: 1.6 })) this.play("combat_hit", source);
      this.play("combat_crit", source);
      return;
    }
    if (!this.playGroup(group, source, { priority: 1.2 })) this.play("combat_hit", source);
  }

  handleFx(message: AudioEvent, info: FxSoundInfo & { he?: string } = {}): void {
    const source = this.resolveSource(message);
    if (!source || !message.k) return;
    const k = message.k, he = info.he;
    const loud = LOUD_FX.has(k) ? { duck: LOUD_DUCK.depth, duckMs: LOUD_DUCK.ms } : {};
    if (SWING_FX.has(k)) {
      const weapon = info.weapon ?? (k === "claw" ? "trao" : "kiem");
      if (!this.playGroup(`swing-${weapon}`, source, { priority: 1.3 })) this.play("combat_attack", source);
      return;
    }
    if ((k === "tele" || k === "rage") && info.family) {
      if (!this.playGroup(`beast-${info.family}`, source, { priority: 1 })) this.play(eventSfx[k], source);
      return;
    }
    if (k === "roar") {
      if (!this.playGroup("beast-boss", source, { priority: 3, range: 480, ...loud })) this.play("boss_warn", source);
      return;
    }
    const phase = SKILL_PHASE_OF_FX[k];
    if (phase) {
      const element = info.element;
      const ok = element && this.playGroup(`skill-${element}-${phase}`, source, { priority: k === "ult" || k === "avatar" ? 2.4 : 1.6, ...loud });
      if (k === "soulring" && info.tier !== undefined) this.playRingGlow(info.tier, source);
      if (ok) return;
      const mapped = phase === "start" ? skillSfxByHe[he ?? ""] ?? eventSfx[k] : eventSfx[k];
      if (mapped) this.play(mapped, source);
      return;
    }
    const id = eventSfx[k];
    if (id) this.play(id, source);
  }

  /** Hồn hoàn sáng lên: niên hạn càng cao càng trầm, vang và to (soundMap.ringGlowMix). */
  playRingGlow(tier: number, source?: AudioPoint | null): boolean {
    const mix = ringGlowMix(tier);
    return this.playGroup("ring-glow", source, { rate: mix.rate, wet: mix.wet, gain: mix.gain, priority: 2 });
  }

  /** Tiếng thú theo họ, hoặc gầm boss (hạ nhạc nền). */
  playBeast(family: BeastFamily | "boss" | "die", source: AudioPoint | null, opts: SampleOptions = {}): boolean {
    return this.playGroup(`beast-${family}`, source, { priority: family === "boss" ? 3 : 1, ...(family === "boss" ? { range: 480, duck: LOUD_DUCK.depth, duckMs: LOUD_DUCK.ms } : {}), ...opts });
  }

  dispose(): void {
    for (const voice of this.voices) { try { voice.node.stop(); } catch {} }
    this.voices.clear();
    this.sfxBus?.disconnect();
    this.uiBus?.disconnect();
    this.ambientBus?.disconnect();
    this.bufferCache.clear();
    this.lastPlayedAt.clear();
  }

  private vary(): { rate: number; gain: number } {
    return { rate: 1 + (this.random() * 2 - 1) * SFX_PITCH_VARY, gain: 1 + (this.random() * 2 - 1) * SFX_GAIN_VARY };
  }

  private channelBus(channel: AudioChannel): GainNode | null {
    return channel === "ui" ? this.uiBus : channel === "ambient" ? this.ambientBus : this.sfxBus;
  }

  /** Còn chỗ thì nhận; hết chỗ thì cắt tiếng điểm thấp nhất nếu tiếng mới điểm cao hơn, không thì bỏ tiếng mới. */
  private admit(score: number): boolean {
    if (this.voices.size < AUDIO_MAX_ACTIVE) return true;
    let weakest: Voice | null = null;
    for (const voice of this.voices) if (!weakest || voice.score < weakest.score) weakest = voice;
    if (!weakest || score <= weakest.score) return false;
    this.voices.delete(weakest);
    try { weakest.gain.gain.value = 0; weakest.node.stop(); } catch { /* đã dừng */ }
    weakest.send?.disconnect();
    return true;
  }

  private startSample(pick: { buffer: AudioBuffer; start: number; duration: number }, mix: { volume: number; pan: number }, opts: SampleOptions, vary = true): void {
    const context = this.context!;
    const v = vary ? this.vary() : { rate: 1, gain: 1 };
    const score = (opts.priority ?? 1) * mix.volume;
    if (!this.admit(score)) return;
    const node = context.createBufferSource();
    node.buffer = pick.buffer;
    const rate = v.rate * (opts.rate ?? 1);
    if (node.playbackRate) node.playbackRate.value = rate;
    this.startVoice(node, mix.volume * v.gain * (opts.gain ?? 1), mix.pan, this.channelBus(opts.channel ?? "sfx") ?? context.destination, score, opts.wet);
    node.start(0, pick.start, pick.duration + 0.01);
    if (opts.duck) this.music?.duckFor(opts.duck, opts.duckMs ?? LOUD_DUCK.ms);
  }

  /** Nhánh vang: gain của tiếng (đã nhân khoảng cách) → gain (mức wet) → ConvolverNode → bus Hiệu ứng, nên tiếng xa vang nhỏ theo. Không có WebAudio đủ thì bỏ vang. */
  private sendToReverb(voiceGain: GainNode, wet: number): GainNode | null {
    const context = this.context!;
    if (typeof context.createConvolver !== "function") return null;
    if (!this.reverb) {
      const length = Math.round(context.sampleRate * 1.6), ir = context.createBuffer(2, length, context.sampleRate);
      for (let c = 0; c < 2; c++) {
        const data = ir.getChannelData(c);
        for (let i = 0; i < length; i++) data[i] = (this.random() * 2 - 1) * (1 - i / length) ** 3;
      }
      this.reverb = context.createConvolver();
      this.reverb.buffer = ir;
      this.reverb.connect(this.sfxBus ?? context.destination);
    }
    const send = context.createGain();
    send.gain.value = Math.min(1, Math.max(0, wet));
    voiceGain.connect(send);
    send.connect(this.reverb);
    return send;
  }

  private startVoice(node: AudioBufferSourceNode, volume: number, pan: number, destination: AudioNode, score: number, wet = 0): void {
    const context = this.context!;
    const gain = context.createGain();
    const panner = typeof context.createStereoPanner === "function" ? context.createStereoPanner() : null;
    gain.gain.value = volume;
    node.connect(gain);
    if (panner) { panner.pan.value = pan; gain.connect(panner); panner.connect(destination); }
    else gain.connect(destination);
    const send = wet > 0 ? this.sendToReverb(gain, wet) : null;
    const voice: Voice = { node, gain, score, send };
    this.voices.add(voice);
    node.addEventListener("ended", () => { this.voices.delete(voice); send?.disconnect(); }, { once: true });
  }

  private resolveSource(message: AudioEvent): AudioPoint | null {
    return resolveAudioSource(message, this.sourceResolver);
  }

  private applySettings(): void {
    const s = this.settings, level = (v: number) => (s.muted ? 0 : s.master * v);
    this.host.setMute(s.muted);
    this.host.setVolume(level(s.music));
    if (this.sfxBus) this.sfxBus.gain.value = level(s.sfx);
    if (this.uiBus) this.uiBus.gain.value = level(s.ui);
    if (this.ambientBus) this.ambientBus.gain.value = level(s.ambient);
    // Bus nhạc thật nằm ở MusicPlayer (nối thẳng vào loa, không qua Phaser); volume Phaser ở trên giữ cho tiếng Phaser nếu có.
    this.music?.setVolume(level(s.music));
  }
}

export { AUDIO_STORAGE_KEY, DEFAULT_AUDIO_SETTINGS };
