// Onboarding sau hướng dẫn điều khiển (UI v2, kiểm kê UI #10; Part of #885): 6 bước đầu theo thứ tự chọn võ hồn → nhiệm vụ đầu → mở túi → hấp thụ hồn hoàn
// → xem bản đồ → mở menu. Mỗi bước tô sáng đúng nút (vòng viền nhấp nháy + mũi nhấn; giảm chuyển động thì đứng yên), thẻ hướng dẫn nêu việc cần làm và phím
// tắt. Chỉ hiển thị: bước tiến lên khi bảng tương ứng thực sự mở (đọc thuộc tính `hidden` của DOM) hoặc khi GameScene báo sự kiện đã gửi, không quyết điều gì
// của luật chơi và không thêm tin server. Tiến độ lưu localStorage theo tên hồn sư; "Bỏ qua" tắt hẳn.
// Khởi động: guide.ts (hướng dẫn điều khiển) gọi `onboardAttach` khi vào game và `onboardBegin` khi người chơi xong / bỏ qua chuỗi 4 bước; tài khoản cũ
// (chuỗi tân thủ đã xong từ trước) không có bản ghi nên không bị hỏi.

export type ObEvent = "absorb";
export interface ObStep {
  id: string; title: string; body: string;
  /** Bộ chọn nút cần sáng: lấy cái đầu tiên đang hiện (hub đang mở thì tô thẻ mục, chưa mở thì tô huy hiệu menu). */
  target: string[];
  /** Bước xong khi một trong các phần tử này đang mở (không còn `hidden`). */
  open?: string[];
  /** Bước xong khi nhận sự kiện này từ GameScene. */
  event?: ObEvent;
  /** Bước xong khi bấm vào vùng này. */
  tap?: string;
  /** Thẻ đặt thấp (bảng Túi đang mở che giữa màn): `low` = sát đáy màn. */
  dock?: "low";
}

/** Chữ khớp phím thật ở GameScene.setupInput (V, B, N, M, Esc). */
export const OB_STEPS: readonly ObStep[] = [
  { id: "vohon", title: "Chọn võ hồn ra trận", body: "Mở Đội hình (phím V, hoặc nút 魂 giữa trên rồi chọn Võ Hồn): xem võ hồn của bạn và chọn người ra trận. Phím 1–4 đổi nhanh khi đánh.",
    target: ["#hub:not([hidden]) [data-hub=vohon]", "#hubBtn"], open: ["#roster"] },
  { id: "quest", title: "Nhiệm vụ đầu tiên", body: "Khung ở góc phải ghi việc đang làm: gặp NPC có dấu ! để nhận bài. Mũi tên ở rìa màn chỉ đường. Bấm vào khung để đọc.",
    target: ["#quest", "#sideBox", "#hubBtn"], tap: "#quest" },
  { id: "bag", title: "Mở Túi đồ", body: "Mở Túi đồ (phím B, hoặc nút 魂 giữa trên rồi chọn Túi Đồ): đồ nhặt được, hồn hoàn và thuốc đều nằm ở đây.",
    target: ["#hub:not([hidden]) [data-hub=bag]", "#hubBtn"], open: ["#bag"] },
  { id: "ring", title: "Gắn hồn hoàn", body: "Chọn hồn hoàn trong Túi, bấm Hấp thụ rồi đứng yên chờ thanh tiến độ. Chưa có thì hạ hồn thú, nhặt bằng E, rồi bấm Làm sau.",
    target: ["#bag .buse.absorb", "#bag"], event: "absorb", dock: "low" },
  { id: "map", title: "Xem bản đồ", body: "Bản đồ khu vực (phím N) hoặc thế giới (phím M): bấm vào một chỗ để đặt cờ, nhân vật tự đi tới.",
    target: ["#areaBtn", "#worldBtn", "#hubBtn"], open: ["#mapview", "#world"] },
  { id: "hub", title: "Mở menu", body: "Nút 魂 (hoặc Esc) mở menu: Nhiệm Vụ, Tông Môn, Cửa Hàng, Cẩm Nang đều ở đây.",
    target: ["#hubBtn"], open: ["#hub"] },
];
export const OB_DONE_TEXT = { title: "Xong phần làm quen", body: "Chúc bạn săn hồn vui vẻ. Cần xem lại thì mở Cẩm Nang trong menu (nút 魂 hoặc Esc)." };

