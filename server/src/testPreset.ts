// Mức dựng sẵn cho tài khoản TEST (#517): `max`, `giua-game`, `moi`. Dùng chung cho script `npm run seed:test` (server/scripts/seed-test-account.ts)
// và, từ #518, lệnh GM trong game. Mọi giới hạn lấy từ shared/data.ts (đổi luật thì mức dựng sẵn tự đổi theo); ở đây chỉ chọn "lấy mức nào".
// Dữ liệu sinh ra phải hợp lệ với luật server: buildPreset chạy checkSeed (các hàm parse / giới hạn của shared/data.ts) trước khi trả về.
//
// Định nghĩa từng mức:
//  - `max`: MỌI võ hồn (VOHON) cấp MAX_LEVEL, MAX_STARS sao, MAX_RINGS hồn hoàn mỗi vòng đúng ringLimit (niên hạn tối đa không phải đặt cược), 4 hồn kỹ
//    mạnh nhất, tiên thảo đủ HERB_MAX; MỖI võ hồn gắn 6 hồn cốt MAX_YEARS năm +BONE_MAX_ENHANCE và 6 hồn hạch MAX_CORE_STARS sao +CORE_MAX_ENHANCE
//    cùng một bộ (đủ hiệu ứng 2 / 4 món; bộ khác nhau giữa các võ hồn); 10 ô trang bị bậc cao nhất, cấp vật phẩm cao nhất, +EQUIP_MAX_ENHANCE,
//    may mắn dồn tối đa; túi BAG_MAX_SLOTS ô có đan, phù, lệnh, nguyên liệu, hồn hoàn mỗi bậc; Hồn Tệ MAX_HON_TE; mở mọi truyền tống trận;
//    đội 4 võ hồn mạnh nhất (calcStats) đứng ở Thiên Đấu Thành.
//  - `giua-game`: 6 võ hồn (Lam Ngân Thảo + 5 võ hồn SSR đầu danh sách chọn); 4 võ hồn đầu cấp GIUA.level, GIUA.rings hồn hoàn, GIUA.stars sao, 2 võ hồn
//    sau cấp GIUA.benchLevel; võ hồn ra trận gắn 6 hồn cốt 10.000 năm +5, 4 hồn hạch 4★ +6 cùng bộ, 10 trang bị Tử Kim +5; túi mở thêm một trang,
//    20 kim Hồn Tệ, truyền tống trận của các bản đồ tới cấp GIUA.level.
//  - `moi`: ngay sau lễ thức tỉnh: Lam Ngân Thảo + võ hồn SSR đầu danh sách chọn, cấp 1, không đồ (server tặng vật phẩm khởi đầu ở lần vào game đầu), ở Thánh Hồn Thôn.
import {
  VOHON, vohonIndex, AWAKEN_GIFT, AWAKEN_CHOICES, TEAM_SIZE, MAX_LEVEL, MAX_RINGS, MAX_STARS, MAX_YEARS, TIERS, tierOfYears, ringLimit, absorbChance, atBottleneck, calcStats,
  skillChoices, loadoutOf, parseLoadout, LOADOUT_SIZE, HERBS, HERB_MAX, parseTeam, parseLooks, DEFAULT_LOOKS, MAPS, DEFAULT_MAP, BAG_SLOTS, BAG_EXPAND, BAG_MAX_SLOTS, HON_TE_KIM,
  itemDef, RING_ITEM, shardCode, SHARD_UNLOCK, STARTER_ITEMS,
  BONE_ITEM, BONE_SLOTS, BONE_SKILLS, BONE_MAX_ENHANCE, boneEnhanceNeed, boneAddSubs, boneSubsDue, parseBone, parseBoneSubs, beastIndex, boneEnhanceClamp,
  CORE_ITEM, CORE_SETS, CORE_SLOTS, MAX_CORE_STARS, CORE_MAX_ENHANCE, coreEnhanceNeed, coreSubRolls, coreUpgradeSubs, rollCoreStats, parseCore, coreSlotOf, coreEnhanceClamp,
  CORE_MAX_SUBS, EQUIP_ITEM, EQUIP_SLOTS, EQUIP_TIERS, EQUIP_MAX_TIER, EQUIP_ILVL_K, EQUIP_MAX_ENHANCE, EQUIP_LUCK_MAX, EQUIP_MATERIALS, equipTemplate, rollEquip, parseEquip,
  equipEnhanceClamp,
  type CoreSetId, type EquipSlot,
} from "../../shared/data.ts";
import { allWaypoints } from "./map.ts";
import type { SeedData, SeedItem, SeedVohon } from "./db.ts";

