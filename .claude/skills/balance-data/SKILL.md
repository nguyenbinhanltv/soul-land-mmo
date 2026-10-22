---
name: balance-data
description: Quy tắc cho số liệu cân bằng game (niên hạn, chỉ số võ hồn, hồn kỹ, kinh nghiệm, giới hạn hồn hoàn, tỉ lệ rơi, boss, giá, đấu trường). Dùng khi thêm hoặc chỉnh bất kỳ con số gameplay nào, thêm võ hồn / hồn thú / hồn kỹ / vật phẩm, hoặc khi thấy số "ma thuật" trong code server / client.
---

# Số liệu cân bằng

**Mọi số cân bằng nằm ở `shared/data.ts`.** Server, client và bot cùng import file này; không chép số sang chỗ khác (kể cả SQL, HUD, bot hay `GAME_DESIGN.md` — tài liệu chỉ trỏ tới tên hằng).

## Tìm ở đâu trong `shared/data.ts`
| Hệ thống (mục thiết kế) | Hằng / bảng / hàm |
|---|---|
| Niên hạn (5.2) | `TIERS`, `TIER_MULT`, `MAX_YEARS`, `tierOfYears`, `tierBand`, `rollYears`, `beastStats`, `formatYears` |
| Bản đồ (5.3) | `MAPS` (`level`, `years`, `shards`, `cores`, `king`, `herbs`, `world`, `exit`), `DEFAULT_MAP`, `MAP_MOVED`, `TRAVEL_CAST`, `BOAT_CAST`, `TRAVEL_LEAVE_SECS`, `CHANNEL_MAX`, `CHANNEL_CD` |
| Võ hồn, đội hình (5.1) | `HE`, `HE_IDS`, `RARITY_MULT`, `VOHON`, `vohonIndex`, `AWAKEN_GIFT`, `AWAKEN_CHOICES`, `EXTRA_VOHON`, `TEAM_SIZE`, `SWITCH_CD`, `TEAM_COMBAT_SECS`, `REVIVE_SECS`, `RESPAWN_SECS`, `PLAYER_REGEN` / `SAFE_REGEN_MULT` / `hpRegen` / `mpRegen` (hồi sinh lực / hồn lực, mục 4), `XP_SHARE_ACTIVE` / `XP_SHARE_BENCH`, `calcStats`, `CRIT`, `ATTACK_CD`, `TITLES` / `titleOf` |
| Tiên cơ (5.1) | `TIEN_CO_MAX`, `TIEN_CO_GAIN`, `TIEN_CO_IDLE_SECS`, `TIEN_CO_DECAY`, `TIEN_CO`, `TIEN_CO_RIENG` / `tienCoOf`, `TIEN_CO_SET`, `energyGain`, `tienCoDmgMult` |
| Trạng thái, hiệu ứng (5.1) | `STATUS_IDS` / `STATUS` / `statusBit`, `PLAYER_STATUS`, `SLOW_CAP`, `STATUS_TICK`, `CC_TIER_MULT`, `BUFF_IDS` / `BUFFS` / `buffBit`, `PHOENIX_FIELD_R`, `PHONG_LOI`, `BONDS` / `bondsOf` / `bondSum` / `BOND_KEYS` |
| Hồn kỹ (5.2) | `SkillDef`, `SKILLS` (dự phòng), `VOHON_SKILLS` / `skillsOf`, `VOHON_SKILLS_HIGH`, `HIGH_RINGS`, `ringSkill`, `skillChoices`, `LOADOUT_SIZE` / `DEFAULT_LOADOUT` / `parseLoadout` / `loadoutOf`, `skillPower`, `buffPower`, `BUFF_SCALE`, `PCT_HP_CAP`, `PROJ_SPEED` |
| Chân Thân (5.2) | `CHAN_THAN_RING`, `ChanThanDef`, `CHAN_THAN` / `chanThanOf` / `chanThanStats`, `CHAN_THAN_SCALE`, `CHAN_THAN_SKILL_SLOT` / `_COST` / `_CD`, `phoenixFieldR` |
| Hồn hoàn, hấp thụ (5.2) | `MAX_RINGS`, `MAX_LEVEL`, `RING_LIMIT` / `ringLimit`, `xpNeed`, `atBottleneck`, `xpBlocked`, `ABSORB_FAIL` / `absorbChance`, `ABSORB_SECS` / `absorbSecs`, `RING_ITEM`, `DROP_OWNER_SECS`, `DROP_TTL_SECS`, `PICKUP_RANGE` |
| Quy cấp (5.3) | `beastLevel`, `XP_LEVEL_CAP`, `XP_LEVEL_STEPS`, `xpLevelScale` |
| Hồn thú (5.3) | `BEASTS` / `beastIndex`, `BEAST_SKILLS` / `beastSkillOf`, `BEAST_SKILL_YEARS`, `TELE_WARN`, `TELE_FIRST`, `TELE_PAD`, `teleHits` / `teleZones`, `BEAST_REGEN`, `BEAST_AGGRO_R`, `BEAST_WANDER`, `SPAWN_CLEAR`, `RED_BEAST_CHANCE`, `BEAST_COIN` |
| Tinh anh, thú vương, boss (5.4) | `BOSSES` / `bossIndex`, `RANK_NAMES`, `ELITE`, `ELITE_RAGE`, `BEAST_BUFFS`, `BOSS_HP_PER_PLAYER` / `bossHpMult`, `KING`, `KING_TIMES`, `KING_CHEST` / `kingShardPool` / `chestCode`, `kingYears`, `SUPPORT_CONTRIB`, `WORLD`, `WORLD_TIME`, `WORLD_SLAM`, `WORLD_RING`, `WORLD_CHEST`, `worldBossOn`, `BOSS_TZ`, `vnDay` / `kingNext` / `kingActive` / `worldNext` / `worldActive`, `BOSS_CLAIM_KING` / `BOSS_CLAIM_WORLD` |
| Mảnh, sao (5.1) | `SHARD_DROP` / `shardChance`, `SHARD_QTY`, `SHARD_STACK`, `SHARD_UNLOCK`, `shardCode`, `MAX_STARS`, `STAR_COST`, `STAR_STAT`, `STAR_SKILL`, `STAR_CD_STARS` / `STAR_CD`, `STAR_TIEN_CO_STARS` / `STAR_TIEN_CO`, `starMult`, `starSkillMult`, `starCdMult`, `starTienCoMult` |
| Hồn cốt (5.5) | `BONE_SLOTS`, `BONE_DROP` / `boneChance`, `boneStats`, `boneBonus`, `BONE_SKILLS` / `boneSkillOf`, `BONE_ACTIVE_SLOTS`, `bonePassive`, `BONE_PASSIVE_CAP`, `BONE_MAX_ENHANCE`, `BONE_ENHANCE_COST`, `BONE_FEED_*`, `BONE_ENHANCE_STAT`, `BONE_ENHANCE_MILESTONES`, `BONE_MILESTONE_SKILL`, `boneFeedXp`, `boneEnhancePreview`, `boneSkillMult`, `BONE_ENHANCE_FEE` / `enhanceFee` (phí Hồn Tệ theo cấp) |
| Hồn hạch (5.6) | `CORE_SETS`, `CORE_STATS`, `CORE_STAR_K`, `CORE_SUBS`, `CORE_MAX_SUBS`, `CORE_SUB_ROLL`, `CORE_DROP` / `coreChance` / `coreStarBand`, `CORE_STAR_W`, `CORE_MAP_SET`, `rollCore`, `coreMainValue`, `coreSubMax`, `CORE_SLOTS`, `CORE_SET_FX`, `CORE_FX_RULE`, `coreFx`, `coreBonus`, `CORE_MAX_ENHANCE`, `CORE_ENHANCE_COST`, `CORE_FEED_*`, `CORE_ENHANCE_MAIN`, `CORE_SUB_EVERY`, `coreUpgradeSubs`, `coreEnhancePreview`, `CORE_ENHANCE_FEE` |
| Túi đồ, cửa hàng (5.7) | `ITEMS` / `itemDef`, `BAG_SLOTS`, `BAG_PAGE`, `BAG_EXPAND`, `BAG_MAX_SLOTS`, `BAG_EXPAND_COST` / `bagExpandCost` / `bagSlotsOf`, `DAN_CD`, `STARTER_ITEMS`, `HON_TE_NGAN` / `HON_TE_KIM` / `formatHonTe`, `SHOP`, `SHOP_MAX_QTY`, `BUYBACK_MAX`, `RING_SELL`, `BONE_SELL`, `BONE_SELL_ENH`, `CORE_SELL`, `SHARD_SELL`, `sellPrice` |
| Tiên thảo (5.7) | `HERBS`, `HERB_PCT`, `HERB_MAX`, `HERB_ELITE`, `herbChance`, `herbBonus` |
| NPC, nhiệm vụ (5.8) | `NPCS` / `npcDef`, `NPC_RANGE`, `QUESTS`, `QUEST_STARTER`, `questStatus`, `questGoalHit` |
| Tổ đội, đấu trường (5.9) | `PARTY_MAX`, `PARTY_XP_RANGE`, `PARTY_XP_BONUS` / `partyXpShare`, `PARTY_BUFF_R`, `PARTY_BUFF_MULT`, `PARTY_BUFF_SKIP`, `COPY_R`, `COPY_WINDOW`, `PARTY_INVITE_SECS`, `PARTY_OFFLINE_SECS`, `ARENA_MAP`, `ARENA`, `ARENA_SHARDS`, `eloAfter`, `arenaWindow`, `arenaPairs`, `arenaRanked` |
| Cộng minh (5.10) | `RESONANCE`, `RES_VOHON_LEVEL`, `RES_BONE_ENHANCE`, `RES_CORE_STARS`, `resonanceProgress` / `resonanceLevels` / `resonanceBonus` |
| Ngoại hình (5.11) | `SEXES`, `HAIR_STYLES`, `HAIR_COLORS`, `OUTFIT_COLORS`, `SKIN_TONES`, `DEFAULT_LOOKS`, `parseLooks`, `DIRS4` / `dir4` |
| Chung | `TILE`, `TICK_RATE` |

