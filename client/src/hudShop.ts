// Cửa hàng NPC (mua, mảnh võ hồn, mua lại, bán) của HUD (tách nguyên văn từ hud.ts, Part of #885 bước 0a); hud.ts re-export để nơi gọi giữ nguyên.
import { confirmDialog } from "./confirmDialog.ts";
import { NpcActions, SELL_CONFIRM_DONG, renderNpc, sellConfirm, shardMsg, setSellConfirm } from "./hudNpc.ts";
import { boneOf, itemArt, itemColor, itemName } from "./hudBag.ts";
import { VOHON, vohonIndex, ITEM_KINDS, itemDef, SHARD_UNLOCK, shopOf, shopExpands, SHOP_MAX_QTY, sellPrice, BUYBACK_MAX, BAG_EXPAND, BAG_MAX_SLOTS, bagExpandCost, formatHonTe, SHARD_BUY, shardBuyPrice, shardBuyCost, ARENA_SHARDS, shardCode, AUTO_SELL_BUYBACK } from "../../shared/data.ts";
import { artImg } from "./uiArt.ts";
import { setTip, type TipSpec } from "./tooltip.ts";
import { isUi2 } from "./uiKit.ts";
import { matchQuery, qty as qtySlider, searchField } from "./uiParts.ts";
import type { BagMsg, BagItem, BuybackItem } from "./net.ts";

/** Dòng hàng kiểu chung (UI-4): biểu tượng đầu dòng vào ô `ui_o` (.ui-cell) và cả dòng có chú thích `setTip` (rê chuột / chạm giữ). */
function shopCell(o: HTMLElement, tip: TipSpec) {
  const ico = o.firstElementChild; if (!ico) return;
  const cell = document.createElement("span"); cell.className = "ui-cell sicon"; ico.replaceWith(cell); cell.appendChild(ico);
  setTip(o, tip);
}

// ---------- UI v2 đợt 3b (cờ ui2): lưới món, ô tìm có dấu, thanh trượt số lượng. Chỉ trình bày; tin mua / bán / mua lại giữ nguyên. ----------
let shopQuery = "";       // chữ trong ô tìm (nhớ khi hộp thoại vẽ lại vì túi đổi)
let shopSel = "";         // mã món đang chọn ở lưới mua
let shopQty = 1;          // số lượng đang kéo

/** Ô tìm (bỏ dấu để khớp): lọc tại chỗ các phần tử `.shoprow` / `.s2-card` theo `data-name`, không vẽ lại nên không mất con trỏ. */
function shopSearch(el: HTMLElement, label: string, scope: () => HTMLElement): HTMLElement {
  const none = document.createElement("p"); none.className = "nline s2-none"; none.hidden = true; none.textContent = "Không có món nào khớp. Xoá bớt chữ để xem lại.";
  const apply = () => {
    let shown = 0;
    for (const r of scope().querySelectorAll<HTMLElement>("[data-name]")) { const ok = matchQuery(r.dataset.name ?? "", shopQuery); r.hidden = !ok; if (ok) shown++; }
    none.hidden = shown > 0 || !scope().querySelector("[data-name]");
  };
  const { root: box } = searchField({ label, value: shopQuery, onInput: (q) => { shopQuery = q; apply(); } }); box.classList.add("s2-search");
  el.append(box, none);
  queueMicrotask(apply);
  return box;
}

