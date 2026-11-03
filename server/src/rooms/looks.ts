// Lễ thức tỉnh, tạo nhân vật và đổi ngoại hình (docs/design/vo-hon-doi-hinh.md "Lễ thức tỉnh", GAME_DESIGN.md mục 5.11; #702, miền E8). `awakenAccount` / `chooseLooks` là hàm mức module gọi từ `/api/awaken`, `/api/looks` ở `index.ts` TRƯỚC khi vào phòng
// (chỉ `store` + `shared/data.ts`). `sendLooksInfo` / `changeLooks` nhận phòng (`room: MapRoom`) như stats.ts / support.ts. Nguyên văn từ MapRoom; không đổi mã lỗi, thứ tự kiểm, thứ tự trừ tiền → ghi DB (`store.changeLooks`) → đổi `PlayerState`, `room.chain(d, …)`.
import { AWAKEN_GIFT, AWAKEN_CHOICES, AWAKEN_LEVEL, parseNewLooks, npcDef, looksChangeCost, encodeLpc, formatHonTe } from "../../../shared/data.ts";
import { store, type Character, type AccountLooks } from "../db.ts";
import type { MapRoom } from "./MapRoom.ts";

/** Tài khoản chưa có võ hồn: tặng Lam Ngân Thảo + 1 võ hồn SSR tự chọn. Hồn lực bẩm sinh do server roll. */
export async function awakenAccount(accountId: number, name: string, choice: unknown):
  Promise<{ character: Character } | { status: number; error: string }> {
  const pick = AWAKEN_CHOICES.find((v) => v.id === choice);
  if (!pick) return { status: 400, error: "Hãy chọn một võ hồn SSR trong danh sách." };
  // Tạo nhân vật diễn ra ngay trước bước chọn SSR của lễ thức tỉnh.
  if (!(await store.getLooks(accountId)).chosen) return { status: 409, error: "Hãy tạo nhân vật trước lễ thức tỉnh." };
  // Hồn lực bẩm sinh (1 đến AWAKEN_LEVEL.max) thuộc về hồn sư: làm cấp khởi đầu của cả hai võ hồn.
  const level = Math.random() < AWAKEN_LEVEL.maxChance ? AWAKEN_LEVEL.max : 1 + Math.floor(Math.pow(Math.random(), AWAKEN_LEVEL.curve) * (AWAKEN_LEVEL.max - 1));
  const character = await store.awaken(accountId, name, [AWAKEN_GIFT, pick.id], pick.id, level);
  if (!character) return { status: 409, error: "Tài khoản đã thức tỉnh võ hồn rồi." };
  return { character };
}

/** Tạo nhân vật (một lần): client gửi ngoại hình LPC (Mẫu dựng sẵn / Tự tạo); preset kiểu cũ (client cũ) được đổi sang LPC gần nhất (HL2 #571, parseNewLooks). */
export async function chooseLooks(accountId: number, body: unknown):
  Promise<{ looks: AccountLooks } | { status: number; error: string }> {
  const looks = parseNewLooks(body);
  if (!looks) return { status: 400, error: "Ngoại hình không hợp lệ." };
  if (!(await store.chooseLooks(accountId, looks))) return { status: 409, error: "Bạn đã chọn ngoại hình rồi, không đổi được nữa." };
  return { looks: { ...looks, chosen: true, changes: 0 } };
}

/** Tin riêng `looksinfo`: số lần đã đổi (giá lần kế tiếp client tính bằng looksChangeCost, số ở shared/data.ts); `err` = lý do từ chối lần đổi vừa gửi. */
export function sendLooksInfo(room: MapRoom, id: string, err?: string) {
  const d = room.pdata.get(id); if (!d) return;
  room.clients.getById(id)?.send("looksinfo", err ? { n: d.looksN, err } : { n: d.looksN });
}

