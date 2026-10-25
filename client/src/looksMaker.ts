// Màn tạo / đổi ngoại hình hồn sư (L4 #511, HL1 #565; GAME_DESIGN.md mục 5.11 "Hồn sư chế độ Tự tạo"): bước đầu chọn [Mẫu dựng sẵn] hoặc
// [Tự tạo (LPC)]. Cả hai đều lưu Looks.mode = lpc. Mẫu dựng sẵn: lưới các bộ LPC_PRESETS (xem trước xoay bốn hướng), chọn bộ rồi chỉnh
// màu tóc / da / áo trong dải cho phép. Tự tạo cho chọn từng ô của LPC_PARTS + màu (có nút "Bắt đầu từ mẫu"), xem trước bốn hướng và
// đi / đánh / thi triển (lpcPreview.ts dùng bộ ghép của L3). Preset kiểu cũ (5 số) không còn được tạo mới; server vẫn đọc tới HL2.
// Dùng cho hai nơi: lần tạo nhân vật đầu tiên (main.ts) và đổi ngoại hình ở thợ may (hud.ts, `openLooksOverlay`). Client chỉ gửi lựa chọn;
// server kiểm lại bằng parseLooks (mã lạ bị từ chối), khoảng cách thợ may và Hồn Tệ.
import { SEXES, LPC_PARTS, LPC_SLOTS, LPC_RAMPS, LPC_PRESETS, parseLpc, type Looks, type LpcLooks, type LpcPart } from "../../shared/data.ts";
import { LpcPreview, PREVIEW_DIRS, type PreviewAnim, type PreviewDir } from "./lpcPreview.ts";

export interface MakerOpts {
  host: HTMLElement;
  title: string;
  /** HTML giới thiệu dưới tiêu đề (luật miễn phí / tính tiền, ...). */
  intro: string;
  /** Ngoại hình đang mang (chế độ và lựa chọn khởi đầu); null = lần tạo đầu. */
  current: Looks | null;
  okLabel: string;
  /** Gửi lựa chọn; ném Error(thông báo) thì hiện lỗi và cho chọn lại. */
  onOk(l: Looks): Promise<void>;
  /** Nút phụ cuối màn (đổi tài khoản / hủy). */
  cancel: { label: string; fn(): void };
}

// ---------- Tên tiếng Việt và màu hiển thị ----------
const VI: Record<string, string> = {
  light: "Trắng hồng", amber: "Hổ phách", olive: "Ô liu", taupe: "Nâu xám", bronze: "Đồng", brown: "Nâu", black: "Đen",
  blue: "Lam", green: "Lục", purple: "Tím", red: "Đỏ", orange: "Cam", yellow: "Vàng", gray: "Xám",
  raven: "Đen huyền", dark_brown: "Nâu sẫm", chestnut: "Hạt dẻ", dark_gray: "Xám đậm", white: "Trắng", navy: "Chàm", light_brown: "Nâu nhạt",
  leather: "Da thuộc", walnut: "Óc chó", tan: "Be", maroon: "Đỏ thẫm", teal: "Lam lục", bluegray: "Xám lam", forest: "Lục rừng", slate: "Xám đá",
  charcoal: "Than", ceramic: "Sứ", brass: "Thau", copper: "Đồng đỏ", iron: "Sắt", steel: "Thép", silver: "Bạc", gold: "Vàng kim",
};
const viColor = (c: string) => VI[c] ?? c.split("_").map((w) => VI[w] ?? w).join(" ");
/** Ba sắc để vẽ ô màu: ba sắc sáng của dải cùng tên (tìm ở mọi họ), thiếu thì theo phần trước dấu gạch dưới, không có thì xám. */
function swatch(name: string): [string, string, string] {
  for (const n of [name, name.split("_")[0]]) for (const f of Object.values(LPC_RAMPS)) {
    const r = f.ramps[n]; if (r) return [r[r.length - 1], r[Math.max(0, r.length - 2)], r[Math.max(0, r.length - 3)]];
  }
  return ["#c4b59f", "#958080", "#4d4a5d"];
}
const swBtn = (k: string, v: string, label: string, on: boolean) => {
  const [a, b, c] = swatch(v);
  return `<button type="button" class="sw" data-lk="${k}" data-v="${v}" aria-pressed="${on}" title="${label}" aria-label="${label}" style="--a:${a};--b:${b};--c:${c}"></button>`;
};
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

