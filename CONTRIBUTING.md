# Cách phối hợp (nhiều người, nhiều agent)

Repo có nhiều người cùng làm, mỗi người có thể có agent AI riêng. Để không ai làm trùng việc của ai, **mọi việc đi qua issue GitHub** và theo quy trình dưới đây. Người hay agent đều theo cùng một quy trình.

Đọc trước: `CLAUDE.md` (quy tắc code, lệnh, kiểm thử) và `GAME_DESIGN.md` (mục 6 Kiến trúc là bắt buộc giữ; mục 7 Lộ trình trỏ tới số issue của từng việc).

## Nhãn

| Nhãn | Nghĩa |
| --- | --- |
| `san-sang` | Sẵn sàng nhận: chưa ai làm, không bị chặn. |
| `dang-lam` | Đang có người làm (xem assignee và nhãn chủ). |
| `cho-review` | PR đã mở và đã xin review. |
| `chan` | Bị chặn: chờ việc khác, quyết định của chủ repo hoặc tài nguyên. Mô tả issue ghi chờ gì. |
| `can-pixellab` | Cần lượt PixelLab (thường đi cùng `chan` khi hết lượt). |
| `giai-doan-10`, `giai-doan-11` | Thuộc giai đoạn Lộ trình. |
| `gameplay`, `art`, `tai-lieu`, `bot-test` | Loại việc. |
| `agent:<tên>` | Nhãn chủ khi agent làm (ví dụ `agent:ao-orchestrator`). Người làm thì chỉ cần assignee. |

## Hàng chờ

Việc được nhận là issue **mở, có `san-sang`, chưa giao cho ai, không có `dang-lam` hay `chan`**:

```bash
gh issue list --label san-sang --search "no:assignee -label:dang-lam -label:chan" --state open
```

Orchestrator / agent tự động đọc hàng chờ bằng đúng lệnh này, không lấy việc từ chỗ khác.

## Nhận việc

1. **Kiểm issue ngay trước khi làm** (`gh issue view <N>`): đã có assignee, `dang-lam` hoặc PR liên kết thì **không làm**, chọn việc khác. Việc chưa có issue thì tạo issue trước (mẫu "Việc lộ trình" hoặc "Lỗi").
2. **Nhận:** tự gán, đổi nhãn, thêm nhãn chủ nếu là agent:
   ```bash
   gh issue edit <N> --add-assignee @me --add-label dang-lam --remove-label san-sang
   gh issue edit <N> --add-label agent:<tên>        # chỉ khi agent làm; nhãn chưa có thì tạo: gh label create agent:<tên>
   ```
3. **Cần bảng / cột mới:** chọn số file SQL kế tiếp rồi **ghi ngay vào issue** (`gh issue comment <N> --body "SQL: 017_<tên>.sql"`). Trước khi chọn số, xem `ls server/sql` trên `origin/main` mới nhất **và** các issue đang `dang-lam` đã khai số nào, để hai nhánh không trùng số.
4. **Tạo nhánh từ `origin/main`** tên `<người-hoặc-agent>/<số-issue>-<tên-ngắn>`, ví dụ `an/112-hoi-vung-an-toan`, `claude-binh/115-cong-minh`. Agent AO giữ tiền tố phiên của nó (`ao/<phiên>/<số-issue>-<tên-ngắn>`).
5. **Mở PR nháp ngay** (trước khi viết code), mô tả có `Closes #<N>`, để ai cũng thấy việc đã có người làm:
   ```bash
   git fetch origin && git switch -c <nhánh> origin/main
   git commit --allow-empty -m "Bắt đầu #<N>: <tên việc>"
   git push -u origin <nhánh>
   gh pr create --draft --base main --title "<tên việc>" --body "Closes #<N>"
   ```
6. Việc to (ví dụ "nhận theo từng bản đồ") thì ghi phần mình nhận vào bình luận issue, hoặc tách issue con rồi nhận issue con.

## Bỏ dở

