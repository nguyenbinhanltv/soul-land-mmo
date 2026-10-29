// UI v2, màn Xếp Hạng (docs/design/xep-hang.md "Giao diện", Part of #877). Chỉ hiển thị tin riêng `rank {k:"boards"}` / `rankTop` của server (#1201) và
// gửi ý định `rank {op, board, page}`; điểm, hạng, đội hình đều do server suy ra.
import { TONG_MON, VOHON, RANK_CD, RANK_PAGE_SIZE } from "../../shared/data.ts";
import { abbrevNumber, screenFrame, mount, addCloseButton, type PNode } from "./uiParts.ts";
import { hhmmVn } from "./svClock.ts";

export interface RankBoardInfo { board: string; group: string; name: string; period: number }
export interface RankSlot { vohon: string; level: number; stars: number }
export interface RankRow { rank: number; name: string; score: number; tong?: string; lineup?: RankSlot[]; me?: boolean }
export interface RankTopMsg { board: string; period: number; page: number; pageSize: number; total: number; hasNext: boolean; asOf: number; rows: RankRow[]; me: { rank: number; score: number; at?: number } | null }
export type RankStatus = "loading" | "ready" | "error";

/** Nhóm hạng mục theo thứ tự xuất hiện (tầng 1 của điều hướng). */
export function rankGroups(boards: RankBoardInfo[]): { group: string; boards: RankBoardInfo[] }[] {
  const out: { group: string; boards: RankBoardInfo[] }[] = [];
  for (const b of boards) { const g = out.find((x) => x.group === b.group); if (g) g.boards.push(b); else out.push({ group: b.group, boards: [b] }); }
  return out;
}

/** Bục top 3 theo thứ tự trái → giữa → phải = hạng 2, 1, 3; chỉ ở trang 1 (các trang sau chỉ có bảng). */
export function podiumOf(page: number, rows: RankRow[]): RankRow[] {
  if (page !== 1) return [];
  return [2, 1, 3].flatMap((r) => rows.filter((x) => x.rank === r));
}

/** Đội hình công khai: "Tên Lv.cấp ★sao" mỗi ô; mã lạ thì hiện mã (không bỏ im lặng). */
export function lineupText(l: RankSlot[] | undefined): string[] {
  return (l ?? []).map((s) => `${VOHON.find((v) => v.id === s.vohon)?.name ?? s.vohon} Lv.${s.level} ★${s.stars}`);
}
export const tongName = (id: string | undefined) => (id ? TONG_MON.find((t) => t.id === id)?.name ?? "" : "");
const fullNum = (n: number) => n.toLocaleString("vi-VN");

/** Thẻ nhỏ công khai của một dòng (docs/design/xep-hang.md "Nhấn một dòng"): chỉ tên, hạng, điểm, tông, đội hình; không túi / chỉ số. Chính mình thì không có nút Kết bạn. */
export function playerCard(r: RankRow, boardName: string) {
  return { title: r.name, rank: `Hạng ${fullNum(r.rank)} · ${boardName}`, score: `Điểm ${fullNum(r.score)}`, tong: tongName(r.tong), lineup: lineupText(r.lineup), canFriend: !r.me };
}

/** Dòng "của tôi" ghim đáy: có hạng thì hiện hạng thật + điểm, chưa có thì "Chưa có hạng" kèm cách lên hạng. */
export function meLine(me: RankTopMsg["me"], boardName: string): { text: string; title: string; ranked: boolean } {
  if (!me) return { text: "Chưa có hạng", title: `Chưa có hạng ở bảng ${boardName}: chơi và lưu tiến trình, hạng cập nhật ở lần lưu kế tiếp.`, ranked: false };
  return { text: `Hạng ${fullNum(me.rank)} · ${abbrevNumber(me.score)}`, title: `Điểm ${fullNum(me.score)}`, ranked: true };
}