/** Lưới món (UI v2): mỗi món một thẻ (ô, tên, giá, nhãn "Chưa có" / "Thiếu tiền"); chọn thẻ thì phần dưới hiện thanh trượt số lượng và nút Mua son. */
function renderShopGrid(el: HTMLElement, bag: BagMsg, act: NpcActions, npcId: string) {
  const shop = shopOf(npcId).filter((r) => itemDef(r.code));
  if (!shop.some((r) => r.code === shopSel)) { shopSel = shop[0]?.code ?? ""; shopQty = 1; }
  const have = (code: string) => bag.items.filter((i) => i.code === code && i.vohon === null).reduce((a, i) => a + i.qty, 0);
  const grid = document.createElement("div"); grid.className = "s2-grid"; grid.setAttribute("role", "listbox"); grid.setAttribute("aria-label", "Hàng bán");
  const detail = document.createElement("div"); detail.className = "s2-detail";
  shopSearch(el, "Tìm món trong cửa hàng", () => grid);
  const paintDetail = () => {
    detail.innerHTML = "";
    const r = shop.find((x) => x.code === shopSel), def = r && itemDef(r.code); if (!r || !def) return;
    const cap = Math.max(1, Math.min(SHOP_MAX_QTY, Math.floor(bag.honTe / r.price)));
    shopQty = Math.min(Math.max(1, shopQty), cap);
    const head = document.createElement("div"); head.className = "s2-dhead"; head.style.setProperty("--c", def.col);
    head.innerHTML = `<b></b><small></small>`;
    head.querySelector("b")!.textContent = def.name;
    head.querySelector("small")!.textContent = `${ITEM_KINDS[def.kind].name} · đang có ${have(r.code)}`;
    const desc = document.createElement("p"); desc.className = "s2-desc"; desc.textContent = def.desc;
    const q = qtySlider({ label: `Số lượng ${def.name}`, min: 1, max: cap, value: shopQty, onChange: (n) => { shopQty = n; sum(); } });
    const buy = document.createElement("button"); buy.type = "button"; buy.className = "buse absorb f2-nut-chinh s2-buy";
    const poor = bag.honTe < r.price;
    const sum = () => {
      const cost = r.price * q.get();
      buy.textContent = poor ? `Thiếu Hồn Tệ (cần ${formatHonTe(r.price)})` : `Mua ${q.get()} · −${formatHonTe(cost)}`;
      buy.setAttribute("aria-label", `Mua ${q.get()} ${def.name}, giá ${formatHonTe(cost)}`);
      buy.disabled = poor;
    };
    buy.addEventListener("click", () => { buy.blur(); act.buy(r.code, q.get()); });
    sum();
    detail.append(head, desc, ...(poor ? [] : [q.root]), buy);
  };
  for (const r of shop) {
    const def = itemDef(r.code)!, own = have(r.code), poor = bag.honTe < r.price;
    const c = document.createElement("button"); c.type = "button"; c.className = "s2-card" + (r.code === shopSel ? " sel" : "") + (poor ? " lock" : "");
    c.dataset.name = def.name; c.dataset.code = r.code; c.style.setProperty("--c", def.col);
    c.setAttribute("role", "option"); c.setAttribute("aria-selected", String(r.code === shopSel));
    c.innerHTML = `${artImg(`item_${def.id}`, "ico art") || `<i class="ico ${def.kind}"></i>`}<b></b><small></small><span class="s2-tag"></span>`;
    c.querySelector("b")!.textContent = def.name;
    c.querySelector("small")!.textContent = formatHonTe(r.price);
    const tag = c.querySelector<HTMLElement>(".s2-tag")!;
    if (poor) tag.textContent = "Khoá"; else if (!own) tag.textContent = "Mới"; else tag.hidden = true;
    c.setAttribute("aria-label", `${def.name}, ${formatHonTe(r.price)}${poor ? ", khoá: thiếu Hồn Tệ" : !own ? ", chưa có" : ""}`);
    c.addEventListener("click", () => {
      shopSel = r.code; shopQty = 1;
      for (const x of grid.children) { const on = (x as HTMLElement).dataset.code === shopSel; x.classList.toggle("sel", on); x.setAttribute("aria-selected", String(on)); }
      paintDetail();
    });
    shopCell(c, { title: def.name, color: def.col, sub: ITEM_KINDS[def.kind].name, lines: [def.desc, { k: "Giá", v: formatHonTe(r.price) }, { k: "Đang có", v: String(own) }] });
    grid.appendChild(c);
  }
  el.append(grid, detail);
  paintDetail();
}

