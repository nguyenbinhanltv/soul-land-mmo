# Chế độ làm việc liên tục 24/7 cho agent của collaborator

Mục tiêu: agent tự làm hết issue này tới issue khác, cả ban đêm. Khi hết quota thì tự chờ reset rồi làm tiếp, không trùng việc với người khác, không phá `main`.

## 1. Luật khi làm liên tục

Đây là luật chính. Dán khối dưới vào agent, hoặc cho agent đọc file này (`docs/lam-viec-lien-tuc.md`). Quy trình nhận việc, nhãn và nhánh chi tiết ở `CONTRIBUTING.md`.

```
CHẾ ĐỘ LÀM VIỆC LIÊN TỤC — soul-land-mmo. Tôi là <tên> (nhãn agent:<tên>).
Mỗi NHỊP (~30 phút) làm đúng thứ tự, dừng ở bước đầu tiên có việc:
1. PR của tôi có góp ý review / CONFLICTING / CI đỏ → sửa (merge origin/main, không rebase, không force push), push, trả lời thread.
2. Đang có issue dang-lam của tôi chưa xong → đọc comment "Tiến độ" mới nhất trong issue rồi làm tiếp từ đó.
3. Issue của tôi đã xong → kiểm thử theo CONTRIBUTING.md "Xin review" và "Merge":
   - tự chạy check + build; bot PostgreSQL VẪN tự chạy khi đổi server/ hoặc shared/ (bắt buộc khi đổi SQL / db.ts);
   - bot RAM do job CI bot-ram tự chạy mỗi push (CI chỉ tham khảo), chỉ tự chạy ở máy khi gỡ lỗi / thêm bài mới (BOT_ONLY / BOT_PART); bài bot mới gắn đúng một nhóm BOT_PART;
   - chờ CI của đúng head xong rồi đọc: gh pr checks <PR>, gh run view <run-id> (✓ / ✗ / ⚠ từng nhóm), đỏ thì gh run view <run-id> --log-failed. Đỏ do PR thì sửa trước khi xin review; đỏ do bài chập chờn có sẵn (vd #185) thì ghi rõ trong PR kèm lượt chạy lại.
   → TỰ chạy reviewer cho PR của mình (AO review nếu có, hoặc reviewer của agent, vd /code-review), sửa hết góp ý, review lại tới khi đạt; ghi một comment PR tiêu đề "Review: đạt" (công cụ review, kết luận, dòng Bot: RAM theo CI — link lượt chạy, ✓ / ✗ từng nhóm — và PG nếu có; bắt buộc dòng "**Head đã review:** `<SHA 40 ký tự>`"); rồi gh pr ready, đổi nhãn sang cho-review, Project Status = Đang review. Orchestrator AO của chủ repo kiểm tra lại và merge nếu đạt, không đạt thì comment góp ý (xử lý ở bước 1, xong review lại và cập nhật SHA trong "Review: đạt": sửa comment cũ hoặc ghi mới).
4. Chưa có việc → nhận issue mới theo CONTRIBUTING.md: san-sang, chưa ai nhận, không dang-lam/chan/can-pixellab; mỗi lúc TỐI ĐA 1 issue đang làm + 2 PR chờ review; khai số SQL trong issue nếu cần; PR nháp ngay "Closes #N" (gh pr create --draft --base main --label agent:<tên>; nhãn agent:<tên> trên cả issue lẫn PR); Project Status = Đang làm, Chủ = tôi.
5. Không còn issue phù hợp → ghi "hết việc" và nghỉ tới nhịp sau.
Sau MỖI nhịp có thay đổi: cập nhật một comment "Tiến độ" trong issue (đã làm gì, đang ở bước nào, lệnh tiếp theo, PR/nhánh; không sửa được bảng Project thì ghi trạng thái cần đổi để orchestrator đồng bộ hộ). Đây là bộ nhớ để làm tiếp sau khi hết quota hoặc mất ngữ cảnh — KHÔNG dựa vào trí nhớ hội thoại.
GIỚI HẠN: không push vào main, không force push, không xoá nhánh/issue của người khác, không tự merge PR (orchestrator AO của chủ repo kiểm tra lại rồi merge), không sửa PR/issue có nhãn agent:<người khác>, không ghi token/key/mật khẩu, không dùng dịch vụ tốn phí (PixelLab…), không tắt tiến trình theo tên (chỉ đúng PID mình mở), server/bot dùng cổng riêng.
Bị chặn (thiếu quyết định thiết kế, lỗi môi trường, cần chủ repo) → gắn nhãn chan, comment câu hỏi cụ thể vào issue, chuyển sang việc khác.
Hết quota / bị giới hạn tốc độ → không làm gì thêm, chờ nhịp sau (sau khi reset) rồi đọc lại comment "Tiến độ" để làm tiếp.
```

## 2. Cách chạy liên tục theo từng loại agent

### Claude Code (khuyến nghị)
Mở một phiên Claude Code trong thư mục repo, giữ máy và phiên luôn mở (tắt chế độ ngủ của máy), rồi gõ:
```
/loop 30m Làm theo CHẾ ĐỘ LÀM VIỆC LIÊN TỤC trong docs/lam-viec-lien-tuc.md với tên <tên>.
```
- `/loop` chạy lại lời nhắc mỗi 30 phút. Khi hết quota, các nhịp trong lúc đó bị bỏ qua. Sau khi quota reset, nhịp kế tiếp tự chạy, và agent đọc comment "Tiến độ" để làm tiếp.
- Nên bật chế độ tự chấp nhận lệnh an toàn (auto-accept / allowlist cho `gh`, `git`, `npm`), để ban đêm không bị kẹt ở bước hỏi quyền.
- Lịch `/loop` tự hết sau 7 ngày. Sau đó gõ lại.

