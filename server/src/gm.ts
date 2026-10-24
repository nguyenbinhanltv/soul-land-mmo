// Lệnh GM trong game cho tài khoản admin (#518): phần thuần (danh sách admin, giới hạn tốc độ, đọc và kiểm lệnh), không đụng phòng game.
// Phòng thực thi lệnh ở MapRoom.gmAction; mọi giới hạn lấy từ shared/data.ts. Dùng chung logic mức dựng sẵn với script (testPreset.ts).
//
// Bật bằng biến môi trường ADMIN_ACCOUNTS = danh sách `accounts.id` cách nhau dấu phẩy (vd "12,57"). Trống / thiếu / sai dạng = TẮT HẲN:
// mọi lệnh bị từ chối. Admin dùng lệnh thì tài khoản tự bật is_test (ẩn khỏi xếp hạng, chỉ đấu trường với tài khoản test).
import {
  MAX_LEVEL, MAX_YEARS, TIERS, BONE_SLOTS, BONE_MAX_ENHANCE, CORE_SETS, MAX_CORE_STARS, CORE_MAX_ENHANCE, EQUIP_ILVL_K, EQUIP_MAX_ENHANCE, MAPS, VOHON, MAX_RINGS,
  itemDef, equipTemplate, beastIndex, BONE_ITEM, CORE_ITEM, EQUIP_ITEM, RING_ITEM, BAG_MAX_SLOTS, vohonIndex,
} from "../../shared/data.ts";
import { PRESETS, isPresetId, MAX_HON_TE, type PresetId } from "./testPreset.ts";

/** Tài khoản admin (`accounts.id`) đọc từ ADMIN_ACCOUNTS; mục không phải số nguyên dương thì bỏ qua. */
export function parseAdmins(raw: string | undefined): Set<number> {
  const out = new Set<number>();
  for (const x of (raw ?? "").split(",")) { const t = x.trim(); if (/^\d{1,15}$/.test(t) && Number(t) > 0) out.add(Number(t)); }
  return out;
}
const admins = parseAdmins(process.env.ADMIN_ACCOUNTS);
/** Lệnh GM có đang bật không (có ít nhất một admin). */
export const gmEnabled = () => admins.size > 0;
export const isAdmin = (accountId: number) => admins.has(accountId);
/** Chỉ hook test (GAME_TEST=1, `gmadmin`) thêm / bớt admin lúc chạy, vì bot không biết trước mã tài khoản. */
export const _gmSetAdmin = (accountId: number, on: boolean) => { if (on) admins.add(accountId); else admins.delete(accountId); };

/** Giới hạn tốc độ: tối đa GM_BURST lệnh (kể cả bị từ chối) mỗi GM_WINDOW_MS cho mỗi tài khoản; chặn dò quyền và spam nhật ký. */
export const GM_BURST = 20, GM_WINDOW_MS = 10_000;
const hits = new Map<number, number[]>();
export function gmAllow(accountId: number, now: number): boolean {
  const list = (hits.get(accountId) ?? []).filter((t) => now - t < GM_WINDOW_MS);
  if (list.length >= GM_BURST) { hits.set(accountId, list); return false; }
  list.push(now); hits.set(accountId, list);
  return true;
}
/** Chỉ cho hook / kiểm thử đặt lại bộ đếm. */
export const _gmReset = () => hits.clear();

/** Độ dài tối đa một dòng lệnh (ký tự). */
export const GM_MAX_LEN = 200;
export type GmCmd =
  | { op: "level"; level: number }
  | { op: "give"; code: string; qty: number }
  | { op: "ring"; years: number; qty: number }
  | { op: "bone"; beast: string; slot: string; years: number; enhance: number }
  | { op: "core"; set: string; stars: number; enhance: number }
  | { op: "gear"; tpl: string; ilvl: number; enhance: number }
  | { op: "vohon"; vohon: string; level: number; rings: number }
  | { op: "coin"; n: number }
  | { op: "tp"; mapId: string }
  | { op: "fog"; mode: "open" | "reset" }
  | { op: "preset"; preset: PresetId };

/** Trợ giúp: cú pháp từng lệnh (gõ `/gm` không kèm gì để xem). */
export const GM_HELP = [
  "/gm level <cấp>", "/gm give <mã vật phẩm> [số lượng]", "/gm ring <số năm> [số lượng]", "/gm bone <mã loài> <vị trí> [số năm] [cường hóa]",
  "/gm core <mã bộ> <sao> [nâng cấp]", "/gm gear <mã mẫu> [cấp vật phẩm] [cường hóa]", "/gm vohon <mã võ hồn> [cấp] [số hồn hoàn]", "/gm coin <đồng>",
  "/gm tp <mã bản đồ>", "/gm fog [open|reset]", `/gm preset ${PRESETS.join("|")}`,
];

const num = (s: string | undefined, lo: number, hi: number, def: number | null, what: string): number | { error: string } => {
  if (s === undefined) return def === null ? { error: `Thiếu ${what}.` } : def;
  if (!/^-?\d+$/.test(s)) return { error: `${what} phải là số nguyên.` };
  const n = Number(s);
  return n >= lo && n <= hi ? n : { error: `${what} ngoài khoảng ${lo}..${hi}.` };
};

