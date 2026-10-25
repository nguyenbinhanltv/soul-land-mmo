export type NameplateLine = "faction" | "name" | "title" | "action" | "quest";
export type NameplateKind = "npc" | "player" | "party" | "pk" | "beast" | "elite" | "king" | "boss";
export interface NameplateRect { id: string; x: number; y: number; width: number; height: number; priority: number; }
export interface NameplatePlacement extends NameplateRect { visible: boolean; compact: boolean; }
export interface NameplateLayoutOptions { gap?: number; maxVisible?: number; maxOffset?: number; }
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

export function stackNameplate(lines: readonly NameplateLine[], gap = 8): Record<NameplateLine, number> {
  return Object.fromEntries(lines.map((line, i) => [line, i * gap])) as Record<NameplateLine, number>;
}

function overlaps(a: NameplateRect, b: NameplateRect, gap: number) {
  return Math.abs(a.x - b.x) < (a.width + b.width) / 2 + gap && Math.abs(a.y - b.y) < (a.height + b.height) / 2 + gap;
}

/** Xếp các khung nhãn thật, ưu tiên mục tiêu / tổ đội rồi mới tới nhãn thường. */
export function layoutNameplates(items: readonly NameplateRect[], options: NameplateLayoutOptions = {}): NameplatePlacement[] {
  const gap = options.gap ?? 3, maxVisible = options.maxVisible ?? 28, maxOffset = options.maxOffset ?? 72;
  const placed: NameplatePlacement[] = [];
  for (const item of [...items].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))) {
    if (placed.filter((x) => x.visible).length >= maxVisible && item.priority < 80) { placed.push({ ...item, visible: false, compact: true }); continue; }
    const compact = { ...item, width: item.width * 0.72, height: item.height * 0.75 };
    const candidates = [0, ...Array.from({ length: Math.floor(maxOffset / Math.max(item.height, 1)) }, (_, i) => (i + 1) * item.height * (i % 2 ? -1 : 1))];
    let picked: NameplateRect | undefined, isCompact = false;
    for (const [size, compacted] of [[item, false], [compact, true]] as const) {
      for (const offset of candidates) {
        const candidate = { ...size, y: item.y + offset };
        if (!placed.some((other) => other.visible && overlaps(candidate, other, gap))) { picked = candidate; isCompact = compacted; break; }
      }
      if (picked) break;
    }
    placed.push(picked ? { ...picked, visible: true, compact: isCompact } : { ...item, visible: item.priority >= 80, compact: true });
  }
  return placed;
}
