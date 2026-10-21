// Atlas ảnh bản đồ cho Light2D (bước 10.7). Pipeline ánh sáng của Phaser chỉ gom các ảnh cùng một texture (và cùng normal map) vào
// một lần vẽ, nên mỗi ô nền / lớp phủ mép / vật đứng mang texture riêng làm số lần vẽ tăng vọt (đo ở Tinh Đấu Nội địa: khoảng 1.100
// lần mỗi khung so với 29 khi không có ánh sáng). IsoMap chép mọi ảnh của bản đồ vào một canvas lớn (xếp theo kệ) cùng một canvas
// normal map xếp y hệt (ảnh không có normal map thì phẳng), rồi đặt ảnh theo khung của atlas. Chỉ dùng khi ánh sáng bật.
import Phaser from "phaser";

/** Cạnh atlas (pixel): 2048 vừa mọi máy WebGL; ảnh không còn chỗ thì giữ texture riêng (vẫn vẽ đúng, chỉ không gom được). */
const SIZE = 2048, PAD = 2;
/** Màu pháp tuyến phẳng (hướng ra màn hình). */
const FLAT = "rgb(128,128,255)";

export class IsoAtlas {
  readonly key: string;
  private cv: HTMLCanvasElement; private ncv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D; private nctx: CanvasRenderingContext2D;
  private tex: Phaser.Textures.Texture;
  /** Kệ đang xếp: góc trên trái chỗ trống kế tiếp và chiều cao kệ. */
  private x = 0; private y = 0; private rowH = 0;
  /** Ảnh đã chép: key gốc → tọa độ trong atlas (null = không còn chỗ). */
  private at = new Map<string, { x: number; y: number } | null>();
  private dirty = false;

  constructor(private scene: Phaser.Scene, id: string) {
    this.key = `isoAtlas|${id}`;
    if (scene.textures.exists(this.key)) scene.textures.remove(this.key);
    const mk = () => { const c = document.createElement("canvas"); c.width = SIZE; c.height = SIZE; return c; };
    this.cv = mk(); this.ncv = mk();
    this.ctx = this.cv.getContext("2d")!; this.nctx = this.ncv.getContext("2d")!;
    this.tex = scene.textures.addCanvas(this.key, this.cv)!;
    this.tex.setDataSource(this.ncv);
  }

  /**
   * Khung atlas của khung `frame` (mặc định cả ảnh) thuộc texture `key`; chép ảnh (và normal map) vào atlas ở lần đầu. Trả null nếu
   * atlas đã đầy, để nơi gọi dùng thẳng texture gốc.
   */
  frame(key: string, frame?: string | number): string | null {
    let pos = this.at.get(key);
    if (pos === undefined) pos = this.add(key);
    if (!pos) return null;
    const name = frame === undefined ? key : `${key}|${frame}`;
    if (!this.tex.has(name)) {
      const f = this.scene.textures.getFrame(key, frame);
      if (!f) return null;
      this.tex.add(name, 0, pos.x + f.cutX, pos.y + f.cutY, f.cutWidth, f.cutHeight);
    }
    return name;
  }

  private add(key: string): { x: number; y: number } | null {
    const t = this.scene.textures.get(key), img = t.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const w = img.width, h = img.height;
    if (this.x + w > SIZE) { this.x = 0; this.y += this.rowH + PAD; this.rowH = 0; }
    if (w > SIZE || this.y + h > SIZE) { this.at.set(key, null); console.warn(`[isoAtlas] hết chỗ cho ${key}`); return null; }
    const pos = { x: this.x, y: this.y };
    this.ctx.drawImage(img, pos.x, pos.y);
    const n = t.dataSource[0]?.image as HTMLImageElement | HTMLCanvasElement | undefined;
    if (n) this.nctx.drawImage(n, pos.x, pos.y);
    else { this.nctx.fillStyle = FLAT; this.nctx.fillRect(pos.x, pos.y, w, h); }
    this.x += w + PAD; this.rowH = Math.max(this.rowH, h);
    this.at.set(key, pos); this.dirty = true;
    return pos;
  }

  /** Gửi lại atlas lên GPU nếu vừa chép thêm ảnh (gọi một lần mỗi khung, trước khi vẽ). */
  flush() {
    if (!this.dirty) return;
    this.dirty = false;
    this.tex.source[0].update(); this.tex.dataSource[0]?.update();
  }
}
