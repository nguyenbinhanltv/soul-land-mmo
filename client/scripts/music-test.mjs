// Bài thử nhạc nền (#134): MusicPlayer với AudioContext giả, chờ theo trạng thái (whenIdle), không ngủ cố định, không cần trình duyệt.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  MUSIC_BATTLE_HOLD_MS, MUSIC_BATTLE_RANGE, MUSIC_CACHE_TRACKS, MUSIC_DUCK_GAIN, MUSIC_FADE_S, MUSIC_MANIFEST_URL, MUSIC_RETRY_MAX, MUSIC_RETRY_MS,
  MusicPlayer, bossEngaged, musicLoopSeconds, musicPlayerFor, pickMusicFormat,
} from "../src/audio/music.ts";
import { AudioManager } from "../src/audio/AudioManager.ts";
import { DEFAULT_AUDIO_SETTINGS } from "../src/audio/settings.ts";

const manifestBytes = new Uint8Array(readFileSync(new URL("../../shared/assets/audio/music/manifest.json", import.meta.url)));
const manifest = JSON.parse(new TextDecoder().decode(manifestBytes));
const enc = (text) => new TextEncoder().encode(text).buffer;
const mapTrack = (mapId) => manifest.tracks.find((t) => t.kind === "map" && t.maps.includes(mapId));
const battleTrack = manifest.tracks.find((t) => t.kind === "battle");
const jingleTrack = (event) => manifest.tracks.find((t) => t.kind === "jingle" && t.event === event);

// Chọn định dạng: Safari / iOS dùng m4a, trình duyệt khác ogg nếu phát được Vorbis.
const yes = () => "probably", no = () => "";
const ua = {
  chrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  android: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36",
  firefox: "Mozilla/5.0 (Windows NT 10.0; rv:131.0) Gecko/20100101 Firefox/131.0",
  safari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  iosChrome: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1",
};
assert.equal(pickMusicFormat({ userAgent: ua.chrome }, yes), "ogg");
assert.equal(pickMusicFormat({ userAgent: ua.android }, yes), "ogg", "Chrome Android có chữ Safari/ nhưng không phải Safari");
assert.equal(pickMusicFormat({ userAgent: ua.firefox }, yes), "ogg");
assert.equal(pickMusicFormat({ userAgent: ua.chrome }, no), "m4a", "không phát được Vorbis thì m4a");
assert.equal(pickMusicFormat({ userAgent: ua.safari }, yes), "m4a", "Safari dùng m4a dù canPlayType báo ogg");
assert.equal(pickMusicFormat({ userAgent: ua.iosChrome }, yes), "m4a", "mọi trình duyệt iOS là WebKit");
assert.equal(pickMusicFormat({ userAgent: ua.safari.replace("Version/18.0 ", ""), maxTouchPoints: 5 }, yes), "m4a", "iPadOS giả Macintosh");
assert.equal(pickMusicFormat(undefined, undefined), "m4a");

// Giao chiến boss: chỉ rank ≥ 2 còn sống, trong tầm, đang hung hăng hoặc đã có người góp sát thương.
const me = { x: 100, y: 100 };
const beast = (o) => ({ x: 150, y: 100, rank: 2, hp: 10, aggro: true, parts: 0, ...o });
assert.equal(bossEngaged([beast({})], me), true, "thú vương gần đang hung hăng");
assert.equal(bossEngaged([beast({ rank: 3, aggro: false, parts: 2 })], me), true, "boss thế giới có người đánh");
assert.equal(bossEngaged([beast({ rank: 1 })], me), false, "tinh anh không đổi nhạc");
assert.equal(bossEngaged([beast({ aggro: false })], me), false, "boss đứng yên chưa ai đánh");
assert.equal(bossEngaged([beast({ hp: 0 })], me), false, "boss đã chết");
assert.equal(bossEngaged([beast({ x: 100 + MUSIC_BATTLE_RANGE + 1 })], me), false, "ngoài tầm");
assert.equal(bossEngaged(new Map([["a", beast({ rank: 0 })], ["b", beast({})]]), me), true, "đọc được MapSchema (forEach)");