/** localStorage an toàn (không import net.ts để test bằng node được). */
const storage = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* bỏ qua */ } },
};

/** Bản ghi lưu: bước đang làm (`s`), trạng thái. */
export interface ObSaved { s: number; st: "run" | "done" | "skip" }
export const obKey = (who: string) => `soul-onboard-v1:${who}`;
/** Đọc bản ghi; hỏng / lạ thì null (coi như chưa bắt đầu). Hàm thuần. */
export function parseSaved(raw: string | null, n = OB_STEPS.length): ObSaved | null {
  try {
    const j = JSON.parse(raw ?? "null");
    if (!j || typeof j !== "object") return null;
    const st = j.st === "done" || j.st === "skip" ? j.st : j.st === "run" ? "run" : null;
    if (!st) return null;
    const s = Number.isInteger(j.s) ? Math.max(0, Math.min(n - 1, j.s)) : 0;
    return { s, st };
  } catch { return null; }
}
/** Phần tử có đang hiện không (có kích thước và không bị ẩn). */
const shown = (e: Element | null): e is HTMLElement => !!e && !(e as HTMLElement).hidden && (e as HTMLElement).getClientRects().length > 0;
/** Bộ chọn đầu tiên trong danh sách đang hiện, hoặc null. */
export const firstShown = (sels: readonly string[], root: ParentNode = document): HTMLElement | null => {
  for (const s of sels) { const e = root.querySelector(s); if (shown(e)) return e; }
  return null;
};

// ---- phần DOM ----
let who = "", saved: ObSaved | null = null, step = 0, running = false;
let card: HTMLElement | null = null, spot: HTMLElement | null = null, timer = 0, doneTimer = 0, tapEl: HTMLElement | null = null;

const q = (c: HTMLElement, sel: string) => c.querySelector(sel) as HTMLElement;
const persist = () => { if (who && saved) storage.set(obKey(who), JSON.stringify(saved)); };

