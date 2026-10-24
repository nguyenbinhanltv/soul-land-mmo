// Kiểm thử hợp đồng Nhân vật + Túi (client/src/charBagContract.ts, #454): accepts / smartTarget / lệnh server, không cần server hay trình duyệt.
// Chạy: npm run test:charbag --prefix client (Node >= 22.18 tự bỏ kiểu của file .ts).
import { acceptsItem, smartTarget, mountCommand, unmountCommand, sameSlot, gearAsBagItem, currentFor, cardActions, quickCommand } from "../src/charBagContract.ts";
import { compareRows, comparable } from "../src/bag.ts";
import { BONE_ITEM, CORE_ITEM, EQUIP_ITEM, CORE_SLOTS, EQUIP_SLOTS, EQUIP_TEMPLATES, equipSlotIndex } from "../../shared/data.ts";

let fails = 0;
const ok = (c, msg) => { console.log(`${c ? "✓" : "✗"} ${msg}`); if (!c) fails++; };

let n = 0;
const bone = (slot, vohon = null) => ({ id: `b${++n}`, kind: "hon_cot", code: BONE_ITEM, qty: 1, years: 12000, stars: null, enhance: 0, stats: { beast: "x", slot }, vohon });
const core = (slot = null, stars = 1, vohon = null) => ({ id: `c${++n}`, kind: "hon_hach", code: CORE_ITEM, qty: 1, years: null, stars, enhance: 0,
  stats: { set: "a", main: "atk", subs: [], ...(slot === null ? {} : { slot }) }, vohon });
const equip = (tpl) => ({ id: `e${++n}`, kind: "trang_bi", code: EQUIP_ITEM, qty: 1, years: null, stars: null, enhance: 0, stats: { tpl, ilvl: 1, roll: 0, affixes: [], luck: 0 }, vohon: null });
const pill = { id: "p1", kind: "dan", code: "hoi_huyet", qty: 3, years: null, stars: null, enhance: 0, stats: null, vohon: null };
const view = (bag = [], gear = [], rowId = 7) => ({ rowId, bag, gear });

// accepts
ok(acceptsItem({ tab: "bone", slot: "dau", rowId: 7 }, bone("dau"), view()).ok, "hồn cốt đầu vào ô đầu");
const wrong = acceptsItem({ tab: "bone", slot: "than", rowId: 7 }, bone("dau"), view());
ok(!wrong.ok && /Đầu/.test(wrong.why), `hồn cốt đầu vào ô thân: đỏ, lý do nêu ô đúng (${wrong.why})`);
ok(!acceptsItem({ tab: "bone", slot: "dau", rowId: null }, bone("dau"), view([], [], null)).ok, "chưa có võ hồn: ô hồn cốt đỏ");
ok(acceptsItem({ tab: "core", slot: 5, rowId: 7 }, core(), view()).ok, "hồn hạch vào ô cuối");
ok(!acceptsItem({ tab: "core", slot: CORE_SLOTS, rowId: 7 }, core(), view()).ok, "ô hồn hạch ngoài phạm vi đỏ");
ok(!acceptsItem({ tab: "core", slot: 0, rowId: 7 }, bone("dau"), view()).ok, "hồn cốt không vào ô hồn hạch");
ok(acceptsItem({ tab: "equip", slot: "mu", rowId: null }, equip("mu_tu_kim"), view()).ok, "mũ vào ô mũ");
ok(!acceptsItem({ tab: "equip", slot: "nhan_phai", rowId: null }, equip("nhan_trai_tu_kim"), view()).ok, "nhẫn trái không vào ô nhẫn phải (hai mẫu riêng)");
ok(!acceptsItem({ tab: "equip", slot: "mu", rowId: null }, pill, view()).ok, "đan không mặc được");
ok(!acceptsItem({ tab: "equip", slot: "mu", rowId: null }, { ...equip("mu_tu_kim"), stats: { tpl: "la" } }, view()).ok, "trang bị hỏng đỏ, không ném lỗi");
ok(!acceptsItem({ tab: "vohon", slot: 0, rowId: null }, pill, view()).ok, "ô đội không nhận đồ");

