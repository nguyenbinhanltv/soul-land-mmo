// Chia buff / hồi máu đội (GAME_DESIGN.md mục 5.2, 9.1, 9.2; #702, miền E4): hiệu ứng lên bản thân của hồn kỹ (`selfEffect`), hồi sinh lực cả đội (`healTeam`), mã võ hồn gốc để lan (`shareOf`),
// lan hiệu ứng phụ trợ cho đồng đội tổ đội đứng gần (`partyShare`). Hàm nhận phòng (`room: MapRoom`) như stats.ts / contrib.ts / motion.ts (`shareOf` là hàm thuần); nguyên văn từ MapRoom, không đổi
// thứ tự áp buff / hằng. `partyBuffNear` và `healMult` bị `ArenaRoom` override nên LUÔN gọi qua `room.partyBuffNear` / `room.healMult`, `partyBuffNear` ở lại MapRoom. `healTeam` / `partyShare` gọi trực tiếp trong module vì không lớp con hay script nào override (nếu sau này có thì phải đổi sang `room.x`). MapRoom chỉ chuyển tiếp
// (`skill.ts` / `tienco.ts` / `combat.ts` / `ava.ts` / `team.ts` gọi `room.selfEffect` / `room.healTeam` / `room.partyShare` / `room.shareOf` như cũ).
import { VOHON, vohonIndex, PARTY_BUFF_MULT, PARTY_BUFF_SKIP, BUFFS, type SkillDef, type BuffId } from "../../../shared/data.ts";
import type { PlayerState } from "./schema.ts";
import type { MapRoom } from "./MapRoom.ts";

/** Hồi sinh lực theo tỉ lệ cho võ hồn ra trận và mọi võ hồn chưa gục trong đội (Hộ Thể, Vô Địch Thần Quang). */
export function healTeam(room: MapRoom, id: string, frac: number) {
  const p = room.state.players.get(id)!, d = room.pdata.get(id)!;
  d.hpF = Math.min(p.maxHp, d.hpF + p.maxHp * frac); p.hp = Math.ceil(d.hpF);
  for (const r of d.team) {
    const v = d.owned.find((o) => o.rowId === r);
    if (!v || v === d.ch || d.down.has(r) || !d.benchHp.has(r)) continue;
    const max = room.maxHpOf(d, v), hp = d.benchHp.get(r)! + max * frac;
    if (hp >= max) d.benchHp.delete(r); else d.benchHp.set(r, hp);
  }
}

/**
 * Hiệu ứng lên bản thân của hồn kỹ (SkillDef.self): hiệu ứng có lợi, hồi sinh lực cả đội, khiên, hồi hồn lực; nhân `bpow`.
 * `share` (9.1): mã võ hồn gốc của hồn kỹ khi được lan cho đồng đội tổ đội đứng gần (partyShare); bỏ trống thì chỉ lên chính mình.
 */
export function selfEffect(room: MapRoom, id: string, e: NonNullable<SkillDef["self"]>, bpow: number, col: string, share?: string) {
  const p = room.state.players.get(id)!, d = room.pdata.get(id)!, secs = e.secs ?? 5;
  for (const [b, v] of Object.entries(e.buff ?? {}) as [BuffId, number][]) {
    const cur = d.buffs.get(b), val = b === "inv" || b === "hide" ? 1 : v * bpow;
    d.buffs.set(b, { t: Math.max(cur?.t ?? 0, secs), v: Math.max(cur?.v ?? 0, val) });
  }
  room.syncBuffs(p, d);
  const hm = room.healMult(d); // bộ hồn hạch Lưu Ly 2 món (5.2), ràng buộc Lam Ngân Hoàng (9.4): hồi máu và khiên mạnh thêm
  if (e.heal) healTeam(room, id, e.heal * bpow * hm);
  if (e.shield) { d.shield = Math.max(d.shield, Math.round(p.maxHp * e.shield * bpow * hm)); d.shieldT = Math.max(d.shieldT, secs); p.shield = d.shield; }
  if (e.mp) { d.mpF = Math.min(p.maxMp, d.mpF + p.maxMp * e.mp * bpow); p.mp = Math.floor(d.mpF); }
  if (e.cleanse) room.clearPStatus(p, d); // giải khống chế (Xúc Xích, từ 3.5)
  room.broadcast("fx", { k: "buff", id, col });
  if (share) partyShare(room, id, e, bpow, hm, col, share);
}

