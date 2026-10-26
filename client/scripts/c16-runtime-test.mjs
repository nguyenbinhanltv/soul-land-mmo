import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { viteFsUrl } from './c16-runtime.mjs';

test('URL Vite giữ đường dẫn POSIX tuyệt đối và mã hóa dấu cách/ký tự URL', () => {
  assert.equal(viteFsUrl('/Users/test user/a #1?.mjs'), '/@fs//Users/test%20user/a%20%231%3F.mjs');
});
test('URL Vite chuẩn hóa Windows drive/backslash và dấu cách', () => {
  assert.equal(viteFsUrl('C:\\Work tree\\shared\\data.ts'), '/@fs/C:/Work%20tree/shared/data.ts');
  assert.equal(viteFsUrl('D:/work tree/helper.mjs'), '/@fs/D:/work%20tree/helper.mjs');
});
test('không ghép đường dẫn tương đối thành URL filesystem', () => {
  assert.throws(() => viteFsUrl('shared/data.ts'), /absolute|tuyệt đối/);
});

const alive = pid => { try { process.kill(pid, 0); return true; } catch (e) { if (e.code === 'ESRCH') return false; throw e; } };
const runtimeUrl = new URL('./c16-runtime.mjs', import.meta.url).href;
for (const mode of ['normal', 'error', 'SIGTERM', 'SIGINT', 'force']) {
  test(`cleanup ${mode}: dừng child sở hữu, giữ tiến trình khác`, {
    timeout: 15000,
    skip: process.platform === 'win32' && mode.startsWith('SIG') ? 'child.kill trên Windows không phát POSIX signal; chưa kiểm Windows runtime' : false,
  }, async () => {
    const dir = await mkdtemp(join(tmpdir(), 'c16 cleanup '));
    const entry = join(dir, 'owned fixture.mjs');
    const unrelated = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { stdio: 'ignore' });
    let parent, ownedPid;
    try {
      await once(unrelated, 'spawn');
      await writeFile(entry, `
import { once } from 'node:events';
import { createOwnedChildren, withCleanup } from ${JSON.stringify(runtimeUrl)};
const pool=createOwnedChildren({graceMs:100});
let signal;
await withCleanup(async(s)=>{
 signal=s;
 const code=${JSON.stringify(mode === 'force' ? "process.on('SIGTERM',()=>{});process.send('ready');setInterval(()=>{},1000)" : "process.send('ready');setInterval(()=>{},1000)")};
 const child=pool.start(['-e',code],{stdio:['ignore','ignore','ignore','ipc']});
 await once(child,'message');
 console.log(JSON.stringify({pid:child.pid}));
 if(${JSON.stringify(mode)}==='error')throw Error('expected fixture error');
 if(${JSON.stringify(mode)}.startsWith('SIG'))await new Promise(()=>{});
},()=>{if(${JSON.stringify(mode)}.startsWith('SIG')&&!signal.aborted)throw Error('signal chưa abort task');return pool.close();});
`);
      parent = spawn(process.execPath, [entry], { stdio: ['ignore', 'pipe', 'pipe'] });
      const closed = once(parent, 'close');
      const line = await new Promise((resolve, reject) => {
        let output = '';
        parent.stdout.on('data', chunk => {
          output += chunk;
          if (output.includes('\n')) resolve(output.split('\n')[0]);
        });
        parent.once('error', reject);
        parent.once('exit', () => { if (!output.includes('\n')) reject(Error('fixture chưa báo PID')); });
      });
      ownedPid = JSON.parse(line).pid;
      if (mode.startsWith('SIG')) parent.kill(mode);
      const [code] = await closed;
      assert.equal(code, mode === 'error' ? 1 : mode === 'SIGTERM' ? 143 : mode === 'SIGINT' ? 130 : 0);
      assert.equal(alive(ownedPid), false, 'child sở hữu phải dừng');
      assert.equal(alive(unrelated.pid), true, 'không dừng tiến trình cùng tên nhưng không sở hữu');
    } finally {
      if (parent && alive(parent.pid)) parent.kill('SIGKILL');
      if (ownedPid && alive(ownedPid)) process.kill(ownedPid, 'SIGKILL');
      const closed = once(unrelated, 'close');
      unrelated.kill(); await closed;
      await rm(dir, { recursive: true, force: true });
    }
  });
}
