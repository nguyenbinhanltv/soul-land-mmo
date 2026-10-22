/**
 * Đồng bộ túi đồ theo thay đổi (#215, mục 6 "Túi đồ gửi theo thay đổi"): túi 250–500 ô không gửi lại cả túi mỗi lần nhặt / dùng đồ.
 * Server nhớ bản đã gửi cho từng phiên (`BagSent`) rồi chỉ gửi tin "bagd" gồm các ô đổi / mới (`up`), id ô đã mất (`rm`) và cả thứ tự
 * id (`ord`) khi thứ tự không còn là "giữ thứ tự cũ, ô mới nối cuối" (ví dụ sau "Sắp xếp"). Client / bot áp bằng `applyBagDelta`.
 * Tin "bag" (cả túi) vẫn gửi khi client xin hoặc khi phiên chưa có bản gốc. Chỉ là hàm thuần, không có số cân bằng.
 */

/** Phần chung của một ô túi trong tin "bag" / "bagd": chỉ cần `id`; phần còn lại so sánh bằng chuỗi JSON. */
export interface BagSyncItem { id: string; }
/** Phần túi gửi theo thay đổi trong tin "bagd". */
export interface BagDelta<T extends BagSyncItem> { up?: T[]; rm?: string[]; ord?: string[]; }
/** Bản server đã gửi cho một phiên: id ô -> chuỗi JSON của ô, theo đúng thứ tự gửi. */
export type BagSent = Map<string, string>;

/**
 * So `items` (đã ở dạng gửi đi) với bản đã gửi `sent`: trả về delta (rỗng nếu không đổi gì) và bản đã gửi mới. Thứ tự: bỏ ô mất khỏi
 * thứ tự cũ, nối ô mới vào cuối theo thứ tự hiện tại; khác thứ tự hiện tại thì gửi kèm `ord`.
 */
export function bagDiff<T extends BagSyncItem>(sent: BagSent, items: T[]): { delta: BagDelta<T>; next: BagSent } {
  const next: BagSent = new Map(), up: T[] = [];
  for (const it of items) {
    const s = JSON.stringify(it);
    next.set(it.id, s);
    if (sent.get(it.id) !== s) up.push(it);
  }
  const rm = [...sent.keys()].filter((id) => !next.has(id));
  const expect = [...sent.keys()].filter((id) => next.has(id)).concat(items.filter((it) => !sent.has(it.id)).map((it) => it.id));
  const same = expect.length === items.length && expect.every((id, k) => id === items[k].id);
  const delta: BagDelta<T> = {};
  if (up.length) delta.up = up;
  if (rm.length) delta.rm = rm;
  if (!same) delta.ord = items.map((it) => it.id);
  return { delta, next };
}

/** Áp delta lên danh sách ô đang có, trả về mảng mới (không sửa mảng cũ): ô mất bỏ đi, ô đổi thay tại chỗ, ô mới nối cuối, rồi xếp theo `ord`. */
export function applyBagDelta<T extends BagSyncItem>(items: T[], d: BagDelta<T>): T[] {
  const rm = new Set(d.rm ?? []), up = new Map((d.up ?? []).map((it) => [it.id, it]));
  const out = items.filter((it) => !rm.has(it.id)).map((it) => up.get(it.id) ?? it);
  const have = new Set(out.map((it) => it.id));
  for (const it of d.up ?? []) if (!have.has(it.id)) out.push(it);
  if (!d.ord) return out;
  const byId = new Map(out.map((it) => [it.id, it]));
  return d.ord.map((id) => byId.get(id)).filter((it): it is T => it !== undefined);
}