export type PresetId = "max" | "giua-game" | "moi";
export const PRESETS: readonly PresetId[] = ["max", "giua-game", "moi"];
export const isPresetId = (x: unknown): x is PresetId => PRESETS.includes(x as PresetId);

/** Hồn Tệ (đồng) của mức `max`: 1.000 kim, đủ mở rộng túi, cường hóa và mua đồ nhiều lần mà còn xa giới hạn BIGINT / số nguyên an toàn. */
export const MAX_HON_TE = 1000 * HON_TE_KIM;
/** Số liệu mức `giua-game` (chọn ở đây, giới hạn thật vẫn lấy từ shared/data.ts). */
const GIUA = { level: 55, rings: 5, stars: 3, benchLevel: 30, benchRings: 3, benchStars: 2, boneYears: 10000, boneEnhance: 5, coreStars: 4, coreEnhance: 6, cores: 4,
  equipTier: 3, equipIlvl: 4, equipEnhance: 5, honTe: 20 * HON_TE_KIM, kills: 500, potions: 20 };
/** Nơi `max` và `giua-game` đứng: thành thủ đô (an toàn, có Đại Đấu Hồn Trường, bến thuyền, thương nhân). */
const START_MAP = "thien_dau_thanh";

/** Bộ số ngẫu nhiên có hạt (mulberry32): cùng mức dựng sẵn luôn ra cùng dữ liệu, để thử lại và so sánh được. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const item = (code: string, o: Partial<SeedItem> = {}): SeedItem => {
  const def = itemDef(code);
  if (!def) throw new Error(`Mã vật phẩm lạ: ${code}`);
  return { kind: def.kind, code, qty: 1, years: null, stars: null, enhance: 0, stats: null, ...o };
};
/** Vòng k (1..n) đúng giới hạn niên hạn của vòng đó (ringLimit): luôn hấp thụ thành công theo absorbChance. */
const ringsOf = (n: number) => Array.from({ length: n }, (_, k) => ringLimit(k + 1));
/** 4 hồn kỹ mạnh nhất (vòng cao nhất có hồn kỹ) trong các vòng đã mở, theo thứ tự vòng tăng dần; thiếu thì ô trống (-1). */
function bestLoadout(vohon: string, rings: number): number[] {
  const best = skillChoices(vohon, rings).slice(-LOADOUT_SIZE);
  return loadoutOf(vohon, [...best, ...Array(LOADOUT_SIZE - best.length).fill(-1)]);
}
const herbsOf = (n: number) => Object.fromEntries(HERBS.map((h) => [h.id, n]));
/** Sức mạnh thô của võ hồn (sinh lực × công, chưa tính đồ): chọn đội 4 võ hồn mạnh nhất. */
const power = (v: SeedVohon) => { const s = calcStats(vohonIndex(v.vohon), v.level, v.rings.map(tierOfYears), v.stars); return s.maxHp * s.atk; };
const vohonLv = (vohon: string, level: number, rings: number, stars: number, kills = 0, herbs = 0): SeedVohon =>
  ({ vohon, level, xp: 0, stars, rings: ringsOf(rings), kills, skills: rings ? bestLoadout(vohon, rings) : [], herbs: herbsOf(herbs) });

/** Loài có bộ kỹ năng hồn cốt (BONE_SKILLS) và còn trong BEASTS: chọn quay vòng cho các hồn cốt dựng sẵn. */
const BONE_BEASTS = Object.keys(BONE_SKILLS).filter((b) => beastIndex(b) >= 0);

