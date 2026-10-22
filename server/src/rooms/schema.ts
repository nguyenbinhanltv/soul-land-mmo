// Trạng thái được Colyseus tự đồng bộ xuống mọi client.
import { Schema, MapSchema, ArraySchema, type, view } from "@colyseus/schema";

export class PlayerState extends Schema {
  @type("string") name: string = "";
  @type("uint8") vh: number = 0;
  // Ngoại hình hồn sư (mục 5.11): chỉ số trong SEXES, HAIR_STYLES[sex], HAIR_COLORS, OUTFIT_COLORS, SKIN_TONES (shared/data.ts).
  @type("uint8") sex: number = 0;
  @type("uint8") hair: number = 0;
  @type("uint8") hairCol: number = 0;
  @type("uint8") outfitCol: number = 0;
  @type("uint8") skin: number = 0;     // từ 9.9: tông da, tài khoản cũ là 0
  @type("float32") x: number = 0;
  @type("float32") y: number = 0;
  @type("uint8") dir: number = 0;      // hướng nhìn 4 phía, chỉ số trong DIRS4 (shared/data.ts): 0 xuống, 1 phải, 2 lên, 3 trái (thay `face` = ±1)
  @type("boolean") moving: boolean = false;
  // Dự đoán chuyển động phía client (mục 6): số thứ tự `input` cuối server đã nhận, số giây hướng đi đó đã được áp (chỉ đếm khi
  // hướng khác 0) và tốc độ thật lúc này (pixel/giây, 0 khi choáng / trói / gục). Client đối chiếu với các input chưa được xác nhận.
  @type("uint32") seq: number = 0;
  @type("float32") seqT: number = 0;
  @type("float32") spd: number = 0;
  // Từ 11.1: ngoài giao chiến (được chạy × RUN_MULT) và input cuối giữ Shift (đi bộ). `spd` đã gồm hệ số chạy; client chia ra tốc độ
  // đi bộ để dự đoán từng bước theo cờ đi bộ của bước đó, và để chọn nhịp animation đi / chạy.
  @type("boolean") calm: boolean = true;
  @type("boolean") walk: boolean = false;
  @type("uint8") level: number = 1;
  @type("uint32") xp: number = 0;
  @type("uint32") xpNeed: number = 0;
  @type("uint32") hp: number = 0;
  @type("uint32") maxHp: number = 0;
  @type("uint32") mp: number = 0;
  @type("uint32") maxMp: number = 0;
  @type(["uint8"]) rings = new ArraySchema<number>();
  @type(["float32"]) cds = new ArraySchema<number>(0, 0, 0, 0);
  @type(["float32"]) bcds = new ArraySchema<number>(0, 0, 0); // từ 4.3: hồi chiêu kỹ năng hồn cốt chủ động (BONE_ACTIVE_SLOTS: đầu, tay trái, tay phải)
  @type("float32") swCd: number = 0;     // giây còn lại trước khi được đổi võ hồn trong đội lần tiếp (SWITCH_CD)
  @type("uint32") shield: number = 0;    // khiên còn lại (chiêu tiên cơ phụ trợ, mục 5.1); ai cũng thấy để vẽ vòng khiên
  @type("uint16") buff: number = 0;     // hiệu ứng có lợi đang có (bit theo BUFF_IDS trong shared/data.ts; uint16 từ 2.5d); ai cũng thấy để vẽ hào quang
  @type("uint8") lei: number = 0;       // Phong Lôi Chi Lực (PHONG_LOI, bước 2.5c) của Lam Điện Bá Vương Long: 0..max; ai cũng thấy tia sét quanh thân
  @type("float32") ava: number = 0;     // từ 8.1a: giây còn lại của Võ Hồn Chân Thân (0 = không); ai cũng thấy hình biến thân
  @type("float32") avaCd: number = 0;   // từ 8.1a: hồi chiêu Chân Thân còn lại của võ hồn ra trận (nút R của chính mình)
  @type("float32") ctCd: number = 0;    // từ 9.6: hồi chiêu hồn kỹ Chân Thân (ô P khi đang Chân Thân, CHAN_THAN_SKILL_CD); hồi chiêu ô P cũ vẫn ở cds
  @type("uint16") st: number = 0;       // từ 3.5: trạng thái trên hồn sư do chiêu báo trước của hồn thú gây (bit theo STATUS_IDS, PLAYER_STATUS)
  @type("uint8") han: number = 0;       // từ #163: số tầng Hàn (Cực Hàn, STATUS.chill); ai cũng thấy chấm tầng dưới biểu tượng trên đầu
  @type("float32") absorb: number = 0;   // tiến độ hấp thụ 0..1 (0 = không hấp thụ)
  @type("uint8") absorbTier: number = 0;
  @type("boolean") dead: boolean = false;
  @type("uint32") kills: number = 0;
  @type("boolean") auto: boolean = false; // Auto 1 (mục 5.13): đang tự săn; ai cũng thấy chữ "Tự động" trên đầu
  @type("uint8") tong: number = 0;        // #196 (mục 5.14): tông môn, chỉ số trong TONG_MON + 1 (0 = không); tên tông màu riêng dưới tên
}

