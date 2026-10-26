// Bot: dữ liệu riêng của chính mình (#949). Server không còn đồng bộ xp, xpNeed, mp, maxMp, cds, bcds, swCd, avaCd, ctCd trong
// `PlayerState` mà gửi tin riêng `vit` (shared/vitals.ts). Để các bài kiểm cũ đọc `p.mp` / `p.cds[0]` trên hồn sư của mình như trước,
// `bindVit` gắn các trường đó lên đối tượng hồn sư của chính mình theo tin `vit` (hồi chiêu đếm lùi giữa hai tin như client thật).
// Hồn sư khác trong state KHÔNG có các trường này (đúng ý #949): đọc thì ra undefined.
import { emptyVitals, vitalsAfter, vitalsParse } from "../../../shared/vitals.ts";

export const VIT_FIELDS = ["xp", "xpNeed", "mp", "maxMp", "cds", "bcds", "swCd", "avaCd", "ctCd"];

/**
 * Nghe tin `vit` của `room` (gọi NGAY sau khi vào phòng, trước mọi `await`, để không lỡ tin đầu), trả về `install()`: chờ hồn sư của mình có trong
 * state rồi gắn các trường lên nó (gọi khi đã sẵn sàng đọc).
 */
export function bindVit(room) {
  const o = { v: emptyVitals(), at: Date.now(), n: 0 };
  room.onMessage("vit", (m) => { const v = vitalsParse(m); if (v) { o.v = v; o.at = Date.now(); o.n++; } });
  const now = () => vitalsAfter(o.v, (Date.now() - o.at) / 1000);
  room.vitState = o;
  return async function install() {
    for (let t = 0; t < 3000 && !room.state?.players?.get(room.sessionId); t += 50) await new Promise((r) => setTimeout(r, 50));
    const p = room.state?.players?.get(room.sessionId);
    if (p) for (const k of VIT_FIELDS) Object.defineProperty(p, k, { get: () => now()[k], configurable: true, enumerable: false });
    return now;
  };
}
