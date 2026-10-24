// G3 (#394): cảnh hồn kỹ lớn (vòng 7+ / Võ Hồn Chân Thân): tối màn, chân dung võ hồn trượt ngang, tên chiêu chữ lớn.
// Chỉ hiển thị ở client (lớp HTML trên canvas, không chặn chuột); thời lượng ở đây là độ dài hiệu ứng, KHÔNG phải số cân bằng.
import { fxPrefs } from "./combatFx.ts";
import { artUrl } from "./uiArt.ts";

/** Chân dung trượt ngang (~0,6 s), cả cảnh tồn tại chừng này ms. */
const SLIDE_MS = 600, TOTAL_MS = 1250;
/** Người dùng chiêu ở xa hơn thế (pixel thế giới) thì mức Vừa không hiện (mức Cao hiện cho mọi người đang được đồng bộ). */
export const CINE_NEAR = 220;

/** Có nên hiện cảnh này cho người xem hay không: Thấp / tùy chọn tắt → không; Vừa → người dùng chiêu và người ở gần; Cao → mọi người. */
export function cineAllowed(mine: boolean, dist: number): boolean {
  if (!fxPrefs.cine || fxPrefs.level === "low") return false;
  return mine || fxPrefs.level === "high" || dist < CINE_NEAR;
}

export class SkillCine {
  private root: HTMLDivElement | null = null;
  private timer = 0;
  /** `vohonId`: mã võ hồn (chân dung `portrait_<mã>`); `col`: màu niên hạn của vòng. */
  show(vohonId: string, name: string, col: string, mine: boolean, noPic = false) {
    this.clear();
    const calm = fxPrefs.reduce, src = artUrl(`portrait_${vohonId}`);
    const el = document.createElement("div");
    el.className = `skcine${calm ? " calm" : ""}${mine ? " mine" : ""}`;
    el.style.setProperty("--col", col); el.style.setProperty("--slide", `${SLIDE_MS}ms`); el.style.setProperty("--total", `${TOTAL_MS}ms`);
    el.setAttribute("aria-hidden", "true");
    // Giảm chuyển động: không tối màn, không trượt; chỉ tên chiêu mờ vào rồi ra.
    el.innerHTML = `${calm ? "" : `<i class="skdim"></i>`}${calm || noPic || !src ? "" : `<img class="skpic" src="${src}" alt="">`}<b class="skname"></b>`;
    (el.querySelector(".skname") as HTMLElement).textContent = name;
    document.body.appendChild(el);
    this.root = el;
    this.timer = window.setTimeout(() => this.clear(), TOTAL_MS + 100);
  }
  clear() { window.clearTimeout(this.timer); this.root?.remove(); this.root = null; }
  destroy() { this.clear(); }
}
