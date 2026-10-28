// Phần thuần của dây chuyền hiệu ứng G2 (#393): kiểm catalog, dựng manifest, bảng ghi công. process-sfx / validate-sfx / test dùng chung.
import { ALLOWED_LICENSES, licenseFlags, stableJson } from "./lib.mjs";

export const SFX_FORMATS = ["ogg", "m4a"];
export const SFX_MAX_TOTAL_BYTES = 8 * 1024 * 1024;
export const SFX_CREDITS_START = "<!-- audio-sfx-g2:start -->";
export const SFX_CREDITS_END = "<!-- audio-sfx-g2:end -->";
export const SFX_PACKS = ["combat", "skill", "beast", "world", "steps", "amb", "ui", "pk"];
export const T3_SKILL_IDS = [
  "cuu_tinh_that_sat_kiem", "lam_dien_ba_vuong_long", "ky_nhung_thong_thien_cuc", "ta_hoa_phuong_hoang", "u_minh_linh_mieu",
  "nguyet_nhan", "hoa_long", "nhu_cot_tho", "kim_vu_mieu_ung", "tu_vong_chu_hoang", "bich_lan_xa_hoang", "can_khon_hon_nguyen_toa",
  "hoa_anh", "yeu_ho", "xuc_xich", "quy_mi", "thien_can_bach_ngoc_dinh", "lam_ngan_thao", "hao_thien_chuy", "cuu_bao_luu_ly_thap",
  "pha_hon_thuong", "a_ngan", "liet_hoa_thuong_lang", "bang_phuong_hoang", "bach_ho",
];
const T3_PHASES = ["start", "fly", "boom"];
const t3Groups = (kind, id) => T3_PHASES.map((phase) => `skill-t3-${kind}-${id.replaceAll("_", "-")}-${phase}`);
const t3RequiredGroups = T3_SKILL_IDS.flatMap((id) => [...t3Groups("ult", id), ...t3Groups("ct", id), `skill-t3-avatar-${id.replaceAll("_", "-")}`]);
/** Nhóm bắt buộc có trong catalog (tên nhóm = id phát ở client, client/src/audio/soundMap.ts). Mỗi nhóm đủ số biến thể tối thiểu. */
export const SFX_REQUIRED = {
  ...Object.fromEntries(["kiem", "chuy", "thuong", "trao", "quyen"].map((k) => [`swing-${k}`, 3])),
  ...Object.fromEntries(["thit", "giap", "bang", "go"].map((k) => [`hit-${k}`, 3])),
  ...Object.fromEntries(["fire", "ice", "lightning", "poison", "light", "dark", "wood", "wind"].flatMap((e) => ["start", "fly", "boom"].map((p) => [`skill-${e}-${p}`, 1]))),
  "ring-glow": 2, "ring-absorb": 2, "ring-drop": 2,
  ...Object.fromEntries(["lang", "hung", "bao", "xa", "chim", "trung", "thiem", "thuc"].map((f) => [`beast-${f}`, 2])),
  "beast-boss": 3, "beast-die": 3,
  ...Object.fromEntries(["co", "dat", "da", "tuyet", "go", "nuoc"].map((s) => [`step-${s}`, 3])),
  // Lô 2 (G5, #396): môi trường lớp chồng, giao diện, PK
  "amb-wind": 3, "amb-wave": 3, "amb-bird": 3, "amb-cricket": 3, "amb-fire": 3, "amb-bell": 2,
  ...Object.fromEntries(["open", "close", "drag", "drop", "equip", "enhance-ok", "enhance-fail", "rare"].map((k) => [`ui-${k}`, 2])),
  // Đợt 1c UI v2 (#599): bấm nút, lỗi / từ chối, nhận thưởng, toast
  ...Object.fromEntries(["click", "error", "reward", "notify"].map((k) => [`ui-${k}`, 2])),
  "pk-open": 2, "pk-count": 3, "pk-go": 1, "pk-kill": 2, "pk-heartbeat": 2,
};

const SAFE_ID = /^[a-z0-9][a-z0-9-]*$/;
const fail = (message) => { throw new Error(message); };

