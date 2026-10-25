---
name: balance-review
description: Soát cân bằng và kinh tế MMO trên số liệu ở shared/data.ts: dòng Hồn Tệ vào / ra (BEAST_COIN, phần thưởng nhiệm vụ / khảo hạch, giá bán, SHOP, phí cường hóa, phí truyền tống), tỉ lệ rơi, đường cong kinh nghiệm, chênh lệch võ hồn / hồn kỹ, Elo đấu trường, phần thưởng boss. Dùng khi được hỏi "cân bằng có ổn không", trước khi đổi một nhóm số lớn, sau khi thêm nguồn tiền / đồ mới, hoặc khi chơi thử báo "quá dễ / quá khó / thừa tiền". Đặt số thì dùng skill balance-data; skill này chỉ phân tích và đề xuất.
---

# Soát cân bằng và kinh tế

Skill `balance-data` lo **đặt số đúng chỗ**; skill này lo **số có hợp lý không**. Kết quả là một báo cáo và đề xuất; đổi số thì quay về `balance-data` (đối chiếu `GAME_DESIGN.md`, sửa đúng mục nếu cơ chế đổi).

Ý tưởng phỏng theo skill `balance-check` và agent `economy-designer` của [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) (MIT), viết lại cho repo này.

## 0. Không có dữ liệu thì nói "chưa đánh giá"
- Ghi rõ đã đọc file / hằng nào. Mục nào thiếu mục tiêu trong file thiết kế `docs/design/` (không có khoảng mong muốn) thì ghi **Chưa đánh giá: thiếu mục tiêu**, không tự bịa ngưỡng rồi kết luận "ổn".
- Không quét thấy gì vì không có dữ liệu khác với quét thấy sạch. Báo cáo phải phân biệt hai trường hợp.

## 1. Chọn phạm vi
| Phạm vi | Đọc trong `shared/data.ts` | Đối chiếu |
|---|---|---|
| Kinh tế Hồn Tệ | nguồn vào: `BEAST_COIN`, `QUESTS` (`reward.honTe`), `DAILY` / `DAILY_POOL`, `sellPrice` (`RING_SELL`, `BONE_SELL`, `CORE_SELL`, `SHARD_SELL`); nguồn ra: `SHOP`, `BAG_EXPAND_COST`, `BONE_ENHANCE_COST`, `CORE_ENHANCE_COST`, `WAYPOINT_FEE` / `waypointFee`, mua lại (`BUYBACK_MAX`) | `docs/design/kinh-te-tui-do.md`, `npc-dia-diem.md` |
| Rơi đồ | `SHARD_DROP` / `shardChance`, `BONE_DROP`, `CORE_DROP`, `herbChance`, `RED_BEAST_CHANCE`, `KING_CHEST`, `WORLD_CHEST`, `ARENA_SHARDS` | `docs/design/vo-hon-doi-hinh.md`, `hon-thu-boss.md`, `hon-cot.md`, `hon-hach.md`, `kinh-te-tui-do.md` |
| Tiến độ | `xpNeed`, `RING_LIMIT`, `xpLevelScale`, `beastLevel`, `MAPS[].level` / `years`, `STAR_COST`, `BONE_MAX_ENHANCE`, `CORE_MAX_ENHANCE` | `docs/design/hon-hoan.md`, `the-gioi-ban-do.md` |
| Chiến đấu | `calcStats`, `RARITY_MULT`, `VOHON_SKILLS*`, `skillPower`, `CHAN_THAN`, `TIEN_CO*`, `CC_TIER_MULT`, `BOSSES`, `bossHpMult` | `docs/design/vo-hon-doi-hinh.md`, `hon-hoan.md`, `hon-thu-boss.md` |
| Đấu trường | `ARENA`, `eloAfter`, `arenaWindow`, `arenaPairs` | `docs/design/to-doi-pvp-dau-truong.md` |

Bảng đầy đủ tên hằng theo hệ thống ở skill `balance-data`.