function param(value = 1) {
  return {
    value, events: [],
    cancelScheduledValues(t) { this.events.push(["cancel", t]); },
    setValueAtTime(v, t) { this.value = v; this.events.push(["set", v, t]); },
    linearRampToValueAtTime(v, t) { this.events.push(["ramp", v, t]); },
  };
}
const lastRamp = (p) => p.events.filter((e) => e[0] === "ramp").at(-1);

function makeContext() {
  const ctx = {
    state: "running", currentTime: 10, destination: { name: "loa" }, sources: [], gains: [],
    createGain() {
      const g = { gain: param(1), connections: [], connect(n) { this.connections.push(n); }, disconnect() {} };
      ctx.gains.push(g);
      return g;
    },
    createBufferSource() {
      const s = {
        buffer: null, loop: false, loopStart: -1, loopEnd: -1, started: null, stopped: null, connections: [], listeners: {},
        connect(n) { this.connections.push(n); }, disconnect() {},
        addEventListener(k, f) { this.listeners[k] = f; },
        start(t) { this.started = t; }, stop(t) { this.stopped = t ?? ctx.currentTime; },
      };
      ctx.sources.push(s);
      return s;
    },
    decodeAudioData(data, ok, fail) {
      const tag = new TextDecoder().decode(data);
      if (tag === "hỏng") fail(new Error("giải mã lỗi"));
      else ok({ duration: Number(tag.split("|")[1]), sampleRate: 44100, tag: tag.split("|")[0] });
    },
  };
  return ctx;
}

function makeLoader({ badOgg = false, pad = 0, fail = () => false } = {}) {
  const loads = [];
  const load = async (url) => {
    loads.push(url);
    if (fail(url)) throw new Error(`mạng lỗi ${url}`); // `fail`: mạng chập với url này
    if (url === MUSIC_MANIFEST_URL) return manifestBytes.slice().buffer;
    const track = manifest.tracks.find((t) => Object.values(t.files).some((f) => f.path === url));
    if (!track) throw new Error(`404 ${url}`);
    if (badOgg && url.endsWith(".ogg")) return enc("hỏng");
    return enc(`${url}|${(track.loop ? musicLoopSeconds(track.seconds) : track.seconds) + pad}`); // `pad`: bộ giải mã đệm thêm ở cuối
  };
  return { loads, load };
}