/**
 * Cửa hàng của thương nhân `npcId`: mỗi món trong bảng hàng (shopOf: SHOP trong thành, CAMP_SHOP ở trại cổng) một dòng (giá, đang có),
 * nút mua 1 / 5 / 10; thiếu Hồn Tệ thì mờ nút (server vẫn kiểm tra lại). Mở rộng túi chỉ ở thương nhân trong thành (shopExpands).
 */
export function renderShopBuy(el: HTMLElement, bag: BagMsg, act: NpcActions, npcId: string) {
  const used = bag.items.filter((i) => i.vohon === null).length, shop = shopOf(npcId);
  if (isUi2()) renderShopGrid(el, bag, act, npcId);
  else for (const r of shop) {
    const def = itemDef(r.code); if (!def) continue;
    const have = bag.items.filter((i) => i.code === r.code && i.vohon === null).reduce((a, i) => a + i.qty, 0);
    const o = document.createElement("div"); o.className = "shoprow"; o.style.setProperty("--c", def.col);
    o.innerHTML = `${artImg(`item_${def.id}`, "ico art") || `<i class="ico ${def.kind}"></i>`}<div><b></b><small></small></div><div class="brow"></div>`;
    o.querySelector("b")!.textContent = def.name;
    o.querySelector("small")!.textContent = `${formatHonTe(r.price)} mỗi viên · đang có ${have} · ${def.desc}`;
    shopCell(o, { title: def.name, color: def.col, sub: ITEM_KINDS[def.kind].name, lines: [def.desc, { k: "Giá", v: formatHonTe(r.price) }, { k: "Đang có", v: String(have) }] });
    const row = o.querySelector(".brow")!;
    for (const q of [1, 5, 10].filter((x) => x <= SHOP_MAX_QTY)) {
      const b = document.createElement("button"); b.type = "button"; b.className = "buse use";
      b.textContent = `Mua ${q}`; b.disabled = bag.honTe < r.price * q;
      b.title = `${q} ${def.name}: ${formatHonTe(r.price * q)}`;
      b.setAttribute("aria-label", `Mua ${q} ${def.name}, giá ${formatHonTe(r.price * q)}`);
      b.addEventListener("click", () => { b.blur(); act.buy(r.code, q); });
      row.appendChild(b);
    }
    el.appendChild(o);
  }
  // Mở rộng túi (9.8): +BAG_EXPAND ô mỗi lần tới BAG_MAX_SLOTS, giá tăng dần (bagExpandCost); bấm hai lần. Server kiểm tra lại.
  if (shopExpands(npcId)) {
    const cost = bagExpandCost(bag.slots);
    const o = document.createElement("div"); o.className = "shoprow"; o.style.setProperty("--c", "#f2c84b");
    o.innerHTML = `<i class="ico ruong"></i><div><b>Mở rộng túi</b><small></small></div><div class="brow"></div>`;
    o.querySelector("small")!.textContent = cost === null ? `Túi đã tối đa ${BAG_MAX_SLOTS} ô.`
      : `+${BAG_EXPAND} ô (${bag.slots} → ${Math.min(BAG_MAX_SLOTS, bag.slots + BAG_EXPAND)} ô), tối đa ${BAG_MAX_SLOTS} ô · ${formatHonTe(cost)}`;
    if (cost !== null) {
      const b = document.createElement("button"); b.type = "button"; b.className = "buse " + (sellConfirm === "expand" ? "eok" : "use");
      b.textContent = sellConfirm === "expand" ? `Mở rộng thật? −${formatHonTe(cost)}` : `Mở rộng · ${formatHonTe(cost)}`;
      b.disabled = bag.honTe < cost;
      b.setAttribute("aria-label", `Mở rộng túi thêm ${BAG_EXPAND} ô, giá ${formatHonTe(cost)}`);
      b.addEventListener("click", () => {
        b.blur();
        if (sellConfirm !== "expand") { setSellConfirm("expand"); renderNpc(); return; }
        setSellConfirm(null); act.expand();
      });
      o.querySelector(".brow")!.appendChild(b);
    }
    el.appendChild(o);
  }
  const n = document.createElement("small"); n.className = "rnote";
  n.textContent = `Túi đồ ${used}/${bag.slots} ô; đan cùng loại tự gộp tối đa ${itemDef(shop[0]?.code ?? "")?.stack ?? 99} viên một ô. Túi không đủ chỗ hoặc thiếu Hồn Tệ thì không mua được.`
    + (shopExpands(npcId) ? "" : " Mở rộng túi, đan lớn: về thương nhân trong thành.");
  el.appendChild(n);
}

