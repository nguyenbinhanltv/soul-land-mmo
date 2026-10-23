import assert from "node:assert/strict";
import { AUDIO_MAX_ACTIVE, AudioManager, resolveAudioSource, SFX_REPEAT_WINDOW_MS } from "../src/audio/AudioManager.ts";
import { DEFAULT_AUDIO_SETTINGS, normalizeAudioSettings } from "../src/audio/settings.ts";
import { panFromProjection, spatialMix } from "../src/audio/spatial.ts";
import { SFX_IDS, SFX_PARAMS } from "../src/audio/sfxData.ts";
import { createZzFxBuffer } from "../src/audio/zzfx.ts";

const settings = normalizeAudioSettings({ master: 2, music: -1, sfx: "bad", muted: 1 });
assert.deepEqual(settings, { master: 1, music: 0, sfx: DEFAULT_AUDIO_SETTINGS.sfx, ui: DEFAULT_AUDIO_SETTINGS.ui, ambient: DEFAULT_AUDIO_SETTINGS.ambient, muted: true });
assert.deepEqual(normalizeAudioSettings({ ui: 0.25, ambient: 5 }), { ...DEFAULT_AUDIO_SETTINGS, ui: 0.25, ambient: 1 }, "kênh Giao diện / Môi trường chuẩn hóa như các kênh khác");
assert.deepEqual(normalizeAudioSettings(null), DEFAULT_AUDIO_SETTINGS);
assert.deepEqual(normalizeAudioSettings({ master: Number.NaN }), DEFAULT_AUDIO_SETTINGS);

assert.deepEqual(spatialMix({ x: 100, y: 100 }, { x: 100, y: 100 }), { volume: 1, pan: 0 });
assert.deepEqual(spatialMix({ x: 260, y: 100 }, { x: 100, y: 100 }), { volume: 0.8, pan: 0.5 });
assert.equal(spatialMix({ x: 100, y: 260 }, { x: 100, y: 100 }).pan, -0.5);
assert.equal(spatialMix({ x: 260, y: 260 }, { x: 100, y: 100 }).pan, 0);
assert.equal(spatialMix({ x: 421, y: 100 }, { x: 100, y: 100 }), null);
assert.equal(spatialMix({ x: -220, y: 100 }, { x: 100, y: 100 }).pan, -1);
assert.equal(panFromProjection({ x: 100, y: 260 }, { x: 100, y: 100 }, 320, (x) => 2 * x), 0, "topdown: chênh y không làm lệch pan");
assert.equal(panFromProjection({ x: 260, y: 100 }, { x: 100, y: 100 }, 320, (x) => 2 * x), 0.5, "topdown: chênh x lệch sang phải");

const sawSamples = [];
createZzFxBuffer({
  sampleRate: 16_000,
  createBuffer(_channels, length, sampleRate) {
    return {
      copyToChannel(data) { sawSamples.push({ data: [...data], length, sampleRate }); },
    };
  },
}, { frequency: 160, duration: 0.3, attack: 0.001, release: 0.001, slide: 0, noise: 0, shape: "sawtooth", volume: 1 });
assert.ok(sawSamples[0].data[120] > 0, "sawtooth có nửa chu kỳ dương");
assert.ok(sawSamples[0].data[170] < 0, "sawtooth có nửa chu kỳ âm");

const state = {
  players: new Map([["actor", { x: 260, y: 100 }]]),
  beasts: new Map([["beast", { x: 340, y: 100 }]]),
};
const resolveFromState = (message) => {
  const entity = message.id ? state.players.get(message.id) : message.bid ? state.beasts.get(message.bid) : undefined;
  return entity && Number.isFinite(entity.x) && Number.isFinite(entity.y) ? { x: entity.x, y: entity.y } : null;
};
const listener = { x: 100, y: 100 };
const actorSource = resolveAudioSource({ k: "slash", id: "actor" }, resolveFromState);
assert.deepEqual(actorSource, { x: 260, y: 100 }, "fx thiếu x,y lấy vị trí người phát từ state");
assert.ok(Math.abs(spatialMix(actorSource, listener).volume - 0.8) < 1e-9, "nguồn gần vẫn nghe theo spatial mix");
const beastSource = resolveAudioSource({ k: "roar", bid: "beast" }, resolveFromState);
assert.ok(Math.abs(spatialMix(beastSource, listener).volume - 0.55) < 1e-9, "nguồn xa trong tầm bị giảm âm lượng");
assert.equal(spatialMix({ x: 500, y: 100 }, listener), null, "nguồn ngoài tầm không phát");
assert.equal(resolveAudioSource({ k: "slash", id: "gone" }, resolveFromState), null, "không có vị trí thì không phát fx gameplay toàn cục");

