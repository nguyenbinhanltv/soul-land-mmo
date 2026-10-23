// Trang nghe thử âm thanh (G2, #393; mở bằng `?thu=am`, không cần đăng nhập): mọi tiếng mẫu CC0 theo nhóm, từng biến thể, kênh trộn,
// hồn hoàn theo niên hạn, gầm boss hạ nhạc, chồng nhiều tiếng để nghe giới hạn số tiếng. Chỉ để chủ repo nghe; không đổi luật chơi.
import { TIERS } from "../../shared/data.ts";
import { AudioManager, LOUD_DUCK, type AudioChannel } from "./audio/AudioManager.ts";
import { sharedAudioContext } from "./audio/music.ts";
import { SFX_IDS } from "./audio/sfxData.ts";
import type { SfxClip } from "./audio/sfxBank.ts";
import { BEAST_FAMILIES, ELEMENTS, MATERIALS, SKILL_PHASES, SURFACES, WEAPONS } from "./audio/soundMap.ts";

const NAME: Record<string, string> = {
  kiem: "Kiếm", chuy: "Chùy", thuong: "Thương", trao: "Trảo", quyen: "Quyền",
  thit: "Thịt", giap: "Giáp / vỏ cứng", bang: "Băng", go: "Gỗ / cây",
  fire: "Lửa", ice: "Băng", lightning: "Sét", poison: "Độc", light: "Quang", dark: "Ám", wood: "Mộc", wind: "Phong",
  start: "bắt đầu", fly: "bay", boom: "nổ",
  lang: "Sói", hung: "Gấu / tê / giáp", bao: "Báo / hổ / thỏ", xa: "Rắn / mãng", chim: "Chim", trung: "Côn trùng", thiem: "Cóc / nhớt", thuc: "Thực vật",
  co: "Cỏ", dat: "Đất", da: "Đá", tuyet: "Tuyết", nuoc: "Nước nông",
};
const label = (key: string) => NAME[key] ?? key;
const ch = (c: AudioChannel) => ({ sfx: "Hiệu ứng", ui: "Giao diện", ambient: "Môi trường" })[c];

interface Row { title: string; group: string; channel: AudioChannel; note?: string; }

function sections(): { title: string; hint: string; rows: Row[] }[] {
  const skill = ELEMENTS.flatMap((e) => SKILL_PHASES.map((p) => ({ title: `${label(e)} · ${label(p)}`, group: `skill-${e}-${p}`, channel: "sfx" as AudioChannel })));
  return [
    { title: "Vung vũ khí", hint: "5 loại × 3 biến thể, kênh Hiệu ứng", rows: WEAPONS.map((w) => ({ title: label(w), group: `swing-${w}`, channel: "sfx" })) },
    { title: "Va chạm theo chất liệu", hint: "đánh trúng thịt, giáp / vỏ, băng, gỗ / cây", rows: MATERIALS.map((m) => ({ title: label(m), group: `hit-${m}`, channel: "sfx" })) },
    { title: "Kỹ năng theo hệ", hint: "8 hệ × bắt đầu / bay / nổ (tiếng thật gắn theo lưu phái của võ hồn)", rows: skill },
    { title: "Hồn hoàn", hint: "sáng (đổi cao độ, vang theo niên hạn ở nút bên dưới), hấp thụ, rơi", rows: [
      { title: "Sáng", group: "ring-glow", channel: "sfx" }, { title: "Hấp thụ", group: "ring-absorb", channel: "sfx" }, { title: "Rơi", group: "ring-drop", channel: "sfx" }] },
    { title: "Tiếng thú theo họ", hint: "8 họ × 2–3, cộng gầm boss và thú chết", rows: [
      ...BEAST_FAMILIES.map((f) => ({ title: label(f), group: `beast-${f}`, channel: "sfx" as AudioChannel })),
      { title: "Boss gầm", group: "beast-boss", channel: "sfx", note: "hạ nhạc nền" }, { title: "Thú chết", group: "beast-die", channel: "sfx" }] },
    { title: "Bước chân theo địa hình", hint: "kênh Môi trường", rows: SURFACES.map((s) => ({ title: label(s), group: `step-${s}`, channel: "ambient" as AudioChannel })) },
  ];
}

