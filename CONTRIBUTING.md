# Cách phối hợp (nhiều người, nhiều agent)

Repo có nhiều người cùng làm, mỗi người có thể có agent AI riêng. Để không ai làm trùng việc của ai, **mọi việc đi qua issue GitHub** và theo quy trình dưới đây. Người hay agent đều theo cùng một quy trình.

Đọc trước: `CLAUDE.md` (quy tắc code, lệnh, kiểm thử) và `GAME_DESIGN.md` (mục 6 Kiến trúc là bắt buộc giữ; mục 7 Lộ trình trỏ tới số issue của từng việc).

## Nhãn

| Nhãn | Nghĩa |
| --- | --- |
| `san-sang` | Sẵn sàng nhận: chưa ai làm, không bị chặn. |
| `dang-lam` | Đang có người làm (xem assignee và nhãn chủ). |
| `cho-review` | PR đã tự review đạt (comment `Review: đạt`), chờ orchestrator AO của chủ repo kiểm tra lại và merge. |
| `chan` | Bị chặn: chờ việc khác, quyết định của chủ repo hoặc tài nguyên. Mô tả issue ghi chờ gì. |
| `can-pixellab` | Cần lượt PixelLab (thường đi cùng `chan` khi hết lượt). |
| `giai-doan-10`, `giai-doan-11` | Thuộc giai đoạn Lộ trình. |
| `gameplay`, `art`, `tai-lieu`, `bot-test` | Loại việc. |
| `agent:<tên>` | Nhãn chủ khi agent làm, gắn trên **cả issue lẫn PR** (ví dụ `agent:ao-orchestrator`). Người làm thì chỉ cần assignee. |

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
   Trên bảng Project: Status = **Đang làm**, Chủ = người / agent nhận (xem mục Bảng Project).
3. **Cần bảng / cột mới:** chọn số file SQL kế tiếp rồi **ghi ngay vào issue** (`gh issue comment <N> --body "SQL: 017_<tên>.sql"`). Trước khi chọn số, xem `ls server/sql` trên `origin/main` mới nhất **và** các issue đang `dang-lam` đã khai số nào, để hai nhánh không trùng số.
4. **Tạo nhánh từ `origin/main`** tên `<người-hoặc-agent>/<số-issue>-<tên-ngắn>`, ví dụ `an/112-hoi-vung-an-toan`, `claude-binh/115-cong-minh`. Agent AO giữ tiền tố phiên của nó (`ao/<phiên>/<số-issue>-<tên-ngắn>`).
5. **Mở PR nháp ngay** (trước khi viết code), mô tả có `Closes #<N>`, để ai cũng thấy việc đã có người làm:
   ```bash
   git fetch origin && git switch -c <nhánh> origin/main
   git commit --allow-empty -m "Bắt đầu #<N>: <tên việc>"
   git push -u origin <nhánh>
   gh pr create --draft --base main --title "<tên việc>" --body "Closes #<N>" --label agent:<tên>   # --label chỉ khi agent làm
   ```
   PR của agent quên nhãn thì gắn bù: `gh pr edit <số> --add-label agent:<tên>`.
6. Việc to (ví dụ "nhận theo từng bản đồ") thì ghi phần mình nhận vào bình luận issue, hoặc tách issue con rồi nhận issue con.

Agent chạy liên tục (cả ban đêm, tự làm tiếp sau khi hết quota): theo luật và cách chạy ở `docs/lam-viec-lien-tuc.md`.

## Bỏ dở

Không làm tiếp được thì trả việc ngay, đừng giữ chỗ:

```bash
gh issue edit <N> --remove-assignee @me --remove-label dang-lam --remove-label agent:<tên> --add-label san-sang
gh issue comment <N> --body "Bỏ dở: <đã làm tới đâu, nhánh nào, còn gì>"
gh pr edit <PR> --remove-label agent:<tên>   # agent: gỡ nhãn chủ ở cả PR
gh pr close <PR>     # hoặc để PR nháp lại cho người sau, ghi rõ trong bình luận
```

Trên bảng Project: Status = **Sẵn sàng**, Chủ = **Chưa giao**.

Bị chặn (chờ việc khác / quyết định) thì thay `dang-lam` bằng `chan` và ghi chờ gì.

## Trong khi làm

- **Cập nhật nhánh bằng `git merge origin/main`** thường xuyên (ít nhất mỗi ngày và trước khi xin review). **Không rebase nhánh đã push, không force push.** Cần sửa gì sau khi đã push thì thêm commit mới.
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
| `art/CREDITS.md` | Thêm dòng đúng nhóm, không sắp xếp lại. Asset ngoài nào cũng một dòng (tác giả, URL, giấy phép, file, có sửa gì), SA / GPL / NC ghi cờ (luật ở `GAME_DESIGN.md` 5.11). |

Các file này có chủ repo trong `.github/CODEOWNERS`.

## Xin review

1. Chạy và ghi kết quả vào mô tả PR (mẫu PR có sẵn ô đánh dấu):
   - `npm run check` và `npm run build`;
   - bot với server `GAME_TEST=1` ở chế độ RAM: job CI `bot-ram` tự chạy mỗi lần push (mục Merge), ghi kết quả của head cuối vào PR; tự chạy ở máy khi gỡ lỗi hoặc thêm luồng bot mới, **chỉ bằng `npm run bot:local -- --only <nhóm>`** (hoặc `--part 1|2|3`, `--channels`; `CLAUDE.md` phần Lệnh): công cụ tự bật server nhẹ ở cổng trống, tự dọn, và giới hạn tối đa 2 lượt bot cùng lúc trên cả máy. Agent không tự bật server rời hay embedded-postgres riêng để chạy bot;
   - PR đổi `server/` hoặc `shared/`: thêm lượt bot với **PostgreSQL** (bắt buộc khi đổi SQL / `db.ts`): `npm run bot:local -- --only <nhóm> --pg` (PostgreSQL chung của máy, database riêng mỗi lượt, server bật hai lần liên tiếp rồi bot);
   - đổi giao diện / ảnh: ảnh chụp trong game.