// smartTarget
const t1 = smartTarget(bone("tay_phai"), view());
ok(t1 && t1.tab === "bone" && t1.slot === "tay_phai" && t1.rowId === 7, "hồn cốt → đúng ô của võ hồn đang xem");
ok(smartTarget(bone("dau"), view([], [], null)) === null, "chưa có võ hồn → null");
ok(smartTarget(bone("dau", 7), view()) === null, "hồn cốt đã gắn → null (bấm đúp là tháo)");
const worn = [core(0, 3, 7), core(2, 1, 7), core(1, 2, 8)];
const t2 = smartTarget(core(), view(worn));
ok(t2 && t2.tab === "core" && t2.slot === 1 && t2.rowId === 7, "hồn hạch → ô trống thấp nhất của võ hồn đang xem (võ hồn khác không tính)");
const full = Array.from({ length: CORE_SLOTS }, (_, s) => core(s, s === 3 ? 1 : 4, 7));
const t3 = smartTarget(core(), view(full));
ok(t3 && t3.slot === 3, "đủ 6 ô → ô của hồn hạch yếu nhất");
const t4 = smartTarget(equip("giay_han_ngoc"), view());
ok(t4 && t4.tab === "equip" && t4.slot === "giay" && t4.rowId === null, "trang bị → ô của mẫu, không phụ thuộc võ hồn");
ok(smartTarget(equip("giay_han_ngoc"), view([], [], null))?.slot === "giay", "trang bị vẫn có ô khi chưa chọn võ hồn");
const wornGear = equip("mu_tu_kim");
ok(smartTarget(wornGear, view([], [{ id: wornGear.id, code: EQUIP_ITEM, enhance: 0, stats: wornGear.stats, slot: 1 }])) === null, "món đang mặc → null");
ok(smartTarget(pill, view()) === null, "đan → null");
// mọi mẫu trang bị đều có đích đúng ô của mình
ok(EQUIP_TEMPLATES.every((t) => smartTarget(equip(t.id), view())?.slot === t.slot), `${EQUIP_TEMPLATES.length} mẫu → đúng ô`);
ok(EQUIP_SLOTS.length === 10, "10 ô trang bị (đã chốt #453)");

// lệnh server
const b = bone("chan_trai");
const cmd = mountCommand(b, { tab: "bone", slot: "chan_trai", rowId: 7 }, view());
ok(cmd?.msg === "equip" && cmd.data.itemId === b.id && cmd.data.vohonId === 7 && cmd.data.slot === "chan_trai", "gắn hồn cốt → equip {itemId, vohonId, slot}");
ok(mountCommand(b, { tab: "bone", slot: "dau", rowId: 7 }, view()) === null, "ô sai → không có lệnh");
const c = core();
ok(mountCommand(c, { tab: "core", slot: 4, rowId: 7 }, view())?.msg === "equipcore", "gắn hồn hạch → equipcore");
const e = equip("ao_tinh_thiet");
ok(mountCommand(e, { tab: "equip", slot: "ao", rowId: null }, view())?.msg === "equipgear", "mặc trang bị → equipgear {id}");
ok(unmountCommand(b, { tab: "bone", slot: "chan_trai", rowId: 7 })?.msg === "unequip", "tháo hồn cốt → unequip");
ok(unmountCommand(c, { tab: "core", slot: 4, rowId: 7 })?.msg === "unequipcore", "tháo hồn hạch → unequipcore");
const un = unmountCommand(e, { tab: "equip", slot: "giay", rowId: null });
ok(un?.msg === "unequipgear" && un.data.slot === equipSlotIndex("giay"), "tháo trang bị → unequipgear {slot: chỉ số}");
ok(unmountCommand(e, { tab: "vohon", slot: 0, rowId: null }) === null, "ô đội không có lệnh tháo đồ");
ok(sameSlot({ tab: "core", slot: 1, rowId: 7 }, { tab: "core", slot: 1, rowId: 7 }) && !sameSlot({ tab: "core", slot: 1, rowId: 7 }, { tab: "core", slot: 1, rowId: 8 }), "sameSlot so cả rowId");
const g = gearAsBagItem({ id: "g1", code: EQUIP_ITEM, enhance: 2, stats: e.stats, slot: 1 });
ok(g.kind === "trang_bi" && g.vohon === null && g.enhance === 2, "gearAsBagItem giữ mã, cấp, stats");

