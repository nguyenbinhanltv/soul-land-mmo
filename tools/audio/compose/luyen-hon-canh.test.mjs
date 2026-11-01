import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import song from "./songs/luyen_hon_canh.mjs";
import songs from "./songs/index.mjs";

const asset = (p) => new URL(`../../../shared/assets/audio/music/${p}`, import.meta.url);
const manifest = JSON.parse(readFileSync(asset("manifest.json")));

test("Luyện Hồn Cảnh nhận bài riêng; Đại Đấu Hồn Trường giữ bài cũ", () => {
  assert.deepEqual(song.maps, ["luyen_hon_canh"]);
  assert.equal(songs.filter((s) => s.id === song.id).length, 1);
  for (const id of ["luyen_hon_canh", "dai_dau_hon_truong"]) {
    assert.deepEqual(manifest.tracks.filter((t) => t.maps?.includes(id)).map((t) => t.id), [id]);
    assert.deepEqual(songs.find((s) => s.id === id).maps, [id]);
  }
  const samples = song.bars * song.beatsPerBar * 60 / song.bpm * 44100;
  assert.equal(samples, 4515840);
  assert.equal(samples % 1024, 0);
  assert.ok(song.notes.every((n) => n.t >= 0 && n.t + n.d <= 128));
});

test("File runtime giữ nguyên byte và SHA256 bản RAW đã được chủ repo duyệt", () => {
  const hashes = {
    ogg: "0adff81cad196ffcd73dfab36deac932046d70720a6653acb817ed30323281b9",
    m4a: "ca84ee3d69e15bde2c4a4bcc5d5cbd008648514639ddd1cf7c39642ad7cf2872",
  };
  const track = manifest.tracks.find((t) => t.id === song.id);
  for (const [ext, hash] of Object.entries(hashes)) {
    const bytes = readFileSync(asset(`${song.id}.${ext}`));
    const raw = readFileSync(new URL(`../../../art/src/audio/luyen_hon_canh/${song.id}.${ext}`, import.meta.url));
    assert.ok(bytes.equals(raw));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), hash);
    assert.equal(track.files[ext].bytes, bytes.length);
    assert.equal(track.files[ext].path, `audio/music/${song.id}.${ext}`);
  }
});
