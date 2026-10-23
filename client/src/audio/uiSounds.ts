import type { UiSound } from "./soundMap.ts";

// Tiếng giao diện tự gắn vào DOM (G5, #396): mở / đóng panel theo thuộc tính `hidden`, kéo thả ô đồ. Không đụng vào từng panel;
// panel mới có `role="dialog"` thì tự có tiếng. Trang bị / cường hóa / đồ hiếm phát từ tin của server ở GameScene.

/** Panel có tiếng mở / đóng: hộp thoại (role=dialog) và các bảng chính. */
export const UI_PANEL_SELECTOR = '.panel[role="dialog"], #bag, #roster, #chans';

export interface UiSoundSink { playUi(kind: UiSound): unknown; }

/** Gắn quan sát panel + kéo thả; gỡ khi `signal` hủy. Lần đổi `hidden` đầu của mỗi panel chỉ ghi nhớ trạng thái, không phát tiếng. */
export function bindUiSounds(audio: UiSoundSink, signal: AbortSignal, root: ParentNode = document): void {
  const state = new Map<Element, boolean>();
  const panels = root.querySelectorAll(UI_PANEL_SELECTOR);
  panels.forEach((el) => state.set(el, (el as HTMLElement).hidden));
  const observer = new MutationObserver((records) => {
    for (const r of records) {
      const el = r.target as HTMLElement, was = state.get(el);
      if (was === undefined || was === el.hidden) continue;
      state.set(el, el.hidden);
      audio.playUi(el.hidden ? "close" : "open");
    }
  });
  panels.forEach((el) => observer.observe(el, { attributes: true, attributeFilter: ["hidden"] }));
  const inPanel = (e: Event) => (e.target as Element | null)?.closest?.(UI_PANEL_SELECTOR) ?? null;
  document.addEventListener("dragstart", (e) => { if (inPanel(e)) audio.playUi("drag"); }, { signal });
  document.addEventListener("drop", (e) => { if (inPanel(e)) audio.playUi("drop"); }, { signal });
  signal.addEventListener("abort", () => observer.disconnect(), { once: true });
}
