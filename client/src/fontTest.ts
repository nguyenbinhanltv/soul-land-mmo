// Trang thử giao diện (bước 10.8, mở bằng `?thu=font`, không cần đăng nhập): toàn bộ chữ tiếng Việt có dấu ở hai font pixel và các cỡ
// bội số nguyên, cùng mẫu bộ giao diện thủy mặc (nút, ấn triện, thanh, biểu tượng trạng thái / vật phẩm) và thẻ võ hồn SR / SSR / UR.
// Chỉ để soát bằng mắt và chụp ảnh; số liệu (màu niên hạn, võ hồn, trạng thái) đọc từ shared/data.ts.
import { TIERS, VOHON, BONE_SLOTS, ITEMS, STATUS_IDS, BUFF_IDS, STATUS, BUFFS, MAX_STARS } from "../../shared/data.ts";
import { vohonCard } from "./cards.ts";
import { artImg, tintedUrl } from "./uiArt.ts";
import { ringColor } from "./hud.ts";

/** Chuỗi bắt buộc của bước 10.8 và toàn bộ nguyên âm có dấu (5 dấu thanh × 12 nguyên âm, hoa và thường) dựng bằng Unicode NFC. */
const REQUIRED = "Ầ Ẩ Ẫ Ậ Ắ Ằ Ẳ Ẵ Ặ Ế Ề Ể Ễ Ệ Ố Ồ Ổ Ỗ Ộ Ớ Ờ Ở Ỡ Ợ Ứ Ừ Ử Ữ Ự Ỳ Ỷ Ỹ Ỵ đĐ";
const vowels = (s: string) => [...s].map((c) => ["", "̀", "́", "̉", "̃", "̣"].map((m) => (c + m).normalize("NFC")).join("")).join(" ");
const UPPER = vowels("AĂÂEÊIOÔƠUƯY") + " Đ";
const LOWER = vowels("aăâeêioôơuưy") + " đ";
const SAMPLE = "Hạo Thiên Chùy · Lam Ngân Thảo · Cửu Bảo Lưu Ly Tháp · Đường Tam, Tiểu Vũ, Đái Mộc Bạch · Đấu La Đại Lục: Hồn sư đoạt hồn hoàn vạn năm.";

