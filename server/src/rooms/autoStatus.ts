// Trạng thái và thống kê theo giờ của tự săn (AH2, #609, mục 5.13). Chỉ đọc state của AutoHunter, không quyết định gì: AutoHunter.tick gọi
// `feed.tick` mỗi nhịp; tin riêng `autost` chỉ gửi khi việc đang làm đổi (tối đa AUTO_STATUS.every giây một lần) hoặc đã AUTO_STATUS.rateEvery giây.
import type { Client } from "colyseus";
import { AUTO_STATUS, TILE, beastName, itemDef, type AutoJob, type AutoRate, type AutoStatus } from "../../../shared/data.ts";
import type { PData } from "./MapRoom.ts";
import type { PlayerState } from "./schema.ts";
import type { AutoHunter, AutoSnap } from "./autoHunt.ts";

/** Mẫu thống kê: giây treo, kinh nghiệm, Hồn Tệ và số món đồ cộng dồn (chỉ tính phần tăng của từng loại trong túi, bán / uống không trừ). */
type Sample = [number, number, number, number];

export class AutoFeed {
  private samples: Sample[] = [];
  private prev: AutoSnap | null = null;
  private items = 0;
  private sentKey = ""; private sentAt = -Infinity; private sampleAt = -Infinity;

  /** Ghi mẫu từ ảnh chụp mới: món nào tăng trong túi so với mẫu trước thì cộng phần tăng vào số đồ đã nhặt. */
  sample(secs: number, now: AutoSnap) {
    const prev = this.prev;
    if (prev) for (const [k, n] of now.bag) { const g = n - (prev.bag.get(k) ?? 0); if (g > 0) this.items += g; }
    this.prev = now;
    this.samples.push([secs, now.xp, now.coins, this.items]);
    // Chỉ giữ mẫu trong cửa sổ trượt (cộng một mẫu cũ hơn để có điểm đầu).
    while (this.samples.length > 2 && this.samples[1][0] < secs - AUTO_STATUS.window) this.samples.shift();
  }

  /** Thống kê theo giờ trong cửa sổ trượt (hoặc cả lượt nếu ngắn hơn); null khi chưa đủ AUTO_STATUS.minSecs giây. */
  rate(): AutoRate | null {
    const a = this.samples[0], b = this.samples.at(-1); if (!a || !b) return null;
    const dt = b[0] - a[0]; if (dt < AUTO_STATUS.minSecs) return null;
    const h = 3600 / dt;
    return [Math.max(0, Math.round((b[1] - a[1]) * h)), Math.max(0, Math.round((b[2] - a[2]) * h)), Math.max(0, Math.round((b[3] - a[3]) * h))];
  }
  /** Số món đã nhặt cả lượt (cho tổng kết). */
  get gained() { return this.items; }

  /** Mỗi nhịp phòng: gửi `autost` nếu việc đổi hoặc tới hạn cập nhật thống kê. `snap` chỉ gọi khi tới hạn lấy mẫu. */
  tick(h: AutoHunter, p: PlayerState, c: Client, snap: () => AutoSnap) {
    const due = h.secs - this.sampleAt >= AUTO_STATUS.rateEvery;
    if (due) { this.sampleAt = h.secs; this.sample(h.secs, snap()); }
    const job = jobOf(h, p), key = `${job.k}|${job.n ?? ""}|${job.d ?? ""}|${job.path?.at(-1) ?? ""}`;
    const changed = key !== this.sentKey && h.secs - this.sentAt >= AUTO_STATUS.every;
    if (!changed && !(due && h.secs - this.sentAt >= AUTO_STATUS.rateEvery)) return;
    this.sentKey = key; this.sentAt = h.secs;
    c.send("autost", { ...job, rate: this.rate() } satisfies AutoStatus);
  }
}

/** Việc đang làm của tự săn, suy từ state của AutoHunter (cùng thứ tự ưu tiên với steer / decide). */
function jobOf(h: AutoHunter, p: PlayerState): AutoStatus {
  const room = h.room, b = h.target ? room.state.beasts.get(h.target) : undefined, dr = h.loot ? room.state.drops.get(h.loot) : undefined;
  const dist = (x: number, y: number) => Math.hypot(x - p.x, y - p.y) / TILE;
  let k: AutoJob, n: string | undefined, d: number | undefined, to: { x: number; y: number } | null;
  if (h.dodge) { k = "dodge"; to = h.dodge; }
  else if (h.away || h.warm) { k = "back"; to = h.goal; }
  else if (b) {
    n = beastName(b.rank, b.species); to = b;
    if (h.hit || h.fighting()) k = "fight";
    else { k = "go"; d = Math.max(AUTO_STATUS.dist, Math.round(dist(b.x, b.y) / AUTO_STATUS.dist) * AUTO_STATUS.dist); }
  } else if (dr) { k = "loot"; n = dr.item ? itemDef(dr.item)?.name : "hồn hoàn"; to = dr; }
  else if (h.pace > 0) { k = "rest"; to = null; }
  else { k = "patrol"; to = h.patrol ?? h.goal; }
  // Vài điểm đầu của đường đang đi; không có đường (đi thẳng) thì điểm tới.
  const pts = h.path.length ? h.path.slice(0, AUTO_STATUS.path) : to ? [to] : [];
  const path = pts.length ? pts.flatMap((q) => [Math.round((q.x / TILE) * 10) / 10, Math.round((q.y / TILE) * 10) / 10]) : undefined;
  return { k, ...(n ? { n } : {}), ...(d ? { d } : {}), ...(path ? { path } : {}) };
}
