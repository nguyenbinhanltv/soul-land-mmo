import { AUDIO_STORAGE_KEY, DEFAULT_AUDIO_SETTINGS, loadAudioSettings, saveAudioSettings, type AudioSettings, type AudioStorage } from "./settings.ts";
import { spatialMix, type AudioPoint } from "./spatial.ts";
import { SFX_PARAMS, type SfxId } from "./sfxData.ts";
import { createZzFxBuffer } from "./zzfx.ts";
import { musicPlayerFor, type MusicPlayer } from "./music.ts";

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

export type AudioSourceResolver = (message: AudioEvent) => AudioPoint | null;

export const AUDIO_MAX_ACTIVE = 16;
export const SFX_REPEAT_WINDOW_MS = 50;

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

export class AudioManager {
  private readonly host: SoundManagerHost;
  private readonly context: AudioContext | null;
  private readonly sfxBus: GainNode | null;
  private readonly listener: () => AudioPoint | null;
  private readonly sourceResolver: AudioSourceResolver;
  private settings: AudioSettings;
  private readonly active = new Set<AudioBufferSourceNode>();
  private readonly bufferCache = new Map<SfxId, AudioBuffer>();
  private readonly lastPlayedAt = new Map<SfxId, number>();
  /** Nhạc nền / khúc ngắn (music.ts): sống theo AudioContext, không theo scene; null khi không có WebAudio (bot, headless). */
  readonly music: MusicPlayer | null;

  constructor(scene: { sound: unknown }, listener: () => AudioPoint | null, sourceResolver: AudioSourceResolver = () => null) {
    this.host = scene.sound as SoundManagerHost;
    this.context = this.host.context ?? null;
    this.sfxBus = this.context ? this.context.createGain() : null;
    if (this.context && this.sfxBus) this.sfxBus.connect(this.context.destination);
    this.music = musicPlayerFor(this.context);
    this.listener = listener;
    this.sourceResolver = sourceResolver;
    this.settings = loadAudioSettings(storage());
    this.applySettings();
  }

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
  }

  play(id: SfxId, source?: AudioPoint | null): void {
    const context = this.context, params = SFX_PARAMS[id];
    if (!context || !params || context.state !== "running" || this.settings.muted) return;
    const now = Date.now(), lastPlayedAt = this.lastPlayedAt.get(id);
    if (lastPlayedAt !== undefined && now - lastPlayedAt < SFX_REPEAT_WINDOW_MS) return;
    const listener = source ? this.listener() : null;
    if (source && !listener) return;
    const mix = source ? spatialMix(source, listener!) : { volume: 1, pan: 0 };
    if (!mix) return;
    if (this.active.size >= AUDIO_MAX_ACTIVE) return;
    let buffer = this.bufferCache.get(id);
    if (!buffer) {
      buffer = createZzFxBuffer(context, params);
      this.bufferCache.set(id, buffer);
    }
    const node = context.createBufferSource();
    const gain = context.createGain();
    const panner = typeof context.createStereoPanner === "function" ? context.createStereoPanner() : null;
    node.buffer = buffer;
    gain.gain.value = mix.volume;
    node.connect(gain);
    const destination = this.sfxBus ?? context.destination;
    if (panner) { panner.pan.value = mix.pan; gain.connect(panner); panner.connect(destination); }
    else gain.connect(destination);
    this.active.add(node);
    this.lastPlayedAt.set(id, now);
    node.addEventListener("ended", () => this.active.delete(node), { once: true });
    node.start();
  }

  handleDamage(message: AudioEvent): void {
    const source = this.resolveSource(message);
    if (!source) return;
    this.play(message.heal ? "combat_heal" : message.shield ? "combat_shield" : message.crit ? "combat_crit" : "combat_hit", source);
  }

  handleFx(message: AudioEvent, he?: string): void {
    const source = this.resolveSource(message);
    if (!source) return;
    if (message.k === "soulring" || message.k === "ult" || message.k === "avatar" || message.k === "zone" || message.k === "tienco") {
      this.play(skillSfxByHe[he ?? ""] ?? "skill_neutral", source);
      return;
    }
    const id = message.k ? eventSfx[message.k] : undefined;
    if (id) this.play(id, source);
  }

  dispose(): void {
    for (const node of this.active) { try { node.stop(); } catch {} }
    this.active.clear();
    this.sfxBus?.disconnect();
    this.bufferCache.clear();
    this.lastPlayedAt.clear();
  }

  private resolveSource(message: AudioEvent): AudioPoint | null {
    return resolveAudioSource(message, this.sourceResolver);
  }

  private applySettings(): void {
    this.host.setMute(this.settings.muted);
    this.host.setVolume(this.settings.muted ? 0 : this.settings.master * this.settings.music);
    if (this.sfxBus) this.sfxBus.gain.value = this.settings.muted ? 0 : this.settings.master * this.settings.sfx;
    // Bus nhạc thật nằm ở MusicPlayer (nối thẳng vào loa, không qua Phaser); volume Phaser ở trên giữ cho tiếng Phaser nếu có.
    this.music?.setVolume(this.settings.muted ? 0 : this.settings.master * this.settings.music);
  }
}

export { AUDIO_STORAGE_KEY, DEFAULT_AUDIO_SETTINGS };