export function fontTestScreen(card: HTMLElement, overlay: HTMLElement) {
  overlay.hidden = false; card.classList.add("wide", "fonttest");
  const line = (cls: string, size: string, label: string, text: string) =>
    `<div class="ftl"><small>${label}</small><p class="${cls}" style="font-size:${size}"></p></div>`.replace("></p>", `>${text}</p>`);
  const pick = (r: string) => VOHON.find((v) => v.rarity === r)!;
  card.innerHTML = `<h1>Thử font tiếng Việt</h1>
    <p>Galmuri 11 (nét 12 px) và Galmuri 9 (nét 10 px) (OFL), cắt còn chữ Latin và tiếng Việt; chỉ dùng cỡ bội số nguyên của lưới font.</p>
    ${line("f12", "12px", "Galmuri 11 · 12 px (chữ thường của giao diện)", REQUIRED)}
    ${line("f12", "24px", "Galmuri 11 · 24 px (tiêu đề)", REQUIRED)}
    ${line("f10", "10px", "Galmuri 9 · 10 px (chữ chật: thanh, nút hồn kỹ, thẻ)", REQUIRED)}
    ${line("f10", "20px", "Galmuri 9 · 20 px", REQUIRED)}
    ${line("f12", "12px", "Mọi nguyên âm có dấu, chữ hoa", UPPER)}
    ${line("f12", "12px", "Mọi nguyên âm có dấu, chữ thường", LOWER)}
    ${line("f10", "10px", "Galmuri 9, chữ hoa", UPPER)}
    ${line("f10", "10px", "Galmuri 9, chữ thường", LOWER)}
    ${line("f12", "12px", "Câu mẫu", SAMPLE)}
    ${line("f12", "12px", "Biểu tượng dự phòng (Ark Symbols 12)", "☄ ☇ ☈ ☠ ☯ ☽ ☾ ⚒ ⚔ ⛓ ⛨ ❦")}
    ${line("f10", "10px", "Biểu tượng dự phòng (Ark Symbols 10)", "☄ ☇ ☈ ☠ ☯ ☽ ☾ ⚒ ⚔ ⛓ ⛨ ❦")}
    <h3>Nút, ấn triện, thanh</h3>
    <div class="ftrow"><button class="buse">Nút giấy</button><button class="buse ft-hover">Rê chuột</button><button class="buse ft-press">Đang nhấn</button>
      <button class="buse absorb">Ấn son (nút chính)</button><button class="minibtn" style="width:auto;margin:0">Đội hình <kbd>V</kbd></button></div>
    <div class="ftrow ftbars"><div class="bar hp"><i style="width:72%"></i><span>Sinh lực 720 / 1000</span></div>
      <div class="bar mp"><i style="width:40%"></i><span>Hồn lực 160 / 400</span></div></div>
    <div class="ftrow" id="ftSk"></div>
    <h3>Biểu tượng trạng thái 24×24 và vật phẩm 32×32 (hồn cốt tô màu niên hạn)</h3>
    <div class="ftrow ftico" id="ftSt"></div>
    <div class="ftrow ftico" id="ftIt"></div>
    <h3>Thẻ võ hồn SR / SSR / UR</h3>
    <div class="cgrid" id="ftCards"></div>
    <div class="btns"><button class="btn primary" onclick="location.search=''">Về màn đăng nhập</button></div>`;
  // Nút hồn kỹ dạng ấn triện: một ô thường, một ô khóa, một ô đang hồi chiêu.
  const sk = card.querySelector("#ftSk")!;
  [["U", "Lam Ngân Tù Lung", "#f2c84b", 0, ""], ["I", "Khóa", "#666", 0, " locked"], ["O", "Hồi chiêu", "#a253e0", 0.6, ""]].forEach(([k, n, c, cd, cls]) => {
    const b = document.createElement("button"); b.className = "sk" + cls;
    b.innerHTML = `<b>${k}</b><span class="ico" style="color:${c}">✦</span><span>${n}</span><div class="cd" style="height:${Number(cd) * 100}%"></div>`;
    sk.appendChild(b);
  });
  const st = card.querySelector("#ftSt")!;
  for (const id of [...STATUS_IDS, ...BUFF_IDS]) {
    const name = id in STATUS ? STATUS[id as keyof typeof STATUS].name : BUFFS[id as keyof typeof BUFFS].name;
    const img = artImg(`status_${id}`, "sti");
    st.insertAdjacentHTML("beforeend", `<span title="${name}">${img || `<em>${name}</em>`}</span>`);
  }
  const it = card.querySelector("#ftIt")!;
  for (const d of ITEMS.filter((x) => !x.vohon && !x.boss)) { const img = artImg(`item_${d.id}`, "ico art") || artImg(`item_${d.kind}`, "ico art"); if (img) it.insertAdjacentHTML("beforeend", `<span title="${d.name}">${img}</span>`); }
  it.insertAdjacentHTML("beforeend", artImg("item_manh_vo_hon", "ico art"));
  TIERS.forEach((t, i) => {
    const s = BONE_SLOTS[i % BONE_SLOTS.length], u = tintedUrl(`item_hon_cot_${s.id}`, ringColor(i));
    if (u) it.insertAdjacentHTML("beforeend", `<span title="Hồn cốt ${s.name} ${t.age}"><img class="ico art" src="${u}" alt=""></span>`);
  });
  const cards = card.querySelector("#ftCards")!;
  const years = (n: number) => TIERS.slice(0, n).map((t) => t.years);
  cards.append(vohonCard(pick("SR"), { level: 12, stars: 1, rings: years(1) }),
    vohonCard(pick("SSR"), { level: 47, stars: 3, rings: [...years(4), 1000], slot: 1, active: true }),
    vohonCard(pick("UR"), { level: 99, stars: MAX_STARS, rings: [...years(5), ...years(5)], slot: 2 }),
    vohonCard(VOHON.find((v) => v.rarity === "UR" && v !== pick("UR"))!, { locked: true, plate: "Chưa mở" }));
}