/** Đọc một dòng lệnh GM (không kèm "/gm") thành lệnh đã kiểm; sai thì `{ error }` (tiếng Việt, hiện cho người gõ). */
export function parseGm(text: unknown): GmCmd | { error: string } {
  if (typeof text !== "string" || text.length > GM_MAX_LEN) return { error: "Lệnh quá dài hoặc sai dạng." };
  const [op, ...a] = text.trim().split(/\s+/);
  const bad = (...xs: (number | { error: string })[]) => xs.find((x): x is { error: string } => typeof x !== "number");
  if (op === "level") { const level = num(a[0], 1, MAX_LEVEL, null, "cấp"); return bad(level) ?? { op, level: level as number }; }
  if (op === "give") {
    const code = a[0] ?? "", def = itemDef(code);
    if (!def) return { error: `Không có vật phẩm "${code}".` };
    // Đồ có dữ liệu riêng đi qua lệnh chuyên dụng (hồn cốt, hồn hạch, trang bị, hồn hoàn): lệnh give chỉ cho đồ gộp thường.
    if ([BONE_ITEM, CORE_ITEM, EQUIP_ITEM, RING_ITEM].includes(code) || def.stack <= 1) return { error: "Món này có dữ liệu riêng: dùng /gm bone, core, gear hoặc ring." };
    const qty = num(a[1], 1, def.stack * BAG_MAX_SLOTS, 1, "số lượng"); return bad(qty) ?? { op, code, qty: qty as number };
  }
  if (op === "ring") {
    const years = num(a[0], TIERS[0].years, MAX_YEARS, null, "số năm"), qty = num(a[1], 1, 50, 1, "số lượng");
    return bad(years, qty) ?? { op, years: years as number, qty: qty as number };
  }
  if (op === "bone") {
    const beast = a[0] ?? "", slot = a[1] ?? "";
    if (beastIndex(beast) < 0) return { error: `Không có loài "${beast}".` };
    if (!BONE_SLOTS.some((s) => s.id === slot)) return { error: `Vị trí hồn cốt: ${BONE_SLOTS.map((s) => s.id).join(", ")}.` };
    const years = num(a[2], TIERS[0].years, MAX_YEARS, MAX_YEARS, "số năm"), enhance = num(a[3], 0, BONE_MAX_ENHANCE, 0, "cấp cường hóa");
    return bad(years, enhance) ?? { op, beast, slot, years: years as number, enhance: enhance as number };
  }
  if (op === "core") {
    const set = a[0] ?? "";
    if (!CORE_SETS.some((s) => s.id === set)) return { error: `Bộ hồn hạch: ${CORE_SETS.map((s) => s.id).join(", ")}.` };
    const stars = num(a[1], 1, MAX_CORE_STARS, null, "sao"), enhance = num(a[2], 0, CORE_MAX_ENHANCE, 0, "cấp nâng cấp");
    return bad(stars, enhance) ?? { op, set, stars: stars as number, enhance: enhance as number };
  }
  if (op === "gear") {
    const tpl = a[0] ?? "";
    if (!equipTemplate(tpl)) return { error: `Không có mẫu trang bị "${tpl}" (dạng <ô>_<bậc>, vd vu_khi_chi_bao).` };
    const ilvl = num(a[1], 1, EQUIP_ILVL_K.length, EQUIP_ILVL_K.length, "cấp vật phẩm"), enhance = num(a[2], 0, EQUIP_MAX_ENHANCE, 0, "cấp cường hóa");
    return bad(ilvl, enhance) ?? { op, tpl, ilvl: ilvl as number, enhance: enhance as number };
  }
  if (op === "vohon") {
    const vohon = a[0] ?? "";
    if (vohonIndex(vohon) < 0) return { error: `Không có võ hồn "${vohon}" (mã trong danh sách võ hồn, vd ${VOHON[0].id}).` };
    const rings = num(a[2], 0, MAX_RINGS, 0, "số hồn hoàn"), level = num(a[1], 1, MAX_LEVEL, 1, "cấp");
    return bad(level, rings) ?? { op, vohon, level: level as number, rings: rings as number };
  }
  if (op === "coin") { const n = num(a[0], 0, MAX_HON_TE, null, "số đồng"); return bad(n) ?? { op, n: n as number }; }
  if (op === "tp") {
    const mapId = a[0] ?? "";
    if (!Object.hasOwn(MAPS, mapId) || MAPS[mapId].kind === "arena") return { error: `Bản đồ: ${Object.keys(MAPS).filter((m) => MAPS[m].kind !== "arena").join(", ")}.` };
    return { op, mapId };
  }
  if (op === "fog") { const mode = a[0] ?? "open"; return mode === "open" || mode === "reset" ? { op, mode } : { error: "Sương mù: /gm fog open (mở cả bản đồ) hoặc /gm fog reset (xoá về trống)." }; }
  if (op === "preset") return isPresetId(a[0]) ? { op, preset: a[0] } : { error: `Mức dựng sẵn: ${PRESETS.join(", ")}.` };
  return { error: `Lệnh lạ. Có: ${GM_HELP.join(" | ")}` };
}
