import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import {
  buildManifest,
  safeResolve,
  sha256,
  validateCatalog,
  validateManifest,
  validateManifestMatchesCatalog,
  verifySha256,
} from "./lib.mjs";
import { assertDockerRuntimeBoundary } from "./runtime-check.mjs";

const execFileAsync = promisify(execFile);

const validSource = {
  id: "kenney-rpg-audio",
  title: "RPG Audio",
  author: "Kenney",
  url: "https://kenney.nl/assets/rpg-audio",
  license: "CC0-1.0",
  archiveSha256: "a".repeat(64),
  retrievedAt: "2026-10-21",
};

const validTrack = {
  id: "footstep-co-01",
  sourceId: "kenney-rpg-audio",
  input: "Audio/footstep00.ogg",
  group: "footsteps",
  mapId: null,
  preload: true,
  sprite: "footsteps",
  inputSha256: "b".repeat(64),
};

test("validateCatalog accepts a CC0 source with reproducible provenance", () => {
  assert.doesNotThrow(() => validateCatalog({ sources: [validSource], tracks: [validTrack] }));
});

test("validateCatalog rejects forbidden licenses and unsafe input paths", () => {
  assert.throws(
    () => validateCatalog({
      sources: [{ ...validSource, license: "CC-BY-SA-4.0" }],
      tracks: [validTrack],
    }),
    /license/i,
  );
  assert.throws(
    () => validateCatalog({
      sources: [validSource],
      tracks: [{ ...validTrack, input: "../secret.wav" }],
    }),
    /path/i,
  );
  assert.throws(
    () => validateCatalog({
      sources: [validSource],
      tracks: [{ ...validTrack, mapId: "tinh-dau-rung" }],
    }),
    /unknown game map/i,
  );
  assert.throws(
    () => validateCatalog({
      sources: [validSource],
      tracks: [{ ...validTrack, inputSha256: undefined }],
    }),
    /input SHA-256/i,
  );
  assert.throws(
    () => validateCatalog({
      sources: [validSource],
      tracks: [{ ...validTrack, inputSha256: "not-a-sha" }],
    }),
    /input SHA-256/i,
  );
});

test("verifySha256 rejects replaced source content", () => {
  const source = Buffer.from("original source");
  assert.doesNotThrow(() => verifySha256(source, sha256(source), "track test"));
  assert.throws(
    () => verifySha256(Buffer.from("replaced source"), sha256(source), "track test"),
    /SHA-256 mismatch/i,
  );
});
test("issue catalog covers town, bird, snake and bell gaps", async () => {
  const catalog = JSON.parse(await readFile(new URL("./catalog.json", import.meta.url), "utf8"));
  assert.doesNotThrow(() => validateCatalog(catalog));
  const required = ["town-crowd-ambience", "forest-bird-ambience", "spirit-snake-die", "spirit-bell"];
  for (const id of required) assert.ok(catalog.tracks.some((track) => track.id === id), `missing ${id}`);
  assert.ok(catalog.sources.every((source) => source.license === "CC0-1.0" || source.license.startsWith("CC-BY-")));
});

test("buildManifest records both runtime formats and preload byte budgets", () => {
  const manifest = buildManifest({
    catalog: { sources: [validSource], tracks: [validTrack] },
    outputs: [{
      id: validTrack.id,
      kind: "sprite",
      mapId: null,
      preload: true,
      files: {
        ogg: { path: "audio/sprites/footsteps.ogg", bytes: 120 },
        m4a: { path: "audio/sprites/footsteps.m4a", bytes: 180 },
      },
      sprite: { name: "footsteps", start: 0.05, duration: 0.42 },
    }],
    generatedAt: "2026-10-21T00:00:00.000Z",
  });

  assert.equal(manifest.schemaVersion, 1);
  assert.deepEqual(manifest.preload.bytes, { ogg: 120, m4a: 180 });
  assert.equal(manifest.items[0].files.m4a.path, "audio/sprites/footsteps.m4a");
  assert.doesNotThrow(() => validateManifest(manifest));
});

