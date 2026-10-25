// Thứ tự ưu tiên các lệnh điều khiển (M5 #751, docs/design/giao-dien.md mục 5.16 "Điều khiển"). Hàm thuần dùng chung: client phân xử trước khi
// bật một lệnh (GameScene), kiểm thử ở server/scripts/control-test.ts. Server vẫn là bên giữ khoá mục tiêu và tự săn; ở đây chỉ là luật.

/** Nguồn lệnh lái nhân vật, ưu tiên giảm dần: phím / cần điều khiển > bấm nền > khoá mục tiêu > cờ tự đi > tự săn. */
export type Cmd = "keys" | "click" | "lock" | "flag" | "hunt";
export const CMD_ORDER: readonly Cmd[] = ["keys", "click", "lock", "flag", "hunt"];
/** Tên lệnh trong câu báo lý do ("Đã huỷ <tên>: …"). */
export const CMD_NAME: Record<Cmd, string> = { keys: "đi bằng phím", click: "bấm đi", lock: "khoá mục tiêu", flag: "tự đi cờ", hunt: "tự săn" };
/** Hành động của người chơi dẫn tới lệnh đó ("… vì bạn <hành động>"). */
const CMD_BY: Record<Cmd, string> = { keys: "bạn đi bằng phím / cần điều khiển", click: "bạn bấm đi chỗ khác", lock: "bạn khoá mục tiêu", flag: "bạn bật tự đi cờ", hunt: "bạn bật tự săn" };

const rank = (c: Cmd) => CMD_ORDER.indexOf(c);

/** Lệnh `n` bắt đầu khi `active` đang chạy: `cancel` các lệnh nó thắng; `deny` = lệnh ưu tiên cao đang chạy chặn nó (n không được bật). */
export interface Start { cancel: Cmd[]; deny?: Cmd }

/**
 * Phím / cần điều khiển và thao tác bấm (bấm nền, bấm hồn thú) là ý định trực tiếp của tay nên luôn thắng mọi lệnh khác (bấm nền và khoá
 * thay nhau). Cờ tự đi và tự săn là lệnh nền: chỉ thắng lệnh nền thấp hơn, gặp lệnh cao hơn đang chạy thì không bật được.
 */
export function startCmd(active: readonly Cmd[], n: Cmd): Start {
  const others = active.filter((c) => c !== n);
  if (rank(n) <= rank("lock")) return { cancel: others };
  const blocker = others.filter((c) => rank(c) < rank(n)).sort((a, b) => rank(a) - rank(b))[0];
  if (blocker) return { cancel: [], deny: blocker };
  return { cancel: others };
}

/** Lệnh đang lái (ưu tiên cao nhất trong `active`), null nếu không có. */
export const topCmd = (active: readonly Cmd[]): Cmd | null => [...active].sort((a, b) => rank(a) - rank(b))[0] ?? null;

/** Câu báo lệnh `stopped` bị huỷ do lệnh `by` thắng. */
export const stoppedText = (stopped: Cmd, by: Cmd) => `Đã huỷ ${CMD_NAME[stopped]}: ${CMD_BY[by]}.`;

/** Câu báo lệnh `n` không bật được vì `blocker` đang chạy (kèm cách gỡ). */
export const deniedText = (n: Cmd, blocker: Cmd) =>
  `Chưa ${n === "flag" ? "tự đi cờ" : "tự săn"} được: đang ${CMD_NAME[blocker]} (ưu tiên hơn). Bấm × để huỷ rồi thử lại.`;