/**
 * Thương hội đổi mảnh võ hồn (#282): mỗi võ hồn SR / SSR trong ARENA_SHARDS một dòng (mảnh đang có, đã có võ hồn chưa), nút đổi 1 /
 * 5 / hết lượt hôm nay với tổng giá (shardBuyCost theo số đã đổi hôm nay, tin "shardinfo"); thiếu Hồn Tệ thì mờ nút. Server tính giá
 * và kiểm lại lượt, tiền, chỗ trống.
 */
export function renderShardShop(el: HTMLElement, bag: BagMsg, act: NpcActions) {
  const K = SHARD_BUY, n = shardMsg?.n ?? 0, left = Math.max(0, K.daily - n), owned = new Set(act.owned());
  const head = document.createElement("small"); head.className = "rnote";
  head.textContent = !shardMsg ? "Đang hỏi Chưởng quỹ số mảnh đã đổi hôm nay…"
    : left ? `Hôm nay đã đổi ${n}/${K.daily} mảnh · mảnh kế tiếp ${formatHonTe(shardBuyPrice(n))}.`
    : `Hôm nay đã đổi đủ ${K.daily}/${K.daily} mảnh. Lượt mới lúc 00:00 giờ Việt Nam.`;
  el.appendChild(head);
  const qs = shardMsg ? [...new Set([1, 5, left])].filter((q) => q >= 1 && q <= left).sort((a, b) => a - b) : [];
  for (const id of ARENA_SHARDS) {
    const v = VOHON[vohonIndex(id)], def = itemDef(shardCode(id)); if (!v || !def) continue;
    const have = bag.items.filter((i) => i.code === def.id && i.vohon === null).reduce((a, i) => a + i.qty, 0);
    const o = document.createElement("div"); o.className = "shoprow"; o.style.setProperty("--c", v.col);
    o.innerHTML = `<i class="ico ${def.kind}"></i><div><b></b><small></small></div><div class="brow"></div>`;
    o.querySelector("b")!.textContent = `${v.name} (${v.rarity})`;
    o.querySelector("small")!.textContent = `đang có ${have} mảnh · ${owned.has(id) ? "đã có võ hồn" : `chưa có (mở bằng ${SHARD_UNLOCK} mảnh)`}`;
    for (const q of qs) {
      const cost = shardBuyCost(n, q), b = document.createElement("button"); b.type = "button"; b.className = "buse use";
      b.textContent = `Đổi ${q} · ${formatHonTe(cost)}`; b.disabled = bag.honTe < cost;
      b.setAttribute("aria-label", `Đổi ${q} mảnh ${v.name}, giá ${formatHonTe(cost)}`);
      b.addEventListener("click", () => { b.blur(); act.shard(id, q); });
      o.querySelector(".brow")!.appendChild(b);
    }
    el.appendChild(o);
  }
  const note = document.createElement("small"); note.className = "rnote";
  note.textContent = `Giá tăng dần theo số mảnh đã đổi trong ngày, tính chung mọi võ hồn: ${Array.from({ length: K.daily }, (_, i) => formatHonTe(shardBuyPrice(i))).join(" → ")}. `
    + `Tối đa ${K.daily} mảnh mỗi ngày, đặt lại 00:00 giờ Việt Nam. Thương hội không bán mảnh UR. Túi phải đủ chỗ cho cả số mảnh.`;
  el.appendChild(note);
}