test("validateManifestMatchesCatalog rejects missing, extra and stale tracks", () => {
  const catalog = { sources: [validSource], tracks: [validTrack] };
  const manifest = buildManifest({
    catalog,
    outputs: [{
      id: validTrack.id,
      files: {
        ogg: { path: "audio/sprites/footsteps.ogg", bytes: 120 },
        m4a: { path: "audio/sprites/footsteps.m4a", bytes: 180 },
      },
    }],
    generatedAt: "2026-10-21T00:00:00.000Z",
  });

  assert.doesNotThrow(() => validateManifestMatchesCatalog({ catalog, manifest }));
  assert.throws(
    () => validateManifestMatchesCatalog({
      catalog,
      manifest: { ...manifest, items: [], preload: { bytes: { ogg: 0, m4a: 0 } } },
    }),
    /missing catalog track/i,
  );
  assert.throws(
    () => validateManifestMatchesCatalog({
      catalog,
      manifest: { ...manifest, items: [...manifest.items, { ...manifest.items[0], id: "old-track" }] },
    }),
    /extra track/i,
  );

  const staleManifest = JSON.parse(JSON.stringify(manifest));
  staleManifest.items[0].group = "old-group";
  assert.throws(
    () => validateManifestMatchesCatalog({ catalog, manifest: staleManifest }),
    /metadata mismatch.*group/i,
  );
});

test("validateManifest rejects an initial download over 2 MiB", () => {
  const manifest = buildManifest({
    catalog: { sources: [validSource], tracks: [validTrack] },
    outputs: [{
      id: validTrack.id,
      kind: "sprite",
      mapId: null,
      preload: true,
      files: {
        ogg: { path: "audio/sprites/footsteps.ogg", bytes: 2 * 1024 * 1024 + 1 },
        m4a: { path: "audio/sprites/footsteps.m4a", bytes: 10 },
      },
      sprite: { name: "footsteps", start: 0, duration: 1 },
    }],
  });

  assert.throws(() => validateManifest(manifest), /2 MiB|preload|budget/i);
});

test("validateManifest recomputes unique preload files before applying the budget", () => {
  const manifest = buildManifest({
    catalog: { sources: [validSource], tracks: [validTrack] },
    outputs: [{
      id: validTrack.id,
      files: {
        ogg: { path: "audio/sprites/footsteps.ogg", bytes: 120 },
        m4a: { path: "audio/sprites/footsteps.m4a", bytes: 180 },
      },
    }],
  });

  const staleManifest = JSON.parse(JSON.stringify(manifest));
  staleManifest.preload.bytes.ogg = 0;
  assert.throws(() => validateManifest(staleManifest), /do not match item files/i);

  const sharedFileManifest = JSON.parse(JSON.stringify(manifest));
  sharedFileManifest.items.push({ ...sharedFileManifest.items[0], id: "footstep-co-02" });
  assert.doesNotThrow(() => validateManifest(sharedFileManifest));
});

test("safeResolve keeps source files inside the selected source root", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "audio-source-"));
  await writeFile(path.join(root, "ok.ogg"), "ok");
  assert.equal(await safeResolve(root, "ok.ogg"), path.join(root, "ok.ogg"));
  await assert.rejects(() => safeResolve(root, "../outside.ogg"), /path/i);
});

test("Docker runtime boundary keeps ffmpeg out of the runtime image", async () => {
  await assertDockerRuntimeBoundary({
    dockerfilePath: path.resolve("Dockerfile"),
    dockerignorePath: path.resolve(".dockerignore"),
  });
});

test("audio preview rejects manifest paths outside the asset root", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "audio-preview-"));
  const assetRoot = path.join(root, "assets");
  const manifestPath = path.join(root, "manifest.json");
  const outputPath = path.join(root, "preview", "index.html");
  await writeFile(manifestPath, JSON.stringify({
    schemaVersion: 1,
    preload: { bytes: { ogg: 0, m4a: 0 } },
    items: [{
      id: "unsafe-track",
      preload: false,
      files: {
        ogg: { path: "../../outside.ogg", bytes: 0 },
        m4a: { path: "../../outside.m4a", bytes: 0 },
      },
    }],
  }));

  await assert.rejects(
    () => execFileAsync(process.execPath, [
      path.resolve("tools/audio/preview.mjs"),
      "--asset-root", assetRoot,
      "--manifest", manifestPath,
      "--out", outputPath,
    ]),
    /safe relative path|escapes its root/i,
  );
});
