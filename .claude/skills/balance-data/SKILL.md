---
name: balance-data
description: Quy tắc cho số liệu cân bằng game (niên hạn, chỉ số võ hồn, hồn kỹ, kinh nghiệm, giới hạn hồn hoàn, tỉ lệ rơi). Dùng khi thêm hoặc chỉnh bất kỳ con số gameplay nào, thêm võ hồn/hồn thú/hồn kỹ, hoặc khi thấy số "ma thuật" trong code server/client.
---

# Số liệu cân bằng

**Mọi số cân bằng nằm ở `shared/data.ts`.** Server và client cùng import file này; không chép số sang chỗ khác (kể cả bot test, SQL hay HUD).

## Có gì trong `shared/data.ts`
- `TIERS` (5 bậc niên hạn: `years` là mốc năm, tên màu `color`, máu/sát thương/kinh nghiệm hồn thú ở đúng mốc, `atkb`/`hpb` cộng cho hồn hoàn), `TIER_MULT`, `tierOfYears(years)`.
- Niên hạn theo số năm (bước 3.2): `MAX_YEARS`, `tierBand(tier)`, `rollYears(lo, hi, r)` (tuổi hồn thú, phân bố log; `r` do server tung), `beastStats(years)` (máu, sát thương, kinh nghiệm nội suy giữa các mốc `TIERS`), `formatYears`. Khoảng năm của từng vùng nằm ở thuộc tính `years` trong file Tiled (`tools/gen-map.mjs`).
- `HE` (4 hệ: hệ số `atk/hp/mp/spd/def`), `RARITY_MULT`, `VOHON` (danh sách võ hồn tạo bằng hàm `vh(...)`), `vohonIndex(id)`.
- `SKILLS` (4 hồn kỹ dùng chung: `cost`, `cd`), `ringLimit(slot)`, `xpNeed(level)`, `atBottleneck(level, rings)`, `MAX_RINGS`, `calcStats(vh, level, rings)`.
- Đội hình và luật gục (mục 5.1): `TEAM_SIZE`, `SWITCH_CD`, `TEAM_COMBAT_SECS`, `REVIVE_SECS`, `RESPAWN_SECS`, `XP_SHARE_ACTIVE` / `XP_SHARE_BENCH`.
- Năng lượng và chiêu tiên cơ (mục 5.1, bước 2.4): `TIEN_CO_MAX`, `TIEN_CO_GAIN`, `TIEN_CO_IDLE_SECS`, `TIEN_CO_DECAY`, `TIEN_CO` (tiên cơ chung theo hệ), `TIEN_CO_SET` + `energyGain()` / `tienCoDmgMult()` (hệ số bộ hồn hạch Tiên Cơ).
- Giảm kinh nghiệm theo chênh cấp (mục 5.3): `beastLevel(tier)` (tạm theo bậc đến BĐ3), `XP_LEVEL_CAP`, `XP_LEVEL_STEPS`, `xpLevelScale(level, beastLv)`.
- `MAPS` (bản đồ theo `mapId`: tên, loại, cấp đề xuất, niên hạn), `DEFAULT_MAP`, `BEASTS` (hồn thú theo loài: mã cố định, tên; từ 3.2 không còn bậc tạm), `beastIndex(id)`.
- `TITLES`, `titleOf(level)` (danh hiệu theo cấp, mục 5.1).
- `SEXES`, `HAIR_STYLES`, `HAIR_COLORS`, `OUTFIT_COLORS`, `DEFAULT_LOOKS`, `parseLooks()` (ngoại hình hồn sư, mục 5.11). Màu chỉ lấy từ `art/palette.gpl`; thêm màu vào cuối mảng vì DB lưu chỉ số.
- `TILE`, `TICK_RATE`.
- Túi đồ, vật phẩm, Hồn Tệ (mục 5.7, bước 3.1): `ITEM_KINDS`, `ITEMS` / `itemDef()` (mã cố định, lưu ở `items.code`; thêm vào cuối, không đổi mã), `BAG_SLOTS`, `DAN_CD`, `STARTER_ITEMS`, `BEAST_COIN`, `HON_TE_NGAN` / `HON_TE_KIM`, `honTeParts()` / `formatHonTe()`.
- Hồn hoàn rơi và hấp thụ (bước 3.2): `RING_ITEM`, `DROP_OWNER_SECS`, `DROP_TTL_SECS`, `PICKUP_RANGE`, `absorbSecs(tier)`, `ABSORB_RISK`, `ABSORB_FAIL_HP` (luật bậc cũ, 3.3 thay bằng giới hạn theo năm).
- Thiết kế còn nhắc bảng `DROPS` (tỉ lệ rơi, mục 5.3): **chưa có**, khi làm thì thêm vào đây.

## Quy tắc
1. **Đối chiếu `GAME_DESIGN.md`** trước khi đặt số: mục 5.1 (võ hồn, kinh nghiệm), 5.2 (khoảng năm, giới hạn hấp thụ theo vòng, tỉ lệ thất bại, thời gian hấp thụ), 5.3 (vùng săn, bảng rơi đồ), 5.5–5.7. Số trong thiết kế là đề xuất, "chốt khi code"; mục ghi **(chờ chốt)** thì dùng phương án mặc định và nói rõ trong báo cáo.
2. Nếu số trong code khác thiết kế có chủ đích, ghi lại lý do (chú thích tiếng Việt cạnh hằng số) và cập nhật `GAME_DESIGN.md` trong cùng bước Lộ trình.
3. **Mã cố định**: `VOHON[].id` lưu trong DB (bảng `vohons`), `BEASTS[].id` và `MAPS` dùng trong file Tiled; không bao giờ đổi hoặc xóa mã đã dùng. Thứ tự mảng chỉ dùng để đồng bộ (`p.vh`, `b.species`); thêm võ hồn/loài mới vào cuối mảng để không đổi chỉ số của phần tử cũ đang online.
4. Dùng đúng tên gốc Đấu La theo `GAME_DESIGN.md` (võ hồn, chủ nhân, hồn thú, lưu phái).
5. `MapRoom.ts` vẫn còn vài số viết thẳng (hồi chiêu đánh, thời gian ưu tiên hồn hoàn, tốc độ hồi sinh lực…). Bước đang làm chạm tới số nào thì chuyển số đó vào `shared/data.ts` trong cùng thay đổi; không gom hết một lần ngoài phạm vi việc được giao.
6. Hàm thuần (không trạng thái, không `Math.random()`) để client cũng dùng được khi hiển thị. Phần ngẫu nhiên và quyết định kết quả chỉ ở server.

## Xong thì
`npm run check` (đổi `shared/` sẽ typecheck cả server lẫn client), rồi bot test.
