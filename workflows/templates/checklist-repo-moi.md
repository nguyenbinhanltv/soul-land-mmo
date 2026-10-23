# Checklist repo mới: `CLAUDE.md`, `CONTRIBUTING.md`, `.github/`

Dùng khi đưa quy trình ở thư mục [`workflows/`](../README.md) sang dự án khác. Mỗi mục có "việc phải có" và ví dụ lấy từ Soul Land (thay bằng của dự án bạn).

## A. `CLAUDE.md` (luật cho mọi agent, giữ ngắn)

- [ ] Dòng đầu: **đọc tài liệu thiết kế trước khi sửa** (nêu mục bắt buộc giữ, ví dụ "mục Kiến trúc").
- [ ] **Ngôn ngữ** giao diện, chú thích, commit, PR.
- [ ] **Quy tắc kiến trúc** của dự án, mỗi quy tắc một dòng, kèm file cụ thể. Ví dụ Soul Land: "server-authoritative: logic chỉ ở `server/src/rooms/`; số liệu cân bằng chỉ ở `shared/data.ts`; trường đồng bộ mới khai ở `schema.ts`".
- [ ] **Quy tắc dữ liệu / migration**: tên file đánh số, chạy lại an toàn, cập nhật mọi lớp lưu trữ.
- [ ] **Lệnh** (khối `bash`): cài đặt, bật hook, **một lệnh check bắt buộc sau mỗi thay đổi**, build, chạy dev, chạy test hành vi (một cách duy nhất), test khác.
- [ ] **Luật máy**: số tiến trình tối đa, cổng, cách tắt tiến trình, âm thanh.
- [ ] **Quy trình nhận việc** tóm tắt (đầu mối: `CONTRIBUTING.md`).
- [ ] **Nhánh và PR**: nhánh mới từ `origin/main`, không commit thẳng `main`, **không force push**, cập nhật bằng merge `origin/main`, commit nhỏ, không `--no-verify`; mô tả PR có: tóm tắt, cách kiểm thử, rủi ro; **đóng băng khi đang review**.
- [ ] **Danh sách skill** của dự án (mỗi skill một dòng).
- [ ] Không ghi key / bí mật vào repo, log, PR.

## B. `AGENTS.md` (cho agent không phải Claude)

- [ ] Trỏ tới `CLAUDE.md` và `CONTRIBUTING.md`; tóm tắt 5–6 luật cốt lõi (nhận việc đúng quy trình, kiểm lại trước khi làm, chỉ làm đúng issue, không đụng PR người khác, không rebase / force push, kiểm thử + "Review: đạt" có SHA 40 ký tự).

## C. `CONTRIBUTING.md` (quy trình người + agent)

Mục theo thứ tự: [Nhãn](../03-collaborator.md#1-bộ-nhãn-tối-thiểu) → Hàng chờ (lệnh `gh issue list`) → Nhận việc → Bỏ dở → Trong khi làm (kèm bảng **file hay xung đột**) → Xin review → Merge → Bảng Project.

- [ ] Bảng nhãn đầy đủ; lệnh hàng chờ; lệnh nhận / bỏ dở.
- [ ] Khai tài nguyên đánh số (migration) vào issue.
- [ ] Mẫu nhánh `<người-hoặc-agent>/<số>-<tên>`; PR nháp ngay.
- [ ] Bảng "file hay xung đột" + cách giảm xung đột từng file.
- [ ] Xin review: chạy gì, ghi kết quả ở đâu, **"Review: đạt" + dòng SHA**, đóng băng.
- [ ] Merge: CI gồm gì, CI bắt buộc hay tham khảo (**ghi đúng quyết định hiện hành**), ai merge PR của ai, squash, `--match-head-commit`.
- [ ] Bảng Project khớp nhãn.

## D. `.github/`

- [ ] `ISSUE_TEMPLATE/viec.md` (Mô tả / Tiêu chí xong / Thiết kế / Ghi chú; `labels: ["san-sang"]`) và `ISSUE_TEMPLATE/loi.md`; `config.yml`.
- [ ] `PULL_REQUEST_TEMPLATE.md`:

```markdown
Closes #

## Tóm tắt
<!-- Làm gì, vì sao; quyết định đáng chú ý. -->

## Kiểm thử
- [ ] <lệnh check>
- [ ] <lệnh build>
- [ ] <test hành vi theo CI của head cuối: link lượt chạy, ✓ / ✗ / ⚠>
- [ ] <test với DB thật khi đổi migration / lớp lưu trữ>
- [ ] Đã `git merge origin/main` ngay trước khi xin review

## Đổi chỗ dễ xung đột
- [ ] <file chung 1>: <phần nào>
- [ ] <migration mới: số đã khai trong issue>

## Ảnh
<!-- Bắt buộc nếu đổi giao diện: ảnh chụp trước / sau. -->

## Rủi ro / để sau
```

- [ ] `CODEOWNERS`: file hay xung đột và chính các tài liệu quy tắc thuộc chủ repo.
- [ ] `.github/workflows/check.yml`: job `check-build` + job bot chia nhóm + job gộp (xem [../05-testing.md](../05-testing.md)); ghim action theo SHA; `permissions: contents: read`.

## E. Git

- [ ] `.githooks/pre-commit`: `exec node tools/check.mjs --staged` (hoặc lệnh kiểm file đã stage của dự án); lệnh bật: `git config core.hooksPath .githooks`.
- [ ] Ruleset nhánh chính: chỉ qua PR, squash, **cấm force push** (cân nhắc cho mọi nhánh), cấm xóa.

## F. Agent cục bộ

- [ ] `.claude/settings.json` (commit): plugin dùng chung, hook `PostToolUse` chạy kiểm nhẹ sau Edit / Write.
- [ ] `.claude/settings.local.json` (không commit): allowlist `git`, `gh`, `npm`, `node`.
- [ ] `.claude/launch.json`: cách bật server / client cho công cụ xem trước.
- [ ] `.claude/skills/<tên>/SKILL.md`: bắt đầu với 3–4 skill cho việc lặp nhiều nhất ([khung](SKILL.md)).

## G. Ngoài repo (orchestrator)

- [ ] Thư mục artifact: `nhip-kiem-tra.md` ([mẫu](nhip-kiem-tra.md)), `cho-merge.sh` ([mẫu](cho-merge.sh)), prompt mẫu ([mẫu](prompt-mau.md)), nhật ký.
- [ ] Lịch cron một dòng; bộ nhớ (memory) với quyết định / luật / bài học.
- [ ] Tài khoản mặc định cho worker, model cho worker / reviewer.
- [ ] Id Project và id các trường / lựa chọn ghi ở mục Trạng thái của file nhịp.