/**
 * Mua lại (9.8): BUYBACK_MAX món bán gần nhất (mới nhất trước) với đúng giá đã bán; món về túi đúng như lúc bán (chỉ số, cấp cường
 * hóa). Thiếu Hồn Tệ thì mờ nút; server kiểm tra lại tiền và chỗ trống.
 */
export function renderShopBuyback(el: HTMLElement, bag: BagMsg, act: NpcActions) {
  const list = bag.buyback ?? [], sold = bag.sold ?? [];
  if (!list.length && !sold.length) {
    const p = document.createElement("p"); p.className = "nline"; p.textContent = "Ngươi chưa bán gì cho ta từ lúc tới đây. Bán nhầm thì quay lại, ta trả lại đúng món, đúng giá.";
    el.appendChild(p);
  }
  if (isUi2() && (list.length || sold.length)) shopSearch(el, "Tìm món đã bán", () => el);
  buybackRows(el, bag, act, list);
  const n = document.createElement("small"); n.className = "rnote";
  n.textContent = `Thương nhân giữ ${BUYBACK_MAX} món bán gần nhất (cả hai thành), mua lại đúng giá đã bán; rời game thì mất. Cần ô trống trong túi.`;
  el.appendChild(n);
  // Đồ tự bán từ xa (#216): AUTO_SELL_BUYBACK món gần nhất, lưu theo tài khoản (không mất khi rời game), cùng nút mua lại.
  if (!sold.length) return;
  const h = document.createElement("p"); h.className = "nline"; h.textContent = `Đồ tự bán gần đây (${sold.length}/${AUTO_SELL_BUYBACK}):`;
  el.appendChild(h);
  buybackRows(el, bag, act, sold);
}

/** Các dòng mua lại (đồ bán tay hoặc đồ tự bán): tên, giá đã bán, nút "Mua lại" (thiếu Hồn Tệ thì mờ). */
function buybackRows(el: HTMLElement, bag: BagMsg, act: NpcActions, list: BuybackItem[]) {
  for (const e of list) {
    const it: BagItem = { ...e, id: e.key, vohon: null }, def = itemDef(e.code), cost = e.price * e.qty;
    const o = document.createElement("div"); o.className = "shoprow"; o.dataset.name = itemName(it); o.style.setProperty("--c", itemColor(it));
    o.innerHTML = `${itemArt(it) || `<i class="ico ${def?.kind ?? "unknown"}"></i>`}<div><b></b><small></small></div><div class="brow"></div>`;
    o.querySelector("b")!.textContent = `${itemName(it)}${e.qty > 1 ? ` ×${e.qty}` : ""}`;
    o.querySelector("small")!.textContent = `${def ? ITEM_KINDS[def.kind].name : "Vật phẩm lạ"} · đã bán ${formatHonTe(cost)}${e.enhance && boneOf(it) ? ` · cường hóa +${e.enhance}` : ""}`;
    shopCell(o, { title: itemName(it), color: itemColor(it), sub: def ? ITEM_KINDS[def.kind].name : "Vật phẩm lạ", lines: [{ k: "Đã bán", v: formatHonTe(cost) }] });
    const b = document.createElement("button"); b.type = "button"; b.className = "buse use";
    b.textContent = `Mua lại · −${formatHonTe(cost)}`; b.disabled = bag.honTe < cost;
    b.setAttribute("aria-label", `Mua lại ${itemName(it)}, giá ${formatHonTe(cost)}`);
    b.addEventListener("click", () => { b.blur(); act.buyback(e.key); });
    o.querySelector(".brow")!.appendChild(b);
    el.appendChild(o);
  }
}

/**
 * Bán đồ dư: mọi ô trong túi mà thương nhân mua (sellPrice khác null: hồn hoàn, hồn cốt, hồn hạch, mảnh võ hồn), giá theo niên hạn
 * / sao / độ hiếm (chỉ để hiển thị, server tính lại). Đồ đang gắn không nằm trong danh sách. Món giá trị phải bấm hai lần.
 */