/** 6 hồn cốt (mỗi vị trí một) gắn vào `vohon`: `years` năm, +`enhance` (đúng số điểm của cấp đó, đủ dòng phụ theo mốc). */
function bones(vohon: string, shift: number, years: number, enhance: number, rnd: () => number): SeedItem[] {
  return BONE_SLOTS.map((s, j) => {
    const e = boneEnhanceClamp(enhance);
    return item(BONE_ITEM, { years, enhance: e, vohon,
      stats: { beast: BONE_BEASTS[(shift + j) % BONE_BEASTS.length], slot: s.id, ...(e ? { xp: boneEnhanceNeed(e) } : {}),
        ...(boneSubsDue(e) ? { subs: boneAddSubs(s.id, years, e, [], rnd).subs } : {}) } });
  });
}
/** `n` hồn hạch cùng bộ `set` gắn vào `vohon` (ô 0..n-1): `stars` sao, +`enhance` (đúng số điểm; dòng phụ tăng theo mốc như khi nâng cấp thật). */
function cores(vohon: string, set: CoreSetId, n: number, stars: number, enhance: number, rnd: () => number): SeedItem[] {
  const e = coreEnhanceClamp(enhance), idx = CORE_SETS.findIndex((s) => s.id === set);
  return Array.from({ length: Math.min(n, CORE_SLOTS) }, (_, slot) => {
    const base = rollCoreStats(stars, [], rnd, idx), data = e ? coreUpgradeSubs(base, stars, coreSubRolls(0, e), rnd).data : base;
    return item(CORE_ITEM, { stars, enhance: e, vohon, stats: { set: data.set, main: data.main, subs: data.subs, slot, ...(e ? { xp: coreEnhanceNeed(e) } : {}) } });
  });
}
/** 10 trang bị đang mặc (một mỗi ô EQUIP_SLOTS) bậc `tier`, cấp vật phẩm `ilvl`, +`enhance`; `luck`: may mắn dồn vào các ô có may mắn (tối đa EQUIP_LUCK_MAX tổng). */
function equips(tier: number, ilvl: number, enhance: number, best: boolean, luck: number): SeedItem[] {
  const luckSlots = EQUIP_SLOTS.filter((s) => s.luck), per = (k: number) => Math.floor(Math.min(EQUIP_LUCK_MAX, luck) / luckSlots.length) + (k < Math.min(EQUIP_LUCK_MAX, luck) % luckSlots.length ? 1 : 0);
  return EQUIP_SLOTS.map((s, i) => {
    const tpl = equipTemplate(`${s.id}_${EQUIP_TIERS[tier].id}`);
    if (!tpl) throw new Error(`Không có mẫu trang bị ô ${s.id} bậc ${tier}`);
    // `best`: số ngẫu nhiên cố định 1 -> biến động chỉ số chính tối đa (+EQUIP_ROLL), dòng phụ ở mức tung cao nhất; không thì 0,5 (mức giữa).
    const base = rollEquip(tpl, ilvl, best ? () => 1 : () => 0.5), k = luckSlots.indexOf(s);
    return item(EQUIP_ITEM, { enhance: equipEnhanceClamp(enhance), equipSlot: i, stats: { ...base, luck: k >= 0 ? per(k) : 0 } });
  });
}
const potions = (qty: (stack: number) => number): SeedItem[] =>
  ["hoi_huyet_dan", "hoi_hon_dan", "dai_hoi_huyet_dan", "dai_hoi_hon_dan", "hoi_thanh_phu", "uy_thac_lenh"].map((c) => item(c, { qty: Math.max(1, Math.min(itemDef(c)!.stack, qty(itemDef(c)!.stack))) }));
const teamOf = (vs: SeedVohon[], pick: (v: SeedVohon) => number) => [...vs].sort((a, b) => pick(b) - pick(a) || vs.indexOf(a) - vs.indexOf(b)).slice(0, TEAM_SIZE).map((v) => v.vohon);
const bagSlots = (n: number) => Math.max(BAG_SLOTS, Math.min(BAG_MAX_SLOTS, n));