/**
 * `looks {looks, npc}` (L4 #511): đổi ngoại hình, kể cả qua lại giữa Mẫu dựng sẵn và Tự tạo. Phải đứng trong NPC_RANGE của thợ may
 * (role "looks"; `npc` là mã thợ may đang mở hộp thoại, thiếu thì thợ may gần nhất), không gục, không đang đi cổng, `looks` qua
 * parseLooks và khác ngoại hình hiện tại. Lần đổi thứ `LOOKS_CHANGE.free` đầu miễn phí, sau đó tốn LOOKS_CHANGE.cost Hồn Tệ
 * (looksChangeCost). Tới lượt trong chuỗi lưu mới kiểm lại số lần đổi / Hồn Tệ, trừ tiền, rồi ghi ngoại hình + tăng số lần đổi + ghi túi
 * trong một transaction (store.changeLooks, điều kiện looks_changes khớp nên bấm dồn hay hai tab chỉ một lần được tính); DB lỗi thì trả lại tiền.
 * Chỉ sau khi DB xác nhận mới đổi PlayerState (người xung quanh thấy ngay).
 */
export function changeLooks(room: MapRoom, id: string, raw: unknown, rawNpc?: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); sendLooksInfo(room, id, text); };
  if (p.dead || d.travelling) return warn("Lúc này không đổi ngoại hình được.");
  const npc = typeof rawNpc === "string" ? room.npcNear(id, { id: rawNpc }) : room.npcNear(id, { role: "looks" });
  if (!npc || npcDef(npc.id)?.role !== "looks") return warn("Hãy lại gần thợ may hơn để đổi ngoại hình.");
  const looks = parseNewLooks(raw);
  if (!looks) return warn("Ngoại hình không hợp lệ.");
  const key = (l: { sex: number; hair: number; hairCol: number; outfitCol: number; skin: number; lpc?: string }) => l.lpc ? `L${l.lpc}` : `${l.sex}|${l.hair}|${l.hairCol}|${l.outfitCol}|${l.skin}`;
  if (key({ ...looks, lpc: looks.lpc ? encodeLpc(looks.lpc) : "" }) === key(p)) return warn("Ngoại hình này giống hiện tại, không cần đổi.");
  if (d.looksBusy) return warn("Đang đổi ngoại hình, đợi một chút.");
  const need = looksChangeCost(d.looksN);
  if (d.honTe < need) return warn(`Không đủ Hồn Tệ: đổi ngoại hình tốn ${formatHonTe(need)}, đang có ${formatHonTe(d.honTe)}.`);
  d.looksBusy = true;
  const done = d.looksN;
  room.chain(d, async () => {
    if (d.looksN !== done) return warn("Số lần đổi ngoại hình đã thay đổi, hãy mở lại hộp thoại.");
    const cost = looksChangeCost(done);
    if (d.honTe < cost) return warn(`Không đủ Hồn Tệ: đổi ngoại hình tốn ${formatHonTe(cost)}, đang có ${formatHonTe(d.honTe)}.`);
    d.honTe -= cost; d.bagDirty = true;
    let n: number | null;
    try { n = await store.changeLooks(d.accountId, looks, done, room.bagSnapshot(d)); }
    catch (e) { d.honTe += cost; d.bagDirty = true; warn("Không lưu được ngoại hình mới, thử lại sau (không mất Hồn Tệ)."); throw e; }
    if (n === null) { d.honTe += cost; d.bagDirty = true; return warn("Không đổi được ngoại hình (đã đổi ở nơi khác?), hãy mở lại hộp thoại."); }
    d.looksN = n;
    p.sex = looks.sex; p.hair = looks.hair; p.hairCol = looks.hairCol; p.outfitCol = looks.outfitCol; p.skin = looks.skin; p.lpc = looks.lpc ? encodeLpc(looks.lpc) : "";
    room.log(id, cost ? `Đổi ngoại hình xong: −${formatHonTe(cost)} (còn ${formatHonTe(d.honTe)}).` : "Đổi ngoại hình xong (lần đầu miễn phí).", "#e08cc8");
  }).then(() => { d.looksBusy = false; if (room.pdata.get(id) === d) { room.sendBag(id); sendLooksInfo(room, id); } });
}
