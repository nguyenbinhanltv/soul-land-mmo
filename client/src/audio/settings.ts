export interface AudioSettings {
  master: number;
  music: number;
  sfx: number;
  /** Kênh Giao diện (tiếng bấm, mở / đóng bảng, nhận thưởng) và kênh Môi trường (bước chân, tiếng nền địa hình). */
  ui: number;
  ambient: number;
  muted: boolean;
}

export const AUDIO_STORAGE_KEY = "soul-land-audio-v1";
export const DEFAULT_AUDIO_SETTINGS: AudioSettings = { master: 0.9, music: 0.65, sfx: 0.8, ui: 0.8, ambient: 0.7, muted: false };

const clamp01 = (value: unknown, fallback: number) => {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(1, Math.max(0, n));
};

export function normalizeAudioSettings(value: unknown): AudioSettings {
  if (!value || typeof value !== "object") return { ...DEFAULT_AUDIO_SETTINGS };
  const raw = value as Partial<AudioSettings>;
  return {
    master: clamp01(raw.master, DEFAULT_AUDIO_SETTINGS.master),
    music: clamp01(raw.music, DEFAULT_AUDIO_SETTINGS.music),
    sfx: clamp01(raw.sfx, DEFAULT_AUDIO_SETTINGS.sfx),
    ui: clamp01(raw.ui, DEFAULT_AUDIO_SETTINGS.ui),
    ambient: clamp01(raw.ambient, DEFAULT_AUDIO_SETTINGS.ambient),
    muted: raw.muted === true || (raw.muted as unknown) === 1,
  };
}

export interface AudioStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadAudioSettings(storage: AudioStorage | null | undefined): AudioSettings {
  if (!storage) return { ...DEFAULT_AUDIO_SETTINGS };
  try {
    const raw = storage.getItem(AUDIO_STORAGE_KEY);
    return raw ? normalizeAudioSettings(JSON.parse(raw)) : { ...DEFAULT_AUDIO_SETTINGS };
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

export function saveAudioSettings(storage: AudioStorage | null | undefined, settings: AudioSettings): void {
  if (!storage) return;
  try { storage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(normalizeAudioSettings(settings))); } catch { /* localStorage có thể bị khóa */ }
}
