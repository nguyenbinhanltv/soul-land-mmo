// Hàm thuần cộng tiến độ nhiệm vụ (GAME_DESIGN mục 5.8, #702): tách khỏi MapRoom.ts, không giữ phòng, không ghi DB. Nguyên văn, không đổi hành vi.
import { questChain, questStatus, questGoalHit, type QuestProgress, type QuestEvent } from "../../../shared/data.ts";

/** Cộng sự kiện `ev` vào bước đang làm (đã nhận) của tiến độ `q`: null = không mục tiêu nào khớp, "ready" = vừa đủ mọi mục tiêu. */
export function questBump(q: QuestProgress, ev: QuestEvent): "hit" | "ready" | null {
  const step = q.accepted ? questChain(q.chain)?.steps[q.step] : undefined; if (!step) return null;
  const was = questStatus(q);
  let hit = false;
  step.goals.forEach((g, i) => {
    if (questGoalHit(g, ev) && (q.prog[i] ?? 0) < g.n) { q.prog[i] = (q.prog[i] ?? 0) + 1; hit = true; }
  });
  return !hit ? null : was !== "ready" && questStatus(q) === "ready" ? "ready" : "hit";
}
