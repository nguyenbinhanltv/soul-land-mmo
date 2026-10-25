# 03. Phối hợp nhiều người: nhãn, Project, nhận việc, review, merge

## Áp dụng chung

Mục tiêu: nhiều người (mỗi người có agent AI riêng) cùng làm một repo mà **không trùng việc, không phá nhánh chính, không ai phải hỏi "ai đang làm cái này"**.

### 1. Bộ nhãn tối thiểu

| Nhóm | Nhãn | Nghĩa |
|---|---|---|
| Trạng thái | `san-sang` | Chưa ai làm, không bị chặn |
| | `dang-lam` | Đang có người / agent làm |
| | `cho-review` | PR đã tự review đạt, chờ orchestrator kiểm lại |
| | `chan` | Bị chặn (mô tả issue ghi chờ gì) |
| Chủ | `agent:<tên>` | Gắn trên **cả issue lẫn PR** khi agent làm; người làm chỉ cần assignee |
| Loại | `bug`, `gameplay`, `art`, `tai-lieu`, `bot-test`, `giao-dien`, `am-thanh`… | Loại việc, tùy dự án |
| Giai đoạn | `giai-doan-<số>` | Thuộc giai đoạn lộ trình |

Nhãn chờ một điều kiện kỹ thuật cụ thể (ví dụ chờ một quyết định hay một issue khác) nên đi cùng `chan` và trỏ tới issue giải bài toán đó.

Tạo nhãn: `gh label create "agent:<tên>" --description "Việc do <tên> làm"`.

### 2. Bảng GitHub Project

Một Project (v2) khớp nhãn issue. Trường tối thiểu:

| Trường | Kiểu | Giá trị |
|---|---|---|
| Status | single-select | Chờ / Sẵn sàng / Đang làm / Đang review / Xong |
| Chủ | single-select | mỗi người / agent + "Chưa giao" |
| Ngày xong | date | điền khi merge |
| Bước lộ trình / Giai đoạn | single-select | để nhóm và báo cáo |

**Nhãn là nguồn sự thật**; Project đi theo nhãn. Collaborator hay quên cập nhật bảng (hoặc thiếu quyền) nên orchestrator **đồng bộ hộ mỗi nhịp**: `dang-lam` → Đang làm, `cho-review` → Đang review, Chủ = nhãn `agent:<tên>`. Thiếu quyền sửa bảng thì ghi việc cần đổi vào comment "Tiến độ" của issue.

Sửa bằng CLI (cần id trường và id lựa chọn, lấy bằng `gh project field-list <số> --owner <OWNER> --format json`):

```bash
gh project item-edit --id <ITEM_ID> --project-id <PROJECT_ID> \
  --field-id <FIELD_ID> --single-select-option-id <OPTION_ID>
```

### 3. Nhận việc

1. **Lấy việc từ hàng chờ, không từ chỗ khác:**
   ```bash
   gh issue list --label san-sang --search "no:assignee -label:dang-lam -label:chan" --state open
   ```
2. **Kiểm lại ngay trước khi làm** (`gh issue view <N>`): có assignee / `dang-lam` / PR liên kết thì bỏ.
3. **Nhận:**
   ```bash
   gh issue edit <N> --add-assignee @me --add-label dang-lam --remove-label san-sang
   gh issue edit <N> --add-label agent:<tên>        # chỉ khi agent làm
   ```
   Project: Status = Đang làm, Chủ = người nhận.
4. **Tài nguyên dùng chung cần số thứ tự** (migration, file đánh số): chọn số kế tiếp rồi **ghi ngay vào issue** (`gh issue comment <N> --body "SQL: 017_<tên>.sql"`), sau khi xem số lớn nhất trên `origin/main` *và* các issue đang `dang-lam`.
5. **Nhánh từ `origin/main`**: `<người-hoặc-agent>/<số>-<tên-ngắn>`. Agent AO giữ tiền tố phiên (`ao/<phiên>/<số>-<tên>`).
6. **PR nháp ngay** (trước khi viết code):
   ```bash
   git fetch origin && git switch -c <nhánh> origin/main
   git commit --allow-empty -m "Bắt đầu #<N>: <tên việc>"
   git push -u origin <nhánh>
   gh pr create --draft --base main --title "<tên việc>" --body "Closes #<N>" --label agent:<tên>
   ```
