export type NameplateKind = "npc" | "player" | "party" | "pk" | "beast" | "elite" | "king" | "boss";
export interface NameplateRect { id: string; x: number; y: number; width: number; height: number; priority: number; }
export interface NameplateItem extends NameplateRect {
  compactSize?: { width: number; height: number };
  /** Nhãn của chính mình / mục tiêu đang chọn: luôn hiện đủ, đúng chỗ, mờ hay thu gọn đều không áp dụng. */
  pinned?: boolean;
  /** Nhãn của vật đứng yên (NPC, biển địa điểm): được xếp chồng dọc với nhãn đứng yên khác. Thực thể đang chạy thì không bao giờ dời. */
  stationary?: boolean;
  /** Nhãn có bảng danh hiệu (khung nền rộng hơn chữ): che nhãn mờ nằm dưới nó. */
  plated?: boolean;
}
/** Mức hiện của một nhãn: 0 đủ dòng, 1 thu gọn, 2 thu gọn và mờ. `want` / `since`: mức đang chờ đủ trễ mới đổi (chống nhấp nháy). */
export type NameplateLevel = 0 | 1 | 2;
export interface NameplateSlot { level: NameplateLevel; up: number; want?: NameplateLevel; since?: number }
export interface NameplatePlacement extends NameplateRect { visible: boolean; compact: boolean; alpha: number; slot?: NameplateSlot; }
export interface NameplateLayoutOptions {
  gap?: number; maxVisible?: number; maxOffset?: number;
  /** Mức của khung trước (từ `placement.slot`). */
  prev?: ReadonlyMap<string, NameplateSlot>; now?: number;
  /** Bị đè liên tục chưa tới `settle` ms (mặc định 200) thì giữ mức cũ: người / thú đi ngang thoáng qua không làm nhãn đổi dạng. */
  settle?: number;
  /** Hết bị đè liên tục `hold` ms (mặc định 450) mới trả lại mức rõ hơn. */
  hold?: number;
}
/** Độ đậm nhãn bị đè (mức 2); nằm dưới nhãn ghim / bảng danh hiệu thì ẩn hẳn (0). */
export const NAMEPLATE_FADED_ALPHA = 0.35;
export interface NameplateAppearance { color: string; stroke: string; fontSize: number; compactFontSize: number; }

const APPEARANCE: Record<NameplateKind, NameplateAppearance> = {
  npc: { color: "#f2c84b", stroke: "#20170a", fontSize: 7, compactFontSize: 6 },
  player: { color: "#fff2d0", stroke: "#111", fontSize: 7, compactFontSize: 6 },
  party: { color: "#7dff8a", stroke: "#09210e", fontSize: 7, compactFontSize: 6 },
  pk: { color: "#ff766a", stroke: "#2b0909", fontSize: 7, compactFontSize: 6 },
  beast: { color: "#e9e1d0", stroke: "#17120e", fontSize: 6, compactFontSize: 5 },
  elite: { color: "#ffc24a", stroke: "#2e1700", fontSize: 7, compactFontSize: 6 },
  king: { color: "#c58cff", stroke: "#1a082e", fontSize: 8, compactFontSize: 7 },
  boss: { color: "#ff7168", stroke: "#310707", fontSize: 9, compactFontSize: 7 },
};
export const nameplateAppearance = (kind: NameplateKind): NameplateAppearance => ({ ...APPEARANCE[kind] });

/** Dòng từ dưới lên; kích thước đã gồm viền chữ, padding và tỉ lệ vẽ. */
export function measureNameplate(lines: readonly { width: number; height: number }[], gap = 2) {
  let height = 0, width = 0;
  const offsets = lines.map((line) => {
    const offset = height;
    width = Math.max(width, line.width);
    height += line.height + gap;
    return offset;
  });
  return { width, height: Math.max(0, height - gap), offsets };
}

export function nameplatesOverlap(a: NameplateRect, b: NameplateRect, gap = 0) {
  return Math.abs(a.x - b.x) < (a.width + b.width) / 2 + gap && Math.abs(a.y - b.y) < (a.height + b.height) / 2 + gap;
}

/**
 * Đặt nhãn LUÔN đúng chỗ gốc trên đầu chủ của nó (không dời ngang, không né thân, không nhấc cao theo bề rộng chữ), nên nhãn chạy theo chủ
 * mỗi khung. Hai nhãn đè nhau thì nhãn ưu tiên thấp hơn thu gọn rồi mờ (`NAMEPLATE_FADED_ALPHA`), có trễ `settle` / `hold` để không nhấp nháy;
 * nhãn mờ không cản nhãn khác. Nhãn `pinned` không bao giờ đổi. Riêng nhãn `stationary` được nhấc dọc khi đè nhãn đứng yên khác (ô cố định,
 * không đổi theo chuyển động). Quá `maxVisible` thì ẩn nhãn ưu tiên thấp (nhãn `pinned` không bao giờ bị ẩn).
 */
