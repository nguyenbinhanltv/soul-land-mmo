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
- Hồn kỹ (mục 5.2, bước 2.5a): kiểu `SkillDef` (vùng tác dụng, `dmg`, trạng thái, hiệu ứng lên bản thân), `SKILLS` (4 hồn kỹ dùng chung; từ 2.5d không võ hồn nào dùng, giữ làm dự phòng), `VOHON_SKILLS` (hồn kỹ riêng theo mã võ hồn, đủ 20 võ hồn từ 2.5d) + `skillsOf(mã)`, `TIEN_CO_RIENG` + `tienCoOf(mã)`, ràng buộc `BONDS` + `bondsOf(mã võ hồn trong đội)` (2.5d, bản tối thiểu), `skillPower(năm)` / `buffPower(năm)` / `BUFF_SCALE`, `PCT_HP_CAP`, `PROJ_SPEED`, `CRIT`. Thêm hồn kỹ riêng cho võ hồn mới: chỉ thêm một mục vào `VOHON_SKILLS` (và `TIEN_CO_RIENG` nếu có), ghi bảng vào GAME_DESIGN.md 5.2.
- Trạng thái dùng chung (mục 5.1): `STATUS_IDS` / `STATUS` / `statusBit` (thứ tự là bit đồng bộ, chỉ thêm vào cuối; từ 2.5c có Mị hoặc / Mê hoặc / Làm chậm / Phong ấn, trường `slow` / `wander` / `burst`), `SLOW_CAP`, `STATUS_TICK`, `CC_TIER_MULT`, `BEAST_REGEN`; hiệu ứng có lợi `BUFF_IDS` / `BUFFS` / `buffBit` (từ 2.5b có `phoenix`: lãnh vực phượng hoàng, bán kính `PHOENIX_FIELD_R`; từ 2.5c `hide`: tàng hình; từ 2.5d `leech`: hút huyết; `PlayerState.buff` là uint16 từ 2.5d, tối đa 16 hiệu ứng). Phong Lôi Chi Lực của Lam Điện Bá Vương Long và Lôi Động Minh Thiên: `PHONG_LOI` (2.5c).
- `RING_LIMIT` / `ringLimit(slot)` (số năm tối đa theo vòng, bảng 5.2), `xpNeed(level)`, `atBottleneck(level, rings)`, `xpBlocked(level, rings)`, `MAX_RINGS`, `MAX_LEVEL`, `calcStats(vh, level, rings)`.
- Đội hình và luật gục (mục 5.1): `TEAM_SIZE`, `SWITCH_CD`, `TEAM_COMBAT_SECS`, `REVIVE_SECS`, `RESPAWN_SECS`, `XP_SHARE_ACTIVE` / `XP_SHARE_BENCH`.
- Năng lượng và chiêu tiên cơ (mục 5.1, bước 2.4): `TIEN_CO_MAX`, `TIEN_CO_GAIN`, `TIEN_CO_IDLE_SECS`, `TIEN_CO_DECAY`, `TIEN_CO` (tiên cơ chung theo hệ), `TIEN_CO_SET` + `energyGain()` / `tienCoDmgMult()` (hệ số bộ hồn hạch Tiên Cơ).
- Chiêu báo trước của hồn thú (bước 3.5, mục 5.3): `BeastSkillDef`, `BEAST_SKILLS` (theo mã loài; loài nhiều chiêu chọn theo `years`) + `beastSkillOf(loài, năm)`, `BEAST_SKILL_YEARS`, `TELE_WARN`, `TELE_FIRST`, `TELE_PAD`, `Tele` + `teleHits` (hàm thuần tính trúng). Trạng thái trên hồn sư: `PLAYER_STATUS`; Câm lặng là `noSkill` (chỉ chặn chiêu). Thêm loài săn từ 1.000 năm thì thêm chiêu vào `BEAST_SKILLS` và bảng ở GAME_DESIGN.md 5.3.
- Tinh anh / thú vương / boss (bước BĐ4, mục 5.4, 6): `BOSSES` + `bossIndex` (mã dùng trong object `elite` / `boss` của Tiled; thêm vào cuối), `RANK_NAMES`, `ELITE` (hệ số máu / sát thương / kinh nghiệm / hồn cốt, hồi sinh, phóng sprite, bán kính và các mốc giây của người tham gia), `BOSS_HP_PER_PLAYER` / `bossHpMult`, `beastBase` / `beastName` (loài gốc, tên theo `rank`), hiệu ứng có lợi của hồn thú `BEAST_BUFF_IDS` / `BEAST_BUFFS` / `beastBuffBit`, `ELITE_RAGE` (Cuồng nộ). `BeastSkillDef` từ BĐ4 có `count` / `spread` / `step` (nhiều vùng, khóa bằng `teleZones`), `summon`, `pull`; `SkillDef.dispel` (xóa buff địch).
- Hành vi hồn thú: `BEAST_AGGRO_R` (tầm phát hiện), `BEAST_WANDER` (lang thang quanh chỗ sinh), `SPAWN_CLEAR` (quanh trại cổng, cổng và điểm xuất hiện không sinh hồn thú, mục 5.8; từ BĐ3 thay `GATE_CLEAR`).
- Giảm kinh nghiệm theo chênh cấp (mục 5.3): `beastLevel(years)` (cấp tương đương tính từ `RING_LIMIT`, từ BĐ3), `XP_LEVEL_CAP`, `XP_LEVEL_STEPS`, `xpLevelScale(level, beastLv)`.
- `MAPS` (bản đồ theo `mapId`: tên, loại, cấp đề xuất, niên hạn), `DEFAULT_MAP`, `MAP_MOVED` (mã bản đồ cũ đã bỏ -> bản đồ thay thế, ví dụ `tinh_dau` -> `tinh_dau_ngoai_vi` từ BĐ3), `BEASTS` (hồn thú theo loài: mã cố định, tên; từ 3.2 không còn bậc tạm), `beastIndex(id)`.
- `TITLES`, `titleOf(level)` (danh hiệu theo cấp, mục 5.1).
- `SEXES`, `HAIR_STYLES`, `HAIR_COLORS`, `OUTFIT_COLORS`, `DEFAULT_LOOKS`, `parseLooks()` (ngoại hình hồn sư, mục 5.11). Màu chỉ lấy từ `art/palette.gpl`; thêm màu vào cuối mảng vì DB lưu chỉ số.
- `TILE`, `TICK_RATE`.
- Túi đồ, vật phẩm, Hồn Tệ (mục 5.7, bước 3.1): `ITEM_KINDS`, `ITEMS` / `itemDef()` (mã cố định, lưu ở `items.code`; thêm vào cuối, không đổi mã), `BAG_SLOTS`, `DAN_CD`, `STARTER_ITEMS`, `BEAST_COIN`, `HON_TE_NGAN` / `HON_TE_KIM`, `honTeParts()` / `formatHonTe()`.
- Hồn hoàn rơi và hấp thụ (bước 3.2, 3.3): `RING_ITEM`, `DROP_OWNER_SECS`, `DROP_TTL_SECS`, `PICKUP_RANGE`, `ABSORB_FAIL` + `absorbChance(năm, vòng)` (giới hạn, % vượt, tỉ lệ thất bại; `null` = không cho), `ABSORB_SECS` + `absorbSecs(năm)`. `beastLevel(tier)` còn theo bậc (bảng tạm) đến BĐ3.
- Mảnh võ hồn và sao (bước 3.4): `MapDef.shards` (võ hồn rơi mảnh theo bản đồ, bảng "Rơi đặc trưng" 5.3), `shardCode(id)` (mã vật phẩm `manh_<id>`, ITEMS sinh từ VOHON, `ItemDef.vohon`), `SHARD_DROP` + `shardChance(năm)`, `SHARD_QTY`, `SHARD_STACK`, `SHARD_UNLOCK`, `MAX_STARS`, `STAR_COST` + `starCost(sao)`, `STAR_STAT` + `starMult(sao)` (`calcStats` nhận `stars`).
- Hồn cốt (bước 4.1, mục 5.5): `BONE_ITEM`, `BONE_SLOTS` (6 vị trí: mã cố định lưu ở `items.stats.slot`, chỉ số chính, hệ số) + `boneSlotIndex`, `BONE_DROP` + `boneChance(năm, mult)` (`mult` = hệ số theo bậc, tinh anh `ELITE.bone`), `boneStats(vị trí, năm)` (chỉ số gốc, không lưu DB), `BONE_STAT_NAMES`, `parseBone`, `boneName`.
- Tỉ lệ rơi mỗi loại đồ một bảng (mục 5.3): `SHARD_DROP`, `BONE_DROP`; hồn hạch thêm bảng riêng ở GĐ5.