// ---------- Dữ liệu Tự tạo: danh mục theo ô, hợp thể hình, mặc định, ngẫu nhiên ----------
const SLOT_KEYS = Object.keys(LPC_SLOTS);
const BY_SLOT = new Map<string, LpcPart[]>(SLOT_KEYS.map((s) => [s, LPC_PARTS.filter((p) => p.slot === s)]));
const byId = new Map(LPC_PARTS.map((p) => [p.id, p]));
/** Ô bắt buộc (thân, mặt); các ô còn lại có thể bỏ trống. */
const REQUIRED = ["body", "head"];
const fits = (p: LpcPart, body: number) => p.sex === "mf" || p.sex === (body === 0 ? "m" : "f");
const partsOf = (slot: string, body: number) => (BY_SLOT.get(slot) ?? []).filter((p) => fits(p, body));
/** Họ màu của món: tóc dùng chung một màu tóc; món vẽ sẵn nhiều màu thì dùng danh sách riêng; còn lại theo chất liệu (vải, kim loại). */
function colorFamily(p: LpcPart): { kind: "hair" | "own" | "ramp" | "none"; list: string[] } {
  if (p.colors.length) return { kind: "own", list: p.colors };
  const fam = p.mats.map((m) => m.split(":")[0]).find((f) => f !== "body" && f !== "eye");
  if (!fam) return { kind: "none", list: [] };
  return { kind: fam === "hair" ? "hair" : "ramp", list: LPC_RAMPS[fam]?.allow ?? [] };
}
const DEFAULT_PARTS: [string[], string[]] = [
  ["body.body", "head.male", "hair.parted", "torso.longsleeve", "legs.pants", "feet.shoes_basic"],
  ["body.body", "head.female", "hair.long_straight", "torso.longsleeve", "legs.skirts_plain", "feet.shoes_basic"],
];
/** Tổ hợp mặc định hợp lệ (mọi mã nằm trong danh mục, đúng thể hình). */
function defaultLpc(body: number): LpcLooks {
  const parts: Record<string, string> = {};
  for (const id of DEFAULT_PARTS[body]) { const p = byId.get(id); if (p && fits(p, body)) parts[p.slot] = id; }
  const l: LpcLooks = { v: 1, body, parts, colors: {} };
  normalize(l, "black");
  return l;
}
/**
 * Làm cho lựa chọn hợp lệ: bỏ món sai thể hình / thiếu ô bắt buộc, màu trong dải cho phép (món tóc theo màu tóc chung `hair`, món khác
 * giữ màu đang chọn nếu còn hợp lệ, không thì màu đầu danh sách), bỏ màu của ô trống. Trả màu tóc đang dùng.
 */
