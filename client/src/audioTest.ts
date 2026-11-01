// Trang nghe thử âm thanh (G2, #393; mở bằng `?thu=am`, không cần đăng nhập): mọi tiếng mẫu CC0 theo nhóm, từng biến thể, kênh trộn,
// hồn hoàn theo niên hạn, gầm boss hạ nhạc, chồng nhiều tiếng để nghe giới hạn số tiếng. Chỉ để chủ repo nghe; không đổi luật chơi.
import { TIERS } from "../../shared/data.ts";
import { AudioManager, LOUD_DUCK, type AudioChannel } from "./audio/AudioManager.ts";
import { sharedAudioContext } from "./audio/music.ts";
import { SFX_IDS } from "./audio/sfxData.ts";
import type { SfxClip } from "./audio/sfxBank.ts";
import { BEAST_FAMILIES, ELEMENTS, MATERIALS, SKILL_PHASES, SURFACES, UI_GROUP, WEAPONS, type UiSound } from "./audio/soundMap.ts";
import { AMBIENT_PROFILES } from "./audio/ambientLayers.ts";
import { MAPS } from "../../shared/data.ts";

const NAME: Record<string, string> = {
  kiem: "Kiếm", chuy: "Chùy", thuong: "Thương / trượng / hái", trao: "Trảo", quyen: "Quyền", cung: "Cung", day: "Dây / xích", quat: "Quạt",
  thit: "Thịt", giap: "Giáp / vỏ cứng", bang: "Băng", go: "Gỗ / cây", linh_the: "Linh thể",
  fire: "Lửa", ice: "Băng", lightning: "Sét", poison: "Độc", light: "Quang", dark: "Ám", wood: "Mộc", wind: "Phong",
  start: "bắt đầu", fly: "bay", boom: "nổ",
  lang: "Sói", hung: "Gấu / tê / giáp", bao: "Báo / hổ / thỏ", xa: "Rắn / mãng", chim: "Chim", trung: "Côn trùng", thiem: "Cóc / nhớt", thuc: "Thực vật", bien: "Hồn thú biển",
  co: "Cỏ", dat: "Đất", da: "Đá", tuyet: "Tuyết", nuoc: "Nước nông",
  open: "Mở panel", close: "Đóng panel", drag: "Nhấc đồ (kéo)", drop: "Thả đồ", equip: "Trang bị", enhanceOk: "Cường hóa thành công", enhanceFail: "Cường hóa chưa thành", rare: "Nhận đồ hiếm", click: "Bấm nút trong bảng", error: "Lỗi / bị từ chối", reward: "Nhận thưởng", notify: "Thông báo (toast)",
  wave: "Sóng", bird: "Chim (ngày)", cricket: "Côn trùng (đêm)", bell: "Chuông chùa",
};
const label = (key: string) => NAME[key] ?? key;
const ch = (c: AudioChannel) => ({ sfx: "Hiệu ứng", ui: "Giao diện", ambient: "Môi trường" })[c];

interface Row { title: string; group: string; channel: AudioChannel; note?: string; }

