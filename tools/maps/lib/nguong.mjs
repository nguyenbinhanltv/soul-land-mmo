// Ngưỡng chỉ tiêu bố cục bản đồ theo loại map (docs/design/cai-to-luong-di-chuyen-ban-do.md phần 1.1; L4 #1662). Hàm thuần, kiểm thử: nguong.test.mjs.
// Chỉ tiêu thiết kế của công cụ dựng, KHÔNG phải số cân bằng nên không vào shared/data.ts. Chỉ số đo ở lib/luong.mjs (`gridStats`).
// Chưa kiểm: hành lang chính / đường nhánh rộng tối thiểu (cần tuyến mốc, đo ở do-luong.mjs --tuyen).

/** MapKind (shared/data.ts) → nhóm chỉ tiêu. town = tông môn / thành; hunt = dã ngoại / săn; boss, arena = PvP / phụ bản. */
export const GROUP_OF_KIND = { hunt: "dã ngoại", town: "tông môn / thành", boss: "PvP / phụ bản", arena: "PvP / phụ bản" };

/**
 * Chỉ tiêu: key = trường của kết quả đo; max / min theo từng nhóm. `chanCung` của PvP / phụ bản tính trên sân chơi (không tính viền)
 * nên lấy `chanTrong` (key `dung`).
 */
export const CRITERIA = [
  { key: "chanCung", dung: { "PvP / phụ bản": "chanTrong" }, ten: "Chặn cứng %", max: { "dã ngoại": 20, "tông môn / thành": 35, "PvP / phụ bản": 15 } },
  { key: "nhoPct", ten: "Cụm chặn 1–3 ô / ô chặn %", max: { "dã ngoại": 5, "tông môn / thành": 3, "PvP / phụ bản": 0 } },
  { key: "hepPct", ten: "Ô trong hành lang ≤ 2 ô %", max: { "dã ngoại": 10, "tông môn / thành": 6, "PvP / phụ bản": 3 } },
  { key: "thoangPct", ten: "Ô trong khoảng trống ≥ 5×5 %", min: { "dã ngoại": 60, "tông môn / thành": 70, "PvP / phụ bản": 80 } },
  { key: "kepCheo", ten: "Kẹt chéo /1000 ô", max: { "dã ngoại": 2, "tông môn / thành": 1, "PvP / phụ bản": 0 } },
  { key: "ngoCut", ten: "Ngõ cụt /1000 ô đi được", max: { "dã ngoại": 8, "tông môn / thành": 2, "PvP / phụ bản": 0 } },
  { key: "sauKhe", ten: "Ô sau cổ chai", max: { "dã ngoại": 0, "tông môn / thành": 0, "PvP / phụ bản": 0 } },
];

/** Danh sách chỉ tiêu bị vượt của một kết quả đo `{ kind, ... }`: `[{ key, ten, value, limit, op }]` (op "≤" nghĩa là phải ≤ limit). */
export function violations(res) {
  const group = GROUP_OF_KIND[res.kind];
  if (!group) return [];
  const out = [];
  for (const c of CRITERIA) {
    const value = res[c.dung?.[group] ?? c.key];
    if (typeof value !== "number") continue;
    const lim = c.max?.[group] ?? c.min?.[group];
    if (lim === undefined) continue;
    const bad = c.max ? value > lim + 1e-9 : value < lim - 1e-9;
    if (bad) out.push({ key: c.key, ten: c.ten, value, limit: lim, op: c.max ? "≤" : "≥" });
  }
  return out;
}
