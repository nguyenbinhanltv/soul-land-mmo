// Tin riêng "vit" (#949): kinh nghiệm, hồn lực và hồi chiêu của chính chủ. Các trường này nằm ở `PlayerState` nhưng KHÔNG đồng bộ
// (schema.ts), nên đối thủ Đại Đấu Hồn Trường hay người đứng gần không đọc được. Gửi khi đổi, hồn lực hồi dần gộp theo `SYNC_VIEW.vitGap`,
// hồi chiêu do client tự đếm lùi giữa hai tin (shared/vitals.ts). Dòng đầu sau khi vào phòng luôn gửi (d.vit = null).
import { vitalsDue, vitalsPack, type Vitals } from "../../../shared/vitals.ts";
import type { MapRoom } from "./MapRoom.ts";
import type { PData } from "./types.ts";
import type { PlayerState } from "./schema.ts";

const snap = (p: PlayerState): Vitals => ({ xp: p.xp, xpNeed: p.xpNeed, mp: p.mp, maxMp: p.maxMp, cds: [...p.cds], bcds: [...p.bcds], swCd: p.swCd, avaCd: p.avaCd, ctCd: p.ctCd });

/** Mỗi nhịp: gửi `vit` cho từng hồn sư có số cần cập nhật (người đang chuyển bản đồ không gửi). Client đếm lùi theo giờ thật nên so theo giờ thật. */
export function sendVitals(room: MapRoom) {
  const now = Date.now();
  room.pdata.forEach((d: PData, id: string) => {
    const p = room.state.players.get(id);
    if (!p || d.travelling) return;
    const cur = snap(p);
    if (!vitalsDue(d.vit, cur, (now - d.vitAt) / 1000)) return;
    const c = room.clients.getById(id);
    if (!c) return;
    const m = vitalsPack(cur);
    c.send("vit", m); d.vit = cur; d.vitAt = now;
  });
}