/** Nhãn trang "Trang x/y" (tổng số dòng `total`, cỡ trang `pageSize`; tối thiểu 1 trang). */
export const pageLabel = (page: number, total: number, pageSize: number) => `Trang ${page}/${Math.max(1, Math.ceil(total / Math.max(1, pageSize)))}`;

// ---- phần DOM ----
let send: ((type: string, payload: unknown) => void) | null = null;
let boards: RankBoardInfo[] = [];
let cur: string | null = null, page = 1, status: RankStatus = "loading";
let data: RankTopMsg | null = null; // dữ liệu đang hiện: giữ khi lỗi để không xoá trống
let sentAt = 0, timer = 0, cdTimer = 0;
let selRank: number | null = null; // hạng của dòng đang mở thẻ nhỏ (đổi bảng / trang thì bỏ)
const befriended = new Set<string>(); // tên đã bấm Kết bạn ở phiên này: nút đổi thành "Đã gửi" (kết quả thật do server báo ở khung chat)
const LOAD_TIMEOUT_MS = 6000;
/** Số ms còn phải chờ trước khi gửi tin `rank` kế (server bỏ im tin đến sớm hơn RANK_CD giây kể từ tin trước). */
export const sendDelay = (lastSentAt: number, now: number, cdSecs: number = RANK_CD) => Math.max(0, lastSentAt + cdSecs * 1000 + 50 - now);
let sendTimer = 0;
const el = () => document.getElementById("rank");

export function bindRank(sender: (type: string, payload: unknown) => void) { send = sender; }
export const isRankOpen = () => { const e = el(); return !!e && !e.hidden; };

/** Gửi tin `rank` (hạng mục `boards` khi chưa có danh mục, không thì `top`) sau khi hết nhịp RANK_CD; bấm dồn chỉ gửi yêu cầu cuối. */
function request() {
  if (!send) return;
  status = "loading"; selRank = null;
  window.clearTimeout(sendTimer); window.clearTimeout(timer);
  const fire = () => { // đọc `cur` / `page` mới nhất lúc gửi
    if (!send) return;
    if (!boards.length) send("rank", { op: "boards" });
    else if (cur) send("rank", { op: "top", board: cur, page, pageSize: RANK_PAGE_SIZE });
    else return;
    sentAt = Date.now();
    timer = window.setTimeout(() => { if (status === "loading") { status = "error"; render(); } }, LOAD_TIMEOUT_MS); // đếm từ lúc thật sự gửi
  };
  const wait = sendDelay(sentAt, Date.now());
  if (wait > 0) sendTimer = window.setTimeout(fire, wait); else fire();
  render();
}

export function openRank() {
  const e = el(); if (!e || !send) return;
  e.hidden = false; request();
}
export function closeRank() { selRank = null; const e = el(); if (e) e.hidden = true; window.clearTimeout(timer); window.clearTimeout(cdTimer); window.clearTimeout(sendTimer); }

export function onRankBoards(m: { k?: string; list?: RankBoardInfo[] }) {
  if (m?.k !== "boards" || !Array.isArray(m.list)) return;
  boards = m.list; cur = cur && boards.some((b) => b.board === cur) ? cur : boards[0]?.board ?? null; page = 1;
  if (isRankOpen()) request(); // `boards` và `top` cùng nhịp RANK_CD: request() tự chờ hết nhịp rồi gửi trang đầu
}
export function onRankTop(m: RankTopMsg) {
  if (!m || typeof m.board !== "string" || !Array.isArray(m.rows)) return;
  if (m.board !== cur || m.page !== page) return; // tin của bảng / trang đã bỏ
  data = m; status = "ready"; window.clearTimeout(timer); render();
}

const h = (tag: string, cls: string, o: { text?: string; attrs?: Record<string, string>; kids?: (PNode | null)[] } = {}): PNode =>
  ({ tag, cls, ...(o.attrs ? { attrs: o.attrs } : {}), ...(o.text !== undefined ? { text: o.text } : {}), ...(o.kids ? { kids: o.kids.filter((k): k is PNode => !!k) } : {}) });

