import assert from "node:assert/strict";
import { AUDIO_MAX_ACTIVE, AudioManager, resolveAudioSource, SFX_REPEAT_WINDOW_MS } from "../src/audio/AudioManager.ts";
import { stopAmbientBed } from "../src/audio/ambientBed.ts";
import { DEFAULT_AUDIO_SETTINGS, normalizeAudioSettings } from "../src/audio/settings.ts";
import { panFromProjection, spatialMix } from "../src/audio/spatial.ts";
import { SFX_IDS, SFX_PARAMS } from "../src/audio/sfxData.ts";
import { CROWD_DUCK, GROUP_TRIM_DB, MASTER_COMPRESSOR, VOICE_CAP, groupTrim, groupTrimKey, voiceClassOf } from "../src/audio/soundMap.ts";
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

assert.equal(SFX_IDS.length, 35);
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
assert.equal(audio.activeVoices, VOICE_CAP.ui + VOICE_CAP.synth, "G8: tiếng tổng hợp bị chặn theo trần của từng loại (giao diện / tổng hợp), tiếng ưu tiên cao chen được");
assert.ok(audio.activeVoices <= AUDIO_MAX_ACTIVE);
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
  manifest.packs.beast = { files: { ogg: { path: "sfx/beast.ogg" } } };
  for (let i = 0; i < 8; i++) manifest.clips.push({ id: `beast-t${i}`, group: `beast-t${i}`, pack: "beast", start: i, duration: 0.3 });
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
    const audio = new AudioManager({ sound: host }, () => ({ x: 100, y: 100 }), () => null, { bank: { load, format: "ogg", now: () => 1e9 }, random, bed: { load: () => Promise.resolve(new ArrayBuffer(8)), format: "ogg", random: () => 0.5 } });
    return { audio, ctx, started, gainNodes };
  };

  {
    const { audio, started } = make();
    assert.equal(audio.playGroup("swing-t0", { x: 100, y: 100 }), false, "mẫu chưa tải thì báo để lùi về tiếng tổng hợp");
    await audio.bank.ensure("combat");
    assert.deepEqual(loads.filter((u) => u.includes("sfx/")).slice(0, 2), ["audio/sfx/manifest.json", "audio/sfx/combat.ogg"], "chỉ tải manifest và đúng gói cần");
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
    audio.setMixEnabled(false); // hành vi trước G8: chỉ trần chung 16 tiếng
    await audio.bank.ensure("combat");
    for (let i = 0; i < AUDIO_MAX_ACTIVE; i++) audio.playGroup(`swing-t${i}`, { x: 100 + 300, y: 100 });
    assert.equal(started.length, AUDIO_MAX_ACTIVE);
    audio.playGroup("swing-t16", { x: 100 + 305, y: 100 });
    assert.equal(started.length, AUDIO_MAX_ACTIVE, "tiếng còn xa hơn không chen được khi hết chỗ");
    audio.playGroup("swing-t17", { x: 100, y: 100 });
    assert.equal(started.length, AUDIO_MAX_ACTIVE + 1, "tiếng ở gần chen vào");
    assert.equal(started.filter((n) => n.stopped).length, 1, "đúng một tiếng xa bị cắt nhường chỗ");
  }

  // G8 (#399): cân âm lượng nhóm, trần chồng theo loại, nén chung, hạ nền khi đông tiếng
  {
    assert.equal(groupTrimKey("skill-fire-boom"), "skill-fire");
    assert.equal(groupTrimKey("skill-t3-ult-cuu-tinh-that-sat-kiem-fly"), "skill-t3-ult-fly");
    assert.equal(groupTrimKey("skill-t3-ct-hao-thien-chuy-start"), "skill-t3-ct-start");
    assert.equal(groupTrimKey("skill-t3-avatar-hoa-long"), "skill-t3-avatar");
    assert.equal(groupTrim("nhom-la"), 1, "nhóm không có trong bảng: giữ nguyên");
    assert.ok(Math.abs(groupTrim("swing-chuy") - 10 ** (-4 / 20)) < 1e-12, "swing-chuy -4 dB");
    // mọi nhóm của manifest thật có khóa trim đúng (trừ nhóm đã sát mục tiêu: 0 dB), mọi khóa trim đều trỏ tới nhóm có thật, trong khoảng ±9 dB
    const keys = new Set(real.clips.map((c) => groupTrimKey(c.group)));
    for (const k of Object.keys(GROUP_TRIM_DB)) { assert.ok(keys.has(k), `khóa trim thừa: ${k}`); assert.ok(Math.abs(GROUP_TRIM_DB[k]) <= 9, `trim ${k} quá ±9 dB`); }
    for (const k of keys) assert.ok(k in GROUP_TRIM_DB || ["ring-absorb", "ui-equip"].includes(k), `nhóm ${k} chưa được cân (chạy tools/audio/measure-sfx.mjs)`);
    for (const c of real.clips) assert.notEqual(voiceClassOf(c.group), "synth", `nhóm ${c.group} chưa có loại tiếng`);
    assert.equal(voiceClassOf("skill-t3-ult-hoa-long-start"), "t3");
    assert.equal(voiceClassOf("skill-ice-fly"), "skill");

    // trần theo loại: 20 nhóm vung vũ khí chỉ giữ VOICE_CAP.melee tiếng; loại khác vẫn còn chỗ
    const { audio, started } = make();
    await audio.bank.ensure("combat");
    for (let i = 0; i < 12; i++) audio.playGroup(`swing-t${i}`, { x: 100 + 100, y: 100 });
    assert.equal(audio.activeVoices, VOICE_CAP.melee, "hết trần loại thì tiếng mới cùng loại (không hơn điểm) bị bỏ");
    audio.playGroup("swing-t12", { x: 100, y: 100 });
    assert.equal(audio.activeVoices, VOICE_CAP.melee, "tiếng cùng loại ở gần hơn chen vào, cắt đúng một tiếng xa");
    assert.equal(started.filter((n) => n.stopped).length, 1);
    audio.setMixEnabled(false);
    audio.playGroup("swing-t13", { x: 100 + 100, y: 100 });
    assert.equal(audio.activeVoices, VOICE_CAP.melee + 1, "tắt trộn G8: trở lại trần chung, không trần theo loại");
    assert.ok(Object.values(VOICE_CAP).every((n) => n >= 2 && n <= AUDIO_MAX_ACTIVE));
  }

  // trim áp vào âm lượng tiếng; tắt trộn thì về 1
  for (const [on, k] of [[true, groupTrim("swing-chuy")], [false, 1]]) {
    const { audio, gainNodes } = make();
    audio.setMixEnabled(on);
    await audio.bank.ensure("combat");
    audio.bank.pick = (group) => ({ buffer: {}, start: 0, duration: 1, id: "x", group });
    audio.playGroup("swing-chuy", { x: 100, y: 100 });
    assert.ok(Math.abs(gainNodes.at(-1).gain.value - k) < 1e-9, `trim ${on ? "bật" : "tắt"}: ${k}, được ${gainNodes.at(-1).gain.value}`);
  }

  // nén chung + hạ nhạc nền / môi trường khi đông tiếng
  {
    const { audio, ctx, gainNodes } = make();
    const compressor = { threshold: { value: 0 }, knee: { value: 0 }, ratio: { value: 0 }, attack: { value: 0 }, release: { value: 0 }, connections: [], connect(t) { this.connections.push(t); }, disconnect() {} };
    ctx.createDynamicsCompressor = () => compressor;
    ctx.currentTime = 0;
    const withComp = new AudioManager({ sound: { context: ctx, setMute() {}, setVolume() {} } }, () => ({ x: 100, y: 100 }), () => null, { bank: { load, format: "ogg", now: () => 1e9 } });
    assert.equal(compressor.ratio.value, MASTER_COMPRESSOR.ratio);
    assert.equal(compressor.threshold.value, MASTER_COMPRESSOR.threshold);
    assert.deepEqual(compressor.connections, [ctx.destination], "bộ nén nối ra loa");
    assert.deepEqual(gainNodes.at(-3).connections, [compressor], "kênh Hiệu ứng đi qua bộ nén");
    withComp.setMixEnabled(false);
    assert.equal(compressor.ratio.value, 1, "tắt trộn: bộ nén thành đường thẳng");
    withComp.dispose();
  }
  {
    const { audio, gainNodes } = make();
    const ducks = [];
    Object.defineProperty(audio, "music", { value: { duckFor: (depth, ms) => ducks.push([depth, ms]) } });
    await audio.bank.ensure("combat"); await audio.bank.ensure("beast");
    const ambient = gainNodes[2].gain;
    ambient.value = 0.7; // đã đặt theo cài đặt; hạ rồi trả lại về mức này (mock ghi giá trị cuối của mỗi lệnh)
    for (let i = 0; i < 5; i++) audio.playGroup(`swing-t${i}`, { x: 100, y: 100 });
    for (let i = 0; i < CROWD_DUCK.voices - 6; i++) audio.playGroup(`beast-t${i}`, { x: 100, y: 100 });
    assert.equal(audio.activeVoices, CROWD_DUCK.voices - 1);
    assert.equal(ducks.length, 0, `dưới ${CROWD_DUCK.voices} tiếng chưa hạ nền`);
    audio.playGroup(`beast-t7`, { x: 100, y: 100 });
    assert.deepEqual(ducks, [[CROWD_DUCK.music, CROWD_DUCK.ms]], "đủ tiếng thì hạ nhạc nền một lần");
    audio.playGroup(`beast-t6`, { x: 100, y: 100 });
    assert.equal(ducks.length, 1, "không hạ dồn dập trong nửa chu kỳ hạ");
    // tiếng lớn đang hạ nhạc thì hạ đám đông không ghi đè (G8 review)
    const { audio: a2 } = make(), d2 = [];
    Object.defineProperty(a2, "music", { value: { duckFor: (depth, ms) => d2.push([depth, ms]) } });
    await a2.bank.ensure("combat"); await a2.bank.ensure("beast");
    a2.bank.pick = (group) => ({ buffer: {}, start: 0, duration: 1, id: "x", group });
    a2.playGroup("beast-t0", null, { duck: 0.55, duckMs: 800 });
    for (let i = 0; i < 5; i++) a2.playGroup(`swing-t${i}`, { x: 100, y: 100 });
    for (let i = 1; i < 6; i++) a2.playGroup(`beast-t${i}`, { x: 100, y: 100 });
    assert.deepEqual(d2, [[0.55, 800]], "đông tiếng không hạ nhạc nông lại khi lần hạ của tiếng lớn còn hạn");
    audio.setMixEnabled(false);
    audio.playGroup(`beast-t5`, { x: 100, y: 100 });
    assert.equal(ducks.length, 1, "tắt trộn G8 thì không hạ nền theo số tiếng");
  }

  {
    const { audio, ctx, gainNodes } = make();
    const cancels = [];
    gainNodes[2].gain.cancelScheduledValues = (t) => cancels.push(t);
    ctx.currentTime = 7;
    audio.updateSettings({ muted: true });
    assert.deepEqual(cancels, [7], "đổi cài đặt hủy lịch hạ môi trường còn treo");
    assert.equal(gainNodes[2].gain.value, 0, "tắt tiếng thì bus môi trường về 0");
  }

  // vang lấy sau âm lượng của tiếng (xa thì vang nhỏ), bị cắt thì vang cũng ngắt
  {
    const { audio, started, gainNodes } = make();
    await audio.bank.ensure("combat");
    audio.bank.pick = () => ({ buffer: {}, start: 0, duration: 1, id: "x", group: "step-co" });
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

  // H8 (#491): tiếng T3 riêng (C4 #579) nối đủ 25 võ hồn; đông người thì người khác bị giãn nhịp, nhỏ hơn, không hạ nhạc nền
  {
    const { t3Group, T3_OTHERS_GAP_MS, T3_OTHERS_GAIN } = map;
    for (const v of VOHON) {
      const names = [t3Group("avatar", v.id), ...["ult", "ct"].flatMap((k) => map.SKILL_PHASES.map((p) => t3Group(k, v.id, p)))];
      for (const g of names) { assert.ok(have.get(g) >= 1, `thiếu mẫu T3 ${g}`); assert.equal(packOfGroup(g), "skill", `${g} nằm gói skill`); }
    }
    assert.equal(t3Group("ult", "lam_dien_ba_vuong_long", "boom"), "skill-t3-ult-lam-dien-ba-vuong-long-boom");
    const { audio } = make();
    const calls = [];
    audio.playGroup = (g, _s, o = {}) => { calls.push([g, o]); return true; };
    const at = { x: 100, y: 100 };
    const vh = "hoa_long", info = (mine) => ({ element: "fire", vohonId: vh, mine, tier: 4 });
    audio.handleFx({ k: "avatar", id: "a", on: false, ...at }, info(true));
    assert.equal(calls.length, 0, "tan Chân Thân không tiếng");
    audio.handleFx({ k: "avatar", id: "a", on: true, ...at }, info(true));
    assert.equal(calls[0][0], t3Group("avatar", vh), "biến hình: tiếng T3 của võ hồn");
    assert.ok(calls[0][1].duck > 0, "tiếng của chính mình hạ nhạc nền");
    calls.length = 0;
    audio.handleFx({ k: "ult", id: "a", ...at }, info(true));
    audio.handleFx({ k: "burst", id: "a", ...at }, info(true));
    assert.deepEqual(calls.map((c) => c[0]), [t3Group("ult", vh, "start"), t3Group("ult", vh, "boom")], "tuyệt kỹ: pha nổ của chính chiêu đó cũng dùng T3");
    calls.length = 0;
    audio.handleFx({ k: "soulring", id: "b", ct: 1, tier: 4, ...at }, info(true));
    assert.equal(calls[0][0], t3Group("ct", vh, "start"), "hồn kỹ Chân Thân: tiếng T3 riêng");
    // Hình dạng tin đúng như server gửi (MapRoom.runSkill): wave / burst có id người tung; thiếu id thì không thể gắn T3 (lỗi cũ).
    audio.handleFx({ k: "wave", id: "b", x: 100, y: 94, r: 40, col: "#fff" }, info(true));
    assert.equal(calls.at(-1)[0], t3Group("ct", vh, "boom"), "hồn kỹ Chân Thân: pha nổ (wave) dùng T3");
    calls.length = 0;
    audio.handleFx({ k: "ult", id: "a2", ...at }, info(true));
    audio.handleFx({ k: "wave", x: 100, y: 94, r: 40, col: "#fff" }, info(true));
    assert.equal(calls.at(-1)[0], "skill-fire-boom", "wave không có id: không gắn được T3 (chặn lại lỗi cũ nếu server bỏ id)");
    calls.length = 0;
    audio.handleFx({ k: "burst", id: "c", ...at }, info(true));
    assert.equal(calls[0][0], "skill-fire-boom", "chiêu thường vẫn dùng tiếng theo hệ");
    calls.length = 0;
    const t0 = Date.now();
    audio.handleFx({ k: "avatar", id: "x", on: true, ...at }, info(false));
    audio.handleFx({ k: "ult", id: "y", ...at }, info(false));
    const t3others = calls.filter((c) => c[0].startsWith("skill-t3-"));
    assert.equal(t3others.length, Date.now() - t0 < T3_OTHERS_GAP_MS ? 1 : 2, `người khác: tối đa một tiếng T3 mỗi ${T3_OTHERS_GAP_MS} ms`);
    assert.equal(t3others[0][1].gain, T3_OTHERS_GAIN, "người khác nhỏ hơn");
    assert.equal(t3others[0][1].duck, undefined, "người khác không hạ nhạc nền");
    audio.dispose();
  }

  // Lô 2 (G5, #396): mọi nhóm giao diện / PK / môi trường có mẫu trong manifest thật và nằm đúng gói; hàm phát gọi đúng nhóm, đúng kênh.
  {
    const { UI_GROUP, heartbeatInterval, HEARTBEAT_MS, LOW_HP_RATIO, RARE_LOOT_MIN } = map;
    assert.ok(RARE_LOOT_MIN >= 2 && RARE_LOOT_MIN <= 4, "đồ hiếm tính từ bậc giữa trở lên");
    const amb = await import("../src/audio/ambientLayers.ts");
    const groups = [...Object.values(UI_GROUP), "pk-open", "pk-count", "pk-go", "pk-kill", "pk-heartbeat", ...["wind", "wave", "bird", "cricket", "fire", "bell"].map((k) => `amb-${k}`)];
    for (const g of groups) { assert.ok(have.get(g) >= 1, `thiếu mẫu cho nhóm ${g}`); assert.ok(real.packs[packOfGroup(g)], `nhóm ${g} không có gói`); }
    assert.equal(packOfGroup("ui-open"), "ui");
    assert.equal(packOfGroup("pk-kill"), "pk");
    assert.equal(packOfGroup("amb-wind"), "amb");
    assert.ok(have.get("pk-heartbeat") >= 2, "nhịp tim có bản chậm và nhanh");
    assert.ok(heartbeatInterval(LOW_HP_RATIO) === HEARTBEAT_MS.slow && heartbeatInterval(0) === HEARTBEAT_MS.fast && heartbeatInterval(LOW_HP_RATIO / 2) < HEARTBEAT_MS.slow, "máu càng thấp nhịp càng dồn");

    const { audio } = make();
    const calls = [];
    audio.playGroup = (g, s, o) => { calls.push([g, s, o]); return true; };
    audio.playClip = (id, o) => { calls.push([id, "clip", o]); return true; };
    audio.bank.ensure = (p) => { calls.push([`ensure:${p}`]); return Promise.resolve(); };
    for (const kind of Object.keys(UI_GROUP)) { audio.playUi(kind); assert.deepEqual([calls.at(-1)[0], calls.at(-1)[2].channel], [UI_GROUP[kind], "ui"], `playUi(${kind})`); }
    calls.length = 0;
    audio.playPkOpen();
    assert.deepEqual(calls.map((c) => c[0]), ["ensure:pk", "pk-open"], "mở trận: tải gói PK rồi phát");
    assert.ok(calls.at(-1)[2].duck > 0, "trống mở trận hạ nhạc nền");
    calls.length = 0;
    audio.playPkCountdown(3); audio.playPkCountdown(2); audio.playPkCountdown(1);
    const rates = calls.filter((c) => c[0] === "pk-count").map((c) => c[2].rate);
    assert.equal(rates.length, 3);
    assert.ok(rates[0] < rates[1] && rates[1] < rates[2], "đếm 3, 2, 1: cao dần");
    audio.playPkCountdown(0);
    assert.equal(calls.at(-1)[0], "pk-go");
    audio.playPkKill({ x: 1, y: 2 });
    assert.deepEqual([calls.at(-1)[0], calls.at(-1)[1]], ["pk-kill", { x: 1, y: 2 }]);

    // nhịp tim: im khi máu trên ngưỡng hoặc đã chết; đập đều theo khoảng cách; máu rất thấp dùng nhịp nhanh
    calls.length = 0;
    audio.updateLowHpHeartbeat(0.9, 0); audio.updateLowHpHeartbeat(0, 0);
    assert.equal(calls.filter((c) => String(c[0]).startsWith("pk-heartbeat")).length, 0);
    audio.updateLowHpHeartbeat(0.25, 1000);
    audio.updateLowHpHeartbeat(0.25, 1100);
    assert.equal(calls.filter((c) => c[0] === "pk-heartbeat-1").length, 1, "chưa tới nhịp sau thì không đập lại");
    audio.updateLowHpHeartbeat(0.25, 1000 + HEARTBEAT_MS.slow);
    assert.equal(calls.filter((c) => c[0] === "pk-heartbeat-1").length, 2);
    audio.updateLowHpHeartbeat(0.05, 9000);
    assert.equal(calls.at(-1)[0], "pk-heartbeat-2", "máu rất thấp: nhịp nhanh");

    // môi trường: theo bản đồ và ngày đêm
    const played = [];
    let r = 0.5;
    const layers = new amb.AmbientLayers((kind, volume, pan) => played.push({ kind, volume, pan }), () => r);
    const step = (from, to, input) => { for (let t = from; t <= to; t += 250) layers.update(t, input); };
    const day = { mapId: "thanh_hon_thon", night: 0, fireDist: null }, night = { ...day, night: 1 };
    step(0, 120_000, day);
    const kindsDay = new Set(played.map((p) => p.kind));
    assert.ok(kindsDay.has("bird") && kindsDay.has("wind") && kindsDay.has("bell"), "ban ngày: chim, gió, chuông chùa");
    assert.ok(!kindsDay.has("cricket") && !kindsDay.has("fire") && !kindsDay.has("wave"), "ban ngày không côn trùng; xa lửa không có lửa; làng không có sóng");
    played.length = 0;
    step(120_000, 240_000, night);
    const kindsNight = new Set(played.map((p) => p.kind));
    assert.ok(kindsNight.has("cricket") && !kindsNight.has("bird"), "ban đêm: côn trùng, không chim");
    played.length = 0;
    step(240_000, 300_000, { ...day, fireDist: 40 });
    const fires = played.filter((p) => p.kind === "fire");
    assert.ok(fires.length > 0 && fires.every((p) => p.volume > 0.8), "đứng cạnh lửa thì nghe lửa, to");
    played.length = 0;
    step(300_000, 400_000, { mapId: "hai_than_dao", night: 0, fireDist: amb.AMBIENT_FIRE_RANGE + 50 });
    assert.ok(played.some((p) => p.kind === "wave"), "đảo có sóng");
    assert.ok(!played.some((p) => p.kind === "fire"), "lửa ngoài tầm: im");
    played.length = 0;
    step(400_000, 500_000, { mapId: "ban_do_la", night: 0, fireDist: null });
    assert.equal(played.length, 0, "bản đồ không có hồ sơ môi trường thì im");
    for (const id of ["thanh_hon_thon", "nac_dinh_thanh", "thien_dau_thanh", "tinh_dau_ngoai_vi", "tinh_dau_noi_dia", "lac_nhat_sam_lam", "cuc_bac_chi_dia", "hai_than_dao", "loi_tinh_dau", "dai_dau_hon_truong"]) {
      assert.ok(amb.AMBIENT_PROFILES[id], `bản đồ ${id} có hồ sơ môi trường`);
    }
    const spread = new Set(), ls = new amb.AmbientLayers((k, v, p) => spread.add(p), Math.random);
    for (let t = 0; t < 600_000; t += 250) ls.update(t, { mapId: "cuc_bac_chi_dia", night: 0, fireDist: null });
    assert.ok(spread.size > 3, "lệch trái / phải ngẫu nhiên");
  }

  // Nền môi trường vòng lặp (#622): tải lười theo bản đồ, vòng lặp, chuyển chéo khi đổi bản đồ, im ở bản đồ không có nền.
  {
    const { existsSync } = await import("node:fs");
    const amb = await import("../src/audio/ambientLayers.ts");
    for (const [id, cfg] of Object.entries(amb.AMBIENT_BEDS)) {
      assert.ok(amb.AMBIENT_PROFILES[id], `nền ${id} thuộc bản đồ có hồ sơ môi trường`);
      assert.ok(cfg.gain > 0 && cfg.gain <= 1, `độ to nền ${id} trong (0, 1]`);
      for (const f of ["ogg", "m4a"]) assert.ok(existsSync(new URL(`../../shared/assets/${amb.ambientBedFile(id, f)}`, import.meta.url)), `thiếu file nền ${amb.ambientBedFile(id, f)}`);
    }
    const { audio, started } = make();
    const beds = () => started.filter((n) => n.loop === true);
    const flush = async () => { for (let i = 0; i < 6; i += 1) await new Promise((r) => setTimeout(r, 0)); };
    const input = (mapId) => ({ mapId, night: 0, fireDist: null });
    assert.ok(audio.bed, "có bộ phát nền khi có WebAudio");
    audio.updateAmbient(0, input("thanh_hon_thon")); await flush();
    assert.equal(audio.bed.fetched.length, 0, "bản đồ không có nền: không tải gì");
    audio.updateAmbient(250, input("hai_than_dao")); audio.updateAmbient(500, input("hai_than_dao")); await flush();
    assert.deepEqual(audio.bed.fetched, ["audio/ambient/amb_nen_hai_than_dao.ogg"], "tải đúng file nền của bản đồ, một lần");
    assert.equal(beds().length, 1, "một nền đang phát, gọi lặp không nhân đôi");
    assert.equal(audio.bed.current, "hai_than_dao");
    assert.equal(beds()[0].args[1], 30, "vào giữa vòng ở chỗ ngẫu nhiên");
    audio.updateAmbient(750, input("loi_tinh_dau")); await flush();
    assert.equal(beds().length, 2, "đổi bản đồ: nền mới vào");
    assert.ok(beds()[0].stopped && !beds()[1].stopped, "nền cũ mờ ra rồi dừng, nền mới tiếp tục");
    audio.updateAmbient(1000, input("hai_than_dao")); await flush();
    assert.equal(audio.bed.fetched.length, 2, "quay lại bản đồ cũ: dùng bản đã tải");
    audio.updateAmbient(1250, input("thanh_hon_thon")); await flush();
    assert.ok(beds().every((n) => n.stopped) && audio.bed.current === null, "sang bản đồ không có nền: im");
    // Đổi bản đồ khi đang tải: chỉ nền của bản đồ cuối được phát.
    const quick = make();
    quick.audio.updateAmbient(0, input("hai_than_dao")); quick.audio.updateAmbient(10, input("loi_tinh_dau")); await flush();
    assert.equal(quick.started.filter((n) => n.loop === true && !n.stopped).length, 1);
    assert.equal(quick.audio.bed.current, "loi_tinh_dau");
    // Scene bị hủy khi đi cổng / đổi kênh: AudioManager mới trên cùng AudioContext dùng lại bộ phát và bộ nhớ đệm, nền cũ không bị cắt.
    const { ctx } = quick;
    quick.audio.updateAmbient(0, input("hai_than_dao")); await flush();
    const fetchedBefore = quick.audio.bed.fetched.length;
    const live = quick.started.filter((n) => n.loop === true && !n.stopped);
    assert.equal(live.length, 1, "đang nghe nền Hải Thần Đảo");
    quick.audio.dispose();
    assert.ok(!live[0].stopped, "hủy AudioManager không cắt nền đang phát");
    const next = new AudioManager({ sound: { context: ctx, setMute() {}, setVolume() {} } }, () => ({ x: 100, y: 100 }), () => null, { random: () => 0.5 });
    assert.equal(next.bed, quick.audio.bed, "một bộ phát nền cho mỗi AudioContext");
    next.updateAmbient(0, input("hai_than_dao")); await flush();
    assert.equal(quick.started.filter((n) => n.loop === true).length, 2, "cùng bản đồ sau khi đổi scene: nền giữ nguyên, không phát lại");
    next.updateAmbient(250, input("loi_tinh_dau")); await flush();
    assert.equal(next.bed.fetched.length, fetchedBefore, "đổi sang bản đồ đã nghe: không tải lại");
    assert.equal(next.bed.current, "loi_tinh_dau", "nền mới vào, nền cũ mờ ra chéo");
    stopAmbientBed();
    assert.equal(next.bed.current, null, "mất kết nối: ngừng nền");
    next.updateAmbient(500, input("hai_than_dao")); next.updateAmbient(750, input("loi_tinh_dau")); await flush();
    assert.equal(next.bed.current, null, "scene cũ còn gọi updateAmbient sau khi mất kết nối: vẫn im");
    const again = new AudioManager({ sound: { context: ctx, setMute() {}, setVolume() {} } }, () => ({ x: 100, y: 100 }), () => null, { random: () => 0.5 });
    again.updateAmbient(0, input("hai_than_dao")); await flush();
    assert.equal(again.bed.current, "hai_than_dao", "AudioManager mới (vào lại) thì phát lại");
    again.dispose();
    audio.dispose();
    next.dispose();
  }
}