let clock = 0;
const now = () => clock;
{
  const ctx = makeContext(), { loads, load } = makeLoader();
  const music = new MusicPlayer(ctx, { load, format: "ogg", now });
  const [bus, duck] = ctx.gains;
  assert.deepEqual(bus.connections, [ctx.destination]);
  assert.deepEqual(duck.connections, [bus]);

  // Bus Nhạc im thì không tải gì (cả manifest).
  music.setMap("thanh_hon_thon");
  await music.whenIdle();
  assert.deepEqual(loads, [], "nhạc im: không tải");
  assert.equal(music.status().playing, null);

  // Bật nhạc: chỉ tải manifest và đúng bài của bản đồ hiện tại (tải lười, không tải trước cả bộ).
  music.setVolume(0.5);
  assert.equal(bus.gain.value, 0.5);
  await music.whenIdle();
  const thth = mapTrack("thanh_hon_thon");
  assert.deepEqual(loads, [MUSIC_MANIFEST_URL, thth.files.ogg.path]);
  assert.equal(music.status().playing, thth.id);
  const s1 = ctx.sources[0], g1 = s1.connections[0];
  assert.equal(s1.loop, true, "bài nền lặp");
  assert.equal(s1.loopStart, 0);
  assert.equal(s1.loopEnd, 0, "điểm lặp là cả file (loopEnd 0 = hết buffer), không cắt theo `seconds` đã làm tròn");
  assert.equal(s1.started, ctx.currentTime);
  assert.deepEqual(g1.connections, [duck], "bài nền đi qua duck");
  assert.deepEqual(lastRamp(g1.gain), ["ramp", 1, ctx.currentTime + MUSIC_FADE_S], "mờ vào");

  // Đổi bản đồ: bài cũ mờ ra rồi dừng, bài mới mờ vào cùng lúc (mờ chéo).
  ctx.currentTime = 20;
  music.setMap("tinh_dau_ngoai_vi");
  await music.whenIdle();
  const ngoai = mapTrack("tinh_dau_ngoai_vi"), s2 = ctx.sources[1], g2 = s2.connections[0];
  assert.equal(loads.at(-1), ngoai.files.ogg.path);
  assert.equal(loads.filter((u) => u === MUSIC_MANIFEST_URL).length, 1, "manifest tải một lần");
  assert.deepEqual(lastRamp(g1.gain), ["ramp", 0, 20 + MUSIC_FADE_S], "bài cũ mờ ra");
  assert.ok(Math.abs(s1.stopped - (20 + MUSIC_FADE_S)) < 0.1, "bài cũ dừng khi đã mờ hết");
  assert.deepEqual(lastRamp(g2.gain), ["ramp", 1, 20 + MUSIC_FADE_S], "bài mới mờ vào");
  assert.equal(music.status().playing, ngoai.id);

  // Giao chiến boss: đổi bài ngay; hết giao chiến giữ MUSIC_BATTLE_HOLD_MS rồi mờ về bài bản đồ (đã có sẵn, không tải lại).
  clock = 1000;
  music.setBattle(true);
  await music.whenIdle();
  assert.equal(music.status().playing, battleTrack.id);
  assert.equal(music.status().battle, true);
  const loadsAfterBattle = loads.length;
  music.setBattle(false);
  clock += MUSIC_BATTLE_HOLD_MS - 1;
  music.setBattle(false);
  await music.whenIdle();
  assert.equal(music.status().playing, battleTrack.id, "chưa hết thời gian giữ");
  music.setBattle(true); // đánh tiếp: hủy đếm
  clock += MUSIC_BATTLE_HOLD_MS * 2;
  music.setBattle(true);
  music.setBattle(false);
  clock += MUSIC_BATTLE_HOLD_MS;
  music.setBattle(false);
  await music.whenIdle();
  assert.equal(music.status().playing, ngoai.id, "hết giao chiến: về nhạc bản đồ");
  assert.equal(loads.length, loadsAfterBattle, "bài bản đồ lấy từ bộ đệm");

  // Đổi bản đồ khi đang giao chiến: hết giao chiến ngay (không giữ bài giao chiến sang bản đồ mới).
  music.setBattle(true);
  await music.whenIdle();
  assert.equal(music.status().playing, battleTrack.id);
  music.setBattle(false);
  music.setMap("loi_tinh_dau");
  music.setBattle(false);
  await music.whenIdle();
  assert.equal(music.status().playing, mapTrack("loi_tinh_dau").id, "sang bản đồ mới là bài bản đồ mới");
  assert.equal(music.status().battle, false);
  music.setMap("tinh_dau_ngoai_vi");
  await music.whenIdle();
  assert.equal(music.status().playing, ngoai.id);

  // Khúc ngắn: phát vào bus (không bị hạ), hạ nhạc nền còn MUSIC_DUCK_GAIN rồi trả về 1 khi hết.
  ctx.currentTime = 40;
  music.jingle("level_up");
  await music.whenIdle();
  const lv = jingleTrack("level_up"), sj = ctx.sources.at(-1);
  assert.equal(loads.at(-1), lv.files.ogg.path);
  assert.deepEqual(sj.connections, [bus], "khúc ngắn không đi qua duck");
  assert.equal(sj.loop, false);
  assert.equal(music.status().jingle, "level_up");
  assert.ok(duck.gain.events.some((e) => e[0] === "ramp" && e[1] === MUSIC_DUCK_GAIN), "hạ nhạc nền");
  assert.deepEqual(lastRamp(duck.gain).slice(0, 2), ["ramp", 1], "trả nhạc nền khi khúc ngắn hết");
  const nSources = ctx.sources.length;
  music.jingle("quest_accept");
  await music.whenIdle();
  assert.equal(ctx.sources.length, nSources, "khúc ưu tiên thấp hơn bị bỏ");
  music.jingle("ring_absorb");
  await music.whenIdle();
  assert.equal(music.status().jingle, "ring_absorb", "khúc ưu tiên cao hơn thay khúc đang phát");
  assert.notEqual(sj.stopped, null, "khúc cũ bị cắt");
  ctx.sources.at(-1).listeners.ended();
  assert.equal(music.status().jingle, null, "hết khúc ngắn");
  ctx.state = "suspended";
  music.jingle("arena_win");
  await music.whenIdle();
  assert.equal(music.status().jingle, null, "context treo (tab ẩn / chưa tương tác): không phát khúc ngắn");
  ctx.state = "running";

  // Tắt tiếng: mờ bài đang phát; đổi bản đồ lúc im thì không tải; bật lại thì phát bài bản đồ hiện tại.
  const before = loads.length, cur = ctx.sources.filter((x) => x.loop).at(-1);
  music.setVolume(0);
  await music.whenIdle();
  assert.equal(music.status().playing, null);
  assert.deepEqual(lastRamp(cur.connections[0].gain).slice(0, 2), ["ramp", 0], "tắt tiếng: bài đang phát mờ ra");
  music.setMap("nac_dinh_thanh");
  await music.whenIdle();
  assert.equal(loads.length, before, "im thì không tải bài mới");
  music.setVolume(1);
  await music.whenIdle();
  assert.equal(music.status().playing, mapTrack("nac_dinh_thanh").id);

  // Đổi ý khi chưa kịp tải: chỉ bài cuối cùng được tải và phát.
  music.setMap("thien_dau_thanh");
  music.setMap("hai_than_dao");
  await music.whenIdle();
  assert.equal(music.status().playing, mapTrack("hai_than_dao").id);
  assert.ok(!loads.includes(mapTrack("thien_dau_thanh").files.ogg.path), "bản đồ bị bỏ qua không tải");

  // Bộ đệm giới hạn MUSIC_CACHE_TRACKS bài nền: quay lại bản đồ đầu sau nhiều bản đồ thì tải lại.
  for (const id of ["loi_tinh_dau", "lac_nhat_sam_lam", "cuc_bac_chi_dia"].slice(0, MUSIC_CACHE_TRACKS)) { music.setMap(id); await music.whenIdle(); }
  const n = loads.length;
  music.setMap("thanh_hon_thon");
  await music.whenIdle();
  assert.equal(loads.length, n + 1, "bài đã bị bỏ khỏi bộ đệm được tải lại");

  // Mất kết nối: ngừng hẳn.
  music.stop();
  await music.whenIdle();
  assert.equal(music.status().playing, null);
  assert.equal(music.status().map, null);
}