export class BeastState extends Schema {
  @type("float32") x: number = 0;
  @type("float32") y: number = 0;
  @type("uint8") tier: number = 0;     // bậc suy ra từ số năm (tierOfYears): màu, kích thước
  @type("uint32") years: number = 0;   // tuổi hồn thú theo số năm (bước 3.2); hồn hoàn rơi ra mang đúng số năm này
  @type("uint8") species: number = 0;  // chỉ số loài trong BEASTS (shared/data.ts); hồn thú bậc > 0 (tinh anh…): chỉ số trong BOSSES
  @type("uint8") rank: number = 0;     // từ BĐ4: 0 thường, 1 tinh anh, 2 thú vương, 3 boss thế giới (mục 5.4)
  @type("uint32") hp: number = 0;
  @type("uint32") maxHp: number = 0;
  @type("int8") face: number = 1;
  @type("boolean") aggro: boolean = false;
  @type("boolean") moving: boolean = false;
  // Trạng thái dùng chung (mục 5.1, bước 2.5a): bit theo STATUS_IDS trong shared/data.ts (Choáng là bit "stun"), số tầng cộng dồn.
  @type("uint16") st: number = 0;
  @type("uint8") burn: number = 0;
  @type("uint8") poison: number = 0;
  @type("uint8") armor: number = 0;
  @type("uint8") allure: number = 0;   // từ 2.5c: số tầng Mị hoặc (đủ tầng thành Mê hoặc) và Phong ấn (đủ tầng thành Dễ thương)
  @type("uint8") lock: number = 0;
  @type("boolean") cast: boolean = false; // từ 3.5: đang báo trước chiêu (đứng yên, client giữ khung đầu animation attack)
  @type("uint8") buff: number = 0;      // từ BĐ4: hiệu ứng có lợi của hồn thú (bit theo BEAST_BUFF_IDS, ví dụ Cuồng nộ của tinh anh)
  @type("uint8") phase: number = 0;     // từ BĐ5: giai đoạn của tà hóa thú vương (1, 2); hồn thú khác 0
  @type("uint8") parts: number = 0;     // từ BĐ5: số người tham gia đang áp vào máu (tinh anh, thú vương); thanh máu boss hiện số này
  // Từ BĐ6e (boss thế giới, mục 5.4): `phase` 2 = nổi giận; điểm yếu hệ đang hiện (1 + chỉ số trong HE_IDS, 0 = không có), khiên Bá
  // Thể còn lại, đang tích lực (Đại Địa Chấn, phải ngắt), số lần khống chế đã trúng khi đang tích lực, đang lặn (Du Thủy: không nhận
  // sát thương).
  @type("uint8") weak: number = 0;
  @type("uint32") shield: number = 0;
  @type("boolean") chg: boolean = false;
  @type("uint8") brk: number = 0;
  @type("boolean") dive: boolean = false;
  // Từ #162: bọc trứng (Vạn Chu Phệ, EggDef): số phần mười giây còn lại trước khi nở; 0 = không phải bọc trứng (eggs.ts).
  @type("uint8") egg: number = 0;
}

export class DropState extends Schema {
  @type("float32") x: number = 0;
  @type("float32") y: number = 0;
  @type("uint8") tier: number = 0;      // bậc suy ra từ số năm: màu hồn hoàn
  @type("uint32") years: number = 0;    // số năm của hồn hoàn (bằng tuổi hồn thú bị hạ)
  // Từ 3.4 đồ rơi khác hồn hoàn (mảnh võ hồn rơi khi túi người hạ đã đầy): mã vật phẩm trong ITEMS và số món; "" = hồn hoàn.
  @type("string") item: string = "";
  @type("uint16") qty: number = 0;
  // Từ 4.1 hồn cốt (`item` = BONE_ITEM, `years` = tuổi hồn thú): loài (chỉ số trong BEASTS) và vị trí (chỉ số trong BONE_SLOTS).
  @type("uint8") species: number = 0;
  @type("uint8") slot: number = 0;
  // Từ 5.1 hồn hạch (`item` = CORE_ITEM): sao và bộ (chỉ số trong CORE_SETS). Chỉ số chính / phụ đã tung chỉ server biết (coreDrops),
  // người nhặt thấy trong túi đồ.
  @type("uint8") stars: number = 0;
  @type("uint8") cset: number = 0;
  @type("string") owner: string = "";   // sessionId được ưu tiên nhặt
  // Từ 7.1: tổ đội của người được ưu tiên lúc đồ rơi (id trong server/src/party.ts, 0 = không có): cả tổ đội cùng được ưu tiên nhặt.
  @type("uint32") party: number = 0;
  @type("float32") ownerTtl: number = 0; // giây còn lại trước khi ai cũng nhặt được
  @type("float32") ttl: number = 0;
}