## 2. Checklist theo phạm vi
**Kinh tế** (MMO: tiền không mất khi thua, nên chỉ có nguồn ra mới giữ giá trị)
- [ ] Lập bảng nguồn vào / nguồn ra mỗi giờ chơi ở vài mốc cấp (ví dụ 10, 30, 60), ghi giả định (số hồn thú hạ mỗi phút, tỉ lệ bán). Script tính thử chạy ngoài repo, import thẳng `shared/data.ts` (`npx tsx`), không chép số.
- [ ] Có vòng lặp tạo tiền vô hạn không: mua ở `SHOP` rồi `sellPrice` cao hơn giá mua; mua lại rẻ hơn giá bán; phần thưởng lặp lại không giới hạn lượt (`BOSS_CLAIM_*`, `DAILY`).
- [ ] Nguồn ra có lớn dần theo nguồn vào không (phí cường hóa theo bậc, phí truyền tống theo quãng); cấp cao có còn chỗ tiêu tiền.
- [ ] Món nào trong `SHOP` không bao giờ đáng mua, hoặc luôn đáng mua tới mức bắt buộc.

**Rơi đồ / tiến độ**
- [ ] Thời gian kỳ vọng để có một món mỗi bậc = 1 / (tỉ lệ × số lần thử mỗi giờ). Món hiếm có quá lâu (vài chục giờ) hay quá nhanh?
- [ ] Đường `xpNeed` và nút thắt `RING_LIMIT`: có đoạn chết (cày lâu không tiến) hay vọt (một hồn hoàn nhảy sức mạnh quá lớn)?
- [ ] Cấp / niên hạn của bản đồ (`MAPS[].level`, `years`) khớp sức mạnh kỳ vọng của hồn sư tới đó; cày bản đồ thấp có phá nhịp không (`xpLevelScale`).

**Chiến đấu / đấu trường**
- [ ] Tính DPS và thời gian hạ hồn thú cùng cấp cho mỗi võ hồn bằng `calcStats` + `skillPower` (cùng sao, cùng hồn hoàn). Lựa chọn nào **trội tuyệt đối** (hơn mọi lựa chọn khác ở mọi mặt) là lỗi nặng.
- [ ] Phòng thủ + hồi có tạo trạng thái không chết được không (khiên, hút máu, miễn khống chế cộng dồn).
- [ ] Elo: `eloAfter` đối xứng, thắng người yếu hơn nhiều không lãi; thưởng `ARENA_SHARDS` không cày được bằng thua cố ý / đánh với bạn.
- [ ] Thưởng boss: `KING_CHEST` / `WORLD_CHEST` so với công sức (thời gian, số người, `SUPPORT_CONTRIB`) và lượt nhận mỗi ngày.

## 3. Báo cáo (trong chat, hoặc comment issue nếu được giao)
```
## Soát cân bằng: <phạm vi>
Đã đọc: <hằng / hàm, file thiết kế>
Kết luận: Nghiêm trọng | Cần chỉnh | Chưa đánh giá (<thiếu gì>) | Ổn
| Hằng | Mong muốn (nguồn) | Thực tế | Vấn đề | Đề xuất |
Chiến thuật thoái hóa: <mô tả, cách tái hiện>
```
Kết luận lấy theo phát hiện nặng nhất: **Nghiêm trọng** = một lựa chọn trội tuyệt đối, tiến độ kẹt, vòng tiền không có nguồn ra; **Cần chỉnh** = lệch chỉnh số được; **Chưa đánh giá** khi có mục thiếu mục tiêu; **Ổn** chỉ khi mọi số đã so với mục tiêu.

## 4. Sau báo cáo
- Đề xuất đổi số: tạo issue (skill `playtest-triage` phần 3, nhãn `gameplay`) hoặc làm trong việc đang nhận, theo skill `balance-data`; mỗi lần đổi một nhóm nhỏ.
- Đổi số xong: `npm run check`, bot `GAME_TEST=1` (nhiều bài bot so số với chính hằng trong `shared/data.ts`, ✗ sau khi đổi số thường là bot đọc sai hằng, không phải lỗi luật).