function presetMax(): SeedData {
  const rnd = seeded(1), vohons = VOHON.map((v) => vohonLv(v.id, MAX_LEVEL, MAX_RINGS, MAX_STARS, 0, HERB_MAX));
  const team = teamOf(vohons, power), items: SeedItem[] = [];
  vohons.forEach((v, i) => {
    items.push(...bones(v.vohon, i, MAX_YEARS, BONE_MAX_ENHANCE, rnd));
    items.push(...cores(v.vohon, CORE_SETS[i % CORE_SETS.length].id, CORE_SLOTS, MAX_CORE_STARS, CORE_MAX_ENHANCE, rnd));
  });
  items.push(...equips(EQUIP_MAX_TIER, EQUIP_ILVL_K.length, EQUIP_MAX_ENHANCE, true, EQUIP_LUCK_MAX));
  items.push(...potions((stack) => stack), ...EQUIP_MATERIALS.map((m) => item(m.id, { qty: m.stack })), ...TIERS.map((t) => item(RING_ITEM, { years: t.years })));
  return { vohons, active: team[0], team, items, honTe: MAX_HON_TE, slots: BAG_MAX_SLOTS, starter: true, waypoints: allWaypoints().map((w) => w.key), mapId: START_MAP, looks: { ...DEFAULT_LOOKS } };
}
function presetGiua(): SeedData {
  const rnd = seeded(2), picks = [AWAKEN_GIFT, ...AWAKEN_CHOICES.slice(0, 5).map((v) => v.id)];
  const vohons = picks.map((id, i) => i < TEAM_SIZE ? vohonLv(id, GIUA.level, GIUA.rings, GIUA.stars, GIUA.kills, 3) : vohonLv(id, GIUA.benchLevel, GIUA.benchRings, GIUA.benchStars));
  const team = vohons.slice(0, TEAM_SIZE).map((v) => v.vohon), main = team[0];
  const items = [...bones(main, 0, GIUA.boneYears, GIUA.boneEnhance, rnd), ...cores(main, CORE_SETS[0].id, GIUA.cores, GIUA.coreStars, GIUA.coreEnhance, rnd),
    ...equips(GIUA.equipTier, GIUA.equipIlvl, GIUA.equipEnhance, false, 0), ...potions(() => GIUA.potions),
    ...VOHON.filter((v) => !picks.includes(v.id)).slice(0, 2).map((v) => item(shardCode(v.id), { qty: SHARD_UNLOCK - 1 }))];
  const maps = (id: string) => MAPS[id] && MAPS[id].kind !== "boss" && (MAPS[id].level === null || MAPS[id].level![0] <= GIUA.level);
  return { vohons, active: main, team, items, honTe: GIUA.honTe, slots: bagSlots(BAG_SLOTS + BAG_EXPAND), starter: true,
    waypoints: allWaypoints().filter((w) => maps(w.map)).map((w) => w.key), mapId: START_MAP, looks: { ...DEFAULT_LOOKS } };
}
function presetMoi(): SeedData {
  const pick = AWAKEN_CHOICES[0].id, vohons = [AWAKEN_GIFT, pick].map((id) => vohonLv(id, 1, 0, 1));
  return { vohons, active: pick, team: [pick, AWAKEN_GIFT], items: [], honTe: 0, slots: BAG_SLOTS, starter: false, waypoints: [], mapId: null, looks: { ...DEFAULT_LOOKS } };
}

/** Dữ liệu dựng sẵn của mức `id` (đã qua checkSeed). */
export function buildPreset(id: PresetId): SeedData {
  const d = id === "max" ? presetMax() : id === "giua-game" ? presetGiua() : presetMoi();
  const bad = checkSeed(d);
  if (bad.length) throw new Error(`Mức dựng sẵn "${id}" không hợp lệ với luật server:\n  - ${bad.join("\n  - ")}`);
  return d;
}

/**
 * Kiểm dữ liệu dựng sẵn bằng đúng các hàm parse / giới hạn server dùng; trả danh sách lỗi (rỗng = hợp lệ). Kiểm cả dữ liệu do chỗ khác
 * (lệnh GM) tạo ra, nên không giả định gì về buildPreset.
 */
