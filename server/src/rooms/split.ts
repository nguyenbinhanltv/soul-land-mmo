// Hang chia phần luân phiên (#173, GAME_DESIGN.md mục 5.4): giai đoạn 2 của Lưỡng Nghi Thủ Hộ Xà (nửa băng / nửa lửa) và Thiên Độc Chu
// Hoàng (tơ phủ 1/3 hang), BossPhase.split. Mỗi phần hang đang "hóa" là vùng lưu lại của ground.ts (#161: gây trạng thái theo nhịp, báo
// trước `warn`, `once`); file này chỉ chia hang và giữ nhịp luân phiên. Số liệu ở shared/data.ts (SplitDef). MapRoom chỉ gọi `tick`.
import { type SplitDef, type Tele } from "../../../shared/data.ts";
import type { Rect } from "../map.ts";
import type { MapRoom } from "./MapRoom.ts";
import type { BData } from "./types.ts";

/**
 * Hang `l` chia theo chiều dài (cạnh dài hơn của chữ nhật) thành `n` phần bằng nhau, mỗi phần là một dải (`line`: gốc ở giữa mép đầu
 * phần, dài bằng phần, rộng bằng cả bề kia của hang), nên teleHits và client vẽ như mọi vệt.
 */
export function splitParts(l: Rect, n: number): Tele[] {
  const out: Tele[] = [], wide = l.w >= l.h;
  for (let k = 0; k < n; k++) out.push(wide
    ? { shape: "line", x: l.x + (l.w * k) / n, y: l.y + l.h / 2, ang: 0, r: l.w / n, w: l.h, arc: 0 }
    : { shape: "line", x: l.x + l.w / 2, y: l.y + (l.h * k) / n, ang: Math.PI / 2, r: l.h / n, w: l.w, arc: 0 });
  return out;
}

export class LairSplit {
  /** Giây tới lần đổi phần kế tiếp (0: hóa ngay khi luật bắt đầu chạy). */
  private next = 0;
  /** Phần đang hóa (chỉ số trong splitParts; −1 = chưa có) và id vùng của nó. */
  private part = -1;
  private zone: string[] = [];
  constructor(private room: MapRoom) {}

  /** Luật đang chạy trong phòng: thú vương còn sống, đang giao chiến, ở giai đoạn 2 (hết tiếng gầm) và có `phase2.split`, hang có. */
  active(): { split: SplitDef; bid: string; bd: BData; lair: Rect } | null {
    const room = this.room, bid = room.king?.bid, b = bid ? room.state.beasts.get(bid) : undefined, bd = bid ? room.bdata.get(bid) : undefined;
    const e = bd?.elite, k = e?.king, split = k && !k.world && k.phase === 2 && k.roar <= 0 ? k.def.phase2?.split : undefined, lair = room.map.lair;
    return bid && b && bd && e && split && lair && e.engaged && b.hp > 0 ? { split, bid, bd, lair } : null;
  }

  /**
   * Mỗi nhịp: luật đang chạy thì cứ `every` giây đổi phần (shift). Luật thôi chạy (bỏ giao chiến, thú vương rút đi) thì phần đang hóa
   * tan ngay; thú vương bị hạ thì ground.ts tự xóa vùng của nó.
   */
  tick(dt: number) {
    const on = this.active();
    if (!on) {
      if (this.zone.length) this.room.grounds.cut(this.zone, 0);
      this.next = 0; this.part = -1; this.zone = [];
      return;
    }
    if ((this.next -= dt) <= 0) this.shift(on);
  }

  /**
   * Đổi phần: phần đang hóa tan ngay; phần kế tiếp (lần đầu ngẫu nhiên) hóa thành vùng `grounds[phần % grounds.length]`, báo trước
   * `warn` giây (SplitDef).
   */
  private shift(on: { split: SplitDef; bid: string; bd: BData; lair: Rect }) {
    const room = this.room, { split, bid, bd, lair } = on, parts = splitParts(lair, split.parts);
    this.next = split.every;
    room.grounds.cut(this.zone, 0);
    this.part = this.part < 0 ? Math.floor(Math.random() * parts.length) : (this.part + 1) % parts.length;
    const def = split.grounds[this.part % split.grounds.length];
    this.zone = room.grounds.add(bid, { ...def, warn: split.warn }, [parts[this.part]], room.beastDmg(bd));
  }

  /**
   * Hook kiểm thử `split`: luật đang chạy không, giây tới lần đổi kế tiếp, phần đang hóa và kiểu vùng của nó, id vùng, các phần của hang.
   * `next` = 0: đổi phần ngay; > 0: đặt giây chờ.
   */
  info(next?: number) {
    const on = this.active();
    if (on && next === 0) this.shift(on); else if (next !== undefined) this.next = next;
    const parts = on ? splitParts(on.lair, on.split.parts) : [];
    return { on: !!on, next: this.next, part: this.part, kind: on && this.part >= 0 ? on.split.grounds[this.part % on.split.grounds.length].kind : "",
      zone: [...this.zone], parts };
  }
}
