import { AUDIO_STORAGE_KEY, DEFAULT_AUDIO_SETTINGS, loadAudioSettings, saveAudioSettings, type AudioSettings, type AudioStorage } from "./settings.ts";
import { spatialMix, type AudioPoint } from "./spatial.ts";
import { SFX_PARAMS, type SfxId } from "./sfxData.ts";
import { createZzFxBuffer } from "./zzfx.ts";

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
  crit?: boolean;
  heal?: boolean;
  shield?: boolean;
  result?: string;
  he?: string;
}

const storage = (): AudioStorage | null => {
  try { return window.localStorage; } catch { return null; }
};

const eventSfx: Readonly<Record<string, SfxId>> = {
  wpopen: "waypoint_cast", wpcast: "waypoint_cast", wpgo: "waypoint_go", tele: "combat_status", teleEnd: "waypoint_go", teleHit: "combat_hit",
  slash: "combat_attack", trail: "combat_attack", arc: "combat_attack", claw: "combat_attack", burst: "combat_hit", wave: "skill_neutral",
  soulring: "skill_neutral", ult: "skill_neutral", avatar: "skill_neutral", bone: "skill_neutral", combo: "combat_crit", pull: "combat_status",
  buff: "combat_shield", fly: "skill_wind", zone: "skill_neutral", bolt: "skill_lightning", zap: "skill_lightning", rage: "boss_warn",
  dispel: "combat_status", roar: "boss_warn", tienco: "skill_neutral", absorbed: "ring_absorb_success",
};

const skillSfxByHe: Readonly<Record<string, SfxId>> = {
  cuong_cong: "skill_fire", man_cong: "skill_wind", khong_che: "skill_ice", phu_tro: "skill_light",
};

export class AudioManager {
  private readonly host: SoundManagerHost;
  private readonly context: AudioContext | null;
  private readonly sfxBus: GainNode | null;
  private readonly listener: () => AudioPoint | null;
  private settings: AudioSettings;
  private unlocked = false;
  private readonly active = new Set<AudioBufferSourceNode>();

  constructor(scene: { sound: unknown }, listener: () => AudioPoint | null) {
    this.host = scene.sound as SoundManagerHost;
    this.context = this.host.context ?? null;
    this.sfxBus = this.context ? this.context.createGain() : null;
    if (this.context && this.sfxBus) this.sfxBus.connect(this.context.destination);
    this.listener = listener;
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
    try {
      await this.context.resume();
      this.unlocked = this.context.state === "running";
    } catch { this.unlocked = false; }
  }

  play(id: SfxId, source?: AudioPoint | null): void {
    const context = this.context, params = SFX_PARAMS[id];
    if (!context || !params || !this.unlocked || this.settings.muted) return;
    const mix = source ? spatialMix(source, this.listener() ?? source) : { volume: 1, pan: 0 };
    if (!mix) return;
    const node = context.createBufferSource();
    const gain = context.createGain();
    const panner = typeof context.createStereoPanner === "function" ? context.createStereoPanner() : null;
    node.buffer = createZzFxBuffer(context, params);
    gain.gain.value = mix.volume;
    node.connect(gain);
    const destination = this.sfxBus ?? context.destination;
    if (panner) { panner.pan.value = mix.pan; gain.connect(panner); panner.connect(destination); }
    else gain.connect(destination);
    this.active.add(node);
    node.addEventListener("ended", () => this.active.delete(node), { once: true });
    node.start();
  }

  handleDamage(message: AudioEvent): void {
    const source = this.eventPoint(message);
    this.play(message.heal ? "combat_heal" : message.shield ? "combat_shield" : message.crit ? "combat_crit" : "combat_hit", source);
  }

  handleFx(message: AudioEvent, he?: string): void {
    const source = this.eventPoint(message);
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
  }

  private eventPoint(message: AudioEvent): AudioPoint | null {
    return Number.isFinite(message.x) && Number.isFinite(message.y) ? { x: message.x!, y: message.y! } : null;
  }

  private applySettings(): void {
    this.host.setMute(this.settings.muted);
    this.host.setVolume(this.settings.muted ? 0 : this.settings.master * this.settings.music);
    if (this.sfxBus) this.sfxBus.gain.value = this.settings.muted ? 0 : this.settings.master * this.settings.sfx;
  }
}

export { AUDIO_STORAGE_KEY, DEFAULT_AUDIO_SETTINGS };
