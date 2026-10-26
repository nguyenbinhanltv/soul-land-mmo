export type NameplateKind = "npc" | "player" | "party" | "pk" | "beast" | "elite" | "king" | "boss";
export interface NameplateRect { id: string; x: number; y: number; width: number; height: number; priority: number; }
export interface NameplateItem extends NameplateRect { compactSize?: { width: number; height: number }; }
/** Chỗ đã chọn của một nhãn: lệch ngang `dx`, nhấc lên `up` so với chỗ gốc trên đầu; `want` / `wantSince`: chỗ tốt hơn đang chờ đủ `hold` ms. */
export interface NameplateSlot { dx: number; up: number; compact: boolean; want?: string; wantSince?: number }
export interface NameplatePlacement extends NameplateRect { visible: boolean; compact: boolean; slot?: NameplateSlot; }
export interface NameplateLayoutOptions {
  gap?: number; maxVisible?: number; maxOffset?: number;
  viewport?: { x: number; y: number; width: number; height: number };
  obstacles?: readonly NameplateRect[];
  /** Chỗ khung trước (từ `placement.slot`): còn hợp lệ thì giữ, chỉ đổi sang chỗ tốt hơn khi nó trống liên tục `hold` ms (mặc định 450). */
  prev?: ReadonlyMap<string, NameplateSlot>; now?: number; hold?: number;
}
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

const slotKey = (dx: number, up: number, compact: boolean) => `${Math.round(dx)}|${Math.round(up)}|${compact ? 1 : 0}`;

/**
 * Xếp khung chữ thật lên trên đầu, không đè nhãn đã nhận hoặc thân nhân vật; hết chỗ thì ẩn.
 * Có `prev` thì nhãn giữ chỗ cũ (tính theo độ lệch so với đầu, nên đi theo thân) khi chỗ đó còn hợp lệ: người đi ngang nhau không làm
 * nhãn đổi chỗ qua lại mỗi khung; bị đè thật thì đổi ngay, còn quay về chỗ gốc chỉ sau khi chỗ gốc trống đủ `hold`.
 */
export function layoutNameplates(items: readonly NameplateItem[], options: NameplateLayoutOptions = {}): NameplatePlacement[] {
  const gap = options.gap ?? 3, maxVisible = options.maxVisible ?? 18, maxOffset = options.maxOffset ?? 96;
  const now = options.now ?? 0, hold = options.hold ?? 450, v = options.viewport;
  const placed: NameplatePlacement[] = [];
  let count = 0;
  for (const item of [...items].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))) {
    if (count >= maxVisible) { placed.push({ ...item, visible: false, compact: true }); continue; }
    const compact = item.compactSize ? { ...item, ...item.compactSize } : item;
    const sizes = items.length > maxVisible ? [[compact, true]] as const : [[item, false], [compact, true]] as const;
    const bottom = item.y + item.height / 2;
    const free = (c: NameplateRect) =>
      !(v && (c.x - c.width / 2 < v.x || c.x + c.width / 2 > v.x + v.width || c.y - c.height / 2 < v.y || c.y + c.height / 2 > v.y + v.height))
      && !placed.some((other) => other.visible && nameplatesOverlap(c, other, gap))
      && !options.obstacles?.some((other) => nameplatesOverlap(c, other, gap));
    const at = (size: NameplateRect, dx: number, up: number): NameplateRect => ({ ...size, x: item.x + dx, y: bottom - size.height / 2 - up });
    let best: { rect: NameplateRect; slot: NameplateSlot } | undefined;
    for (const [size, compacted] of sizes) {
      for (let up = 0; up <= maxOffset && !best; up += Math.max(12, size.height + gap)) {
        for (const dx of [0, -(size.width + gap), size.width + gap]) {
          const rect = at(size, dx, up);
          if (free(rect)) { best = { rect, slot: { dx, up, compact: compacted } }; break; }
        }
      }
      if (best) break;
    }
    let pick = best;
    const prev = options.prev?.get(item.id);
    const prevSize = prev && sizes.find(([, c]) => c === prev.compact)?.[0];
    if (best && prev && prevSize && slotKey(prev.dx, prev.up, prev.compact) !== slotKey(best.slot.dx, best.slot.up, best.slot.compact)) {
      const rect = at(prevSize, prev.dx, prev.up);
      if (free(rect)) {
        const want = slotKey(best.slot.dx, best.slot.up, best.slot.compact), since = prev.want === want ? prev.wantSince ?? now : now;
        if (now - since < hold) pick = { rect, slot: { dx: prev.dx, up: prev.up, compact: prev.compact, want, wantSince: since } };
      }
    }
    placed.push(pick ? { ...pick.rect, id: item.id, priority: item.priority, visible: true, compact: pick.slot.compact, slot: pick.slot } : { ...item, visible: false, compact: true });
    if (pick) count++;
  }
  return placed;
}

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
