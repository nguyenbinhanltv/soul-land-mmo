import { assetUrl } from "./assetUrl.ts";

export type CursorKind = "default" | "attack" | "talk" | "pickup" | "blocked";
export interface CursorHint {
  enabled: boolean; native?: boolean; npc?: boolean; beast?: boolean; drop?: boolean; loot?: boolean; blocked?: boolean;
}
const FALLBACK: Record<CursorKind, string> = { default: "default", attack: "crosshair", talk: "pointer", pickup: "pointer", blocked: "not-allowed" };

/** Chọn hình từ dữ liệu hiển thị; không chọn mục tiêu hoặc gửi hành động. */
export function resolveCursor(hint: CursorHint): CursorKind | "native" {
  if (!hint.enabled) return "default";
  if (hint.npc) return "talk";
  if (hint.native) return "native";
  if (hint.beast) return "attack";
  if (hint.loot) return "pickup";
  if (hint.drop) return "default";
  return hint.blocked ? "blocked" : "default";
}

/** Gợi ý quyền nhặt theo state đã nhận; thiếu trường thì không suy đoán quyền server. */
export function pickupHintAllowed(drop: { owner?: string; ownerTtl?: number; party?: number }, me: string, party: number) {
  if (typeof drop.owner !== "string" || !Number.isFinite(drop.party) || !Number.isFinite(drop.ownerTtl)) return false;
  return !drop.owner || drop.owner === me || drop.ownerTtl! <= 0 || (!!drop.party && drop.party === party);
}

/** Cursor 32/64 cùng cỡ logic và hotspot (2,2); luôn có PNG32 + keyword dự phòng. */
export function cursorStyle(kind: CursorKind, base: string, highDpi: boolean) {
  const url = (size: number) => new URL(assetUrl(`sprites/iso/ui/cursor_${kind}_${size}.png`), base).href;
  const small = `url("${url(32)}")`;
  return `${highDpi ? `image-set(${small} 1x, url("${url(64)}") 2x) 2 2, ` : ""}${small} 2 2, ${FALLBACK[kind]}`;
}

/** CSS chỉ thuộc canvas; clear khi touch, overlay, blur, rời canvas hoặc shutdown. */
export class ContextCursor {
  private mouse = false;
  private destroyed = false;
  private ownsStyle = false;
  private wanted = "";
  private applied = "";
  private x = 0;
  private y = 0;
  private previous: string;
  private priority: string;
  private styles: Record<CursorKind, string>;
  private doc: Document;
  private canvas: HTMLCanvasElement;
  private move = (e: PointerEvent) => {
    this.mouse = e.pointerType === "mouse";
    this.x = e.clientX; this.y = e.clientY;
    if (!this.mouse) this.clear();
  };
  private leave = () => { this.mouse = false; this.clear(); };
  private visibility = () => { if (this.doc.visibilityState !== "visible") this.leave(); };
  private touch = (e: PointerEvent) => { if (e.pointerType !== "mouse") this.leave(); };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.doc = canvas.ownerDocument;
    this.previous = canvas.style.getPropertyValue("cursor");
    this.priority = canvas.style.getPropertyPriority("cursor");
    const highDpi = this.doc.defaultView?.CSS?.supports("cursor", 'image-set(url("x.png") 1x, url("y.png") 2x) 2 2, default') ?? false;
    this.styles = Object.fromEntries(Object.keys(FALLBACK).map((k) => [k, cursorStyle(k as CursorKind, this.doc.baseURI, highDpi)])) as Record<CursorKind, string>;
    canvas.addEventListener("pointermove", this.move);
    canvas.addEventListener("pointerleave", this.leave);
    this.doc.defaultView?.addEventListener("blur", this.leave);
    this.doc.addEventListener("visibilitychange", this.visibility);
    this.doc.addEventListener("pointerdown", this.touch, true);
  }

  get active() {
    return !this.destroyed && this.mouse && this.doc.visibilityState === "visible" && this.doc.elementFromPoint(this.x, this.y) === this.canvas;
  }

  show(kind: CursorKind | "native") {
    if (!this.active) { this.clear(); return; }
    const style = kind === "native" ? "pointer" : this.styles[kind];
    if (this.wanted !== style || this.canvas.style.getPropertyValue("cursor") !== this.applied) {
      this.canvas.style.setProperty("cursor", style);
      this.wanted = style; this.applied = this.canvas.style.getPropertyValue("cursor");
    }
    this.ownsStyle = true;
  }

  clear() {
    if (!this.ownsStyle) return;
    if (this.previous) this.canvas.style.setProperty("cursor", this.previous, this.priority);
    else this.canvas.style.removeProperty("cursor");
    this.ownsStyle = false;
    this.wanted = ""; this.applied = "";
  }

  destroy() {
    this.leave(); this.destroyed = true;
    this.canvas.removeEventListener("pointermove", this.move);
    this.canvas.removeEventListener("pointerleave", this.leave);
    this.doc.defaultView?.removeEventListener("blur", this.leave);
    this.doc.removeEventListener("visibilitychange", this.visibility);
    this.doc.removeEventListener("pointerdown", this.touch, true);
  }
}
