import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import song from "./candidates/luyen_hon_canh.mjs";
import songs from "./songs/index.mjs";

test("Ứng viên chỉ dành Luyện Hồn Cảnh, chưa tham gia danh mục đang chạy", () => {
  assert.deepEqual(song.maps, ["luyen_hon_canh"]);
  assert.ok(!songs.some((s) => s.id === song.id));
  const manifest = JSON.parse(readFileSync(new URL("../../../shared/assets/audio/music/manifest.json", import.meta.url)));
  assert.deepEqual(manifest.tracks.filter((t) => t.maps?.includes("luyen_hon_canh")).map((t) => t.id), ["dai_dau_hon_truong"]);
  const samples = song.bars * song.beatsPerBar * 60 / song.bpm * 44100;
  assert.equal(samples, 4515840);
  assert.equal(samples % 1024, 0);
  assert.ok(song.notes.every((n) => n.t >= 0 && n.t + n.d <= 128));
});

test("Chế độ ứng viên từ chối đầu ra mặc định trước khi render", () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL("./compose.mjs", import.meta.url)),
    "--candidate", "--soundfont", fileURLToPath(new URL("./README.md", import.meta.url))], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Bản nghe thử phải xuất ngoài shared\/assets/);
});
