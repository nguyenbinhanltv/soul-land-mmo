// Xếp ảnh theo kệ vào các trang atlas vuông (isoAtlas.ts). Tách riêng, không phụ thuộc Phaser để kiểm bằng Node.
export const ATLAS_SIZE = 2048, ATLAS_PAD = 2;
/** Số trang tối đa mỗi bản đồ (mỗi trang tốn 2 canvas 2048² gồm cả normal map); quá số này ảnh giữ texture riêng. */
export const ATLAS_MAX_PAGES = 3;

export interface PackSpot { page: number; x: number; y: number }

export class ShelfPacker {
  /** Trạng thái kệ của từng trang: góc trên trái chỗ trống kế tiếp và chiều cao kệ. */
  private pages: { x: number; y: number; rowH: number }[] = [];
  private size: number; private pad: number; private maxPages: number;
  constructor(size = ATLAS_SIZE, pad = ATLAS_PAD, maxPages = ATLAS_MAX_PAGES) { this.size = size; this.pad = pad; this.maxPages = maxPages; }

  get pageCount() { return this.pages.length; }

  /** Chỗ cho ảnh w×h (thử trang cuối trước, hết chỗ thì mở trang mới); null khi quá lớn hoặc hết trang. */
  place(w: number, h: number): PackSpot | null {
    if (w > this.size || h > this.size) return null;
    for (let i = Math.max(0, this.pages.length - 1); i < this.pages.length; i++) {
      const spot = this.fit(i, w, h); if (spot) return spot;
    }
    if (this.pages.length >= this.maxPages) return null;
    this.pages.push({ x: 0, y: 0, rowH: 0 });
    return this.fit(this.pages.length - 1, w, h);
  }

  private fit(i: number, w: number, h: number): PackSpot | null {
    const p = this.pages[i];
    if (p.x + w > this.size) { p.x = 0; p.y += p.rowH + this.pad; p.rowH = 0; }
    if (p.y + h > this.size) return null;
    const spot = { page: i, x: p.x, y: p.y };
    p.x += w + this.pad; p.rowH = Math.max(p.rowH, h);
    return spot;
  }
}
