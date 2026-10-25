// Khoá mục tiêu (M3 #750, GAME_DESIGN.md mục 5.11), tách khỏi MapRoom.ts (#702): server giữ `d.target` (id hồn thú) của từng hồn sư,
// trong tầm thì tự quay mặt và đánh thường theo hồi chiêu, ngoài tầm thì client lái A* tới (shared/clickgoal.ts). Bị đánh / choáng / đẩy
// lùi KHÔNG huỷ khoá; chỉ huỷ khi hồn thú chết / biến mất / quá xa, hồn sư gục / vào vùng an toàn / tự đi / tự săn. Mọi lần đánh vẫn đi
// qua MapRoom.attack nên hồi chiêu, Choáng, vùng an toàn, tàng hình… áp như khi tự bấm. Client chỉ gửi ý định `target {id}`.
import { ATTACK_REACH, TIERS, dir4 } from "../../../shared/data.ts";
import { reachGap } from "../../../shared/clickgoal.ts";
import type { MapRoom, PData } from "./MapRoom.ts";
import type { BeastState, PlayerState } from "./schema.ts";

/** Nửa cỡ hồn thú lớn nhất: bán kính lấy ứng viên từ lưới không gian. */
const BEAST_HALF = Math.max(...TIERS.map((t) => t.size)) / 2;

/** Hồn thú `b` nằm trong tầm đòn thường của hồn sư `p` (quay mặt về nó thì đòn trúng). */
export const inReach = (p: PlayerState, b: BeastState) => { const g = reachGap(p, b); return g.dist < g.max; };

/** Lý do server huỷ khoá (M5 #751), client đổi thành câu báo ở chip trạng thái: hồn thú chết / mất, quá xa, vùng an toàn, hồn sư gục, tự săn bật. */
export type LockWhy = "gone" | "far" | "safe" | "dead" | "hunt";

/** Gửi riêng cho người chơi mục tiêu đang khoá ("" = không khoá) để client vẽ vòng chọn và thanh mục tiêu; `why` khi server tự huỷ. */
function tell(room: MapRoom, id: string, tid: string, why?: LockWhy) { room.clients.getById(id)?.send("lock", why ? { id: tid, why } : { id: tid }); }

/** Đặt / bỏ khoá; không đổi gì thì không gửi tin, trừ khi `force` (trả lời một yêu cầu bị từ chối để client bỏ khoá ảo đã đặt tạm). */
export function setLock(room: MapRoom, id: string, d: PData, tid: string, force = false, why?: LockWhy) {
  if (d.target === tid && !force) return;
  d.target = tid; tell(room, id, tid, why);
}

/** Quay mặt (hướng đánh d.dir và hướng vẽ p.dir) về tâm thân hồn thú. */
function face(room: MapRoom, p: PlayerState, d: PData, b: BeastState) {
  const g = reachGap(p, b), l = g.dist || 1;
  d.dir = { x: g.dx / l, y: g.dy / l }; p.dir = dir4(g.dx, g.dy);
}

/**
 * Tin `target {id}`: bấm / Tab chọn hồn thú. Kiểm id có thật ở bản đồ này (không phải trứng), còn trong `leash`, hồn sư sống và không ở vùng an toàn; id rỗng
 * hoặc không hợp lệ thì bỏ khoá. Chọn tay thì tắt tự săn (tay ưu tiên).
 */
export function targetMsg(room: MapRoom, id: string, tid: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  if (typeof tid !== "string" || !tid) return setLock(room, id, d, "", true);
  const b = room.state.beasts.get(tid);
  // Từ chối thì luôn báo lại `lock ""`: client đặt khoá tạm ngay khi bấm, không có tin này sẽ vẽ vòng khoá và lái tới một con server không khoá.
  if (!b || b.egg || p.dead || room.map.inSafe(p.x, p.y) || Math.hypot(b.x - p.x, b.y - p.y) > ATTACK_REACH.leash) return setLock(room, id, d, "", true);
  room.autoHand(id);
  setLock(room, id, d, tid);
}

/** Mỗi nhịp, cho người chơi đang sống: kiểm điều kiện giữ khoá rồi tự quay mặt + đánh thường nếu trong tầm. Tự săn đang lái thì không chen. */
export function tickLock(room: MapRoom, id: string, p: PlayerState, d: PData) {
  const b = room.state.beasts.get(d.target);
  if (!b || d.auto || room.map.inSafe(p.x, p.y) || Math.hypot(b.x - p.x, b.y - p.y) > ATTACK_REACH.leash)
    return setLock(room, id, d, "", false, !b ? "gone" : d.auto ? "hunt" : room.map.inSafe(p.x, p.y) ? "safe" : "far");
  if (d.atkCd > 0 || !inReach(p, b)) return;
  face(room, p, d, b); room.attack(id);
}

/**
 * Đánh thường do người chơi bấm (Space / J): đang khoá mà mục tiêu trong tầm thì quay mặt về nó; chưa khoá (hoặc mục tiêu chưa tới tầm) thì quay về hồn thú
 * gần nhất trong tầm đánh; không có thì đánh theo hướng đang quay như cũ. Rồi vào MapRoom.attack như mọi đòn.
 */
export function manualAttack(room: MapRoom, id: string) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d) return;
  const t = d.target ? room.state.beasts.get(d.target) : undefined;
  if (t && inReach(p, t)) face(room, p, d, t);
  else {
    let best: BeastState | undefined, bd = Infinity;
    for (const [, b] of room.beastsNear(p.x, p.y, ATTACK_REACH.fwd + ATTACK_REACH.r + BEAST_HALF)) {
      const g = reachGap(p, b); if (g.dist < g.max && g.dist < bd) { bd = g.dist; best = b; }
    }
    if (best) face(room, p, d, best);
  }
  room.attack(id);
}
