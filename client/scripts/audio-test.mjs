import assert from "node:assert/strict";
import { AUDIO_MAX_ACTIVE, AudioManager, resolveAudioSource, SFX_REPEAT_WINDOW_MS } from "../src/audio/AudioManager.ts";
import { DEFAULT_AUDIO_SETTINGS, normalizeAudioSettings } from "../src/audio/settings.ts";
import { panFromProjection, spatialMix } from "../src/audio/spatial.ts";
import { SFX_IDS, SFX_PARAMS } from "../src/audio/sfxData.ts";
import { createZzFxBuffer } from "../src/audio/zzfx.ts";

const settings = normalizeAudioSettings({ master: 2, music: -1, sfx: "bad", muted: 1 });
assert.deepEqual(settings, { master: 1, music: 0, sfx: DEFAULT_AUDIO_SETTINGS.sfx, muted: true });
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
assert.equal(sources.length, AUDIO_MAX_ACTIVE, "giới hạn số tiếng đồng thời");
audio.dispose();

const noListenerContext = { ...context, state: "running", createBufferSource() {
  const node = { connect() {}, addEventListener() {}, start() {} };
  sources.push(node);
  return node;
} };
const noListenerAudio = new AudioManager({ sound: { ...host, context: noListenerContext } }, () => null);
noListenerAudio.play("combat_hit", { x: 100, y: 100 });
assert.equal(sources.length, AUDIO_MAX_ACTIVE, "SFX có nguồn nhưng chưa có listener thì bỏ qua");
noListenerAudio.dispose();

console.log(`audio-test: ${SFX_IDS.length} SFX, settings và spatial đều đạt`);
