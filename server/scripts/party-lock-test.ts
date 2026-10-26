// #956: tranh khóa presence tổ đội quá hạn (remoteMutation ném lỗi) không được thành unhandledRejection làm cả server thoát.
// Chạy: npm run test:presence --prefix server (hoặc npx tsx scripts/party-lock-test.ts)
import assert from "node:assert/strict";
import * as party from "../src/party.ts";
import { partyAction } from "../src/rooms/social.ts";
import type { PresenceBackend } from "../src/presence.ts";

const rejections: unknown[] = [];
process.on("unhandledRejection", (e) => rejections.push(e));

const live = (acc: number, name: string) => ({ acc, name, sid: `s${acc}`, mapId: "m", roomId: "r", ch: 1, level: 1, vh: 0, hp: 1, maxHp: 1, dead: false });
await party.goOnline(live(901, "Lock A"));
await party.goOnline(live(902, "Lock B"));

// Presence giả: withLock luôn trả false (không giành được khóa trong hạn), phần còn lại im lặng.
const fake = {
  mode: "redis", workerId: "w", healthy: () => true,
  presence: { publish: async () => 0 },
  getJson: async () => null, putJson: async () => {},
  withLock: async () => false,
} as unknown as PresenceBackend;
party.configurePresence(fake);
await assert.rejects(party.addInvite(901, 902, Date.now()), /Không khóa được/); // đúng là lỗi nguồn gây ra sự cố

const logs: string[] = [], sent: string[] = [];
const room = {
  pdata: new Map([["a", { accountId: 901, arenaBusy: false }]]),
  state: { players: new Map(), mapId: "m" },
  interest: { sees: () => false },
  log: (_id: string, text: string) => logs.push(text),
  sendParty: (id: string) => sent.push(id),
  partyPublish: () => { throw new Error("không được phát khi lỗi"); },
} as never;

const origError = console.error; console.error = () => {};
try {
  for (const op of ["invite", "accept", "leave", "kick", "lead", "decline"]) {
    await partyAction(room, "a", { op, name: "Lock B" }); // không ném
  }
} finally { console.error = origError; }
await new Promise((r) => setTimeout(r, 20));
assert.equal(rejections.length, 0, "không có unhandledRejection");
assert.ok(logs.includes("Tổ đội đang bận, thử lại sau."), `người chơi nhận thông báo bận: ${logs.join("|")}`);
assert.ok(sent.includes("a"), "khung tổ đội được gửi lại");
console.log("✓ partyAction: khóa presence tổ đội quá hạn thì báo bận, không ném ra ngoài");
process.exit(0);
