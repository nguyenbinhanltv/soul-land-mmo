# 06. Skill, MCP và dịch vụ ngoài

## Áp dụng chung

### 1. Skill là gì, khi nào nên viết

Skill là một thư mục `.claude/skills/<tên>/SKILL.md` (kèm file phụ nếu cần). Frontmatter có `name` và `description`; agent chỉ nạp phần thân khi mô tả khớp việc đang làm. Nên viết skill khi:
- một **quy trình lặp lại** nhiều lần và hay bị làm sai (ví dụ đặt số cân bằng, thêm migration, xử lý bài chập chờn);
- có **checklist** hay **bẫy** mà agent mới không thể đoán;
- quy trình **dài quá cho `CLAUDE.md`** (giữ `CLAUDE.md` ngắn, trỏ tới skill).

Không viết skill cho thứ có sẵn trong code (cấu trúc thư mục) hoặc chỉ dùng một lần.

Nguyên tắc viết:
1. **`description` trả lời "khi nào dùng"**, liệt kê từ khóa và tình huống thật (agent chọn skill theo mô tả này). Cuối mô tả nên có câu "Dùng khi …".
2. **Mở đầu bằng luật nền** (một đoạn), rồi **checklist đánh số**, rồi **bảng bẫy đã gặp** (dấu hiệu → cách sửa).
3. **Trỏ tới file thật và lệnh thật** của repo (`npm run check`, đường dẫn), không mô tả chung chung.
4. **Một skill một việc**; skill phân tích (soát) tách khỏi skill thao tác (đặt số). Skill soát chỉ ra báo cáo / đề xuất, không sửa.
5. **Ngắn, chủ yếu là checklist.** Chi tiết dài đẩy xuống file phụ cùng thư mục.
6. Có ý tưởng phỏng theo nguồn ngoài thì **ghi nguồn và giấy phép**; viết lại cho đúng dự án, không chép.
7. Sửa skill như sửa code: đi qua PR, có người duyệt.

Khung mẫu có thể chép: [templates/SKILL.md](templates/SKILL.md).

### 2. Cấu hình dùng chung của agent

`.claude/settings.json` (commit) chứa: plugin bật cho cả nhóm, và **hook** `PostToolUse` chạy kiểm tĩnh sau mỗi lần agent sửa file. `.claude/settings.local.json` là file riêng từng máy (quyền, allowlist lệnh), **không commit và không sửa hộ người khác**. `.claude/launch.json` khai báo cách bật server / client để công cụ xem trước.

Chạy không người trông (đêm): cấp trước quyền cho `git`, `gh`, `npm`, `node` trong `permissions.allow` (hoặc `--allowedTools` với `claude -p`); không dùng chế độ tắt hẳn sandbox; chạy trong clone / worktree riêng.

### 3. MCP và plugin: cách quản

- MCP server (công cụ ngoài như sinh ảnh, tra tài liệu) đăng ký ở **user scope** trên máy chạy agent; mã và **bí mật nằm ngoài repo**. Repo chỉ ghi *tên MCP, tham số, cách gọi*, không ghi key.
- Mỗi MCP có **người chịu trách nhiệm** và tài liệu "cách dùng, nhịp máy, sự cố đã gặp" ở thư mục artifact.
- Sửa MCP (đổi tham số, workflow) thì **phiên đang mở giữ tiến trình MCP cũ**: phiên mới mới thấy tham số mới (workflow JSON đọc lại mỗi lần gọi nên có hiệu lực ngay).
- Kiểm: `claude mcp list` → thấy `✔ Connected`.
- Gỡ MCP không dùng nữa, xóa key liên quan khỏi mọi nơi (kể cả bản sao cấu hình) khi người dùng quyết định bỏ dịch vụ.

### 4. Đánh giá dịch vụ ngoài trước khi phụ thuộc

Câu hỏi bắt buộc: *có API ổn định không? tốn phí / hạn mức ra sao? kết quả đúng nhu cầu (độ nét, giấy phép) không? có thể bị tắt giữa chừng không? bí mật có phải nằm trong file cấu hình cứng không?* Thử **một lô nhỏ** và để người dùng duyệt kết quả trước khi giao hàng loạt. Dịch vụ bị loại thì ghi **lý do** (ở dưới) để không ai đề xuất lại.

## Ở Soul Land

### 11 skill của dự án (`.claude/skills/`)

