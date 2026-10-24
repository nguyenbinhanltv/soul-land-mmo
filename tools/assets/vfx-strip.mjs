// S2 (#548): đọc sheet thô của PixelLab /vfx (lưới nhiều hàng + .json cạnh bên) thành dải một hàng.
import { readFileSync, existsSync } from "node:fs";
import { decodePng } from "./lib.mjs";

/** Sheet thô của PixelLab (lưới nhiều hàng + .json cạnh bên) → dải một hàng. */
export function rawStrip(f) {
  const img = decodePng(readFileSync(f)), jf = f.replace(/\.png$/, ".json");
  if (!existsSync(jf)) return img;
  const fr = JSON.parse(readFileSync(jf, "utf8")).frames, fw = fr[0].frame.w, fh = fr[0].frame.h, o = { w: fw * fr.length, h: fh, data: Buffer.alloc(fw * fr.length * fh * 4) };
  fr.forEach((q, k) => { for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const s = ((q.frame.y + y) * img.w + q.frame.x + x) * 4, d = (y * o.w + k * fw + x) * 4; for (let c = 0; c < 4; c++) o.data[d + c] = img.data[s + c]; } });
  return o;
}