// Độ dài vòng thật: `seconds` làm tròn tới ms, vòng là bội 1024 mẫu ở 44,1 kHz (109,714 s = 4 838 400 mẫu).
for (const t of manifest.tracks.filter((x) => x.loop)) {
  const n = musicLoopSeconds(t.seconds) * 44100;
  assert.ok(Math.abs(n - Math.round(n)) < 1e-6 && Math.round(n) % 1024 === 0 && Math.abs(n - t.seconds * 44100) < 44.1, `vòng ${t.id}`);
}
assert.equal(Math.round(musicLoopSeconds(109.714) * 44100), 4838400);
{
  // Bộ giải mã đệm thêm mẫu ở cuối: cắt đúng độ dài vòng.
  const ctx = makeContext(), { load } = makeLoader({ pad: 0.05 });
  const music = new MusicPlayer(ctx, { load, format: "ogg", now });
  music.setVolume(1);
  music.setMap("tinh_dau_ngoai_vi");
  await music.whenIdle();
  assert.equal(ctx.sources[0].loopEnd, musicLoopSeconds(mapTrack("tinh_dau_ngoai_vi").seconds));
}

// ogg không giải mã được: thử m4a của cùng bài và dùng m4a từ đó.
{
  const ctx = makeContext(), { loads, load } = makeLoader({ badOgg: true });
  const music = new MusicPlayer(ctx, { load, format: "ogg", now });
  music.setVolume(1);
  music.setMap("thanh_hon_thon");
  await music.whenIdle();
  const t = mapTrack("thanh_hon_thon");
  assert.deepEqual(loads.slice(1), [t.files.ogg.path, t.files.m4a.path]);
  assert.equal(music.format, "m4a");
  assert.equal(music.status().playing, t.id);
  music.setMap("hai_than_dao");
  await music.whenIdle();
  assert.equal(loads.at(-1), mapTrack("hai_than_dao").files.m4a.path, "sau đó chỉ tải m4a");
}

