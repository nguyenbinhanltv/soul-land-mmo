// Sương mù khám phá phía client (GAME_DESIGN.md mục 5.17, R8 #435). Chỉ hiển thị: server quyết định ô nào đã khám phá (tin riêng `fog` cả bitset khi
// vào bản đồ, `fogd` phần mới), client giữ bản sao, vẽ một lớp mờ (mỗi ô thô một điểm ảnh, phóng bằng làm mịn nên mép mềm) lên nền radar và bản đồ
// khu vực. Bản đồ trong `FOG.open` không có sương; chưa nhận bitset thì không che gì (khỏi chớp tối lúc mới vào).
import { FOG } from "../../shared/data.ts";
import { fogDims, fogGet, fogSet, fogBytes, fogCells, fogValid, fogOn, type FogDims } from "../../shared/fog.ts";
import { fxPrefs } from "./combatFx.ts";

/** Màu lớp mờ (mực loãng) và độ đậm của ô chưa khám phá. */
const INK = [11, 20, 16], ALPHA = 215;

class Fog {
  private key = ""; private d: FogDims = fogDims(1, 1); private on = false;
  private bits: Uint8Array | null = null;
  private cv: HTMLCanvasElement | null = null; private img: ImageData | null = null;
  /** Ô đang sáng dần: số ô → thời điểm bắt đầu (ms). */
  private fade = new Map<number, number>();
  private dirty = false;

  /** Báo bản đồ đang đứng (gọi khi dựng cảnh): cỡ theo ô lưới. Đổi bản đồ thì bỏ dữ liệu cũ. */
  setMap(key: string, w: number, h: number) {
    this.key = key; this.d = fogDims(w, h); this.on = fogOn(key); this.bits = null; this.fade.clear(); this.cv = null; this.img = null; this.dirty = false;
  }
  /** Có sương mù và đã có dữ liệu (đang che). */
  get active() { return this.on && this.bits !== null; }

  /** Tin `fog`: cả bitset. Dữ liệu sai dạng (kiểu, độ dài, bit thừa) thì bỏ. */
  setFull(raw: unknown) {
    if (!this.on) return;
    const b = fogBytes(raw); if (!b || !fogValid(b, this.d)) return;
    this.bits = b; this.fade.clear(); this.img = null; this.cv = null; this.dirty = true;
  }
  /** Tin `fogd`: các ô vừa mở. Chưa có bitset đầy đủ thì bỏ (server sẽ gửi cả bitset khi xin). */
  add(raw: unknown, now = performance.now()) {
    if (!this.on || !this.bits) return;
    const smooth = !fxPrefs.reduce && fxPrefs.level !== "low";
    for (const i of fogCells(raw, this.d)) if (fogSet(this.bits, this.d, i)) { if (smooth) this.fade.set(i, now); this.dirty = true; }
  }

  /** Ô thô chứa điểm (tx, ty) (ô lưới) đã khám phá chưa; bản đồ mở sẵn / chưa có dữ liệu thì coi như đã khám phá. */
  explored(tx: number, ty: number) {
    if (!this.active) return true;
    const cx = Math.floor(tx / FOG.cell), cy = Math.floor(ty / FOG.cell);
    if (cx < 0 || cy < 0 || cx >= this.d.cw || cy >= this.d.ch) return false;
    return fogGet(this.bits!, cy * this.d.cw + cx);
  }

  /** Dựng / cập nhật ảnh mờ (một điểm ảnh mỗi ô thô). Trả canvas, hoặc null nếu không che gì. */
  private mask(now: number): HTMLCanvasElement | null {
    if (!this.active) return null;
    const { cw, ch } = this.d, bits = this.bits!;
    if (!this.cv) {
      this.cv = document.createElement("canvas"); this.cv.width = cw; this.cv.height = ch;
      this.img = this.cv.getContext("2d")!.createImageData(cw, ch); this.dirty = true;
      for (let i = 0; i < cw * ch; i++) { const o = i * 4; this.img.data[o] = INK[0]; this.img.data[o + 1] = INK[1]; this.img.data[o + 2] = INK[2]; }
      for (let i = 0; i < cw * ch; i++) this.img.data[i * 4 + 3] = fogGet(bits, i) ? 0 : ALPHA;
    }
    if (this.fade.size) {
      for (const [i, t0] of this.fade) {
        const k = Math.min(1, (now - t0) / FOG.fadeMs); this.img!.data[i * 4 + 3] = Math.round(ALPHA * (1 - k * k * (3 - 2 * k)));
        if (k >= 1) this.fade.delete(i);
      }
      this.dirty = true;
    } else if (this.dirty) { // ô vừa mở mà không làm sáng dần (Giảm chuyển động / hiệu ứng Thấp): đổi ngay
      for (let i = 0; i < cw * ch; i++) this.img!.data[i * 4 + 3] = fogGet(bits, i) ? 0 : ALPHA;
    }
    if (this.dirty) { this.cv.getContext("2d")!.putImageData(this.img!, 0, 0); this.dirty = false; }
    return this.cv;
  }
  /** Vẽ lớp mờ trong hệ toạ độ ô lưới (gốc bản đồ ở (0, 0)); nơi gọi đã áp phép chiếu. Làm mịn bật tạm để mép giữa ô mềm. */
  draw(ctx: CanvasRenderingContext2D, now = performance.now()) {
    const m = this.mask(now); if (!m) return;
    const was = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.drawImage(m, 0, 0, this.d.cw * FOG.cell, this.d.ch * FOG.cell);
    ctx.imageSmoothingEnabled = was;
  }
}

let inst: Fog | null = null;
/** Sương mù duy nhất của trang (một bản đồ mỗi lần). */
export const fog = () => inst ??= new Fog();
