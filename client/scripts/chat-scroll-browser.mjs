// #1509: dùng phiên game của loot-chat-browser; mọi cập nhật cuộn chờ điều kiện DOM.
import assert from "node:assert/strict";
import { resolve } from "node:path";

export async function checkChatScroll(page, out, tag) {
  for (const [width, height, font, touch] of [[960,540,0,false],[960,540,1,false],[960,540,2,false],[640,360,0,true]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(async ({ font, touch }) => {
      document.body.classList.remove("a11y-fs-1", "a11y-fs-2");
      if (font) document.body.classList.add(`a11y-fs-${font}`);
      document.body.classList.toggle("touch", touch);
      const c = await import("/src/chat.ts");
      window.__scrollChat = c;
      c.chatSetTab("map");
      for (let i = 0; i < 40; i++) c.chatLine("map", `Lịch sử ${i}: cùng tổ đội săn hồn thú, giữ vị trí đang đọc.`, undefined, "Đường Tam");
    }, { font, touch });
    if (touch) await page.waitForFunction(() => document.body.classList.contains("ui-h460"));
    await page.waitForFunction(() => { const e = document.querySelector("#log"); return e.scrollHeight > e.clientHeight; });
    await page.locator("#log").evaluate((e) => { e.scrollTop = e.scrollHeight / 3; e.dispatchEvent(new Event("scroll")); });
    const anchor = await page.locator("#log").evaluate((e) => {
      const top = e.getBoundingClientRect().top;
      const row = [...e.children].find((r) => r.getBoundingClientRect().top >= top);
      return { text:row.textContent, offset:row.getBoundingClientRect().top - top };
    });
    const stem = `${tag}-chat-${width}x${height}-fs${font}`;
    await page.screenshot({ path:resolve(out, `${stem}-doc.png`), animations:"disabled" });
    await page.evaluate(() => window.__scrollChat.chatLine("map", "Tin mới khi đang đọc", undefined, "Tiểu Vũ"));
    if (tag === "truoc") {
      await page.screenshot({ path:resolve(out, `${stem}-tin.png`), animations:"disabled" });
      continue;
    }
    const stays = async () => page.waitForFunction(({ text, offset }) => {
      const e = document.querySelector("#log"), row = [...e.children].find((r) => r.textContent === text);
      return row && Math.abs(row.getBoundingClientRect().top - e.getBoundingClientRect().top - offset) <= 1;
    }, anchor);
    await stays();
    await page.evaluate(() => { for (let i = 0; i < 5; i++) window.__scrollChat.chatLine("map", `Tin nối tiếp ${i}`); });
    await stays();
    await page.locator("#chat-new:not([hidden])").waitFor();
    const controlsVisible = await page.locator("#chat-new").evaluate((e) => {
      const r = e.getBoundingClientRect(), log = document.querySelector("#log").getBoundingClientRect();
      return log.top >= 0 && log.bottom <= innerHeight && e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    });
    assert.ok(controlsVisible, "log trong màn hình, nút Tin mới bấm được");
    await page.evaluate(() => {
      const c = window.__scrollChat;
      c.chatLoot("scroll-hidden", "món ở tab khác", 1);
      c.chatLoot("scroll-hidden", "món ở tab khác", 2);
      c.logImp("Thông báo quan trọng khi đọc");
      c.logImp("Thông báo quan trọng khi đọc");
    });
    await stays();
    await page.evaluate(() => { const c = window.__scrollChat; c.chatSetTab("party"); c.chatSetTab("map"); c.chatClose(); c.chatFocus(true); c.chatFocus(false); c.chatSetTab("map"); });
    await stays();
    await page.screenshot({ path:resolve(out, `${stem}-tin.png`), animations:"disabled" });
    await page.locator("#chat-new").dispatchEvent("pointerdown");
    await page.waitForFunction(() => { const e = document.querySelector("#log"); return e.scrollHeight - e.clientHeight - e.scrollTop <= 2 && document.querySelector("#chat-new").hidden; });
    await page.evaluate(() => window.__scrollChat.chatLine("map", "Tự cuộn ở cuối", undefined, "Tiểu Vũ"));
    await page.waitForFunction(() => { const e = document.querySelector("#log"); return e.scrollHeight - e.clientHeight - e.scrollTop <= 2; });
    await page.evaluate((key) => {
      const c = window.__scrollChat; c.chatSetTab("sys");
      for (let i = 0; i < 40; i++) c.log(`Hệ thống ${i}: lịch sử nhận thưởng và hồn thú.`);
      c.chatLoot(key, "mảnh kiểm cuộn", 1);
    }, stem);
    await page.locator("#log").evaluate((e) => { e.scrollTop = e.scrollHeight / 3; e.dispatchEvent(new Event("scroll")); });
    const before = await page.locator("#log").evaluate((e) => e.scrollTop);
    await page.evaluate((key) => window.__scrollChat.chatLoot(key, "mảnh kiểm cuộn", 2), stem);
    await page.waitForFunction((top) => Math.abs(document.querySelector("#log").scrollTop - top) <= 1, before);
    assert.match(await page.locator("#log").innerText(), /mảnh kiểm cuộn ×3/);
    await page.locator("#log").evaluate((e) => { e.scrollTop = e.scrollHeight; e.dispatchEvent(new Event("scroll")); });
    await page.waitForFunction(() => document.querySelector("#chat-new").hidden);
    // Chat mở ở cuối: loot gộp phải về cuối dù có dòng xen, vẫn tự cuộn và không báo chưa đọc.
    const bottomKey = `${stem}-bottom`;
    await page.evaluate((key) => {
      const c = window.__scrollChat;
      c.chatLoot(key, `loot ở cuối ${key}`, 1);
      c.log(`Dòng xen loot ở cuối ${key}`);
      c.chatLoot(key, `loot ở cuối ${key}`, 2);
    }, bottomKey);
    await page.waitForFunction((key) => {
      const e = document.querySelector("#log");
      return e.lastElementChild?.textContent === `Nhận loot ở cuối ${key} ×3`
        && e.scrollHeight - e.clientHeight - e.scrollTop <= 2
        && document.querySelector("#chat-new").hidden;
    }, bottomKey);
    // Dòng loot đang đọc tự gộp cũng phải giữ mốc, kể cả có dòng xen sau nó.
    await page.evaluate((key) => {
      const c = window.__scrollChat;
      c.chatLoot(key, `loot làm mốc đọc ${key}`, 1);
      for (let i = 0; i < 15; i++) c.log(`Dòng xen sau loot ${i}`);
      const e = document.querySelector("#log"), row = [...e.children].find((r) => r.textContent.includes(`loot làm mốc đọc ${key}`));
      e.scrollTop += row.getBoundingClientRect().top - e.getBoundingClientRect().top;
      e.dispatchEvent(new Event("scroll"));
    }, `${stem}-anchor`);
    const key = `${stem}-anchor`;
    const lootOffset = await page.locator("#log").evaluate((e, key) => [...e.children].find((r) => r.textContent.includes(`loot làm mốc đọc ${key}`)).getBoundingClientRect().top - e.getBoundingClientRect().top, key);
    await page.evaluate((key) => window.__scrollChat.chatLoot(key, `loot làm mốc đọc ${key}`, 2), key);
    await page.waitForFunction(({offset, key}) => {
      const e = document.querySelector("#log"), row = [...e.children].find((r) => r.textContent.includes(`loot làm mốc đọc ${key} ×3`));
      return row && Math.abs(row.getBoundingClientRect().top - e.getBoundingClientRect().top - offset) <= 1;
    }, {offset:lootOffset, key});
    console.log(`Cuộn chat đạt: ${width}x${height}, cỡ chữ ${font}`);
  }
}
