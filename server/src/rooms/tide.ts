// Thủy Triều Dâng (#174, GAME_DESIGN.md mục 5.4): giai đoạn 2 của Tà hóa Thâm Hải Ma Kình Vương (BossPhase.tide). Các vùng ngập luân phiên
// (Làm chậm qua trạng thái Ngập nước, STATUS.flood) và xoáy nước kéo người vào là vùng lưu lại của ground.ts (#161); file này chỉ chọn chỗ
// và nhịp các đợt nước. Số liệu ở shared/data.ts (TideDef). MapRoom chỉ gọi `tick`.
import { LAIR_SPOT, type Tele, type TideDef } from "../../../shared/data.ts";
import type { GameMap } from "../map.ts";
import type { BData, MapRoom } from "./MapRoom.ts";
import { PLAYER_BOX, lairSpot, type Anchor } from "./worldBoss.ts";

type Pt = { x: number; y: number };

/** Số lần thử chọn cả một đợt nước ở chỗ mới (tideSpots) trước khi chấp nhận chỗ gần đợt trước. */
const WAVE_TRIES = 8;

/**
 * `n` chỗ (tâm vùng ngập bán kính `r`) trong hang, mỗi chỗ một dải cột theo bề ngang hang (rải đều; không được thì cả bề ngang), đi thẳng
 * tới được từ chỗ sinh của thú vương `at`, phần lớn vùng đứng được (8 hướng cách tâm LAIR_SPOT.open × bán kính), ngoài vùng an toàn, hai
 * tâm cách nhau ít nhất 1,5 × `r`, và cách mọi tâm của đợt trước `prev` ít nhất `r` (nước chuyển chỗ). Thử cả đợt WAVE_TRIES lần; vẫn
 * không đủ chỗ thì bỏ điều kiện cách đợt trước. Thiếu chỗ thì ít vùng hơn.
 */
export function tideSpots(map: GameMap, at: Anchor, n: number, r: number, prev: Pt[], rnd: () => number): Pt[] {
  const ring = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => [Math.cos((k * Math.PI) / 4) * r * LAIR_SPOT.open, Math.sin((k * Math.PI) / 4) * r * LAIR_SPOT.open]);
  const wave = (moved: boolean) => {
    const out: Pt[] = [];
    const ok = (x: number, y: number) => !map.inSafe(x, y) && out.every((s) => Math.hypot(x - s.x, y - s.y) >= 1.5 * r)
      && (!moved || prev.every((s) => Math.hypot(x - s.x, y - s.y) >= r))
      && ring.every(([dx, dy]) => !map.hits(x + dx, y + dy, PLAYER_BOX.hw, PLAYER_BOX.hh));
    for (let k = 0; k < n; k++) {
      const p = lairSpot(map, rnd, at, k, n, r, PLAYER_BOX, ok) ?? lairSpot(map, rnd, at, 0, 1, r, PLAYER_BOX, ok);
      if (p) out.push(p);
    }
    return out;
  };
  for (let i = 0; i < WAVE_TRIES; i++) { const s = wave(true); if (s.length === n) return s; }
  return wave(false);
}

const circle = (p: Pt, r: number): Tele => ({ shape: "circle", x: p.x, y: p.y, ang: 0, r, w: 0, arc: 0 });

export class Tide {
  /** Giây tới đợt nước kế tiếp (0: dâng ngay khi luật bắt đầu chạy). */
  private next = 0;
  /** Id vùng (ngập và xoáy) của đợt gần nhất và tâm các vùng ngập của đợt đó. */
  private wave: string[] = [];
  private spots: Pt[] = [];
  constructor(private room: MapRoom) {}

  /** Luật đang chạy trong phòng: thú vương còn sống, đang giao chiến, ở giai đoạn 2 (hết tiếng gầm) và có `phase2.tide`. */
  active(): { tide: TideDef; bid: string; bd: BData } | null {
    const room = this.room, bid = room.king?.bid, b = bid ? room.state.beasts.get(bid) : undefined, bd = bid ? room.bdata.get(bid) : undefined;
    const e = bd?.elite, k = e?.king, tide = k && !k.world && k.phase === 2 && k.roar <= 0 ? k.def.phase2?.tide : undefined;
    return bid && b && bd && e && tide && e.engaged && b.hp > 0 ? { tide, bid, bd } : null;
  }

  /**
   * Mỗi nhịp: luật đang chạy thì cứ `every` giây một đợt nước (rise). Luật thôi chạy (bỏ giao chiến, thú vương rút đi) thì nước đợt cuối rút
   * ngay; thú vương bị hạ thì ground.ts tự xóa vùng của nó.
   */
  tick(dt: number) {
    const on = this.active();
    if (!on) {
      if (this.wave.length) this.room.grounds.cut(this.wave, 0);
      this.next = 0; this.wave = []; this.spots = [];
      return;
    }
    if ((this.next -= dt) <= 0) this.rise(on);
  }

  /**
   * Một đợt: `flood.n` vùng ngập ở chỗ mới (tideSpots), `whirl.n` vùng trong số đó có xoáy nước đồng tâm. Nước đợt trước rút đúng lúc đợt
   * này hết báo trước (Grounds.cut), nên luôn có một đợt nước có tác dụng và chỗ ngập đổi theo mỗi đợt.
   */
  private rise(on: { tide: TideDef; bid: string; bd: BData }) {
    const room = this.room, { tide, bid, bd } = on, base = room.beastDmg(bd);
    this.next = tide.every;
    const spots = tideSpots(room.map, { x: bd.hx, y: bd.hy }, tide.flood.n, tide.flood.r, this.spots, Math.random);
    if (!spots.length) return;
    room.grounds.cut(this.wave, tide.flood.ground.warn ?? 0);
    const pick = [...spots];
    for (let i = pick.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pick[i], pick[j]] = [pick[j], pick[i]]; }
    this.wave = [
      ...room.grounds.add(bid, tide.flood.ground, spots.map((p) => circle(p, tide.flood.r)), base),
      ...room.grounds.add(bid, tide.whirl.ground, pick.slice(0, tide.whirl.n).map((p) => circle(p, tide.whirl.r)), base),
    ];
    this.spots = spots;
  }

  /** Hook kiểm thử `tide`: luật đang chạy không, giây tới đợt kế tiếp, đợt gần nhất. `next` = 0: dâng một đợt ngay; > 0: đặt giây chờ. */
  info(next?: number) {
    const on = this.active();
    if (on && next === 0) this.rise(on); else if (next !== undefined) this.next = next;
    return { on: !!on, next: this.next, wave: [...this.wave], spots: [...this.spots] };
  }
}