assert.equal(SFX_IDS.length, 40);
assert.equal(new Set(SFX_IDS).size, SFX_IDS.length);
for (const id of SFX_IDS) assert.ok(SFX_PARAMS[id], `thiếu tham số SFX: ${id}`);
assert.ok(SFX_IDS.includes("skill_fire"));
assert.ok(SFX_IDS.includes("ring_absorb_success"));

const gains = [];
const sources = [];
const buffers = [];
const context = {
  state: "running",
  sampleRate: 44_100,
  destination: { kind: "context-destination" },
  createGain() {
    const gain = {
      value: 0,
      setValueAtTime(value) { this.value = value; },
      linearRampToValueAtTime(value) { this.value = value; },
      cancelScheduledValues() {},
    };
    const node = { gain, connections: [], connect(target) { this.connections.push(target); }, disconnect() {} };
    gains.push(node);
    return node;
  },
  createBuffer(_channels, length, sampleRate) {
    const buffer = { length, sampleRate, copyToChannel() {} };
    buffers.push(buffer);
    return buffer;
  },
  createBufferSource() {
    const node = { buffer: null, connections: [], connect(target) { this.connections.push(target); }, addEventListener() {}, start() {} };
    sources.push(node);
    return node;
  },
  createStereoPanner() {
    return { pan: { value: 0 }, connect() {} };
  },
  resume() { this.state = "running"; return Promise.resolve(); },
};
const host = {
  context,
  muted: false,
  volume: 0,
  setMute(value) { this.muted = value; },
  setVolume(value) { this.volume = value; },
};
const audio = new AudioManager({ sound: host }, () => ({ x: 100, y: 100 }));
assert.equal(host.volume, DEFAULT_AUDIO_SETTINGS.master * DEFAULT_AUDIO_SETTINGS.music);
assert.equal(gains[0].gain.value, DEFAULT_AUDIO_SETTINGS.master * DEFAULT_AUDIO_SETTINGS.sfx);
assert.deepEqual(gains[0].connections, [context.destination]);
audio.updateSettings({ music: 0, sfx: 0.5 });
assert.equal(host.volume, 0, "tắt Nhạc chỉ tắt bus nhạc");
assert.equal(gains[0].gain.value, DEFAULT_AUDIO_SETTINGS.master * 0.5, "SFX vẫn theo Tổng và Hiệu ứng");
assert.equal(gains[1].gain.value, DEFAULT_AUDIO_SETTINGS.master * DEFAULT_AUDIO_SETTINGS.ui, "kênh Giao diện có bus riêng");
assert.equal(gains[2].gain.value, DEFAULT_AUDIO_SETTINGS.master * DEFAULT_AUDIO_SETTINGS.ambient, "kênh Môi trường có bus riêng");
audio.updateSettings({ master: 0.5, music: 1, sfx: 1 });
assert.equal(host.volume, 0.5, "bus nhạc chỉ nhận Tổng x Nhạc");
assert.equal(gains[0].gain.value, 0.5, "bus SFX chỉ nhận Tổng x Hiệu ứng");

