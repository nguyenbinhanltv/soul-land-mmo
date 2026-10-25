// Chờ phông tự host nạp xong trước khi Phaser vẽ chữ: Text của Phaser vẽ ra texture một lần, vẽ lúc phông chưa về thì kẹt phông dự phòng.
// Chờ tối đa FONT_WAIT_MS (mạng chậm / lỗi thì vẫn vào game, chữ dựng lại khi cảnh vẽ lại).
export const GAME_FONTS = ['500 12px "Be Vietnam Pro"', '600 12px "Be Vietnam Pro"', '800 12px "Be Vietnam Pro"', '12px "Galmuri 11"', '10px "Galmuri 9"'];
const FONT_WAIT_MS = 2500;

export async function loadGameFonts(): Promise<void> {
  if (!document.fonts) return;
  const all = Promise.all(GAME_FONTS.map((f) => document.fonts.load(f, "Ằ Ẳ Ẫ Ệ Ớ Ự ơ ư"))).then(() => {}, () => {});
  await Promise.race([all, new Promise<void>((r) => setTimeout(r, FONT_WAIT_MS))]);
}