7. **Bỏ dở thì trả việc ngay**, đừng giữ chỗ:
   ```bash
   gh issue edit <N> --remove-assignee @me --remove-label dang-lam --remove-label agent:<tên> --add-label san-sang
   gh issue comment <N> --body "Bỏ dở: <đã làm tới đâu, nhánh nào, còn gì>"
   gh pr edit <PR> --remove-label agent:<tên>
   ```
   Project: Sẵn sàng + Chưa giao.

### 4. Trong khi làm

- `git merge origin/main` thường xuyên (ít nhất mỗi ngày và trước khi xin review). **Không rebase nhánh đã push, không force push**; sửa gì sau khi push thì thêm commit mới.
- Commit nhỏ; không bỏ hook (`--no-verify`).
- **File hay xung đột** (file cấu hình / hằng số chung, manifest sinh tự động, tài liệu thiết kế): sửa đúng chỗ cần, không format lại cả file; file sinh bằng công cụ thì lấy bản `main` rồi chạy lại công cụ. Liệt kê các file này trong `CONTRIBUTING.md` và `CODEOWNERS`.
- **"Tiến độ"**: một comment trong issue cập nhật sau mỗi phần việc (đã làm gì, bước tiếp theo, PR / nhánh). Đây là bộ nhớ khi agent hết quota hoặc mất ngữ cảnh.

### 5. Tự review và "Review: đạt"

Collaborator **tự review** PR của mình rồi ghi một comment tiêu đề **`Review: đạt`**. Orchestrator đọc comment này bằng máy nên **giữ đúng chữ** và có dòng SHA đủ 40 ký tự:

```markdown
## Review: đạt
- **Công cụ:** <reviewer>
- **Head đã review:** `<SHA 40 ký tự từ git rev-parse HEAD>`
- **Kết luận:** <1–2 câu>
- **Kiểm thử:** check ✓, build ✓, bot RAM <✓/✗ theo CI>, PG <✓/✗ hoặc "không đổi server">
```

Sau đó: `gh pr ready <PR>`; issue `dang-lam` → `cho-review`; Project = Đang review; **đóng băng PR** (không push thêm trừ khi sửa theo review).

Orchestrator đọc điều kiện này như sau (bẫy đã gặp):
- Đọc **cả comment lẫn review body** (`gh pr view <N> --json comments,reviews`): có người ghi "Review: đạt" trong review body; có người **sửa comment cũ thay vì ghi comment mới**.
- So SHA trong comment với **head hiện tại** của PR; lệch tức là code đã đổi sau review, không đủ điều kiện.
- Nhãn `cho-review` nằm ở **issue**, không ở PR.
- PR còn **nháp** dù đã "Review: đạt" → comment nhắc tác giả bấm Ready (một lần).
- Issue `cho-review` mà **không có PR** (việc soát / phân tích) → orchestrator đọc báo cáo; đề xuất đã chốt thì đóng issue + Project Xong.

### 6. Orchestrator kiểm lại

PR collaborator đủ điều kiện → orchestrator spawn **worker review-only** (mẫu: [templates/prompt-mau.md](templates/prompt-mau.md), chi tiết: [04-review-code.md](04-review-code.md)). Worker comment kết quả "Orchestrator kiểm lại: **đạt**" / "**chưa đạt**" kèm "Head đã review". Đạt + CI + `MERGEABLE` thì orchestrator merge; chưa đạt thì comment điểm cần sửa. Collaborator **không tự merge**.

### 7. Luật merge

- **Squash and merge**, tiêu đề tiếng của dự án kèm số PR; `Closes #<N>` tự đóng issue. Sau merge: tick bước ở tài liệu lộ trình (nếu PR chưa tick), xóa nhánh, Project Xong + Ngày xong.
- Luôn dùng `--match-head-commit <sha>` để chắc đang merge đúng bản đã review:
  ```bash
  gh pr merge <N> --squash --match-head-commit <sha-40>
  ```
- **Head chỉ là gộp `main` + CI xanh** (không có thay đổi code mới nào so với bản đã review) → merge luôn, **không review lại**. Có commit code mới sau review → review lại ở head mới.
- CI có thể để "tham khảo, không bắt buộc" trong ruleset (chủ repo chốt); khi đó **người merge** chịu trách nhiệm đọc kết quả: đỏ do PR thì sửa, đỏ do bài chập chờn có sẵn thì ghi số issue + lượt chạy lại, đỏ do hạ tầng thì ghi lý do.