## Quy tắc
1. **Đối chiếu `GAME_DESIGN.md`** trước khi đặt số: mục 5.1 (võ hồn, kinh nghiệm), 5.2 (khoảng năm, giới hạn hấp thụ theo vòng, tỉ lệ thất bại, thời gian hấp thụ), 5.3 (vùng săn, bảng rơi đồ), 5.5–5.7. Số trong thiết kế là đề xuất, "chốt khi code"; mục ghi **(chờ chốt)** thì dùng phương án mặc định và nói rõ trong báo cáo.
2. Nếu số trong code khác thiết kế có chủ đích, ghi lại lý do (chú thích tiếng Việt cạnh hằng số) và cập nhật `GAME_DESIGN.md` trong cùng bước Lộ trình.
3. **Mã cố định**: `VOHON[].id` lưu trong DB (bảng `vohons`), `BEASTS[].id` và `MAPS` dùng trong file Tiled; không bao giờ đổi hoặc xóa mã đã dùng. Thứ tự mảng chỉ dùng để đồng bộ (`p.vh`, `b.species`); thêm võ hồn/loài mới vào cuối mảng để không đổi chỉ số của phần tử cũ đang online.
4. Dùng đúng tên gốc Đấu La theo `GAME_DESIGN.md` (võ hồn, chủ nhân, hồn thú, lưu phái).
5. `MapRoom.ts` vẫn còn vài số viết thẳng (hồi chiêu đánh, thời gian ưu tiên hồn hoàn, tốc độ hồi sinh lực…). Bước đang làm chạm tới số nào thì chuyển số đó vào `shared/data.ts` trong cùng thay đổi; không gom hết một lần ngoài phạm vi việc được giao.
6. Hàm thuần (không trạng thái, không `Math.random()`) để client cũng dùng được khi hiển thị. Phần ngẫu nhiên và quyết định kết quả chỉ ở server.

## Xong thì
`npm run check` (đổi `shared/` sẽ typecheck cả server lẫn client), rồi bot test.
