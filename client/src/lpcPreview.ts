// Xem trước hồn sư chế độ Tự tạo ở màn tạo nhân vật / thợ may (L4 #511). Dùng cùng bộ ghép khung với trong game (lpcRig.ts: layerSpecs,
// tintImage, flattenFrame; bố cục sheet LPC_SHEET) nhưng không cần Phaser: tự tải sheet từng món, tô màu, ghép từng khung ra một canvas
// 64×64 và chạy hoạt ảnh (đứng, đi, đánh, thi triển) theo bốn hướng LPC (xuống, phải, lên, trái = phải lật ngang).
import { LPC_SHEET, type LpcLooks } from "../../shared/data.ts";
import { layerSpecs, tintImage, flattenFrame, type Spec } from "./lpcRig.ts";
import { ISO_HS_FRAME } from "./sprites.ts";

const F = ISO_HS_FRAME;
export type PreviewAnim = "idle" | "walk" | "attack" | "cast";
export type PreviewDir = "s" | "e" | "n" | "w";
export const PREVIEW_DIRS: PreviewDir[] = ["s", "e", "n", "w"];

// Sheet gốc và sheet đã tô màu dùng chung giữa các lần đổi lựa chọn; quá ngưỡng thì bỏ bản tô màu cũ (sheet gốc nhỏ, giữ lại).
const raw = new Map<string, Promise<HTMLImageElement | null>>();
const tinted = new Map<string, HTMLCanvasElement | HTMLImageElement>();
const TINT_KEEP = 160;
const loadRaw = (sheet: string) => {
  let p = raw.get(sheet);
  if (!p) {
    p = new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = `lpcparts/${sheet}.png`; });
    raw.set(sheet, p);
  }
  return p;
};

export class LpcPreview {
  private specs: Spec[] = [];
  private imgs: (CanvasImageSource | null)[] = [];
  private gen = 0;
  private anim: PreviewAnim = "idle";
  private dir: PreviewDir = "s";
  private spinning = true;
  private spinAt = 0;
  private t0 = 0;
  private raf = 0;
  private lastKey = "";
  private tmp = document.createElement("canvas");
  private tctx: CanvasRenderingContext2D;
  private ctx: CanvasRenderingContext2D;

  /** `cv`: canvas hiển thị (đặt width / height = 64; CSS phóng to, pixelated). */
  constructor(private cv: HTMLCanvasElement) {
    this.tmp.width = this.tmp.height = F;
    this.tctx = this.tmp.getContext("2d", { willReadFrequently: true })!;
    this.ctx = cv.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.t0 = performance.now(); this.spinAt = this.t0;
    const loop = (t: number) => { this.raf = requestAnimationFrame(loop); this.tick(t); };
    this.raf = requestAnimationFrame(loop);
  }

  /** Đổi ngoại hình: tải / tô màu các sheet còn thiếu (hiện dần khi xong). */
  setLooks(l: LpcLooks) {
    const specs = layerSpecs(l), gen = ++this.gen;
    this.specs = specs; this.imgs = specs.map(() => null); this.lastKey = "";
    specs.forEach((s, i) => {
      const key = `${s.sheet}#${s.tint}`, hit = tinted.get(key);
      if (hit) { this.imgs[i] = hit; return; }
      void loadRaw(s.sheet).then((im) => {
        if (!im) return;
        let out: HTMLCanvasElement | HTMLImageElement = im;
        if (s.pairs.length) {
          if (tinted.size > TINT_KEEP) tinted.clear();
          out = tintImage(im, s.pairs);
        }
        tinted.set(key, out);
        if (gen === this.gen) { this.imgs[i] = out; this.lastKey = ""; }
      });
    });
  }

  setAnim(a: PreviewAnim) { if (a !== this.anim) { this.anim = a; this.t0 = performance.now(); this.lastKey = ""; } }
  setDir(d: PreviewDir) { this.dir = d; this.spinning = false; this.lastKey = ""; }
  /** Bật / tắt tự xoay bốn hướng. */
  spin(on: boolean) { this.spinning = on; this.spinAt = performance.now(); }
  isSpinning() { return this.spinning; }
  currentDir() { return this.dir; }
  destroy() { cancelAnimationFrame(this.raf); this.gen++; }

  private tick(now: number) {
    if (this.spinning && now - this.spinAt > 1400) { this.spinAt = now; this.dir = PREVIEW_DIRS[(PREVIEW_DIRS.indexOf(this.dir) + 1) % 4]; this.onDir?.(this.dir); }
    const A = LPC_SHEET.anims[this.anim], ms = A.ms, total = ms.reduce((a, b) => a + b, 0);
    // Đánh / thi triển chạy một lượt rồi đứng nghỉ nửa giây, rồi lặp (xem trước, không phải trận thật).
    let t = (now - this.t0) % (A.loop ? total : total + 600), i = 0;
    for (; i < ms.length - 1 && t >= ms[i]; i++) t -= ms[i];
    const key = `${this.anim}|${this.dir}|${i}|${this.gen}|${this.imgs.filter(Boolean).length}`;
    if (key === this.lastKey) return;
    this.lastKey = key;
    // Bộ thiếu idle: đứng bằng khung đi đầu tiên (như bộ ghép trong game).
    const fallback = this.anim === "idle" && !this.specs.every((s) => s.idle);
    const st = fallback ? LPC_SHEET.strips.walk : LPC_SHEET.strips[A.strip as keyof typeof LPC_SHEET.strips];
    const rows = LPC_SHEET.rows, row = this.dir === "s" ? rows.s : this.dir === "n" ? rows.n : rows.e;
    flattenFrame(this.tctx, this.imgs, st.col + (fallback ? 0 : A.idx[i]), row);
    const c = this.ctx;
    c.clearRect(0, 0, F, F);
    if (this.dir === "w") { c.save(); c.translate(F, 0); c.scale(-1, 1); c.drawImage(this.tmp, 0, 0); c.restore(); } else c.drawImage(this.tmp, 0, 0);
  }

  /** Nơi nhận tin khi hướng tự xoay (để cập nhật nút hướng). */
  onDir: ((d: PreviewDir) => void) | null = null;
}