function sections(): { title: string; hint: string; rows: Row[] }[] {
  const skill = ELEMENTS.flatMap((e) => SKILL_PHASES.map((p) => ({ title: `${label(e)} · ${label(p)}`, group: `skill-${e}-${p}`, channel: "sfx" as AudioChannel })));
  return [
    { title: "Vung vũ khí", hint: "8 loại × 3 biến thể, kênh Hiệu ứng", rows: WEAPONS.map((w) => ({ title: label(w), group: `swing-${w}`, channel: "sfx" })) },
    { title: "Va chạm theo chất liệu", hint: "đánh trúng thịt, giáp / vỏ, băng, gỗ / cây, đá, linh thể", rows: MATERIALS.map((m) => ({ title: label(m), group: `hit-${m}`, channel: "sfx" })) },
    { title: "Kỹ năng theo hệ", hint: "8 hệ × bắt đầu / bay / nổ (tiếng thật gắn theo lưu phái của võ hồn)", rows: skill },
    { title: "Hồn hoàn", hint: "sáng (đổi cao độ, vang theo niên hạn ở nút bên dưới), hấp thụ, rơi", rows: [
      { title: "Sáng", group: "ring-glow", channel: "sfx" }, { title: "Hấp thụ", group: "ring-absorb", channel: "sfx" }, { title: "Rơi", group: "ring-drop", channel: "sfx" }] },
    { title: "Tiếng thú theo họ", hint: "9 họ × 2–3, cộng gầm boss và thú chết", rows: [
      ...BEAST_FAMILIES.map((f) => ({ title: label(f), group: `beast-${f}`, channel: "sfx" as AudioChannel })),
      { title: "Boss gầm", group: "beast-boss", channel: "sfx", note: "hạ nhạc nền" }, { title: "Thú chết", group: "beast-die", channel: "sfx" }] },
    { title: "Bước chân theo địa hình", hint: "kênh Môi trường", rows: SURFACES.map((s) => ({ title: label(s), group: `step-${s}`, channel: "ambient" as AudioChannel })) },
    { title: "Giao diện (lô 2)", hint: "tự phát khi mở / đóng panel, kéo thả, trang bị, cường hóa, nhận đồ hiếm; kênh Giao diện",
      rows: (Object.keys(UI_GROUP) as UiSound[]).map((k) => ({ title: label(k), group: UI_GROUP[k], channel: "ui" as AudioChannel })) },
    { title: "Môi trường lớp chồng (lô 2)", hint: "phát ngẫu nhiên theo bản đồ và ngày đêm (nút chạy thử ở trên); kênh Môi trường",
      rows: (["wind", "wave", "bird", "cricket", "fire", "bell", "fountain"] as const).map((k) => ({ title: ({ wind: "Gió", fire: "Lửa trại", fountain: "Đài phun nước" } as Record<string, string>)[k] ?? label(k), group: `amb-${k}`, channel: "ambient" as AudioChannel })) },
    { title: "PK (lô 2): chỉ tiếng + hàm phát, G6 (#397) gọi", hint: "audio.playPkOpen / playPkCountdown(n) / playPkKill(nguồn) / updateLowHpHeartbeat(tỉ lệ máu)",
      rows: [{ title: "Trống mở trận", group: "pk-open", channel: "ui" }, { title: "Đếm ngược (mõ)", group: "pk-count", channel: "ui" }, { title: "Vào trận (chuông / chiêng)", group: "pk-go", channel: "ui" },
        { title: "Kết liễu", group: "pk-kill", channel: "sfx" }, { title: "Nhịp tim máu thấp (1 chậm, 2 nhanh)", group: "pk-heartbeat", channel: "sfx" }] },
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
  <div class="at-row"><button type="button" id="atBoss">Boss gầm (nhạc tự hạ)</button>
    <button type="button" id="atCrowd">Chồng 40 tiếng ở xa gần khác nhau</button><small id="atVoices"></small>
    <label><input type="checkbox" id="atMixOn" checked> Trộn G8 (cân âm lượng nhóm, trần chồng theo loại, nén, hạ nền khi đông); bỏ chọn = nghe bản trước G8</label></div>
  <h2>Nhạc động</h2>
  <div class="at-row"><b>Bản đồ</b><select id="atMap">${Object.values(MAPS).map((m) => `<option value="${m.id}">${m.name}</option>`).join("")}</select>
    <button type="button" id="atMusic">Bật / tắt nhạc</button><small id="atMusicState"></small></div>
  <div class="at-row"><b>Giao chiến</b><button type="button" id="atCombat">Vào giao chiến (giữ 8 s sau lần bấm cuối)</button>
    <button type="button" id="atBattle">Boss: nhạc giao chiến</button><button type="button" id="atPhase">Boss pha 2 (nổi giận)</button><button type="button" id="atPhaseOff">Hết boss</button></div>
  <div class="at-row"><b>Stinger</b><button type="button" data-jingle="crit_big">Chí mạng lớn</button><button type="button" data-jingle="boss_down">Hạ boss</button><button type="button" data-jingle="level_up">Lên cấp</button>
    <button type="button" data-jingle="ring_absorb">Hấp thụ hồn hoàn</button><button type="button" data-jingle="arena_win">Thắng</button><button type="button" data-jingle="arena_lose">Thua</button></div>
  <h2>Môi trường tự động</h2>
  <div class="at-row"><button type="button" id="atAmbient">Chạy / dừng môi trường của bản đồ đang chọn</button>
    <label><input type="radio" name="atDn" value="0" checked> ngày</label><label><input type="radio" name="atDn" value="1"> đêm</label><label><input type="checkbox" id="atFire"> đứng cạnh lửa</label></div>
  <h2>PK (hàm phát cho G6)</h2>
  <div class="at-row"><button type="button" id="atPkOpen">playPkOpen()</button><button type="button" data-pkn="3">Đếm 3</button><button type="button" data-pkn="2">Đếm 2</button><button type="button" data-pkn="1">Đếm 1</button>
    <button type="button" data-pkn="0">Vào trận (0)</button><button type="button" id="atPkKill">playPkKill()</button>
    <button type="button" id="atHp25">Nhịp tim: máu 25%</button><button type="button" id="atHp08">máu 8%</button><button type="button" id="atHpOff">hết nhịp tim</button></div>
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
  const ensureAll = async () => { await audio.bank?.loadManifest(); await Promise.all(["combat", "skill", "beast", "world", "steps", "amb", "amb-nuoc", "ui", "pk"].map((p) => audio.bank?.ensure(p))); };
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
  let musicOn = false, hp = 0, ambient = false;
  const mapSel = $<HTMLSelectElement>("atMap"), music = audio.music;
  const musicState = () => {
    const st = music?.status();
    $("atMusicState").textContent = st ? `đang phát: ${st.playing ?? "(im)"} · lớp giao chiến: ${st.stem ?? "chưa có"} · ${st.combat ? "GIAO CHIẾN" : "thám hiểm"} · pha boss ${st.bossPhase}` : "không có WebAudio";
  };
  const tickTimer = setInterval(() => {
    music?.tick(); musicState();
    if (hp > 0) audio.updateLowHpHeartbeat(hp);
    if (ambient) audio.updateAmbient(performance.now(), { mapId: mapSel.value, night: Number(card.querySelector<HTMLInputElement>("input[name=atDn]:checked")?.value ?? 0), fireDist: $<HTMLInputElement>("atFire").checked ? 30 : null });
  }, 200);
  addEventListener("pagehide", () => clearInterval(tickTimer), { once: true });
  const withAudio = (fn: () => void) => () => { void audio.unlock().then(fn); };
  $("atMusic").addEventListener("click", withAudio(() => { musicOn = !musicOn; music?.setMap(musicOn ? mapSel.value : null); }));
  mapSel.addEventListener("change", () => { if (musicOn) music?.setMap(mapSel.value); });
  $("atCombat").addEventListener("click", withAudio(() => music?.combatPulse()));
  $("atBattle").addEventListener("click", withAudio(() => music?.setBattle(true)));
  $("atPhase").addEventListener("click", withAudio(() => { music?.setBattle(true); music?.setBossPhase(2); }));
  $("atPhaseOff").addEventListener("click", withAudio(() => { music?.setBossPhase(0); music?.setBattle(false); }));
  card.querySelectorAll<HTMLButtonElement>("button[data-jingle]").forEach((b) => b.addEventListener("click", withAudio(() => music?.jingle(b.dataset.jingle as "level_up"))));
  $("atAmbient").addEventListener("click", withAudio(() => {
    ambient = !ambient;
    $("atAmbient").textContent = ambient ? `Đang chạy (${Object.keys(AMBIENT_PROFILES[mapSel.value] ?? {}).join(", ") || "bản đồ này không có"}), bấm để dừng` : "Chạy / dừng môi trường của bản đồ đang chọn";
  }));
  $("atPkOpen").addEventListener("click", withAudio(() => audio.playPkOpen()));
  card.querySelectorAll<HTMLButtonElement>("button[data-pkn]").forEach((b) => b.addEventListener("click", withAudio(() => audio.playPkCountdown(Number(b.dataset.pkn)))));
  $("atPkKill").addEventListener("click", withAudio(() => audio.playPkKill()));
  $("atHp25").addEventListener("click", withAudio(() => { hp = 0.25; }));
  $("atHp08").addEventListener("click", withAudio(() => { hp = 0.08; }));
  $("atHpOff").addEventListener("click", () => { hp = 0; audio.updateLowHpHeartbeat(1); });
  $<HTMLInputElement>("atMixOn").addEventListener("change", (e) => audio.setMixEnabled((e.target as HTMLInputElement).checked));
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
