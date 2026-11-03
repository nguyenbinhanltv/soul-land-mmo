// Bảng "Nhiệm Vụ" của rail hub (#1605): nhật ký đủ mọi nhiệm vụ đang có (mỗi chuỗi cố định đang theo dõi một dòng + từng bài khảo hạch hằng ngày
// chưa xong), kèm mô tả, mục tiêu x/N, phần thưởng và nút "Đến". Chỉ hiển thị phía client, đọc đúng dữ liệu của khung theo dõi (hudQuest.ts);
// không có tin server mới, không đổi chuỗi / thưởng. Nhận / trả vẫn ở NPC. Dòng đếm ở đầu bảng = số dòng liệt kê (không đếm bài ẩn).
import { screenFrame, stateBox, addCloseButton } from "./uiParts.ts";
import { questTracked, dailyMsg, onQuestChange, questTarget, questGoBtn, questGoals, questRewardEl } from "./hudQuest.ts";
import { questChain, MAPS, NPCS, DAILY, type QuestStatus, type QuestChain } from "../../shared/data.ts";
import type { NpcGoal } from "./hudNpc.ts";

const el = () => document.getElementById("quests");
let stop: (() => void) | null = null;

export const isQuestOpen = () => { const e = el(); return !!e && !e.hidden; };
export function openQuests() {
  const e = el(); if (!e) return;
  e.hidden = false; stop?.(); stop = onQuestChange(render); render();
  e.querySelector<HTMLElement>(".qj-go, .scr-x")?.focus({ preventScroll: true });
}
export function closeQuests() { const e = el(); if (e) e.hidden = true; stop?.(); stop = null; }

/** Số nhiệm vụ bảng đang liệt kê: chuỗi cố định đang theo dõi + bài khảo hạch hằng ngày chưa xong. Thẻ hub / toast đọc đúng số này. */
export function questCount(): number { return questTracked().length + (dailyMsg?.list.filter((x) => x.status !== "done").length ?? 0); }

const MARK: Record<QuestStatus, string> = { offer: "Chưa nhận", active: "Đang làm", ready: "Chờ trả", done: "Đã xong" };

function row(o: { name: string; sub: string; status: QuestStatus; step?: { goals: any; desc: string; reward: any }; prog: number[] | null; go: NpcGoal | null; hint?: string }) {
  const li = document.createElement("li"); li.className = "qj-row"; li.dataset.status = o.status;
  const hd = document.createElement("div"); hd.className = "qj-hd";
  const b = document.createElement("b"); b.className = "qj-name"; b.textContent = o.name;
  const m = document.createElement("span"); m.className = "qj-mark"; m.textContent = MARK[o.status]; // chữ, không chỉ màu
  hd.append(b, m); li.append(hd);
  const sub = document.createElement("small"); sub.className = "qj-sub"; sub.textContent = o.sub; li.append(sub);
  if (o.hint) { const t = document.createElement("div"); t.className = "qj-hint"; t.textContent = o.hint; li.append(t); }
  if (o.step) {
    if (o.status !== "offer") li.append(questGoals(o.step as any, o.prog));
    const d = document.createElement("small"); d.className = "qj-desc"; d.textContent = o.step.desc; li.append(d);
    li.append(questRewardEl(o.step.reward));
  }
  if (o.go) {
    const g = questGoBtn(o.go);
    if (g) { g.classList.add("qj-go"); g.addEventListener("click", () => closeQuests()); li.append(g); } // đi bộ tới: đóng bảng để thấy đường đi
  }
  return li;
}

function render() {
  const root = el(); if (!root || root.hidden) return;
  const n = questCount();
  const f = screenFrame({ material: "giay", title: "Nhiệm Vụ", badge: "任", info: "Các nhiệm vụ đang có và phần thưởng. Nhận / trả bài ở NPC có dấu trên đầu; nút Đến tự đi bộ tới nơi." });
  const hadFocus = root.contains(document.activeElement);
  if (!n) f.body.append(stateBox({ kind: "empty", text: "Chưa có nhiệm vụ nào đang làm.", hint: "Gặp NPC có dấu ! trên đầu để nhận bài." }));
  else {
    const cnt = document.createElement("p"); cnt.className = "qj-count"; cnt.textContent = `Đang có ${n} nhiệm vụ`; f.body.append(cnt);
    const ol = document.createElement("ol"); ol.className = "qj-list"; ol.setAttribute("aria-label", `${n} nhiệm vụ đang có`);
    for (const q of questTracked()) {
      const c = questChain(q.chain) as QuestChain | undefined, s = c?.steps[q.step]; if (!c || !s) continue;
      const npc = NPCS.find((x) => x.id === c.giver), where = MAPS[c.map]?.name ?? "";
      ol.append(row({ name: s.name, sub: `${c.name} · bài ${q.step + 1}/${c.steps.length}`, status: q.status, step: s, prog: q.prog, go: questTarget(q.chain, q.status, q.step, q.prog),
        hint: q.status === "offer" ? `Gặp ${npc?.name ?? "NPC"} ở ${where} để nhận bài này.` : q.status === "ready" ? `Đã xong: quay về gặp ${npc?.name ?? "NPC"} ở ${where} để nhận thưởng.` : undefined }));
    }
    const dnpc = NPCS.find((x) => x.id === DAILY.giver), dmap = MAPS[DAILY.map]?.name ?? "";
    for (const q of dailyMsg?.list ?? []) {
      if (q.status === "done") continue;
      const s = questChain(q.chain)?.steps[0]; if (!s) continue;
      const home: NpcGoal = { map: DAILY.map, mapName: dmap, npc: DAILY.giver };
      ol.append(row({ name: s.name, sub: `${DAILY.name} (hằng ngày)`, status: q.status, step: s, prog: q.prog, go: q.status === "active" ? questTarget(q.chain, q.status, 0, q.prog) ?? home : home,
        hint: q.status === "offer" ? `Gặp ${dnpc?.name ?? "NPC"} ở ${dmap} để nhận bài này.` : q.status === "ready" ? `Đã xong: gặp ${dnpc?.name ?? "NPC"} ở ${dmap} để nhận thưởng.` : undefined }));
    }
    f.body.append(ol);
  }
  addCloseButton(f.root, closeQuests);
  root.replaceChildren(f.root);
  if (hadFocus) root.querySelector<HTMLElement>(".qj-go, .scr-x")?.focus({ preventScroll: true });
}