// Tiếng giao diện gắn vào DOM (G5, #396): đổi `hidden` của panel → mở / đóng, lần đầu chỉ ghi nhớ; kéo thả trong panel.
{
  const { bindUiSounds } = await import("../src/audio/uiSounds.ts");
  const panelA = { hidden: true, closest: () => panelA }, panelB = { hidden: false, closest: () => panelB }, outside = { closest: () => null };
  let callback = null;
  const observed = [];
  globalThis.MutationObserver = class { constructor(cb) { callback = cb; } observe(el) { observed.push(el); } disconnect() { observed.length = 0; } };
  const listeners = {};
  globalThis.document = { addEventListener(type, fn) { listeners[type] = fn; } };
  const played = [];
  const ac = new AbortController();
  bindUiSounds({ playUi: (k) => played.push(k) }, ac.signal, { querySelectorAll: () => [panelA, panelB] });
  assert.equal(observed.length, 2);
  callback([{ target: panelA }]);
  assert.deepEqual(played, [], "hidden không đổi so với lúc gắn: không phát");
  panelA.hidden = false; callback([{ target: panelA }]);
  panelB.hidden = true; callback([{ target: panelB }]);
  panelB.hidden = true; callback([{ target: panelB }]);
  assert.deepEqual(played, ["open", "close"], "mở rồi đóng; lặp trạng thái cũ không phát lại");
  listeners.dragstart({ target: panelA }); listeners.drop({ target: panelA }); listeners.dragstart({ target: outside });
  assert.deepEqual(played.slice(2), ["drag", "drop"], "kéo thả ngoài panel không có tiếng");
  const btn = { disabled: false, getAttribute: () => null, closest: () => btn };
  played.length = 0;
  listeners.click({ target: btn }); listeners.click({ target: btn });
  assert.deepEqual(played, ["click"], "bấm nút trong panel phát một tiếng; bấm dồn trong CLICK_GAP_MS không phát lại");
  btn.disabled = true; await new Promise((r) => setTimeout(r, 100)); listeners.click({ target: btn });
  assert.deepEqual(played, ["click"], "nút bị khóa không có tiếng bấm");
  btn.disabled = false; listeners.click({ target: { closest: (sel) => (sel.startsWith("button") ? btn : null) } });
  assert.deepEqual(played, ["click"], "nút nằm ngoài panel không có tiếng");
  ac.abort();
  assert.equal(observed.length, 0, "hủy signal thì gỡ quan sát");
  delete globalThis.MutationObserver; delete globalThis.document;
}

console.log(`audio-test: ${SFX_IDS.length} SFX tổng hợp, tiếng mẫu CC0, kênh trộn, settings và spatial đều đạt`);
