// Atlas ảnh bản đồ cho Light2D (bước 10.7). Pipeline ánh sáng của Phaser chỉ gom các ảnh cùng một texture (và cùng normal map) vào
// một lần vẽ, nên mỗi ô nền / lớp phủ mép / vật đứng mang texture riêng làm số lần vẽ tăng vọt (đo ở Tinh Đấu Nội địa: khoảng 1.100
// lần mỗi khung so với 29 khi không có ánh sáng). IsoMap chép mọi ảnh của bản đồ vào một canvas lớn (xếp theo kệ) cùng một canvas
// normal map xếp y hệt (ảnh không có normal map thì phẳng), rồi đặt ảnh theo khung của atlas. Chỉ dùng khi ánh sáng bật.
import Phaser from "phaser";
import { ATLAS_SIZE as SIZE, ShelfPacker } from "./isoPack.ts";

/** Màu pháp tuyến phẳng (hướng ra màn hình). */
const FLAT = "rgb(128,128,255)";

/** Một trang atlas: canvas màu + canvas normal map xếp y hệt. Ảnh không còn chỗ ở mọi trang thì giữ texture riêng (vẫn vẽ đúng, chỉ không gom được). */
class Page {
  readonly key: string;
  readonly ctx: CanvasRenderingContext2D; readonly nctx: CanvasRenderingContext2D;
  readonly tex: Phaser.Textures.Texture;
  dirty = false;
  constructor(scene: Phaser.Scene, key: string) {
    this.key = key;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const mk = () => { const c = document.createElement("canvas"); c.width = SIZE; c.height = SIZE; return c; };
    const cv = mk(), ncv = mk();
    this.ctx = cv.getContext("2d")!; this.nctx = ncv.getContext("2d")!;
    this.tex = scene.textures.addCanvas(key, cv)!;
    this.tex.setDataSource(ncv);
  }
}

/** Khung atlas: texture của trang + tên khung trong trang. */
export interface AtlasRef { key: string; frame: string }

export class IsoAtlas {
  private readonly id: string;
  private pages: Page[] = [];
  private pack = new ShelfPacker();
  /** Ảnh đã chép: key gốc → trang + tọa độ trong atlas (null = không còn chỗ). */
  private at = new Map<string, { page: Page; x: number; y: number } | null>();

  constructor(private scene: Phaser.Scene, id: string) { this.id = id; }

  /**
   * Khung atlas của khung `frame` (mặc định cả ảnh) thuộc texture `key`; chép ảnh (và normal map) vào atlas ở lần đầu. Trả null nếu
   * atlas đã đầy, để nơi gọi dùng thẳng texture gốc.
   */
  frame(key: string, frame?: string | number): AtlasRef | null {
    let pos = this.at.get(key);
    if (pos === undefined) pos = this.add(key);
    if (!pos) return null;
    const name = frame === undefined ? key : `${key}|${frame}`;
    if (!pos.page.tex.has(name)) {
      const f = this.scene.textures.getFrame(key, frame);
      if (!f) return null;
      pos.page.tex.add(name, 0, pos.x + f.cutX, pos.y + f.cutY, f.cutWidth, f.cutHeight);
    }
    return { key: pos.page.key, frame: name };
  }

  private add(key: string): { page: Page; x: number; y: number } | null {
    const t = this.scene.textures.get(key), img = t.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const w = img.width, h = img.height;
    const spot = this.pack.place(w, h);
    if (!spot) { this.at.set(key, null); console.warn(`[isoAtlas] hết chỗ cho ${key}`); return null; }
    while (this.pages.length <= spot.page) this.pages.push(new Page(this.scene, `isoAtlas|${this.id}|${this.pages.length}`));
    const page = this.pages[spot.page], pos = { page, x: spot.x, y: spot.y };
    page.ctx.drawImage(img, pos.x, pos.y);
    const n = t.dataSource[0]?.image as HTMLImageElement | HTMLCanvasElement | undefined;
    if (n) page.nctx.drawImage(n, pos.x, pos.y);
    else { page.nctx.fillStyle = FLAT; page.nctx.fillRect(pos.x, pos.y, w, h); }
    this.at.set(key, pos); page.dirty = true;
    return pos;
  }

  /** Gửi lại các trang vừa chép thêm ảnh lên GPU (gọi một lần mỗi khung, trước khi vẽ). */
  flush() {
    for (const p of this.pages) {
      if (!p.dirty) continue;
      p.dirty = false;
      p.tex.source[0].update(); p.tex.dataSource[0]?.update();
    }
  }
}
