import type { AudioManager } from "./AudioManager.ts";
import type { AudioSettings } from "./settings.ts";
import { fxPrefs, setFxPrefs, SHAKE_MODES, type FxLevel, type ShakeMode } from "../combatFx.ts";
import { UI_SCALE_CHOICES, getUiScalePref, setUiScalePref, uiScale } from "../uiArt.ts";

const PANEL_ID = "audio";
const FX_LEVELS: [FxLevel, string][] = [["low", "Thấp"], ["mid", "Vừa"], ["high", "Cao"]];

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
    for (const id of ["roster", "bag", "reso", "npc", "world", "pmenu", "autoPanel"]) document.getElementById(id)?.setAttribute("hidden", "");
    el.hidden = false;
  } else closeAudioPanel();
  document.getElementById("audioBtn")?.setAttribute("aria-expanded", String(open));
  return open;
}

function render(settings: AudioSettings): void {
  const el = panel();
  if (!el) return;
  for (const key of ["master", "music", "sfx", "ui", "ambient"] as const) {
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
    <div class="audio-head"><div><b>Cài đặt</b><small data-audio-status>Âm thanh đã bật</small></div><button class="panel-x" type="button" data-audio-close aria-label="Đóng bảng Cài đặt">×</button></div>
    <label>Âm lượng tổng <output data-audio-output="master"></output><input type="range" min="0" max="1" step="0.05" data-audio="master" aria-label="Âm lượng tổng"></label>
    <label>Nhạc <output data-audio-output="music"></output><input type="range" min="0" max="1" step="0.05" data-audio="music" aria-label="Nhạc"></label>
    <label>Hiệu ứng <output data-audio-output="sfx"></output><input type="range" min="0" max="1" step="0.05" data-audio="sfx" aria-label="Hiệu ứng"></label>
    <label>Giao diện <output data-audio-output="ui"></output><input type="range" min="0" max="1" step="0.05" data-audio="ui" aria-label="Giao diện"></label>
    <label>Môi trường <output data-audio-output="ambient"></output><input type="range" min="0" max="1" step="0.05" data-audio="ambient" aria-label="Môi trường"></label>
    <button class="audio-mute" type="button" data-audio="muted" aria-pressed="false">Tắt tiếng</button>
    <div class="scale-set" role="group" aria-labelledby="scaleLbl"><span id="scaleLbl">Cỡ giao diện <output data-scale-out></output></span>
      <div class="scale-opts">${UI_SCALE_CHOICES.map((c) => `<button type="button" data-scale="${c.v}" aria-pressed="false">${c.label}</button>`).join("")}</div></div>
    <div class="scale-set" role="group" aria-labelledby="fxLbl"><span id="fxLbl">Hiệu ứng hình ảnh</span>
      <div class="scale-opts">${FX_LEVELS.map(([v, label]) => `<button type="button" data-fx="${v}" aria-pressed="false">${label}</button>`).join("")}
        <button type="button" data-fx-reduce aria-pressed="false" title="Giảm chuyển động
Tắt rung màn hình, nháy trắng, dừng hình và phóng to khi đánh.">Giảm chuyển động</button>
        <button type="button" data-fx-cine aria-pressed="false" title="Cảnh hồn kỹ lớn
Hồn kỹ vòng 7 trở lên: tối màn, chân dung võ hồn trượt ngang, tên chiêu chữ lớn.">Cảnh hồn kỹ lớn</button></div></div>
    <div class="scale-set" role="group" aria-labelledby="shakeLbl"><span id="shakeLbl">Rung màn hình</span>
      <div class="scale-opts">${SHAKE_MODES.map(([v, label]) => `<button type="button" data-shake="${v}" aria-pressed="false" title="${v === "off" ? "Không rung, không phóng to giật, không dừng hình khi đánh." : v === "boss" ? "Chỉ rung với tinh anh, thú vương, boss, khi bị chiêu mạnh và khi tung hồn kỹ lớn." : "Thêm rung khi chí mạng lên hồn thú thường (không áp dụng lúc tự săn)."}">${label}</button>`).join("")}</div></div>
    <p>Âm thanh chỉ bắt đầu sau lần chạm hoặc phím đầu tiên của bạn.</p>`;
  const update = (key: "master" | "music" | "sfx" | "ui" | "ambient", value: number) => {
    audio.updateSettings({ [key]: value });
    const output = el.querySelector<HTMLOutputElement>(`output[data-audio-output="${key}"]`);
    if (output) output.value = `${Math.round(value * 100)}%`;
  };
  for (const key of ["master", "music", "sfx", "ui", "ambient"] as const) {
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
  const renderScale = () => {
    const pref = getUiScalePref();
    el.querySelectorAll<HTMLButtonElement>("[data-scale]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scale === pref)));
    const out = el.querySelector<HTMLOutputElement>("[data-scale-out]");
    if (out) out.value = pref === "auto" ? `(tự động: ${Math.round(uiScale() * 100)}%)` : "";
  };
  el.querySelectorAll<HTMLButtonElement>("[data-scale]").forEach((b) => b.addEventListener("click", () => {
    setUiScalePref(b.dataset.scale as typeof UI_SCALE_CHOICES[number]["v"]); audio.play("ui_click"); renderScale();
  }, { signal }));
  const renderFx = () => {
    el.querySelectorAll<HTMLButtonElement>("[data-fx]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.fx === fxPrefs.level)));
    el.querySelector("[data-fx-reduce]")!.setAttribute("aria-pressed", String(fxPrefs.reduce));
    el.querySelector("[data-fx-cine]")!.setAttribute("aria-pressed", String(fxPrefs.cine));
    el.querySelectorAll<HTMLButtonElement>("[data-shake]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.shake === fxPrefs.shake)));
  };
  el.querySelectorAll<HTMLButtonElement>("[data-shake]").forEach((b) => b.addEventListener("click", () => { setFxPrefs({ shake: b.dataset.shake as ShakeMode }); audio.play("ui_click"); renderFx(); }, { signal }));
  el.querySelectorAll<HTMLButtonElement>("[data-fx]").forEach((b) => b.addEventListener("click", () => { setFxPrefs({ level: b.dataset.fx as FxLevel }); audio.play("ui_click"); renderFx(); }, { signal }));
  el.querySelector("[data-fx-reduce]")!.addEventListener("click", () => { setFxPrefs({ reduce: !fxPrefs.reduce }); audio.play("ui_click"); renderFx(); }, { signal });
  el.querySelector("[data-fx-cine]")!.addEventListener("click", () => { setFxPrefs({ cine: !fxPrefs.cine }); audio.play("ui_click"); renderFx(); }, { signal });
  renderFx();
  addEventListener("resize", renderScale, { signal });
  renderScale();
  render(audio.getSettings());
}
