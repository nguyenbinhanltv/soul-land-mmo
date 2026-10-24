// S2 (#548): đăng ký sheet hậu kỳ (sk_<tên>.png và sk_<tên>_g.png) vào manifest + art/CREDITS.md qua validate.mjs --register.
//   node tools/assets/skill-vfx/reg.mjs [--spec pilot.json] [--only a,b]
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { decodePng, SPRITES } from "../lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d = "") => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const only = opt("--only").split(",").filter(Boolean);
const here = path.dirname(fileURLToPath(import.meta.url)), spec = JSON.parse(readFileSync(path.join(here, opt("--spec", "pilot.json")), "utf8"));
const validate = path.join(here, "..", "validate.mjs");
for (const s of spec.sheets) {
  if (only.length && !only.includes(s.n)) continue;
  for (const glow of [false, true]) {
    const file = path.join(SPRITES, "iso", "fx", `sk_${s.n}${glow ? "_g" : ""}.png`); if (!existsSync(file)) continue;
    const h = decodePng(readFileSync(file)).h, key = `fx_sk_${s.n}${glow ? "_g" : ""}`;
    const prompt = glow ? `Lớp cộng sáng của ${key.replace(/_g$/, "")}: viền đặc 2 điểm quanh điểm sáng nhất, dựng bằng code từ sheet chính (skill-vfx/post.mjs), 0 lượt` : `PixelLab /v2/vfx (lite): ${spec.common} ${spec.vohon[s.v].theme} ${s.d} ${s.f} frames`;
    const r = spawnSync(process.execPath, [validate, "--register", key, "--iso", "--frame", `${h}x${h}`, "--tool", "PixelLab /v2/vfx", "--prompt", prompt, "--note", `Hiệu ứng chiêu ${spec.tag ?? "S2 (#548)"}: nhuộm lại theo thang 7 mức bảng màu võ hồn, alpha 0/255, khung ${h}×${h}. Ảnh thô ở artifacts, không lưu trong repo.`], { stdio: "inherit" });
    if (r.status) process.exit(r.status);
  }
}
