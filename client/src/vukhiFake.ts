// Sheet vũ khí cầm tay GIẢ LẬP tất định (#1312, docs/art/phu-the-vu-khi.md) để thử client / trang `?thu=vukhi` khi chưa có ảnh model: KHÔNG phải ảnh thật, không vào game.
// Mỗi khung là một cây gậy + đầu vật vẽ từ điểm cầm giả (theo hướng, clip, khung) bằng hàm thuần, không ngẫu nhiên: cùng đầu vào, cùng ảnh. Phần vẽ canvas ở vukhiTest.ts.
import { PHU_CLIPS, PHU_DEFAULT_CLIPS, PHU_DIRS, type PhuClip } from "./phutheAnim.ts";

export type FakeDir = (typeof PHU_DIRS)[number];
/** Bàn tay thuận giả (điểm ảnh khung từ gốc chân, +x sang phải hướng đông, +y xuống) lúc đứng yên theo hướng; hai hướng quay lưng cầm ở bên kia thân. */
const HAND: Record<FakeDir, readonly [number, number]> = { s: [9, -24], se: [10, -25], e: [8, -26], ne: [-8, -27], n: [-9, -26] };

/** Tiến độ 0..1 của khung `i` / `n` trong clip một lần; clip lặp trả sóng 0..1. */
const prog = (i: number, n: number) => (n > 1 ? i / (n - 1) : 1);

/** Điểm cầm giả của khung `i` / `n` của clip: tay nâng / vung theo clip (đánh: ra trước, cast: giơ cao, hurt: lùi). */
export function fakeGrip(dir: FakeDir, clip: PhuClip, i: number, n: number): [number, number] {
  const [bx, by] = HAND[dir], e = prog(i, n), w = Math.sin((n > 1 ? i / n : 0) * 2 * Math.PI), k = Math.sin(Math.PI * e), fwd = dir === "n" ? -1 : 1;
  switch (clip) {
    case "idle": return [bx, by + w];
    case "walk": return [bx, by - Math.abs(w) * 2];
    case "attack": return [bx + fwd * 7 * k, by - 3 * k];
    case "cast": return [bx, by - 9 * e];
    case "hurt": return [bx - fwd * (4 - 3 * e), by + 1];
  }
}

/** Góc cây gậy (rad, 0 = sang phải, âm = lên) của khung: đứng chếch lên; đánh vung từ trên xuống; cast dựng thẳng. */
export function fakeAngle(clip: PhuClip, i: number, n: number): number {
  const e = prog(i, n), w = Math.sin((n > 1 ? i / n : 0) * 2 * Math.PI);
  switch (clip) {
    case "idle": return -1.05 + 0.04 * w;
    case "walk": return -1.05 + 0.12 * w;
    case "attack": return -1.9 + 2.5 * e;
    case "cast": return -1.4 - 0.2 * e;
    case "hurt": return -0.6 + 0.2 * e;
  }
}

export const FAKE_LEN = 26;
/** Đoạn gậy (cán + đầu) của khung theo toạ độ từ gốc chân: [x0, y0] = điểm cầm, [x1, y1] = đỉnh đầu vật. Hướng quay lưng vẫn chếch về phía cầm. */
export function fakeSegment(dir: FakeDir, clip: PhuClip, i: number, n: number): { x0: number; y0: number; x1: number; y1: number } {
  const [x0, y0] = fakeGrip(dir, clip, i, n), a = fakeAngle(clip, i, n), sx = dir === "ne" || dir === "n" ? -1 : 1;
  return { x0, y0, x1: x0 + sx * Math.cos(a) * FAKE_LEN, y1: y0 + Math.sin(a) * FAKE_LEN };
}

/** Bảng `anim.grip` đầy đủ của sheet giả: khoá `<hướng>/<clip>/<khung>` → [x, y] (cùng điểm cầm với đoạn gậy vẽ ra). */
export function fakeGripTable(clips: Record<PhuClip, { n: number }> = PHU_DEFAULT_CLIPS): Record<string, number[]> {
  const t: Record<string, number[]> = {};
  for (const d of PHU_DIRS) for (const c of PHU_CLIPS) for (let i = 0; i < clips[c].n; i++) t[`${d}/${c}/${i}`] = fakeGrip(d, c, i, clips[c].n).map((v) => +v.toFixed(1));
  return t;
}

/** Nửa sheet chứa vũ khí của hướng: quay lưng (n, ne) vẽ vào nửa sau (`b`) để thân che; còn lại nửa trước (`f`). */
export const fakeHalf = (dir: FakeDir): "b" | "f" => (dir === "n" || dir === "ne" ? "b" : "f");