export function audioTestScreen(card: HTMLElement, overlay: HTMLElement): void {
  overlay.hidden = false; card.classList.add("wide", "audiotest");
  const context = sharedAudioContext();
  const pos = { x: 0, y: 0 };
  const audio = new AudioManager({ sound: { context, setMute() {}, setVolume() {} } }, () => pos);
  const settings = audio.getSettings();
  card.innerHTML = `<style>
    .audiotest h2{margin:14px 0 2px;font-size:15px}.audiotest small{color:#9aa}.audiotest .at-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:3px 0}
    .audiotest .at-row>b{min-width:150px}.audiotest button{cursor:pointer}.audiotest .at-mix label{display:flex;gap:8px;align-items:center;margin:2px 0}
    .audiotest .at-mix input{flex:1}.audiotest .at-src{font-size:11px;line-height:1.5}.audiotest .at-dur{color:#889;font-size:11px}
  </style>
  <h1>Nghe thử âm thanh</h1>
  <p>Mọi tiếng đều từ thư viện CC0 (Kenney, OpenGameArt), không có tiếng hô. Bấm một nút trước để trình duyệt cho phép phát. Kênh trộn: Tổng, Nhạc, Hiệu ứng, Giao diện, Môi trường.</p>
  <div class="at-mix" id="atMix"></div>
  <h2>Thử trộn</h2>
  <div class="at-row"><button type="button" id="atMusic">Bật / tắt nhạc nền thử</button><button type="button" id="atBoss">Boss gầm (nhạc tự hạ)</button>
    <button type="button" id="atCrowd">Chồng 40 tiếng ở xa gần khác nhau</button><small id="atVoices"></small></div>
  <div class="at-row"><b>Hồn hoàn sáng theo niên hạn</b>${TIERS.map((t, i) => `<button type="button" data-tier="${i}" style="border-color:${t.glow}">${t.age}</button>`).join("")}</div>
  <div id="atList"></div>
  <h2>Giao diện (tiếng tổng hợp)</h2><div class="at-row" id="atUi"></div>
  <h2>Nguồn và giấy phép</h2><div class="at-src" id="atSrc">Đang tải…</div>`;
  const $ = <T extends HTMLElement>(id: string) => card.querySelector<T>(`#${id}`)!;

  const mix = $("atMix");
  mix.innerHTML = ([["master", "Tổng"], ["music", "Nhạc"], ["sfx", "Hiệu ứng"], ["ui", "Giao diện"], ["ambient", "Môi trường"]] as const).map(([k, name]) =>
    `<label><span style="min-width:90px">${name}</span><input type="range" min="0" max="1" step="0.05" data-k="${k}" value="${settings[k]}"><output></output></label>`).join("");
  mix.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
    const out = input.nextElementSibling as HTMLOutputElement, show = () => { out.value = `${Math.round(Number(input.value) * 100)}%`; };
    show();
    input.addEventListener("input", () => { audio.updateSettings({ [input.dataset.k!]: Number(input.value) }); show(); });
  });

  const unlock = () => audio.unlock();
  card.addEventListener("pointerdown", unlock, { once: true });
  card.addEventListener("keydown", unlock, { once: true });
  const ensureAll = async () => { await audio.bank?.loadManifest(); await Promise.all(["combat", "skill", "beast", "world", "steps"].map((p) => audio.bank?.ensure(p))); };
  const voices = () => { $("atVoices").textContent = `đang phát ${audio.activeVoices} tiếng`; };
  const timer = setInterval(voices, 250);
  addEventListener("pagehide", () => clearInterval(timer), { once: true });

  void ensureAll().then(() => {
    const clips = audio.bank?.clips() ?? [];
    const byGroup = new Map<string, SfxClip[]>();
    for (const c of clips) (byGroup.get(c.group) ?? byGroup.set(c.group, []).get(c.group)!).push(c);
    $("atList").innerHTML = sections().map((s) => `<h2>${s.title}</h2><small>${s.hint}</small>${s.rows.map((r) => {
      const list = byGroup.get(r.group) ?? [];
      return `<div class="at-row"><b>${r.title}</b><button type="button" data-group="${r.group}" data-ch="${r.channel}">Ngẫu nhiên</button>${
        list.map((c, i) => `<button type="button" data-clip="${c.id}" data-ch="${r.channel}">${i + 1}</button>`).join("")
      }<span class="at-dur">${list.map((c) => `${c.duration.toFixed(2)}s`).join(" · ")} · kênh ${ch(r.channel)}${r.note ? ` · ${r.note}` : ""}</span></div>`;
    }).join("")}`).join("");
    $("atSrc").innerHTML = (audio.bank?.sources() ?? []).map((s) => `${s.title}, ${s.author} (${s.license}): <a href="${s.url}" target="_blank" rel="noopener">${s.url}</a>`).join("<br>");
  });

  card.addEventListener("click", (event) => {
    const el = (event.target as HTMLElement).closest("button");
    if (!el) return;
    void audio.unlock().then(() => {
      const channel = (el.dataset.ch as AudioChannel | undefined) ?? "sfx";
      if (el.dataset.clip) audio.playClip(el.dataset.clip, { channel, ...(el.dataset.clip.startsWith("beast-boss") ? { duck: LOUD_DUCK.depth, duckMs: LOUD_DUCK.ms } : {}) });
      else if (el.dataset.group === "beast-boss") audio.playBeast("boss", null);
      else if (el.dataset.group) audio.playGroup(el.dataset.group, null, { channel });
      else if (el.dataset.tier) audio.playRingGlow(Number(el.dataset.tier));
      else if (el.dataset.sfx) audio.play(el.dataset.sfx as (typeof SFX_IDS)[number]);
      voices();
    });
  });

  $("atUi").innerHTML = SFX_IDS.filter((id) => id.startsWith("ui_")).map((id) => `<button type="button" data-sfx="${id}">${id.slice(3)}</button>`).join("");
  let musicOn = false;
  $("atMusic").addEventListener("click", () => { musicOn = !musicOn; audio.music?.setMap(musicOn ? "thien_dau_thanh" : null); });
  $("atBoss").addEventListener("click", () => { void audio.unlock().then(() => audio.playBeast("boss", null)); });
  $("atCrowd").addEventListener("click", () => {
    void audio.unlock().then(() => {
      const groups = [...(audio.bank?.clips() ?? []).map((c) => c.group)].filter((g) => !g.startsWith("step-"));
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2, d = Math.random() * 300;
        setTimeout(() => audio.playGroup(groups[Math.floor(Math.random() * groups.length)], { x: Math.cos(a) * d, y: Math.sin(a) * d }), i * 40);
      }
    });
  });
}
