import type { AudioManager } from "./AudioManager.ts";
import type { AudioSettings } from "./settings.ts";

const PANEL_ID = "audio";

function panel(): HTMLElement | null { return document.getElementById(PANEL_ID); }

export function closeAudioPanel(): void {
  const el = panel();
  if (!el) return;
  el.hidden = true;
  document.getElementById("audioBtn")?.setAttribute("aria-expanded", "false");
}

export function toggleAudioPanel(): boolean {
  const el = panel();
  if (!el) return false;
  const open = el.hidden;
  if (open) {
    for (const id of ["roster", "bag", "reso", "npc", "world", "pmenu"]) document.getElementById(id)?.setAttribute("hidden", "");
    el.hidden = false;
  } else closeAudioPanel();
  document.getElementById("audioBtn")?.setAttribute("aria-expanded", String(open));
  return open;
}

function render(settings: AudioSettings): void {
  const el = panel();
  if (!el) return;
  for (const key of ["master", "music", "sfx"] as const) {
    const input = el.querySelector<HTMLInputElement>(`input[data-audio="${key}"]`);
    if (input) input.value = String(settings[key]);
    const output = el.querySelector<HTMLOutputElement>(`output[data-audio-output="${key}"]`);
    if (output) output.value = `${Math.round(settings[key] * 100)}%`;
  }
  const mute = el.querySelector<HTMLButtonElement>('[data-audio="muted"]');
  if (mute) {
    mute.textContent = settings.muted ? "Bật âm thanh" : "Tắt tiếng";
    mute.setAttribute("aria-pressed", String(settings.muted));
  }
  const status = el.querySelector<HTMLElement>("[data-audio-status]");
  if (status) status.textContent = settings.muted ? "Đang tắt tiếng" : "Âm thanh đã bật";
}

export function bindAudioPanel(audio: AudioManager, signal: AbortSignal): void {
  const el = panel();
  const button = document.getElementById("audioBtn");
  if (!el || !button) return;
  el.innerHTML = `
    <div class="audio-head"><div><b>Âm thanh</b><small data-audio-status>Âm thanh đã bật</small></div><button class="panel-x" type="button" data-audio-close aria-label="Đóng bảng Âm thanh">×</button></div>
    <label>Âm lượng tổng <output data-audio-output="master"></output><input type="range" min="0" max="1" step="0.05" data-audio="master"></label>
    <label>Nhạc <output data-audio-output="music"></output><input type="range" min="0" max="1" step="0.05" data-audio="music"></label>
    <label>Hiệu ứng <output data-audio-output="sfx"></output><input type="range" min="0" max="1" step="0.05" data-audio="sfx"></label>
    <button class="audio-mute" type="button" data-audio="muted" aria-pressed="false">Tắt tiếng</button>
    <p>Âm thanh chỉ bắt đầu sau lần chạm hoặc phím đầu tiên của bạn.</p>`;
  const update = (key: "master" | "music" | "sfx", value: number) => {
    audio.updateSettings({ [key]: value });
    const output = el.querySelector<HTMLOutputElement>(`output[data-audio-output="${key}"]`);
    if (output) output.value = `${Math.round(value * 100)}%`;
  };
  for (const key of ["master", "music", "sfx"] as const) {
    const input = el.querySelector<HTMLInputElement>(`input[data-audio="${key}"]`)!;
    input.addEventListener("input", () => update(key, Number(input.value)), { signal });
  }
  el.querySelector<HTMLButtonElement>('[data-audio="muted"]')!.addEventListener("click", () => {
    audio.updateSettings({ muted: !audio.getSettings().muted }); audio.play("ui_click"); render(audio.getSettings());
  }, { signal });
  el.querySelector<HTMLButtonElement>("[data-audio-close]")!.addEventListener("click", () => { audio.play("ui_panel_close"); closeAudioPanel(); }, { signal });
  button.addEventListener("click", (event) => {
    (event.currentTarget as HTMLElement).blur();
    const open = toggleAudioPanel();
    audio.play(open ? "ui_panel_open" : "ui_panel_close");
  }, { signal });
  render(audio.getSettings());
}
