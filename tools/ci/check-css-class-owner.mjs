// Kiểm lớp CSS "thẻ nổi" chỉ do đúng một file dựng (#712: màn Lễ thức tỉnh dùng nhầm .acard của thẻ thao tác nên thẻ võ hồn bị chồng).
// Mỗi lớp trong OWNERS có CSS toàn cục (position:fixed...) nên file khác không được gắn lớp đó vào phần tử. Chạy trong `npm run check`.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "../assets/lib.mjs";

const OWNERS = { acard: "actionCard.ts" };
const dir = path.join(ROOT, "client", "src");
const errs = [];
for (const f of readdirSync(dir).filter((x) => /\.ts$/.test(x))) {
  const src = readFileSync(path.join(dir, f), "utf8");
  for (const [cls, owner] of Object.entries(OWNERS)) {
    if (f === owner) continue;
    if (new RegExp(`["'\`.\s]${cls}["'\`\s]`).test(src.replace(/\/\/.*$/gm, ""))) errs.push(`${f}: dùng lớp "${cls}" của ${owner}; đặt tên lớp riêng`);
  }
}
if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
console.log("css-class-owner: ok");
