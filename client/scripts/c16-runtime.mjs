import { spawn } from 'node:child_process';
import { constants } from 'node:os';

/** URL filesystem của Vite từ đường dẫn tuyệt đối POSIX/Windows, kể cả dấu cách. */
export function viteFsUrl(path) {
  const normalized = path.replace(/\\/g, '/');
  if (!normalized.startsWith('/') && !/^[a-z]:\//i.test(normalized)) throw Error('Cần đường dẫn tuyệt đối');
  return '/@fs/' + encodeURI(normalized).replace(/[?#]/g, encodeURIComponent);
}

function exitedWithin(child, ms) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);
  return new Promise(resolve => {
    const done = exited => {
      clearTimeout(timer); child.off('exit', onExit); child.off('error', onExit); resolve(exited);
    };
    const onExit = () => done(true);
    const timer = setTimeout(() => done(false), ms);
    child.once('exit', onExit); child.once('error', onExit);
  });
}

/** Chỉ giữ handle Node child do helper tạo; không tìm/kill theo tên, cổng hay PGID. */
export function createOwnedChildren({ graceMs = 10000 } = {}) {
  const children = new Set();
  let closing;
  async function stop(child) {
    if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
    const graceful = exitedWithin(child, graceMs);
    child.kill('SIGTERM');
    if (await graceful) return;
    const forced = exitedWithin(child, 2000);
    child.kill('SIGKILL');
    if (!await forced) throw Error(`Không dừng được child sở hữu ${child.pid}`);
  }
  return {
    start(args, options = {}) {
      if (closing) throw Error('Runtime đang dọn');
      const child = spawn(process.execPath, args, { ...options, detached: false });
      children.add(child);
      const forget = () => children.delete(child);
      child.once('exit', forget); child.once('error', forget);
      return child;
    },
    close() {
      return closing ??= (async () => {
        const results = await Promise.allSettled([...children].map(stop));
        const errors = results.filter(r => r.status === 'rejected').map(r => r.reason);
        if (errors.length) throw new AggregateError(errors, 'Không dọn hết runtime sở hữu');
      })();
    },
  };
}

/** Cleanup một lần khi task xong/lỗi hoặc nhận signal; signal không tiếp tục chạy fixture. */
export async function withCleanup(task, cleanup) {
  let finishing, interrupted = false;
  const controller = new AbortController();
  const finish = () => finishing ??= Promise.resolve().then(cleanup);
  const handlers = new Map(['SIGINT', 'SIGTERM', 'SIGHUP'].map(signal => [signal, () => {
    interrupted = true;
    controller.abort();
    const code = 128 + constants.signals[signal];
    void finish().then(() => process.exit(code), error => { console.error(error); process.exit(1); });
  }]));
  for (const [signal, handler] of handlers) process.on(signal, handler);
  try { return await task(controller.signal); }
  catch (error) { if (!interrupted) throw error; }
  finally {
    try { await finish(); }
    finally { for (const [signal, handler] of handlers) process.off(signal, handler); }
  }
}
