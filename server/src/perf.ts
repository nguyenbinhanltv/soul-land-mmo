// Đo nhịp chậm khi server bật PERF_LOG=1 (#273): GC của tiến trình và CPU của luồng chính, để tách nhịp chậm do server làm việc
// (CPU luồng chính gần bằng thời gian thật) với nhịp chậm do hệ điều hành cắt luồng (thời gian thật lớn, CPU nhỏ) hay do GC.
import { PerformanceObserver, performance } from "node:perf_hooks";

/** Các lần GC gần nhất (mốc theo performance.now(), ms), giữ tối đa GC_KEEP lần. */
const gcs: { start: number; dur: number; kind: number }[] = [];
const GC_KEEP = 400;
let observing = false;

/** Bật ghi GC (một lần mỗi tiến trình; mọi phòng dùng chung). */
export function watchGc() {
  if (observing) return;
  observing = true;
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      gcs.push({ start: e.startTime, dur: e.duration, kind: (e as { detail?: { kind?: number } }).detail?.kind ?? 0 });
      if (gcs.length > GC_KEEP) gcs.splice(0, gcs.length - GC_KEEP);
    }
  }).observe({ entryTypes: ["gc"] });
}

/** Tên loại GC theo `detail.kind` của Node (1 scavenge, 2 mark-compact, 4 incremental, 8 weak callbacks, 16 minor mark-sweep). */
const GC_NAME: Record<number, string> = { 1: "scavenge", 2: "mark-compact", 4: "incremental", 8: "weakcb", 16: "minor-ms" };

/** Tổng thời gian GC chồng lên khoảng [t0, t1] (ms) và các loại GC đó. Bản ghi GC tới muộn một vòng lặp sự kiện: gọi sau khoảng đó. */
export function gcIn(t0: number, t1: number) {
  let ms = 0; const kinds = new Set<string>();
  for (const g of gcs) {
    const a = Math.max(t0, g.start), b = Math.min(t1, g.start + g.dur);
    if (b > a) { ms += b - a; kinds.add(GC_NAME[g.kind] ?? String(g.kind)); }
  }
  return { ms, kinds: [...kinds] };
}

/** CPU (ms, user + system) của luồng chính từ đầu tiến trình; Node chưa có process.threadCpuUsage thì dùng CPU cả tiến trình. */
export function cpuMs() {
  const p = process as unknown as { threadCpuUsage?: () => { user: number; system: number } };
  const u = p.threadCpuUsage ? p.threadCpuUsage() : process.cpuUsage();
  return (u.user + u.system) / 1000;
}

/** Giờ hiện tại dạng HH:MM:SS.mmm (UTC) để đối chiếu nhịp chậm với log khác. */
export const clock = () => new Date(performance.timeOrigin + performance.now()).toISOString().slice(11, 23);
