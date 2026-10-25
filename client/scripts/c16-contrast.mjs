/** Vùng chữ phải nằm trọn trong scrollport, tránh lấy pixel viền ảnh làm nền chữ. */
export function insideScrollport(text, panel, clientTop, clientHeight) {
  return text.top >= panel.top + clientTop && text.bottom <= panel.top + clientTop + clientHeight;
}