### 8. Ruleset nhánh chính

Bật cho nhánh chính: chỉ vào qua PR; chỉ cho squash; **cấm force push và xóa nhánh chính**. Nên áp dụng `target *` (mọi nhánh) cho cấm force push nếu có collaborator hay rebase nhầm. Không đổi ruleset để lách khi bị BLOCKED: báo chủ repo.

### 9. Mẫu trong `.github/`

- **ISSUE_TEMPLATE**: một mẫu "Việc" (Mô tả / Tiêu chí xong / Thiết kế / Ghi chú) có sẵn nhãn `san-sang`, một mẫu "Lỗi".
- **PULL_REQUEST_TEMPLATE.md**: `Closes #`, Tóm tắt, hộp kiểm kiểm thử, "Đổi chỗ dễ xung đột", Ảnh, Rủi ro.
- **CODEOWNERS**: các file hay xung đột và chính các tài liệu quy tắc thuộc chủ repo.

Khung trong [templates/checklist-repo-moi.md](templates/checklist-repo-moi.md).

### 10. Prompt cho collaborator và chạy liên tục

Mỗi collaborator có một bộ prompt: **cài đặt (một lần)** → **chọn / nhận việc** → **làm** → **kiểm thử, tự review, xin merge** → **sửa theo góp ý** → **bỏ dở** → **chạy liên tục (nhịp ~30 phút)**, kèm "Luật PR" dán một lần. Chế độ liên tục (đêm / hết quota tự làm tiếp) nằm ở tài liệu riêng trong repo (`docs/lam-viec-lien-tuc.md`): mỗi nhịp **dừng ở bước đầu tiên có việc** (sửa PR của mình → làm tiếp issue đang làm → xin review → nhận issue mới → nghỉ), tối đa **1 issue đang làm + 2 PR chờ review**, và comment "Tiến độ" làm bộ nhớ giữa các phiên.

## Ở Soul Land

- **Nhãn thật:** `san-sang`, `dang-lam`, `cho-review`, `chan`, `giai-doan-10`, `giai-doan-11`, `gameplay`, `art`, `tai-lieu`, `bot-test`, `giao-dien`, `am-thanh`, `agent:ao-orchestrator`, `agent:<collaborator>`.
- **Project 3** (`gh project field-list 3 --owner <OWNER>`): `Status` (Chờ / Sẵn sàng / Đang làm / Đang review / Xong), `Chủ`, `Giai đoạn` (10 / 11 / Gameplay), `Bước lộ trình`, `Ngày xong`, `Priority` (P0–P2), `Size` (XS–XL).
- **Tài nguyên cần khai số:** file `server/sql/00N_<tên>.sql` (xem `ls server/sql` trên `origin/main` mới nhất).
- **File hay xung đột:** `shared/data.ts` (thêm hằng cạnh nhóm liên quan, không đổi thứ tự), `server/src/rooms/MapRoom.ts` (tách logic ra file riêng, chỉ thêm lời gọi ngắn), `shared/assets/sprites/manifest.json` (sinh bằng `tools/assets`, không sửa tay), file thiết kế `docs/design|art|tech/…` (chỉ sửa đúng file của hệ thống đổi) và `ROADMAP.md`, `art/CREDITS.md` (thêm dòng đúng nhóm).
- **Dải cổng collaborator:** mỗi người một dải riêng cho server / PostgreSQL để không giẫm nhau (ví dụ server `3700–3799`, PostgreSQL `5700–5799`).
- **Bảng "Review: đạt":** PR mẫu có dòng `Bot: RAM <✓>/<✗>, PG <✓>/<✗ hoặc "không đổi server">`; bot RAM đọc từ CI (`gh pr checks`, `gh run view`), PostgreSQL tự chạy khi đổi `server/` hoặc `shared/`.
- **Quy trình thật:** `CONTRIBUTING.md` (nhãn, nhận việc, bỏ dở, xin review, merge, Project), `AGENTS.md` (tóm tắt cho mọi công cụ), `.github/PULL_REQUEST_TEMPLATE.md`, `.github/CODEOWNERS`, `docs/lam-viec-lien-tuc.md`.
- **Bài học riêng:** `request-changes` của review-only chặn merge ngay cả sau khi tác giả đã sửa → phải `gh pr review --approve` kèm ghi chú; một collaborator từng rebase / force push ba lần → nhắc + đề xuất thêm `target *` vào ruleset.
