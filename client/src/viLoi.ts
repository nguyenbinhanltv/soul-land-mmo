/** Đổi lỗi bắt được (Colyseus / trình duyệt / server) thành câu tiếng Việt để hiện cho người chơi; chi tiết kỹ thuật ở console. */
const CO_DAU = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

export function viLoi(e: unknown, macDinh = "Không vào được phòng, thử lại sau."): string {
  const m = e instanceof Error ? e.message : typeof e === "string" ? e : "";
  if (e instanceof TypeError || /failed to fetch|load failed|networkerror|network request failed|ECONN|websocket|timed? ?out/i.test(m)) {
    return "Không kết nối được server.";
  }
  // Thông báo server tự ném (onAuth…) đã là tiếng Việt: giữ nguyên.
  if (CO_DAU.test(m)) return m;
  return macDinh;
}