audio.play("combat_hit", { x: 100, y: 100 });
assert.equal(sources.length, 1, "context đang chạy thì phát được dù chưa cần unlock riêng");
assert.equal(buffers.length, 1, "SFX được tạo buffer lần đầu");
audio.play("combat_hit", { x: 100, y: 100 });
assert.equal(sources.length, 1, `chặn SFX trùng trong ${SFX_REPEAT_WINDOW_MS}ms`);
assert.equal(buffers.length, 1, "dùng lại buffer đã cache");
context.state = "suspended";
audio.play("combat_crit", { x: 100, y: 100 });
assert.equal(sources.length, 1, "context treo thì không tạo node mới");
context.state = "running";
for (const id of SFX_IDS) audio.play(id, { x: 100, y: 100 });
assert.equal(audio.activeVoices, AUDIO_MAX_ACTIVE, "giới hạn số tiếng đồng thời (tiếng ưu tiên cao chen được, không vượt trần)");
audio.dispose();

const noListenerContext = { ...context, state: "running", createBufferSource() {
  const node = { connect() {}, addEventListener() {}, start() {} };
  sources.push(node);
  return node;
} };
const noListenerAudio = new AudioManager({ sound: { ...host, context: noListenerContext } }, () => null);
noListenerAudio.play("combat_hit", { x: 100, y: 100 });
assert.equal(noListenerAudio.activeVoices, 0, "SFX có nguồn nhưng chưa có listener thì bỏ qua");
noListenerAudio.dispose();