// Tải lỗi (mạng chập): không nhớ kết quả lỗi; nhạc nền thử lại theo hẹn giờ giãn dần, có giới hạn, đổi bản đồ thì đếm lại.
{
  const down = new Set(), timers = [];
  const ctx = makeContext(), { loads, load } = makeLoader({ fail: (url) => down.has(url) });
  const music = new MusicPlayer(ctx, { load, format: "ogg", now, schedule: (fn, ms) => timers.push({ fn, ms }) });
  const fire = async () => { timers.shift().fn(); await music.whenIdle(); };
  const thth = mapTrack("thanh_hon_thon"), ngoai = mapTrack("tinh_dau_ngoai_vi");

  // Manifest lỗi lần đầu: im, hẹn thử lại; mạng lành thì lượt thử lại tải được manifest và phát.
  down.add(MUSIC_MANIFEST_URL);
  music.setMap("thanh_hon_thon");
  await music.whenIdle(); // chuỗi sync đọc state lúc chạy: chờ để chỉ một lượt tải manifest lỗi
  music.setVolume(1);
  await music.whenIdle();
  assert.equal(music.status().playing, null);
  assert.deepEqual(timers.map((t) => t.ms), [MUSIC_RETRY_MS], "manifest lỗi: hẹn một lần thử lại");
  down.delete(MUSIC_MANIFEST_URL);
  await fire();
  assert.equal(music.status().playing, thth.id, "thử lại: có nhạc");
  assert.equal(loads.filter((u) => u === MUSIC_MANIFEST_URL).length, 2, "manifest lỗi không bị nhớ");
  assert.equal(timers.length, 0);

  // Bài nền lỗi mãi: thử lại đúng MUSIC_RETRY_MAX lần, giãn gấp đôi, rồi thôi.
  down.add(ngoai.files.ogg.path); down.add(ngoai.files.m4a.path);
  music.setMap("tinh_dau_ngoai_vi");
  await music.whenIdle();
  assert.equal(music.status().playing, null, "bài lỗi: mờ bài cũ, im");
  const delays = [];
  while (timers.length) { delays.push(timers[0].ms); await fire(); }
  assert.deepEqual(delays, Array.from({ length: MUSIC_RETRY_MAX }, (_, i) => MUSIC_RETRY_MS * 2 ** i), "thử lại có giới hạn, giãn dần");
  assert.equal(loads.filter((u) => u === ngoai.files.ogg.path).length, 1 + MUSIC_RETRY_MAX, "mỗi lượt thử tải lại thật");
  assert.equal(music.format, "ogg", "mạng lỗi không đổi định dạng sang m4a");

  // Hết lượt thử nhưng đổi bản đồ đi rồi về (mạng đã lành): tải lại và phát, không giữ kết quả lỗi trong bộ đệm.
  music.setMap("thanh_hon_thon");
  await music.whenIdle();
  assert.equal(music.status().playing, thth.id);
  down.clear();
  music.setMap("tinh_dau_ngoai_vi");
  await music.whenIdle();
  assert.equal(music.status().playing, ngoai.id, "về lại bản đồ từng lỗi: có nhạc");
  assert.equal(timers.length, 0);

  // Bài lỗi một lần rồi lành: một lượt thử lại là đủ, đếm thử lại về 0 sau khi phát được.
  const loi = mapTrack("loi_tinh_dau");
  down.add(loi.files.ogg.path); down.add(loi.files.m4a.path);
  music.setMap("loi_tinh_dau");
  await music.whenIdle();
  assert.equal(timers.length, 1);
  down.clear();
  await fire();
  assert.equal(music.status().playing, loi.id);
  assert.equal(timers.length, 0);

  // Khúc ngắn lỗi: không nhớ lỗi, lần sự kiện sau tải lại và phát (không hẹn giờ: khúc ngắn trễ thì vô nghĩa).
  const lv = jingleTrack("level_up");
  down.add(lv.files.ogg.path); down.add(lv.files.m4a.path);
  music.jingle("level_up");
  await music.whenIdle();
  assert.equal(music.status().jingle, null);
  assert.equal(timers.length, 0, "khúc ngắn lỗi không hẹn thử lại");
  down.clear();
  music.jingle("level_up");
  await music.whenIdle();
  assert.equal(music.status().jingle, "level_up", "lần sau tải lại khúc ngắn");
}

