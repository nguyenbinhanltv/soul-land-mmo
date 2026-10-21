import assert from "node:assert/strict";
import { AudioManager } from "../src/audio/AudioManager.ts";
import { DEFAULT_AUDIO_SETTINGS, normalizeAudioSettings } from "../src/audio/settings.ts";
import { spatialMix } from "../src/audio/spatial.ts";
import { SFX_IDS, SFX_PARAMS } from "../src/audio/sfxData.ts";

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

assert.equal(SFX_IDS.length, 40);
assert.equal(new Set(SFX_IDS).size, SFX_IDS.length);
for (const id of SFX_IDS) assert.ok(SFX_PARAMS[id], `thiếu tham số SFX: ${id}`);
assert.ok(SFX_IDS.includes("skill_fire"));
assert.ok(SFX_IDS.includes("ring_absorb_success"));

const gains = [];
const context = {
  state: "running",
  destination: { kind: "context-destination" },
  createGain() {
    const gain = {
      value: 0,
      setValueAtTime(value) { this.value = value; },
    };
    const node = { gain, connections: [], connect(target) { this.connections.push(target); } };
    gains.push(node);
    return node;
  },
};
const host = {
  context,
  muted: false,
  volume: 0,
  setMute(value) { this.muted = value; },
  setVolume(value) { this.volume = value; },
};
const audio = new AudioManager({ sound: host }, () => null);
assert.equal(host.volume, DEFAULT_AUDIO_SETTINGS.master * DEFAULT_AUDIO_SETTINGS.music);
assert.equal(gains[0].gain.value, DEFAULT_AUDIO_SETTINGS.master * DEFAULT_AUDIO_SETTINGS.sfx);
assert.deepEqual(gains[0].connections, [context.destination]);
audio.updateSettings({ music: 0, sfx: 0.5 });
assert.equal(host.volume, 0, "tắt Nhạc chỉ tắt bus nhạc");
assert.equal(gains[0].gain.value, DEFAULT_AUDIO_SETTINGS.master * 0.5, "SFX vẫn theo Tổng và Hiệu ứng");
audio.updateSettings({ master: 0.5, music: 1, sfx: 1 });
assert.equal(host.volume, 0.5, "bus nhạc chỉ nhận Tổng x Nhạc");
assert.equal(gains[0].gain.value, 0.5, "bus SFX chỉ nhận Tổng x Hiệu ứng");
audio.dispose();

console.log(`audio-test: ${SFX_IDS.length} SFX, settings và spatial đều đạt`);
