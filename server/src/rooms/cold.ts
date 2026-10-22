// Cực Hàn (#163, GAME_DESIGN.md mục 5.4): tầng Hàn của giai đoạn 2 Tà hóa Huyền Minh Băng Giao (BossPhase.cold) và Hỏa Đàn xả tầng.
// Số liệu ở shared/data.ts (ColdDef, STATUS.chill); chỗ Hỏa Đàn ở map.ts (hoaDanSpot, shared/hoaDan.ts). MapRoom chỉ gọi `tick`.
// Tầng Hàn là trạng thái hồn sư `chill` (PLAYER_STATUS): đồng bộ, ô trạng thái, thanh tẩy, vùng an toàn, cả đội gục dùng chung luật.
import { STATUS, type ColdDef } from "../../../shared/data.ts";
import type { MapRoom } from "./MapRoom.ts";

export class ColdStacks {
  /** sessionId -> số giây đã tích về tầng Hàn kế tiếp; có mặt = đang chịu Cực Hàn. */
  private acc = new Map<string, number>();
  constructor(private room: MapRoom) {}

  /** Luật Cực Hàn đang chạy trong phòng: thú vương còn sống, đang giao chiến, ở giai đoạn 2 và có `phase2.cold`. */
  active(): { cold: ColdDef; parts: Map<string, number> } | null {
    const room = this.room, bid = room.king?.bid, b = bid ? room.state.beasts.get(bid) : undefined, e = bid ? room.bdata.get(bid)?.elite : undefined;
    const k = e?.king, cold = k && !k.world && k.phase === 2 ? k.def.phase2?.cold : undefined;
    return b && e && cold && e.engaged && b.hp > 0 ? { cold, parts: e.parts } : null;
  }

  /**
   * Mỗi nhịp: người tham gia đứng trong hang (chưa gục, không đi cổng, ngoài vùng an toàn) chịu Cực Hàn. Cạnh Hỏa Đàn thì xả hết tầng;
   * đang Đóng băng hoặc miễn sát thương (Vô Địch Thần Quang) thì ngừng tích; còn lại cứ `every` giây thêm một tầng (đủ tầng tối đa thì
   * applyPStatus bùng phát thành Đóng băng). Ai thôi chịu Cực Hàn (rời hang, bị loại khỏi người tham gia, cả đội gục, rời phòng, thú
   * vương bị hạ / rút đi / bỏ giao chiến) thì mất hết tầng.
   */
  tick(dt: number) {
    const room = this.room, on = this.active(), fire = room.map.hoaDan, who = new Set<string>();
    if (on) for (const pid of on.parts.keys()) {
      const p = room.state.players.get(pid), d = room.pdata.get(pid);
      if (p && d && !p.dead && !d.travelling && room.map.inLair(p.x, p.y) && !room.map.inSafe(p.x, p.y)) who.add(pid);
    }
    for (const pid of [...this.acc.keys()]) if (!who.has(pid)) { this.acc.delete(pid); this.drop(pid); }
    if (!on) return;
    for (const pid of who) {
      const p = room.state.players.get(pid)!, d = room.pdata.get(pid)!;
      if (fire && Math.hypot(p.x - fire.x, p.y - fire.y) <= on.cold.fire.r) {
        this.acc.set(pid, 0);
        if (this.drop(pid)) room.log(pid, "Hơi ấm Hỏa Đàn xua tan tầng Hàn.", STATUS.chill.col);
        continue;
      }
      if (d.st.has("freeze") || room.buffV(d, "inv")) { this.acc.set(pid, this.acc.get(pid) ?? 0); continue; }
      let t = (this.acc.get(pid) ?? 0) + dt;
      if (t >= on.cold.every) {
        t = 0;
        room.applyPStatus(pid, { s: "chill" }, 0);
        const burst = STATUS.chill.burst;
        if (burst && !d.st.has("chill") && d.st.has(burst.s))
          room.log(pid, `Đủ ${STATUS.chill.max} tầng Hàn: bị ${STATUS[burst.s].name} ${burst.secs ?? STATUS[burst.s].secs} giây. Đứng cạnh Hỏa Đàn để xả tầng.`, STATUS.chill.col);
      }
      this.acc.set(pid, t);
    }
  }

  /** Bỏ tầng Hàn của hồn sư `pid`; trả true nếu đang có. */
  drop(pid: string) {
    const p = this.room.state.players.get(pid), d = this.room.pdata.get(pid);
    if (!p || !d || !d.st.delete("chill")) return false;
    this.room.syncPStatus(p, d);
    return true;
  }

  /** Hook kiểm thử `cold`: Hỏa Đàn, luật đang chạy không, giây đã tích của `pid`; `acc` đặt lại số giây đã tích (bot không chờ thật). */
  info(pid: string, acc?: number) {
    if (acc !== undefined && this.acc.has(pid)) this.acc.set(pid, acc);
    return { fire: this.room.map.hoaDan, on: !!this.active(), acc: this.acc.get(pid) ?? null };
  }
}