// Định dạng m4a (Safari): tải file m4a.
{
  const ctx = makeContext(), { loads, load } = makeLoader();
  const music = new MusicPlayer(ctx, { load, format: "m4a", now });
  music.setVolume(1);
  music.setMap("dai_dau_hon_truong");
  await music.whenIdle();
  assert.equal(loads.at(-1), mapTrack("dai_dau_hon_truong").files.m4a.path);
}

// Không có WebAudio (bot, headless không âm thanh): không có bộ phát, AudioManager vẫn chạy.
assert.equal(musicPlayerFor(null), null);
assert.equal(musicPlayerFor(undefined), null);
{
  const noAudio = new AudioManager({ sound: { setMute() {}, setVolume() {} } }, () => null);
  assert.equal(noAudio.music, null);
  noAudio.music?.setMap("thanh_hon_thon");
  noAudio.updateSettings({ music: 0.3 });
  noAudio.dispose();
}

// AudioManager: một bộ phát cho mỗi context (sống qua scene), âm lượng = Tổng × Nhạc, tắt tiếng thì 0.
{
  const ctx = makeContext();
  const host = { context: ctx, setMute() {}, setVolume() {} };
  const a = new AudioManager({ sound: host }, () => null);
  assert.ok(a.music);
  assert.equal(a.music.status().volume, DEFAULT_AUDIO_SETTINGS.master * DEFAULT_AUDIO_SETTINGS.music);
  a.updateSettings({ muted: true });
  assert.equal(a.music.status().volume, 0);
  a.updateSettings({ muted: false, master: 0.5, music: 0.4 });
  assert.equal(a.music.status().volume, 0.2);
  a.dispose();
  const b = new AudioManager({ sound: host }, () => null);
  assert.equal(b.music, a.music, "scene mới dùng lại bộ phát của context");
  assert.equal(musicPlayerFor(ctx), a.music);
  b.dispose();
}

console.log(`music-test: ${manifest.tracks.length} bài, chọn định dạng, tải lười, mờ chéo, giao chiến, khúc ngắn, tắt tiếng, tải lỗi thử lại đều đạt`);
