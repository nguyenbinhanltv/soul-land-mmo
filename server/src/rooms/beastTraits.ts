// Đặc tính riêng theo loài của hồn thú (#116, mục 5.1, 5.3): thú thực vật đứng yên, chỉ số thủ. Số liệu ở shared/data.ts; MapRoom chỉ gọi các hàm này.
import { BEAST_ROOTED, beastBase, beastDef, type BeastSkillDef } from "../../../shared/data.ts";

/** Hồn thú thường / tinh anh thuộc loài cắm rễ (BEAST_ROOTED). Thú vương, boss thế giới có luật hang riêng nên không tính. */
export const isRooted = (rank: number, species: number) => rank <= 1 && BEAST_ROOTED.ids.includes(beastBase(rank, species)?.id ?? "");

/** Tầm với của thú đứng yên (BEAST_ROOTED): tầm đánh thường kề bên (`melee`) hoặc tầm chiêu báo trước xa nhất, cộng `margin`. */
export const rootedReach = (melee: number, skills: readonly BeastSkillDef[]) => Math.max(melee, ...skills.map((s) => s.range)) + BEAST_ROOTED.margin;

/** Thủ của hồn thú (#116, BEAST_DEF): theo loài gốc và số năm. */
export const beastDefOf = (rank: number, species: number, years: number) => beastDef(beastBase(rank, species)?.id ?? "", years);
