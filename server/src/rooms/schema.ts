// Trạng thái được Colyseus tự đồng bộ xuống mọi client.
import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
  @type("string") name: string = "";
  @type("uint8") vh: number = 0;
  @type("float32") x: number = 0;
  @type("float32") y: number = 0;
  @type("int8") face: number = 1;
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
  @type("float32") absorb: number = 0;   // tiến độ hấp thụ 0..1 (0 = không hấp thụ)
  @type("uint8") absorbTier: number = 0;
  @type("boolean") dead: boolean = false;
  @type("uint32") kills: number = 0;
}

export class BeastState extends Schema {
  @type("float32") x: number = 0;
  @type("float32") y: number = 0;
  @type("uint8") tier: number = 0;
  @type("uint32") hp: number = 0;
  @type("uint32") maxHp: number = 0;
  @type("int8") face: number = 1;
  @type("boolean") aggro: boolean = false;
  @type("boolean") moving: boolean = false;
}

export class DropState extends Schema {
  @type("float32") x: number = 0;
  @type("float32") y: number = 0;
  @type("uint8") tier: number = 0;
  @type("string") owner: string = "";   // sessionId được ưu tiên hấp thụ
  @type("float32") ownerTtl: number = 0; // giây còn lại trước khi ai cũng nhặt được
  @type("float32") ttl: number = 0;
}

export class ForestState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: BeastState }) beasts = new MapSchema<BeastState>();
  @type({ map: DropState }) drops = new MapSchema<DropState>();
}
