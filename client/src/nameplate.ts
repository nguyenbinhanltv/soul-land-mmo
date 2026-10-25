export type NameplateLine = "faction" | "name" | "title" | "action" | "quest";

/** Trả về độ lệch lên theo thứ tự dòng, tính từ dòng thấp nhất. */
export function stackNameplate(lines: readonly NameplateLine[], gap = 8): Record<NameplateLine, number> {
  return Object.fromEntries(lines.map((line, i) => [line, i * gap])) as Record<NameplateLine, number>;
}
