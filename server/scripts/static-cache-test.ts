// Quy tắc Cache-Control của client/dist (server/src/staticCache.ts, #580).
import assert from "node:assert/strict";
import { cacheControlFor as c } from "../src/staticCache.ts";

assert.match(c("/assets/index-CwxVDrpX.js", false), /immutable/);
assert.match(c("/assets/index-C0S4swvL.css", false), /max-age=31536000/);
assert.equal(c("/index.html", false), "no-cache");
assert.equal(c("/", true), "no-cache");
assert.equal(c("/sprites/manifest.json", false), "no-cache");
assert.match(c("/sprites/manifest.json", true), /immutable/); // có ?v= thì URL đổi theo nội dung
assert.match(c("/lpcparts/x.png", true), /immutable/);
assert.match(c("/lpcparts/x.png", false), /max-age=604800, stale-while-revalidate/);
assert.match(c("/audio/music/a.ogg", false), /max-age=604800/);
assert.equal(c("/thanh_hon_thon.json", false), "no-cache");
console.log("static-cache: OK");