Không làm tiếp được thì trả việc ngay, đừng giữ chỗ:

```bash
gh issue edit <N> --remove-assignee @me --remove-label dang-lam --remove-label agent:<tên> --add-label san-sang
gh issue comment <N> --body "Bỏ dở: <đã làm tới đâu, nhánh nào, còn gì>"
gh pr close <PR>     # hoặc để PR nháp lại cho người sau, ghi rõ trong bình luận
```

Bị chặn (chờ việc khác / quyết định) thì thay `dang-lam` bằng `chan` và ghi chờ gì.

## Trong khi làm

- **Cập nhật nhánh bằng `git merge origin/main`** thường xuyên (ít nhất mỗi ngày và trước khi xin review). **Không rebase nhánh đã push, không force push.**
- Commit nhỏ, thông điệp tiếng Việt. Không bỏ pre-commit hook (`--no-verify`).
- Luật chơi chỉ ở server, số liệu chỉ ở `shared/data.ts` (xem `CLAUDE.md`).
- Không ghi key PixelLab hay bí mật nào vào repo, log, issue, PR.

### File hay xung đột

Nhiều việc cùng sửa các file sau. Sửa đúng chỗ cần, **không format lại hay sắp xếp lại cả file**, merge `origin/main` sớm khi thấy người khác cũng đang sửa:

| File | Cách giảm xung đột |
| --- | --- |
| `shared/data.ts` | Thêm hằng mới cạnh nhóm liên quan, không đổi thứ tự / đổi tên hằng có sẵn ngoài phạm vi việc. |
| `server/src/rooms/MapRoom.ts` | Tách logic mới thành hàm / file riêng khi được, chỉ thêm lời gọi ngắn trong `MapRoom`. |
| `shared/assets/sprites/manifest.json` | Sinh bằng dây chuyền `tools/assets`, không sửa tay; xung đột thì lấy bản `main` rồi chạy lại công cụ. |
| `GAME_DESIGN.md` | Chỉ sửa đúng mục của luật đổi và dòng của mình ở mục 7. |
| `art/CREDITS.md` | Thêm dòng đúng nhóm, không sắp xếp lại. |

Các file này có chủ repo trong `.github/CODEOWNERS`.

## Xin review

1. Chạy và ghi kết quả vào mô tả PR (mẫu PR có sẵn ô đánh dấu):
   - `npm run check` và `npm run build`;
   - bot với server `GAME_TEST=1` ở chế độ RAM (`CLAUDE.md` phần Lệnh);
   - PR đổi `server/` hoặc `shared/`: thêm lượt bot với **PostgreSQL** (bắt buộc khi đổi SQL / `db.ts`; server chạy hai lần liên tiếp);
   - đổi giao diện / ảnh: ảnh chụp trong game.
2. `git merge origin/main` lần cuối, chạy lại `npm run check`.
3. `gh pr ready <PR>`; trên issue thay `dang-lam` bằng `cho-review`.
4. **Đóng băng khi đang review:** không push thêm (kể cả merge `main`) trừ khi sửa theo review hoặc được yêu cầu.

## Merge

- PR của orchestrator AO: orchestrator tự merge khi review AO đạt (và CI đạt, khi đã có CI ở #122).
- PR của người cộng tác: người đó hoặc chủ repo merge sau khi review đạt.
- Dùng **Squash and merge**, tiêu đề tiếng Việt kèm số PR. `Closes #<N>` tự đóng issue.
- Sau khi merge: đánh dấu bước ở `GAME_DESIGN.md` mục 7 (nếu PR chưa làm), xóa nhánh.

## Bảng Project

Nếu repo có bảng GitHub Project, trạng thái đi theo nhãn: **Chờ** (`chan`), **Sẵn sàng** (`san-sang`), **Đang làm** (`dang-lam`), **Đang review** (`cho-review`), **Xong** (issue đóng). Nhãn là nguồn sự thật; bảng chỉ để xem.
