// Trạng thái được Colyseus tự đồng bộ xuống mọi client.
import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
  @type("string") name: string = "";
  @type("uint8") vh: number = 0;
  // Ngoại hình hồn sư (mục 5.11): chỉ số trong SEXES, HAIR_STYLES[sex], HAIR_COLORS, OUTFIT_COLORS (shared/data.ts).
  @type("uint8") sex: number = 0;
  @type("uint8") hair: number = 0;
  @type("uint8") hairCol: number = 0;
  @type("uint8") outfitCol: number = 0;
  @type("float32") x: number = 0;
  @type("float32") y: number = 0;
  @type("uint8") dir: number = 0;      // hướng nhìn 4 phía, chỉ số trong DIRS4 (shared/data.ts): 0 xuống, 1 phải, 2 lên, 3 trái (thay `face` = ±1)
  @type("boolean") moving: boolean = false;
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
  @type("uint16") st: number = 0;       // từ 3.5: trạng thái trên hồn sư do chiêu báo trước của hồn thú gây (bit theo STATUS_IDS, PLAYER_STATUS)
  @type("float32") absorb: number = 0;   // tiến độ hấp thụ 0..1 (0 = không hấp thụ)
  @type("uint8") absorbTier: number = 0;
  @type("boolean") dead: boolean = false;
  @type("uint32") kills: number = 0;
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
  @type("float32") ownerTtl: number = 0; // giây còn lại trước khi ai cũng nhặt được
  @type("float32") ttl: number = 0;
}

export class MapState extends Schema {
  @type("string") mapId: string = "";  // mã bản đồ trong MAPS; client tải shared/assets/<mapId>.json
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: BeastState }) beasts = new MapSchema<BeastState>();
  @type({ map: DropState }) drops = new MapSchema<DropState>();
}