### Agent không có lịch sẵn: vòng lặp script
Mỗi lần gọi là một phiên mới, chạy không người trông (headless) nên **không ai trả lời câu hỏi xin quyền**. Phải cấp trước quyền ghi file, chạy `git` / `gh` / `npm` và truy cập mạng (GitHub, npm), nếu không agent sẽ dừng hoặc thất bại ở lệnh đầu tiên. Comment "Tiến độ" trong issue là bộ nhớ chung giữa các lần chạy.

#### Claude Code headless (`claude -p`)
`--permission-mode acceptEdits` chỉ tự chấp nhận sửa file, **không** cho chạy Bash. Hãy liệt kê công cụ được phép bằng `--allowedTools`, hoặc ghi allowlist tương tự vào `permissions.allow` của `.claude/settings.local.json` trên máy mình (file riêng, không commit).

Bash (macOS/Linux):
```bash
while true; do
  if claude -p "Làm theo CHẾ ĐỘ LÀM VIỆC LIÊN TỤC trong docs/lam-viec-lien-tuc.md với tên <tên>. Làm một nhịp rồi dừng." \
      --allowedTools "Bash(git:*) Bash(gh:*) Bash(npm:*) Bash(node:*) Edit Write Read Glob Grep"; then
    sleep 1800
  else
    sleep 900   # lỗi (vd hết quota, mạng) thì chờ 15 phút rồi thử lại
  fi
done
```
PowerShell (Windows):
```powershell
while ($true) {
  claude -p "Làm theo CHẾ ĐỘ LÀM VIỆC LIÊN TỤC trong docs/lam-viec-lien-tuc.md với tên <tên>. Làm một nhịp rồi dừng." `
    --allowedTools "Bash(git:*) Bash(gh:*) Bash(npm:*) Bash(node:*) Edit Write Read Glob Grep"
  if ($LASTEXITCODE -ne 0) { Start-Sleep -Seconds 900 } else { Start-Sleep -Seconds 1800 }   # lỗi (vd hết quota, mạng): chờ 15 phút
}
```

#### Codex CLI (`codex exec`)
`codex exec` mặc định chạy sandbox **chỉ đọc, không mạng**, nên không sửa file, không `git push` / `gh` được. Cần quyền ghi trong thư mục repo **và** quyền mạng. Với bản Codex hiện hành, thường là `--full-auto` (sandbox `workspace-write`) cộng `-c sandbox_workspace_write.network_access=true` (bật mạng). Tên cờ có thể đổi giữa các phiên bản: kiểm bằng `codex exec --help` và tài liệu Codex trước khi chạy qua đêm.

Thay cho cờ dòng lệnh, có thể cấu hình tương đương trong `~/.codex/config.toml` của máy đó (không commit vào repo):
```toml
sandbox_mode = "workspace-write"
approval_policy = "never"          # chạy đêm không ai bấm duyệt

[sandbox_workspace_write]
network_access = true
```

**Rủi ro của chế độ này:** agent tự ghi mọi file trong thư mục repo và tự chạy lệnh có mạng mà không hỏi ai, kể cả lệnh sai (xoá file, `npm install` gói lạ, gửi dữ liệu ra ngoài). Để giảm rủi ro:
- chạy trong một bản clone / worktree riêng chỉ dành cho agent, không phải thư mục đang làm tay;
- không để key, token, `.env` có bí mật trong thư mục đó; `gh` đăng nhập bằng token chỉ có quyền repo này nếu được;
- không dùng `--dangerously-bypass-approvals-and-sandbox` (tắt hẳn sandbox);
- buổi sáng xem lại commit / PR / comment agent đã tạo (mục 3).

Rủi ro tương tự với `claude -p --allowedTools` ở trên: chỉ cho phép đúng các lệnh cần dùng, áp dụng cùng các biện pháp này.

PowerShell (Windows):
```powershell
while ($true) {
  codex exec --full-auto -c sandbox_workspace_write.network_access=true `
    "Làm theo CHẾ ĐỘ LÀM VIỆC LIÊN TỤC trong docs/lam-viec-lien-tuc.md với tên <tên>. Làm một nhịp rồi dừng."
  if ($LASTEXITCODE -ne 0) { Start-Sleep -Seconds 900 } else { Start-Sleep -Seconds 1800 }   # lỗi (vd hết quota, mạng): chờ 15 phút
}
```
Bash (macOS/Linux):
```bash
while true; do
  if codex exec --full-auto -c sandbox_workspace_write.network_access=true \
      "Làm theo CHẾ ĐỘ LÀM VIỆC LIÊN TỤC trong docs/lam-viec-lien-tuc.md với tên <tên>. Làm một nhịp rồi dừng."; then
    sleep 1800
  else
    sleep 900   # lỗi (vd hết quota, mạng) thì chờ 15 phút rồi thử lại
  fi
done
```

### Cursor / Copilot agent
Hai loại này không chạy nền được. Hãy dùng script ở trên với CLI tương ứng, hoặc chỉ làm ban ngày.

## 3. Buổi sáng (chủ repo hoặc collaborator)
- Xem bảng Project, cột **Đang review**. Orchestrator AO của chủ repo kiểm tra lại các PR có comment "Review: đạt" (review độc lập; bot RAM đọc từ CI `bot-ram`, tự chạy bot PostgreSQL khi PR đổi SQL / `db.ts`), merge PR đạt, comment góp ý vào PR chưa đạt.
- Collaborator: xử lý góp ý mới trên PR của mình (bước 1 của nhịp), review lại rồi cập nhật comment "Review: đạt".
- Issue có nhãn `chan`: trả lời câu hỏi trong comment, gỡ nhãn `chan`.