function podiumNode(rows: RankRow[]): PNode {
  return h("div", "rk-podium", { kids: rows.map((r) => h("div", `rk-pod rk-pod-${r.rank}`, { attrs: { "aria-label": `Hạng ${r.rank}: ${r.name}` }, kids: [
    h("span", "rk-pod-n", { text: r.rank === 1 ? "◆ 1" : String(r.rank) }), // vương miện + số: phân biệt bằng dạng, không chỉ màu
    h("span", "rk-pod-name", { text: r.name }),
    h("span", "rk-pod-score", { text: abbrevNumber(r.score), attrs: { title: fullNum(r.score) } }),
    r.tong ? h("span", "rk-pod-tong", { text: tongName(r.tong) }) : null,
  ] })) });
}
function rowNode(r: RankRow): PNode {
  return h("tr", `rk-row${r.me ? " rk-me" : ""}`, { kids: [
    h("td", "rk-c-rank", { kids: [h("span", "rk-medal", { text: String(r.rank) })] }),
    h("td", "rk-c-name", { kids: [h("button", "rk-who", { text: r.name + (r.me ? " (bạn)" : ""), attrs: { type: "button", "data-rk": String(r.rank), "aria-label": `Xem thẻ ${r.name}`, ...(r.tong ? { title: tongName(r.tong) } : {}) } })] }),
    h("td", "rk-c-score", { text: abbrevNumber(r.score), attrs: { title: fullNum(r.score) } }),
    h("td", "rk-c-line", { kids: lineupText(r.lineup).map((t) => h("span", "rk-slot", { text: t })) }),
  ] });
}