/**
 * Mã võ hồn gốc `src` để lan hiệu ứng lên bản thân cho tổ đội (9.1) nếu võ hồn đang ra trận của người tung thuộc hệ Phụ trợ,
 * không thì undefined (không lan). `src` khác võ hồn ra trận khi Phục Chế chép hồn kỹ của võ hồn khác.
 */
export function shareOf(p: PlayerState, src: string) { return VOHON[p.vh].he === "phu_tro" ? src : undefined; }

/**
 * Lan hiệu ứng lên bản thân `e` của người tung `id` cho đồng đội đứng gần (9.1), mức × PARTY_BUFF_MULT: hiệu ứng có lợi (trừ
 * PARTY_BUFF_SKIP; tàng hình chỉ khi võ hồn gốc `src` là Phụ trợ), hồi sinh lực và khiên theo sinh lực tối đa của võ hồn đang ra trận
 * của đồng đội (`hm`: hệ số hồi máu / khiên của người tung), hồn lực. Cùng hiệu ứng thì lấy mức mạnh hơn và thời gian dài hơn.
 * Thanh tẩy lan tới đồng đội hợp lệ nhưng không nhân hệ số. Đồng đội thấy số hồi / khiên trên đầu và một dòng "<tên> … cho bạn".
 */
export function partyShare(room: MapRoom, id: string, e: NonNullable<SkillDef["self"]>, bpow: number, hm: number, col: string, src: string) {
  const p = room.state.players.get(id); if (!p) return;
  const secs = e.secs ?? 5, m = PARTY_BUFF_MULT, hideOk = VOHON[Math.max(0, vohonIndex(src))].he === "phu_tro";
  const buffs = (Object.entries(e.buff ?? {}) as [BuffId, number][]).filter(([b]) => !PARTY_BUFF_SKIP.includes(b) && (b !== "hide" || hideOk));
  for (const qid of room.partyBuffNear(id)) {
    const q = room.state.players.get(qid)!, o = room.pdata.get(qid)!, said: string[] = [];
    for (const [b, v] of buffs) {
      const cur = o.buffs.get(b), val = b === "inv" || b === "hide" ? 1 : v * bpow * m;
      o.buffs.set(b, { t: Math.max(cur?.t ?? 0, secs), v: Math.max(cur?.v ?? 0, val) });
      said.push(BUFFS[b].name.toLowerCase());
    }
    if (buffs.length) { room.syncBuffs(q, o); room.broadcast("fx", { k: "buff", id: qid, col, ally: true }); }
    let sup = 0; // 9.2: sinh lực hồi thực + khiên tạo thêm cho đồng đội, tính đóng góp boss của người tung
    if (e.heal) {
      const add = Math.min(q.maxHp - o.hpF, q.maxHp * e.heal * bpow * hm * m);
      if (add > 0) {
        o.hpF += add; q.hp = Math.ceil(o.hpF); sup += add; said.push(`hồi ${Math.round(add)} sinh lực`);
        room.broadcast("dmg", { x: q.x, y: q.y - 18, v: Math.round(add), c: "#7dff8a", heal: true, to: qid });
      }
    }
    if (e.shield) {
      const sh = Math.round(q.maxHp * e.shield * bpow * hm * m), gain = sh - o.shield;
      o.shield = Math.max(o.shield, sh); o.shieldT = Math.max(o.shieldT, secs); q.shield = o.shield;
      if (gain > 0) { sup += gain; said.push(`tạo khiên ${gain}`); room.broadcast("dmg", { x: q.x, y: q.y - 26, v: gain, c: "#9ad8ff", shield: true, to: qid }); }
    }
    if (e.mp) {
      const add = Math.min(q.maxMp - o.mpF, q.maxMp * e.mp * bpow * m);
      if (add > 0) { o.mpF += add; q.mp = Math.floor(o.mpF); said.push(`hồi ${Math.round(add)} hồn lực`); }
    }
    if (e.cleanse) {
      const hadStatus = o.st.size > 0;
      room.clearPStatus(q, o);
      if (hadStatus) said.push("thanh tẩy");
    }
    if (said.length) room.log(qid, `${p.name} ${said.join(", ")} cho bạn.`, col);
    if (sup > 0) room.supportCredit(id, qid, sup);
  }
}
