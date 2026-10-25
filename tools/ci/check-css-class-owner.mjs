// Kiểm lớp CSS "thẻ nổi" chỉ do đúng một file dựng (#712: màn Lễ thức tỉnh dùng nhầm .acard của thẻ thao tác nên thẻ võ hồn bị chồng).
// Mỗi lớp trong OWNERS có CSS toàn cục (position:fixed...) nên file khác không được gắn lớp đó vào phần tử. Chạy trong `npm run check`.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "../assets/lib.mjs";

const OWNERS = { acard: "actionCard.ts" };
/** Lớp đứng riêng một từ: sau dấu nháy, dấu chấm hoặc khoảng trắng, và trước dấu nháy / khoảng trắng / hết chuỗi. */
const usesClass = (src, cls) => new RegExp(String.raw`(^|["'\`.\s])${cls}(?=["'\`\s]|$)`, "m").test(src.replace(/\/\/.*$/gm, ""));

// Ca thử khóa hành vi regex.
for (const [s, want] of [['classList.add("acard")', true], ['mk("x", "vcard acard")', true], ['"acard b"', true], ['"acards"', false], ['"macard"', false]])
  if (usesClass(s, "acard") !== want) { console.error(`regex sai với ${s}`); process.exit(1); }

const dir = path.join(ROOT, "client", "src");
const errs = [];
for (const f of readdirSync(dir, { recursive: true }).filter((x) => /\.ts$/.test(x))) {
  const src = readFileSync(path.join(dir, f), "utf8");
  for (const [cls, owner] of Object.entries(OWNERS))
    if (path.basename(f) !== owner && usesClass(src, cls)) errs.push(`${f}: dùng lớp "${cls}" của ${owner}; đặt tên lớp riêng`);
}
if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
console.log("css-class-owner: ok");