function normalize(l: LpcLooks, hair: string): string {
  for (const s of Object.keys(l.parts)) { const p = byId.get(l.parts[s]); if (!p || p.slot !== s || !fits(p, l.body)) delete l.parts[s]; }
  for (const s of REQUIRED) if (!l.parts[s]) l.parts[s] = (partsOf(s, l.body)[0] ?? LPC_PARTS.find((p) => p.slot === s)!).id;
  if (!LPC_RAMPS.hair.allow.includes(hair)) hair = LPC_RAMPS.hair.allow[0];
  if (!LPC_RAMPS.body.allow.includes(l.colors.skin)) l.colors.skin = LPC_RAMPS.body.allow[0];
  if (!LPC_RAMPS.eye.allow.includes(l.colors.eye)) l.colors.eye = LPC_RAMPS.eye.allow[0];
  for (const k of Object.keys(l.colors)) if (k !== "skin" && k !== "eye" && !l.parts[k]) delete l.colors[k];
  for (const s of Object.keys(l.parts)) {
    const f = colorFamily(byId.get(l.parts[s])!);
    if (f.kind === "none") delete l.colors[s];
    else if (f.kind === "hair") l.colors[s] = hair;
    else if (!f.list.includes(l.colors[s])) l.colors[s] = f.list[0];
  }
  return hair;
}
/** Màu tóc đang dùng của một ngoại hình LPC (màu của món tóc / mày / râu đầu tiên có). */
const hairOf = (l: LpcLooks) => SLOT_KEYS.map((s) => (l.parts[s] && colorFamily(byId.get(l.parts[s])!).kind === "hair" ? l.colors[s] : "")).find(Boolean) || "black";

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
/** Bảng màu hợp cổ phong khi bấm Ngẫu nhiên (giao với dải cho phép; thiếu thì lấy cả dải). */
const NATURAL_HAIR = ["raven", "raven", "black", "black", "dark_brown", "chestnut", "dark_gray", "gray", "white", "navy"];
const CLOTH_CP = ["brown", "maroon", "navy", "teal", "forest", "bluegray", "slate", "white", "black", "purple", "red", "tan", "charcoal", "walnut"];
const SKIN_CP = ["light", "light", "amber", "olive", "taupe", "bronze"];
/**
 * Tổ hợp ngẫu nhiên hợp lệ, nghiêng về cổ phong: món "dong" gấp đôi "trung", bỏ món "tay" (nghiêng Tây), mặt lão chỉ hiếm; tóc, áo, quần,
 * giày gần như luôn có, râu chỉ nam, các ô phụ (áo choàng, mũ, cổ, mặt, tay) thỉnh thoảng mới có.
 */
export function randomLpc(): LpcLooks {
  const body = Math.random() < 0.5 ? 0 : 1, parts: Record<string, string> = {};
  const chance: Record<string, number> = { brow: 0.7, nose: 0.4, beard: body === 0 ? 0.2 : 0, hair: 0.97, hairext: 0, torso: 1, legs: 1, feet: 0.9, cape: 0.12, belt: 0.35, hat: 0.12, neck: 0.2, face: 0.1, arms: 0.1 };
  for (const s of SLOT_KEYS) {
    let pool = partsOf(s, body).filter((p) => p.style !== "tay" && !(p.id === "head.male_elderly" && Math.random() > 0.05));
    if (!pool.length) pool = partsOf(s, body).filter((p) => REQUIRED.includes(s));
    if (!pool.length || (!REQUIRED.includes(s) && Math.random() > (chance[s] ?? 0.3))) continue;
    parts[s] = pick(pool.flatMap((p) => (p.style === "dong" ? [p, p] : [p]))).id;
  }
  const l: LpcLooks = { v: 1, body, parts, colors: {
    skin: pick(SKIN_CP.filter((c) => LPC_RAMPS.body.allow.includes(c))), eye: pick(LPC_RAMPS.eye.allow) } };
  for (const s of Object.keys(parts)) {
    const f = colorFamily(byId.get(parts[s])!);
    if (f.kind === "own" || f.kind === "ramp") { const cp = f.list.filter((c) => CLOTH_CP.includes(c)); l.colors[s] = pick(cp.length ? cp : f.list); }
  }
  normalize(l, pick(NATURAL_HAIR.filter((c) => LPC_RAMPS.hair.allow.includes(c))));
  return l;
}

