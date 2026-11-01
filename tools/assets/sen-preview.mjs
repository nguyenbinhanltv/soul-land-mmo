// #1551: chỉ xuất ứng viên ngoài repo; chưa đăng ký vào game trước khi chủ repo duyệt.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, Img, readPng, encodePng } from "./lib.mjs";

export function senPreview(out) {
  const originalFile = path.join(ROOT, "shared/assets/sprites/iso/props/sen_phat_sang.png");
  const raw = readFileSync(originalFile), original = readPng(originalFile);
  if (original.w !== 32 || original.h !== 32) throw new Error("Sen gốc đổi cỡ; cần kiểm lại mặt nạ và chân trước khi dựng");
  const sheet = new Img(32 * 32, 32), mask = new Img(32, 32);
  const ramp = [[140,122,92], [201,164,106], [202,202,202], [214,221,229]];
  const thresholds = [0.18, 0.34, 0.5, 0.66, 0.82];
  for (let n = 0; n < 32; n++) {
    const pulse = (1 - Math.cos(n * Math.PI * 2 / 32)) / 2;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const c = original.get(x, y);
      const at = c[3] ? ramp.findIndex(p => p.every((v,i) => v === c[i])) : -1;
      // Chỉ sắc cánh/nhụy phía trên lá; không dịch pixel, không thay alpha hoặc thêm màu.
      const selected = y <= 21 && at >= 0 && at < ramp.length - 1;
      if (selected) mask.set(x,y,[255,255,255,255]);
      const threshold = thresholds[(x * 3 + y * 7) % thresholds.length];
      sheet.set(n * 32 + x, y, selected && pulse > threshold ? [...ramp[at+1],c[3]] : c);
    }
  }
  mkdirSync(out, { recursive: true });
  const sha = b => createHash("sha256").update(b).digest("hex");
  const clip = encodePng(sheet);
  writeFileSync(path.join(out,"RAW.png"),raw);
  writeFileSync(path.join(out,"sen_phat_sang_clip.png"),clip);
  writeFileSync(path.join(out,"mat-na.png"),encodePng(mask));
  const source = { tool: "Codex hậu kỳ pixel bằng code, không sinh model", nativeSize: [32,32], rawSHA256: sha(raw), originalSHA256: sha(raw), clipSHA256: sha(clip), frames: 32, ms: 100, foot: [16,28], prompt: "Giữ thân, chân, alpha, palette; chỉ nhịp sáng nhẹ cánh/nhụy sen, vòng 3,2 giây; khung 0 nguyên bản.", license: "Ảnh ComfyUI (SDXL base 1.0 + pixel-art-xl) cũ đã duyệt giữ nguyên nguồn và giấy phép trong art/CREDITS.md; không gán CC0." };
  writeFileSync(path.join(out,"nguon.json"), JSON.stringify(source,null,2)+"\n");
  writeFileSync(path.join(out,"NGUON.md"), `# Ứng viên sen #1551 — chưa nhập chính thức\n\n${source.prompt}\n\n- Công cụ: ${source.tool}. Không có model, seed hay prompt gửi dịch vụ AI.\n- RAW.png: chép nguyên byte ảnh sen đã duyệt, native 32×32.\n- RAW/gốc SHA256: ${source.rawSHA256}\n- Clip SHA256: ${source.clipSHA256}\n- Chân [16,28], 32 khung × 100 ms. Thân xanh/viền/alpha bất biến.\n- ${source.license}\n- Tái tạo: node tools/assets/sen-preview.mjs <thư-mục-ngoài-repo>\n`);
  return { original, sheet, mask, source };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[2];
  if (!out || path.resolve(out).toLowerCase() === ROOT.toLowerCase() || path.resolve(out).toLowerCase().startsWith(ROOT.toLowerCase()+path.sep)) throw new Error("Chỉ xuất vào thư mục ngoài repo để chờ duyệt");
  senPreview(path.resolve(out));
}

