import type { AudioManager } from "./AudioManager.ts";
import type { AudioSettings } from "./settings.ts";
import { fxPrefs, setFxPrefs, SHAKE_MODES, type FxLevel, type ShakeMode } from "../combatFx.ts";
import { HAO_QUANG_MODES, type HaoQuangMode } from "../../../shared/data.ts";
import { UI_SCALE_CHOICES, getUiScalePref, setUiScalePref, uiScale } from "../uiArt.ts";
import { mountGoogleButton } from "../google.ts";
import { post, storage, type Me } from "../net.ts";

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
    <div class="scale-set" role="group" aria-labelledby="ggLbl" id="ggSet" hidden><span id="ggLbl">Tài khoản Google</span>
      <small id="ggState" aria-live="polite"></small><div class="gbtn" id="ggBtn" hidden></div></div>
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
Hồn kỹ vòng 7 trở lên: tối màn, chân dung võ hồn trượt ngang, tên chiêu chữ lớn.">Cảnh hồn kỹ lớn</button>
        <button type="button" data-fx-cutin aria-pressed="false" title="Cut-in Chân Thân
Khi bật Võ Hồn Chân Thân: chân dung pháp tướng lướt ngang màn hình nửa giây (chỉ mình bạn thấy; tắt khi Giảm chuyển động hoặc mức Thấp).">Cut-in Chân Thân</button>
        <button type="button" data-fx-auto aria-pressed="false" title="Tự hạ hiệu ứng
Khi FPS thấp kéo dài, tự giảm mức Hiệu ứng một bậc (không đổi lựa chọn của bạn); FPS tốt lại thì nâng lên, tối đa bằng mức bạn chọn.">Tự hạ khi giật</button>
        <button type="button" data-fx-hat aria-pressed="false" title="Ẩn mũ
Không vẽ mũ trang bị lên hồn sư (của mọi người; chỉ trên máy bạn). Áo vẫn hiện.">Ẩn mũ</button></div></div>
    <div class="scale-set" role="group" aria-labelledby="shakeLbl"><span id="shakeLbl">Rung màn hình</span>
      <div class="scale-opts">${SHAKE_MODES.map(([v, label]) => `<button type="button" data-shake="${v}" aria-pressed="false" title="${v === "off" ? "Không rung, không phóng to giật, không dừng hình khi đánh." : v === "boss" ? "Chỉ rung với tinh anh, thú vương, boss, khi bị chiêu mạnh và khi tung hồn kỹ lớn." : "Thêm rung khi chí mạng lên hồn thú thường (không áp dụng lúc tự săn)."}">${label}</button>`).join("")}</div></div>
    <div class="scale-set" role="group" aria-labelledby="haloLbl"><span id="haloLbl">Vòng hồn hoàn khi Chân Thân</span>
      <div class="scale-opts">${HAO_QUANG_MODES.map(([v, label]) => `<button type="button" data-halo="${v}" aria-pressed="false" title="${v === "halo" ? "Các vòng bay xoắn lúc biến hình rồi hợp thành quầng sáng nhỏ sau lưng; vòng 7 ở lại dưới chân." : v === "feet" ? "Các vòng giữ nguyên đồng tâm dưới chân, vòng 7 sáng." : "Các vòng bay lên xếp quanh thân như trước."}">${label}</button>`).join("")}</div></div>
    <p>Âm thanh chỉ bắt đầu sau lần chạm hoặc phím đầu tiên của bạn.</p>`;
  // Liên kết Google (#612): hỏi trạng thái mỗi lần mở bảng; chưa liên kết thì hiện nút Google (server tắt thì ẩn cả mục).
  const ggSet = el.querySelector<HTMLElement>("#ggSet")!, ggState = el.querySelector<HTMLElement>("#ggState")!, ggBtn = el.querySelector<HTMLElement>("#ggBtn")!;
  const refreshGoogle = async () => {
    const token = storage.get("shh-token");
    if (!token) return;
    try {
      const me = await post<Me>("/api/me", { token });
      if (me.googleLinked) { ggSet.hidden = false; ggBtn.hidden = true; ggState.textContent = "Đã liên kết: bạn có thể vào game bằng Google."; return; }
      const shown = await mountGoogleButton(ggBtn, "Liên kết Google", async (credential) => {
        ggState.textContent = "Đang liên kết…";
        try { await post("/api/link/google", { token, credential }); void refreshGoogle(); }
        catch (e) { ggState.textContent = (e as Error).message; }
      }, (m) => { ggState.textContent = m; });
      if (!shown && !ggState.textContent) { ggSet.hidden = true; return; } // server tắt Google: ẩn cả mục; nạp lỗi thì giữ mục để hiện lỗi
      ggSet.hidden = false;
      if (shown) ggState.textContent = "Chưa liên kết. Liên kết để lần sau vào game bằng Google (vẫn dùng được tên và mật khẩu).";
    } catch { /* mất mạng / phiên hết hạn: giữ nguyên mục, thử lại lần mở sau */ }
  };
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
    if (open) void refreshGoogle();
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
    el.querySelector("[data-fx-cutin]")!.setAttribute("aria-pressed", String(fxPrefs.cutin));
    el.querySelector("[data-fx-hat]")!.setAttribute("aria-pressed", String(fxPrefs.hideHat));
    el.querySelector("[data-fx-auto]")!.setAttribute("aria-pressed", String(fxPrefs.auto));
    el.querySelectorAll<HTMLButtonElement>("[data-shake]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.shake === fxPrefs.shake)));
    el.querySelectorAll<HTMLButtonElement>("[data-halo]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.halo === fxPrefs.halo)));
  };
  el.querySelectorAll<HTMLButtonElement>("[data-halo]").forEach((b) => b.addEventListener("click", () => { setFxPrefs({ halo: b.dataset.halo as HaoQuangMode }); audio.play("ui_click"); renderFx(); }, { signal }));
  el.querySelectorAll<HTMLButtonElement>("[data-shake]").forEach((b) => b.addEventListener("click", () => { setFxPrefs({ shake: b.dataset.shake as ShakeMode }); audio.play("ui_click"); renderFx(); }, { signal }));
  el.querySelectorAll<HTMLButtonElement>("[data-fx]").forEach((b) => b.addEventListener("click", () => { setFxPrefs({ level: b.dataset.fx as FxLevel }); audio.play("ui_click"); renderFx(); }, { signal }));
  el.querySelector("[data-fx-reduce]")!.addEventListener("click", () => { setFxPrefs({ reduce: !fxPrefs.reduce }); audio.play("ui_click"); renderFx(); }, { signal });
  el.querySelector("[data-fx-cine]")!.addEventListener("click", () => { setFxPrefs({ cine: !fxPrefs.cine }); audio.play("ui_click"); renderFx(); }, { signal });
  el.querySelector("[data-fx-cutin]")!.addEventListener("click", () => { setFxPrefs({ cutin: !fxPrefs.cutin }); audio.play("ui_click"); renderFx(); }, { signal });
  el.querySelector("[data-fx-auto]")!.addEventListener("click", () => { setFxPrefs({ auto: !fxPrefs.auto }); audio.play("ui_click"); renderFx(); }, { signal });
  el.querySelector("[data-fx-hat]")!.addEventListener("click", () => { setFxPrefs({ hideHat: !fxPrefs.hideHat }); audio.play("ui_click"); renderFx(); }, { signal });
  renderFx();
  addEventListener("resize", renderScale, { signal });
  renderScale();
  render(audio.getSettings());
}