// ---------- Màn ----------
const ANIMS: [PreviewAnim, string][] = [["idle", "Đứng"], ["walk", "Đi"], ["attack", "Đánh"], ["cast", "Thi triển"]];
const DIR_LABEL: Record<PreviewDir, string> = { s: "Xuống", e: "Phải", n: "Lên", w: "Trái" };
const DIR_ARROW: Record<PreviewDir, string> = { s: "↓", e: "→", n: "↑", w: "←" };
const TABS: [string, string][] = [["body", "Thân · giới"], ...SLOT_KEYS.filter((s) => s !== "body").map((s): [string, string] => [s, LPC_SLOTS[s]])];

/** Dựng màn vào `o.host`; trả hàm dọn (dừng hoạt ảnh xem trước). */
export function mountMaker(o: MakerOpts): () => void {
  let stop = () => {};
  const modeScreen = () => {
    stop(); stop = () => {};
        o.host.innerHTML = `<h1>${o.title}</h1><p>${o.intro}</p>
      <div class="modes">
        <button type="button" class="modecard" id="mPreset"><b>Mẫu dựng sẵn</b>
          <span>Chọn một trong ${LPC_PRESETS.length} bộ hồn sư dựng sẵn (học viện, thôn dã, quý tộc, lang thang…), rồi chỉnh màu tóc, da, áo. Nhanh, gọn.</span></button>
        <button type="button" class="modecard" id="mLpc"><b>Tự tạo (LPC)</b>
          <span>Ghép từng phần: mặt, mày, tóc, áo, quần, giày, áo choàng, đai, mũ, phụ kiện… và màu từng món. Hàng nghìn tổ hợp.</span></button>
      </div>
      <div class="btns"><button class="btn" id="mOut">${o.cancel.label}</button></div>`;
    o.host.querySelector<HTMLButtonElement>("#mPreset")!.onclick = () => editor("tpl");
    o.host.querySelector<HTMLButtonElement>("#mLpc")!.onclick = () => editor("lpc");
    o.host.querySelector<HTMLButtonElement>("#mOut")!.onclick = o.cancel.fn;
    o.host.querySelector<HTMLButtonElement>("#mPreset")!.focus();
  };

  const editor = (mode: "tpl" | "lpc") => {
    stop();
    o.host.innerHTML = `<h1>${mode === "lpc" ? "Tự tạo hồn sư" : "Mẫu dựng sẵn"}</h1>
      <div class="maker mk-lpc ${mode === "tpl" ? "mk-tpl" : ""}" id="mk"></div>
      <div class="btns mk-btns"><button class="btn primary" id="ok">${o.okLabel}</button><button class="btn" id="back">‹ Chọn chế độ khác</button><button class="btn" id="out">${o.cancel.label}</button></div>
      <div class="err" id="err"></div>`;
    const mk = o.host.querySelector<HTMLElement>("#mk")!, ok = o.host.querySelector<HTMLButtonElement>("#ok")!, err = o.host.querySelector<HTMLElement>("#err")!;
    const e = lpcEditor(mk, o.current?.mode === "lpc" && o.current.lpc ? o.current.lpc : null, mode === "tpl"), value = e.value;
    stop = e.destroy;
    o.host.querySelector<HTMLButtonElement>("#back")!.onclick = modeScreen;
    o.host.querySelector<HTMLButtonElement>("#out")!.onclick = o.cancel.fn;
    ok.onclick = async () => {
      ok.disabled = true; err.textContent = "";
      try { await o.onOk(value()); }
      catch (e) { err.textContent = (e as Error).message; ok.disabled = false; }
    };
    ok.focus();
  };

  modeScreen();
  return () => stop();
}

/**
 * Màn Tự tạo (`tpl` = false): thẻ theo ô, danh sách món hợp thể hình, màu, nút Ngẫu nhiên và "Bắt đầu từ mẫu", xem trước xoay bốn hướng với
 * đi / đánh / thi triển. Màn Mẫu dựng sẵn (`tpl` = true): cùng khung xem trước, bên phải là lưới các bộ LPC_PRESETS + chỉnh màu tóc / da / áo.
 */