2. `git merge origin/main` lần cuối, chạy lại `npm run check`.
3. **Tự review PR của mình:** chạy reviewer (AO review nếu có, hoặc reviewer của agent, ví dụ `/code-review`), sửa hết góp ý, review lại tới khi đạt. Ghi kết quả vào một comment PR có tiêu đề **`Review: đạt`**: công cụ review, SHA head đã review, kết luận. Comment bắt buộc có dòng (SHA đủ 40 ký tự, lấy bằng `git rev-parse HEAD`):
   ```
   **Head đã review:** `<SHA 40 ký tự>`
   ```
4. `gh pr ready <PR>`; trên issue thay `dang-lam` bằng `cho-review`; trên bảng Project: Status = **Đang review**.
5. **Đóng băng khi đang review:** không push thêm (kể cả merge `main`) trừ khi sửa theo review hoặc được yêu cầu. Sửa code sau khi đã xin merge thì review lại và cập nhật dòng `Head đã review` với SHA head mới (sửa comment `Review: đạt` cũ hoặc ghi comment mới).

## Merge

- **CI** (`.github/workflows/check.yml`) chạy trên mọi PR vào `main` và mỗi push vào `main`, hai job / status check:
  - `check-build` (ubuntu + Windows): `npm ci` (server + client, cài đúng lockfile), bài âm thanh, `npm run check`, `npm run build`.
  - `bot-ram` (ubuntu): bot trên server mới bật `GAME_TEST=1` chế độ RAM, chia 3 job song song `bot-ram (nhóm 1|2|3)` theo `BOT_PART` (bot đầy đủ ~17,5 phút; nhóm nào chạy đoạn nào ghi ở đầu phần `BOT_PART` trong `client/scripts/bot-test.mjs`); nhóm 1 chạy thêm `test:predict`, `test:ratelimit`, `test:accounts` và lượt nhiều kênh (`CHANNEL_MAX=2`). Job `bot-ram` gộp kết quả 3 nhóm. Mỗi lượt qua `tools/ci/bot-run.sh` (chạy được ở máy Linux / macOS: `BOT_PART=2 bash tools/ci/bot-run.sh nhom-2`). Bot trượt thì in log server, log đầy đủ ở artifact `bot-logs-<nhóm>` của lượt chạy.
  - CI **chỉ để tham khảo**, không là status check bắt buộc trong bảo vệ nhánh `main` (chủ repo chốt, không đổi ruleset). CI đỏ thì đọc log: lỗi do PR thì sửa, bot chập chờn thì xử lý theo skill `bot-flakiness`, lỗi hạ tầng (GitHub Actions, mạng) thì ghi lý do trong PR.
  - **Reviewer dùng kết quả CI cho bot RAM**, không tự chạy lại bot RAM: `gh pr checks <PR>` (`bot-ram` và 3 nhóm của đúng head đang review), `gh run view <run-id>` in annotation số dòng ✓ / ✗ / ⚠ của từng nhóm và các dòng ✗ (bảng đầy đủ kèm dòng ⚠ ở trang lượt chạy, mục Summary), đỏ thì `gh run view <run-id> --log-failed`. Head chưa có lượt `bot-ram` xong (đang chạy, bị hủy) thì chờ lượt mới. Lượt **PostgreSQL** CI chưa có: PR đổi SQL / `db.ts` thì reviewer vẫn tự chạy bằng `npm run bot:local -- --only <nhóm> --pg` (mục Xin review).
- PR của orchestrator AO: orchestrator tự merge khi review AO đạt (xem kết quả CI `check-build`, `bot-ram` để tham khảo; CI đỏ thì tìm nguyên nhân trước khi merge).
- PR của người cộng tác: orchestrator AO của chủ repo kiểm tra lại PR có `cho-review` và comment `Review: đạt` (review độc lập, chạy check / bot nếu cần). Đạt thì orchestrator merge vào `main`; chưa đạt thì comment góp ý trên PR. Người cộng tác **không tự merge**.
- Dùng **Squash and merge**, tiêu đề tiếng Việt kèm số PR. `Closes #<N>` tự đóng issue.
- Sau khi merge: đánh dấu bước ở `GAME_DESIGN.md` mục 7 (nếu PR chưa làm), xóa nhánh.

## Bảng Project

Bảng GitHub Project 3 của repo phải khớp nhãn issue. Trường Status đi theo nhãn: **Chờ** (`chan`), **Sẵn sàng** (`san-sang`), **Đang làm** (`dang-lam`), **Đang review** (`cho-review`), **Xong** (issue đóng). Trường Chủ là người / agent đang làm.

| Lúc | Nhãn issue | Project |
| --- | --- | --- |
| Nhận việc | `dang-lam` | Status = Đang làm, Chủ = người / agent nhận |
| Xin review | `cho-review` | Status = Đang review |
| Bỏ dở | `san-sang` | Status = Sẵn sàng, Chủ = Chưa giao |

Nhãn là nguồn sự thật. Không sửa được bảng (thiếu quyền) thì ghi việc cần đổi vào comment `Tiến độ` của issue; orchestrator AO đồng bộ hộ.
