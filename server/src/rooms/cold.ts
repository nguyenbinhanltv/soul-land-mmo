// Cực Hàn (#163, GAME_DESIGN.md mục 5.4): tầng Hàn của giai đoạn 2 Tà hóa Huyền Minh Băng Giao (BossPhase.cold) và Hỏa Đàn xả tầng.
// Số liệu ở shared/data.ts (ColdDef, STATUS.chill); chỗ Hỏa Đàn ở map.ts (hoaDanSpot, shared/hoaDan.ts). MapRoom chỉ gọi `tick`.
// Tầng Hàn là trạng thái hồn sư `chill` (PLAYER_STATUS): đồng bộ, ô trạng thái, thanh tẩy, vùng an toàn, cả đội gục dùng chung luật.
import { STATUS, type ColdDef } from "../../../shared/data.ts";
import type { MapRoom } from "./MapRoom.ts";

export class ColdStacks {
  /** sessionId của hồn sư đang chịu Cực Hàn; số giây đã tích về tầng kế tiếp ở PData.hanT (thanh tẩy đặt lại qua clearPStatus). */
  private under = new Set<string>();
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
    for (const pid of [...this.under]) if (!who.has(pid)) { this.under.delete(pid); this.drop(pid); }
    if (!on) return;
    for (const pid of who) {
      const p = room.state.players.get(pid)!, d = room.pdata.get(pid)!;
      if (!this.under.has(pid)) { this.under.add(pid); d.hanT = 0; } // mới chịu Cực Hàn: tích từ đầu
      if (fire && Math.hypot(p.x - fire.x, p.y - fire.y) <= on.cold.fire.r) {
        d.hanT = 0;
        if (this.drop(pid)) room.log(pid, "Hơi ấm Hỏa Đàn xua tan tầng Hàn.", STATUS.chill.col);
        continue;
      }
      if (!d.st.has("freeze") && !room.buffV(d, "inv") && (d.hanT += dt) >= on.cold.every) {
        d.hanT = 0;
        room.applyPStatus(pid, { s: "chill" }, 0);
        const burst = STATUS.chill.burst, fz = burst && !d.st.has("chill") ? d.st.get(burst.s) : undefined;
        if (burst && fz) // thời gian thật sau kháng (RESIST_AS)
          room.log(pid, `Đủ ${STATUS.chill.max} tầng Hàn: bị ${STATUS[burst.s].name} ${+fz.t.toFixed(1)} giây. Đứng cạnh Hỏa Đàn để xả tầng.`, STATUS.chill.col);
      }
    }
  }

  /** Bỏ tầng Hàn (và số giây đã tích) của hồn sư `pid`; trả true nếu đang có tầng. */
  drop(pid: string) {
    const p = this.room.state.players.get(pid), d = this.room.pdata.get(pid);
    if (d) d.hanT = 0;
    if (!p || !d || !d.st.delete("chill")) return false;
    this.room.syncPStatus(p, d);
    return true;
  }

  /** Hook kiểm thử `cold`: Hỏa Đàn, luật đang chạy không, giây đã tích của `pid`; `acc` đặt lại số giây đã tích (bot không chờ thật). */
  info(pid: string, acc?: number) {
    const d = this.room.pdata.get(pid), under = !!d && this.under.has(pid);
    if (acc !== undefined && under) d!.hanT = acc;
    return { fire: this.room.map.hoaDan, on: !!this.active(), acc: under ? d!.hanT : null };
  }
}