| Skill | Dùng khi | Ý chính |
|---|---|---|
| `roadmap-step` | Được giao một bước Lộ trình hoặc một việc "để sau" | Đọc thiết kế → code → check → bot → cập nhật thiết kế → đánh dấu xong; mỗi gạch đầu dòng mục 7 là **một** lần giao việc |
| `server-feature` | Làm bất cứ tính năng gameplay | Checklist server-authoritative: message từ client, trạng thái đồng bộ, dữ liệu riêng của chính chủ, lưu DB |
| `client-ui` | Sửa giao diện / điều khiển phía client | Client chỉ hiển thị + gửi ý định; HUD, phím / chuột, chạm, isometric |
| `db-migration` | Cần bảng / cột / chuyển dữ liệu | File `server/sql/00N_*.sql` chạy lại an toàn, RLS, cập nhật `PgStore` + `MemoryStore` |
| `balance-data` | Thêm / chỉnh bất kỳ số gameplay | Mọi số ở `shared/data.ts`; không "số ma thuật" |
| `asset-gen` | Làm ảnh và đưa vào game | Quy cách ảnh, chọn nguồn, ComfyUI, dây chuyền `tools/assets`, CREDITS |
| `balance-review` | "Cân bằng có ổn không", đổi nhóm số lớn, kinh tế Hồn Tệ | **Phân tích + đề xuất** (đặt số vẫn theo `balance-data`) |
| `anti-cheat-audit` | Trước mở server cho người ngoài, review PR thêm message / API / thưởng | Đóng vai kẻ gian lận cầm client sửa được; checklist theo `server/src/rooms/*` |
| `soak-perf` | Thêm vòng lặp / truy vấn vị trí, đổi đồng bộ, nghi chậm / rò | Nhiều bot trên bản đồ ×8, đo tick / bản vá / băng thông / bộ nhớ; không có số đo thì ghi "Chưa đo" |
| `bot-flakiness` | Bot ✗ mà nghi không phải lỗi của việc đang làm | Tái hiện N lượt, đối chứng main, chờ theo state, ghi issue |
| `playtest-triage` | Nhận phản hồi chơi thử lộn xộn | Tách quan sát, phân loại, lọc trùng, tạo issue đúng mẫu + nhãn + Project |

Năm skill soát chất lượng (`balance-review` → `playtest-triage`) phỏng theo [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) (MIT), viết lại bằng tiếng Việt cho repo này; **không** cài agent, hook hay mẫu tài liệu của bộ đó.

### Cấu hình thật

- Plugin bật trong `.claude/settings.json`: `typescript-lsp`, `context7`, `security-guidance`, `feature-dev`, `pr-review-toolkit`, `code-simplifier` (marketplace `claude-plugins-official`). `context7` cần đăng nhập lần đầu; `typescript-lsp` cần `npm i -g typescript-language-server typescript`.
- Hook `PostToolUse` (Edit / Write / MultiEdit) chạy `node tools/check.mjs --hook`; báo lỗi TypeScript thì sửa ngay. (`--hook` đọc JSON từ stdin nên **chạy tay sẽ treo**; chạy tay dùng `npm run check`.)
- `.claude/launch.json`: `server` (`npm run dev:server`, cổng 2567) và `client` (`npm run dev:client`, cổng 5173).
- `/code-review` và `pr-review-toolkit` dùng để tự review khi chưa có AO review.

### MCP đang dùng

| MCP | Việc | Ghi chú |
|---|---|---|
| `comfyui-pixel` | Sinh ảnh pixel art qua ComfyUI tự host (`generate_pixel_art`) | `server.py` + workflow JSON ngoài repo; Mac trong LAN `http://<MAC_IP>:8188`; cách dùng ở [07-asset-pipeline.md](07-asset-pipeline.md) |
| `context7` (plugin) | Tra tài liệu thư viện | Cần đăng nhập lần đầu |

### Dịch vụ đã đánh giá và loại

| Dịch vụ | Kết cục | Lý do |
|---|---|---|
| **PixelLab** (sinh pixel art, nhân vật 8 hướng) | Bỏ hẳn từ 2026-10-23 (MCP gỡ, key xóa) | Gói thử hết lượt nhanh, lỗi 429 vẫn trừ lượt, sau đó tắt lượt miễn phí cho mọi key thử (HTTP 402); ảnh vẫn phải tô lại mắt / áo; hoạt ảnh nhiều nhân vật hỏng; chi phí không dự đoán được |
| **Pollinations** | Không dùng | Cần key cho endpoint chính; host cũ có watermark, model nhẹ, ra JPEG |
| **Hugging Face Inference** | Gỡ MCP | Token chỉ-đọc không có quyền "Inference Providers"; tài khoản miễn phí không có credit suy luận hằng tháng; token nằm cứng trong file cấu hình MCP |
| **Perchance** | Loại | Không có API, chặn bot |
| **Gemini (web, nhập tay)** | Giữ cho biểu tượng, chân dung, ô nền hiện có | Không có API tự động; mỗi ảnh phải mở **cuộc trò chuyện mới** (cùng cuộc thì vẽ lại nội dung lượt trước); ô nền chỉ ra đúng tỉ lệ khi đính kèm khuôn |
| **LPC (Universal LPC Spritesheet Generator)** | Giữ cho NPC phụ, dân thường, lính gác, thú tạm | Phong cách chibi 4 hướng lệch với nhân vật chính; chỉ lớp CC0 / CC-BY / OGA-BY; ghi giấy phép từng lớp |
| **ComfyUI tự host** | **Công cụ ảnh chính** | Không tốn lượt, giữ được quy trình, ảnh tĩnh tốt; xem 07 |

Bài học chọn dịch vụ: thử một lô nhỏ và để người dùng duyệt **trước** khi giao hàng loạt; ghi lý do loại; không giữ key / token trong repo, log, PR, tin nhắn cho worker.
