// Thanh máu thú vương / boss thế giới, đếm ngược và bảng đóng góp của HUD (tách nguyên văn từ hud.ts, Part of #885 bước 0a); hud.ts re-export để nơi gọi giữ nguyên.
import { HE, type He, WORLD, KING } from "../../shared/data.ts";
import "./ui2-hud-side.css";
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;

// UI v2 (đợt 1d): hộp phụ của HUD nhận khung Mực của kit (index.html giữ nguyên). Luật vẽ ở ui2-hud.css / ui2-hud-side.css.
for (const id of ["bossbar", "bossRank", "target", "prompt", "portal", "wpbox", "fusion", "pmenu"]) document.getElementById(id)?.classList.add("f2-muc-nho");

// ---------- Tà hóa thú vương (BĐ5, mục 5.4): đếm ngược, thanh máu lớn, bảng xếp hạng sát thương ----------
/** Số giây -> "4:59". */
export const mmss = (s: number) => { const t = Math.max(0, Math.ceil(s)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
let bossCd: { name: string; mapName: string; here: boolean; end: number; col: string } | null = null;
/** Đếm ngược thú vương sắp xuất hiện (tin "boss" k = "warn", mọi bản đồ); null = ẩn. `secs`: còn bao nhiêu giây (server tính). */
export function setBossCountdown(c: { name: string; mapName: string; here: boolean; secs: number; col?: string } | null) {
  bossCd = c ? { ...c, end: performance.now() + c.secs * 1000, col: c.col ?? "#ff5a5a" } : null;
  updateBossCd();
}
/** Mỗi lần cập nhật HUD: chữ đếm ngược; hết giờ thì ẩn (tin "spawn" sẽ tới). */
export function updateBossCd() {
  const el = $("#bossCd"); if (!el) return;
  const left = bossCd ? (bossCd.end - performance.now()) / 1000 : 0;
  if (!bossCd || left <= 0) { el.hidden = true; return; }
  el.hidden = false; el.style.setProperty("--c", bossCd.col);
  const txt = `${bossCd.name} xuất hiện sau ${mmss(left)} ở ${bossCd.mapName}${bossCd.here ? " (bản đồ này)" : ""}`;
  if (el.textContent !== txt) el.textContent = txt;
}
let bossLifeEnd = 0;
/** Thời gian còn lại trước khi thú vương rút đi (tin "boss" spawn / here). */
export function setBossLife(secs: number) { bossLifeEnd = performance.now() + secs * 1000; }
/** Đồng hồ nổi giận của boss thế giới (BĐ6e): giây còn lại trước khi nổi giận, theo tin "boss" (spawn / here). */
let bossRageEnd = 0;
export function setBossRage(secs: number) { bossRageEnd = performance.now() + secs * 1000; }
/** Điểm yếu hệ đang hiện của boss thế giới: giây còn lại (đếm ngược trên thanh máu), theo tin "boss" k = "weak". */
let bossWeakEnd = 0;
export function setBossWeak(secs: number) { bossWeakEnd = performance.now() + secs * 1000; }
/**
 * Phần riêng của boss thế giới trên thanh máu lớn (BĐ6e, đọc thẳng BeastState): nổi giận / đồng hồ nổi giận, điểm yếu hệ (hệ võ hồn
 * mình đang ra trận có khớp không), khiên Bá Thể, số lần ngắt tích lực, đang lặn.
 */
export interface BossWorldView { rage: boolean; weak: He | null; myHe: He; shield: number; brk: number; need: number; charging: boolean; dive: boolean; armorHe: He | null; }
/**
 * Thanh máu thú vương lớn ở đầu màn hình (mục 5.4 "Nhận diện"): đọc thẳng BeastState (máu, số người tham gia, giai đoạn). null = ẩn.
 * Khung mục tiêu nhỏ (#target) dời xuống dưới khi thanh này hiện.
 */
export function showBoss(b: { name: string; hp: number; maxHp: number; parts: number; phase: number; title: string; col: string; world?: BossWorldView } | null) {
  const el = $("#bossbar"); document.body.classList.toggle("boss", !!b);
  if (!b) { el.hidden = true; $("#bossRank").hidden = true; return; }
  el.hidden = false; el.style.setProperty("--c", b.col);
  const now = performance.now(), life = (bossLifeEnd - now) / 1000, w = b.world, rageIn = (bossRageEnd - now) / 1000, weakT = (bossWeakEnd - now) / 1000;
  const key = `${document.body.className}|${b.name}|${b.hp}|${b.maxHp}|${b.parts}|${b.phase}|${b.title}|${Math.ceil(life)}|${w ? `${JSON.stringify(w)}|${Math.ceil(rageIn)}|${Math.ceil(weakT)}` : ""}`;
  if (el.dataset.key === key) return;
  el.dataset.key = key;
  if (!el.firstChild) el.innerHTML = `<div class="bhead"><b></b><span class="ph"></span><span class="bn"></span></div><div class="bar"><i></i><em></em><span></span></div><div class="wl"></div>`;
  el.querySelector("b")!.textContent = b.name;
  // Boss thế giới (BĐ6e): giai đoạn là nổi giận / đồng hồ nổi giận; hết giờ thì "lặn xuống hồ" thay cho "rút đi".
  el.querySelector(".ph")!.textContent = w ? (w.rage ? "NỔI GIẬN" : rageIn > 0 ? `Nổi giận sau ${mmss(rageIn)}` : "") : b.phase === 2 ? `Giai đoạn 2 – ${b.title}` : "Giai đoạn 1";
  el.querySelector(".bn")!.textContent = `${b.parts} người tham gia${life > 0 ? ` · ${w ? "lặn xuống hồ" : "rút đi"} sau ${mmss(life)}` : ""}`;
  (el.querySelector(".bar i") as HTMLElement).style.width = `${(100 * b.hp) / Math.max(1, b.maxHp)}%`;
  // Khiên Bá Thể: dải xanh đè lên thanh máu, dài theo tỉ lệ khiên / máu tối đa.
  (el.querySelector(".bar em") as HTMLElement).style.width = w?.shield ? `${Math.min(100, (100 * w.shield) / Math.max(1, b.maxHp))}%` : "0";
  el.querySelector(".bar span")!.textContent = `${b.hp.toLocaleString("vi-VN")} / ${b.maxHp.toLocaleString("vi-VN")}${w?.shield ? ` · khiên ${w.shield.toLocaleString("vi-VN")}` : ""}`;
  el.classList.toggle("p2", b.phase === 2);
  const wl = el.querySelector(".wl") as HTMLElement;
  wl.hidden = !w; wl.innerHTML = "";
  if (w) {
    const chip = (text: string, cls = "") => { const c = document.createElement("span"); c.className = cls; c.textContent = text; wl.appendChild(c); };
    if (w.weak) chip(`Điểm yếu: ${HE[w.weak].name} ×${String(WORLD.weakMult).replace(".", ",")}${weakT > 0 ? ` (${Math.ceil(weakT)} giây)` : ""} · ${w.myHe === w.weak ? "võ hồn của bạn đúng hệ" : `đổi sang võ hồn ${HE[w.weak].name}!`}`, w.myHe === w.weak ? "ok" : "bad");
    if (w.shield && w.armorHe) chip(`Bá Thể: võ hồn ${HE[w.armorHe].name} phá khiên nhanh gấp 3${w.myHe === w.armorHe ? "" : " – đổi võ hồn!"}`, w.myHe === w.armorHe ? "ok" : "bad");
    if (w.charging && w.need) chip(`Tích lực: ngắt ${w.brk}/${w.need} bằng khống chế của võ hồn Khống chế${w.myHe === "khong_che" ? "" : " – đổi võ hồn!"}`, w.myHe === "khong_che" ? "ok" : "bad");
    if (w.dive) chip("Đang lặn giữa hồ: không nhận sát thương, sẽ nổi lên ở vòng sóng xanh (mẫn công đứng chờ đánh điểm yếu)");
    if (!wl.childElementCount) wl.hidden = true;
  }
  // Khung mục tiêu / đếm ngược nằm ngay dưới thanh máu boss (thanh boss thế giới cao hơn khi có dòng cơ chế).
  const left = $("#lcol"), right = $("#rcol"), hud = $("#hud");
  el.style.setProperty("--boss-left-edge", `${left.offsetLeft + left.offsetWidth}px`);
  el.style.setProperty("--boss-right-inset", `${hud.clientWidth - right.offsetLeft}px`);
  document.body.style.setProperty("--bossh", `${el.offsetTop + el.offsetHeight}px`);
}
/**
 * Bảng xếp hạng đóng góp khi đánh thú vương / boss thế giới (tin "boss" k = "rank" / "down"): tối đa 10 dòng, dòng của mình sáng; từ 3%
 * có rương. Từ 9.2 đóng góp = sát thương + hồi máu / khiên cho người tham gia khác; cột "Hỗ trợ" là phần hồi / khiên trong tổng (server tính).
 */
export function bossRank(list: { id: string; name: string; pct: number; sup?: number }[] | null, me: string, final = false, world = false) {
  const el = $("#bossRank");
  if (!list || !list.length) { el.hidden = true; return; }
  el.hidden = false; el.innerHTML = "";
  const h = document.createElement("b"); h.textContent = final ? "Kết quả đóng góp" : "Đóng góp"; el.appendChild(h);
  const pc = (v: number) => `${String(v).replace(".", ",")}%`;
  const head = document.createElement("div"); head.className = "rk hd";
  head.innerHTML = "<span></span><em>Tên</em><s>Hỗ trợ</s><i>Tổng</i>"; el.appendChild(head);
  list.forEach((x, i) => {
    const r = document.createElement("div"); r.className = "rk" + (x.id === me ? " me" : "") + (x.pct / 100 >= KING.share ? "" : " low");
    r.innerHTML = `<span>${i + 1}.</span><em></em><s${x.sup ? "" : ' class="z"'}>${x.sup ? pc(x.sup) : "–"}</s><i>${pc(x.pct)}</i>`;
    r.querySelector("em")!.textContent = x.name;
    el.appendChild(r);
  });
  const K = world ? WORLD : KING;
  const n = document.createElement("small");
  n.textContent = world ? `Đóng góp = sát thương + hồi máu / khiên cho người khác. Từ ${K.share * 100}% nhận hồn hoàn và rương (tối đa ${K.daily} lần/ngày); gây sát thương nhiều nhất nhận hồn hoàn đỏ 100.000 năm.`
    : `Đóng góp = sát thương + hồi máu / khiên cho người khác. Từ ${K.share * 100}% nhận rương (tối đa ${K.daily} lần/ngày).`;
  el.appendChild(n);
}
