import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import ffmpegPath from "ffmpeg-static";
import {
  buildManifest,
  renderAudioCredits,
  safeResolve,
  sha256,
  validateCatalog,
  validateAudioCredits,
  validateManifest,
  validateManifestDurations,
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

test("validateCatalog accepts every known license, including SA / GPL / NC", () => {
  for (const license of ["CC-BY-4.0", "CC-BY-SA-4.0", "CC-BY-NC-3.0", "CC-BY-NC-SA-4.0", "OGA-BY-3.0", "GPL-3.0-or-later"]) {
    assert.doesNotThrow(() => validateCatalog({ sources: [{ ...validSource, license }], tracks: [validTrack] }), license);
  }
});

test("validateCatalog rejects unknown licenses and unsafe input paths", () => {
  for (const license of ["CC-BY-ND-4.0", "All rights reserved", "", "cc0"]) {
    assert.throws(
      () => validateCatalog({
        sources: [{ ...validSource, license }],
        tracks: [validTrack],
      }),
      /license/i,
      license,
    );
  }
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
  assert.throws(
    () => validateCatalog({
      sources: [{ ...validSource, author: "Tác giả sai" }, { ...validSource }],
      tracks: [validTrack],
    }),
    /duplicate catalog source/i,
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

  const staleSourceManifest = JSON.parse(JSON.stringify(manifest));
  staleSourceManifest.sources[0].url = "https://example.invalid/replaced-source";
  assert.throws(
    () => validateManifestMatchesCatalog({ catalog, manifest: staleSourceManifest }),
    /source metadata mismatch/i,
  );
  assert.throws(
    () => validateManifestMatchesCatalog({
      catalog,
      manifest: { ...manifest, sources: [] },
    }),
    /missing catalog source/i,
  );
  assert.throws(
    () => validateManifestMatchesCatalog({
      catalog,
      manifest: { ...manifest, sources: [...manifest.sources, { ...validSource, id: "old-source" }] },
    }),
    /extra source/i,
  );

  const duplicateSourceManifest = JSON.parse(JSON.stringify(manifest));
  duplicateSourceManifest.sources = [
    { ...validSource, author: "Tác giả sai" },
    { ...validSource },
  ];
  assert.throws(
    () => validateManifestMatchesCatalog({ catalog, manifest: duplicateSourceManifest }),
    /duplicate manifest source/i,
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

test("validateManifestDurations rejects encoded files shorter than their manifest sprite", () => {
  const manifest = buildManifest({
    catalog: { sources: [validSource], tracks: [validTrack] },
    outputs: [{
      id: validTrack.id,
      files: {
        ogg: { path: "audio/sprites/footsteps.ogg", bytes: 120 },
        m4a: { path: "audio/sprites/footsteps.m4a", bytes: 180 },
      },
      sprite: { name: "footsteps", start: 0, duration: 4.2 },
    }],
  });
  const measured = new Map([
    ["ogg:audio/sprites/footsteps.ogg", 1.23],
    ["m4a:audio/sprites/footsteps.m4a", 4.2],
  ]);
  assert.throws(
    () => validateManifestDurations(manifest, measured),
    /duration mismatch.*ogg/i,
  );
  measured.set("ogg:audio/sprites/footsteps.ogg", 4.2);
  assert.doesNotThrow(() => validateManifestDurations(manifest, measured));
});

test("audio credits must be generated from manifest provenance", () => {
  const manifest = buildManifest({
    catalog: { sources: [validSource], tracks: [validTrack] },
    outputs: [{
      id: validTrack.id,
      files: {
        ogg: { path: "audio/sprites/footsteps.ogg", bytes: 120 },
        m4a: { path: "audio/sprites/footsteps.m4a", bytes: 180 },
      },
      sprite: { name: "footsteps", start: 0, duration: 0.42 },
    }],
  });
  const block = renderAudioCredits(manifest);
  assert.match(block, /shared\/assets\/audio\/sprites\/footsteps\.ogg/);
  assert.match(block, /Kenney/);
  assert.doesNotThrow(() => validateAudioCredits({
    manifest,
    creditsText: `before\n${block}\nafter`,
  }));
  const crlfBlock = block.replaceAll("\n", "\r\n");
  assert.doesNotThrow(() => validateAudioCredits({
    manifest,
    creditsText: `before\r\n${crlfBlock}\r\nafter`,
  }));
  assert.throws(
    () => validateAudioCredits({ manifest, creditsText: `before\n${block.replace("footsteps.ogg", "stale.ogg")}\nafter` }),
    /credits.*mismatch/i,
  );
});

test("audio credits flag SA / GPL / NC licenses", () => {
  const credits = (license) => renderAudioCredits(buildManifest({
    catalog: { sources: [{ ...validSource, license }], tracks: [validTrack] },
    outputs: [{
      id: validTrack.id,
      files: {
        ogg: { path: "audio/sprites/footsteps.ogg", bytes: 120 },
        m4a: { path: "audio/sprites/footsteps.m4a", bytes: 180 },
      },
      sprite: { name: "footsteps", start: 0, duration: 0.42 },
    }],
  }));
  assert.match(credits("CC-BY-SA-4.0"), /CC-BY-SA-4\.0 \(cờ SA\)/);
  assert.match(credits("GPL-3.0-or-later"), /GPL-3\.0-or-later \(cờ GPL\)/);
  assert.match(credits("CC-BY-NC-SA-4.0"), /CC-BY-NC-SA-4\.0 \(cờ SA, NC\)/);
  assert.doesNotMatch(credits("CC-BY-4.0"), /cờ/);
});

test("safeResolve keeps source files inside the selected source root", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "audio-source-"));
  await writeFile(path.join(root, "ok.ogg"), "ok");
  assert.equal(await safeResolve(root, "ok.ogg"), path.join(root, "ok.ogg"));
  await assert.rejects(() => safeResolve(root, "../outside.ogg"), /path/i);
});

test("audio validator rejects a symlink escaping the asset root", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "audio-validator-symlink-"));
  const assetRoot = path.join(root, "assets");
  const catalogPath = path.join(root, "catalog.json");
  const manifestPath = path.join(root, "manifest.json");
  const creditsPath = path.join(root, "CREDITS.md");
  const outsideOgg = path.resolve("shared/assets/audio/sprites/bell.ogg");
  const outsideM4a = path.resolve("shared/assets/audio/sprites/bell.m4a");
  const oggLink = path.join(assetRoot, "audio/escape.ogg");
  const m4aLink = path.join(assetRoot, "audio/escape.m4a");
  try {
    await mkdir(path.dirname(oggLink), { recursive: true });
    try {
      await symlink(outsideOgg, oggLink, "file");
      await symlink(outsideM4a, m4aLink, "file");
    } catch (error) {
      if (process.platform === "win32" && ["EACCES", "EPERM"].includes(error.code)) {
        t.skip("Windows runner does not permit creating symlinks");
        return;
      }
      throw error;
    }
    const catalog = { sources: [validSource], tracks: [validTrack] };
    const manifest = buildManifest({
      catalog,
      outputs: [{
        id: validTrack.id,
        files: {
          ogg: { path: "audio/escape.ogg", bytes: (await stat(outsideOgg)).size },
          m4a: { path: "audio/escape.m4a", bytes: (await stat(outsideM4a)).size },
        },
      }],
    });
    await writeFile(catalogPath, JSON.stringify(catalog));
    await writeFile(manifestPath, JSON.stringify(manifest));
    await writeFile(creditsPath, `# test\n<!-- audio-sfx:start -->\n<!-- audio-sfx:end -->\n`);
    await assert.rejects(
      () => execFileAsync(process.execPath, [
        path.resolve("tools/audio/validate.mjs"),
        "--asset-root", assetRoot,
        "--catalog", catalogPath,
        "--manifest", manifestPath,
        "--credits", creditsPath,
      ]),
      /escapes asset root through symlink/i,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("audio process smoke test handles paths with spaces", async () => {
  assert.ok(ffmpegPath, "ffmpeg-static executable is required");
  const root = await mkdtemp(path.join(os.tmpdir(), "audio process smoke "));
  const sourceRoot = path.join(root, "source files");
  const sourcePath = path.join(sourceRoot, "tone.wav");
  const catalogPath = path.join(root, "catalog.json");
  const manifestPath = path.join(root, "manifest.json");
  const outputRoot = path.join(root, "output files");
  const creditsPath = path.join(root, "CREDITS.md");
  try {
    await mkdir(sourceRoot, { recursive: true });
    await execFileAsync(ffmpegPath, [
      "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi",
      "-i", "anullsrc=r=48000:cl=stereo", "-t", "0.12", "-c:a", "pcm_s16le", sourcePath,
    ]);
    const catalog = {
      sources: [{ ...validSource, id: "smoke-source", title: "Audio smoke source" }],
      tracks: [{
        ...validTrack,
        id: "smoke-tone",
        sourceId: "smoke-source",
        input: "tone.wav",
        inputSha256: sha256(await readFile(sourcePath)),
        group: "events",
        preload: false,
        sprite: "smoke-tone",
      }],
    };
    await writeFile(catalogPath, JSON.stringify(catalog));
    await writeFile(creditsPath, `# test\n<!-- audio-sfx:start -->\n<!-- audio-sfx:end -->\n`);
    await execFileAsync(process.execPath, [
      path.resolve("tools/audio/process.mjs"),
      "--source-root", sourceRoot,
      "--catalog", catalogPath,
      "--manifest", manifestPath,
      "--out", outputRoot,
      "--credits", creditsPath,
    ]);
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    assert.equal(manifest.items.length, 1);
    assert.ok((await stat(path.join(outputRoot, manifest.items[0].files.ogg.path))).size > 0);
    assert.ok((await stat(path.join(outputRoot, manifest.items[0].files.m4a.path))).size > 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
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
