// Đặc tính riêng theo loài của hồn thú (#116, mục 5.3): thú thực vật đứng yên. Số liệu ở shared/data.ts; MapRoom chỉ gọi các hàm này.
import { BEASTS, BOSSES, BEAST_ROOTED } from "../../../shared/data.ts";

/** Mã loài gốc (BEASTS) của hồn thú: tinh anh / thú vương / boss thế giới (`rank` ≥ 1, `species` là chỉ số BOSSES) mượn loài gốc. */
export function speciesId(rank: number, species: number): string {
  return rank >= 1 ? BOSSES[species]?.species ?? "" : BEASTS[species]?.id ?? "";
}

/** Hồn thú thường / tinh anh thuộc loài cắm rễ (BEAST_ROOTED). Thú vương, boss thế giới có luật hang riêng nên không tính. */
export const isRooted = (rank: number, species: number) => rank <= 1 && BEAST_ROOTED.ids.includes(speciesId(rank, species));