## Quy tắc
1. **Đối chiếu `GAME_DESIGN.md`** mục tương ứng trước khi đặt số. Số khác thiết kế có chủ đích thì ghi lý do (chú thích tiếng Việt cạnh hằng số) và sửa luôn mô tả cơ chế trong `GAME_DESIGN.md` nếu cơ chế đổi.
2. **Mã cố định:** `VOHON[].id` (lưu ở `vohons`), `BEASTS[].id`, `BOSSES[].id`, `MAPS`, `NPCS`, `ITEMS` (`items.code`), `HERBS`, `CORE_SETS`, mã nhiệm vụ… dùng trong DB và file Tiled; không bao giờ đổi hoặc xóa mã đã dùng. Thứ tự mảng dùng để đồng bộ (`p.vh`, `b.species`, bit trạng thái), nên **thêm phần tử mới vào cuối**.
3. Thêm võ hồn: một mục `VOHON` (cuối mảng), `VOHON_SKILLS` (vòng 1–4), `TIEN_CO_RIENG`, `VOHON_SKILLS_HIGH` (vòng 5, 6, 8, 9, 10), `CHAN_THAN` (kèm `skill`); cập nhật bảng võ hồn ở mục 5.1 và bảng dạng phụ thể ở `tools/assets/README.md`. Thêm loài hồn thú: `BEASTS` (cuối), `BEAST_SKILLS` nếu có từ `BEAST_SKILL_YEARS` năm, `BONE_SKILLS`.
4. Dùng đúng tên gốc Đấu La (võ hồn, chủ nhân, hồn thú, lưu phái).
5. `MapRoom.ts` còn vài số viết thẳng. Việc đang làm chạm tới số nào thì chuyển số đó vào `shared/data.ts` trong cùng thay đổi; không gom hết ngoài phạm vi việc được giao.
6. Hàm trong `data.ts` là hàm thuần (không trạng thái, không `Math.random()`; hàm cần ngẫu nhiên nhận số / hàm ngẫu nhiên do server truyền) để client dùng khi hiển thị. Quyết định kết quả chỉ ở server.

## Xong thì
`npm run check` (đổi `shared/` typecheck cả server lẫn client và chạy validate sprite), rồi bot test với server `GAME_TEST=1`.