// ---------- G2 (#393): tiếng mẫu CC0, kênh trộn, ánh xạ sự kiện ----------
{
  const { BEASTS, VOHON } = await import("../../shared/data.ts");
  const map = await import("../src/audio/soundMap.ts");
  const { packOfGroup } = await import("../src/audio/sfxBank.ts");
  const { readFileSync } = await import("node:fs");
  const tiles = JSON.parse(readFileSync(new URL("../../shared/assets/iso/tiles.json", import.meta.url), "utf8"));
  const real = JSON.parse(readFileSync(new URL("../../shared/assets/audio/sfx/manifest.json", import.meta.url), "utf8"));

  // ánh xạ vũ khí / hệ / họ thú / bề mặt: mọi võ hồn, loài, ô nền đều có kết quả hợp lệ
  for (const v of VOHON) {
    assert.ok(map.WEAPONS.includes(map.weaponOf(v.id)), `vũ khí ${v.id}`);
    assert.ok(map.ELEMENTS.includes(map.elementOf(v)), `hệ ${v.id}`);
  }
  assert.equal(map.weaponOf("cuu_tinh_that_sat_kiem"), "kiem");
  assert.equal(map.weaponOf("khong_co_that"), "quyen");
  assert.equal(map.elementOf(VOHON.find((v) => v.id === "hoa_long")), "fire");
  assert.equal(map.elementOf(VOHON.find((v) => v.id === "bang_phuong_hoang")), "ice");
  assert.equal(map.elementOf(VOHON.find((v) => v.id === "lam_dien_ba_vuong_long")), "lightning");
  const families = new Set();
  for (const b of BEASTS) families.add(map.beastFamilyOf(b.id));
  for (const f of map.BEAST_FAMILIES) assert.ok(families.has(f), `không loài nào thuộc họ ${f}`);
  assert.equal(map.beastFamilyOf("phong_lang"), "lang");
  assert.equal(map.beastFamilyOf("man_da_la_xa"), "xa");
  assert.equal(map.beastFamilyOf("doc_cham_phong"), "trung");
  assert.equal(map.beastFamilyOf("kim_linh_ung"), "chim");
  assert.equal(map.beastFamilyOf("bang_phong_bach_hung"), "hung", "bạch hùng không bị nhận nhầm là côn trùng vì chứa từ phong");
  assert.equal(map.materialOfBeast("tuyet_lang"), "bang");
  assert.equal(map.materialOfBeast("quy_dang"), "go");
  assert.equal(map.materialOfBeast("thiet_giap_te_nguu"), "giap");
  assert.equal(map.materialOfBeast("phong_lang"), "thit");
  const surfaces = new Map();
  for (const name of Object.keys(tiles.ground)) {
    const s = map.surfaceOfGround(name);
    assert.ok(map.SURFACES.includes(s), `bề mặt ${name}`);
    surfaces.set(s, (surfaces.get(s) ?? 0) + 1);
  }
  for (const s of map.SURFACES) assert.ok(surfaces.get(s) > 0, `không ô nền nào dùng bề mặt ${s}`);
  assert.equal(map.surfaceOfGround("tuyet"), "tuyet");
  assert.equal(map.surfaceOfGround("nuoc_nong"), "nuoc");
  assert.equal(map.surfaceOfGround(""), "dat");
  const g0 = map.ringGlowMix(0), g4 = map.ringGlowMix(4);
  assert.ok(g4.rate < g0.rate && g4.wet > g0.wet && g4.gain > g0.gain, "niên hạn cao: trầm hơn, vang hơn, to hơn");

  // mọi nhóm tiếng mà game có thể gọi đều có mẫu trong manifest thật, và nằm đúng gói
  const have = new Map();
  for (const c of real.clips) have.set(c.group, (have.get(c.group) ?? 0) + 1);
  const wanted = [
    ...map.WEAPONS.map((w) => `swing-${w}`), ...map.MATERIALS.map((m) => `hit-${m}`), ...map.SURFACES.map((s) => `step-${s}`),
    ...map.ELEMENTS.flatMap((e) => map.SKILL_PHASES.map((p) => `skill-${e}-${p}`)), ...map.BEAST_FAMILIES.map((f) => `beast-${f}`),
    "beast-boss", "beast-die", "ring-glow", "ring-absorb", "ring-drop",
  ];
  for (const g of wanted) { assert.ok(have.get(g) >= 1, `thiếu mẫu cho nhóm ${g}`); assert.equal(real.packs[packOfGroup(g)] !== undefined, true, `nhóm ${g} không có gói`); }
  assert.ok(real.clips.length >= 100, "đủ ~60 tiếng (nhóm) với nhiều biến thể");

  // kho + trộn với WebAudio giả
  const manifest = { packs: { combat: { files: { ogg: { path: "sfx/combat.ogg" } } } }, clips: [] };
  for (let i = 0; i < 20; i++) for (let j = 0; j < 2; j++) manifest.clips.push({ id: `swing-t${i}-${j}`, group: `swing-t${i}`, pack: "combat", start: i * 2 + j, duration: 0.3 });
  const loads = [];
  const load = async (url) => { loads.push(url); return url.endsWith("manifest.json") ? new TextEncoder().encode(JSON.stringify(manifest)).buffer : new ArrayBuffer(8); };
  const make = (random = () => 0.5) => {
    const started = [], nodes = [], gainNodes = [];
    const ctx = {
      state: "running", sampleRate: 44_100, destination: { kind: "dest" },
      createGain() { const n = { gain: { value: 0, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { this.value = v; }, cancelScheduledValues() {} }, connections: [], connect(t) { this.connections.push(t); }, disconnect() { this.cut = true; } }; gainNodes.push(n); return n; },
      createBuffer(_c, length, rate) { return { length, sampleRate: rate, duration: length / rate, getChannelData: () => new Float32Array(length) }; },
      createBufferSource() { const n = { buffer: null, playbackRate: { value: 1 }, stopped: false, connect() {}, disconnect() {}, addEventListener() {}, start(...a) { this.args = a; started.push(this); }, stop() { this.stopped = true; } }; nodes.push(n); return n; },
      createStereoPanner() { return { pan: { value: 0 }, connect() {} }; },
      createConvolver() { return { buffer: null, connect() {} }; },
      decodeAudioData() { return Promise.resolve({ duration: 60, length: 60 * 44_100, sampleRate: 44_100 }); },
      resume() { return Promise.resolve(); },
    };
    const host = { context: ctx, setMute() {}, setVolume() {} };
    const audio = new AudioManager({ sound: host }, () => ({ x: 100, y: 100 }), () => null, { bank: { load, format: "ogg", now: () => 1e9 }, random });
    return { audio, ctx, started, gainNodes };
  };

  {
    const { audio, started } = make();
    assert.equal(audio.playGroup("swing-t0", { x: 100, y: 100 }), false, "mẫu chưa tải thì báo để lùi về tiếng tổng hợp");
    await audio.bank.ensure("combat");
    assert.deepEqual(loads.filter((u) => u.includes("sfx/")), ["audio/sfx/manifest.json", "audio/sfx/combat.ogg"], "chỉ tải manifest và đúng gói cần");
    assert.equal(audio.playGroup("swing-t0", { x: 100, y: 100 }), true);
    assert.equal(started.length, 1);
    assert.ok(started[0].args[1] >= 0 && started[0].args[1] < 2, "phát đúng đoạn của clip trong sprite");
    assert.ok(Math.abs(started[0].args[2] - 0.31) < 1e-9, "đoạn phát bằng thời lượng clip");
    assert.equal(audio.playGroup("swing-t0", { x: 100, y: 100 }), true);
    assert.equal(started.length, 1, `cùng nhóm trong ${SFX_REPEAT_WINDOW_MS}ms chỉ phát một`);
    assert.equal(audio.playGroup("swing-t1", { x: 900, y: 100 }), true);
    assert.equal(started.length, 1, "ngoài tầm nghe thì không phát");
    audio.updateSettings({ muted: true });
    assert.equal(audio.playGroup("swing-t2", { x: 100, y: 100 }), true);
    assert.equal(started.length, 1, "tắt tiếng thì không phát");
    audio.updateSettings({ muted: false });
  }

  // biến thể ngẫu nhiên: cao độ ±5 %, âm lượng ±10 %
  for (const [r, rate, gain] of [[() => 0, 0.95, 0.9], [() => 1, 1.05, 1.1], [() => 0.5, 1, 1]]) {
    const { audio, started, gainNodes } = make(r);
    await audio.bank.ensure("combat");
    audio.playGroup("swing-t3", { x: 100, y: 100 });
    assert.ok(Math.abs(started[0].playbackRate.value - rate) < 1e-9, `cao độ ${rate}`);
    const voiceGain = gainNodes.at(-1).gain.value;
    assert.ok(Math.abs(voiceGain - gain) < 1e-9, `âm lượng ${gain}, được ${voiceGain}`);
  }

  // giới hạn số tiếng: gần thắng xa, xa không đuổi được gần
  {
    const { audio, started } = make();
    await audio.bank.ensure("combat");
    for (let i = 0; i < AUDIO_MAX_ACTIVE; i++) audio.playGroup(`swing-t${i}`, { x: 100 + 300, y: 100 });
    assert.equal(started.length, AUDIO_MAX_ACTIVE);
    audio.playGroup("swing-t16", { x: 100 + 305, y: 100 });
    assert.equal(started.length, AUDIO_MAX_ACTIVE, "tiếng còn xa hơn không chen được khi hết chỗ");
    audio.playGroup("swing-t17", { x: 100, y: 100 });
    assert.equal(started.length, AUDIO_MAX_ACTIVE + 1, "tiếng ở gần chen vào");
    assert.equal(started.filter((n) => n.stopped).length, 1, "đúng một tiếng xa bị cắt nhường chỗ");
  }

  // vang lấy sau âm lượng của tiếng (xa thì vang nhỏ), bị cắt thì vang cũng ngắt
  {
    const { audio, started, gainNodes } = make();
    await audio.bank.ensure("combat");
    audio.bank.pick = () => ({ buffer: {}, start: 0, duration: 1, id: "x" });
    audio.playGroup("swing-t6", { x: 100 + 250, y: 100 }, { wet: 0.5 });
    const send = gainNodes.at(-1);
    assert.equal(started.length, 1);
    assert.equal(send.gain.value, 0.5);
    assert.ok(gainNodes.some((n) => n.connections.includes(send)), "nhánh vang nối từ gain của tiếng, không nối thẳng từ nguồn");
  }

  // nhạc tự hạ khi có tiếng lớn; tiếng thường thì không
  {
    const { audio } = make();
    await audio.bank.ensure("combat");
    const ducks = [];
    audio.music.duckFor = (depth, ms) => ducks.push([depth, ms]);
    audio.playGroup("swing-t4", null);
    assert.equal(ducks.length, 0);
    audio.playGroup("swing-t5", null, { duck: 0.5, duckMs: 700 });
    assert.deepEqual(ducks, [[0.5, 700]]);
  }
}

console.log(`audio-test: ${SFX_IDS.length} SFX tổng hợp, tiếng mẫu CC0, kênh trộn, settings và spatial đều đạt`);