// NV3 (#457): món đang mặc, thẻ thao tác, bấm đúp, so sánh hai cột
const gearOf = (it, slot) => ({ id: it.id, code: EQUIP_ITEM, enhance: it.enhance, stats: it.stats, slot });
const oldMu = equip("mu_tu_kim"), newMu = { ...equip("mu_tu_kim"), enhance: 5 };
const vMu = view([], [gearOf(oldMu, equipSlotIndex("mu"))]);
ok(currentFor(newMu, vMu)?.cur?.id === oldMu.id, "currentFor(trang bị) = món đang mặc ở ô của mẫu");
ok(currentFor(equip("giay_han_ngoc"), vMu)?.cur === null, "ô giày trống → cur null");
const wb = bone("dau", 7), nb = bone("dau");
ok(currentFor(nb, view([wb, nb]))?.cur?.id === wb.id, "currentFor(hồn cốt) = món cùng vị trí của võ hồn đang xem");
ok(currentFor(pill, view()) === null, "đan không có món đang gắn");
const ids = (a) => a.map((x) => x.id).join(",");
ok(ids(cardActions(newMu, { view: vMu })) === "mount,compare,lock,salvage", `thẻ trang bị trong túi: Mặc, So sánh, Khóa, Phân giải (${ids(cardActions(newMu, { view: vMu }))})`);
ok(ids(cardActions({ ...newMu, lock: true }, { view: vMu })) === "mount,compare,unlock", "trang bị đã khóa: Mở khóa, không Phân giải");
ok(ids(cardActions(nb, { view: view([wb, nb]) })) === "mount,compare,lock", "thẻ hồn cốt: Gắn, So sánh, Khóa");
ok(ids(cardActions(pill, { view: view(), useLabel: "Dùng" })) === "use,lock" && cardActions(pill, { view: view(), useLabel: "Dùng" })[0].primary, "thẻ đan: Dùng (nút chính), Khóa");
ok(ids(cardActions(wb, { view: view([wb]), worn: true })) === "unmount", "món đang gắn trên búp bê: chỉ Tháo");
ok(ids(cardActions(gearAsBagItem(gearOf(oldMu, 1)), { view: vMu, worn: true })) === "unmount,lock", "trang bị đang mặc: Tháo, Khóa");
ok(!cardActions(nb, { view: view([nb], [], null) }).some((a) => a.id === "mount"), "chưa có võ hồn: không có nút Gắn");
// bấm đúp
ok(quickCommand(newMu, vMu)?.msg === "equipgear", "bấm đúp trang bị → equipgear");
ok(quickCommand(nb, view([wb, nb]))?.msg === "equip", "bấm đúp hồn cốt → equip vào võ hồn đang xem");
ok(quickCommand(pill, view()) === null, "bấm đúp đan → không có lệnh mặc");
ok(quickCommand(wb, view([wb]), { tab: "bone", slot: "dau", rowId: 7 })?.msg === "unequip", "bấm đúp món đang gắn → tháo");
const qc = quickCommand(core(), view([core(0, 3, 7), core(1, 1, 7)]));
ok(qc?.msg === "equipcore" && qc.data.slot === 2 && qc.data.vohonId === 7, "bấm đúp hồn hạch → ô trống thấp nhất của võ hồn đang xem");
// so sánh hai cột
const rowsE = compareRows(newMu, gearAsBagItem(gearOf(oldMu, 1)));
ok(rowsE && rowsE.length > 0 && rowsE.every((r) => r.d === Math.round((r.neu - r.old) * 10) / 10), "so sánh trang bị: d = mới − cũ");
ok(rowsE.some((r) => r.d > 0) && rowsE.every((r) => r.d >= 0), "cùng mẫu, +5 cường hóa: chỉ tăng, không giảm");
const rowsEmpty = compareRows(newMu, null);
ok(rowsEmpty && rowsEmpty.every((r) => r.old === 0 && r.d === r.neu), "ô trống: cột cũ 0, d = số mới");
const rb = compareRows({ ...nb, years: 20000 }, { ...wb, years: 12000 });
ok(rb && rb.some((r) => r.d > 0), "hồn cốt niên hạn cao hơn: có chỉ số tăng");
ok(compareRows(pill, null) === null && !comparable(pill), "đan không so sánh được");

if (fails) { console.log(`\n${fails} kiểm tra trượt`); process.exit(1); }
console.log("\nđạt hết");