export function validateSfxCatalog(catalog) {
  if (!catalog || !Array.isArray(catalog.sources) || !Array.isArray(catalog.clips)) fail("sfx-catalog phải có sources và clips");
  const sources = new Map();
  for (const s of catalog.sources) {
    if (!SAFE_ID.test(s.id ?? "")) fail(`nguồn có id không hợp lệ: ${s.id}`);
    if (sources.has(s.id)) fail(`nguồn trùng ${s.id}`);
    for (const f of ["title", "author", "url"]) if (typeof s[f] !== "string" || !s[f].trim()) fail(`nguồn ${s.id} thiếu ${f}`);
    if (!ALLOWED_LICENSES.has(s.license)) fail(`nguồn ${s.id}: giấy phép ${s.license} chưa được duyệt`);
    if (!/^[a-f0-9]{64}$/.test(s.archiveSha256 ?? "")) fail(`nguồn ${s.id} thiếu SHA-256 gói`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.retrievedAt ?? "")) fail(`nguồn ${s.id} có ngày tải sai`);
    sources.set(s.id, s);
  }
  const ids = new Set(), perGroup = new Map();
  for (const c of catalog.clips) {
    if (!SAFE_ID.test(c.id ?? "") || !SAFE_ID.test(c.group ?? "")) fail(`clip ${c.id} có id / nhóm không hợp lệ`);
    if (ids.has(c.id)) fail(`clip trùng ${c.id}`);
    ids.add(c.id);
    if (!SFX_PACKS.includes(c.pack)) fail(`clip ${c.id}: gói ${c.pack} lạ`);
    if (!sources.has(c.sourceId)) fail(`clip ${c.id}: nguồn ${c.sourceId} không có trong catalog`);
    if (!c.input || c.input.startsWith("/") || c.input.split(/[\\/]/).includes("..")) fail(`clip ${c.id}: đường dẫn nguồn không an toàn`);
    if (!/^[a-f0-9]{64}$/.test(c.inputSha256 ?? "")) fail(`clip ${c.id} thiếu SHA-256 tệp nguồn`);
    for (const f of ["gainDb", "pitch", "lowpass", "highpass", "echoMs", "maxSeconds", "startSeconds", "fadeIn", "fadeOut"]) if (c[f] !== undefined && !Number.isFinite(c[f])) fail(`clip ${c.id}: ${f} không phải số`);
    if (c.pitch !== undefined && (c.pitch < 0.25 || c.pitch > 4)) fail(`clip ${c.id}: pitch ngoài 0.25–4`);
    perGroup.set(c.group, (perGroup.get(c.group) ?? 0) + 1);
  }
  for (const [group, min] of Object.entries(SFX_REQUIRED)) if ((perGroup.get(group) ?? 0) < min) fail(`nhóm ${group} cần ít nhất ${min} biến thể`);
  for (const group of t3RequiredGroups) {
    if ((perGroup.get(group) ?? 0) !== 1) fail(`nhóm T3 ${group} phải có đúng 1 clip`);
    const clip = catalog.clips.find((c) => c.group === group);
    if (clip.t3 !== true || clip.noVoice !== true) fail(`clip T3 ${clip.id} thiếu cờ T3 / không tiếng hô`);
  }
  return true;
}

export function buildSfxManifest({ catalog, packs, clips, generatedAt }) {
  validateSfxCatalog(catalog);
  return {
    schemaVersion: 1, generatedAt, pipeline: "tools/audio/process-sfx.mjs@1",
    sources: catalog.sources, packs, clips,
  };
}