export function renderShopSell(el: HTMLElement, bag: BagMsg, act: NpcActions) {
  const list = bag.items.filter((i) => i.vohon === null && !i.lock && sellPrice(i) !== null); // món khoá (#216) không bán
  const kindOrder = ["hon_hoan", "hon_cot", "hon_hach", "manh_vo_hon"];
  list.sort((a, b) => kindOrder.indexOf(itemDef(a.code)?.kind ?? "") - kindOrder.indexOf(itemDef(b.code)?.kind ?? "") || (sellPrice(b) ?? 0) - (sellPrice(a) ?? 0));
  if (!list.length) {
    const p = document.createElement("p"); p.className = "nline"; p.textContent = "Túi không có đồ nào ta mua: mang hồn hoàn, hồn cốt, hồn hạch hay mảnh võ hồn dư tới đây.";
    el.appendChild(p);
  }
  if (isUi2() && list.length) shopSearch(el, "Tìm món trong túi để bán", () => el);
  for (const it of list) {
    const price = sellPrice(it)!, def = itemDef(it.code);
    const o = document.createElement("div"); o.className = "shoprow"; o.dataset.name = itemName(it); o.style.setProperty("--c", itemColor(it));
    o.innerHTML = `${itemArt(it) || `<i class="ico ${def?.kind ?? "unknown"}"></i>`}<div><b></b><small></small></div><div class="brow"></div>`;
    o.querySelector("b")!.textContent = `${itemName(it)}${it.qty > 1 ? ` ×${it.qty}` : ""}`;
    o.querySelector("small")!.textContent = `${ITEM_KINDS[def!.kind].name} · ${formatHonTe(price)}${it.qty > 1 ? " mỗi món" : ""}${it.enhance && boneOf(it) ? ` · cường hóa +${it.enhance}` : ""}`;
    shopCell(o, { title: itemName(it), color: itemColor(it), sub: ITEM_KINDS[def!.kind].name, lines: [{ k: "Giá bán", v: formatHonTe(price) + (it.qty > 1 ? " mỗi món" : "") }] });
    const row = o.querySelector(".brow")!;
    const sell = (qty: number, label: string) => {
      const gain = price * qty, ask = gain >= SELL_CONFIRM_DONG || it.enhance > 0;
      const b = document.createElement("button"); b.type = "button"; b.className = "buse use";
      b.textContent = `${label} · +${formatHonTe(gain)}`;
      b.setAttribute("aria-label", `${label} ${itemName(it)}, nhận ${formatHonTe(gain)}`);
      b.addEventListener("click", () => {
        b.blur();
        const go = () => { setSellConfirm(null); act.sell(it.id, qty); };
        if (ask) confirmDialog({ title: "Bán món này?", body: `${itemName(it)}${qty > 1 ? ` ×${qty}` : ""}${it.enhance > 0 ? ` (cường hóa +${it.enhance})` : ""}: nhận ${formatHonTe(gain)}. Bán nhầm thì mua lại được trong danh sách mua lại (${BUYBACK_MAX} món gần nhất, mất khi rời game).`, confirm: `Bán · +${formatHonTe(gain)}`, danger: true }, go);
        else go();
      });
      row.appendChild(b);
    };
    if (it.qty > 1) { sell(1, "Bán 1"); sell(it.qty, "Bán hết"); } else sell(1, "Bán");
    el.appendChild(o);
  }
  const worn = bag.items.filter((i) => i.vohon !== null).length, locked = bag.items.filter((i) => i.vohon === null && i.lock).length;
  const n = document.createElement("small"); n.className = "rnote";
  n.textContent = (worn ? `${worn} món đang gắn trên võ hồn không hiện ở đây (tháo ra trước mới bán được). ` : "")
    + (locked ? `${locked} ô đang khoá không hiện ở đây (mở khoá ở túi đồ). ` : "")
    + `Thương nhân không mua đan dược và rương. Bán nhầm thì mua lại được đúng giá (${BUYBACK_MAX} món gần nhất, mất khi rời game).`;
  el.appendChild(n);
}