export function layoutNameplates(items: readonly NameplateItem[], options: NameplateLayoutOptions = {}): NameplatePlacement[] {
  const gap = options.gap ?? 3, maxVisible = options.maxVisible ?? 18, maxOffset = options.maxOffset ?? 96;
  const now = options.now ?? 0, hold = options.hold ?? 450, settle = options.settle ?? 200;
  type Placed = NameplatePlacement & { stationary?: boolean; cover?: boolean };
  const placed: Placed[] = [];
  let count = 0;
  const order = [...items].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.priority - a.priority || a.id.localeCompare(b.id));
  for (const item of order) {
    if (!item.pinned && count >= maxVisible) { placed.push({ ...item, visible: false, compact: true, alpha: 0 }); continue; }
    count++;
    const compact = item.compactSize ? { ...item, ...item.compactSize } : item;
    const blockers = placed.filter((o) => o.visible && o.alpha === 1);
    const clear = (c: NameplateRect, only?: (o: Placed) => boolean) =>
      !blockers.some((o) => (!only || only(o)) && nameplatesOverlap(c, o, gap));
    const bottom = item.y + item.height / 2;
    const rise = (size: NameplateRect, up: number): NameplateRect => ({ ...size, x: item.x, y: bottom - size.height / 2 - up });
    if (item.pinned) {
      placed.push({ ...item, visible: true, compact: false, alpha: 1, slot: { level: 0, up: 0 }, cover: true });
      continue;
    }
    // Vật đứng yên: chồng dọc với nhãn đứng yên khác (vị trí cố định nên ô nhấc không nhảy).
    let up = 0;
    if (item.stationary) {
      const still = (o: { stationary?: boolean }) => !!o.stationary;
      while (up <= maxOffset && !clear(rise(item, up), still)) up += Math.max(12, item.height + gap);
      if (up > maxOffset) up = 0;
    }
    const wantLevel: NameplateLevel = clear(rise(item, up)) ? 0 : clear(rise(compact, up)) ? 1 : 2;
    const prev = options.prev?.get(item.id);
    let level = wantLevel, want: NameplateLevel | undefined, since: number | undefined;
    if (prev && prev.level !== wantLevel) {
      since = prev.want === wantLevel ? prev.since ?? now : now;
      if (now - since < (wantLevel > prev.level ? settle : hold)) { level = prev.level; want = wantLevel; } else since = undefined;
    }
    const size = level === 0 ? item : compact, rect = rise(size, up);
    // Nhãn mờ nằm dưới nhãn ghim / bảng danh hiệu (khung nền rộng hơn chữ, nên đo thêm lề) thì ẩn hẳn, không lộ lơ lửng sau bảng.
    const hidden = level === 2 && blockers.some((o) => o.cover && nameplatesOverlap(rect, o, gap * 3));
    placed.push({ ...rect, id: item.id, priority: item.priority, visible: true, compact: level > 0, alpha: level < 2 ? 1 : hidden ? 0 : NAMEPLATE_FADED_ALPHA,
      slot: { level, up, ...(want !== undefined ? { want, since } : {}) }, stationary: item.stationary, cover: !!item.plated && level < 2 });
  }
  return placed.map(({ stationary: _s, cover: _c, ...p }) => p);
}

/** Làm mượt bước đổi ô: vị trí vẽ đuổi theo ô đích kiểu mũ (xong ~95% sau 3·tau ≈ 135 ms), không phụ thuộc nhịp khung. Chưa có `from` (nhãn mới) thì hiện ngay đúng chỗ. */
export const easeNameplate = (from: number | undefined, to: number, dtMs: number, tau = 45) =>
  from === undefined || Math.abs(to - from) < 0.25 ? to : to + (from - to) * Math.exp(-Math.max(0, dtMs) / tau);

export const nameplatePriority = (selected: boolean, party: boolean, self: boolean, rank = 0) =>
  selected ? 120 : party ? 110 : self ? 100 : rank >= 2 ? 70 : rank === 1 ? 50 : 20;

export function playerNameplateKind(id: string, self: string, party: boolean, sides: readonly string[] = []): NameplateKind {
  const own = sides.find((side) => side.split(",").includes(self));
  if (own && !own.split(",").includes(id)) return "pk";
  return party || (id !== self && !!own?.split(",").includes(id)) ? "party" : "player";
}

/** Gộp mọi bài của NPC: trả bài trước nhận bài, rồi bài đang làm. */
export function resolveQuestMarker(statuses: readonly string[]) {
  const status = ["ready", "offer", "active"].find((s) => statuses.includes(s));
  return status ? { status, symbol: status === "offer" ? "!" : "?", color: status === "active" ? "#c7c7c7" : "#ffe477" } : null;
}