export function validateSfxManifest(manifest, catalog) {
  if (manifest?.schemaVersion !== 1 || !Array.isArray(manifest.clips) || !manifest.packs) fail("sfx manifest sai khung");
  let total = 0;
  for (const [name, pack] of Object.entries(manifest.packs)) {
    if (!SFX_PACKS.includes(name)) fail(`gói lạ ${name}`);
    for (const f of SFX_FORMATS) {
      const file = pack.files?.[f];
      if (!file || !Number.isInteger(file.bytes) || file.bytes <= 0 || !/^sfx\/[a-z0-9-]+\.(ogg|m4a)$/.test(file.path)) fail(`gói ${name}: tệp ${f} sai`);
      if (f === "ogg") total += file.bytes;
    }
  }
  const byFormat = (f) => Object.values(manifest.packs).reduce((n, p) => n + p.files[f].bytes, 0);
  for (const f of SFX_FORMATS) if (byFormat(f) > SFX_MAX_TOTAL_BYTES) fail(`tổng ${f} vượt 8 MB`);
  const catalogClips = new Map(catalog.clips.map((c) => [c.id, c]));
  if (catalogClips.size !== manifest.clips.length) fail("số clip manifest khác catalog");
  for (const c of manifest.clips) {
    const src = catalogClips.get(c.id);
    if (!src) fail(`manifest thừa clip ${c.id}`);
    if (src.group !== c.group || src.pack !== c.pack || src.sourceId !== c.sourceId) fail(`clip ${c.id} lệch catalog`);
    if (!manifest.packs[c.pack]) fail(`clip ${c.id}: gói ${c.pack} không có`);
    if (!(c.start >= 0) || !(c.duration > 0) || c.start + c.duration > manifest.packs[c.pack].duration + 0.001) fail(`clip ${c.id}: vị trí / thời lượng sai`);
  }
  const sourcesJson = stableJson(manifest.sources), expected = stableJson(catalog.sources);
  if (sourcesJson !== expected) fail("nguồn trong manifest lệch catalog");
  return { totalBytes: total };
}

const cell = (v) => String(v).replaceAll("|", "\\|");

export function renderSfxCredits(manifest) {
  const sourceById = new Map(manifest.sources.map((s) => [s.id, s]));
  const rows = Object.keys(manifest.packs).sort().map((name) => {
    const clips = manifest.clips.filter((c) => c.pack === name);
    const sources = [...new Set(clips.map((c) => c.sourceId))].map((id) => sourceById.get(id)).sort((a, b) => a.id.localeCompare(b.id));
    const licenses = [...new Set(sources.map((s) => s.license))].map((l) => { const fl = licenseFlags(l); return fl.length ? `${l} (cờ ${fl.join(", ")})` : l; }).join("<br>");
    const authors = [...new Set(sources.map((s) => s.author))].join("<br>");
    const prov = sources.map((s) => `${s.title} — <${s.url}> — SHA-256 \`${s.archiveSha256}\``).join("<br>");
    const groups = [...new Set(clips.map((c) => c.group))].join(", ");
    const files = SFX_FORMATS.map((f) => `\`shared/assets/audio/${manifest.packs[name].files[f].path}\``).join("<br>");
    return `| ${files} | ${cell(groups)} | ${cell(authors)} | ${licenses} | ${prov} |`;
  });
  return [SFX_CREDITS_START, "| Tệp output | Nhóm tiếng | Tác giả | Giấy phép | Provenance |", "|---|---|---|---|---|", ...rows, SFX_CREDITS_END].join("\n");
}

const nl = (s) => String(s).replaceAll("\r\n", "\n");

export function replaceSfxCredits(text, manifest) {
  const t = nl(text), a = t.indexOf(SFX_CREDITS_START), b = t.indexOf(SFX_CREDITS_END);
  if (a < 0 || b < a) fail("thiếu marker audio-sfx-g2 trong CREDITS");
  return `${t.slice(0, a)}${renderSfxCredits(manifest)}${t.slice(b + SFX_CREDITS_END.length)}`;
}

export function validateSfxCredits(text, manifest) {
  const t = nl(text), a = t.indexOf(SFX_CREDITS_START), b = t.indexOf(SFX_CREDITS_END);
  if (a < 0 || b < a) fail("thiếu marker audio-sfx-g2 trong CREDITS");
  if (t.slice(a, b + SFX_CREDITS_END.length) !== renderSfxCredits(manifest)) fail("bảng ghi công SFX lệch manifest (chạy npm run audio:sfx)");
  return true;
}

export { stableJson, t3RequiredGroups };
