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
  @type("float32") swCd: number = 0;     // giây còn lại trước khi được đổi võ hồn trong đội lần tiếp (SWITCH_CD)
  @type("uint32") shield: number = 0;    // khiên còn lại (chiêu tiên cơ phụ trợ, mục 5.1); ai cũng thấy để vẽ vòng khiên
  @type("uint8") buff: number = 0;      // hiệu ứng có lợi đang có (bit theo BUFF_IDS trong shared/data.ts); ai cũng thấy để vẽ hào quang
  @type("float32") absorb: number = 0;   // tiến độ hấp thụ 0..1 (0 = không hấp thụ)
  @type("uint8") absorbTier: number = 0;
  @type("boolean") dead: boolean = false;
  @type("uint32") kills: number = 0;
}

export class BeastState extends Schema {
  @type("float32") x: number = 0;
  @type("float32") y: number = 0;
  @type("uint8") tier: number = 0;
  @type("uint8") species: number = 0;  // chỉ số loài trong BEASTS (shared/data.ts)
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
}

export class DropState extends Schema {
  @type("float32") x: number = 0;
  @type("float32") y: number = 0;
  @type("uint8") tier: number = 0;
  @type("string") owner: string = "";   // sessionId được ưu tiên hấp thụ
  @type("float32") ownerTtl: number = 0; // giây còn lại trước khi ai cũng nhặt được
  @type("float32") ttl: number = 0;
}

export class MapState extends Schema {
  @type("string") mapId: string = "";  // mã bản đồ trong MAPS; client tải shared/assets/<mapId>.json
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: BeastState }) beasts = new MapSchema<BeastState>();
  @type({ map: DropState }) drops = new MapSchema<DropState>();
}
