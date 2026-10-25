// In mã võ hồn theo thứ tự VOHON (cho tools/landing-sheet.py).
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
const { VOHON } = await import(pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), "../shared/data.ts")).href);
console.log(VOHON.map((v) => v.id).join("\n"));