export function checkSeed(d: SeedData): string[] {
  const bad: string[] = [], codes = new Set(d.vohons.map((v) => v.vohon));
  if (!parseTeam(Array.from({ length: TEAM_SIZE }, (_, i) => (i < d.team.length ? i + 1 : 0)))) bad.push("đội hình sai dạng");
  if (!d.team.includes(d.active)) bad.push("võ hồn ra trận không nằm trong đội");
  if (!d.looks || !parseLooks(d.looks)) bad.push("ngoại hình không hợp lệ");
  if (d.mapId !== null && !MAPS[d.mapId]) bad.push(`bản đồ lạ ${d.mapId}`);
  if (!Number.isSafeInteger(d.honTe) || d.honTe < 0) bad.push(`Hồn Tệ không hợp lệ: ${d.honTe}`);
  if (!Number.isInteger(d.slots) || d.slots < BAG_SLOTS || d.slots > BAG_MAX_SLOTS) bad.push(`số ô túi không hợp lệ: ${d.slots}`);
  const wps = new Set(allWaypoints().map((w) => w.key));
  for (const w of d.waypoints) if (!wps.has(w)) bad.push(`truyền tống trận lạ ${w}`);
  for (const v of d.vohons) {
    const at = `võ hồn ${v.vohon}`;
    if (vohonIndex(v.vohon) < 0) { bad.push(`${at}: mã lạ`); continue; }
    if (!Number.isInteger(v.level) || v.level < 1 || v.level > MAX_LEVEL) bad.push(`${at}: cấp ${v.level} ngoài 1..${MAX_LEVEL}`);
    if (!Number.isInteger(v.stars) || v.stars < 1 || v.stars > MAX_STARS) bad.push(`${at}: sao ${v.stars} ngoài 1..${MAX_STARS}`);
    if (v.rings.length > MAX_RINGS) bad.push(`${at}: ${v.rings.length} hồn hoàn quá ${MAX_RINGS}`);
    v.rings.forEach((y, k) => { if (absorbChance(y, k + 1).fail !== 0 || !(y >= TIERS[0].years)) bad.push(`${at}: vòng ${k + 1} ${y} năm vượt giới hạn ${ringLimit(k + 1)}`); });
    // Cấp tối đa tới bình cảnh kế tiếp của số hồn hoàn đã có (atBottleneck: từ cấp 10 × (hồn hoàn + 1) kinh nghiệm dừng); cao hơn là luật server chưa cho tới.
    if (atBottleneck(v.level, v.rings.length) && v.level > 10 * (v.rings.length + 1)) bad.push(`${at}: cấp ${v.level} vượt bình cảnh của ${v.rings.length} hồn hoàn`);
    if (v.skills.length && (!parseLoadout(v.skills) || loadoutOf(v.vohon, v.skills).some((r, i) => r !== v.skills[i]))) bad.push(`${at}: hồn kỹ mang theo không hợp lệ`);
    if (v.skills.some((r) => r >= v.rings.length)) bad.push(`${at}: mang hồn kỹ của vòng chưa có hồn hoàn`);
    for (const h of HERBS) if ((v.herbs[h.id] ?? 0) > HERB_MAX) bad.push(`${at}: tiên thảo ${h.id} quá ${HERB_MAX}`);
    if (!Number.isInteger(v.xp) || v.xp < 0) bad.push(`${at}: kinh nghiệm không hợp lệ`);
  }
  const boneAt = new Set<string>(), coreAt = new Set<string>(), worn = new Set<number>();
  for (const i of d.items) {
    const def = itemDef(i.code), at = `món ${i.code}`;
    if (!def) { bad.push(`${at}: mã lạ`); continue; }
    if (def.kind !== i.kind) bad.push(`${at}: nhóm ${i.kind} khác ${def.kind}`);
    if (!Number.isInteger(i.qty) || i.qty < 1 || i.qty > def.stack) bad.push(`${at}: số lượng ${i.qty} ngoài 1..${def.stack}`);
    if (i.vohon !== undefined && !codes.has(i.vohon)) bad.push(`${at}: gắn vào võ hồn lạ ${i.vohon}`);
    if (i.code === RING_ITEM && !(i.years && i.years >= TIERS[0].years && i.years <= MAX_YEARS)) bad.push(`${at}: số năm ${i.years} không hợp lệ`);
    if (i.code === BONE_ITEM) {
      const b = parseBone(i.stats), k = `${i.vohon}|${b?.slot}`;
      if (!b || !i.vohon || i.years === null || i.years < TIERS[0].years || i.years > MAX_YEARS || beastIndex(b.beast) < 0) bad.push(`${at}: hồn cốt hỏng`);
      else {
        if (boneAt.has(k)) bad.push(`${at}: hai hồn cốt cùng vị trí ${b.slot} trên ${i.vohon}`); boneAt.add(k);
        if (i.enhance !== boneEnhanceClamp(i.enhance)) bad.push(`${at}: cấp cường hóa ${i.enhance} ngoài khoảng`);
        if (parseBoneSubs(i.stats).length !== boneSubsDue(i.enhance)) bad.push(`${at}: số dòng phụ khác ${boneSubsDue(i.enhance)} của +${i.enhance}`);
        if (boneEnhanceNeed(i.enhance) !== ((i.stats as { xp?: number }).xp ?? 0)) bad.push(`${at}: điểm cường hóa không khớp +${i.enhance}`);
      }
    } else if (i.code === CORE_ITEM) {
      const c = parseCore(i.stats), slot = coreSlotOf(i.stats), k = `${i.vohon}|${slot}`;
      if (!c || !i.vohon || slot < 0 || !i.stars || i.stars < 1 || i.stars > MAX_CORE_STARS) bad.push(`${at}: hồn hạch hỏng`);
      else {
        if (coreAt.has(k)) bad.push(`${at}: hai hồn hạch cùng ô ${slot} trên ${i.vohon}`); coreAt.add(k);
        if (c.subs.length > CORE_MAX_SUBS) bad.push(`${at}: quá ${CORE_MAX_SUBS} dòng phụ`);
        if (i.enhance !== coreEnhanceClamp(i.enhance) || coreEnhanceNeed(i.enhance) !== ((i.stats as { xp?: number }).xp ?? 0)) bad.push(`${at}: cấp nâng cấp ${i.enhance} không khớp điểm`);
      }
    } else if (i.code === EQUIP_ITEM) {
      const e = parseEquip(i.stats), s = i.equipSlot;
      if (!e || JSON.stringify(e.affixes) !== JSON.stringify((i.stats as { affixes: unknown }).affixes)) bad.push(`${at}: trang bị hỏng`);
      else {
        const t = equipTemplate(e.tpl)!;
        if (s !== undefined && EQUIP_SLOTS[s]?.id !== (t.slot as EquipSlot)) bad.push(`${at}: mẫu ${e.tpl} không hợp ô ${s}`);
        if (e.affixes.length !== EQUIP_TIERS[t.tier].lines) bad.push(`${at}: ${e.affixes.length} dòng phụ khác ${EQUIP_TIERS[t.tier].lines} của bậc`);
        if (i.enhance !== equipEnhanceClamp(i.enhance)) bad.push(`${at}: cấp cường hóa ${i.enhance} ngoài khoảng`);
      }
      if (i.vohon !== undefined) bad.push(`${at}: trang bị không gắn võ hồn`);
      if (s !== undefined) { if (worn.has(s)) bad.push(`${at}: hai món cùng ô ${s}`); worn.add(s); }
    }
    if (i.code !== BONE_ITEM && i.code !== CORE_ITEM && i.vohon !== undefined) bad.push(`${at}: chỉ hồn cốt / hồn hạch được gắn võ hồn`);
    if (i.code !== EQUIP_ITEM && i.equipSlot !== undefined) bad.push(`${at}: chỉ trang bị có ô mặc`);
  }
  if (d.items.filter((i) => i.vohon === undefined).length > d.slots) bad.push(`túi có ${d.items.filter((i) => i.vohon === undefined).length} ô, quá ${d.slots}`);
  return bad;
}