function lpcEditor(mk: HTMLElement, from: LpcLooks | null, tpl: boolean) {
  let l: LpcLooks = from && parseLpc(from) ? structuredClone(from) : tpl ? structuredClone(LPC_PRESETS[0].lpc) : defaultLpc(0);
  let hair = normalize(l, hairOf(l)), tab = "body", anim: PreviewAnim = "idle", presetId = tpl && !from ? LPC_PRESETS[0].id : "";
  mk.innerHTML = `<div class="pv"><canvas id="lpv" width="64" height="64" aria-label="Xem trước hồn sư"></canvas>
      <div class="pvbar" id="dirs"></div><div class="pvbar" id="anims"></div>
      ${tpl ? "" : `<button type="button" class="opt" id="rnd">Ngẫu nhiên</button><button type="button" class="opt" id="fromTpl">Bắt đầu từ mẫu</button>`}<div id="pvTxt"></div></div>
    <div class="opts">${tpl ? "" : `<div class="tabs" id="tabs" role="tablist"></div>`}<div class="tabbody" id="tabbody"></div></div>`;
  const cv = mk.querySelector<HTMLCanvasElement>("#lpv")!, view = new LpcPreview(cv);
  const tabs = mk.querySelector<HTMLElement>("#tabs"), body = mk.querySelector<HTMLElement>("#tabbody")!;
  // Ảnh nhỏ từng bộ trong lưới mẫu (mỗi ảnh một LpcPreview đứng nhìn xuống), dựng lại thì hủy bản cũ.
  let thumbs: LpcPreview[] = [];
  const dropThumbs = () => { thumbs.forEach((t) => t.destroy()); thumbs = []; };
  const tplGrid = () => {
    let h = "", group = "";
    for (const p of LPC_PRESETS) {
      if (p.group !== group) { if (group) h += "</div>"; group = p.group; h += `<h3>${esc(group)}</h3><div class="tplgrid">`; }
      h += `<button type="button" class="tplcard" data-tpl="${p.id}" aria-pressed="${presetId === p.id}" title="${esc(p.note)}"><canvas width="64" height="64" data-tc="${p.id}"></canvas><span>${esc(p.vi)}</span></button>`;
    }
    return h + "</div>";
  };
  const mountThumbs = (root: HTMLElement) => root.querySelectorAll<HTMLCanvasElement>("canvas[data-tc]").forEach((c) => {
    const v = new LpcPreview(c); v.spin(false); v.setLooks(LPC_PRESETS.find((p) => p.id === c.dataset.tc)!.lpc); thumbs.push(v);
  });
  const dirs = mk.querySelector<HTMLElement>("#dirs")!, anims = mk.querySelector<HTMLElement>("#anims")!;

  const bars = () => {
    dirs.innerHTML = `<button type="button" class="opt mini" data-spin="1" aria-pressed="${view.isSpinning()}" title="Tự xoay bốn hướng" aria-label="Tự xoay">↻</button>` +
      PREVIEW_DIRS.map((d) => `<button type="button" class="opt mini" data-dir="${d}" aria-pressed="${!view.isSpinning() && view.currentDir() === d}" title="Hướng ${DIR_LABEL[d].toLowerCase()}" aria-label="Hướng ${DIR_LABEL[d].toLowerCase()}">${DIR_ARROW[d]}</button>`).join("");
    anims.innerHTML = ANIMS.map(([a, n]) => `<button type="button" class="opt mini" data-anim="${a}" aria-pressed="${anim === a}">${n}</button>`).join("");
  };
  const tabsRender = () => {
    if (!tabs) return;
    tabs.innerHTML = TABS.map(([k, n]) => `<button type="button" class="tab" role="tab" data-tab="${k}" aria-selected="${tab === k}">${n}${l.parts[k] && k !== "body" && k !== "head" ? " •" : ""}</button>`).join("");
  };
  /** Màn Mẫu dựng sẵn: lưới bộ (dựng một lần) + màu tóc / da / áo của bộ đang chọn. */
  const tplColors = () => {
    const el = mk.querySelector<HTMLElement>("#tplcol")!, torso = l.parts.torso ? colorFamily(byId.get(l.parts.torso)!) : null;
    el.innerHTML = `<h3>Màu tóc · ${viColor(hair)}</h3><div class="sws">${LPC_RAMPS.hair.allow.map((c) => swBtn("hair", c, viColor(c), hair === c)).join("")}</div>
      <h3>Màu da · ${viColor(l.colors.skin)}</h3><div class="sws">${LPC_RAMPS.body.allow.map((c) => swBtn("skin", c, viColor(c), l.colors.skin === c)).join("")}</div>` +
      (torso && torso.kind !== "none" && torso.kind !== "hair" ? `<h3>Màu áo · ${viColor(l.colors.torso)}</h3><div class="sws">${torso.list.map((c) => swBtn("c:torso", c, viColor(c), l.colors.torso === c)).join("")}</div>` : "");
  };
  const bodyRender = () => {
    if (tpl) { tplColors(); return; }
    if (tab === "tpl") { dropThumbs(); body.innerHTML = `<p class="rnote">Chọn một bộ dựng sẵn làm điểm xuất phát, rồi chỉnh tiếp từng món. Lựa chọn hiện tại sẽ bị thay.</p>${tplGrid()}`; mountThumbs(body); return; }
    if (tab === "body") {
      body.innerHTML = `<h3>Giới (thể hình)</h3><div class="seg">${SEXES.map((n, i) => `<button type="button" class="opt" data-body="${i}" aria-pressed="${l.body === i}">${n}</button>`).join("")}</div>
        <h3>Màu da · ${viColor(l.colors.skin)}</h3><div class="sws">${LPC_RAMPS.body.allow.map((c) => swBtn("skin", c, viColor(c), l.colors.skin === c)).join("")}</div>
        <h3>Màu mắt · ${viColor(l.colors.eye)}</h3><div class="sws">${LPC_RAMPS.eye.allow.map((c) => swBtn("eye", c, viColor(c), l.colors.eye === c)).join("")}</div>`;
      return;
    }
    const list = partsOf(tab, l.body), cur = l.parts[tab] ? byId.get(l.parts[tab]) : undefined;
    // Món không hợp giới đã bị ẩn khỏi danh sách (partsOf); ô trống thì chỉ còn "Không".
    let h = `<h3>${LPC_SLOTS[tab]}${cur ? ` · ${esc(cur.vi)}` : ""}</h3><div class="partgrid">`;
    if (!REQUIRED.includes(tab)) h += `<button type="button" class="opt" data-part="" aria-pressed="${!cur}">Không</button>`;
    h += list.map((p) => `<button type="button" class="opt" data-part="${p.id}" aria-pressed="${cur?.id === p.id}">${esc(p.vi)}${p.style === "dong" ? ' <i class="cp" title="Hợp cổ phong">◆</i>' : ""}</button>`).join("");
    h += "</div>";
    if (!list.length) h += `<p class="rnote">Ô này chưa có món nào hợp thể hình ${SEXES[l.body].toLowerCase()}.</p>`;
    if (cur) {
      const f = colorFamily(cur);
      if (f.kind === "hair") h += `<h3>Màu tóc · ${viColor(hair)}</h3><div class="sws">${f.list.map((c) => swBtn("hair", c, viColor(c), hair === c)).join("")}</div>`;
      else if (f.kind !== "none") h += `<h3>Màu ${esc(cur.vi.toLowerCase())} · ${viColor(l.colors[tab])}</h3><div class="sws">${f.list.map((c) => swBtn(`c:${tab}`, c, viColor(c), l.colors[tab] === c)).join("")}</div>`;
    }
    body.innerHTML = h;
  };
  const refresh = (what: "all" | "view" = "all") => {
    view.setLooks(l);
    const pre = presetId ? LPC_PRESETS.find((p) => p.id === presetId) : undefined;
    mk.querySelector("#pvTxt")!.textContent = pre ? pre.vi : `${SEXES[l.body]} · ${l.parts.hair ? byId.get(l.parts.hair)!.vi : "đầu trọc"}`;
    if (what === "all") { tabsRender(); bodyRender(); }
  };
  view.onDir = () => { if (view.isSpinning()) bars(); };
  const set = (fn: () => void) => { fn(); hair = normalize(l, hair); if (!tpl) presetId = ""; refresh(); };

  mk.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button"); if (!b || !mk.contains(b)) return;
    const d = b.dataset;
    if (d.tpl) {
      const p = LPC_PRESETS.find((x) => x.id === d.tpl); if (!p) return;
      if (!tpl) dropThumbs();
      l = structuredClone(p.lpc); presetId = p.id; hair = normalize(l, hairOf(l)); tab = "body";
      if (tpl) mk.querySelectorAll<HTMLElement>("[data-tpl]").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.tpl === p.id)));
      refresh(); return;
    }
    if (b.id === "fromTpl") { dropThumbs(); tab = "tpl"; tabsRender(); bodyRender(); body.scrollTop = 0; return; }
    if (d.tab) { dropThumbs(); tab = d.tab; tabsRender(); bodyRender(); body.scrollTop = 0; return; }
    if (d.dir) { view.setDir(d.dir as PreviewDir); bars(); return; }
    if (d.spin) { view.spin(!view.isSpinning()); bars(); return; }
    if (d.anim) { anim = d.anim as PreviewAnim; view.setAnim(anim); bars(); return; }
    if (b.id === "rnd") { dropThumbs(); presetId = ""; l = randomLpc(); hair = hairOf(l); tab = "body"; refresh(); return; }
    if (d.body !== undefined) { const nb = Number(d.body); if (nb !== l.body) set(() => { l.body = nb; }); return; }
    if (d.part !== undefined) {
      const id = d.part, slot = tab;
      set(() => { if (id) l.parts[slot] = id; else delete l.parts[slot]; });
      return;
    }
    if (d.lk && d.v) {
      const v = d.v;
      if (d.lk === "skin" || d.lk === "eye") set(() => { l.colors[d.lk!] = v; });
      else if (d.lk === "hair") set(() => { hair = v; });
      else if (d.lk.startsWith("c:")) set(() => { l.colors[d.lk!.slice(2)] = v; });
    }
  });

  bars();
  if (tpl) { body.innerHTML = `${tplGrid()}<div id="tplcol"></div>`; mountThumbs(body); }
  refresh();
  return {
    value: (): Looks => { const x = structuredClone(l); return { sex: x.body, hair: 0, hairCol: 0, outfitCol: 0, skin: 0, mode: "lpc", lpc: x }; },
    destroy: () => { dropThumbs(); view.destroy(); },
  };
}

/**
 * Mở màn đổi ngoại hình phủ lên game (dùng lại #overlay / #card của màn đăng nhập, đang ẩn trong lúc chơi). `onOk` xong không lỗi thì
 * đóng; `cancel` / hết việc thì đóng và trả về game.
 */
export function openLooksOverlay(o: Omit<MakerOpts, "host" | "cancel"> & { onClose?: () => void }): () => void {
  const overlay = document.getElementById("overlay")!, card = document.getElementById("card")!;
  const prev = { hidden: overlay.hidden, wide: card.classList.contains("wide") };
  let off = () => {};
  const close = () => {
    off(); card.innerHTML = ""; card.classList.toggle("wide", prev.wide); card.classList.remove("mk"); overlay.hidden = prev.hidden; o.onClose?.();
  };
  overlay.hidden = false; card.classList.add("wide", "mk");
  off = mountMaker({ ...o, host: card, cancel: { label: "Hủy", fn: close }, async onOk(l) { await o.onOk(l); close(); } });
  return close;
}
