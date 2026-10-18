// Dữ liệu game dùng chung cho client và server.
// Sửa cân bằng game ở đây – cả hai phía sẽ dùng cùng con số.

export interface TierDef {
  age: string; col: string; glow: string;
  hp: number; dmg: number; xp: number; spd: number;
  atkb: number; hpb: number; size: number; beast: string; body: string;
}

export const TIERS: TierDef[] = [
  { age: "10 năm",      col: "#f3f3f3", glow: "#ffffff", hp: 30,   dmg: 4,  xp: 12,   spd: 26, atkb: 2,  hpb: 12,  size: 8,  beast: "Thỏ Gai",          body: "#d9cbb3" },
  { age: "100 năm",     col: "#f2c84b", glow: "#ffe08a", hp: 95,   dmg: 9,  xp: 40,   spd: 32, atkb: 5,  hpb: 30,  size: 11, beast: "Lang Xám",         body: "#8b8f96" },
  { age: "1.000 năm",   col: "#a253e0", glow: "#c99bff", hp: 300,  dmg: 19, xp: 150,  spd: 36, atkb: 12, hpb: 80,  size: 13, beast: "Báo Vằn Tím",      body: "#5d4380" },
  { age: "10.000 năm",  col: "#1a1820", glow: "#8a6bff", hp: 950,  dmg: 42, xp: 500,  spd: 33, atkb: 30, hpb: 220, size: 16, beast: "Hùng Hắc Giáp",    body: "#2c2c35" },
  { age: "100.000 năm", col: "#e0303a", glow: "#ff6a5a", hp: 4200, dmg: 95, xp: 2500, spd: 40, atkb: 85, hpb: 700, size: 22, beast: "Huyết Mãng Vương", body: "#8f1f2a" },
];

export const TIER_MULT = [1, 1.35, 1.9, 2.8, 4.5];

export interface VoHonDef {
  name: string; kind: string; col: string; robe: string; trait: string;
  atk: number; hp: number; mp: number; spd: number; def: number;
}

export const VOHON: VoHonDef[] = [
  { name: "Hỏa Long Thương", kind: "Khí võ hồn", col: "#ff7a3a", robe: "#9c3a22", trait: "Sát thương cao hơn 15%",        atk: 1.15, hp: 0.95, mp: 1,    spd: 1,    def: 1 },
  { name: "Băng Tuyết Hồ",   kind: "Thú võ hồn", col: "#8fe0ff", robe: "#2f6b8f", trait: "Hồn lực dồi dào, hồi nhanh",    atk: 1,    hp: 1,    mp: 1.35, spd: 1,    def: 1 },
  { name: "Lôi Ưng",         kind: "Thú võ hồn", col: "#d7b6ff", robe: "#4b3a8f", trait: "Di chuyển nhanh hơn 18%",       atk: 1.05, hp: 0.95, mp: 1,    spd: 1.18, def: 1 },
  { name: "Thanh Mộc Đằng",  kind: "Khí võ hồn", col: "#7ee07a", robe: "#2f6b3a", trait: "Sinh lực tăng 30%",             atk: 0.95, hp: 1.3,  mp: 1,    spd: 1,    def: 1 },
  { name: "Kim Cương Thuẫn", kind: "Khí võ hồn", col: "#f2d06b", robe: "#7a5f22", trait: "Giảm 25% sát thương phải chịu", atk: 0.95, hp: 1.1,  mp: 1,    spd: 0.95, def: 0.75 },
];

export const SKILLS = [
  { name: "Hồn Bạo",    cost: 12, cd: 3,   desc: "Nổ hồn lực quanh thân" },
  { name: "Thiểm Kích", cost: 16, cd: 4.5, desc: "Lao về phía trước" },
  { name: "Hồn Tiễn",   cost: 22, cd: 5,   desc: "Bắn 10 mũi hồn lực" },
  { name: "Hồn Vực",    cost: 40, cd: 12,  desc: "Lãnh vực hủy diệt" },
];

/** Niên hạn tối đa (chỉ số tier) mà vòng thứ `slot` chịu được. */
export const ringLimit = (slot: number) => (slot === 1 ? 1 : slot <= 3 ? 2 : slot <= 6 ? 3 : 4);
export const xpNeed = (level: number) => Math.floor(10 + level * level * 1.2);
export const atBottleneck = (level: number, rings: number) => level >= 10 * (rings + 1);

export function calcStats(vh: number, level: number, rings: number[]) {
  const v = VOHON[vh];
  let hpB = 0, atkB = 0;
  for (const t of rings) { hpB += TIERS[t].hpb; atkB += TIERS[t].atkb; }
  return {
    maxHp: Math.round((80 + level * 14 + hpB) * v.hp),
    maxMp: Math.round((40 + level * 4 + rings.length * 15) * v.mp),
    atk: (6 + level * 1.6 + atkB) * v.atk,
    speed: 58 * v.spd,
  };
}

export const TILE = 16;
export const TICK_RATE = 20; // số lần server cập nhật mỗi giây