/**
 * Vùng lưu lại trên mặt đất (#161, mục 5.3: vũng độc, sương độc) do chiêu hồn thú có `ground` để lại. Hình như vùng báo trước (`Tele`):
 * `shape` là chỉ số trong TELE_SHAPES, `kind` chỉ số trong GROUND_KINDS (shared/data.ts). `ttl` giây còn lại làm tròn lên giây nguyên
 * (một bản vá mỗi giây; client tự đếm giữa hai lần đổi để mờ dần lúc sắp hết). Luật (nhịp gây trạng thái, hồn thú gây ra) chỉ server biết (`ground.ts`).
 */
export class GroundState extends Schema {
  @type("uint8") kind: number = 0;
  @type("uint8") shape: number = 0;
  @type("float32") x: number = 0;
  @type("float32") y: number = 0;
  @type("float32") ang: number = 0;
  @type("uint16") r: number = 0;
  @type("uint16") w: number = 0;
  @type("uint16") arc: number = 0;
  @type("uint16") ttl: number = 0;
}

export class MapState extends Schema {
  @type("string") mapId: string = "";  // mã bản đồ trong MAPS; client tải shared/assets/<mapId>.json
  @type("uint16") channel = 0;          // số kênh của phòng trong bản đồ (1, 2, 3…; mục 6 "Nhiều kênh")
  // Từ 11.4: hồn sư, hồn thú, đồ rơi chỉ đồng bộ cho client ở gần (`@view()`, StateView do interest.ts quản lý; mục 6 "Đồng bộ xuống
  // client"). Số hồn sư cả phòng ở `online` (các hồn sư ở xa không có trong `players` của client).
  @view() @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @view() @type({ map: BeastState }) beasts = new MapSchema<BeastState>();
  @view() @type({ map: DropState }) drops = new MapSchema<DropState>();
  @type("uint16") online = 0;
  @type("string") mapFile: string = ""; // 11.3: tên file Tiled khác `<mapId>` (bản dựng bằng tools/maps `<mapId>.v2`, mặc định trừ khi MAP_V1); rỗng = `<mapId>`
  // Từ #161: vùng lưu lại trên mặt đất, cũng chỉ đồng bộ cho client ở gần (interest.ts, theo khoảng cách tới gốc vùng trừ `r`).
  @view() @type({ map: GroundState }) grounds = new MapSchema<GroundState>();
}

/**
 * Một bên của trận Đại Đấu Hồn Trường (7.2): ai cũng thấy để vẽ thanh trận đấu. `sid` = sessionId (rỗng khi chưa vào sân), `pct` =
 * sinh lực cả đội theo % (0..1; võ hồn đã gục tính 0), `alive` / `total` = số võ hồn chưa gục / số võ hồn trong đội.
 */
export class ArenaSide extends Schema {
  @type("string") sid: string = "";
  @type("string") name: string = "";
  @type("uint16") elo: number = 0;
  @type("float32") pct: number = 1;
  @type("uint8") alive: number = 0;
  @type("uint8") total: number = 0;
}

/**
 * State của phòng ArenaRoom (bước 7.2): như bản đồ (người chơi, sân `mapId` = ARENA_MAP) kèm pha trận đấu, giây còn lại của pha, hai
 * bên và bên thắng (-1 chưa xong, 0 / 1, 2 = hòa).
 */
export class ArenaState extends MapState {
  @type("string") phase: string = "wait"; // wait (chờ hai bên vào sân) | ready (đếm ngược) | fight (giao đấu) | end (kết quả)
  @type("float32") time: number = 0;
  @type([ArenaSide]) sides = new ArraySchema<ArenaSide>();
  @type("int8") winner: number = -1;
  @type("boolean") friendly = false; // 9.7: cặp này đã đấu đủ ARENA.pairDaily trận tính Elo hôm nay, trận này là giao hữu (đọc lúc mở phòng; kết quả do lúc hết trận quyết định)
}