/** Tóm tắt dữ liệu dựng sẵn để in ở chế độ chạy thử (đủ để biết sẽ ghi gì, không in toàn bộ dòng). */
export function describeSeed(d: SeedData): string[] {
  const by = (code: string) => d.items.filter((i) => i.code === code);
  const bag = d.items.filter((i) => i.vohon === undefined && i.equipSlot === undefined);
  const lv = d.vohons.map((v) => v.level), rings = d.vohons.map((v) => v.rings.length), stars = d.vohons.map((v) => v.stars);
  const range = (a: number[]) => (Math.min(...a) === Math.max(...a) ? `${a[0]}` : `${Math.min(...a)}–${Math.max(...a)}`);
  return [
    `Võ hồn: ${d.vohons.length} (cấp ${range(lv)}, ${range(rings)} hồn hoàn, ${range(stars)} sao); ra trận: ${d.active}`,
    `Đội hình: ${d.team.join(", ")}`,
    `Hồn cốt đang gắn: ${by(BONE_ITEM).length}; hồn hạch đang gắn: ${by(CORE_ITEM).length}; trang bị đang mặc: ${by(EQUIP_ITEM).length}`,
    `Túi: ${bag.length} ô dùng / ${d.slots} ô; Hồn Tệ: ${d.honTe.toLocaleString("vi-VN")} đồng`,
    `Truyền tống trận đã mở: ${d.waypoints.length}; bản đồ: ${d.mapId ?? `(chưa lưu: ${DEFAULT_MAP})`}`,
    `Vật phẩm khởi đầu: ${d.starter ? "coi như đã nhận" : `chưa nhận (server tặng ${STARTER_ITEMS.map((s) => `${s.qty} ${s.code}`).join(", ")} ở lần vào game đầu)`}`,
  ];
}