function render() {
  const root = el(); if (!root || root.hidden) return;
  const groups = rankGroups(boards), board = boards.find((b) => b.board === cur), grp = board?.group ?? groups[0]?.group;
  const cd = Math.max(0, sentAt + RANK_CD * 1000 - Date.now());
  const f = screenFrame({
    material: "muc", title: "Xếp Hạng", badge: "榜", info: "Điểm do máy chủ tính từ dữ liệu đã lưu; hạng cập nhật ở các lần lưu, không theo từng giây.",
    nav: groups.map((g) => ({ id: g.group, label: g.group, active: g.group === grp })),
    primary: { label: "Làm mới", disabled: cd > 0 || status === "loading", reason: status === "loading" ? "Đang tải…" : cd > 0 ? "Chờ một chút rồi làm mới" : undefined },
    onNav: (g) => { const first = groups.find((x) => x.group === g)?.boards[0]; if (first) { cur = first.board; page = 1; data = null; request(); } },
    onPrimary: () => request(),
  });
  window.clearTimeout(cdTimer);
  if (cd > 0) cdTimer = window.setTimeout(render, cd + 20);
  const body: PNode[] = [];
  // tầng 2: chip hạng mục của nhóm
  body.push(h("div", "rk-chips", { attrs: { role: "tablist", "aria-label": "Hạng mục" }, kids: (groups.find((g) => g.group === grp)?.boards ?? []).map((b) => h("button", `rk-chip${b.board === cur ? " sel" : ""}`, { text: b.name, attrs: { type: "button", role: "tab", "data-board": b.board, "aria-selected": String(b.board === cur) } })) }));
  const shown = data && data.board === cur ? data : null;
  if (status === "error") body.push(h("div", "rk-msg rk-err", { kids: [h("span", "", { text: "Không tải được bảng (mất kết nối hoặc máy chủ chưa trả lời)." }), h("button", "rk-retry", { text: "Thử lại", attrs: { type: "button" } })] }));
  if (status === "loading" && !shown) body.push(h("div", "rk-skel", { attrs: { "aria-busy": "true", "aria-label": "Đang tải" }, kids: Array.from({ length: 6 }, () => h("span", "rk-skel-r")) }));
  if (shown) {
    if (!shown.rows.length) body.push(h("div", "rk-msg", { text: "Chưa có ai trên bảng này." }));
    else {
      body.push(podiumNode(podiumOf(shown.page, shown.rows)));
      body.push(h("div", "rk-paper", { kids: [h("table", "rk-tab", { kids: [
        h("thead", "", { kids: [h("tr", "", { kids: ["Hạng", "Tên", "Điểm", "Đội hình"].map((t) => h("th", "", { text: t })) })] }),
        h("tbody", "", { kids: shown.rows.map(rowNode) }),
      ] })] }));
      body.push(h("div", "rk-pager", { kids: [
        h("button", "rk-pg", { text: "◀ Trước", attrs: { type: "button", "data-pg": "-1", ...(shown.page <= 1 ? { disabled: "" } : {}) } }),
        h("span", "rk-pg-l", { text: pageLabel(shown.page, shown.total, shown.pageSize) }),
        h("button", "rk-pg", { text: "Sau ▶", attrs: { type: "button", "data-pg": "1", ...(!shown.hasNext ? { disabled: "" } : {}) } }),
        h("span", "rk-asof", { text: `Cập nhật ${hhmmVn(shown.asOf)}${status === "error" ? " · có thể đã cũ" : ""}` }),
      ] }));
    }
    const me = meLine(shown.me, board?.name ?? "");
    body.push(h("div", `rk-mine${me.ranked ? "" : " rk-none"}`, { attrs: { title: me.title }, kids: [h("span", "rk-mine-l", { text: "Của tôi" }), h("span", "rk-mine-v", { text: me.text })] }));
  }
  const pick = shown && selRank !== null ? shown.rows.find((r) => r.rank === selRank) : undefined;
  if (pick) {
    const c = playerCard(pick, board?.name ?? ""), sent = befriended.has(pick.name);
    body.push(h("div", "rk-card", { attrs: { role: "dialog", "aria-label": `Thẻ ${c.title}` }, kids: [
      h("div", "rk-card-hd", { kids: [h("span", "rk-card-t", { text: c.title }), h("button", "rk-card-x", { text: "X", attrs: { type: "button", "aria-label": "Đóng thẻ" } })] }),
      h("span", "rk-card-s", { text: `${c.rank} · ${c.score}` }),
      c.tong ? h("span", "rk-card-s", { text: `Tông: ${c.tong}` }) : null,
      c.lineup.length ? h("div", "rk-card-l", { kids: c.lineup.map((t) => h("span", "rk-slot", { text: t })) }) : null,
      c.canFriend ? h("button", "rk-card-f", { text: sent ? "Đã gửi lời kết bạn" : "Kết bạn", attrs: { type: "button", "data-name": pick.name, ...(sent ? { disabled: "" } : {}), ...(sent ? { title: "Kết quả hiện ở khung chat" } : {}) } }) : null,
    ] }));
  }
  const wrap = mount(h("div", "rk-wrap", { kids: body }));
  f.body.append(wrap);
  wrap.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const chip = t.closest<HTMLElement>(".rk-chip"); if (chip?.dataset.board && chip.dataset.board !== cur) { cur = chip.dataset.board; page = 1; data = null; request(); return; }
    if (t.closest(".rk-retry")) { request(); return; }
    if (t.closest(".rk-card-x")) { selRank = null; render(); return; }
    const fr = t.closest<HTMLElement>(".rk-card-f"); if (fr?.dataset.name && !(fr as HTMLButtonElement).disabled) { befriended.add(fr.dataset.name); send?.("friend", { op: "add", name: fr.dataset.name }); render(); return; }
    const row = t.closest<HTMLElement>(".rk-row"); if (row) { const rk = Number(row.querySelector<HTMLElement>(".rk-who")?.dataset.rk); if (rk) { selRank = selRank === rk ? null : rk; render(); } return; }
    const pg = t.closest<HTMLElement>(".rk-pg"); if (pg && !(pg as HTMLButtonElement).disabled) { page = Math.max(1, page + Number(pg.dataset.pg)); request(); }
  });
  addCloseButton(f.root, closeRank);
  root.replaceChildren(f.root);
}
