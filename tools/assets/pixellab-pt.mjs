// Gọi PixelLab REST v2 cho pháp tướng Võ Hồn Chân Thân (#482; công thức chuẩn ở docs/art/phap-tuong-cong-thuc.md). Mỗi lệnh đo /v2/balance
// trước và sau để biết số lượt thật. Key đọc từ file lúc chạy (PIXELLAB_KEY_FILE, mặc định ~/.config/pixellab/api-key.txt), không in, không ghi.
//   node tools/assets/pixellab-pt.mjs concept --id <mã> --desc "<mô tả>" [--seed N]
//        create-image-pixflux 128×128 hướng nam, nền trong suốt → art/src/pixellab/phap_tuong/<mã>/concept.png
//   node tools/assets/pixellab-pt.mjs rot --id <mã> [--desc "<mô tả ngắn>"]
//        generate-8-rotations-v3 từ concept.png → rot/0..7.png (thứ tự trả về: sw, s, se, e, ne, n, nw, w)
//   node tools/assets/pixellab-pt.mjs anim --id <mã> --dir s|se|e|ne|n --anim idle|attack --action "<chuyển động>"
//        animate-with-text-v3 8 khung từ rot/<hướng>.png → <hướng>_<anim>_00..07.png (bỏ khung 9, trùng khung đầu)
//   node tools/assets/pixellab-pt.mjs map --id <mã> --map s=7,se=0,e=1,ne=2,n=3
//        chọn lại 5 hướng từ rot/0..7.png (0 lượt): thứ tự 8 ảnh xoay đổi theo con vật (P2 #487: báo, hồ, sói, hổ lệch 2 bước so với H1), xem bằng mắt rồi ghi xoay.dung ở recipe.json
//   node tools/assets/pixellab-pt.mjs balance
// Vật cứng (búa, tháp...) không cần `anim`: phaptuong.mjs --code idle,attack dựng thở / đánh bằng code (0 lượt).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { ROOT, ISO_DIRS } from "./lib.mjs";

const args = process.argv.slice(2), cmd = args.shift();
const opt = (n, d = "") => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const fail = (m) => { console.error(`[pixellab-pt] ${m}`); process.exit(1); };
const KEY = readFileSync(opt("--key-file", process.env.PIXELLAB_KEY_FILE ?? path.join(os.homedir(), ".config", "pixellab", "api-key.txt")), "utf8").trim();
const BASE = "https://api.pixellab.ai/v2", H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
/** Thứ tự 8 ảnh của generate-8-rotations-v3 (đã đối chiếu bằng mắt, H1 #485) → chỉ số của 5 hướng vẽ. */
const ROT_INDEX = { s: 1, se: 2, e: 3, ne: 4, n: 5 };

async function api(method, p, body) {
  const r = await fetch(BASE + p, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) fail(`${p} ${r.status} ${JSON.stringify(j).slice(0, 300)}`);
  return j;
}
const generations = async () => (await api("GET", "/balance")).subscription?.generations;
const b64 = (f) => ({ type: "base64", base64: readFileSync(f).toString("base64"), format: "png" });
const png = (im) => Buffer.from(String(im.base64 ?? im.image?.base64).replace(/^data:image\/\w+;base64,/, ""), "base64");

/** Chạy một lệnh (đồng bộ hoặc job nền), in lượt dùng: usage của lệnh và chênh số dư (số dư có thể cập nhật trễ vài giây). */
async function run(label, p, body) {
  const before = await generations(), t0 = Date.now();
  let res = await api("POST", p, body);
  const job = res.background_job_id ?? res.data?.background_job_id;
  if (job) for (;;) {
    await new Promise((r) => setTimeout(r, 5000));
    res = await api("GET", `/background-jobs/${job}`);
    if (res.status === "completed") break;
    if (res.status === "failed") fail(`${label} lỗi: ${JSON.stringify(res.last_response).slice(0, 300)}`);
    if (Date.now() - t0 > 20 * 60000) fail(`${label} quá 20 phút`);
  }
  const out = res.last_response ?? res;
  const after = await generations();
  console.log(`[pixellab-pt] ${label}: usage=${out.usage?.generations ?? "?"} số dư ${before} → ${after} (${Math.round((Date.now() - t0) / 1000)}s, seed ${out.seed ?? "?"})`);
  return out;
}

const id = opt("--id");
const dir = id && path.join(ROOT, "art", "src", "pixellab", "phap_tuong", id);
const need = (v, n) => v || fail(`thiếu ${n}`);
if (cmd === "balance") console.log(await generations());
else if (cmd === "concept") {
  need(id, "--id");
  const out = await run(`concept ${id}`, "/create-image-pixflux", { description: need(opt("--desc"), "--desc"), image_size: { width: 128, height: 128 }, no_background: true, view: "low top-down", direction: "south",
    outline: "single color black outline", shading: "medium shading", detail: "medium detail", text_guidance_scale: 8, seed: +opt("--seed", "0") });
  mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, "concept.png"), png(out.image));
} else if (cmd === "rot") {
  need(id, "--id");
  const out = await run(`rot ${id}`, "/generate-8-rotations-v3", { first_frame: b64(path.join(dir, "concept.png")), description: opt("--desc") || undefined, no_background: true });
  mkdirSync(path.join(dir, "rot"), { recursive: true });
  out.images.forEach((im, i) => writeFileSync(path.join(dir, "rot", `${i}.png`), png(im)));
  for (const [d, i] of Object.entries(ROT_INDEX)) writeFileSync(path.join(dir, `${d}.png`), readFileSync(path.join(dir, "rot", `${i}.png`)));
} else if (cmd === "map") {
  need(id, "--id");
  const m = Object.fromEntries(need(opt("--map"), "--map").split(",").map((kv) => kv.split("=")));
  for (const d of ISO_DIRS) writeFileSync(path.join(dir, `${d}.png`), readFileSync(path.join(dir, "rot", `${need(m[d], `--map ${d}=`)}.png`)));
} else if (cmd === "anim") {
  need(id, "--id");
  const d = opt("--dir"), an = opt("--anim");
  if (!ISO_DIRS.includes(d) || !["idle", "attack"].includes(an)) fail("--dir s|se|e|ne|n, --anim idle|attack");
  const out = await run(`anim ${id} ${d} ${an}`, "/animate-with-text-v3", { first_frame: b64(path.join(dir, `${d}.png`)), action: need(opt("--action"), "--action"), frame_count: 8, no_background: true });
  out.images.slice(0, 8).forEach((im, i) => writeFileSync(path.join(dir, `${d}_${an}_${String(i).padStart(2, "0")}.png`), png(im)));
} else fail("Lệnh: concept | rot | map | anim | balance (xem đầu file)");