function root(): HTMLElement {
  if (card?.isConnected) return card;
  card = document.createElement("section"); card.id = "onboard"; card.className = "ob f2-giay-nho"; card.hidden = true;
  card.setAttribute("role", "dialog"); card.setAttribute("aria-label", "Làm quen"); card.setAttribute("aria-live", "polite");
  card.innerHTML = `<div class="ob-main"><div class="ob-head"><b></b><span class="ob-dots" aria-hidden="true"></span></div><h4></h4><p></p></div>
    <div class="ob-foot"><button type="button" class="ob-next"></button><button type="button" class="ob-skip">Bỏ qua</button></div>`;
  q(card, ".ob-skip").addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); finish("skip"); });
  q(card, ".ob-next").addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); if (!running) hide(); else advance(); });
  (document.getElementById("hud") ?? document.body).appendChild(card);
  return card;
}
/** Vòng sáng + mũi nhấn bám theo nút (đổi chỗ khi cửa sổ co giãn / bảng mở ra). Tính toạ độ theo tỉ lệ zoom --u của #hud. */
function place(target: HTMLElement | null) {
  const hud = document.getElementById("hud");
  if (!target || !hud) { spot?.remove(); spot = null; return; }
  if (!spot?.isConnected) {
    spot = document.createElement("div"); spot.id = "obSpot"; spot.setAttribute("aria-hidden", "true");
    spot.innerHTML = `<i class="ob-ring"></i><i class="ob-arrow">▼</i>`;
    hud.appendChild(spot);
  }
  const t = target.getBoundingClientRect(), h = hud.getBoundingClientRect(), k = h.width / (hud.offsetWidth || h.width) || 1;
  const x = (t.left - h.left) / k, y = (t.top - h.top) / k, w = t.width / k, ht = t.height / k;
  spot.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${ht}px`;
  // Mũi nhấn nằm trên nút; sát mép trên màn thì chuyển xuống dưới.
  spot.dataset.side = y < 28 ? "below" : "above";
}

function paint() {
  const c = root(), s = OB_STEPS[step];
  c.hidden = false; c.dataset.mode = "step"; c.dataset.dock = s.dock ?? "";
  q(c, ".ob-head b").textContent = `Làm quen · bước ${step + 1}/${OB_STEPS.length}`;
  q(c, ".ob-dots").textContent = OB_STEPS.map((_, i) => (i < step ? "●" : i === step ? "◉" : "○")).join(" ");
  q(c, "h4").textContent = s.title; q(c, "p").textContent = s.body;
  q(c, ".ob-next").textContent = s.id === "ring" ? "Làm sau" : "Bỏ bước";
  q(c, ".ob-skip").hidden = false;
}

/** Nhịp kiểm tra (4 lần / giây): bước đang chờ đã xong chưa, nút cần sáng nằm ở đâu. */
function tick() {
  if (!running) return;
  const s = OB_STEPS[step];
  if (s.open && firstShown(s.open)) return advance();
  place(firstShown(s.target));
  if (s.tap) {
    const e = document.querySelector<HTMLElement>(s.tap);
    if (e && e !== tapEl) { tapEl?.removeEventListener("pointerdown", onTap); tapEl = e; e.addEventListener("pointerdown", onTap); }
  }
}
function onTap() { if (running && OB_STEPS[step].tap) advance(); }

function advance() {
  tapEl?.removeEventListener("pointerdown", onTap); tapEl = null;
  if (step >= OB_STEPS.length - 1) return finish("done");
  step++; if (saved) { saved.s = step; persist(); }
  paint(); tick();
}
function hide() { if (card) card.hidden = true; place(null); clearTimeout(doneTimer); }
function stop() { running = false; window.clearInterval(timer); timer = 0; tapEl?.removeEventListener("pointerdown", onTap); tapEl = null; place(null); }
function finish(st: "done" | "skip") {
  stop();
  saved = { s: step, st }; persist();
  if (st === "skip") return hide();
  // Hoàn thành: thẻ cảm ơn, tự tắt sau ít giây.
  const c = root(); c.hidden = false; c.dataset.mode = "done";
  q(c, ".ob-head b").textContent = "Làm quen · xong"; q(c, ".ob-dots").textContent = OB_STEPS.map(() => "●").join(" ");
  q(c, "h4").textContent = OB_DONE_TEXT.title; q(c, "p").textContent = OB_DONE_TEXT.body;
  q(c, ".ob-next").textContent = "Đóng"; q(c, ".ob-skip").hidden = true;
  clearTimeout(doneTimer); doneTimer = window.setTimeout(hide, 9000);
}
function run() {
  if (running) return;
  running = true; paint(); tick();
  timer = window.setInterval(tick, 250);
}

/** Gắn vào một hồn sư (guide.ts gọi mỗi lần vào bản đồ): nạp tiến độ; đang làm dở thì tiếp tục (giữ bước khi GameScene dựng lại cảnh). */
export function onboardAttach(name: string) {
  if (name !== who) { stop(); hide(); who = name; saved = parseSaved(storage.get(obKey(name))); step = saved?.s ?? 0; }
  if (saved?.st === "run") run();
}
/** Người chơi vừa xong / bỏ qua hướng dẫn điều khiển: bắt đầu làm quen một lần (đã có bản ghi thì không bắt đầu lại). */
export function onboardBegin() {
  if (!who || saved) return;
  saved = { s: 0, st: "run" }; step = 0; persist(); run();
}
/** GameScene báo việc đã gửi (đang chờ đúng việc này thì tiến lên). */
export function onboardEvent(ev: ObEvent) {
  if (running && OB_STEPS[step].event === ev) advance();
}
/** Đang chạy (guide.ts nhường chỗ gợi ý theo tình huống). */
export const onboardActive = () => running;
