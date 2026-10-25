import Phaser from "phaser";
import type { Room } from "colyseus.js";
import { MINI_BASE, TIERS, BEASTS, VOHON, RADAR, SYNC_VIEW, MAPS, TILE, titleOf, TEAM_SIZE, RESPAWN_SECS, vohonIndex, TIEN_CO, type He,
  ringSkill, loadoutOf, DEFAULT_LOADOUT, chanThanOf, tienCoOf, STATUS, statusBit, BUFFS, BUFF_IDS, buffBit, phoenixFieldR, PHONG_LOI,
  tierOfYears, formatYears, PICKUP_RANGE, DROP_TTL_SECS, absorbChance, absorbSecs, atBottleneck, MAX_RINGS, beastLevel, xpLevelScale, parseLevelRange,
  itemDef, PLAYER_STATUS, type Tele, TELE_SHAPES, GROUND_KINDS, BOSSES, ELITE, beastBase, beastName, BEAST_BUFFS, beastBuffBit,
  BONE_ITEM, BONE_SLOTS, boneName, parseBone, boneSkillOf, BONE_ACTIVE_SLOTS, CORE_ITEM, CORE_SETS, coreName, EQUIP_ITEM, EQUIP_TEMPLATES, EQUIP_TIERS, equipName, coreStatText, type CoreSubUp, type CoreStat, KING,
  AUTOWALK, AUTO_MOVE, WORLD, HE, HE_IDS, RING_ITEM, PLAYER_SPEED, PLAYER_CHARM, SLOW_CAP,
  npcDef, NPC_RANGE, type NpcDef, questChain, questRewardText, RESONANCE, resonanceText, DAILY, fitBeast, fitMaps, type QuestGoal,
  type QuestProgress, type QuestStatus, formatHonTe, type SkillDef, tongByIndex, TONG_MON, TONG_DAILY, FUSIONS, LPC_VIEW, decodeLpc, encodeLpc, presetToLpc, lpcGearLooks, type Looks } from "../../../shared/data.ts";
import { makeTextures, vohonTextures, BEAST_ORIGIN } from "../textures.ts";
import { buildRings, animateRings, type HaloState } from "../soulRings.ts";
import { preloadSprites, createSheetAnims, honsuAnimKey, honsuAnimMs, syncLayers, syncBeastSprite, beastSheetSpecies, beastBody, staticBeastPose, STATIC_MOTION, beastFamily, beastStrikeAge, beastMotionLevel, fitHonsuLayer, isIsoSheet, vohonHalf, VH_ORIGIN,
  ISO_HS_ORIGIN, ISO_VH_ORIGIN, playFx, type HsAnim } from "../sprites.ts";
import * as hud from "../hud.ts";
import { radar, type DotSink } from "../radar.ts";
import { mapview, type MapLabel } from "../mapview.ts";
import { fog } from "../fog.ts";
import { toast, lootToasts } from "../feedback.ts";
import { initDualWindows } from "../dualWindow.ts";
import type { ServerCommand } from "../charBagContract.ts";
import { toggleChar, cycleCharTab, isCharOpen, onCharOpen, renderChar, charViewRow, charLog, type StatsMsg } from "../charPanel.ts";
import { Predictor, PREDICT, LAG_MS, DEBUG_TAG, stepSpeed } from "../predict.ts";
import { findPath, findLongPath, buildNav, type Nav } from "../../../shared/path.ts";
import { autoLeg, AUTO_STOP } from "../../../shared/autowalk.ts";
import { getFlag, setFlag, patchFlag, bindFlagBar, mapName } from "../autowalk.ts";
import { RALLY } from "../../../shared/data.ts";
import { rallyLeft } from "../../../shared/rally.ts";
import { addRally, pruneRallies, getRallies } from "../rally.ts";
import { Crowd, lpcPreloader, type CrowdMap } from "../crowd.ts";
import { LpcRig } from "../lpcRig.ts";
import { solidGrid, clampDir, isSolidTile, type SolidGrid } from "../../../shared/move.ts";
import { campMerchantSpot } from "../../../shared/camp.ts";
import { hoaDanSpot } from "../../../shared/hoaDan.ts";
import { worldToScreen as W2S, screenToWorld, SPR, RX, RY, VIEW_W, VIEW_H, TOPDOWN, screenDirToWorld, dir8, DIR4_VEC, fillGround, strokeGround,
  groundAt, ptsToScreen, arcPts, type Pt, type Dir8, DIRS8 } from "../iso.ts";
import { IsoMap, preloadIso, type Focus } from "../isoMap.ts";
import { Lighting, PRIO, attachNormal, type LightSrc } from "../lighting.ts";
import { Weather } from "../weather.ts";
import { InkVeil, causesInk } from "../ink.ts";
import { AudioManager, type AudioEvent, type FxSoundInfo } from "../audio/AudioManager.ts";
import { RARE_LOOT_MIN, STEP_INTERVAL_MS, elementOfVohonIndex, beastFamilyOf, beastSpeciesId, elementOf, materialOfBeast, surfaceOfGround, weaponOf, type Material, type Element } from "../audio/soundMap.ts";
import { SkillFx, skillFxOf, isCinematic, type FxKind } from "../skillFx.ts";
import { SkillCine, cineAllowed } from "../skillCine.ts";
import { SheetFx } from "../fxSheet.ts";
import { loadPrivateAssets, playPriv } from "../privateAssets.ts"; // #623: hiệu ứng kho riêng (thiếu thì giữ hình cũ)
import { SkillVisualPlayer, skillVisualOf, registerCodeSheets, FUSION_VISUAL } from "../skillVisual.ts";
/** `?sv=0`: tắt sheet SKILL_VISUAL (chỉ hiệu ứng G3), để quay ảnh "trước" cạnh "sau" trong game thật. */
const SV_OFF = new URLSearchParams(location.search).get("sv") === "0";
import { hitWeight, KNOCK_PX, materialSparks, damageStyle, playHitFeelSheets, registerHitFeelSheets } from "../hitFeel.ts";
import { footDustCount, rootSnareDiameter } from "../combatFeelRules.ts";
import { PhapTuongSystem, PhapTuongCutIn } from "../phapTuong.ts";
import { SPIRIT_FAMILY, spiritPose, spiritScale, spiritPhase, applySpiritPose, newSpiritPose, type SpiritState } from "../spiritMotion.ts";
import { ParticleLayer, HIT_SPARK, SHAKE_TIER, beastJerk, shakeK, flashOn, zoomOn, hitstopOn, hitstopMs, fxPrefs, fxLevel, fxGov } from "../combatFx.ts";
import { bindAudioPanel, closeAudioPanel } from "../audio/settingsPanel.ts";
import { bindUiSounds } from "../audio/uiSounds.ts";
import { AMBIENT_FIRE_PROPS } from "../audio/ambientLayers.ts";
import { autoJob, autoJobText, bindAutoPanel, closeAutoPanel, closeAutoSum, setAutoMsg, setAutoStatus, toggleAutoPanel } from "../autoPanel.ts";
import { bossPhase, combatHit } from "../audio/music.ts";
import { ArenaShow } from "../arenaShow.ts";
import { showOffline, type OfflineMsg } from "../offline.ts";
import type { OwnedVohons, Squad, PortalInfo, BagMsg, GearMsg, EquipEnhPreview, EquipEnhDone, EquipLuckPreview, EquipLuckDone, EquipSynDone, EquipSalvDone, BagDeltaMsg, AutoSoldMsg, PartyView, ChatMsg, QuestMsg, DailyMsg, ResonanceMsg, ResonanceTopMsg, ChannelsMsg, WorldMsg, AutoMsg, AutoStMsg, FriendsMsg } from "../net.ts";
import { applyBagDelta } from "../../../shared/bagSync.ts";
import { assetUrl } from "../assetUrl.ts";

const hex = (c: string) => parseInt(c.slice(1), 16);
type Sprite = Phaser.GameObjects.Sprite;
/** Hồn sư ghép lớp (mục 5.11). Thứ tự con của `root` là thứ tự vẽ: bóng, vòng sau, phụ thể sau, thân LPC (áo, tóc đã nằm trong thân), phụ thể trước, vòng trước. */
interface PView {
  root: Phaser.GameObjects.Container;
  wx: number; wy: number;                   // vị trí vẽ theo tọa độ thế giới (nội suy / dự đoán); root đặt ở hình chiếu của điểm này
  face: Dir8;                               // hướng nhìn 8 phía trên màn hình theo hướng đi (10.1)
  body: Sprite; vb: Sprite; vf: Sprite;
  ringsB: Phaser.GameObjects.Container; ringsF: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text; title: Phaser.GameObjects.Text; tongT: Phaser.GameObjects.Text; // tongT: tên tông môn dưới tên (#196)
  looks: string; vh: number; rings: string; playing: string;
  lpcKey: string;                           // texture LPC ghép lúc chạy của hồn sư (lpcRig.ts); "" khi chưa dựng
  lpcFace: { shown: Dir8 | null; pend: { d: Dir8; t0: number } | null }; // hướng LPC đang hiện và hướng mới đang chờ giữ đủ LPC_VIEW.dirHoldMs
  act: { anim: HsAnim; t0: number } | null; // animation chạy một lần: attack, cast, hurt
  hurtT: number;                            // lúc bị đánh gần nhất, để nháy trắng
  spPhase?: number;                         // lệch pha chuyển động phụ phụ thể (spiritMotion.ts), tính một lần theo mã người chơi
  lit: { i: number; t0: number } | null;    // vòng hồn hoàn đang sáng khi tung hồn kỹ
  halo: HaloState | null;                   // quầng hào quang Chân Thân (soulRings.ts), tạo khi cần
  ringY: number[];                          // độ cao hiện tại từng vòng hồn hoàn trên chân (pixel nội bộ), trượt dần tới chỗ đích
  fly: { t0: number; ms: number } | null;   // đang bay (Tà Hỏa Phượng Hoàng, 2.5b): chỉ là hiệu ứng, nhấc hình lên khỏi bóng
  lock: { face: Dir8; until: number } | null; // hướng nhìn theo đòn vừa đánh (tin `fx` có dx, dy), giữ hết animation đánh (10.1)
}
/** Bấm để đi tới (10.1): còn cách điểm bấm chừng này pixel thế giới thì coi là tới nơi. */
const GOAL_NEAR = 3;
/** Nhịp animation đi theo vận tốc (11.1): đi ở tốc độ này thì chạy đúng nhịp vẽ, nhanh / chậm hơn thì nhân theo, kẹp trong khoảng. */
const WALK_ANIM_SPEED = PLAYER_SPEED, WALK_ANIM_SCALE: [number, number] = [0.5, 1.8];
/** Hồn thú có sheet theo loài: nhịp animation đi khi lang thang / khi đuổi (đuổi nhanh gấp BEAST_GAIT.chase / wander lần). */
const BEAST_ANIM_SCALE = { wander: 0.7, chase: 1.4 };
/** Tin `dmg` kết liễu chỉ có giá trị tới chừng này mili giây trước khi hồn thú bị xoá khỏi state (bản vá luôn tới trong vài khung). */
const KILL_GHOST_MS = 3000;
/** Chiều cao tên hồn sư trên chân (pixel màn hình): thân 32 pixel cũ phóng SPR. Danh hiệu, chữ bay, biểu tượng trạng thái đặt theo mốc này. */
const HEAD = 30 * SPR;
interface Rect { x: number; y: number; w: number; h: number; }
interface Zone extends Rect { name: string; hint: string; years?: [number, number] | null; }
const inRect = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const FONT = '"Be Vietnam Pro", system-ui, sans-serif';
/**
 * Màu bản đồ nhỏ riêng từng bản đồ (đè bảng chung trong buildMinimap), tách lớp nền (`ground`) và lớp vật (`obj`), vì một gid ở mỗi
 * bản đồ trỏ tới ô / vật khác nhau theo shared/assets/iso/tiles.json. Tinh Đấu Ngoại vi (11.3, bản dựng bằng tools/maps): gid 25–26,
 * 32 trùng tuyết / băng tinh của Cực Bắc nhưng ở đây là bờ nước, nền đá cuội, vách đá; bản cũ 90×60 không dùng các gid này.
 */
const MINI_COLORS: Record<string, { ground?: Record<number, string>; obj?: Record<number, string> }> = {
  tinh_dau_ngoai_vi: {
    // bờ suối / ao, nền đá cuội mặt bậc vách, sân đá nứt tàn tích, cầu đá, rêu quanh cổ thụ
    ground: { 4: "#3f7a40", 16: "#8c877c", 25: "#7a6448", 26: "#7d7a70", 33: "#b8a888" },
    // xương thú, cây cỏ nhỏ, biển chỉ đường, cổ thụ, vách đá, tường đổ, bia đá, vòm đá, gỗ đổ
    obj: { 27: "#d8d0c0", 28: "#467e38", 29: "#a08a63", 30: "#0e2a18", 32: "#3a3f48", 37: "#6a6a70", 38: "#8a98a8", 39: "#6a6a70", 40: "#5a4a32" },
  },
  // 11.5: các bản ×8 dựng bằng tools/maps (gid theo bộ của từng bản đồ trong tiles.json; bản cũ dùng ít gid hơn, cùng nghĩa).
  tinh_dau_noi_dia: {
    // rêu tối, rêu phát quang, đầm, sân đá miếu, bờ, nền đá Lôi Cốc, cầu, đầm nông, nước sâu
    ground: { 1: "#3a5a48", 2: "#34503f", 3: "#2a3f3a", 4: "#3a6a6a", 5: "#2f4a42", 6: "#4a4a3a", 7: "#6a6050", 8: "#5a5048", 9: "#1a3a5a", 13: "#6a6878",
      16: "#5a5868", 25: "#5a5048", 26: "#5a5868", 33: "#7a7480", 34: "#2f5a6a", 35: "#102a40" },
    // xương / mạng nhện, nấm, biển chỉ đường, cổ thụ, vách, đá, tường đổ, tinh thể tím, vòm, gỗ đổ
    obj: { 27: "#c8c0d0", 28: "#3a5a48", 29: "#a08a63", 30: "#4a3a6a", 32: "#3a3f48", 36: "#5a5a68", 37: "#5a5a60", 38: "#a070e0", 39: "#5a5a60", 40: "#4a3a2a" },
  },
  lac_nhat_sam_lam: {
    // cỏ khô đỏ, lá đỏ, rêu đỏ, đường đá cũ, đất cháy, đầm Bích Lân, nền băng, hồ băng, hồ lửa, cầu, đầm nông, nước sâu
    ground: { 1: "#8a4a30", 2: "#7a4430", 3: "#6a3a2a", 4: "#5a2a24", 5: "#8a5040", 6: "#6a3a34", 7: "#9a7a5a", 8: "#4a2a20", 9: "#4a7a5a", 10: "#8a4a3a",
      13: "#9a8070", 16: "#806858", 25: "#9a7060", 26: "#8a7060", 27: "#8ac8f0", 29: "#e0e8f0", 31: "#ff8040", 33: "#a08878", 34: "#5a8a6a", 35: "#2a4a3a" },
    obj: { 28: "#c06080", 30: "#c08070", 32: "#5a4a40", 36: "#7a6a60", 37: "#7a6a60", 38: "#b0e0ff", 39: "#ff9060", 40: "#5a3a2a" },
  },
  cuc_bac_chi_dia: {
    // tuyết, mặt băng, đá cuội, bờ khe, cầu đá, lối tối, sân đá băng điện, vực băng
    ground: { 2: "#e8eef8", 3: "#b8d0e8", 4: "#a0a8b8", 5: "#d0d8e8", 6: "#c8e0f8", 7: "#c8d0e0", 8: "#8a90a8", 13: "#b0b8c8", 16: "#9098a8", 35: "#2a4a70" },
    // Băng Tủy Thụ, xương, đá / băng tinh, tường đổ, bia, vòm, gỗ
    obj: { 1: "#a0d0ff", 33: "#e0e0e8", 36: "#a0b0c8", 37: "#9098a8", 38: "#b0b8c8", 39: "#9098a8", 40: "#6a6a78" },
  },
  // Thành trấn ×8 (11.5): sân đá, bờ / nền đá, cầu; đài phun nước, sư tử đá, đèn lồng, chậu hoa / cờ, giá binh khí.
  thanh_hon_thon: {
    ground: { 4: "#6a9a48", 8: "#8a7a58", 25: "#b8a888", 26: "#8a8478", 33: "#b8a888" },
    obj: { 28: "#5a8a40", 29: "#a08a63", 30: "#2a4a2a", 32: "#3a3f48", 36: "#7a7a70", 37: "#6a6a70", 38: "#6a4a2a", 39: "#8a98a8", 40: "#5a4a32" },
  },
  nac_dinh_thanh: {
    ground: { 4: "#6a9a48", 8: "#8a7a58", 16: "#b0aaa0", 25: "#9a9488", 26: "#8a8478", 33: "#a89a80" },
    obj: { 12: "#ff9a3c", 28: "#c06080", 29: "#a08a63", 30: "#a0c8e0", 36: "#6a4a2a", 37: "#c8a040", 38: "#c04030", 39: "#c06080" },
  },
  thien_dau_thanh: {
    ground: { 4: "#6a9a48", 7: "#8aa0b8", 8: "#7a88a0", 10: "#c8c0b0", 16: "#c8c0b0", 25: "#a8a090", 26: "#8a8478", 33: "#b8b0a0" },
    obj: { 12: "#ff9a3c", 19: "#e8a0b8", 28: "#c06080", 29: "#a08a63", 30: "#a0c8e0", 36: "#6a4a2a", 37: "#c8a040", 38: "#c04030", 39: "#d8b040" },
  },
  // Lõi Tinh Đấu, Đại Đấu Hồn Trường (11.5, giữ cỡ): rêu phát quang, sàn đá, rìa nước nông, lòng Hồ Sinh Mệnh; cột tinh thể, cổ thụ.
  loi_tinh_dau: {
    ground: { 5: "#4ab8b0", 7: "#7a7a90", 13: "#9aa2c0", 16: "#8a92b0", 25: "#8a98b8", 26: "#8a90a8", 33: "#9aa2c0", 34: "#6ab8d8", 35: "#2a5a8a" },
    obj: { 27: "#c8d0e0", 28: "#4a9a8a", 30: "#4ab8b0", 36: "#6a7088", 38: "#a8d0ff", 39: "#8a90a8", 40: "#4a3a3a" },
  },
  dai_dau_hon_truong: { ground: { 16: "#c8a868" }, obj: { 12: "#ff9a3c", 37: "#c8a040", 38: "#d8b040" } },
  hai_than_dao: {
    // cỏ đảo, hoa, cát ướt tối, nước biển, bãi trại, sân đá đền, cầu tàu / đường đá, đá cuội
    ground: { 3: "#5a7a4a", 5: "#8a9a5a", 6: "#6a9a50", 8: "#a08a63", 9: "#3a6a90", 10: "#e8dcc0", 13: "#d8d0c0", 16: "#b8b0a0", 25: "#8a7a60", 26: "#9a9280" },
    // xương cá voi, bụi hoa / san hô, biển chỉ đường, vách, tường đổ, tượng đinh ba, vòm, gỗ
    obj: { 27: "#e0d8c8", 28: "#c86a8a", 29: "#a08a63", 32: "#5a5248", 37: "#8a8278", 38: "#e0c060", 39: "#a09888", 40: "#6a4a2a" },
  },
};
/** Mép trên hồn thú (toạ độ y) để đặt thanh máu, sao choáng: sheet ảnh thật `beast_{loài}` (M4) lấy theo thân (beastBody: sheet isometric
 *  theo thân đã đo, sheet một hàng theo khung), sprite vẽ bằng code theo bậc (tinh anh phóng ELITE.scale, BĐ4; thú vương KING.scale, BĐ5). */
const beastTop = (s: Phaser.GameObjects.Sprite, tier: number) =>
  s.texture.key.startsWith("beast_") ? beastBody(s).top : s.y - (TIERS[tier].size + 8) * (s.getData("bscale") ?? 1) * SPR;
/** Hệ số phóng sprite theo bậc hồn thú: tinh anh ELITE.scale (BĐ4), thú vương KING.scale (khoảng 96×96, BĐ5), boss thế giới WORLD.scale (BĐ6e). */
const rankScale = (rank: number) => (rank === 3 ? WORLD.scale : rank === 2 ? KING.scale : rank === 1 ? ELITE.scale : 1);
/** Khung cao tối thiểu (pixel ảnh) của sheet thú vương / boss vẽ ở CỠ THẬT (mục 5.11 bảng "Cỡ khung": 160 / 192). */
const FULL_SIZE_FRAME = 160;
/**
 * Hệ số phóng thực tế của sprite hồn thú: sheet của loài gốc (khung 64–128) phóng theo bậc (`rankScale`), còn sheet thú vương / boss đã vẽ đúng
 * cỡ riêng (khung cao ≥ FULL_SIZE_FRAME) thì giữ nguyên 1: nhân thêm sẽ cao gấp 3–4 lần (boss 192 × WORLD.scale 4 = 768 điểm trên màn hình 640×360).
 */
const spriteRankScale = (s: Phaser.GameObjects.Sprite, rank: number) => (rank >= 2 && s.frame.realHeight >= FULL_SIZE_FRAME ? 1 : rankScale(rank));
/** Màu vùng cảnh báo chiêu báo trước của hồn thú (3.5). */
const TELE_COL = 0xff3b3b;
/** Thời gian nở của bọc trứng theo mã loài (EggDef trong chiêu thú vương, #162): đồng hồ nở vẽ theo phần còn lại. */
const EGG_SECS = new Map(BOSSES.flatMap((d) => [...d.skills, ...(d.phase2?.skills ?? [])]).flatMap((x) => (x.eggs ? [[x.eggs.species, x.eggs.secs] as const] : [])));
const eggLeft = (b: any) => (b.egg / 10).toFixed(1).replace(".", ",");
/** Bọc trứng còn dưới ngần này (phần mười giây, như BeastState.egg) thì coi là sắp nở: phập phồng nhanh, đồng hồ đỏ. */
const EGG_SOON = 30;
/** Vòng an toàn của chiêu toàn sàn boss thế giới (#118) và vòng sóng chỗ Du Thủy sắp nổi lên. */
const SAFE_COL = 0x7fe0c0, DIVE_COL = 0x4ab0ff;
/**
 * Vẽ Du Thủy (#118, chỉ hiển thị): `r` bán kính vòng sóng chỗ sắp nổi lên (pixel thế giới, cỡ thân boss), `ripple` bán kính lớn nhất
 * của gợn sóng quanh boss đang lặn giữa hồ, `holdMs` giữ dấu thêm sau giờ nổi lên dự kiến phòng tin "surface" tới muộn.
 */
const DIVE_MARK = { r: 40, ripple: 52, holdMs: 1500 };
/** Làm chậm của hồn sư theo bit trạng thái `st`: cộng mọi trạng thái (Làm chậm, Ngập nước #174), tối đa SLOW_CAP (như server). */
const pSlow = (st: number) => Math.min(SLOW_CAP, PLAYER_STATUS.reduce((a, s) => a + (st & statusBit(s) ? STATUS[s].slow : 0), 0));
/** Biểu tượng trạng thái trên đầu hồn thú / hồn sư (thứ tự hiển thị); Choáng, Trói, Mê hoặc vẽ riêng. */
const STATUS_ICONS = ["burn", "shock", "poison", "vuln", "armor", "silence", "allure", "lock", "slow", "chill", "flood", "ink"] as const;

/**
 * Chuỗi LPC của một ngoại hình kiểu cũ (5 số; HL3 #572): server đã chuyển tài khoản cũ sang LPC lúc nạp (HL2) nên chỉ còn gặp khi dữ
 * liệu lạ (preset sót, chuỗi `lpc` hỏng): đổi sang LPC gần nhất bằng presetToLpc rồi vẽ như người khác. Nhớ kết quả theo 5 số.
 */
const presetLpcMemo = new Map<string, string>();
function presetLpcStr(p: { sex: number; hair: number; hairCol: number; outfitCol: number; skin: number }): string {
  const key = `${p.sex}|${p.hair}|${p.hairCol}|${p.outfitCol}|${p.skin}`;
  let out = presetLpcMemo.get(key);
  if (out === undefined) {
    out = encodeLpc(presetToLpc({ sex: p.sex, hair: p.hair, hairCol: p.hairCol, outfitCol: p.outfitCol, skin: p.skin, mode: "preset" }));
    presetLpcMemo.set(key, out);
  }
  return out;
}
/** Chuỗi LPC để dựng thân: ngoại hình LPC đè áo / mũ trang bị đang mặc (`gearAo` / `gearMu`, HL4 #573; tuỳ chọn Ẩn mũ); thiếu / hỏng thì đổi từ preset cũ (presetLpcStr). Nhớ kết quả theo bộ đầu vào. */
const gearLpcMemo = new Map<string, string>();
function gearLpc(p: { lpc: string; sex: number; hair: number; hairCol: number; outfitCol: number; skin: number; gearAo: number; gearMu: number }): string {
  const key = `${p.lpc || presetLpcStr(p)}#${p.gearAo}#${p.gearMu}#${fxPrefs.hideHat ? 1 : 0}`;
  let out = gearLpcMemo.get(key);
  if (out === undefined) {
    const l = decodeLpc(p.lpc) ?? decodeLpc(presetLpcStr(p))!;
    out = encodeLpc(p.gearAo || p.gearMu ? lpcGearLooks(l, p.gearAo, p.gearMu, fxPrefs.hideHat) : l);
    if (gearLpcMemo.size > 400) gearLpcMemo.clear();
    gearLpcMemo.set(key, out);
  }
  return out;
}
/** Ngoại hình đang mang của một hồn sư trong state (luôn LPC; preset sót đổi bằng presetToLpc). */
function looksOf(p: { sex: number; hair: number; hairCol: number; outfitCol: number; skin: number; lpc: string }): Looks | null {
  const lpc = decodeLpc(p.lpc) ?? decodeLpc(presetLpcStr(p));
  return lpc ? { sex: lpc.body, hair: 0, hairCol: 0, outfitCol: 0, skin: 0, mode: "lpc", lpc } : null;
}

/** Chuỗi LPC của NPC theo `looks` trong NPCS (LPC dùng thẳng, preset kiểu cũ đổi bằng presetToLpc). */
const npcLpcStr = (L: Looks): string => encodeLpc(L.mode === "lpc" && L.lpc ? L.lpc : presetToLpc(L));

export class GameScene extends Phaser.Scene {
  room!: Room<any>;
  mapId = "";
  me = "";
  players = new Map<string, PView>();
  beasts = new Map<string, Phaser.GameObjects.Sprite>();
  /** Vị trí vẽ (thế giới, nội suy) của từng hồn thú; sprite đặt ở hình chiếu (10.1). */
  /** Vị trí nội suy của hồn thú; `dive`: cờ lặn (BeastState.dive) đã thấy, đổi thì đặt thẳng vị trí (Du Thủy, #118). */
  bpos = new Map<string, Pt & { dive?: boolean }>();
  /** Âm thanh (G2): giờ bước chân kế của từng hồn sư, giây sống còn lại và chỗ của đồ rơi lần thấy trước (phân biệt nhặt với hết hạn). */
  stepT = new Map<string, number>(); dropTtl = new Map<string, { ttl: number; x: number; y: number }>();
  /** Hướng nhìn 8 phía của hồn thú (sheet isometric): theo hướng trượt khi đi, theo vùng báo trước khi tung chiêu, đứng yên thì giữ. */
  bface = new Map<string, Dir8>();
  /** G1 (#392) cảm giác đánh: lớp hạt dùng chung, dừng hình, nháy trắng / đẩy lùi chỉ hình của hồn thú vừa bị đánh, lần đánh cuối để nhận ra hạ thú. */
  fxp!: ParticleLayer; pt!: PhapTuongSystem; ptCut = new PhapTuongCutIn();
  skfx!: SkillFx; svis!: SkillVisualPlayer; cine = new SkillCine();
  castHeavy = { t: 0, heavy: 0 }; // độ nặng chiêu mình vừa tung (S1 #542): đòn trúng trong ~0,7 s sau đó khựng / giật lùi / tia lửa nặng hơn
  hitstopEnd = 0; hitstopNext = 0; slowmo = 1;
  hitFlash = new Map<string, number>();
  hitKick = new Map<string, { dx: number; dy: number; t0: number; p: number }>();
  downAt: { x: number; y: number; t: number }[] = []; // nơi hồn thú vừa bị hạ (màn hình): hồn hoàn rơi gần đó mới có vòng sáng
  lastHit = new Map<string, { t: number; tier: number; rank: number; x: number; y: number; mine: boolean; lethal: boolean }>();
  zoomFx: Phaser.Tweens.Tween | null = null;
  /** Hồn thú vừa bị đòn kết liễu (id → thời điểm nhận tin `dmg` có `kill`), để biết lúc bị xoá khỏi state là chết thật. */
  beastKilled = new Map<string, number>();
  /** Bản đồ vẽ theo phép chiếu (ô hình thoi, khối cao sắp lớp theo độ sâu), bước 10.1. */
  isoMap!: IsoMap;
  /** Vùng cảnh báo chiêu báo trước đang hiện (3.5), theo mã hồn thú: hình đã khóa (từ BĐ4 có thể nhiều vùng), lúc bắt đầu, thời lượng (ms). */
  teles = new Map<string, { t: Tele[]; t0: number; ms: number; safe?: Tele[] }>(); // safe: vòng an toàn của chiêu toàn sàn (#118)
  /** Chỗ boss thế giới sắp nổi lên sau Du Thủy (tin "boss" k = "dive", #118): vòng sóng báo trước tới khi nổi lên. */
  diveMark: { bid: string; x: number; y: number; t0: number; ms: number } | null = null;
  /** Tên trên đầu tinh anh (BĐ4) và thú vương (BĐ5): "Tinh anh …", "Tà hóa …" màu aura. */
  eliteLabels = new Map<string, Phaser.GameObjects.Text>();
  /** Hang thú vương của bản đồ (object `boss`, BĐ5): vẽ trên bản đồ nhỏ. */
  lair: Rect | null = null;
  eliteSpots: Pt[] = []; // chỗ sinh tinh anh của bản đồ (object `elite` trong Tiled), cho chỉ đường mục tiêu `elite` (#190)
  /** Hỏa Đàn trong hang (#163, Cực Hàn): chỗ đặt (shared/hoaDan.ts, như server), bán kính xả tầng Hàn, lớp vẽ đống lửa (độ sâu theo chân). */
  hoaDan: { x: number; y: number; r: number; g: Phaser.GameObjects.Graphics } | null = null;
  /** Bảng xếp hạng sát thương thú vương gần nhất (tin "boss" k = "rank"); hiện khi mình đang tham gia. */
  bossList: { id: string; name: string; pct: number }[] | null = null;
  teleG!: Phaser.GameObjects.Graphics;
  /** Viền vùng báo trước vẽ lại ở lớp TRÊN hiệu ứng chiêu (H8 #491): sheet / hạt của đông người không che được vòng báo trước. */
  teleTop!: Phaser.GameObjects.Graphics;
  /** Đồng hồ phía client của vùng lưu lại (#161, drawGrounds): `ttl` lần đổi gần nhất, lúc đổi, lúc thấy lần đầu (ms của scene). */
  groundClock = new Map<string, { v: number; at: number; seen: number }>();
  drops = new Map<string, { img: Phaser.GameObjects.Image; txt: Phaser.GameObjects.Text }>(); // hồn hoàn dưới đất kèm số năm
  ov!: Phaser.GameObjects.Graphics;
  /** Ánh sáng theo vùng (Light2D, 10.7) và thời tiết / hạt bay. */
  light!: Lighting;
  weather!: Weather;
  /** Màn mực khi chính mình bị Che tầm nhìn (#175, Phun Mực). */
  ink!: InkVeil;
  zones: Zone[] = [];
  safes: Zone[] = [];   // vùng an toàn (object `safe`)
  campRect = { x: 0, y: 0, w: 0, h: 0 };
  campName = "";
  portals: (Rect & { to: string })[] = [];
  portal: PortalInfo | null = null;
  /**
   * Truyền tống trận của bản đồ (object `waypoint`, 11.2): chữ nhật, mã `<mapId>:<tên>`, tên hiện, nhãn chữ trên trận. `wpOpen`: mã các
   * trận đã mở (tin `world` / `wp`), `wpHere`: tên trận đang đứng (tin `wp {k: "here"}`), `wpCasts`: hồn sư đang niệm truyền tống
   * (fx `wpcast`: lúc bắt đầu, số giây).
   */
  waypoints: (Rect & { key: string; label: string; text: Phaser.GameObjects.Text | null })[] = [];
  wpOpen = new Set<string>();
  wpHere: string | null = null;
  wpCasts = new Map<string, { t0: number; ms: number }>();
  /**
   * NPC của bản đồ (object `npc`, bước 6.1): chỗ đứng, định nghĩa trong NPCS (thiếu = mã lạ, chỉ vẽ biển tên), sprite thân LPC
   * (null = biển hiệu) và nhãn "Nói chuyện" hiện khi đứng gần.
   */
  npcs: { id: string; x: number; y: number; def: NpcDef | undefined; body: Sprite | null; mark: Phaser.GameObjects.Text | null;
    qmark: Phaser.GameObjects.Text | null }[] = []; // qmark: dấu "!" / "?" của NPC giao nhiệm vụ (6.2)
  daily: DailyMsg | null = null; // khảo hạch hằng ngày (tin riêng "daily")
  /** Mục tiêu nhiệm vụ chấm trên bản đồ nhỏ (questTargets), tính lại khi tiến độ / cấp đổi (`key`). */
  qt: { key: string; npcs: Pt[]; zones: Rect[]; portals: Rect[] } = { key: "", npcs: [], zones: [], portals: [] };
  nearNpc: string | null = null;    // NPC trong tầm nói chuyện (NPC_RANGE) lần kiểm tra gần nhất
  crowd: Crowd | null = null;       // dân thường, lính gác trang trí (crowd.ts, chỉ client)
  lpc!: LpcRig;                     // bộ ghép lớp hồn sư chế độ Tự tạo (lpcRig.ts, L3 #510)
  onTravel: (mapId: string, roomId: string | null) => void = () => {};
  /** Đại Đấu Hồn Trường (7.2): server đã ghép trận thì vào phòng `roomId`; `onBack` rời sân về bản đồ cũ (đang giao đấu = bỏ trận, thua). */
  onArena: (roomId: string, watch?: boolean) => void = () => {};
  onBack: () => void = () => {};
  /** Đang ở sân Đại Đấu Hồn Trường (MAPS kind `arena`): vẽ thanh trận đấu, thanh máu trên đầu hai hồn sư. */
  isArena = false;
  /** Trình diễn PK (G6 #397): băng rôn VS, bảng hạ gục, máu thấp, kết liễu; dựng lúc có state sân đấu đầu tiên. */
  show?: ArenaShow;
  /** Người xem trận (#280): vào sân bằng chỗ giữ xem, không có hồn sư; HUD chỉ đọc, camera theo `followSid`. */
  watching = false; followSid = ""; followV: PView | null = null;
  /** Gỡ mọi bộ nghe gắn vào window/DOM khi scene bị hủy (đổi bản đồ thì tạo scene mới). */
  ac = new AbortController();
  keys: Record<string, boolean> = {};
  joy = { x: 0, y: 0 };
  lastInput = "";
  /**
   * Điểm bấm chuột / chạm trên nền để đi tới (thế giới) và đường A* tới đó (`path`, điểm thứ `i` là điểm đang đi tới; 11.1), kèm khoảng
   * cách tới điểm đang đi và lúc kiểm tra gần nhất để dừng khi bị chặn.
   */
  autoLine: number[] = [];
  goal: { x: number; y: number; path: Pt[]; i: number; d: number; t: number; auto?: boolean } | null = null;
  /** Tự đi tới cờ (R4): đồ thị dẫn đường của bản đồ (dựng khi cần), khoảng cách tốt nhất tới đích và lúc cải thiện cuối, lúc xin qua cổng, lúc tính đường kế. */
  flagNav: Nav | null = null; flagLine: number[] = []; flagBest = Infinity; flagBestT = 0; flagCross = 0; flagPlanT = 0; flagDailyT = 0;
  grid: SolidGrid | null = null;    // lưới ô chặn của bản đồ (shared/move.ts): dự đoán chuyển động, tìm đường khi bấm chuột
  dir = { x: 0, y: 0 };             // hướng đi đã gửi gần nhất (đã làm tròn và chuẩn hóa như server đọc)
  walk = false;                     // input gửi gần nhất có giữ Shift (đi bộ, 11.1)
  pred: Predictor | null = null;    // dự đoán chuyển động của chính mình (mục 6); null khi tắt bằng ?nopredict
  ghost: Phaser.GameObjects.Graphics | null = null; // ?lag: khung đỏ ở vị trí server của chính mình (so với hình vẽ)
  lastZone = "";
  skillsKey = "";
  boneSkKey = "";                   // hồn cốt đang gắn trên võ hồn ra trận lần vẽ thanh kỹ năng hồn cốt gần nhất (4.3)
  hudT = 0;
  /** Tin `mini` gần nhất (11.4): vị trí theo ô của mọi hồn sư [sid, x, y], hồn thú từ nghìn năm và đồ rơi [x, y, bậc] cả bản đồ. */
  far: { p: (string | number)[]; b: number[]; d: number[] } = { p: [], b: [], d: [] };
  mapW = 0; mapH = 0;
  owned: OwnedVohons | null = null; // tin riêng "vohons" gần nhất (tên võ hồn theo ô khi báo đủ năng lượng tiên cơ)
  bag: BagMsg | null = null;        // tin riêng "bag" gần nhất: vẽ lại túi khi cấp / số hồn hoàn đổi (câu gợi ý hấp thụ)
  bagKey = "";
  gear: GearMsg | null = null;       // tin riêng "gear" gần nhất (trang bị hồn sư đang mặc, E1)
  charStats: StatsMsg | null = null; // tin riêng "stats" gần nhất (bảng nhân vật)
  combat = false;                   // đang giao chiến (tin riêng "squad"): bảng hấp thụ nhắc rời xa hồn thú
  party: PartyView | null = null;   // tin riêng "party" gần nhất (tổ đội người chơi, 7.1)
  audio!: AudioManager;
  lvVh = -1; lvSeen = 0;            // võ hồn ra trận và cấp ở khung trước: cấp tăng (cùng võ hồn) thì phát khúc ngắn lên cấp

  constructor() { super("game"); }
  init(data: { room: Room<any>; mapId: string; onTravel: (mapId: string, roomId: string | null) => void; onArena: (roomId: string, watch?: boolean) => void; onBack: () => void; watch?: boolean }) {
    this.room = data.room; this.mapId = data.mapId; this.me = data.room.sessionId; this.onTravel = data.onTravel;
    this.onArena = data.onArena; this.onBack = data.onBack; this.isArena = MAPS[data.mapId]?.kind === "arena"; this.watching = this.isArena && !!data.watch;
    hud.resetChannels(); // danh sách kênh của phòng trước không còn đúng
    // Scene tắt (đổi bản đồ, vào / ra sân đấu): bỏ các hộp gắn với bản đồ cũ (cổng, gợi ý / hộp thoại NPC, trường đấu).
    const off = () => {
      this.slowmo = 1; this.hitstopEnd = 0; this.anims.globalTimeScale = 1; this.tweens.timeScale = 1; this.ac.abort(); this.cine.destroy(); this.ptCut.destroy(); this.pt.clear(); this.lpc?.destroy(); this.audio?.dispose(); closeAudioPanel(); closeAutoPanel(); hud.showPortal(null, () => {}); hud.showTalk(null, () => {}); hud.closeNpc(); hud.closeLooks(); hud.showPlayerMenu(null);
      hud.setArenaQueue(null, () => {}); hud.showArena(null, () => {}); hud.arenaEnd(null, { back() {}, top() {} });
      this.show?.destroy(); this.show = undefined;
      hud.setFusionPending(null); hud.setFusionCd(0); // lời mời dung hợp gắn với phòng cũ (server đã hủy khi rời); hồi chiêu đọc lại từ vohons
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
    this.events.once(Phaser.Scenes.Events.DESTROY, off);
  }

  preload() {
    // Mỗi bản đồ một file Tiled: shared/assets/<mapId>.json (vite phục vụ shared/assets làm thư mục public).
    // 11.3 / 11.5: server dùng bản dựng bằng tools/maps (`<mapId>.v2`) thì báo tên file ở `mapFile` (cùng lưới va chạm với server).
    this.load.tilemapTiledJSON(this.mapId, `${this.room.state.mapFile || this.mapId}.json`);
    this.load.image("tiles", "tiles.png");
    preloadIso(this, this.mapId);
    preloadSprites(this, lpcPreloader(this, this.mapId)); // sheet NPC LPC: chỉ của NPC và dân thường bản đồ này (crowd.ts)
  }

  create() {
    // Lớp ô vẽ theo phép chiếu (isoMap.ts: ảnh isometric theo shared/assets/iso/tiles.json, 10.2); tilemap của Phaser chỉ còn dùng để đọc object và vẽ bản đồ nhỏ (nhìn thẳng).
    const map = this.make.tilemap({ key: this.mapId });
    const raw = this.cache.tilemap.get(this.mapId)?.data;
    // Ánh sáng (10.7): nền, vật đứng, nhà dùng pipeline Light2D của Lighting; vùng có mặt nước phát sáng thì IsoMap báo các điểm sáng.
    this.light = new Lighting(this, this.mapId);
    this.light.onAutoOff = () => hud.log("Máy vẽ chậm nên đã tắt ánh sáng (thêm ?light=1 vào địa chỉ trang để luôn bật).", "#ffb35c");
    this.isoMap = new IsoMap(this, raw, this.mapId, { lit: (im) => this.light.world(im), water: !!this.light.region.water });
    this.txtK = this.zoomFor() < 2 ? 2 / this.zoomFor() : 1; // chữ của cổng, NPC vẽ ngay dưới đây (fitZoom chạy sau)
    this.mapW = map.widthInPixels; this.mapH = map.heightInPixels;
    const npcObjs: { x: number; y: number; name: string; id: string }[] = [];
    const crowdMap: CrowdMap = { safes: this.safes, portals: [], spawn: null, npcs: npcObjs, arrives: [], mapW: map.widthInPixels, mapH: map.heightInPixels };
    let inkHere = false;
    for (const o of map.getObjectLayer("zones")?.objects ?? []) {
      const prop = (n: string) => (o.properties as any[] | undefined)?.find((p) => p.name === n)?.value;
      const r = { x: o.x!, y: o.y!, w: o.width!, h: o.height! };
      if (o.type === "zone") {
        // Gợi ý vùng kèm cấp tương đương của khoảng niên hạn (mục 5.3, BĐ3), tính bằng hàm dùng chung.
        const yr = parseLevelRange(prop("years")), lv = yr && [beastLevel(yr[0]), beastLevel(yr[1])];
        const hint = [prop("hint") ?? "", lv ? `cấp ${lv[0] === lv[1] ? lv[0] : `${lv[0]}–${lv[1]}`}` : ""].filter(Boolean).join(" · ");
        this.zones.push({ ...r, name: o.name, hint, years: yr });
      }
      if (o.type === "spawn") { this.campRect = r; this.campName = o.name; crowdMap.spawn = r; }
      if (o.type === "elite" && causesInk(String(prop("boss") ?? ""))) inkHere = true; // #175: bản đồ có Phun Mực
      if (o.type === "elite") this.eliteSpots.push({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
      if (o.type === "safe") this.safes.push({ ...r, name: o.name, hint: "Vùng an toàn: không có hồn thú, không giao chiến" });
      if (o.type === "portal" && MAPS[prop("to")]) this.portals.push({ ...r, to: prop("to") });
      if (o.type === "portal") crowdMap.portals.push({ ...r, boat: !!prop("boat") });
      if (o.type === "arrive") crowdMap.arrives.push({ x: o.x!, y: o.y! });
      if (o.type === "npc") npcObjs.push({ x: o.x!, y: o.y!, name: o.name, id: String(prop("npc") ?? "") });
      if (o.type === "boss") this.lair = r;
      if (o.type === "waypoint") this.waypoints.push({ ...r, key: `${this.mapId}:${o.name}`, label: String(prop("label") ?? o.name), text: null });
    }
    // #111: thương nhân lưu động ở trại cổng bản đồ săn, chỗ đứng tính từ file Tiled như server (shared/camp.ts).
    const camp = raw && campMerchantSpot(raw, this.mapId);
    if (camp && !npcObjs.some((n) => n.id === camp.id)) npcObjs.push({ ...camp, name: "" });
    // #163: Hỏa Đàn trong hang thú vương có Cực Hàn, chỗ đặt tính từ file Tiled như server (shared/hoaDan.ts); vẽ bằng code mỗi khung.
    if (raw) this.grid = solidGrid(raw);
    const hd = raw && hoaDanSpot(raw, this.mapId, this.grid ?? undefined);
    if (hd) {
      const c = W2S(hd.x, hd.y), top = c.y - 22 * SPR;
      this.hoaDan = { x: hd.x, y: hd.y, r: hd.cold.fire.r, g: this.add.graphics().setDepth(c.y) };
      this.wtext(this.add.text(c.x, top, "Hỏa Đàn", { fontFamily: FONT, fontSize: "6.5px", fontStyle: "700", color: "#ffc27a", stroke: "#000", strokeThickness: 2, resolution: 8 })
        .setOrigin(0.5, 1).setDepth(99984), top, 0);
    }
    this.drawPortals();
    this.drawWaypoints();
    this.buildMinimap(map);
    hud.setTrackerMap(this.mapId);
    // Dự đoán chuyển động: cùng lưới ô chặn của file Tiled mà server dùng (shared/move.ts; dựng ở trên, trước Hỏa Đàn).
    if (PREDICT && this.grid) this.pred = new Predictor(this.grid);
    if (LAG_MS || !PREDICT) {
      // Nhãn chế độ thử ở giữa mép trên (khung chỉ số chiếm góc trái); chỉ hiện khi có `?debug`; gỡ khi scene tắt (đổi bản đồ).
      if (DEBUG_TAG) {
        const tag = document.body.appendChild(document.createElement("div"));
        tag.textContent = `Trễ giả lập ${LAG_MS} ms mỗi chiều · dự đoán chuyển động: ${this.pred ? "bật" : "tắt"}`;
        tag.style.cssText = "position:fixed;top:4px;left:50%;transform:translateX(-50%);z-index:50;pointer-events:none;font:600 12px 'Be Vietnam Pro',system-ui,sans-serif;color:#ffe9a0;background:#000a;padding:2px 8px;border-radius:4px";
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => tag.remove());
        this.events.once(Phaser.Scenes.Events.DESTROY, () => tag.remove());
      }
      this.ghost = this.add.graphics().setDepth(99989);
      (window as any).__scene = this; // chỉ khi thử trễ: script đo (Chrome headless) đọc vị trí vẽ / vị trí server
    }
    makeTextures(this);
    createSheetAnims(this);
    // Normal map phụ thể (10.7) và sheet hồn thú isometric.
    for (const k of this.textures.getTextureKeys()) if (/^(vh_[a-z_]+_[bf]|beast_[a-z_]+)$/.test(k) && !k.endsWith("_n")) attachNormal(this, k);
    this.lpc = new LpcRig(this);
    for (const n of npcObjs) this.drawNpc(n.x, n.y, n.name, n.id); // NPC chưa có sheet `lpc_<mã>` dựng thân LPC từ `looks` qua lpcRig
    if (raw) this.crowd = new Crowd(this, this.mapId, solidGrid(raw), crowdMap);
    for (const p of this.crowd?.people ?? []) this.light.entity(p.spr); // dân thường cũng chịu ánh sáng thực thể (10.7)

    this.ov = this.add.graphics().setDepth(99990);
    this.fxp = new ParticleLayer(this, 99979, SPR);
    this.pt = new PhapTuongSystem(this, this.fxp); // pháp tướng Võ Hồn Chân Thân (#486)
    this.skfx = new SkillFx(this, this.fxp);
    registerCodeSheets(this); registerHitFeelSheets(this); this.svis = new SkillVisualPlayer(new SheetFx(this)); // S1 #542: sheet hiệu ứng theo chiêu (SKILL_VISUAL)
    void loadPrivateAssets(this); // #623: kho riêng (không chặn vào game; không có kho thì không làm gì)
    this.teleTop = this.add.graphics().setDepth(99983.5); // trên mọi hiệu ứng chiêu (≤ 99983), dưới tên / số sát thương
    this.teleG = this.add.graphics().setDepth(2); // vùng cảnh báo nằm trên mặt đất, dưới hồn sư và hồn thú
    const cam = this.cameras.main;
    const bb = this.isoMap.bounds();
    cam.setBounds(bb.x, bb.y, bb.w, bb.h).setRoundPixels(true);
    this.fitZoom();
    this.scale.on("resize", () => this.fitZoom());

    this.weather = new Weather(this, this.mapId, this.isoMap, this.light, this.mapH);
    this.ink = new InkVeil(this);
    if (inkHere) this.ink.prewarm();
    this.audio = new AudioManager(this, () => {
      const p = this.room.state.players.get(this.me);
      return p && Number.isFinite(p.x) && Number.isFinite(p.y) ? { x: p.x, y: p.y } : null;
    }, (message: AudioEvent) => {
      const player = message.id ? this.room.state.players.get(message.id) : undefined;
      const beast = message.bid ? this.room.state.beasts.get(message.bid) : undefined;
      const source = player ?? beast;
      return source && Number.isFinite(source.x) && Number.isFinite(source.y) ? { x: source.x, y: source.y } : null;
    });
    this.audio.bindUnlock(this.ac.signal);
    bindUiSounds(this.audio, this.ac.signal); // mở / đóng panel, kéo thả (G5, #396)
    this.audio.music?.setMap(this.room.state.mapId || this.mapId); // nhạc nền theo bản đồ trong state (#134); bài cũ mờ chéo sang
    bindAudioPanel(this.audio, this.ac.signal);
    // Bảng Tự động (Auto 2): tên võ hồn theo ô đội hình và hồn kỹ ở 4 ô của võ hồn đang ra trận, đọc từ tin `vohons` gần nhất.
    const ownedAt = (rowId: number | undefined) => this.owned?.list.find((v) => v.rowId === rowId);
    bindAutoPanel({
      send: (op, cfg) => this.room.send("auto", cfg ? { op, cfg } : { op }),
      slotName: (i) => { const v = ownedAt(this.owned?.team[i]); return v ? `${VOHON[Math.max(0, vohonIndex(v.vohon))].name} cấp ${v.level}` : ""; },
      skillName: (i) => {
        const v = ownedAt(this.owned?.active); if (!v) return "";
        const r = loadoutOf(v.vohon, v.skills)[i];
        return r >= 0 && r < v.rings.length ? ringSkill(v.vohon, r)?.name ?? "" : "";
      },
    }, this.ac.signal);
    this.setupInput();
    this.setupMessages();
    document.getElementById("hud")!.hidden = false;
    document.body.classList.add("playing");
  }

  /** Cổng: khung sáng nhấp nháy và tên bản đồ đích (server mới quyết định có cho đi hay không). */
  drawPortals() {
    for (const r of this.portals) {
      // Khung chữ nhật thế giới chiếu thành hình bình hành trên mặt đất (isometric: hình thoi), nằm dưới hồn sư.
      const pts = ptsToScreen([{ x: r.x, y: r.y }, { x: r.x + r.w, y: r.y }, { x: r.x + r.w, y: r.y + r.h }, { x: r.x, y: r.y + r.h }]);
      const g = this.add.graphics().setDepth(1);
      g.fillStyle(0x86e0b0, 0.22).fillPoints(pts, true);
      g.lineStyle(1, 0xc8ffe0, 0.9).strokePoints(pts, true, true);
      this.tweens.add({ targets: g, alpha: 0.45, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      // Nhìn thẳng: cổng sát mép trên bản đồ (cổng bắc Nặc Đinh Thành, BĐ6a) ghi tên dưới cổng, không thì khuất ngoài bản đồ.
      // Isometric: camera chừa lề trên bản đồ nên tên luôn ghi trên đỉnh cao nhất của cổng.
      const top = TOPDOWN && r.y < TILE, ys = pts.map((p) => p.y), cx = pts.reduce((a, p) => a + p.x, 0) / 4;
      const t = this.add.text(cx, 0, `➜ ${MAPS[r.to].name}`, {
        fontFamily: FONT, fontSize: "7px", fontStyle: "700", color: "#c8ffe0", stroke: "#000", strokeThickness: 2, resolution: 8,
      }).setOrigin(0.5, top ? 0 : 1).setDepth(99984);
      this.wtext(t, top ? Math.max(...ys) + 2 : Math.min(...ys) - 2, 0);
    }
  }

  /**
   * Truyền tống trận (11.2): tên trên trận (✦, mờ khi chưa mở) và vùng bấm / chạm mở bản đồ thế giới. Vòng trận phát sáng vẽ mỗi khung ở
   * `paintWaypoints` (phong cách A: hồn lực sáng màu lam ngọc; chưa mở thì xám mờ), không dùng ảnh.
   */
  drawWaypoints() {
    for (const w of this.waypoints) {
      const c = W2S(w.x + w.w / 2, w.y + w.h / 2), top = c.y - 10 * SPR;
      w.text = this.add.text(c.x, top, "", {
        fontFamily: FONT, fontSize: "6.5px", fontStyle: "700", color: "#bfefff", stroke: "#000", strokeThickness: 2, resolution: 8,
      }).setOrigin(0.5, 1).setDepth(99984);
      this.wtext(w.text, top, 0);
      this.add.zone(c.x, c.y, 26 * SPR, 14 * SPR).setInteractive({ useHandCursor: true }).on("pointerdown", () => this.openWorld(true));
    }
    this.labelWaypoints();
  }
  labelWaypoints() {
    for (const w of this.waypoints) {
      const open = this.wpOpen.has(w.key);
      w.text?.setText(`✦ ${w.label}${open ? "" : " (chưa mở)"}`).setColor(open ? "#bfefff" : "#b8b8c4");
    }
  }
  /** Vòng trận trên mặt đất (lớp vùng cảnh báo, dưới hồn sư): hai vòng, 8 phù văn xoay chậm, tâm thoi; đã mở thì sáng nhịp. */
  paintWaypoints(g: Phaser.GameObjects.Graphics, time: number) {
    for (const w of this.waypoints) {
      const x = w.x + w.w / 2, y = w.y + w.h / 2, open = this.wpOpen.has(w.key), col = open ? 0x8fe0ff : 0x9a9aa8;
      const pulse = open ? 0.75 + 0.25 * Math.sin(time / 420) : 0.45, R = Math.max(w.w, w.h) * 0.75;
      g.fillStyle(col, 0.14 * pulse); fillGround(g, x, y, R);
      g.lineStyle(1.5, col, 0.85 * pulse); strokeGround(g, x, y, R);
      g.lineStyle(1, col, 0.6 * pulse); strokeGround(g, x, y, R * 0.66);
      const spin = open ? time / 2600 : 0;
      for (let i = 0; i < 8; i++) {
        const a = spin + (i * Math.PI) / 4, b = W2S(x + Math.cos(a) * R * 0.72, y + Math.sin(a) * R * 0.72), e = W2S(x + Math.cos(a) * R * 0.94, y + Math.sin(a) * R * 0.94);
        g.lineStyle(1.5, col, 0.9 * pulse).lineBetween(b.x, b.y, e.x, e.y);
      }
      const d = [W2S(x, y - R * 0.3), W2S(x + R * 0.3, y), W2S(x, y + R * 0.3), W2S(x - R * 0.3, y)];
      g.fillStyle(open ? 0xe8fbff : 0xb8b8c4, 0.7 * pulse).fillPoints(d, true);
    }
  }
  /**
   * Hỏa Đàn (#163, Cực Hàn): vòng hơi ấm bán kính xả tầng Hàn trên mặt đất (lớp `g` dưới hồn sư), và đống lửa (vòng đá, hai khúc củi,
   * ba lưỡi lửa lay theo thời gian, tàn lửa bay lên) ở lớp riêng xếp theo chân. Nguồn sáng ở lightSources.
   */
  paintHoaDan(g: Phaser.GameObjects.Graphics, time: number) {
    const h = this.hoaDan; if (!h) return;
    const c = W2S(h.x, h.y), v = this.cameras.main.worldView, m = 2 * RX * h.r;
    // Ngoài khung hình (cách xa hang) thì không vẽ lại mỗi khung.
    if (c.x < v.x - m || c.x > v.right + m || c.y < v.y - m || c.y > v.bottom + m) { if (h.g.visible) h.g.clear().setVisible(false); return; }
    h.g.setVisible(true);
    const pulse = 0.8 + 0.2 * Math.sin(time / 380);
    g.fillStyle(0xff9a3c, 0.12 * pulse); fillGround(g, h.x, h.y, h.r);
    g.lineStyle(1.5, 0xffb45a, 0.6 * pulse); strokeGround(g, h.x, h.y, h.r);
    const f = h.g, k = SPR, x = c.x, y = c.y;
    f.clear();
    f.fillStyle(0x1a1020, 0.35).fillEllipse(x, y + k, 18 * k, 7 * k);
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; f.fillStyle(i % 2 ? 0x3e3a44 : 0x58545e, 1).fillEllipse(x + Math.cos(a) * 7 * k, y + Math.sin(a) * 3 * k, 4 * k, 2.6 * k); }
    f.lineStyle(2.2 * k, 0x5a3a22, 1).lineBetween(x - 6 * k, y + k, x + 5 * k, y - 2 * k).lineBetween(x - 5 * k, y - 2 * k, x + 6 * k, y + k);
    const fl = (ph: number) => 0.85 + 0.15 * Math.sin(time / 90 + ph) + 0.08 * Math.sin(time / 37 + ph * 2);
    const tongue = (dx: number, w: number, hgt: number, col: number, ph: number) => {
      const hh = hgt * fl(ph) * k, sway = Math.sin(time / 160 + ph) * 1.2 * k;
      f.fillStyle(col, 0.95).fillTriangle(x + (dx - w) * k, y - k, x + (dx + w) * k, y - k, x + dx * k + sway, y - k - hh);
    };
    tongue(-2.5, 2.6, 9, 0xff5a1e, 0); tongue(2.5, 2.6, 8, 0xff5a1e, 1.7); tongue(0, 3.4, 13, 0xff9a3c, 0.9); tongue(0, 2, 8, 0xffe08a, 2.3);
    for (let i = 0; i < 4; i++) {
      const t = ((time / 900 + i * 0.27) % 1), ex = x + Math.sin(time / 300 + i * 2.1) * 3 * k, ey = y - (10 + t * 16) * k;
      f.fillStyle(0xffc27a, 0.9 * (1 - t)).fillRect(ex, ey, k * 0.8, k * 0.8);
    }
  }
  /** Cột sáng trên hồn sư đang niệm truyền tống (fx `wpcast`), mỗi khung; hết giờ hoặc hồn sư rời phòng thì bỏ. */
  paintWpCasts(g: Phaser.GameObjects.Graphics, time: number) {
    for (const [id, c] of this.wpCasts) {
      const v = this.players.get(id), k = (time - c.t0) / c.ms;
      if (!v || k > 1.2) { this.wpCasts.delete(id); continue; }
      const { x, y } = v.root, h = (14 + 26 * Math.min(1, k)) * SPR, a = 0.25 + 0.35 * Math.min(1, k);
      g.fillStyle(0x8fe0ff, a * 0.5).fillRect(x - 5 * SPR, y - h, 10 * SPR, h);
      g.fillStyle(0xe8fbff, a).fillRect(x - 2 * SPR, y - h, 4 * SPR, h);
      for (let i = 0; i < 4; i++) {
        const t = ((time / 700 + i / 4) % 1), px = x + Math.sin(time / 300 + i * 1.7) * 7 * SPR;
        g.fillStyle(0xbfefff, 1 - t).fillRect(px - SPR, y - t * h - SPR, 2 * SPR, 2 * SPR);
      }
    }
  }
  /** Mở / đóng bản đồ thế giới; mở thì xin server tin `world` mới (trận đã mở, phí, đang đứng trên trận nào). */
  openWorld(open?: boolean) {
    if (hud.toggleWorld(open)) this.room.send("wp", { op: "list" });
  }

  /**
   * NPC (object `npc`, bước 6.1): NPC có sheet LPC `lpc_<mã>` (mục 5.11 "NPC phụ và dân thường") vẽ bằng sheet đó, không thì NPC có
   * `looks` trong NPCS vẽ bằng thân LPC ghép lúc chạy (HL3 #572; preset kiểu cũ đổi bằng presetToLpc); cả hai đứng yên nhìn xuống.
   * Không có cả hai hoặc mã lạ thì vẽ biển hiệu. Tên (màu NPC)
   * và chức danh trên đầu; bấm / chạm vào NPC để nói chuyện (server kiểm tra khoảng cách).
   */
  drawNpc(x: number, y: number, name: string, id: string) {
    const def = npcDef(id), w = W2S(x, y), sx = w.x, sy = w.y; // vị trí thế giới (x, y) chiếu ra màn hình (sx, sy)
    let body: Sprite | null = null, top = sy - 16 * SPR;
    const sheet = def && this.textures.exists(`lpc_${def.id}`) ? `lpc_${def.id}` : def?.looks ? this.lpc.acquire(npcLpcStr(def.looks)) : null; // thân LPC của NPC giữ suốt bản đồ (scene tắt thì lpc.destroy)
    if (sheet) {
      body = fitHonsuLayer(this.make.sprite({ key: sheet }, false));
      body.play(honsuAnimKey(sheet, "idle", "s").key);
      this.light.entity(body); // Light2D thực thể (10.7)
      this.add.container(sx, sy, [this.make.image({ key: "hs_shadow" }, false), body]).setDepth(sy).setScale(SPR);
      top = sy - HEAD;
    } else {
      const g = this.add.graphics().setDepth(sy), k = SPR;
      g.fillStyle(0x000000, 0.35).fillEllipse(sx, sy + k, 10 * k, 4 * k);
      g.fillStyle(0xf2c84b, 1).fillTriangle(sx - 3 * k, sy - 10 * k, sx + 3 * k, sy - 10 * k, sx, sy - 4 * k);
      g.fillStyle(0xfff2b0, 1).fillCircle(sx, sy - 12 * k, 2.5 * k);
    }
    // Chữ trên đầu NPC: độ lệch so với `top` tính bằng pixel chữ chưa phóng, wtext nhân txtK (và đặt lại khi txtK đổi).
    const style = { fontFamily: FONT, fontStyle: "700", stroke: "#000", strokeThickness: 2, resolution: 8 };
    this.wtext(this.add.text(sx, top, def?.name ?? name, { ...style, fontSize: "7px", color: def?.col ?? "#f2c84b" }).setOrigin(0.5, 1).setDepth(99984), top, 0);
    if (def) this.wtext(this.add.text(sx, top, def.title, { ...style, fontSize: "5.5px", fontStyle: "600", color: "#d8d2c0" }).setOrigin(0.5, 1).setDepth(99984), top, 8);
    let mark: Phaser.GameObjects.Text | null = null;
    if (def) {
      mark = this.add.text(sx, top, document.body.classList.contains("touch") ? "Chạm để nói chuyện" : "Nói chuyện [F]", {
        ...style, fontSize: "6px", color: "#fff2b0", backgroundColor: "#000000aa", padding: { x: 3, y: 1 },
      }).setOrigin(0.5, 1).setDepth(99986).setVisible(false);
      this.wtext(mark, top, 16, { dy: 2, ms: 600 });
      // Vùng bấm phủ cả hình và tên: chuột hoặc chạm đều được.
      this.add.zone(sx, (top + sy) / 2, 22 * SPR, sy - top + 12 * SPR).setInteractive({ useHandCursor: true }).on("pointerdown", () => this.talk(def.id));
    }
    // 6.2: NPC giao nhiệm vụ có dấu "!" (bài mới) / "?" (chờ trả, xám khi đang làm) phía trên nhãn "Nói chuyện".
    let qmark: Phaser.GameObjects.Text | null = null;
    if (def && hud.QUEST_GIVERS.has(def.id)) {
      qmark = this.add.text(sx, top, "", { ...style, fontSize: "12px", fontStyle: "800", color: "#ffd84a", strokeThickness: 3 })
        .setOrigin(0.5, 1).setDepth(99987).setVisible(false);
      this.wtext(qmark, top, 25, { dy: 3, ms: 700 });
    }
    this.npcs.push({ id, x, y, def, body, mark, qmark });
    this.updateQuestMarks();
  }

  /**
   * Dấu nhiệm vụ trên đầu NPC giao nhiệm vụ theo tiến độ (6.2): "!" có bài mới, "?" vàng đủ mục tiêu chờ trả, "?" xám đang làm.
   * Phất Lan Đức gộp cả bộ khảo hạch hằng ngày (hud.questMark).
   */
  updateQuestMarks() {
    for (const n of this.npcs) {
      if (!n.qmark) continue;
      const st = hud.questMark(n.id);
      n.qmark.setVisible(!!st);
      if (st === "offer") n.qmark.setText("!").setColor("#ffd84a");
      else if (st === "ready") n.qmark.setText("?").setColor("#ffd84a");
      else if (st === "active") n.qmark.setText("?").setColor("#a8a8a8");
    }
  }

  /** Xin nói chuyện với NPC `id`: server kiểm tra khoảng cách rồi gửi riêng tin `npc` để mở hộp thoại (6.1). */
  talk(id: string) { this.room.send("talk", { npc: id }); }

  /**
   * Mỗi lần cập nhật HUD: NPC gần nhất trong NPC_RANGE hiện nhãn "Nói chuyện" và hộp gợi ý (nút bấm / phím F; cổng được ưu tiên),
   * đi xa NPC đang mở hộp thoại thì đóng (server vẫn kiểm tra lại mỗi lần mua / bán).
   */
  updateNpcs(me: any) {
    let near: (typeof this.npcs)[number] | null = null, nd = NPC_RANGE;
    for (const n of this.npcs) { const k = Math.hypot(n.x - me.x, n.y - me.y); if (n.def && k <= nd && !me.dead) { nd = k; near = n; } }
    const id = near && !this.portal ? near.id : null;
    if (id !== this.nearNpc) {
      this.nearNpc = id;
      for (const n of this.npcs) n.mark?.setVisible(n.id === id);
      hud.showTalk(id ? near!.def! : null, () => id && this.talk(id));
    }
    const open = hud.npcOpenId(), on = open && this.npcs.find((n) => n.id === open);
    if (on && Math.hypot(on.x - me.x, on.y - me.y) > NPC_RANGE + 12) hud.closeNpc();
  }

  /**
   * Hệ số phóng camera (10.1, mục 5.11): số nguyên lớn nhất còn chứa đủ VIEW_W × VIEW_H (×2 ở 720p, ×3 ở 1080p), pixel art không mờ;
   * cửa sổ lẻ cỡ thì thấy rộng hơn một chút, không phóng lẻ.
   */
  zoomFor() { return Math.max(1, Math.floor(Math.min(this.scale.width / VIEW_W, this.scale.height / VIEW_H))); }
  /** Chữ trong thế giới (tên, số sát thương…) phóng thêm khi camera phóng 1 (cửa sổ nhỏ, điện thoại) để vẫn đọc được như khi phóng 2. */
  txtK = 1;
  /**
   * Chữ tĩnh trong thế giới (tên / chức danh / nhãn NPC, tên cổng): mốc `y0` (pixel màn hình), độ lệch lên `off` tính bằng pixel chữ
   * chưa phóng, nhấp nhô `bob` nếu có. Đổi txtK (đổi cỡ cửa sổ) thì `layoutTexts` đặt lại tỉ lệ, vị trí và tween nhấp nhô.
   */
  wtexts: { t: Phaser.GameObjects.Text; y0: number; off: number; bob?: { dy: number; ms: number } }[] = [];
  wtext(t: Phaser.GameObjects.Text, y0: number, off: number, bob?: { dy: number; ms: number }) {
    const e = { t, y0, off, bob }; this.wtexts.push(e); this.placeText(e); return t;
  }
  placeText(e: GameScene["wtexts"][number]) {
    const K = this.txtK, y = e.y0 - e.off * K;
    this.tweens.killTweensOf(e.t);
    e.t.setScale(K).setY(y);
    if (e.bob) this.tweens.add({ targets: e.t, y: y - e.bob.dy * K, duration: e.bob.ms, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  fitZoom() {
    const z = this.zoomFor();
    const k = z < 2 ? 2 / z : 1;
    if (k !== this.txtK) { this.txtK = k; for (const e of this.wtexts) this.placeText(e); }
    this.cameras.main.setZoom(z);
  }

  // ---------- Điều khiển ----------
  setupInput() {
    const chat = document.getElementById("chat") as HTMLInputElement;
    const typing = () => document.activeElement === chat;
    // Ô nhập khác trên HUD (niên hạn, sao hồn hạch ở bảng Tự động, ô mời tổ đội): phím thuộc về ô, không phải phím tắt game.
    // Ô đánh dấu / thanh trượt / nút không tính (bảng tự bỏ tiêu điểm sau khi đổi).
    const field = (t: EventTarget | null) => t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement ||
      (t instanceof HTMLInputElement && !["checkbox", "radio", "range", "button"].includes(t.type));
    const on = { signal: this.ac.signal };
    addEventListener("keydown", (e) => {
      if (this.watching) return; // người xem: không phím tắt, không chat
      // Màn đổi ngoại hình (thợ may) phủ lên game: phím thuộc về màn (Tab / Enter / Space bấm nút); Esc đóng màn; không di chuyển, đánh, đổi võ hồn.
      if (hud.looksOpen()) { this.keys = {}; if (e.code === "Escape") hud.closeLooks(); return; }
      if (typing()) {
        if (e.key === "Enter") { const t = chat.value.trim(); if (t && !this.chatCommand(t)) this.chatSend(t); chat.value = ""; chat.blur(); }
        if (e.key === "Escape") chat.blur();
        return;
      }
      const f = document.activeElement;
      if (field(f)) { if (e.code !== "Escape") return; (f as HTMLElement).blur(); } // Esc: rời ô rồi đóng bảng như thường
      if (e.key === "Enter") { chat.focus(); e.preventDefault(); return; }
      if (e.code === "KeyH" && !e.repeat) { closeAudioPanel(); closeAutoPanel(); toggleChar(); return; } // bảng nhân vật (UI-2), độc lập với Túi (NV1 #455); C là kỹ năng hồn cốt tay phải nên không dùng để mở bảng (NV5 #459)
      if ((e.code === "BracketLeft" || e.code === "BracketRight") && cycleCharTab(e.code === "BracketRight" ? 1 : -1)) { e.preventDefault(); return; } // chuyển tab búp bê khi bảng Nhân vật đang mở (NV5 #459)
      if (e.code === "KeyV" && !e.repeat) { closeAudioPanel(); closeAutoPanel(); hud.toggleRoster(); return; }
      if (e.code === "KeyB" && !e.repeat) { closeAudioPanel(); closeAutoPanel(); hud.toggleBag(); return; }
      if (e.code === "KeyK" && !e.repeat) { closeAudioPanel(); closeAutoPanel(); hud.toggleReso(); return; } // cộng minh (8.2)
      if (e.code === "KeyL" && !e.repeat) { closeAudioPanel(); closeAutoPanel(); hud.toggleFriends(); return; } // bạn bè và chặn (#195)
      if (e.code === "KeyM" && !e.repeat) { closeAudioPanel(); closeAutoPanel(); this.openWorld(); return; } // bản đồ thế giới (11.2): chỉ xem nếu không đứng trên trận
      if (e.code === "KeyY" && !e.repeat) { if (getFlag()?.on) this.flagStop("Đã dừng tự đi"); else this.flagGo(); return; } // tự đi tới cờ (R4)
      if (e.code === "KeyN" && !e.repeat) { closeAudioPanel(); closeAutoPanel(); mapview().toggle(); return; } // bản đồ khu vực (R3): lớp phủ, không dừng game
      if (e.code === "Escape" && mapview().isOpen) { mapview().close(); return; }
      if (e.code === "Escape" && hud.chatClose()) return; // khung chat đang mở (chọn tab): Esc đóng nó trước
      if (e.code === "Escape") { closeAudioPanel(); closeAutoPanel(); toggleChar(false); hud.toggleRoster(false); hud.toggleBag(false); hud.toggleReso(false); hud.toggleFriends(false); hud.toggleWorld(false); hud.closeNpc(); hud.showPlayerMenu(null); hud.toggleChannels(false); closeAutoSum(); return; }
      if (e.code === "KeyT" && !e.repeat) { this.toggleAuto(); return; } // tự săn (Auto 1)
      if (e.code === "KeyF" && !e.repeat) { if (this.portal?.name) this.goPortal(); else if (this.wpHere) this.openWorld(true); else if (this.nearNpc) this.talk(this.nearNpc); return; }
      this.keys[e.code] = true;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      if (e.repeat && e.code !== "KeyJ" && e.code !== "Space") return;
      // Phím số 1–4: đổi sang võ hồn ở ô tương ứng của đội; hồn kỹ dùng U, I, O, P (hud.SKILL_KEYS).
      const sk = hud.SKILL_KEYS.findIndex((k) => e.code === "Key" + k);
      const bk = hud.BONE_SKILL_KEYS.findIndex((k) => e.code === "Key" + k); // kỹ năng hồn cốt Z / X / C (4.3)
      if (e.code === "Key" + hud.AVA_KEY) return this.act("chanthan"); // Võ Hồn Chân Thân (8.1a)
      if (e.code === "Key" + hud.FUSION_KEY) { if (!this.isArena) this.act("fusion"); return; } // Võ Hồn Dung Hợp Kỹ: mời / hưởng ứng (#193); sân đấu cấm
      const slot = /^Digit\d$/.test(e.code) ? Number(e.code.slice(5)) - 1 : -1;
      if (e.code === "KeyJ" || e.code === "Space") this.act("attack");
      else if (e.code === "KeyE") this.act("pickup");
      else if (sk >= 0) this.act("skill" + sk);
      else if (bk >= 0) this.act("bone" + bk);
      else if (slot >= 0 && slot < TEAM_SIZE) this.act("switch" + slot);
    }, on);
    addEventListener("keyup", (e) => { this.keys[e.code] = false; }, on);
    addEventListener("blur", () => { this.keys = {}; }, on);
    chat.addEventListener("focus", () => { this.keys = {}; hud.chatFocus(true); }, on);
    chat.addEventListener("blur", () => hud.chatFocus(false), on);
    hud.buildChatTabs(); // tab kênh chat (#188); lịch sử giữ qua đổi bản đồ trong phiên
    addEventListener("focusin", (e) => { if (field(e.target) || hud.looksOpen()) this.keys = {}; }, on); // phím đang giữ lúc vào ô nhập thì nhả
    initDualWindows();
    document.getElementById("charBtn")!.addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); closeAudioPanel(); closeAutoPanel(); toggleChar(); }, on);
    document.getElementById("vhBtn")!.addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); closeAudioPanel(); closeAutoPanel(); hud.toggleRoster(); }, on);
    document.getElementById("bagBtn")!.addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); closeAudioPanel(); closeAutoPanel(); hud.toggleBag(); }, on);
    document.getElementById("resBtn")!.addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); closeAudioPanel(); closeAutoPanel(); hud.toggleReso(); }, on);
    mapview().beforeOpen = () => { closeAudioPanel(); closeAutoPanel(); }; // nút Vùng do mapview.ts gắn một lần (cảm ứng chạy ngay lúc chạm)
    radar().onOpen = () => mapview().open();
    mapview().onFlag = (t) => this.mapFlag(t);
    mapview().onRally = (t) => this.rallyPlace(t.tx, t.ty);
    mapview().canRally = () => this.inParty();
    radar().onRally = (tx, ty) => this.rallyPlace(tx, ty);
    radar().onRallyGo = (tx, ty) => this.rallyGo(tx, ty);
    mapview().flagActs = { go: () => this.flagGo(), stop: () => this.flagStop("Đã dừng tự đi"), clear: () => this.flagClear() };
    bindFlagBar(() => this.flagGo(), () => this.flagStop("Đã dừng tự đi"), () => this.flagClear());
    hud.onWorldAuto((map) => this.flagToMap(map));
    document.getElementById("worldBtn")!.addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); closeAudioPanel(); closeAutoPanel(); this.openWorld(); }, on);
    // Nút "Tự động" mở bảng cài đặt (Auto 2); phím T vẫn bật / tắt ngay.
    document.getElementById("autoBtn")!.addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); closeAudioPanel(); toggleAutoPanel(); }, on);
    hud.onWorldGo((key) => this.room.send("wp", { op: "go", key }));
    hud.onResonanceTop((page, pageSize) => this.room.send("resonance", { op: "top", page, pageSize }));
    // Chọn kênh (mục 6 "Nhiều kênh"): mở danh sách thì xin server số người từng kênh; bấm một kênh thì gửi ý định đổi kênh.
    document.getElementById("chanBtn")!.addEventListener("click", (e) => {
      (e.currentTarget as HTMLElement).blur();
      if (hud.toggleChannels()) this.room.send("channels");
    }, on);
    hud.onChannelPick((ch) => { this.room.send("channel", { ch }); hud.toggleChannels(false); });

    // Bấm / chạm vào hồn sư khác (7.1): mở bảng mời vào tổ đội. Chọn hồn sư gần điểm bấm nhất (thân cao khoảng 30 pixel trên chân).
    // Bấm nền đất (không trúng hồn sư khác, NPC): đi tới điểm đó. Điểm bấm chiếu ngược ra tọa độ thế giới; client chỉ tự lái hướng
    // đi gửi trong `input` như khi giữ phím, server vẫn tính vị trí và va chạm (10.1).
    this.input.on("pointerdown", (ptr: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.watching) { // người xem: bấm / chạm hồn sư để theo dõi người đó, không đi, không mời đội
        let sid = "", bd = 14 * SPR;
        this.players.forEach((v, id) => { const k = Math.hypot(ptr.worldX - v.root.x, (ptr.worldY - (v.root.y - 12 * SPR)) * 0.7); if (k < bd) { bd = k; sid = id; } });
        if (sid) this.followSid = sid;
        return;
      }
      // Điểm bấm và hình hồn sư đều ở tọa độ màn hình (camera) nên so thẳng; thân phóng SPR.
      let best: { sid: string; name: string; level: number } | null = null, bd = 14 * SPR;
      this.room.state.players.forEach((p: any, id: string) => {
        if (id === this.me) return;
        const v = this.players.get(id), at = v?.root ?? W2S(p.x, p.y), x = at.x, y = at.y - 12 * SPR, k = Math.hypot(ptr.worldX - x, (ptr.worldY - y) * 0.7);
        if (k < bd) { bd = k; best = { sid: id, name: p.name, level: p.level }; }
      });
      hud.showPlayerMenu(best);
      if (!best && !over.length && ptr.button === 0) this.walkTo(screenToWorld(ptr.worldX, ptr.worldY));
    });

    const joyEl = document.getElementById("joy")!, knob = document.getElementById("knob")!;
    let jid: number | null = null;
    const mv = (e: PointerEvent) => {
      const r = joyEl.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy), m = 48; if (d > m) { dx *= m / d; dy *= m / d; }
      this.joy = { x: dx / m, y: dy / m }; knob.style.transform = `translate(${dx}px,${dy}px)`;
    };
    joyEl.addEventListener("pointerdown", (e) => { jid = e.pointerId; joyEl.setPointerCapture(e.pointerId); mv(e); }, on);
    joyEl.addEventListener("pointermove", (e) => { if (e.pointerId === jid) mv(e); }, on);
    const end = (e: PointerEvent) => { if (e.pointerId !== jid) return; jid = null; this.joy = { x: 0, y: 0 }; knob.style.transform = ""; };
    joyEl.addEventListener("pointerup", end, on); joyEl.addEventListener("pointercancel", end, on);
  }

  /**
   * Lệnh trong ô chat (7.1, #188): `/moi <tên>` mời vào tổ đội, `/roi` rời tổ đội, `/b <tin>` bản đồ, `/d <tin>` tổ đội, `/t <tên> <tin>`
   * nhắn riêng, `/r <tin>` trả lời người vừa nhắn riêng, `/tm <tin>` tông môn (#198), `/tg <tin>` kênh thế giới, `/hat` hạt bay. Trả true
   * nếu là lệnh (không gửi theo tab đang chọn). Mọi giới hạn (cấp, hồi, người nhận online, có tông, chống spam) do server kiểm.
   */
  chatCommand(t: string) {
    const m = /^\/(\S+)\s*(.*)$/u.exec(t); if (!m) return false;
    const cmd = m[1].toLowerCase(), arg = m[2].trim();
    const need = (usage: string) => hud.log(`Gõ ${usage}.`, "#ffb35c");
    if (cmd === "moi" || cmd === "mời") {
      if (arg) this.partySend("invite", arg); else need("/moi <tên hồn sư> để mời vào tổ đội");
    } else if (cmd === "roi" || cmd === "rời") this.partySend("leave");
    else if (cmd === "gm") this.room.send("gm", { cmd: arg }); // lệnh GM của tài khoản admin (#518): server kiểm quyền và cú pháp, người thường chỉ nhận lời từ chối
    else if (cmd === "b") { if (arg) this.room.send("chat", { text: arg }); else need("/b <tin> để chat ở bản đồ"); }
    else if (cmd === "d" || cmd === "đ") { if (arg) this.room.send("chat", { text: arg, ch: "party" }); else need("/d <tin> để chat tổ đội"); }
    else if (cmd === "tg") { if (arg) this.room.send("chat", { text: arg, ch: "world" }); else need("/tg <tin> để chat kênh thế giới"); }
    else if (cmd === "tm") { if (arg) this.room.send("chat", { text: arg, ch: "tong" }); else need("/tm <tin> để chat tông môn"); }
    else if (cmd === "t") {
      const w = this.whisperArg(arg);
      if (w) this.room.send("chat", { text: w.text, ch: "whisper", to: w.to }); else need("/t <tên> <tin> để nhắn riêng (tên có dấu cách thì để trong ngoặc kép)");
    } else if (cmd === "r") {
      const to = hud.chatReplyTo();
      if (!to) hud.log("Chưa có ai nhắn riêng cho bạn.", "#ffb35c");
      else if (arg) this.room.send("chat", { text: arg, ch: "whisper", to }); else need(`/r <tin> để trả lời ${to}`);
    }
    else if (cmd === "hat" || cmd === "hạt") hud.log(`Hạt bay và thời tiết: ${this.weather.toggle() ? "bật" : "tắt"}.`, "#ffb35c");
    else hud.log("Lệnh: /b, /d, /t <tên>, /r, /tm, /tg <tin> (bản đồ, tổ đội, riêng, trả lời, tông môn, thế giới), /moi <tên>, /roi (tổ đội), /hat (hạt bay, thời tiết).", "#ffb35c");
    return true;
  }

  /** Tin thường (không phải lệnh) gửi theo tab đang chọn của ô chat (#188). */
  chatSend(text: string) {
    const c = hud.chatSendCh();
    if (c.ch === "whisper" && !c.to) return hud.log("Chọn người nhận: /t <tên> <tin>, hoặc bấm vào hồn sư → Nhắn riêng.", "#ffb35c");
    this.room.send("chat", c.ch === "map" ? { text } : { text, ...c });
  }

  /**
   * Tách `/t` thành người nhận và tin. Tên có dấu cách: `"Đường Tam" tin`, hoặc khớp tên dài nhất đã biết (hồn sư đang thấy, đồng đội,
   * người vừa nhắn riêng); còn lại lấy từ đầu tiên. Server tra tên thật (không phân biệt hoa thường).
   */
  whisperArg(arg: string): { to: string; text: string } | null {
    const q = /^"([^"]+)"\s+(.+)$/u.exec(arg);
    if (q) return { to: q[1].trim(), text: q[2].trim() };
    const known = new Set<string>([hud.chatReplyTo(), ...(this.party?.members.map((m) => m.name) ?? [])]);
    this.room.state.players.forEach((p: { name: string }) => known.add(p.name));
    const low = arg.toLowerCase();
    let to = "";
    for (const n of known) if (n && n.includes(" ") && n.length > to.length && low.startsWith(n.toLowerCase() + " ")) to = n;
    if (!to) to = arg.split(" ")[0];
    const text = arg.slice(to.length).trim();
    return to && text ? { to, text } : null;
  }

  /** Thao tác tổ đội: chỉ gửi ý định, server kiểm tra (7.1). */
  partySend(op: string, name?: string, sid?: string) { this.room.send("party", { op, ...(name ? { name } : {}), ...(sid ? { sid } : {}) }); }

  /** Xin đi qua cổng đang đứng: chỉ gửi tên cổng, server kiểm tra vị trí và chọn bản đồ đích. */
  goPortal() { if (this.portal?.name) this.room.send("travel", { portal: this.portal.name }); }

  /** Bật / tắt tự săn (phím T, nút trong bảng Tự động): chỉ gửi ý định, server kiểm tra và trả tin `auto`. */
  toggleAuto() { if (this.watching) return; this.room.send("auto", { op: this.room.state.players.get(this.me)?.auto ? "off" : "on" }); }

  act(a: string) {
    if (this.watching) return;
    if (a === "attack") this.room.send("attack");
    else if (a === "pickup") this.room.send("pickup");
    else if (a.startsWith("skill")) this.room.send("skill", { i: Number(a.slice(5)) });
    else if (a.startsWith("bone")) this.room.send("boneskill", { i: Number(a.slice(4)) });
    else if (a.startsWith("switch")) this.room.send("switch", { slot: Number(a.slice(6)) });
    else if (a === "chanthan") this.room.send("chanthan");
    // Võ Hồn Dung Hợp Kỹ (#193): đang được mời thì hưởng ứng (một lần), không thì mời; server chọn đồng đội và kiểm mọi điều kiện.
    else if (a === "fusion") { const op = hud.fusionOp(); if (op) this.room.send("fusion", { op }); }
  }

  /**
   * Bấm nền đất: tìm đường A* (path.ts) từ vị trí dự đoán (tắt dự đoán thì vị trí server) tới điểm bấm, đi vòng vật cản (11.1).
   * Không tới được thì đi tới chỗ tới được gần điểm bấm nhất; không đi được chút nào thì thôi.
   */
  walkTo(w: Pt) {
    if (getFlag()?.on) this.flagStop(AUTO_STOP.moved);
    const at = this.pred?.pos ?? this.room.state.players.get(this.me);
    if (!at) return;
    const path = this.grid ? findPath(this.grid, at, w) : [w];
    if (!path.length) { this.goal = null; return; }
    const end = path[path.length - 1];
    this.goal = { x: end.x, y: end.y, path, i: 0, d: Infinity, t: this.time.now };
  }

  // ---------- Tự đi tới cờ (R4 #431, mục 5.17) ----------
  // Client chỉ lái hướng đi bằng `this.goal` (cùng đường `input` như bấm chuột) nên server vẫn tính vị trí và va chạm. Xuyên bản đồ: đi
  // tới cổng có thật theo `route` của tin "daily" (bản đồ kề nên đi tới trước), gửi `travel` như bấm F; qua cổng thì cảnh dựng lại và
  // chuyến đi (module autowalk.ts) tiếp tục ở bản đồ mới.

  /** Dựng lại ở mỗi bản đồ: vẽ lại cờ, và tiếp tục chuyến đi nếu vừa qua cổng (mất kết nối / thoát ra thì không tự đi lại). */
  initFlag() {
    const f = getFlag(); this.flagNav = null; this.flagCross = 0; this.flagDailyT = 0;
    if (!f) return;
    if (f.on && !f.cross) patchFlag({ on: false });
    else if (f.on) { patchFlag({ cross: false }); this.flagBest = Infinity; this.flagBestT = this.time.now; hud.log(`Đã qua cổng, tiếp tục đi tới ${f.name}.`, "#ffb35c"); }
    this.syncFlagMarker();
  }

  syncFlagMarker() {
    const f = getFlag();
    mapview().setMarker("flag", f && f.map === this.mapId && f.tx !== null && f.ty !== null ? { tx: f.tx, ty: f.ty, name: `Cờ: ${f.name}`, col: RADAR.flagCol } : null);
  }

  /** Bấm / chạm giữ trên bản đồ khu vực: cổng thì đi tới bản đồ đích (xuyên cổng), còn lại đặt cờ ở ô đó nếu đi được. */
  mapFlag(t: { tx: number; ty: number; name: string }) {
    if (this.watching || this.isArena) return;
    const gate = this.portals.find((r) => Math.hypot((r.x + r.w / 2) / TILE - t.tx, (r.y + r.h / 2) / TILE - t.ty) <= 2);
    if (gate) return this.flagToMap(gate.to);
    if (this.rallyNear(t.tx, t.ty)) return this.rallyGo(t.tx, t.ty); // bấm vào dấu tập trung: tự đi tới đúng chỗ dấu (R6)
    const tx = Math.floor(t.tx), ty = Math.floor(t.ty);
    if (!this.grid || isSolidTile(this.grid, tx, ty)) { hud.log("Chỗ đó không đi được, hãy đặt cờ ở chỗ trống.", "#ffb35c"); return; }
    this.flagStop(null);
    setFlag({ map: this.mapId, tx: tx + 0.5, ty: ty + 0.5, name: t.name ? t.name : `ô ${tx}, ${ty}`, on: false, cross: false });
    this.syncFlagMarker();
    hud.log("Đã đặt cờ. Bấm Đi (phím Y) để tự đi tới.", "#ffb35c");
  }

  /** Đi tới một bản đồ khác (bản đồ thế giới, cổng trên bản đồ khu vực): chỉ cần tới bản đồ đó, đi qua các cổng thật rồi dừng ở cổng vào. */
  flagToMap(map: string) {
    if (this.watching || this.isArena) return;
    if (map === this.mapId) { hud.log("Bạn đang ở bản đồ này rồi.", "#ffb35c"); return; }
    if (!this.daily) { hud.log("Chưa có dữ liệu đường đi, thử lại sau giây lát.", "#ffb35c"); return; }
    if (autoLeg(this.mapId, { map, tile: false }, this.daily?.route ?? {}).k === "none") { hud.log(`Không có đường đi bộ tới ${mapName(map)}; hãy dùng truyền tống trận.`, "#ffb35c"); return; }
    this.flagStop(null);
    setFlag({ map, tx: null, ty: null, name: mapName(map), on: false, cross: false });
    this.syncFlagMarker();
    this.flagGo();
  }

  flagClear() { this.flagStop(null); setFlag(null); this.syncFlagMarker(); }

  /** Bắt đầu tự đi tới cờ (phím Y, nút Đi). */
  flagGo() {
    const f = getFlag(); if (!f) { hud.log("Chưa có cờ: bấm lên bản đồ khu vực (phím N) để đặt.", "#ffb35c"); return; }
    if (this.watching || this.isArena || !this.grid) return;
    if (this.room.state.players.get(this.me)?.auto) this.room.send("auto", { op: "off" }); // tự săn đang lái nhân vật: tắt trước
    this.flagNav ??= buildNav(this.grid, AUTO_MOVE.nav.block);
    this.flagBest = Infinity; this.flagBestT = this.time.now; this.flagPlanT = 0; this.flagCross = 0; this.goal = null;
    patchFlag({ on: true, cross: false });
    hud.log(`Tự đi tới ${f.name}… (bấm phím di chuyển để dừng)`, "#ffb35c");
  }

  /** Dừng tự đi (lý do hiện trong log; null = im lặng). `done`: tới nơi thì xoá cờ. */
  flagStop(reason: string | null, done = false) {
    const f = getFlag(); if (!f?.on) return;
    if (this.goal?.auto) this.goal = null;
    if (done) { setFlag(null); this.syncFlagMarker(); } else patchFlag({ on: false, cross: false });
    if (reason) hud.log(reason, done ? "#86e0b0" : "#ffb35c");
  }

  /** Mỗi khung hình khi đang tự đi: kiểm điều kiện dừng, quyết chặng (tới cờ / tới cổng / qua cổng) và đặt `this.goal`. */
  flagTick() {
    const f = getFlag(); if (!f?.on) return;
    const me = this.room.state.players.get(this.me), at = this.pred?.pos ?? me, now = this.time.now;
    if (!me || !at || !this.grid) return;
    if (me.dead) return this.flagStop(AUTO_STOP.dead);
    if (me.auto) return this.flagStop(AUTO_STOP.hunt);
    if (hud.npcOpenId()) return this.flagStop(AUTO_STOP.talk);
    // Vừa qua cổng: tin `daily` (có `route`) về sau khi vào phòng một vòng mạng; chưa có thì chờ chứ không coi là "không có đường".
    if (f.map !== this.mapId && !this.daily) {
      this.flagDailyT ||= now; this.flagBestT = now;
      if (now - this.flagDailyT > AUTOWALK.gateSecs * 1000) return this.flagStop(AUTO_STOP.none);
      return;
    }
    this.flagDailyT = 0;
    const leg = autoLeg(this.mapId, { map: f.map, tile: f.tx !== null }, this.daily?.route ?? {});
    if (leg.k === "arrived") return this.flagStop(`${AUTO_STOP.arrived}: ${mapName(f.map)}.`, true);
    if (leg.k === "none") return this.flagStop(AUTO_STOP.none);
    // Đích của chặng này (pixel): cờ, hoặc giữa cổng dẫn tới bản đồ kề.
    let tx: number, ty: number;
    if (leg.k === "flag") { tx = f.tx! * TILE; ty = f.ty! * TILE; }
    else {
      const gate = this.portals.find((r) => r.to === leg.to); if (!gate) return this.flagStop(AUTO_STOP.none);
      tx = gate.x + gate.w / 2; ty = gate.y + gate.h / 2;
      if (this.portal?.name && (!this.portal.to || this.portal.to === leg.to)) { // server báo đang đứng trên cổng: xin qua (như bấm F), rồi chờ
        if (!this.flagCross) { this.flagCross = now; this.goal = null; patchFlag({ cross: true }); this.goPortal(); }
        else if (now - this.flagCross > AUTOWALK.gateSecs * 1000) { patchFlag({ cross: false }); this.flagCross = 0; return this.flagStop(`${AUTO_STOP.gate}: ${mapName(leg.to)}.`); }
        return;
      }
    }
    const dist = Math.hypot(tx - at.x, ty - at.y) / TILE;
    if (leg.k === "flag" && dist < AUTOWALK.arrive) return this.flagStop(`${AUTO_STOP.arrived}: ${f.name}.`, true);
    // Kẹt: quá `stuckSecs` giây không gần đích thêm `progress` ô.
    if (dist < this.flagBest - AUTOWALK.progress) { this.flagBest = dist; this.flagBestT = now; }
    else if (now - this.flagBestT > AUTOWALK.stuckSecs * 1000) return this.flagStop(AUTO_STOP.stuck);
    if (this.goal || now < this.flagPlanT) return;
    this.flagPlanT = now + AUTOWALK.replanMs;
    this.flagNav ??= buildNav(this.grid, AUTO_MOVE.nav.block);
    const path = findLongPath(this.grid, this.flagNav, at, { x: tx, y: ty }, AUTO_MOVE.nav.look);
    const end = path.at(-1);
    if (!end || Math.hypot(end.x - tx, end.y - ty) > TILE * 2) return this.flagStop(AUTO_STOP.none);
    this.goal = { x: end.x, y: end.y, path, i: 0, d: Infinity, t: now, auto: true };
  }

  // ---------- Đánh dấu "Tập trung ở đây" của tổ đội (R6 #433, mục 5.17) ----------
  // Server kiểm (thành viên tổ đội, ô đi được, giới hạn tốc độ) rồi chuyển tiếp cho cả tổ đội, kể cả đồng đội ở bản đồ / tiến trình khác; client
  // chỉ gửi ý định và hiển thị dấu (rally.ts) trên radar, bản đồ khu vực và mặt đất, tự tắt sau `RALLY.secs`.

  /** Có đồng đội trong tổ đội không (khung tổ đội server đã gửi). */
  inParty() { return (this.party?.members?.length ?? 0) >= 2; }

  /** Chuột phải trên radar / bản đồ khu vực, hoặc chọn "Tập trung ở đây": xin server đặt dấu ở ô (tx, ty). */
  rallyPlace(tx: number, ty: number) {
    if (this.watching || this.isArena) return;
    if (!this.inParty()) { hud.log("Cần ở trong tổ đội để đặt dấu Tập trung ở đây (mời bằng /moi <tên>).", "#ffb35c"); return; }
    this.room.send("rally", { tx, ty });
  }

  /** Bấm vào dấu tập trung (radar, bản đồ khu vực): đặt cờ ngay ở dấu rồi tự đi tới (R4). Dấu ở bản đồ / kênh khác thì chỉ báo. */
  rallyGo(tx: number, ty: number) {
    if (this.watching || this.isArena) return;
    const r = this.rallyNear(tx, ty); if (!r) return;
    this.flagStop(null);
    setFlag({ map: this.mapId, tx: r.tx, ty: r.ty, name: `Tập trung: ${r.from}`, on: false, cross: false });
    this.syncFlagMarker();
    this.flagGo();
  }

  /** Dấu tập trung còn hiệu lực ở bản đồ và kênh này, gần ô (tx, ty) trong 2 ô. */
  rallyNear(tx: number, ty: number) {
    return this.rallyHere().find((r) => Math.hypot(r.tx - tx, r.ty - ty) <= 2);
  }
  rallyHere() { const ch = this.room.state.channel; const now = Date.now(); return getRallies().filter((r) => r.until > now && r.map === this.mapId && r.ch === ch); }

  /** Dấu tập trung vào radar / bản đồ khu vực (mức `rally`: mũi tên ở mép khi ngoài tầm). Dấu hết hạn thì bỏ. */
  collectRally(R: DotSink) {
    const now = Date.now(); pruneRallies(null, now);
    for (const r of this.rallyHere()) R.dot("rally", r.tx, r.ty, `Tập trung ở đây: ${r.from} (${rallyLeft(r, now)}s)`, RALLY.col);
  }

  /** Đường đi hiện tại của tự săn (tin `autost`, vài điểm; AH2 #609) vẽ mờ trên radar; cờ của người chơi có đường thì nhường cờ. */
  collectAutoPath(R: DotSink) {
    const j = autoJob(), me = this.room.state.players.get(this.me);
    if (!j?.path?.length || !me?.auto || this.goal?.auto) return;
    const pts = this.autoLine; pts.length = 0; pts.push(me.x / TILE, me.y / TILE, ...j.path);
    R.line(pts, RADAR.autoCol);
  }

  /** Gom đường đi và cờ cho radar / bản đồ khu vực: đường còn lại của `this.goal`, cờ (hoặc cổng đang đi tới) mức nhiệm vụ để có mũi tên ở mép. */
  collectFlag(R: DotSink, withFlag: boolean) {
    const f = getFlag(); if (!f) return;
    const g = this.goal?.auto ? this.goal : null, me = this.room.state.players.get(this.me);
    if (g && me) {
      const pts = this.flagLine; pts.length = 0; pts.push(me.x / TILE, me.y / TILE);
      for (let i = g.i; i < g.path.length; i++) pts.push(g.path[i].x / TILE, g.path[i].y / TILE);
      R.line(pts, RADAR.flagCol);
    }
    if (f.map === this.mapId && f.tx !== null && f.ty !== null) { if (withFlag) R.dot("quest", f.tx, f.ty, `Cờ: ${f.name}`, RADAR.flagCol); }
    else {
      const to = autoLeg(this.mapId, { map: f.map, tile: false }, this.daily?.route ?? {});
      const gate = to.k === "gate" ? this.portals.find((r) => r.to === to.to) : undefined;
      if (gate) R.dot("quest", (gate.x + gate.w / 2) / TILE, (gate.y + gate.h / 2) / TILE, `Đường tới ${f.name}: cổng → ${mapName(gate.to)}`, RADAR.flagCol);
    }
  }

  sendInput() {
    if (this.watching) return;
    const k = this.keys;
    const walk = !!(k.ShiftLeft || k.ShiftRight); // 11.1: ngoài giao chiến tự chạy, giữ Shift thì đi bộ
    // Phím và cần điều khiển theo hướng màn hình (lên = lên trên màn hình). Server nhận hướng thế giới tự do (clampDir) nên chỉ cần
    // chiếu ngược hướng đó, giữ độ dài ≤ 1 (10.1). Isometric: "lên" là chéo (-1, -1) thế giới, "phải" là (1, -1).
    const sx = (k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0) + this.joy.x;
    const sy = (k.ArrowDown || k.KeyS ? 1 : 0) - (k.ArrowUp || k.KeyW ? 1 : 0) + this.joy.y;
    let { x, y } = screenDirToWorld(sx, sy);
    if (!sx && !sy && getFlag()?.on) this.flagTick(); // cờ: chọn chặng / đặt `this.goal`, nhánh dưới lái theo goal như khi bấm chuột
    if (sx || sy) { this.goal = null; if (getFlag()?.on) this.flagStop(AUTO_STOP.moved); } // phím / cần điều khiển thắng điểm bấm và cờ
    else if (this.goal) {
      // Bấm để đi tới: lái về từng điểm của đường A*; tới điểm cuối, hoặc nửa giây không gần thêm điểm đang đi tới (bị chặn: hồn thú,
      // người khác không có trong lưới ô chặn) thì dừng. Lái theo vị trí dự đoán (đi trước như server sẽ tính); tắt dự đoán thì theo
      // vị trí server, không theo hình đang nội suy.
      // Coi là tới điểm khi còn cách dưới quãng đi một khung (chạy nhanh, khung thưa thì một bước dài hơn GOAL_NEAR: không lắc qua lại).
      const at = this.pred?.pos ?? this.room.state.players.get(this.me), g = this.goal, me = this.room.state.players.get(this.me);
      const near = Math.max(GOAL_NEAR, (me ? (this.pred ? stepSpeed(me, walk) : me.spd) : 0) * this.game.loop.delta / 1000);
      let wp = g.path[g.i], dx = wp.x - (at?.x ?? wp.x), dy = wp.y - (at?.y ?? wp.y), L = Math.hypot(dx, dy);
      while (L < near && g.i < g.path.length - 1) {
        wp = g.path[++g.i]; dx = wp.x - (at?.x ?? wp.x); dy = wp.y - (at?.y ?? wp.y); L = Math.hypot(dx, dy); g.d = Infinity; g.t = this.time.now;
      }
      if (L < near) this.goal = null;
      else if (this.time.now - g.t > 500) { if (L > g.d - 2) this.goal = null; else { g.d = L; g.t = this.time.now; } }
      if (this.goal) { x = dx / L; y = dy / L; }
    }
    const key = `${x.toFixed(2)},${y.toFixed(2)},${walk}`;
    if (this.pred?.resend) this.lastInput = ""; // server đã tự dừng hướng đi (hook thử goto): gửi lại hướng đang giữ với số mới
    if (key !== this.lastInput) {
      this.lastInput = key; x = +x.toFixed(2); y = +y.toFixed(2);
      this.dir = clampDir(x, y);
      // Có dự đoán thì đánh số input để server trả lại số cuối đã nhận (PlayerState.seq / seqT) cho bước đối chiếu.
      this.walk = walk;
      const w = walk ? { w: 1 } : {};
      this.room.send("input", this.pred ? { x, y, s: this.pred.next(), ...w } : { x, y, ...w });
    }
  }

  // ---------- Tin nhắn từ server ----------
  setupMessages() {
    this.room.onMessage("log", (m: { text: string; col?: string }) => { hud.log(m.text, m.col); charLog(m.text, m.col); }); // charLog: kết quả / lý do từ chối lệnh gắn, tháo gửi từ bảng nhân vật
    // Tinh anh xuất hiện / bị hạ trong bản đồ này (BĐ4): báo cả phòng.
    this.room.onMessage("elite", (m: { k: string; name: string; zone?: string; by?: string; col?: string }) => {
      if (m.k === "spawn") { hud.banner(`${m.name} xuất hiện`, m.zone ?? ""); hud.log(`${m.name} đã xuất hiện ở ${m.zone}!`, m.col); }
      else if (m.k === "down") hud.log(`${m.name} đã bị ${m.by} hạ.`, m.col);
    });
    // Tà hóa thú vương (BĐ5): báo toàn server trước 5 phút (đếm ngược) và lúc xuất hiện; trong bản đồ có thú vương thì thêm giai đoạn 2,
    // bảng xếp hạng sát thương, bị hạ / rút đi / bỏ giao chiến.
    this.room.onMessage("boss", (m: any) => {
      if (m.k === "warn" && !m.join) { if (!this.audio.playBeast("boss", null)) this.audio.play("boss_warn"); } // tin xin lại lúc vào phòng (#118, `join`) không kêu lại
      else if (m.k === "down") { this.audio.play("boss_down"); this.audio.music?.jingle("boss_down"); }
      const col = m.col ?? "#ff5a5a";
      if (this.worldBossMsg(m, col)) return; // boss thế giới (BĐ6e): cơ chế riêng
      if (m.k === "warn") {
        hud.setBossCountdown({ name: m.name, mapName: m.mapName, here: m.here, secs: m.in, col });
        if (m.join) return; // tin xin lại lúc vào phòng (#118): chỉ đặt đếm ngược, không lặp log / banner
        hud.log(`${m.name} sẽ xuất hiện ở ${m.mapName} sau ${Math.max(1, Math.round(m.in / 60))} phút!`, col, "Hệ thống");
        toast("boss", `${m.name} sắp xuất hiện`, `${m.mapName} · ${Math.max(1, Math.round(m.in / 60))} phút nữa`);
      } else if (m.k === "spawn" || m.k === "here") {
        hud.setBossCountdown(null);
        if (m.here) hud.setBossLife(m.life);
        // Boss thế giới (BĐ6e): đồng hồ nổi giận, điểm yếu đang hiện (người vào giữa trận).
        if (m.here && m.world) { hud.setBossRage(m.k === "spawn" ? WORLD.enrageSecs : m.rageIn ?? 0); if (m.weak) hud.setBossWeak(m.weakT ?? 0); }
        // Đang lặn (#118): vòng đầy theo thời gian đã lặn, khớp với người đã ở trong phòng.
        if (m.here && m.world && m.dive && m.sx !== undefined) { const all = Math.max(m.dive, m.diveSecs ?? m.dive) * 1000;
          this.diveMark = { bid: m.bid, x: m.sx, y: m.sy, t0: this.time.now - (all - m.dive * 1000), ms: all }; }
        if (m.k === "spawn" && m.world) {
          hud.log(`${m.name} đã xuất hiện ở ${m.mapName}${m.here ? ": sàn đấu bên hồ trung tâm" : " (cổng ở bờ hồ cuối Hắc Ám Lâm, Nội địa)"}!`, col, "Hệ thống");
          hud.banner(`${m.name} xuất hiện`, m.here ? `Sàn đấu bên hồ · nổi giận sau ${Math.round(WORLD.enrageSecs / 60)} phút` : m.mapName);
        } else if (m.k === "spawn") {
          hud.log(`${m.name} đã xuất hiện ở ${m.mapName}${m.here ? ": vào hang ở vùng sâu nhất (chấm đỏ trên bản đồ nhỏ)" : ""}!`, col, "Hệ thống");
          hud.banner(`${m.name} xuất hiện`, m.here ? `Hang ở vùng sâu nhất · rút đi sau ${Math.round(m.life / 60)} phút` : m.mapName);
        }
      } else if (m.k === "phase") {
        hud.banner(`${m.name}: giai đoạn 2`, `${m.title} – ${m.desc}`);
        hud.log(`${m.name} chuyển sang giai đoạn 2 – ${m.title}: ${m.desc}.`, col);
      } else if (m.k === "rank") { this.bossList = m.list; hud.bossRank(m.list, this.me, false, this.worldBossHere()); }
      else if (m.k === "down") {
        // Kết quả cuối chỉ hiện cho người tham gia (đang nhận bảng xếp hạng, hoặc có tên trong danh sách).
        if (this.bossList || m.list?.some((x: { id: string }) => x.id === this.me)) hud.bossRank(m.list, this.me, true, !!MAPS[this.room.state.mapId]?.world?.length);
        this.bossList = null; this.diveMark = null;
        setTimeout(() => { if (!this.bossList) hud.bossRank(null, this.me); }, 12000);
        hud.banner(`Đã hạ ${m.name}`, `${m.top} ${m.topDmg ? "gây sát thương" : "đóng góp"} nhiều nhất`); // 9.2: boss thế giới xếp hồn hoàn đỏ theo sát thương
      } else if (m.k === "leave") { this.bossList = null; this.diveMark = null; hud.bossRank(null, this.me); hud.banner(`${m.name} đã ${m.world ? "lặn xuống hồ" : "rút đi"}`, `Không ai hạ được trong ${m.mins ?? 15} phút`); }
      else if (m.k === "reset") { this.bossList = null; this.diveMark = null; hud.bossRank(null, this.me); hud.log(`${m.name} bỏ giao chiến: về hang, hồi đầy máu.`, col); }
    });
    // Chat (#188): `ch` thiếu = bản đồ (kể cả thông báo "Hệ thống"); tổ đội / riêng / thế giới / tông môn (#198) đến từ mọi bản đồ / kênh qua server.
    this.room.onMessage("chat", (m: ChatMsg) => {
      if (m.ch === "whisper") {
        const mine = m.name === this.room.state.players.get(this.me)?.name && !!m.to;
        return hud.chatWhisper(mine ? m.to! : m.name, mine, m.text);
      }
      if (m.ch === "party" || m.ch === "world" || m.ch === "tong") return hud.chatLine(m.ch, m.text, hud.CHAT_COL[m.ch], m.name);
      hud.chatLine("map", m.text, m.name === "Hệ thống" ? "#86e0b0" : hud.CHAT_COL.map, m.name);
    });
    // `heal` / `shield` (9.1): số hồi sinh lực / khiên đồng đội tổ đội nhận từ hiệu ứng phụ trợ, hiện kèm dấu "+".
    this.room.onMessage("dmg", (m: { x: number; y: number; v: number; crit?: boolean; c: string; id?: string; bid?: string; kill?: boolean; by?: string; dot?: boolean; immune?: boolean; heal?: boolean; shield?: boolean }) => {
      if (m.kill && m.bid && this.beasts.has(m.bid)) this.beastKilled.set(m.bid, this.time.now); // đòn kết liễu: bản vá kế tiếp chỉ có lệnh xoá hồn thú (bóng ngã mờ dần, fadeBeastGhost); chỉ ghi hồn thú đang hiện (tin dmg tới cả phòng, hồn thú ở xa không có sprite nên mục không bao giờ được dọn)
      this.audio.handleDamage(m, this.hitMaterial(m));
      const hit = combatHit(m, this.room.state.players.get(this.me)); // nhạc động (G5, #396): đánh nhau gần mình thì lớp giao chiến lên
      if (hit.combat) this.audio.music?.combatPulse();
      if (hit.bigCrit) this.audio.music?.jingle("crit_big");
      this.hitFeel(m);
      if (m.heal || m.shield) { const hp = this.lifted(m.x, m.y); playPriv(this.svis.sheets, m.heal ? "fx_hoi_mau" : "fx_khien_sang", { x: hp.x, y: hp.y - 10 * SPR, scale: SPR, light: m.id !== this.me }); } // #623: hồi máu / khiên kho riêng
      if (m.id === this.me && !m.heal && !m.shield && getFlag()?.on) this.flagStop(AUTO_STOP.hit);
      if (m.id) { const v = this.players.get(m.id); if (v) { v.hurtT = this.time.now; this.playAct(m.id, "hurt"); } }
      const at = this.lifted(m.x, m.y);
      this.damageText(at.x, at.y - at.lift, m, m.by && !m.dot && !m.heal && !m.shield ? elementOfVohonIndex(this.players.get(m.by)?.vh) : undefined);
    });
    this.room.onMessage("fx", (m: any) => this.fx(m));
    // Cổng: server báo riêng khi bước vào / ra khỏi cổng, và khi đã lưu xong thì cho chuyển bản đồ (mục 6).
    this.room.onMessage("portal", (m: PortalInfo) => { this.portal = m?.name ? m : null; hud.showPortal(this.portal, () => this.goPortal()); });
    // Truyền tống trận (11.2): đứng trên / rời trận, mở khóa trận mới; bảng bản đồ thế giới; thanh niệm truyền tống / Hồi Thành Phù.
    this.room.onMessage("wp", (m: { k: string; key: string; label: string; map?: string }) => {
      if (m?.k === "here") { this.wpHere = m.key ? m.label : null; hud.showWaypoint(this.wpHere, () => this.openWorld(true)); }
      if (m?.k === "unlock") {
        this.audio.play("teleport_unlock");
        this.wpOpen.add(m.key); this.labelWaypoints();
        toast("info", "Mở khóa truyền tống trận", `${m.label} · đứng trên trận bất kỳ, mở bản đồ thế giới để dịch chuyển`);
        hud.log(`Đã mở khóa truyền tống trận ${m.label}${m.map ? ` (${m.map})` : ""}.`, "#8fe0ff");
      }
    });
    this.room.onMessage("world", (m: WorldMsg) => {
      this.wpOpen = new Set(m.list.filter((w) => w.open).map((w) => w.key)); this.labelWaypoints();
      hud.setWorld(m);
    });
    this.room.onMessage("recall", (m: { on: boolean; label?: string; secs?: number }) => hud.setRecall(m?.on ? { label: m.label ?? "", secs: m.secs ?? 1 } : null));
    // Tự săn (Auto 1): trạng thái nút và giờ treo còn lại; server báo lý do dừng / từ chối bằng dòng log.
    this.room.onMessage("autost", (m: AutoStMsg) => setAutoStatus(m)); // việc tự săn đang làm + thống kê theo giờ (AH2, #609)
    this.room.onMessage("auto", (m: AutoMsg) => { hud.setAuto(m); setAutoMsg(m); }); // bảng Tự động, tổng kết khi dừng (Auto 2)
    // Ủy thác offline (Auto 3): server đã cộng thưởng lúc vào game; xin bảng nhận thưởng sau khi đăng ký handler (có thì server gửi).
    this.room.onMessage("offline", (m: OfflineMsg) => showOffline(m));
    // Võ Hồn Dung Hợp Kỹ (#192, #193): tin riêng ask / wait / done / cancel. B thấy khung "Dung hợp [G]" đếm ngược (chạm được), A thấy
    // đang chờ; xong thì ô G vào hồi chiêu `cd`. Lý do từ chối / hủy server gửi bằng dòng log (khung tin).
    this.room.onMessage("fusion", (m: { k: string; by?: string; to?: string; i?: number; t?: number; cd?: number }) => {
      if (m?.k === "ask" || m?.k === "wait") {
        const i = m.i ?? -1, f = FUSIONS[i]; if (!f) return;
        hud.setFusionPending({ k: m.k, i, who: (m.k === "ask" ? m.by : m.to) ?? "", t: m.t ?? 0 }, () => this.act("fusion"));
        const how = document.body.classList.contains("touch") ? "chạm nút Dung hợp" : `phím ${hud.FUSION_KEY}`;
        if (m.k === "ask") hud.banner(`Dung hợp kỹ ${f.name}`, `${m.by ?? ""} mời hưởng ứng · ${how}`);
      } else if (m?.k === "done") { hud.setFusionPending(null); hud.setFusionCd(m.cd ?? 0); }
      else if (m?.k === "cancel") hud.setFusionPending(null);
    });
    if (!this.isArena) this.room.send("offline");
    if (!this.isArena) this.room.send("auto", { op: "get" });
    if (this.waypoints.length) this.room.send("wp", { op: "list" }); // biết trận nào đã mở để tô trận (sân đấu không có trận)
    // NPC (6.1): server đã kiểm tra khoảng cách; lời thoại, cửa hàng và lò rèn lấy từ NPCS. Mua / bán / rèn chỉ gửi ý định.
    this.room.onMessage("npc", (m: { id: string }) => {
      if (!npcDef(m?.id)) return;
      hud.openNpc(m.id, this.bag, {
        // #111: gửi kèm mã thương nhân đang mở hộp thoại, server tính đúng bảng hàng của thương nhân đó.
        buy: (code, qty) => this.room.send("buy", { code, qty, npc: m.id }),
        sell: (id, qty) => this.room.send("sell", { id, qty, npc: m.id }),
        buyback: (key) => this.room.send("buyback", { key, npc: m.id }), // 9.8: mua lại đồ vừa bán
        expand: () => this.room.send("expand", { npc: m.id }),            // 9.8: mở rộng túi
        enhance: (targetId, materialIds) => this.room.send("enhance", { targetId, materialIds }),
        enhanceCore: (targetId, materialIds) => this.room.send("enhancecore", { targetId, materialIds }), // lò rèn: nâng cấp hồn hạch (5.3)
        coreSet: (id, set) => this.room.send("coreset", { id, set, npc: m.id }), // lò rèn: đổi bộ hồn hạch (#283)
        combat: () => this.combat,
        quest: (op, chain) => this.room.send("quest", chain ? { op, chain } : { op }),
        arena: (op, roomId) => this.room.send("arena", roomId ? { op, roomId } : { op }), // 7.2: xếp hàng / hủy / bảng xếp hạng; #280: danh sách / vào xem trận
        tong: (op, tong, chain) => this.room.send("tong", { op, tong, chain }), // #196: gia nhập / đổi / rời tông môn; #197: tông vụ, bảng tuần, thưởng tuần
        shard: (vohon, qty) => this.room.send("shardbuy", { vohon, qty, npc: m.id }), // #282: Thương hội đổi mảnh võ hồn
        shardInfo: () => this.room.send("shardinfo"),
        looks: () => { const p = this.room.state.players.get(this.me); return p ? looksOf(p) : null; }, // thợ may (L4 #511): ngoại hình đang mang
        changeLooks: (looks) => this.room.send("looks", { looks, npc: m.id }),
        owned: () => (this.owned?.list ?? []).map((v) => v.vohon),
        gear: () => this.gear,
        equipEnh: (id, charm) => this.room.send("equipenh", { id, charm }), // lò rèn: cường hóa trang bị hồn sư (E3)
        equipEnhPreview: (id) => this.room.send("equipenhpreview", { id }),
        equipLuck: (id) => this.room.send("equipluck", { id }), // lò rèn: khắc may mắn bằng Thần Hồn
        equipLuckPreview: (id) => this.room.send("equipluckpreview", { id }),
        equipSynth: (main, sacrifice) => this.room.send("equipsynth", { main, sacrifice }), // lò rèn: hợp thành 3 → 1 (E4)
        equipSalvage: (ids) => this.room.send("equipsalvage", { ids }), // lò rèn: phân giải hàng loạt (E4)
      });
    });
    this.room.onMessage("equipluckp", (m: EquipLuckPreview) => hud.equipLuckPreview(m));
    this.room.onMessage("equipluckd", (m: EquipLuckDone) => { this.audio.playUi(m.ok ? "enhanceOk" : "enhanceFail"); hud.equipLuckDone(m); });
    this.room.onMessage("equipenhp", (m: EquipEnhPreview) => hud.equipEnhPreview(m));
    this.room.onMessage("equipenhd", (m: EquipEnhDone) => { this.audio.playUi(m.ok ? "enhanceOk" : "enhanceFail"); hud.equipEnhDone(m); });
    this.room.onMessage("equipsynd", (m: EquipSynDone) => { this.audio.playUi(m.ok ? "enhanceOk" : "enhanceFail"); hud.equipSynDone(m); });
    this.room.onMessage("equipsalvd", (m: EquipSalvDone) => { if (!m.auto) this.audio.playUi("drop"); hud.equipSalvDone(m); });
    // Đại Đấu Hồn Trường (7.2): server báo đang xếp hàng, đã ghép trận (vào phòng sân đấu), các pha của trận và kết quả.
    this.room.onMessage("arena", (m: any) => {
      if (m?.k === "queue") hud.setArenaQueue(m.on ? { elo: m.elo, secs: m.secs } : null, () => this.room.send("arena", { op: "cancel" }));
      else if (m?.k === "found" && typeof m.roomId === "string") {
        hud.setArenaQueue(null, () => {}); hud.closeNpc();
        hud.log(`Đã tìm thấy đối thủ: ${m.foe} (Elo ${m.elo}). Vào Đại Đấu Hồn Trường…`, "#ff9a8a");
        this.onArena(m.roomId);
      } else if (m?.k === "watch" && typeof m.roomId === "string") {
        hud.closeNpc(); hud.log("Vào xem trận đấu hồn…", "#ff9a8a");
        this.onArena(m.roomId, true);
      } else if (m?.k === "live") hud.setArenaLive(m);
      else if (m?.k === "ready") hud.banner("Đại Đấu Hồn Trường", `Trận đấu bắt đầu sau ${m.secs} giây${this.room.state.friendly ? " · giao hữu, không tính Elo" : ""}`);
      else if (m?.k === "fight") hud.banner("Giao đấu!", `Hạ hết đội võ hồn đối thủ trong ${Math.round(m.secs / 60)} phút; hết giờ thì so sinh lực cả đội`);
      else if (m?.k === "end") {
        hud.arenaEnd(m, { back: () => this.onBack(), top: () => this.room.send("arena", { op: "top" }) });
        if (m.score !== 0.5) this.weather.confetti(); // có người thắng: giấy hoa (mục 5.11, bảng các vùng)
        if (m.score === 1) this.audio.music?.jingle("arena_win");
        else if (m.score === 0) this.audio.music?.jingle("arena_lose");
        this.room.send("arena", { op: "top" });
      }
    });
    this.room.onMessage("arenaTop", (m: hud.ArenaTopMsg) => { if (m && Array.isArray(m.list)) hud.setArenaTop(m); });
    // Nhiệm vụ chuỗi cố định (6.2, #190: tân thủ, chương 2…): tiến độ do server đếm theo sự kiện thật; client vẽ khung theo dõi, dấu
    // trên đầu NPC giao bài, chỉ đường bản đồ nhỏ và thông báo.
    this.room.onMessage("quest", (m: QuestMsg) => {
      if (!m || typeof m.chain !== "string") return;
      hud.setQuest(m); this.updateQuestMarks();
      const c = questChain(m.chain), s = c?.steps[m.step], giver = c && npcDef(c.giver);
      if (!c) return;
      if (m.ev === "accept" && s) toast("quest", `Nhận nhiệm vụ: ${s.name}`, s.goals.map((g) => g.text).join(" · "));
      else if (m.ev === "ready" && s) toast("quest", `Hoàn thành: ${s.name}`, `Quay về gặp ${giver?.name} ở ${MAPS[c.map].name} để nhận thưởng`);
      else if (m.ev === "reward" || m.ev === "finish") {
        const d = c.steps.find((x) => x.id === m.done);
        if (m.ev === "finish") toast("quest", `Hoàn thành chuỗi: ${c.name}`, d ? `Nhận ${questRewardText(d.reward)}` : "");
        else toast("quest", `Trả nhiệm vụ: ${d?.name ?? ""}`, d ? `Nhận ${questRewardText(d.reward)}` : "");
      }
      if (m.ev === "accept") { this.audio.play("quest_accept"); this.audio.music?.jingle("quest_accept"); }
      else if (m.ev === "ready") this.audio.play("quest_ready");
      else if (m.ev === "reward" || m.ev === "finish") { this.audio.play("quest_reward"); this.audio.music?.jingle("quest_complete"); }
    });
    this.room.onMessage("tong", (m: hud.TongMsg) => { if (m && typeof m.tong === "string") hud.setTong(m); }); // #196, #197 tông vụ
    this.room.onMessage("tongBoard", (m: hud.TongBoardMsg) => { if (m && m.cur && m.last) hud.setTongBoard(m); }); // #197 bảng tông tuần
    this.room.onMessage("looksinfo", (m: { n: number; err?: string }) => { if (m && Number.isInteger(m.n)) hud.setLooksInfo(m); }); // L4 #511: số lần đã đổi ngoại hình / lý do từ chối
    this.room.onMessage("shardinfo", (m: { n: number; daily: number }) => { if (m && Number.isInteger(m.n)) hud.setShardInfo(m); }); // #282
    // Khảo hạch hằng ngày: tiến độ do server đếm; client vẽ mục "Hằng ngày", dấu trên đầu Phất Lan Đức, chấm bản đồ nhỏ và thông báo.
    this.room.onMessage("daily", (m: DailyMsg) => {
      if (!m || !Array.isArray(m.list)) return;
      this.daily = m; hud.setDaily(m); this.updateQuestMarks();
      const q = m.list[m.i], s = q && questChain(q.chain)?.steps[0], giver = npcDef(DAILY.giver);
      if (m.ev === "reset") toast("quest", "Khảo hạch hằng ngày đã đổi bài", `Gặp ${giver?.name} ở ${MAPS[DAILY.map].name} nhận ${m.list.length} bài mới`);
      else if (!s) return;
      else if (m.ev === "accept") toast("quest", `Nhận khảo hạch: ${s.name}`, s.goals.map((g) => g.text).join(" · "));
      else if (m.ev === "ready") toast("quest", `Hoàn thành: ${s.name}`, `Quay về gặp ${giver?.name} ở ${MAPS[DAILY.map].name} để nhận thưởng`);
      else if (m.ev === "reward") toast("quest", `Trả khảo hạch: ${s.name}`, `Nhận ${questRewardText(s.reward)}`);
      if (s && m.ev === "accept") this.audio.music?.jingle("quest_accept");
      else if (s && m.ev === "reward") this.audio.music?.jingle("quest_complete");
    });
    // Đi cổng / đổi kênh: server đã lưu xong và chọn phòng (kênh) đích (`roomId`, null = để Colyseus chọn / mở kênh mới).
    this.room.onMessage("travel", (m: { mapId: string; roomId?: string | null }) => {
      if (typeof m?.mapId === "string") this.onTravel(m.mapId, typeof m.roomId === "string" ? m.roomId : null);
    });
    this.room.onMessage("channels", (m: ChannelsMsg) => hud.setChannels(m)); // danh sách kênh của bản đồ (mục 6 "Nhiều kênh")
    // Bản đồ nhỏ (11.4): state chỉ còn thực thể ở gần, vị trí cả bản đồ đến mỗi giây qua tin này.
    this.room.onMessage("mini", (m: GameScene["far"]) => { if (m && Array.isArray(m.p) && Array.isArray(m.b) && Array.isArray(m.d)) this.far = m; });
    // Sương mù khám phá (R8): server quyết định ô nào đã khám phá; `fog` cả bitset (khi xin), `fogd` các ô vừa mở. Client chỉ giữ bản sao để vẽ.
    this.room.onMessage("fog", (m: { bits?: unknown }) => fog().setFull(m?.bits));
    this.room.onMessage("fogd", (m: { add?: unknown }) => fog().add(m?.add));
    // Cộng minh (8.2): tiến độ 5 trụ cột và % cộng cho mọi võ hồn do server tính; mốc mới đạt thì báo lớn.
    this.room.onMessage("resonance", (m: ResonanceMsg) => {
      if (!m || !Array.isArray(m.prog)) return;
      hud.setResonance(m); this.renderRoster(); // chỉ số trong mục hồn cốt của bảng đội hình có phần cộng minh
      for (const e of m.ev ?? []) {
        const r = RESONANCE[e.pillar], s = r?.steps[e.step];
        if (r && s && e.up) toast("info", `Cộng minh ${r.name}: mốc ${e.step + 1}`, `${s.need} ${r.what} · mọi võ hồn ${resonanceText(s.bonus)}`);
      }
    });
    this.room.onMessage("resonanceTop", (m: ResonanceTopMsg) => {
      if (m && Array.isArray(m.list)) hud.setResonanceTop(m);
    });
    // Tổ đội người chơi (7.1): khung tổ đội và lời mời, chỉ gửi riêng cho mình.
    this.room.onMessage("rally", (m: unknown) => { addRally(m); }); // dấu "Tập trung ở đây" của đồng đội (R6)
    this.room.onMessage("party", (m: PartyView) => { this.party = m; pruneRallies(new Set(m.members.map((x) => x.name))); hud.renderParty(m, { send: (op, name, sid) => this.partySend(op, name, sid) }); });
    // Bạn bè và chặn (#195): bảng bạn bè và lời "đã thêm bạn", chỉ gửi riêng cho mình.
    hud.bindFriends((op, name) => this.room.send("friend", { op, ...(name ? { name } : {}) }), (name) => this.partySend("invite", name));
    this.room.onMessage("friends", (m: FriendsMsg) => { if (m && Array.isArray(m.list) && Array.isArray(m.blocks)) hud.setFriends(m); });
    // Bảng nhân vật (UI-2): chỉ số tổng hợp do server tính (tin riêng "stats"), client chỉ hiển thị.
    this.room.onMessage("stats", (m: StatsMsg) => { if (m && m.total && m.base) { this.charStats = m; this.renderChar(); } });
    onCharOpen(() => this.askStats());
    // Võ hồn sở hữu và đội hình: server chỉ gửi riêng cho mình. Xin lần đầu sau khi đã đăng ký nhận.
    this.room.onMessage("vohons", (m: OwnedVohons) => {
      this.owned = m;
      hud.setFusionCd(m.fcd ?? 0); // hồi chiêu dung hợp kỹ của hồn sư (#193): đúng cả sau khi đổi kênh / đi cổng / vào lại
      this.renderBag(); // bảng chọn võ hồn để hấp thụ dùng cấp / số hồn hoàn mới nhất
      this.renderRoster();
      hud.buildTeam(m, (slot) => this.act("switch" + slot));
    });
    // Sinh lực từng võ hồn trong đội và võ hồn đã gục (luật gục từng võ hồn, bước 2.3b): cũng chỉ gửi riêng cho mình.
    // Năng lượng tiên cơ cũng đi trong tin này: võ hồn nào vừa đầy thì báo một lần.
    this.room.onMessage("squad", (m: Squad) => {
      // Bảng hồn cốt nhắc "đang giao chiến" (4.2): vẽ lại khi trạng thái giao chiến đổi.
      if (m.combat !== this.combat) { this.combat = m.combat; this.renderRoster(); }
      for (const r of hud.setSquad(m)) {
        const slot = this.owned?.team.indexOf(r) ?? -1, v = this.owned?.list.find((o) => o.rowId === r);
        if (!v || slot < 0 || r === this.owned?.active) continue;
        const def = VOHON[Math.max(0, vohonIndex(v.vohon))];
        hud.log(`${def.name} đủ năng lượng tiên cơ: nhấn ${slot + 1} để đổi vào và tung ${TIEN_CO[def.he].name}.`, "#e9c45a");
      }
    });
    this.room.onMessage("ko", (m: { fallen: string; next: string | null }) => {
      this.audio.play("combat_death");
      const name = (id: string) => VOHON[Math.max(0, vohonIndex(id))].name;
      if (m.next) hud.banner(`${name(m.fallen)} đã gục`, `${name(m.next)} tự động ra trận`);
      else if (this.isArena) hud.banner("Cả đội đã gục", "Thua trận đấu hồn, không mất kinh nghiệm hay đồ");
      else hud.banner("Cả đội đã gục", `Về doanh trại sau ${String(RESPAWN_SECS).replace(".", ",")} giây, không mất kinh nghiệm hay đồ`);
    });
    // Túi đồ và Hồn Tệ (bước 3.1): chỉ gửi riêng cho mình; client chỉ gửi id ô muốn dùng / hấp thụ / bỏ, server kiểm tra.
    // Mảnh võ hồn trong túi (3.4): bảng đội hình hiện tiến độ mở / lên sao nên vẽ lại cùng túi.
    // Từ #215 sau tin "bag" đầu tiên chỉ nhận phần đổi (tin "bagd"); chưa có túi gốc thì bỏ qua (tin "bag" đang tới).
    const onBag = (m: BagMsg) => { if (lootToasts(this.bag?.items ?? null, m.items) >= RARE_LOOT_MIN) this.audio.playUi("rare"); this.bag = m; this.renderBag(); this.renderRoster(); hud.npcBag(m); };
    this.room.onMessage("bag", onBag);
    this.room.onMessage("gear", (m: GearMsg) => { this.gear = m; this.renderBag(); this.renderChar(); this.askStats(); hud.npcRefresh(); }); // trang bị hồn sư (5.15): chỉ số tổng ở tin "stats"
    this.room.onMessage("bagd", (m: BagDeltaMsg) => {
      if (this.bag) onBag({ slots: m.slots, honTe: m.honTe, cd: m.cd, items: applyBagDelta(this.bag.items, m), buyback: m.buyback ?? this.bag.buyback,
        sell: m.sell ?? this.bag.sell, sold: m.sold ?? this.bag.sold });
    });
    // Tự bán từ xa (#216): server vừa bán đồ hợp bộ lọc; túi mới đến bằng tin "bagd", dòng log chi tiết đến cùng lúc.
    this.room.onMessage("autosold", (m: AutoSoldMsg) => toast("info", `Đã tự bán ${m.n.toLocaleString("vi-VN")} món`, `+${formatHonTe(m.coins)} · mua lại ở thương nhân`));
    // Cường hóa hồn cốt (bước 4.4): kết quả do server tính (luôn thành công); túi mới đến ngay sau bằng tin "bag". Từ #187 kèm
    // các dòng phụ server vừa tung ở mốc (`subs`).
    this.room.onMessage("enhanced", (m: { id: string; from: number; to: number; gain: number; used: number; fee?: number; subs?: { k: CoreStat; v: number }[] }) => {
      if (m.to > m.from) { if (!this.audio.playUi("enhanceOk")) this.audio.play("breakthrough"); } else this.audio.playUi("enhanceFail"); // chưa đủ lên cấp = chưa thành (G5)
      const pts = `+${m.gain.toLocaleString("vi-VN")} điểm từ ${m.used} nguyên liệu${m.fee ? `, phí ${formatHonTe(m.fee)}` : ""}`; // phí #281
      const subs = (m.subs ?? []).map((u) => ` · dòng phụ mới ${coreStatText(u.k, u.v)}`).join("");
      toast("info", `Cường hóa hồn cốt +${m.to}`, (m.to > m.from ? `+${m.from} → +${m.to} · ${pts}` : `${pts}, chưa đủ lên cấp`) + subs);
    });
    // Nâng cấp hồn hạch (bước 5.3): kết quả và các dòng phụ vừa tăng do server tung; túi mới đến ngay sau bằng tin "bag".
    this.room.onMessage("enhancedcore", (m: { from: number; to: number; gain: number; used: number; fee?: number; subs: CoreSubUp[] }) => {
      this.audio.playUi(m.to > m.from ? "enhanceOk" : "enhanceFail");
      const pts = `+${m.gain.toLocaleString("vi-VN")} điểm từ ${m.used} nguyên liệu`, fee = m.fee ? ` · phí ${formatHonTe(m.fee)}` : ""; // phí #281
      const subs = m.subs.map((u) => (u.add ? `dòng phụ mới ${coreStatText(u.k, u.v)}` : `${coreStatText(u.k, u.to)} (tăng)`)).join(" · ");
      toast("info", `Nâng cấp hồn hạch +${m.to}`, m.to > m.from ? `+${m.from} → +${m.to} · ${subs || pts}${fee}` : `${pts}, chưa đủ lên cấp`);
    });
    // Hấp thụ hồn hoàn (bước 3.3): server báo riêng lúc bắt đầu (thanh tiến độ) và kết quả; thành công / thất bại do server quyết định.
    this.room.onMessage("absorbing", (m: { on: boolean; rowId: number; years: number; slot?: number; secs?: number; fail?: number; result?: string; level?: number }) => {
      const v = this.owned?.list.find((o) => o.rowId === m.rowId), def = VOHON[Math.max(0, vohonIndex(v?.vohon ?? ""))];
      const name = v ? def.name : "võ hồn", age = formatYears(m.years), col = TIERS[tierOfYears(m.years)].glow;
      if (m.on) {
        this.audio.play("ring_absorb_start");
        this.audio.playRingGlow(tierOfYears(m.years));
        const risk = m.fail ? ` (${Math.round(m.fail * 100)}% thất bại)` : "";
        hud.setAbsorbing({ label: `Hấp thụ hồn hoàn ${age} vào ${name}${risk}`, secs: m.secs ?? 1, risk: !!m.fail, col });
        return;
      }
      hud.setAbsorbing(null);
      if (m.result === "ok") { if (!this.audio.playGroup("ring-absorb", null, { priority: 3, duck: 0.6, duckMs: 900 })) this.audio.play("ring_absorb_success"); this.audio.music?.jingle("ring_absorb"); hud.banner(`Hấp thụ thành công: hồn hoàn thứ ${m.slot}`, `${name} · ${age} · cấp ${m.level}`); }
      else if (m.result === "fail") { this.audio.play("ring_absorb_fail"); hud.banner("Hấp thụ thất bại", `Hồn hoàn ${age} vỡ tan; ${name} không bị tổn hại`); }
    });
    if (this.watching) return; // người xem (#280): không xin dữ liệu riêng
    this.room.send("vohons");
    this.room.send("fog"); // sương mù khám phá (R8): tin lúc vào phòng có thể tới trước khi cảnh nghe, xin lại cả bitset
    this.room.send("boss"); // #118: tin boss lúc vào phòng tới trước khi cảnh nghe tin, xin lại (đếm ngược, đồng hồ, chiêu đang báo trước)
    this.room.send("bag");
    this.room.send("party", { op: "get" });
    this.room.send("friend", { op: "list" });
    this.room.send("quest", { op: "get" });
    this.room.send("resonance");
  }

  /**
   * Điểm server gửi cho hiệu ứng (10.1): server tính theo cách vẽ nhìn thẳng cũ nên hay trừ vài pixel ở y để nâng hiệu ứng lên
   * ngang ngực / đầu (`p.y - 6`, `b.y - size`…). Chiếu thẳng điểm đó thì isometric bị lệch chéo, nên nếu ngay dưới điểm đó (cùng x,
   * thấp hơn tối đa 40 pixel) có hồn sư / hồn thú thì bám vào chân nó: trả điểm màn hình của chân (x, y), vị trí thế giới của chân
   * (wx, wy) và độ nâng trên màn hình `lift`. Không có ai thì chiếu thẳng, lift = 0.
   */
  lifted(x: number, y: number): Pt & { wx: number; wy: number; lift: number } {
    let best: (Pt & { wx: number; wy: number; lift: number }) | null = null, bd = 2;
    const test = (ex: number, ey: number, at: Pt | undefined) => {
      const dx = Math.abs(ex - x), dy = ey - y;
      if (at && dx < bd && dy >= 0 && dy <= 40) { bd = dx; best = { x: at.x, y: at.y, wx: ex, wy: ey, lift: dy * SPR }; }
    };
    const st = this.room.state;
    st.players.forEach((p: any, id: string) => test(p.x, p.y, this.players.get(id)?.root));
    st.beasts.forEach((b: any, id: string) => test(b.x, b.y, this.beasts.get(id)));
    const s = W2S(x, y);
    return best ?? { x: s.x, y: s.y, wx: x, wy: y, lift: 0 };
  }

  /** Vòng sáng lan trên mặt đất quanh điểm màn hình `c`: bán kính r0 → r1 tính theo thế giới, chiếu thành elip. */
  ringFx(c: Pt, r0: number, r1: number, col: string, dur: number, delay = 0) {
    const g = this.add.graphics().setDepth(99980); const o = { k: 0 };
    // Hồn kỹ soi mặt đất theo màu chiêu (phong cách A, 10.7); vòng trắng phụ không thêm đèn.
    if (col !== "#ffffff") this.time.delayedCall(delay, () => this.light.flash(c.x, c.y, col, Math.max(r0, r1) * RX + 16, dur + 250));
    this.tweens.add({ targets: o, k: 1, duration: dur, delay, onUpdate: () => {
      const r = r0 + (r1 - r0) * o.k; g.clear(); g.lineStyle(2, hex(col), 1 - o.k); g.strokeEllipse(c.x, c.y, 2 * RX * r, 2 * RY * r);
    }, onComplete: () => g.destroy() });
  }
  /**
   * Bọc trứng (#162): `lay` sợi tơ từ thú vương tới chỗ đẻ và vòng nhỏ; `hatch` vòng lan màu hào quang, chữ "Nở!"; `break` mảnh kén văng
   * ra và vòng trắng; `fade` (thú vương không còn) chỉ mảnh kén.
   */
  eggFx(m: any) {
    const c = W2S(m.x, m.y), col = m.col ?? "#c8f5b4";
    if (m.s === "lay") {
      const o = W2S(m.x0, m.y0), g = this.add.graphics().setDepth(99980);
      g.lineStyle(1, 0xeef6e4, 0.9).lineBetween(o.x, o.y - 10 * SPR, c.x, c.y - 6 * SPR);
      this.tweens.add({ targets: g, alpha: 0, duration: 450, onComplete: () => g.destroy() });
      this.ringFx(c, 2, 12, col, 400);
      return;
    }
    if (m.s === "hatch") { this.ringFx(c, 4, 28, col, 550); this.ringFx(c, 2, 16, "#ffffff", 400, 120); this.floatText(c.x, c.y - 22 * SPR, "Nở!", "#ff6b6b"); }
    if (m.s === "break") this.ringFx(c, 2, 16, "#ffffff", 350);
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + Math.random() * 0.5, d = (10 + Math.random() * 8) * SPR;
      const r = this.add.rectangle(c.x, c.y - 8 * SPR, 2 * SPR, 2 * SPR, k % 2 ? 0xeef6e4 : 0xa9bd96).setDepth(99980);
      this.tweens.add({ targets: r, x: c.x + Math.cos(a) * d, y: c.y - 8 * SPR + Math.sin(a) * d * 0.6 + 6 * SPR, alpha: 0, duration: 450, onComplete: () => r.destroy() });
    }
  }
  /** Chân hồn sư `id` trên màn hình (điểm gốc của hình đang vẽ). */
  feet(v: PView): Pt { return { x: v.root.x, y: v.root.y }; }

  /** Animation chạy một lần của lớp thân (attack, cast, hurt); các lớp khác tự theo khung thân. */
  playAct(id: string, anim: HsAnim) {
    const v = this.players.get(id); if (v) v.act = { anim, t0: this.time.now };
    if (v && (anim === "attack" || anim === "cast")) this.pt.strike(id, this.time.now); // pháp tướng ra đòn cùng hồn sư (không rung màn hình)
  }
  /** Tin `fx` có hướng đánh (dx, dy thế giới): hồn sư quay về phía đó suốt animation đánh, rồi lại theo hướng đi (10.1). */
  faceHit(id: string, dx: number, dy: number) {
    const v = this.players.get(id), d = dir8(Number(dx) || 0, Number(dy) || 0);
    if (v && d) v.lock = { face: d, until: this.time.now + honsuAnimMs("attack") };
  }

  // ---------- G1 (#392): cảm giác đánh (chỉ hiển thị cục bộ) ----------
  /** Rung màn hình theo mức hiệu ứng (Thấp / Giảm chuyển động: không rung). */
  shake(ms: number, intensity: number) { const k = shakeK(); if (k > 0) this.cameras.main.shake(ms, intensity * k); }
  flash(ms: number, r: number, g: number, b: number) { if (flashOn()) this.cameras.main.flash(ms, r, g, b); }
  nearMe(x: number, y: number, r: number) { const me = this.players.get(this.me); return !!me && Math.hypot(me.wx - x, me.wy - y) < r; }
  /** Mình đang tự săn (tắt mọi rung / zoom / dừng hình khi đánh hồn thú thường). */
  autoOn() { return !!this.room.state.players.get(this.me)?.auto; }
  /** Rung theo cấp 1–3 (SHAKE_TIER). */
  shakeTier(t: number) { const [ms, i] = SHAKE_TIER[t] ?? SHAKE_TIER[0]; if (ms) this.shake(ms, i); }
  /** Dừng hình `ms` mili giây: chỉ làm chậm tween / animation cục bộ, vòng nội suy và gửi tin vẫn chạy nên không đụng nhịp mạng, dự đoán. */
  hitstop(ms: number) {
    const now = performance.now();
    if (!hitstopOn() || now < this.hitstopNext) return;
    this.hitstopEnd = now + ms; this.hitstopNext = now + ms + 140; // nghỉ 140 ms giữa hai lần để chuỗi đòn nhanh không bị đơ
    this.applyTimeScale();
  }
  endHitstop(now: number) {
    if (!this.hitstopEnd || now < this.hitstopEnd) return;
    this.hitstopEnd = 0; this.applyTimeScale();
  }
  /** Hệ số chậm của trình diễn kết liễu đấu trường (G6, `ArenaShow`); dừng hình G1 chồng lên nhưng không đè (hết dừng hình thì trả về hệ số này). */
  setSlowmo(k: number) { this.slowmo = k; this.applyTimeScale(); }
  /** Hệ số thời gian thật của tween / animation: dừng hình nếu đang dừng, không thì theo slow-mo G6. */
  applyTimeScale() {
    this.tweens.timeScale = this.hitstopEnd ? 0.06 : this.slowmo;
    this.anims.globalTimeScale = this.hitstopEnd ? 0.06 : 1;
  }
  /** Phóng 1,05 trong 150 ms (rồi trả về cỡ chuẩn của `fitZoom`) khi chí mạng của chính mình. */
  zoomPunch() {
    if (!zoomOn()) return;
    this.zoomFx?.stop(); const z = this.zoomFor(), o = { k: 0 };
    this.zoomFx = this.tweens.add({ targets: o, k: 1, duration: 150, onUpdate: () => this.cameras.main.setZoom(z * (1 + 0.05 * Math.sin(Math.PI * o.k))), onComplete: () => this.fitZoom() });
  }
  /**
   * Cảm giác khi hồn thú bị đánh (tin `dmg` có `bid`): nháy trắng, đẩy lùi vài pixel (chỉ hình, vị trí thật theo server), tia va chạm theo hệ
   * người đánh (id `by` server gửi kèm tin `dmg`); số sát thương lớn / chí mạng thì thêm dừng hình, rung, zoom (chỉ khi người đánh là chính mình).
   */
  hitFeel(m: { x: number; y: number; v: number; crit?: boolean; c: string; bid?: string; by?: string; dot?: boolean; heal?: boolean; shield?: boolean }) {
    const b = m.bid ? this.room.state.beasts.get(m.bid) : null, s = m.bid ? this.beasts.get(m.bid) : null;
    if (!m.bid || !b || !s || m.v <= 0 || m.heal || m.shield || m.c === "#9ad8ff") return; // #9ad8ff có bid = sát thương vào khiên Bá Thể của boss thế giới: cố ý không hiệu ứng (không nháy / tia / dừng hình)
    const now = this.time.now, who = m.dot ? undefined : m.by, mine = who === this.me, pv = who ? this.players.get(who) : undefined;
    this.lastHit.set(m.bid, { t: now, tier: b.tier, rank: b.rank, x: s.x, y: s.y, mine, lethal: b.hp <= m.v });
    if (m.dot) return; // sát thương theo thời gian (độc, lửa, lan Cảm điện): không nháy / tia / dừng hình / đẩy lùi mỗi nhịp
    if (flashOn()) this.hitFlash.set(m.bid, now + 50);
    if (pv && !fxPrefs.reduce) { // đẩy lùi: lệch khỏi người đánh vài pixel rồi trở về, chỉ cho sprite
      const dx = s.x - pv.root.x, dy = s.y - pv.root.y, d = Math.hypot(dx, dy) || 1;
      const heavy = mine && now - this.castHeavy.t < 700 ? this.castHeavy.heavy : 0;
      this.hitKick.set(m.bid, { dx: dx / d, dy: dy / d, t0: now, p: KNOCK_PX[hitWeight(m.v / Math.max(1, b.maxHp), !!m.crit, b.hp <= m.v, heavy)] });
    }
    const ratio = m.v / Math.max(1, b.maxHp);
    const he: He | undefined = pv ? VOHON[pv.vh]?.he : undefined, sp = he ? HIT_SPARK[he] : null, top = s.y - (s.displayHeight || 20) * 0.5;
    if (fxLevel() !== "low") this.fxp.burst(s.x, top, sp ? sp.col : hex(m.c), sp ? sp.n : 6, (sp?.speed ?? 80) * SPR / 2, (sp?.size ?? 2) * (m.crit ? 1.5 : 1));
    const heavy = mine && now - this.castHeavy.t < 700 ? this.castHeavy.heavy : 0, w = hitWeight(ratio, !!m.crit, b.hp <= m.v, heavy);
    const mat = this.hitMaterial(m);
    materialSparks(this.fxp, mat, pv ? elementOfVohonIndex(pv.vh) : undefined, s.x, top, w, SPR); // tia lửa / mảnh vỡ theo chất liệu mục tiêu (mọi người đánh)
    if (he) playHitFeelSheets(this.svis.sheets, mat, he, s.x, top, mine, w); // C1: sheet 6 khung + lớp cộng sáng
    if (!mine || !beastJerk(b.rank, this.autoOn())) return; // #437: hồn thú thường / đang tự săn: giữ nháy, tia, bụi, số, âm thanh; không dừng hình, rung, zoom
    this.hitstop(hitstopMs(ratio, !!m.crit, b.hp <= m.v, heavy)); // đòn kết liễu: một lần dừng hình dài nhất (80 ms), không để khoảng nghỉ chặn lần sau
    if (b.rank >= 2) this.shakeTier(ratio > 0.02 || m.crit ? 2 : 1); // thú vương / boss: trúng mạnh rung vừa
    else if (m.crit) this.shakeTier(1);
    if (m.crit) this.zoomPunch();
  }
  /** Hồn thú biến mất sau đòn vừa trúng mà sinh lực còn lại đã ≤ sát thương (chắc bị hạ, không phải ra ngoài vùng đồng bộ): tan thành bụi sáng màu niên hạn, boss rung mạnh chỉ khi đòn cuối là của chính mình (dừng hình của đòn kết liễu đã tính ở `hitFeel`). */
  beastDown(s: Phaser.GameObjects.Sprite, h: { tier: number; rank: number; mine: boolean }) {
    const col = hex(TIERS[h.tier]?.glow ?? "#ffffff"), w = (s.displayWidth || 24) * 0.9, hh = s.displayHeight || 24;
    if (fxLevel() !== "low") this.fxp.dust(s.x, s.y, w, hh, col, fxLevel() === "high" ? 26 : 14);
    const me = this.players.get(this.me);
    if (h.mine && me && h.rank >= 2 && Math.hypot(me.root.x - s.x, me.root.y - s.y) < 260 * SPR) this.shakeTier(3);
  }
  /** Hồn hoàn / vật phẩm quý mới rơi: vòng sáng màu niên hạn nở ra rồi bay lên. */
  dropGlint(at: Pt, col: string) {
    if (fxLevel() === "low") return;
    const g = this.add.graphics().setDepth(99981), o = { k: 0 };
    this.tweens.add({ targets: o, k: 1, duration: 800, ease: "Sine.easeOut", onUpdate: () => {
      const y = at.y - o.k * 34 * SPR, r = (10 + o.k * 6) * SPR; g.clear();
      g.lineStyle(2, hex(col), 1 - o.k).strokeEllipse(at.x, y, 2 * r, r * 0.7);
      g.lineStyle(1, 0xffffff, 0.8 * (1 - o.k)).strokeEllipse(at.x, y, 2 * r - 4, r * 0.7 - 2);
    }, onComplete: () => g.destroy() });
    this.light.flash(at.x, at.y - 6, col, 60, 600, 1);
  }

  /** G3 (#394): hiệu ứng theo hệ của hồn kỹ vừa tung (kiểu theo `area`, hệ theo bảng hiển thị ở skillFx.ts) + cảnh vòng 7+. Chỉ hình ảnh. */
  skillFx(m: any, v: PView, sk: SkillDef) {
    const fd = skillFxOf(VOHON[m.vh].id, m.i, !!m.ct), tc = hex(TIERS[m.tier]?.glow ?? "#ffffff"), r = sk.r * RX;
    const a = Math.PI / 2 + DIRS8.indexOf(v.face) * (Math.PI / 4), at = this.feet(v);
    const go = (kind: FxKind, o: { ang?: number; r?: number; dist?: number; x?: number; y?: number } = {}) =>
      this.skfx.play(kind, fd.element, { x: at.x, y: at.y, ang: a, r, tierCol: tc, partsOnly: replaced, ...o });
    const vis0 = skillVisualOf(VOHON[m.vh].id, m.i, !!m.ct), vis = SV_OFF ? { ...vis0, sheet: undefined, windupSheet: undefined, aftershock: undefined } : vis0, mine0 = m.id === this.me, tl = vis.sheet?.at === "cast" ? 0 : Math.max(r, 24 * SPR) * (sk.area === "proj" ? 0.9 : 0.5);
    if (mine0) this.castHeavy = { t: this.time.now, heavy: vis.heavy };
    if (vis.tier === 3 && vis.sheet) this.pt.strike(m.id, this.time.now); // T3: pháp tướng ra đòn cùng chiêu (hoạt ảnh đánh H2, không rung màn)
    const replaced = this.svis.cast(vis, { x: at.x, y: at.y - 8 * SPR, ang: a, tx: at.x + Math.cos(a) * tl, ty: at.y + Math.sin(a) * tl * 0.5 - 8 * SPR, mine: mine0, r, n: sk.n, everyMs: (sk.every ?? 0) * 1000, spread: ((sk.spread ?? 0) * Math.PI) / 180 });
    if (sk.area === "proj") { // sheet thay hiệu ứng G3 (SKILL_VISUAL.replace) thì G3 chỉ còn hạt (partsOnly)
      const n = Math.min(sk.n ?? 1, sk.spread && sk.spread >= 360 ? 6 : 3), sp = ((sk.spread ?? 0) * Math.PI) / 180;
      for (let j = 0; j < n; j++) go("proj", { ang: sk.spread && sk.spread >= 360 ? (j / n) * Math.PI * 2 : a + (n > 1 ? (j / (n - 1) - 0.5) * sp : 0), dist: r * 0.9 });
    } else if (sk.area === "around") go("zone");
    else if (sk.area === "front" || sk.area === "dash") go("slash", { r: Math.max(r, 24 * SPR) });
    else if (sk.area === "self") go("aura");
    else go("hit", { x: at.x + Math.cos(a) * r * 0.5, y: at.y + Math.sin(a) * r * 0.25 });
    const me = this.players.get(this.me), mine = m.id === this.me;
    if (isCinematic(m.i, !!m.ct) && cineAllowed(mine, me ? Math.hypot(me.wx - v.wx, me.wy - v.wy) : 0)) this.cine.show(VOHON[m.vh].id, sk.name, TIERS[m.tier]?.glow ?? "#ffffff", mine);
  }

  soulRingFx(id: string, tier: number, dur: number) {
    const v = this.players.get(id); if (!v) return;
    const g = this.add.graphics().setDepth(99981); const o = { k: 0 }, t = TIERS[tier];
    this.light.flash(v.root.x, v.root.y - 6, t.glow, 70, dur, 1.2);
    // G1: mọi vòng hồn hoàn dưới chân nháy sáng nối nhau rồi vòng của kỹ năng bay lên kèm tia sáng cùng màu niên hạn.
    this.ringFx(this.feet(v), 5, 22 + 3 * tier, t.glow, dur * 0.7);
    if (fxLevel() !== "low") for (let j = 0; j < (fxLevel() === "high" ? 16 : 9); j++) this.time.delayedCall(j * 22, () => {
      if (v.root.active) this.fxp.emit(v.root.x + (Math.random() - 0.5) * 22 * SPR, v.root.y - 4 * SPR, j % 3 ? hex(t.glow) : 0xffffff, { vx: (Math.random() - 0.5) * 18, vy: -(40 + Math.random() * 50) * SPR / 2, life: 0.55, size: 2, gravity: -6 });
    });
    this.tweens.add({ targets: o, k: 1, duration: dur, onUpdate: () => {
      const x = v.root.x, y = v.root.y - o.k * 20 * SPR; g.clear();
      g.lineStyle(3, hex(t.col), 1 - o.k * 0.8); g.strokeEllipse(x, y, 22 * SPR, 8 * SPR);
      g.lineStyle(1, hex(t.glow), 1 - o.k * 0.8); g.strokeEllipse(x, y, 24 * SPR, 9 * SPR);
    }, onComplete: () => g.destroy() });
  }

  /** Chất liệu chỗ đòn trúng (G2): hồn sư là thịt; còn lại theo hồn thú gần điểm trúng nhất (băng, giáp, cây, thịt). */
  hitMaterial(m: { x: number; y: number; id?: string }): Material {
    if (m.id) return "thit";
    let best: Material = "thit", bd = 40;
    this.room.state.beasts.forEach((b: any) => { const d = Math.hypot(b.x - m.x, b.y - m.y); if (d < bd) { bd = d; best = materialOfBeast(beastSpeciesId(b.species, b.rank)); } });
    return best;
  }
  /** Ngữ cảnh chọn tiếng cho tin `fx` (G2): vũ khí, hệ, họ thú, bậc hồn hoàn của người / thú phát. Dung hợp kỹ (#193) lấy võ hồn người mời từ `va`. */
  fxSound(m: any, actor?: PView): FxSoundInfo & { he?: string } {
    const def = m.k === "fusion" ? VOHON[m.va] : actor ? VOHON[actor.vh] : undefined, b = m.bid ? this.room.state.beasts.get(m.bid) : undefined;
    return { he: def?.he, vohonId: def?.id, mine: m.id === this.me, weapon: weaponOf(def?.id), element: def ? elementOf(def) : undefined, tier: Number.isInteger(m.tier) ? m.tier : undefined,
      family: b ? beastFamilyOf(beastSpeciesId(b.species, b.rank)) : undefined };
  }
  /** Bước chân (G2): mỗi nhịp khi đang di chuyển, theo bề mặt ô nền dưới chân; người xa nghe nhỏ và bị cắt trước (kênh Môi trường). */
  stepSound(id: string, wx: number, wy: number, moving: boolean, walking: boolean, time: number) {
    if (!moving) { this.stepT.delete(id); return; }
    const due = this.stepT.get(id);
    if (due === undefined) { this.stepT.set(id, time + 120); return; }
    if (time < due) return;
    this.stepT.set(id, time + (walking ? STEP_INTERVAL_MS.walk : STEP_INTERVAL_MS.run));
    const mine = id === this.me;
    this.audio.playGroup(`step-${surfaceOfGround(this.isoMap.groundNameAt(wx, wy))}`, { x: wx, y: wy }, { channel: "ambient", priority: mine ? 0.9 : 0.35, range: 200, gain: mine ? 1 : 0.8 });
    this.stepDust(wx, wy, walking, mine);
  }
  /** Bụi chân nhẹ theo đúng nhịp âm thanh bước; đổi hướng vẫn giữ nhịp, không tạo hạt ngoài mức cho phép. */
  stepDust(wx: number, wy: number, walking: boolean, mine: boolean) {
    const n = footDustCount(fxLevel(), fxPrefs.reduce, mine); if (!n) return;
    const surface = surfaceOfGround(this.isoMap.groundNameAt(wx, wy));
    const col = ({ co: 0x9a8b68, dat: 0x9b7654, da: 0x989898, tuyet: 0xe8f6ff, go: 0xb07a4d, nuoc: 0x88cfe0 } as Record<string, number>)[surface] ?? 0x9a8b68;
    const at = W2S(wx, wy); this.fxp.footDust(at.x, at.y + 2 * SPR, col, n, walking);
  }

  fx(m: any) {
    const actor = typeof m.id === "string" ? this.players.get(m.id) : undefined;
    // Dung hợp kỹ (#193): hệ của người mời lấy từ `va` trong tin (người mời có thể ngoài vùng đồng bộ, 11.4).
    this.audio.handleFx(m, this.fxSound(m, actor));
    // Mọi tọa độ trong tin "fx" là tọa độ thế giới; vẽ ở hình chiếu (10.1). Vòng / vùng là hình trên mặt đất (elip theo phép chiếu),
    // vệt chém, mũi tên, tia sét là hình đứng nên nhấc lên theo chiều cao thân (pixel cũ × SPR).
    if (m.k === "wave") {
      const at = this.lifted(m.x, m.y); this.ringFx(at, 4, m.r, m.col, 400);
      if (fxLevel() !== "low") this.fxp.dust(at.x, at.y + 2 * SPR, Math.min(28, m.r ?? 24) * SPR, 4 * SPR, hex(m.col), fxLevel() === "high" ? 8 : 4);
      if (m.shake && !this.autoOn() && this.nearMe(m.x, m.y, 220)) this.shake(300, 0.004);
    }
    else if (m.k === "egg") this.eggFx(m);
    // Truyền tống trận (11.2): mở khóa (vòng lan rộng), bắt đầu / thôi niệm (cột sáng), lúc đi và lúc tới (chớp sáng).
    else if (m.k === "wpopen") { const c = W2S(m.x, m.y); this.ringFx(c, 4, 40, "#8fe0ff", 900); this.ringFx(c, 2, 26, "#e8fbff", 700, 150); }
    else if (m.k === "wpcast") { if (m.t > 0) this.wpCasts.set(m.id, { t0: this.time.now, ms: m.t * 1000 }); else this.wpCasts.delete(m.id); }
    else if (m.k === "wpgo") { const c = W2S(m.x, m.y); this.ringFx(c, 2, 30, "#8fe0ff", 500); this.light.flash(c.x, c.y - 10, "#bfefff", 90, 600, 1.2); }
    else if (m.k === "slash") {
      const v = this.players.get(m.id); if (!v) return;
      this.playAct(m.id, "attack"); this.faceHit(m.id, m.dx, m.dy);
      const g = this.add.graphics().setDepth(99980), a = Math.atan2(m.dy, m.dx);
      g.lineStyle(2, hex(m.col), 1); g.strokePoints(ptsToScreen(arcPts(v.wx, v.wy, 15, a - 1.1, a + 1.1), 6 * SPR));
      this.tweens.add({ targets: g, alpha: 0, duration: 160, onComplete: () => g.destroy() });
    } else if (m.k === "trail") {
      const g = this.add.graphics().setDepth(99980), [p0, p1] = ptsToScreen([{ x: m.x0, y: m.y0 }, { x: m.x1, y: m.y1 }], 6 * SPR);
      g.lineStyle(4, hex(m.col), 1); g.lineBetween(p0.x, p0.y, p1.x, p1.y);
      this.tweens.add({ targets: g, alpha: 0, duration: 350, onComplete: () => g.destroy() });
      if (fxLevel() !== "low") { this.fxp.dust(p0.x, p0.y, 12 * SPR, 3 * SPR, hex(m.col), fxLevel() === "high" ? 6 : 3); this.fxp.dust(p1.x, p1.y, 12 * SPR, 3 * SPR, hex(m.col), fxLevel() === "high" ? 6 : 3); }
    } else if (m.k === "burst") {
      // Vòng 10 mũi (Hồn Tiễn) hoặc `n` mũi tỏa `spread` độ quanh hướng a0 (hồn kỹ riêng); mũi bay song song mặt đất, ngang ngực.
      const n = m.n ?? 10, ring = !m.spread || m.spread >= 360, sp = ((m.spread ?? 0) * Math.PI) / 180, R = m.r ?? 110, c = this.lifted(m.x, m.y);
      for (let k = 0; k < n; k++) {
        const a = ring ? (k / n) * Math.PI * 2 : m.a0 + (n > 1 ? (k / (n - 1) - 0.5) * sp : 0), to = groundAt(c.wx, c.wy, R, a, c.lift);
        const r = this.add.rectangle(c.x, c.y - c.lift, 4 * SPR, 4 * SPR, hex(m.col)).setDepth(99980);
        this.tweens.add({ targets: r, x: to.x, y: to.y, duration: (R / 170) * 1000, onComplete: () => r.destroy() });
      }
    } else if (m.k === "soulring") {
      this.playAct(m.id, "cast");
      const v = this.players.get(m.id); if (v && Number.isInteger(m.i)) v.lit = { i: m.i, t0: this.time.now };
      this.soulRingFx(m.id, m.tier, 700);
      // Tên hồn kỹ (riêng hoặc dùng chung) bay lên trên đầu, màu hào quang hồn hoàn của vòng đó.
      // m.i: chỉ số vòng (từ 8.1a có vòng 5–10); m.ct: hồn kỹ Chân Thân (9.6, vòng 7)
      const sk = v && VOHON[m.vh] ? (m.ct ? chanThanOf(VOHON[m.vh].id)?.skill : ringSkill(VOHON[m.vh].id, m.i)) : undefined;
      if (v && sk) this.floatText(v.root.x, v.root.y - HEAD - 18, sk.name, TIERS[m.tier]?.glow ?? "#ffffff");
      if (sk) this.show?.noteSkill(m.id, sk.name);
      if (v && sk && !m.av) this.skillFx(m, v, sk); // `av`: biến hình Chân Thân, cảnh lớn do tin `avatar` dựng với tên Chân Thân
    }
    else if (m.k === "ult" || m.k === "avatar") {
      // Tuyệt kỹ vòng 10 / Võ Hồn Chân Thân (8.1a): hai vòng sáng, chớp màn hình khi ở gần; chính mình thấy banner, người khác thấy tên lớn bay lên.
      const v = this.players.get(m.id); if (!v || (m.k === "avatar" && !m.on)) return;
      const { x, y } = v.root, col = m.col ?? "#ffffff";
      if (m.id !== this.me) {
        const t = this.add.text(x, y - HEAD - 32, m.name, { fontFamily: FONT, fontSize: "11px", fontStyle: "800", color: col, stroke: "#000", strokeThickness: 3, resolution: 8 })
          .setOrigin(0.5).setDepth(99990).setScale(0.5 * this.txtK);
        this.tweens.add({ targets: t, scale: 1.15 * this.txtK, y: y - HEAD - 44, duration: 450, ease: "Back.out" });
        this.tweens.add({ targets: t, alpha: 0, delay: 1300, duration: 500, onComplete: () => t.destroy() });
      }
      this.ringFx(this.feet(v), 6, m.k === "ult" ? 150 : 90, col, 650); this.ringFx(this.feet(v), 4, m.k === "ult" ? 110 : 60, "#ffffff", 550, 150);
      const me = this.players.get(this.me);
      if (me && m.id === this.me) { // H8 (#491): chớp / rung chỉ khi CHÍNH MÌNH biến hình / tung tuyệt kỹ; đông người cùng tung thì màn không chớp liên hồi
        const c = Phaser.Display.Color.HexStringToColor(col);
        this.flash(m.k === "ult" ? 260 : 180, c.red, c.green, c.blue); this.shake(300, m.k === "ult" ? 0.006 : 0.003);
      }
      if (m.k === "ult") this.pt.burst(m.id, this.time.now);
      else this.pt.begin(m.id, this.time.now); // chuỗi biến hình ~1,2 s (vòng sáng, cột sáng, pháp tướng hiện từ dưới lên, gầm)
      const cut = m.k === "avatar" && m.id === this.me && !!VOHON[v.vh] && this.ptCut.show(this, VOHON[v.vh].id, col); // cut-in 0,5 s, chỉ mình thấy
      if (m.id === this.me) hud.banner(m.name, m.k === "ult" ? "Tuyệt kỹ" : "Võ Hồn Chân Thân");
      if (m.k === "avatar" && VOHON[v.vh] && cineAllowed(m.id === this.me, me ? Math.hypot(me.wx - v.wx, me.wy - v.wy) : 0)) this.cine.show(VOHON[v.vh].id, m.name, col, m.id === this.me, cut);
    }
    else if (m.k === "bone") {
      // Kỹ năng hồn cốt chủ động (4.3): vòng sáng màu niên hạn hồn cốt, tên kỹ năng bay lên (tra theo loài và nút).
      this.playAct(m.id, "cast");
      const v = this.players.get(m.id), col = TIERS[m.tier]?.glow ?? "#ffffff", k = boneSkillOf(BEASTS[m.sp]?.id ?? "", BONE_ACTIVE_SLOTS[m.i]);
      if (v) { this.ringFx(this.feet(v), 4, 22, col, 420); if (k?.active) this.floatText(v.root.x, v.root.y - HEAD - 18, k.sk.name, col); }
    }
    else if (m.k === "combo") {
      // Bộ hồn hạch Hạo Thiên 4 món (5.2): đòn thường thứ 3 liên tiếp, chữ bay lên màu bộ.
      const v = this.players.get(m.id); if (v) this.floatText(v.root.x, v.root.y - HEAD - 18, "Hạo Thiên liên kích!", m.col ?? "#b9a3ff");
    }
    else if (m.k === "pull") {
      // Gom quái: vòng thu từ bán kính r về thân, kèm dây kéo trên mặt đất.
      const c = this.lifted(m.x, m.y);
      this.ringFx(c, m.r, 6, m.col, 380);
      const g = this.add.graphics().setDepth(99980);
      for (let k = 0; k < 6; k++) { const e = groundAt(c.wx, c.wy, m.r, (k / 6) * Math.PI * 2); g.lineStyle(1, hex(m.col), 0.8).lineBetween(c.x, c.y, e.x, e.y); }
      this.tweens.add({ targets: g, alpha: 0, duration: 380, onComplete: () => g.destroy() });
    } else if (m.k === "arc") {
      // Đòn nửa trước mặt: cung rộng dày trên mặt đất trước hồn sư.
      if (this.players.has(m.id)) { this.playAct(m.id, "attack"); this.faceHit(m.id, m.dx, m.dy); }
      const g = this.add.graphics().setDepth(99980), a = Math.atan2(m.dy, m.dx), c = this.lifted(m.x, m.y);
      g.lineStyle(4, hex(m.col), 1); g.strokePoints(ptsToScreen(arcPts(c.wx, c.wy, m.r, a - 1.2, a + 1.2)));
      g.lineStyle(1, 0xffffff, 0.8); g.strokePoints(ptsToScreen(arcPts(c.wx, c.wy, m.r - 4, a - 1, a + 1)));
      this.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
    } else if (m.k === "claw") {
      // Một nhát vào mục tiêu (cào / nện liên hoàn): 3 vệt chéo đứng trên thân mục tiêu, đổi hướng theo nhát.
      const g = this.add.graphics().setDepth(99981), dir = m.i % 2 ? -1 : 1, c = this.lifted(m.x, m.y), x = c.x, y = c.y - c.lift, k = SPR;
      for (let j = -1; j <= 1; j++) g.lineStyle(2, hex(m.col), 1).lineBetween(x - 6 * dir * k + j * 3 * k, y - 6 * k, x + 6 * dir * k + j * 3 * k, y + 6 * k);
      this.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
    } else if (m.k === "buff") {
      // Hiệu ứng có lợi lên bản thân: vòng sáng và hạt bay lên. `ally` (9.1): nhận từ đồng đội tổ đội, không múa tung chiêu.
      const v = this.players.get(m.id); if (!v) return;
      if (!m.ally) this.playAct(m.id, "cast");
      this.ringFx(this.feet(v), 4, 22, m.col, 450);
      for (let k = 0; k < 8; k++) {
        const q = this.add.rectangle(v.root.x + (k - 3.5) * 3 * SPR, v.root.y - 2 * SPR, 2 * SPR, 2 * SPR, hex(m.col)).setDepth(99980);
        this.tweens.add({ targets: q, y: v.root.y - (26 + (k % 3) * 5) * SPR, alpha: 0, duration: 600, delay: k * 25, onComplete: () => q.destroy() });
      }
    }
    else if (m.k === "fly") {
      // Bay (chỉ hiệu ứng): nhấc hồn sư lên, đôi cánh lửa và tàn lửa rơi xuống bóng.
      const v = this.players.get(m.id); if (!v) return;
      v.fly = { t0: this.time.now, ms: (m.t ?? 0.5) * 1000 };
      for (let k = 0; k < 10; k++) {
        const q = this.add.rectangle(v.root.x + (k - 4.5) * 3 * SPR, v.root.y - 14 * SPR, 2 * SPR, 2 * SPR, hex(k % 2 ? m.col : "#ffe08a")).setDepth(99980);
        this.tweens.add({ targets: q, y: v.root.y, alpha: 0, duration: v.fly.ms, delay: k * 20, onComplete: () => q.destroy() });
      }
    }
    else if (m.k === "zone") {
      // Vùng cố định (2.5c): vùng phong tỏa của Càn Khôn Hỗn Nguyên Tỏa, lãnh vực Yêu Hồ; giữ `t` giây ở chỗ đặt, mờ dần lúc cuối.
      const g = this.add.graphics().setDepth(5), c = hex(m.col), t0 = this.time.now, ms = (m.t ?? 1) * 1000, at = this.lifted(m.x, m.y);
      this.light.flash(at.x, at.y, m.col, m.r * RX + 12, ms, 0.7);
      const ev = this.time.addEvent({ delay: 50, loop: true, callback: () => {
        const k = (this.time.now - t0) / ms, al = k > 0.8 ? (1 - k) * 5 : 1; g.clear();
        if (k >= 1) { ev.remove(); g.destroy(); return; }
        g.fillStyle(c, 0.12 * al); fillGround(g, at.wx, at.wy, m.r);
        g.lineStyle(2, c, 0.8 * al); strokeGround(g, at.wx, at.wy, m.r);
        for (let j = 0; j < 8; j++) { const p = groundAt(at.wx, at.wy, m.r, this.time.now / 700 + (j / 8) * Math.PI * 2); g.fillStyle(c, al).fillRect(p.x - 1.5 * SPR, p.y - 1.5 * SPR, 3 * SPR, 3 * SPR); }
      } });
    } else if (m.k === "bolt") {
      // Lôi Động Minh Thiên (Phong Lôi Chi Lực đầy, 2.5c): nhiều tia sét giáng xuống quanh hồn sư, chớp sáng, tên chiêu bay lên.
      const g = this.add.graphics().setDepth(99982), c = hex(m.col), at = this.lifted(m.x, m.y), H = 70 * SPR;
      for (let j = 0; j < 7; j++) {
        const a = (j / 7) * Math.PI * 2, d = j ? m.r * (0.4 + 0.5 * ((j * 37) % 10) / 10) : 0, { x, y } = groundAt(at.wx, at.wy, d, a);
        let px = x + 6 * SPR, py = y - H; g.lineStyle(2, j % 2 ? 0xffffff : c, 1);
        for (let s = 1; s <= 5; s++) { const nx = x + (s === 5 ? 0 : (s % 2 ? -5 : 5) * SPR), ny = y - H + (s * H) / 5; g.lineBetween(px, py, nx, ny); px = nx; py = ny; }
      }
      this.tweens.add({ targets: g, alpha: 0, duration: 450, onComplete: () => g.destroy() });
      this.ringFx(at, 6, m.r, m.col, 450); this.flash(120, 200, 230, 255);
      const v = this.players.get(m.id); if (v) this.floatText(v.root.x, v.root.y - HEAD - 18, m.name ?? PHONG_LOI.skill.name, "#e8f6ff");
    } else if (m.k === "zap") {
      // Sét tìm mục tiêu Cảm điện ở xa (SkillDef.shockR, tuyệt kỹ Lam Điện Bá Vương Long, 8.1c): tia sét gấp khúc từ tâm vùng tới từng mục tiêu.
      const g = this.add.graphics().setDepth(99981), c = hex(m.col), o = this.lifted(m.x, m.y), ox = o.x, oy = o.y - o.lift;
      for (const t of (m.to ?? []) as { x: number; y: number }[]) {
        const ts = W2S(t.x, t.y), dx = ts.x - ox, dy = ts.y - 6 * SPR - oy, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, seg = Math.max(3, Math.round(L / 36));
        let px = ox, py = oy;
        for (let s = 1; s <= seg; s++) {
          const j = s === seg ? 0 : (s % 2 ? 6 : -6) * SPR, x = ox + (dx * s) / seg + nx * j, y = oy + (dy * s) / seg + ny * j;
          g.lineStyle(3, c, 0.9).lineBetween(px, py, x, y); g.lineStyle(1, 0xffffff, 1).lineBetween(px, py, x, y); px = x; py = y;
        }
        this.ringFx(ts, 3, 16, m.col, 300);
      }
      this.tweens.add({ targets: g, alpha: 0, duration: 380, onComplete: () => g.destroy() });
    }
    else if (m.k === "tele") {
      // Chiêu báo trước của hồn thú (3.5): vùng đỏ hiện `t` giây, đầy dần; tên chiêu đỏ trên đầu hồn thú.
      // Người vừa vào (#118) nhận `t` giây còn lại kèm `warn` cả chiêu: vùng đầy dần khớp với người đã ở trong phòng.
      const ms = (m.warn ?? m.t ?? 0.8) * 1000;
      this.teles.set(m.bid, { t: [m, ...(m.parts ?? [])], t0: this.time.now - (m.warn ? (m.warn - m.t) * 1000 : 0), ms, safe: m.safe });
      const s = this.beasts.get(m.bid), b = this.room.state.beasts.get(m.bid);
      if (s && b) this.floatText(s.x, beastTop(s, b.tier) - 10, m.name, "#ff6b6b");
      // Quay về vùng báo trước (mục 5.11): vệt / nón theo hướng chiêu, vòng dưới chân mục tiêu theo hướng tới tâm vòng.
      const d = b && (m.shape !== "circle" ? dir8(Math.cos(m.ang), Math.sin(m.ang)) : Math.hypot(m.x - b.x, m.y - b.y) > 2 ? dir8(m.x - b.x, m.y - b.y) : null);
      if (d) this.bface.set(m.bid, d);
    }
    else if (m.k === "teleEnd") this.teles.delete(m.bid); // bị ngắt chiêu (Choáng, Câm lặng, Mê hoặc)
    else if (m.k === "teleHit") this.teleHitFx(m);
    else if (m.k === "rage" || m.k === "dispel") {
      // Tinh anh nổi Cuồng nộ (máu dưới một nửa) / bị xóa hiệu ứng có lợi (Thiên Càn Trấn Áp), BĐ4.
      const s = this.beasts.get(m.bid), b = this.room.state.beasts.get(m.bid); if (!s || !b) return;
      const rage = m.k === "rage", col = rage ? BEAST_BUFFS.rage.col : "#f0e0a0";
      this.floatText(s.x, beastTop(s, b.tier) - 10, rage ? `${m.name}!` : "Xóa hiệu ứng", col);
      this.ringFx(s, 6, rage ? 40 : 30, col, 450);
      if (rage) this.shake(120, 0.003);
    }
    else if (m.k === "form") {
      // Hồn thú đổi dạng (#173, Song Sắc Mãng băng / hỏa): chữ tên dạng và vòng màu dạng mới.
      const s = this.beasts.get(m.bid), b = this.room.state.beasts.get(m.bid); if (!s || !b) return;
      this.floatText(s.x, beastTop(s, b.tier) - 10, `Hóa ${m.name}!`, m.col ?? "#ffffff");
      this.ringFx(s, 6, 36, m.col ?? "#ffffff", 450);
    }
    else if (m.k === "roar") {
      // Thú vương chuyển giai đoạn 2 (BĐ5): gầm lên, sóng đỏ lan ra, rung màn hình.
      const s = this.beasts.get(m.bid), b = this.room.state.beasts.get(m.bid); if (!s || !b) return;
      this.floatText(s.x, beastTop(s, b.tier) - 12, `${m.name}!`, m.col ?? "#ff5a5a");
      for (let k = 0; k < 3; k++) this.ringFx(s, 10, 90 + k * 30, m.col ?? "#ff5a5a", 700, k * 250);
      this.shake(400, 0.006);
    }
    else if (m.k === "tienco") this.tienCoFx(m);
    else if (m.k === "fusion") this.fusionFx(m); // Võ Hồn Dung Hợp Kỹ (#193)
    else if (m.k === "absorbed") {
      const v = this.players.get(m.id); if (!v) return; const t = TIERS[m.tier];
      for (let k = 0; k < 3; k++) this.ringFx(this.feet(v), 4 + k * 6, 60 + k * 20, t.glow, 700, k * 120);
      this.soulRingFx(m.id, m.tier, 1400);
      if (m.id === this.me) this.shake(400, 0.006); // chữ thông báo đến qua tin riêng "absorbing"
    }
  }

  /** Đa giác thế giới của một vùng chiêu báo trước, `k` (0..1) là phần đã đầy tính từ gốc (vệt, nón). Vòng tròn vẽ riêng bằng elip. */
  telePts(t: Tele, k: number): Pt[] {
    const r = t.r * k;
    if (t.shape === "line") {
      const c = Math.cos(t.ang), sn = Math.sin(t.ang), h = t.w / 2;
      return [{ x: t.x - sn * h, y: t.y + c * h }, { x: t.x + sn * h, y: t.y - c * h },
        { x: t.x + c * r + sn * h, y: t.y + sn * r - c * h }, { x: t.x + c * r - sn * h, y: t.y + sn * r + c * h }];
    }
    const half = (t.arc * Math.PI) / 360;
    return [{ x: t.x, y: t.y }, ...arcPts(t.x, t.y, r, t.ang - half, t.ang + half)];
  }
  /** Vẽ một vùng chiêu báo trước trên mặt đất (theo phép chiếu): `k` (0..1) là phần đã đầy tính từ gốc (vệt, nón) hoặc từ tâm (vòng). */
  teleShape(g: Phaser.GameObjects.Graphics, t: Tele, k: number) {
    if (t.shape === "circle") { fillGround(g, t.x, t.y, t.r * k); return; }
    g.fillPoints(ptsToScreen(this.telePts(t, k)), true);
  }
  teleOutline(g: Phaser.GameObjects.Graphics, t: Tele) {
    if (t.shape === "circle") { strokeGround(g, t.x, t.y, t.r); return; }
    g.strokePoints(ptsToScreen(this.telePts(t, 1)), true, true);
  }
  /** Mọi vùng cảnh báo đang hiện: nền đỏ mờ cả vùng, phần đỏ đậm đầy dần theo thời gian, viền nhấp nháy nhanh dần lúc sắp tung. */
  drawTeles(time: number) {
    const g = this.teleG, gt = this.teleTop; g.clear(); gt.clear();
    this.drawGrounds(g, time); // vùng lưu lại nằm dưới vùng cảnh báo
    this.paintHoaDan(g, time); // Hỏa Đàn (#163): vòng hơi ấm cũng dưới vùng cảnh báo; đống lửa ở lớp riêng theo độ sâu
    for (const [bid, x] of this.teles) {
      const k = Math.min(1, (time - x.t0) / x.ms);
      // Hồn thú đã bị hạ hoặc server không gửi kết quả (mất gói): bỏ vùng.
      if (!this.room.state.beasts.has(bid) || time - x.t0 > x.ms + 1000) { this.teles.delete(bid); continue; }
      const blink = 0.55 + 0.45 * Math.sin(time / (k > 0.6 ? 45 : 90));
      // G1: vòng đỏ thu dần quanh chân hồn thú (đòn sắp tới), nhấp nháy nhanh dần cùng viền vùng.
      const bp = this.bpos.get(bid), bs = this.room.state.beasts.get(bid);
      if (bp && bs) { const R = (10 + 10 * bs.tier) * (1.6 - 0.6 * k); g.lineStyle(2, k > 0.6 ? 0xffd0d0 : TELE_COL, 0.5 + 0.5 * blink); strokeGround(g, bp.x, bp.y, R); gt.lineStyle(2, k > 0.6 ? 0xffd0d0 : TELE_COL, 0.5 + 0.5 * blink); strokeGround(gt, bp.x, bp.y, R); }
      for (const t of x.t) {
        g.fillStyle(TELE_COL, 0.16); this.teleShape(g, t, 1);
        g.fillStyle(TELE_COL, 0.2 + 0.25 * k); this.teleShape(g, t, k);
        g.lineStyle(1, k > 0.6 ? 0xffd0d0 : TELE_COL, blink); this.teleOutline(g, t);
        gt.lineStyle(2, k > 0.6 ? 0xffd0d0 : TELE_COL, 0.55 + 0.45 * blink); this.teleOutline(gt, t);
      }
      // Chiêu toàn sàn (#118): vòng an toàn xanh ngọc phủ lên vùng đỏ, viền sáng dần khi sắp nổ.
      for (const t of x.safe ?? []) {
        g.fillStyle(SAFE_COL, 0.3 + 0.15 * k); fillGround(g, t.x, t.y, t.r);
        g.lineStyle(2, k > 0.6 ? 0xffffff : SAFE_COL, 0.6 + 0.4 * blink); strokeGround(g, t.x, t.y, t.r);
        gt.lineStyle(2, k > 0.6 ? 0xffffff : SAFE_COL, 0.6 + 0.4 * blink); strokeGround(gt, t.x, t.y, t.r);
      }
    }
    this.drawDiveMark(time);
  }
  /**
   * Du Thủy (#118): chỗ boss sắp nổi lên là vòng sóng xanh đầy dần tới lúc nổi (cùng lớp mặt đất với vùng cảnh báo); boss đang lặn ở
   * giữa hồ có gợn sóng quanh thân.
   */
  drawDiveMark(time: number) {
    const dm = this.diveMark, g = this.teleG; if (!dm) return;
    // Không dựa vào boss trong state: tin "dive" / "here" có thể tới trước bản vá đầu tiên có boss (người vừa vào) hoặc có cờ lặn.
    // Chỉ bỏ dấu khi quá giờ hoặc có tin "surface" / "reset" / "leave" / "down".
    const b = this.room.state.beasts.get(dm.bid);
    if (time - dm.t0 > dm.ms + DIVE_MARK.holdMs) { this.diveMark = null; return; }
    const k = Math.min(1, (time - dm.t0) / dm.ms), R = DIVE_MARK.r, pulse = 0.5 + 0.5 * Math.sin(time / 120);
    g.fillStyle(DIVE_COL, 0.15 + 0.2 * k); fillGround(g, dm.x, dm.y, R * k);
    g.lineStyle(2, DIVE_COL, 0.6 + 0.4 * pulse); strokeGround(g, dm.x, dm.y, R);
    for (let j = 0; j < 2; j++) { const f = (time / 900 + j / 2) % 1; g.lineStyle(1, 0xd8f0ff, 1 - f); strokeGround(g, dm.x, dm.y, R * (0.3 + 0.7 * f)); }
    if (b?.dive) for (let j = 0; j < 3; j++) { const f = (time / 1100 + j / 3) % 1; g.lineStyle(1, 0xd8f0ff, 0.8 * (1 - f)); strokeGround(g, b.x, b.y, 12 + (DIVE_MARK.ripple - 12) * f); }
  }
  /**
   * Vùng lưu lại trên mặt đất (#161, `state.grounds`, server chỉ đồng bộ vùng ở gần nên người mới vào tầm vẫn thấy): vẽ bằng code theo
   * phép chiếu (elip isometric, cả `?view=topdown`), màu theo GROUND_KINDS (độc: lục, không dùng đỏ của vùng cảnh báo). Vũng độc: mặt
   * nước sẫm, viền sáng, bọt nổi lên rồi vỡ; sương độc: các làn sương mờ trôi chậm quanh tâm. Hiện dần lúc mới có, mờ dần giây cuối.
   * Từ #174 (Thủy Triều Dâng): vùng ngập là mặt nước xanh sâu, gợn sóng lan và ánh sáng lấp lánh; xoáy nước là các nhánh xoắn quay về tâm
   * với lõi tối. Đang báo trước (`wait` > 0): chỉ viền đứt nhấp nháy và vòng nước dâng từ tâm ra mép (chưa có tác dụng).
   */
  drawGrounds(g: Phaser.GameObjects.Graphics, time: number) {
    const grounds = this.room.state.grounds; if (!grounds) return;
    // Server đồng bộ `ttl` theo giây nguyên: neo lại mỗi lần đổi (lúc đó còn đúng `ttl` giây) rồi tự đếm; `seen`: lúc thấy vùng lần đầu.
    for (const id of this.groundClock.keys()) if (!grounds.has(id)) this.groundClock.delete(id);
    grounds.forEach((z: any, id: string) => {
      let ck = this.groundClock.get(id);
      if (!ck) this.groundClock.set(id, ck = { v: z.ttl, at: time, seen: time });
      else if (ck.v !== z.ttl) { ck.v = z.ttl; ck.at = time; }
      const left = ck.v - (time - ck.at) / 1000;
      const kind = GROUND_KINDS[z.kind] ?? GROUND_KINDS[0], c = hex(kind.col), seed = parseInt(id.slice(1), 10) || 0;
      const t: Tele = { shape: TELE_SHAPES[z.shape] ?? "circle", x: z.x, y: z.y, ang: z.ang, r: z.r, w: z.w, arc: z.arc };
      const fade = Math.max(0, Math.min(1, left, (time - ck.seen) / 300)), pulse = 0.5 + 0.5 * Math.sin(time / 420 + seed);
      const circle = t.shape === "circle";
      if (kind.id === "flood" || kind.id === "whirl") { this.drawWater(g, t, kind.id === "whirl", c, z.wait > 0, fade, time, seed); return; }
      if (kind.id === "ice" || kind.id === "fire" || kind.id === "web") { this.drawLairPart(g, t, kind.id, c, z.wait > 0, fade, time); return; }
      if (kind.id === "mist") {
        // Sương: nền mờ cả vùng và 4 làn sương lệch tâm xoay chậm (vòng tròn); hình khác chỉ tô nền nhạt hơn.
        g.fillStyle(c, 0.22 * fade); this.teleShape(g, t, 1);
        if (circle) for (let k = 0; k < 4; k++) {
          const a = time / 2600 + seed + (k * Math.PI) / 2, d = t.r * 0.35;
          g.fillStyle(c, (0.16 + 0.07 * Math.sin(time / 700 + k)) * fade);
          fillGround(g, t.x + Math.cos(a) * d, t.y + Math.sin(a) * d, t.r * 0.55, 3 + 2 * Math.sin(time / 900 + k));
        }
        g.lineStyle(1, c, (0.4 + 0.25 * pulse) * fade); this.teleOutline(g, t);
        return;
      }
      // Vũng: nền sẫm, lõi đậm hơn, viền sáng đập nhẹ, bọt nổi (vị trí theo id vùng để mỗi vũng một kiểu).
      g.fillStyle(0x10260c, 0.55 * fade); this.teleShape(g, t, 1);
      g.fillStyle(c, (0.3 + 0.1 * pulse) * fade); this.teleShape(g, t, circle ? 0.72 : 1);
      g.lineStyle(2, c, (0.6 + 0.3 * pulse) * fade); this.teleOutline(g, t);
      if (circle) for (let k = 0; k < 5; k++) {
        const ph = ((time / 1100 + k * 0.37 + seed * 0.13) % 1), a = seed * 1.7 + k * 2.4, d = t.r * (0.2 + 0.55 * ((k * 0.61 + seed * 0.29) % 1));
        g.fillStyle(0xe8ffb8, (1 - ph) * 0.9 * fade); fillGround(g, t.x + Math.cos(a) * d, t.y + Math.sin(a) * d, 1 + ph * 2.2);
      }
    });
  }
  /**
   * Phần hang đang hóa (#173, drawGrounds; dải `line` phủ một phần hang): băng là mặt băng xanh nhạt với tinh thể sáng lấp lánh, lửa là
   * nền cam đập nhẹ với tàn lửa bay lên, tơ là nền trắng mờ với các sợi tơ chéo đan nhau. Đang báo trước (`wait`): nền rất nhạt, viền
   * nhấp nháy nhanh và một vệt màu quét dọc dải (lặp), chưa có tác dụng.
   */
  drawLairPart(g: Phaser.GameObjects.Graphics, t: Tele, kind: "ice" | "fire" | "web", c: number, wait: boolean, fade: number, time: number) {
    // Điểm thế giới theo tọa độ trong dải: u 0..1 dọc chiều dài, v −0,5..0,5 theo bề rộng.
    const cs = Math.cos(t.ang), sn = Math.sin(t.ang), at = (u: number, v: number) => ({ x: t.x + cs * u * t.r - sn * v * t.w, y: t.y + sn * u * t.r + cs * v * t.w });
    const scr = (u: number, v: number) => { const p = at(u, v); return W2S(p.x, p.y); };
    // Hang thú vương ở bản đồ ×8 nhiều tán cây che mặt đất: thêm nền rất nhạt và viền trên lớp phủ (`ov`, trên cây và hồn sư) để luôn
    // thấy phần nào đang hóa / sắp hóa.
    const o = this.ov, beat = wait ? 0.5 + 0.5 * Math.sin(time / 110) : 0.5 + 0.5 * Math.sin(time / 600);
    o.fillStyle(c, (wait ? 0.05 : 0.08) * fade); this.teleShape(o, t, 1);
    o.lineStyle(1.5, c, (0.35 + 0.4 * beat) * fade); this.teleOutline(o, t);
    if (wait) {
      const blink = 0.5 + 0.5 * Math.sin(time / 110), k = (time / 700) % 1;
      g.fillStyle(c, 0.1 * fade); this.teleShape(g, t, 1);
      g.fillStyle(c, 0.22 * (1 - k) * fade); g.fillPoints(ptsToScreen([at(k * 0.85, -0.5), at(k * 0.85 + 0.15, -0.5), at(k * 0.85 + 0.15, 0.5), at(k * 0.85, 0.5)]), true);
      g.lineStyle(2, c, (0.45 + 0.5 * blink) * fade); this.teleOutline(g, t);
      return;
    }
    const pulse = 0.5 + 0.5 * Math.sin(time / (kind === "fire" ? 260 : 600));
    g.fillStyle(kind === "fire" ? 0x3a1200 : kind === "ice" ? 0x0a2a44 : 0x2a2a34, 0.3 * fade); this.teleShape(g, t, 1);
    g.fillStyle(c, (kind === "web" ? 0.14 : 0.22 + 0.08 * pulse) * fade); this.teleShape(g, t, 1);
    g.lineStyle(2, c, (0.55 + 0.3 * pulse) * fade); this.teleOutline(g, t);
    // Số điểm hoa văn theo diện tích dải (khoảng một điểm mỗi 20×20 pixel), vị trí cố định theo chỉ số (giả ngẫu nhiên).
    const n = Math.min(60, Math.max(8, Math.round((t.r * t.w) / 400))), fr = (x: number) => x - Math.floor(x);
    if (kind === "web") {
      // Sợi tơ: các đường chéo nối hai mép dài, đan hai chiều, rung nhẹ.
      const m = Math.max(4, Math.round(t.r / 18));
      for (let j = 0; j <= m; j++) {
        const u = j / m, sway = 0.02 * Math.sin(time / 500 + j);
        g.lineStyle(1, 0xffffff, (0.35 + 0.15 * Math.sin(time / 700 + j)) * fade);
        const a = scr(u, -0.5), b = scr(Math.min(1, u + 1 / m + sway), 0.5), d = scr(Math.max(0, u - 1 / m - sway), 0.5);
        g.lineBetween(a.x, a.y, b.x, b.y); g.lineBetween(a.x, a.y, d.x, d.y);
      }
      for (let j = 0; j < n / 3; j++) { const p = scr(fr(j * 0.618), fr(j * 0.377) - 0.5); g.fillStyle(0xffffff, 0.6 * fade); g.fillRect(p.x - SPR, p.y - SPR, 2 * SPR, 2 * SPR); }
      return;
    }
    for (let j = 0; j < n; j++) {
      const u = fr(j * 0.618 + 0.11), v = fr(j * 0.377 + 0.23) - 0.5;
      if (kind === "ice") {
        // Tinh thể băng: chữ thập nhỏ lấp lánh lệch pha.
        const p = scr(u, v), a = (0.3 + 0.6 * Math.max(0, Math.sin(time / 400 + j * 1.9))) * fade, s = 2 * SPR;
        g.lineStyle(1, 0xffffff, a); g.lineBetween(p.x - s, p.y, p.x + s, p.y); g.lineBetween(p.x, p.y - s * 0.6, p.x, p.y + s * 0.6);
      } else {
        // Tàn lửa: bay lên rồi tắt, lặp theo chu kỳ riêng.
        const ph = fr(time / 1300 + j * 0.37), p = scr(u, v);
        g.fillStyle(ph < 0.5 ? 0xffe08a : c, (1 - ph) * 0.9 * fade); g.fillRect(p.x - SPR, p.y - ph * 14 * SPR - SPR, 2 * SPR, 2 * SPR);
      }
    }
  }
  /** Vùng ngập / xoáy nước của Thủy Triều Dâng (#174, drawGrounds): vòng tròn trên mặt đất theo phép chiếu, vẽ bằng code. */
  drawWater(g: Phaser.GameObjects.Graphics, t: Tele, whirl: boolean, c: number, wait: boolean, fade: number, time: number, seed: number) {
    const { x, y, r } = t;
    if (wait) {
      // Báo trước: viền đứt quay chậm và vòng nước dâng từ tâm ra mép (lặp), nền rất nhạt.
      const blink = 0.5 + 0.5 * Math.sin(time / 140), k = (time / 900 + seed * 0.21) % 1;
      if (!whirl) { g.fillStyle(c, 0.1 * fade); fillGround(g, x, y, r); g.lineStyle(1.5, c, (0.25 + 0.35 * (1 - k)) * fade); strokeGround(g, x, y, r * k); }
      g.lineStyle(1.5, whirl ? 0xffffff : c, (0.4 + 0.4 * blink) * fade);
      const segs = 16, rot = time / 2400 + seed;
      for (let j = 0; j < segs; j += 2) {
        const a = groundAt(x, y, r, rot + (j / segs) * Math.PI * 2), b = groundAt(x, y, r, rot + ((j + 1) / segs) * Math.PI * 2);
        g.lineBetween(a.x, a.y, b.x, b.y);
      }
      return;
    }
    if (whirl) {
      // Xoáy: lõi tối, 3 nhánh xoắn (chấm sáng dần về tâm) quay nhanh, viền bọt.
      g.fillStyle(0x062048, 0.35 * fade); fillGround(g, x, y, r);
      g.fillStyle(0x020c20, 0.55 * fade); fillGround(g, x, y, r * 0.28);
      const rot = time / 260;
      for (let arm = 0; arm < 3; arm++) for (let j = 0; j < 12; j++) {
        const f = j / 12, p = groundAt(x, y, r * (1 - f * 0.9), -rot + (arm * Math.PI * 2) / 3 + f * 3.2);
        g.fillStyle(j % 3 ? c : 0xffffff, (0.35 + 0.5 * f) * fade); g.fillRect(p.x - SPR, p.y - SPR, 2 * SPR, 2 * SPR);
      }
      g.lineStyle(1, 0xe8f6ff, (0.45 + 0.2 * Math.sin(time / 200 + seed)) * fade); strokeGround(g, x, y, r);
      return;
    }
    // Vùng ngập: nước sâu ở giữa, viền sáng, gợn sóng lan từ tâm, ánh lấp lánh trôi chậm.
    const pulse = 0.5 + 0.5 * Math.sin(time / 520 + seed);
    g.fillStyle(0x0b2a5a, 0.42 * fade); fillGround(g, x, y, r);
    g.fillStyle(c, (0.26 + 0.06 * pulse) * fade); fillGround(g, x, y, r * 0.8);
    for (let j = 0; j < 3; j++) { const f = (time / 1600 + j / 3 + seed * 0.17) % 1; g.lineStyle(1, 0xcfe8ff, 0.5 * (1 - f) * fade); strokeGround(g, x, y, r * (0.2 + 0.78 * f)); }
    for (let j = 0; j < 6; j++) {
      const a = seed * 1.3 + j * 1.05 + time / 3000, d = r * (0.25 + 0.6 * ((j * 0.37 + seed * 0.11) % 1)), p = groundAt(x, y, d, a);
      g.fillStyle(0xffffff, (0.25 + 0.5 * Math.max(0, Math.sin(time / 300 + j * 1.7))) * fade); g.fillRect(p.x - 1.5 * SPR, p.y - 0.5 * SPR, 3 * SPR, SPR);
    }
    g.lineStyle(2, 0xd8f0ff, (0.5 + 0.3 * pulse) * fade); strokeGround(g, x, y, r);
  }

  /**
   * Aura tinh anh (BĐ4, mục 5.4 / 5.11, vẽ bằng code): vầng sáng màu riêng dưới chân (lớp mặt đất `teleG`, vẽ sau vùng cảnh báo) và
   * đốm sáng bay lên quanh thân (lớp phủ). Cuồng nộ thì vầng sáng đỏ, đập nhanh hơn.
   */
  drawAuras(g: Phaser.GameObjects.Graphics, st: any, time: number) {
    st.beasts.forEach((b: any, id: string) => {
      if (!b.rank || b.dive) return; const s = this.beasts.get(id); if (!s) return; // boss đang lặn giữa hồ (#118): không aura
      // Thú vương (BĐ5) ở giai đoạn 2 cũng đập nhanh như Cuồng nộ.
      // Hồn thú đổi dạng (#173): aura màu dạng đang có (cả khi Cuồng nộ: vẫn đập nhanh); báo trước đổi dạng thì nhấp nháy sang màu dạng sắp tới.
      const forms = b.form ? BOSSES[b.species]?.forms?.forms : undefined, fNow = forms?.[b.form - 1], fNext = forms?.[b.form % forms.length];
      const fCol = fNow && (b.formWarn && fNext && Math.floor(time / 180) % 2 ? fNext.col : fNow.col);
      const rage = (b.buff & beastBuffBit("rage")) !== 0 || b.phase === 2, c = hex(fCol ?? (rage && b.rank === 1 ? BEAST_BUFFS.rage.col : BOSSES[b.species]?.aura ?? "#ffffff"));
      const w = Math.max(24, s.displayWidth * 0.9), pulse = 0.5 + 0.5 * Math.sin(time / (rage ? 110 : 260));
      this.teleG.fillStyle(c, 0.3 + 0.15 * pulse).fillEllipse(s.x, s.y, w + 12, (w + 12) * 0.4);
      this.teleG.fillStyle(c, 0.35).fillEllipse(s.x, s.y, w * 0.6, w * 0.24);
      this.teleG.lineStyle(2, c, 0.7 + 0.3 * pulse).strokeEllipse(s.x, s.y, w + 6 + pulse * 6, (w + 6 + pulse * 6) * 0.4);
      // Sóng xung kích khi tinh anh / thú vương / boss tung đòn (hồn thú lai): vòng elip mở rộng và mờ dần trên mặt đất; tắt khi Giảm chuyển động.
      const age = beastStrikeAge(s, time);
      if (age >= 0 && age < 0.5 && beastMotionLevel(time) >= 0.5) {
        const r = (14 + age * 150) * (0.8 + 0.2 * b.rank);
        this.teleG.lineStyle(2, c, 0.8 * (1 - age / 0.5)).strokeEllipse(s.x, s.y, r * 2, r);
      }
      const top = beastTop(s, b.tier), h = Math.max(8, s.y - top);
      for (let j = 0; j < 6; j++) {
        const f = ((time / (rage ? 500 : 900) + j / 6) % 1), x = s.x + Math.sin(j * 2.4 + time / 700) * w * 0.45;
        g.fillStyle(c, 1 - f).fillRect(x - 1, s.y - f * h * 1.1 - 1, 2, 2);
      }
    });
  }

  /** Chiêu báo trước tung ra: vùng chớp sáng rồi tắt, vệt lao của hồn thú (Vồ Lao, Xung Phong…), rung nếu mình trúng. */
  teleHitFx(m: Tele & { bid: string; hit: string[]; x0: number; y0: number; x1: number; y1: number; parts?: Tele[]; safe?: Tele[] }) {
    this.teles.delete(m.bid);
    const g = this.add.graphics().setDepth(3);
    for (const t of [m, ...(m.parts ?? [])]) {
      g.fillStyle(0xffe0d0, 0.55); this.teleShape(g, t, 1);
      g.lineStyle(2, TELE_COL, 1); this.teleOutline(g, t);
      if (t.shape === "circle") this.ringFx(W2S(t.x, t.y), t.r * 0.6, t.r * 1.15, "#ff6b6b", 300);
    }
    for (const t of m.safe ?? []) { g.fillStyle(SAFE_COL, 0.5); fillGround(g, t.x, t.y, t.r); g.lineStyle(2, 0xffffff, 1); strokeGround(g, t.x, t.y, t.r); } // vòng an toàn (#118)
    this.tweens.add({ targets: g, alpha: 0, duration: 280, onComplete: () => g.destroy() });
    if (Math.hypot(m.x1 - m.x0, m.y1 - m.y0) > 4) {
      const tr = this.add.graphics().setDepth(99980), [a, b] = ptsToScreen([{ x: m.x0, y: m.y0 }, { x: m.x1, y: m.y1 }], 4 * SPR);
      tr.lineStyle(5, TELE_COL, 0.4).lineBetween(a.x, a.y, b.x, b.y);
      tr.lineStyle(1, 0xffffff, 0.9).lineBetween(a.x, a.y, b.x, b.y);
      this.tweens.add({ targets: tr, alpha: 0, duration: 300, onComplete: () => tr.destroy() });
    }
    if (m.hit.includes(this.me)) this.shake(180, 0.006);
  }

  /**
   * Võ Hồn Dung Hợp Kỹ (#193, `fx fusion` công khai cho người ở gần): hai luồng sáng màu võ hồn (`VOHON.col` của `va` / `vb`) từ ngực
   * người mời `id` và người hưởng ứng `to` vòng cung nhập vào điểm giữa (x, y); cùng lúc đóa kính lưu ly nở trên mặt đất (đòn của server
   * tới ngay sau tin này nên hình không chờ luồng sáng tới nơi) (phong cách D "Lưu Ly Bảo
   * Quang", mục 5.11: mảnh kính hai màu võ hồn và lam / ngọc / tím lưu ly, đường chì, viền vàng kim), vòng sáng màu niên hạn `col`, tên
   * chiêu lớn bay lên như tuyệt kỹ. Người nào ngoài vùng đồng bộ (11.4) thì bỏ luồng của người đó. Chỉ hình ảnh: sát thương do server.
   */
  fusionFx(m: { id: string; to: string; x: number; y: number; i: number; col?: string; va?: number; vb?: number }) {
    const f = FUSIONS[m.i]; if (!f) return;
    const k = SPR, c = W2S(m.x, m.y), cy = c.y - 12 * k, col = m.col ?? "#ffe08a", MERGE = 280, BLOOM = 120;
    const R = Math.max(40, ...f.parts.map((p) => p.r ?? 0)), cols: number[] = [];
    for (const [id, vh] of [[m.id, m.va], [m.to, m.vb]] as const) {
      const v = this.players.get(id), vc = hex(VOHON[vh ?? -1]?.col ?? col); cols.push(vc);
      if (!v) continue;
      this.playAct(id, "cast");
      const x0 = v.root.x, y0 = v.root.y - 14 * k, g = this.add.graphics().setDepth(99981), o = { t: 0 };
      const at = (t: number) => ({ x: x0 + (c.x - x0) * t, y: y0 + (cy - y0) * t - Math.sin(t * Math.PI) * 14 * k }); // cung nhẹ lên trên
      this.tweens.add({ targets: o, t: 1, duration: MERGE, ease: "Sine.easeIn", onUpdate: () => {
        const t0 = Math.max(0, o.t - 0.45), pts = Array.from({ length: 8 }, (_, j) => at(t0 + ((o.t - t0) * j) / 7)), h = pts[7];
        g.clear();
        g.lineStyle(7 * k, vc, 0.25).strokePoints(pts); g.lineStyle(3 * k, vc, 0.9).strokePoints(pts); g.lineStyle(k, 0xffffff, 0.9).strokePoints(pts);
        g.fillStyle(vc, 0.5).fillCircle(h.x, h.y, 5 * k); g.fillStyle(0xffffff, 1).fillCircle(h.x, h.y, 2.5 * k);
      }, onComplete: () => this.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() }) });
    }
    this.time.delayedCall(BLOOM, () => {
      // S3 (#566): có sheet riêng của cặp thì sheet thay đóa kính + vòng sóng và không rung màn hình (chỉ còn chớp sáng nhẹ).
      const fv = SV_OFF ? undefined : FUSION_VISUAL[f.name], sheetOn = !!fv && this.svis.cast({ tier: 3, heavy: 2, ...fv }, { x: c.x, y: c.y - 8 * SPR, ang: 0, tx: c.x, ty: c.y - 8 * SPR, mine: this.me === m.id || this.me === m.to, r: R * RX });
      // Đóa kính lưu ly: vòng trong là mảnh tam giác xen hai màu võ hồn, vòng ngoài là mảnh lam / ngọc / tím lưu ly (_luu_ly.gpl),
      // mọi mảnh viền chì sẫm, mép ngoài viền vàng kim; nở ra rồi mờ dần.
      if (!sheetOn) {
      const glass = [0x2a5ab0, 0x2a9a7a, 0x7a4ab0], N = 12, g = this.add.graphics().setDepth(99979), o = { s: 0.25, a: 1 };
      const draw = () => {
        const r1 = R * o.s, r0 = r1 * 0.45, P = (r: number, j: number) => groundAt(m.x, m.y, r, (j / N) * Math.PI * 2);
        g.clear();
        for (let j = 0; j < N; j++) {
          const inner = [c, P(r0, j), P(r0, j + 1)], outer = [P(r0, j), P(r1, j), P(r1, j + 1), P(r0, j + 1)];
          g.fillStyle(cols[j % cols.length] ?? hex(col), 0.5 * o.a).fillPoints(inner, true);
          g.fillStyle(glass[j % glass.length], 0.42 * o.a).fillPoints(outer, true);
          g.lineStyle(1.2 * k, 0x1a1020, 0.65 * o.a).strokePoints(inner, true).strokePoints(outer, true);
        }
        g.lineStyle(2 * k, 0xffe08a, o.a).strokeEllipse(c.x, c.y, 2 * RX * r1, 2 * RY * r1);
        g.fillStyle(0xe8f8ff, 0.8 * o.a).fillCircle(c.x, c.y, 3 * k);
      };
      this.tweens.add({ targets: o, s: 1, duration: 480, ease: "Back.easeOut", onUpdate: draw, onComplete: () =>
        this.tweens.add({ targets: o, a: 0, duration: 650, delay: 250, onUpdate: draw, onComplete: () => g.destroy() }) });
      this.ringFx(c, 6, R, col, 650); this.ringFx(c, 4, R * 0.7, "#ffffff", 550, 120);
      }
      // Như tuyệt kỹ: hai người dung hợp thấy banner, người khác ở gần thấy tên chiêu lớn bay lên ở điểm giữa.
      const own = this.me === m.id || this.me === m.to;
      if (own) hud.banner(f.name, "Võ Hồn Dung Hợp Kỹ");
      else {
        const t = this.add.text(c.x, cy - HEAD, `${f.icon} ${f.name}`, { fontFamily: FONT, fontSize: "12px", fontStyle: "800", color: col, stroke: "#1a1020", strokeThickness: 3, resolution: 8 })
          .setOrigin(0.5).setDepth(99990).setScale(0.5 * this.txtK);
        this.tweens.add({ targets: t, scale: 1.3 * this.txtK, y: cy - HEAD - 16 * k, duration: 500, ease: "Back.easeOut" });
        this.tweens.add({ targets: t, alpha: 0, delay: 1500, duration: 600, onComplete: () => t.destroy() });
      }
      const me = this.players.get(this.me);
      if (me && (m.id === this.me || m.to === this.me) && Math.hypot(me.wx - m.x, me.wy - m.y) < 260) { // H8: chỉ hai người dung hợp thấy chớp / rung
        const cc = Phaser.Display.Color.ValueToColor(hex(col));
        this.flash(260, cc.red, cc.green, cc.blue); if (!sheetOn) this.shake(320, 0.006);
      }
    });
  }

  /** Chiêu tiên cơ (bước 2.4): hiệu ứng chung theo hệ và chữ "Tiên cơ" bay lên trên đầu hồn sư. */
  tienCoFx(m: { id: string; he: He; col: string; x: number; y: number; r?: number; x0?: number; y0?: number; vh?: number; own?: boolean }) {
    const c = hex(m.col), gold = 0xffe08a, at = this.lifted(m.x, m.y), k = SPR;
    this.playAct(m.id, "cast");
    if (m.own) {
      // Tiên cơ riêng (bước 2.5a): hiệu ứng vùng do server gửi riêng (wave, pull, claw, buff…); ở đây thêm vòng vàng và rung nhẹ.
      this.ringFx(at, 4, 36, "#ffe08a", 420); if (m.id === this.me && !this.autoOn()) this.shake(160, 0.004);
    } else if (m.he === "cuong_cong") {
      // Nổ diện rộng: hai vòng sóng, chớp sáng trên mặt đất, quả nổ LPC (fx_no, #201; phóng nguyên lần theo bán kính), rung màn hình.
      const r = m.r ?? 56;
      this.ringFx(at, 6, r, m.col, 450); this.ringFx(at, 4, r * 0.7, "#ffe08a", 380, 80);
      const f = this.add.ellipse(at.x, at.y, 2 * RX * r, 2 * RY * r, c, 0.35).setDepth(99979);
      this.tweens.add({ targets: f, alpha: 0, duration: 320, onComplete: () => f.destroy() });
      if (!playPriv(this.svis.sheets, "fx_no_lon", { x: at.x, y: at.y - 10 * k, fitW: 1.6 * RX * r, light: m.id !== this.me })) playFx(this, "fx_no", at.x, at.y - 10 * k, Math.max(1, Math.round((1.4 * RX * r) / 32)), 99981); // #623: nổ kho riêng, thiếu thì quả nổ LPC
      if (m.id === this.me && !this.autoOn()) this.shake(260, 0.006); // #437: chỉ người tung chiêu thấy rung
    } else if (m.he === "man_cong") {
      // Lướt: vệt dài từ chỗ cũ, rồi dấu chém chữ X ở chỗ dừng (ngang ngực).
      const g = this.add.graphics().setDepth(99980), [a, b] = ptsToScreen([{ x: m.x0 ?? at.wx, y: m.y0 ?? at.wy }, { x: at.wx, y: at.wy }], 6 * k);
      g.lineStyle(6, c, 0.45).lineBetween(a.x, a.y, b.x, b.y);
      g.lineStyle(2, gold, 1).lineBetween(a.x, a.y, b.x, b.y);
      for (const q of [0.8, -0.8]) g.lineStyle(3, gold, 1).lineBetween(b.x - 14 * k * Math.cos(q), b.y - 14 * k * Math.sin(q), b.x + 14 * k * Math.cos(q), b.y + 14 * k * Math.sin(q));
      this.tweens.add({ targets: g, alpha: 0, duration: 420, delay: 80, onComplete: () => g.destroy() });
      const ang = Math.atan2(b.y - a.y, b.x - a.x), lite = m.id !== this.me; // #623: khói lướt ở chỗ cũ, bụi ở chỗ dừng
      playPriv(this.svis.sheets, "fx_khoi_luot", { x: a.x, y: a.y, ang, scale: SPR, light: lite });
      playPriv(this.svis.sheets, "fx_bui_dat", { x: b.x, y: b.y, scale: SPR, delay: 80, light: lite });
      if (m.id === this.me && !this.autoOn()) this.shake(140, 0.004);
    } else if (m.he === "khong_che") {
      // Phong tỏa: vòng thu hẹp lại và các mắt xích quay quanh trên mặt đất.
      const r = m.r ?? 64;
      this.ringFx(at, r, 6, m.col, 500);
      for (let j = 0; j < 8; j++) {
        const a = (j / 8) * Math.PI * 2, p0 = groundAt(at.wx, at.wy, r, a), p1 = groundAt(at.wx, at.wy, 10, a + 1);
        const q = this.add.rectangle(p0.x, p0.y, 4 * k, 4 * k, c).setDepth(99980);
        this.tweens.add({ targets: q, x: p1.x, y: p1.y, alpha: 0.2, duration: 500, onComplete: () => q.destroy() });
      }
    } else {
      // Hộ thể: vòng xanh lá hồi phục và hạt sáng bay lên.
      this.ringFx(at, 4, 30, "#86e0b0", 500);
      playPriv(this.svis.sheets, "fx_song_quang", { x: at.x, y: at.y - 8 * k, scale: SPR, light: m.id !== this.me }); // #623: sóng Quang kho riêng
      for (let j = 0; j < 10; j++) {
        const q = this.add.rectangle(at.x + (j - 4.5) * 3 * k, at.y - 2 * k, 2 * k, 2 * k, j % 2 ? 0x86e0b0 : gold).setDepth(99980);
        this.tweens.add({ targets: q, y: at.y - (30 + (j % 3) * 6) * k, alpha: 0, duration: 650, delay: j * 30, onComplete: () => q.destroy() });
      }
    }
    // S2 (#548): sheet riêng của tiên cơ (SKILL_VISUAL `<mã>:tc`), chồng lên hiệu ứng hiện có; mức Thấp chỉ còn 1 sheet chính.
    if (m.vh !== undefined && VOHON[m.vh]) {
      const tv = skillVisualOf(VOHON[m.vh].id, "tc");
      if (tv.sheet) this.svis.cast(tv, { x: at.x, y: at.y - 8 * SPR, ang: 0, tx: at.x, ty: at.y - 8 * SPR, mine: m.id === this.me, r: (m.r ?? tienCoOf(VOHON[m.vh].id).r ?? 56) * RX });
    }
    // Trên danh hiệu để không đè tên hồn sư.
    const name = m.vh !== undefined && VOHON[m.vh] ? tienCoOf(VOHON[m.vh].id).name : TIEN_CO[m.he]?.name ?? "";
    const v = this.players.get(m.id);
    this.floatText(v?.root.x ?? at.x, (v?.root.y ?? at.y) - HEAD - 26, `Tiên cơ · ${name}`, "#ffe08a");
  }

  /**
   * Số nổi (UI-4, #354): chữ Galmuri viền mực để đọc được trên mọi nền bản đồ. Chí mạng: to, có "!", bật lên rồi bay cao; hồi máu / khiên:
   * "+", bay chậm; miễn sát thương: chữ "Miễn"; sát thương lên chính mình: đỏ đậm, "−", rung rồi rơi xuống (khác số mình gây ra, bay lên).
   * Màu `m.c` do server chọn theo loại (chí mạng vàng, độc xanh lá, khiên đỡ lam).
   */
  damageText(x: number, y: number, m: { v: number; crit?: boolean; c: string; id?: string; by?: string; dot?: boolean; immune?: boolean; heal?: boolean; shield?: boolean }, el?: Element) {
    const plus = !!(m.heal || m.shield), self = !m.immune && !plus && m.v < 0 && m.id === this.me, k = this.txtK;
    const label = m.immune ? "Miễn" : `${plus ? "+" : self ? "−" : ""}${Math.abs(m.v).toLocaleString("vi-VN")}${m.crit ? "!" : ""}`;
    const kind = m.heal ? "heal" : m.shield ? "shield" : m.immune ? "immune" : m.crit ? "crit" : "damage" as const;
    const ds = damageStyle(el, !!m.crit, self, kind, m.dot ? m.c : undefined); // C1: self là nạn nhân; DoT giữ màu server gửi
    const t = this.add.text(x, y, label, {
      fontFamily: '"Galmuri 11", "Be Vietnam Pro", system-ui, sans-serif', fontSize: `${ds.font}px`,
      color: ds.color,
      stroke: "#" + ds.stroke.toString(16).padStart(6, "0"), strokeThickness: m.crit || self ? 4 : 3, resolution: 4,
    }).setOrigin(0.5).setDepth(self ? 100000 : 99999).setScale(k * (m.crit ? 0.6 : 0.8));
    const base = t.scaleX;
    if (self) {
      t.setScale(base * 1.5); this.tweens.add({ targets: t, scale: base, duration: 140, ease: "Quad.easeOut" });
      this.tweens.add({ targets: t, x: { from: x - 3 * k, to: x + 3 * k }, duration: 55, yoyo: true, repeat: 2 });
      this.tweens.add({ targets: t, y: y + 8 * SPR, alpha: 0, delay: 450, duration: 550, ease: "Quad.easeIn", onComplete: () => t.destroy() });
    } else if (m.crit) {
      t.setScale(base * 1.7); this.tweens.add({ targets: t, scale: base, duration: 180, ease: "Back.easeOut" });
      this.tweens.add({ targets: t, y: y - 20 * SPR, alpha: 0, delay: 500, duration: 650, onComplete: () => t.destroy() });
    } else this.tweens.add({ targets: t, y: y - (plus ? 14 : 16) * SPR, alpha: 0, delay: plus ? 600 : 350, duration: plus ? 700 : 550, onComplete: () => t.destroy() });
  }

  /** Chữ bay lên rồi mờ dần (tên hồn kỹ, tên tiên cơ); đặt trên danh hiệu để không đè tên hồn sư. */
  floatText(x: number, y: number, text: string, col: string) {
    const t = this.add.text(x, y, text, {
      fontFamily: '"Be Vietnam Pro", system-ui, sans-serif', fontSize: "8px", fontStyle: "800",
      color: col, stroke: "#000", strokeThickness: 2, resolution: 8,
    }).setOrigin(0.5).setDepth(99999).setScale(this.txtK);
    this.tweens.add({ targets: t, y: y - 14 * this.txtK, alpha: 0, delay: 500, duration: 600, onComplete: () => t.destroy() });
  }

  /**
   * Trạng thái: vòng khiên và hào quang hiệu ứng có lợi quanh hồn sư (Miễn sát thương là vòm sáng); trên hồn thú: biểu tượng
   * trạng thái dùng chung (mỗi tầng một chấm), màu phủ khi Thiêu đốt / Trúng độc / Cảm điện, dây trói dưới chân, sao choáng.
   */
  /** Bóng ngã của hồn thú lai vừa biến mất (STATIC_MOTION.die): bản sao sprite ngã quanh chân, chìm, mờ dần rồi tự hủy (không giữ trong this.beasts). */
  fadeBeastGhost(src: Phaser.GameObjects.Sprite) {
    const D = STATIC_MOTION.die, side = src.flipX ? -1 : 1;
    const g = this.add.sprite(src.x, src.y, src.texture.key, src.frame.name).setOrigin(src.originX, src.originY).setScale(src.scaleX, src.scaleY)
      .setFlipX(src.flipX).setDepth(src.depth).setRotation(src.rotation);
    this.tweens.add({ targets: g, rotation: D.turn * side, y: src.y + D.sink, scaleY: src.scaleY * (1 - D.sy), alpha: 0, duration: D.sec * 1000, ease: "Quad.easeIn", onComplete: () => g.destroy() });
  }

  drawStatus(g: Phaser.GameObjects.Graphics, st: any, time: number) {
    const q = SPR; // hình gắn với thân hồn sư (sprite cũ phóng SPR) dùng pixel cũ × q; vòng trên mặt đất theo phép chiếu (RX, RY)
    st.players.forEach((p: any, id: string) => {
      const v = this.players.get(id); if (!v || p.dead) return;
      const { x: rx, y: ry } = v.root;
      // Võ Hồn Chân Thân: vòng dưới chân, cột sáng lúc biến hình, hào quang theo bậc vòng hồn hoàn (pháp tướng tự phát sáng và phát hạt).
      this.pt.auraFx(g, id, rx, ry, p.rings.length, hex(VOHON[p.vh]?.col ?? "#ffffff"), id === this.me, time, q);
      if (p.shield > 0) { g.lineStyle(1, 0x9ad8ff, 0.55 + 0.25 * Math.sin(time / 200)); g.strokeEllipse(rx, ry - 12 * q, 26 * q, 30 * q); }
      if (p.lei > 0) {
        const k = p.lei / PHONG_LOI.max, n = 1 + Math.floor(k * 4);
        for (let j = 0; j < n; j++) {
          const a = time / 260 + j * 1.9, x = rx + Math.cos(a) * 10 * q, y = ry + (-10 + Math.sin(a) * 9) * q;
          g.lineStyle(1, j % 2 ? 0xe8f6ff : 0x5ab8ff, 0.4 + 0.5 * k); g.lineBetween(x, y, x + 2 * q, y + 3 * q); g.lineBetween(x + 2 * q, y + 3 * q, x, y + 5 * q);
        }
      }
      this.attachedStatusFx(g, rx, ry, p.st, time, id === this.me, q);
      if (p.buff & buffBit("inv")) {
        g.fillStyle(0xfff2b0, 0.18 + 0.08 * Math.sin(time / 120)).fillEllipse(rx, ry - 12 * q, 32 * q, 36 * q);
        g.lineStyle(2, 0xfff2b0, 0.9).strokeEllipse(rx, ry - 12 * q, 32 * q, 36 * q);
      }
      // Trạng thái do chiêu báo trước của hồn thú gây (3.5): dây trói dưới chân, sao choáng, khối băng (Đóng băng) và tim hồng (Mê hoặc)
      // (#116), biểu tượng trên danh hiệu (Che tầm nhìn #175: giọt mực; màn mực chỉ người trúng thấy, InkVeil).
      if (p.st) {
        const ph = (x: (typeof PLAYER_STATUS)[number]) => (p.st & statusBit(x)) !== 0;
        if (ph("root")) this.rootSnare(g, rx, ry, time, q, 18);
        const icons = STATUS_ICONS.filter((x) => PLAYER_STATUS.includes(x) && ph(x));
        this.statusIcons(g, rx, ry - HEAD - 24 * this.txtK, icons, { chill: p.han ?? 0 }); // tầng Hàn (#163): chấm dưới bông tuyết
        if (ph("freeze")) this.iceBlock(g, rx, ry, time);
        if (ph("stun")) this.stunStars(g, rx, ry - 26 * q, time);
        if (ph("charm")) this.charmHearts(g, rx, ry - 26 * q, time);
      }
      let k = 0;
      for (const b of BUFF_IDS) {
        if (b === "inv" || !(p.buff & buffBit(b))) continue;
        if (b === "phoenix") {
          // Lãnh vực phượng hoàng: vòng lửa bán kính phoenixFieldR (thế giới) trên mặt đất đi theo hồn sư (rộng hơn khi Tà Hỏa Phượng
          // Hoàng Chân Thân, 8.1b), tàn lửa xoay quanh mép.
          const c = hex(BUFFS.phoenix.col), R = phoenixFieldR(VOHON[p.vh]?.id ?? "", p.ava > 0);
          g.fillStyle(c, 0.07).fillEllipse(rx, ry, 2 * RX * R, 2 * RY * R);
          g.lineStyle(1, c, 0.45 + 0.2 * Math.sin(time / 180)).strokeEllipse(rx, ry, 2 * RX * R, 2 * RY * R);
          for (let j = 0; j < 6; j++) { const a = time / 900 + (j / 6) * Math.PI * 2; g.fillStyle(j % 2 ? 0xffe08a : c, 0.9).fillRect(rx + Math.cos(a) * RX * R - q, ry + Math.sin(a) * RY * R - q, 2 * q, 2 * q); }
          continue;
        }
        const a = time / 400 + k * 1.6, c = hex(BUFFS[b].col); k++;
        g.fillStyle(c, 0.9).fillRect(rx + Math.cos(a) * 11 * q - q, ry + (-8 + Math.sin(a) * 4) * q - q, 2 * q, 2 * q);
        g.lineStyle(1, c, 0.35).strokeEllipse(rx, ry - q, (18 + k * 3) * q, (6 + k) * q);
      }
    });
    st.beasts.forEach((b: any, id: string) => {
      const s = this.beasts.get(id); if (!s) return;
      const has = (x: keyof typeof STATUS) => (b.st & statusBit(x)) !== 0, size = TIERS[b.tier].size * q, top = beastTop(s, b.tier);
      // Màu phủ lên hồn thú: Cảm điện nháy lam, Thiêu đốt cam, Trúng độc lục. Hết trạng thái thì bỏ màu đã phủ
      // (sprite theo loài tự đặt lại màu hung hăng mỗi khung trong syncBeastSprite).
      const tint = has("shock") && Math.floor(time / 150) % 3 === 0 ? 0x7fd0ff : has("burn") ? (Math.floor(time / 200) % 2 ? 0xffa060 : 0xff7a2a) : has("poison") ? 0x8ef08a : 0;
      if (tint) { s.setTint(tint); s.setData("stTint", true); } else if (s.getData("stTint")) { s.clearTint(); s.setData("stTint", false); }
      this.attachedStatusFx(g, s.x, s.y, b.st, time, false, q);
      if (has("root")) this.rootSnare(g, s.x, s.y, time, q, size / q + 8);
      // Biểu tượng trạng thái hàng ngang trên thanh máu: hình riêng mỗi loại, số tầng là chấm nhỏ bên dưới.
      const icons = STATUS_ICONS.filter(has);
      this.statusIcons(g, s.x, top - 13, icons, { burn: b.burn, poison: b.poison, armor: b.armor, allure: b.allure, lock: b.lock });
      // Mê hoặc (2.5c): tim hồng xoay trên đầu, hồn thú đi lung tung. Tim và sao choáng gắn với thân nên phóng SPR như sprite.
      const headY = top - 6 * q - (icons.length ? 9 : 0);
      if (has("charm")) this.charmHearts(g, s.x, headY, time);
      if (has("stun")) this.stunStars(g, s.x, headY, time);
      if (has("freeze")) this.iceBlock(g, s.x, s.y, time);
    });
  }

  /** Hình trạng thái nhỏ bám thân, lặp theo đồng hồ client; không đổi state và không rung màn. */
  attachedStatusFx(g: Phaser.GameObjects.Graphics, cx: number, feet: number, bits: number, time: number, mine: boolean, q: number) {
    const has = (x: keyof typeof STATUS) => (bits & statusBit(x)) !== 0;
    const moving = !fxPrefs.reduce && fxLevel() !== "low";
    const alpha = mine ? 0.9 : 0.55, phase = moving ? time / 520 : 0;
    if (has("burn")) {
      const n = fxLevel() === "high" ? 3 : 2;
      for (let j = 0; j < n; j++) {
        const a = phase + j * 2.1, x = cx + Math.cos(a) * 8 * q, y = feet - (17 + (moving ? Math.sin(a * 1.7) * 2 : 0)) * q;
        g.fillStyle(0x1a1020, alpha).fillTriangle(x - 3 * q, y + 4 * q, x + 3 * q, y + 4 * q, x, y - 3 * q);
        g.fillStyle(0xffa044, alpha).fillTriangle(x - 2 * q, y + 3 * q, x + 2 * q, y + 3 * q, x, y - 2 * q);
      }
    }
    if (has("shock")) {
      const x = cx + Math.sin(phase * 1.7) * 7 * q, y = feet - 20 * q;
      g.lineStyle(1, 0x1a1020, alpha).lineBetween(x - 3 * q, y, x + q, y + 3 * q).lineBetween(x + q, y + 3 * q, x - q, y + 6 * q);
      g.lineStyle(1, 0xe8f6ff, alpha).lineBetween(x - 2 * q, y, x + q, y + 3 * q).lineBetween(x + q, y + 3 * q, x, y + 6 * q);
    }
    if (has("poison")) {
      const n = fxLevel() === "high" ? 3 : 2;
      for (let j = 0; j < n; j++) {
        const a = -phase * 0.7 + j * 2.4, x = cx + Math.cos(a) * 9 * q, y = feet - (8 + (j % 2) * 7) * q - (moving ? (time / 180 + j * 3) % 5 : 0) * q;
        g.fillStyle(0x1a1020, alpha).fillCircle(x, y, 2.5 * q); g.fillStyle(0x8ef08a, alpha).fillCircle(x, y, 1.5 * q);
      }
    }
  }

  /** Tim hồng xoay quanh đầu: Mê hoặc (hồn thú 2.5c, hồn sư #116). */
  charmHearts(g: Phaser.GameObjects.Graphics, cx: number, y: number, time: number) {
    const q = SPR;
    for (let k = 0; k < 3; k++) {
      const a = time / 220 + k * 2.1, x = cx + Math.cos(a) * 8 * q, sy = y + Math.sin(a) * 2.5 * q;
      g.fillStyle(hex(STATUS.charm.col), 1).fillCircle(x - q, sy - q, 1.3 * q).fillCircle(x + q, sy - q, 1.3 * q)
        .fillTriangle(x - 2.3 * q, sy - 0.6 * q, x + 2.3 * q, sy - 0.6 * q, x, sy + 2 * q);
    }
  }

  /** Băng phong C1: sáu mảnh tinh thể lệch nhịp và vết nứt, thay khối chữ nhật cũ. */
  iceBlock(g: Phaser.GameObjects.Graphics, cx: number, feet: number, time: number) {
    const q = SPR, c = hex(STATUS.freeze.col), pulse = 0.75 + 0.25 * Math.sin(time / 240), y = feet - 15 * q;
    for (let j = 0; j < 6; j++) {
      const a = time / 900 + j * Math.PI / 3, x = cx + Math.cos(a) * 12 * q, yy = y + Math.sin(a * 1.7) * 7 * q, r = (3 + (j % 2)) * q;
      g.fillStyle(0x1a1020, 0.7 * pulse).fillPoints([{ x, y: yy - r }, { x: x + r * 0.65, y: yy }, { x, y: yy + r }, { x: x - r * 0.65, y: yy }], true);
      g.fillStyle(c, 0.55 * pulse).fillPoints([{ x, y: yy - r * 0.7 }, { x: x + r * 0.4, y: yy }, { x, y: yy + r * 0.7 }, { x: x - r * 0.4, y: yy }], true);
    }
    g.lineStyle(1, c, 0.55 * pulse).strokeEllipse(cx, feet - 12 * q, 25 * q, 30 * q);
    g.lineStyle(1, 0xe8f8ff, 0.8 * pulse);
    for (const d of [-7, 0, 6]) { g.lineBetween(cx + d * q, feet - (24 + Math.abs(d)) * q, cx + (d + 3) * q, feet - (16 - Math.abs(d) * 0.3) * q); }
  }

  /** Choáng C1: tia zigzag lệch nhau và vòng nhịp ngắn, khác hàng sao cũ. */
  stunStars(g: Phaser.GameObjects.Graphics, cx: number, y: number, time: number) {
    const q = SPR, pulse = 0.6 + 0.4 * Math.sin(time / 110);
    g.lineStyle(1, 0xffd66e, 0.45 * pulse).strokeEllipse(cx, y, (18 + pulse * 4) * q, 7 * q);
    for (let k = 0; k < 3; k++) {
      const a = time / 260 + k * 2.1, x = cx + Math.cos(a) * 9 * q, sy = y + Math.sin(a) * 3 * q;
      g.lineStyle(2, 0x1a1020, 0.95).lineBetween(x - 3 * q, sy - 4 * q, x + q, sy).lineBetween(x + q, sy, x - 2 * q, sy + 4 * q);
      g.lineStyle(1, 0xffd66e, 1).lineBetween(x - 2 * q, sy - 3 * q, x, sy).lineBetween(x, sy, x - q, sy + 3 * q);
    }
  }

  /** Trói C1: vòng khóa co giãn với nút dây, thay vòng + bốn đoạn thẳng cũ. */
  rootSnare(g: Phaser.GameObjects.Graphics, cx: number, feet: number, time: number, q: number, width: number) {
    const c = hex(STATUS.root.col), pulse = 0.8 + 0.2 * Math.sin(time / 280), diameter = rootSnareDiameter(width, q);
    g.lineStyle(1, 0x1a1020, 0.85).strokeEllipse(cx, feet, diameter + 3 * q, 6 * q);
    g.lineStyle(1, c, pulse).strokeEllipse(cx, feet, diameter, 4 * q);
    for (let j = 0; j < 5; j++) {
      const x = cx - diameter * 0.75 + j * diameter * 0.38, lean = Math.sin(time / 300 + j) * 2 * q;
      g.lineStyle(1, 0x1a1020, 0.9).lineBetween(x, feet + q, x + lean, feet - (4 + (j % 2) * 2) * q);
      g.lineStyle(1, c, pulse).lineBetween(x + q, feet, x + lean, feet - (3 + (j % 2) * 2) * q);
      g.fillStyle(c, pulse).fillRect(x - q, feet - (5 + (j % 2) * 2) * q, 2 * q, 2 * q);
    }
  }

  /** Hàng biểu tượng trạng thái căn giữa `cx`, mép trên `y0`: hình riêng mỗi loại, số tầng là chấm nhỏ bên dưới. */
  statusIcons(g: Phaser.GameObjects.Graphics, cx: number, y0: number, icons: readonly string[], stacks: Record<string, number>) {
    let x = cx - (icons.length * 7 - 2) / 2;
    for (const k of icons) {
      const c = hex(STATUS[k as keyof typeof STATUS].col);
      g.fillStyle(0x1a1020, 0.85).fillRect(x - 1, y0 - 1, 7, 7);
      g.fillStyle(c, 1);
      if (k === "burn") g.fillTriangle(x, y0 + 5, x + 5, y0 + 5, x + 2.5, y0);
      else if (k === "shock") { g.lineStyle(1, c, 1); g.lineBetween(x + 3, y0, x + 1, y0 + 3); g.lineBetween(x + 1, y0 + 3, x + 4, y0 + 2); g.lineBetween(x + 4, y0 + 2, x + 2, y0 + 5); }
      else if (k === "poison") { g.fillCircle(x + 2.5, y0 + 3.2, 2); g.fillRect(x + 2, y0, 1, 2); }
      else if (k === "vuln") g.fillTriangle(x, y0 + 1, x + 5, y0 + 1, x + 2.5, y0 + 5);
      else if (k === "armor") { g.fillRect(x, y0, 5, 3); g.fillRect(x + 1, y0 + 3, 3, 2); g.fillStyle(0x1a1020, 1).fillRect(x + 2, y0, 1, 4); }
      else if (k === "allure") { g.fillCircle(x + 1.5, y0 + 1.8, 1.4); g.fillCircle(x + 3.5, y0 + 1.8, 1.4); g.fillTriangle(x, y0 + 2.3, x + 5, y0 + 2.3, x + 2.5, y0 + 5); }
      else if (k === "lock") { g.lineStyle(1, c, 1); g.strokeRect(x + 0.5, y0 + 2.5, 4, 2.5); g.strokeCircle(x + 2.5, y0 + 2, 1.5); }
      else if (k === "slow") { g.fillRect(x, y0 + 4, 5, 1); g.fillTriangle(x + 1, y0, x + 4, y0, x + 2.5, y0 + 3); }
      else if (k === "chill") { g.lineStyle(1, c, 1); g.lineBetween(x + 2.5, y0, x + 2.5, y0 + 5); g.lineBetween(x, y0 + 1.2, x + 5, y0 + 3.8); g.lineBetween(x, y0 + 3.8, x + 5, y0 + 1.2); }
      else if (k === "flood") { g.lineStyle(1, c, 1); for (const dy of [1, 4]) { g.lineBetween(x, y0 + dy + 0.5, x + 1.7, y0 + dy - 0.5); g.lineBetween(x + 1.7, y0 + dy - 0.5, x + 3.3, y0 + dy + 0.5); g.lineBetween(x + 3.3, y0 + dy + 0.5, x + 5, y0 + dy - 0.5); } } // #174: hai làn sóng
      else if (k === "ink") { g.fillTriangle(x + 2.5, y0, x + 0.6, y0 + 3, x + 4.4, y0 + 3); g.fillCircle(x + 2.5, y0 + 3.3, 1.9); g.fillRect(x + 4.5, y0 + 0.5, 1, 1); } // giọt mực (#175)
      else { g.lineStyle(1, c, 1); g.strokeCircle(x + 2.5, y0 + 2.5, 2.2); g.lineBetween(x + 1, y0 + 4, x + 4, y0 + 1); }
      for (let n = 0; n < (stacks[k] ?? 0) && n < 5; n++) g.fillStyle(c, 1).fillRect(x + n * 1.2, y0 + 6.5, 1, 1);
      x += 7;
    }
  }

  // ---------- Bản đồ nhỏ ----------
  buildMinimap(map: Phaser.Tilemaps.Tilemap) {
    const base = document.createElement("canvas"); base.width = map.width; base.height = map.height;
    const b = base.getContext("2d")!;
    const colorOf: Record<number, string> = { 1: "#5a9440", 2: "#467e38", 3: "#335f35", 4: "#27453a", 5: "#5a9440", 6: "#467e38", 7: "#a08a63", 8: "#7d6b55", 9: "#2d6a96", 10: "#d8b678",
      13: "#a39f94", 14: "#8f3b2e", 15: "#d8c8a2", 16: "#c9b84a",
      // BĐ6c (Cực Bắc): tuyết, tuyết sâu, mặt băng, khe băng, lối tuyết, thông tuyết, băng tinh
      25: "#f4f8ff", 26: "#c0cce0", 27: "#5a9cc9", 28: "#1f4a6b", 29: "#8a87a0", 30: "#1e4a2a", 32: "#7fd0ff",
      33: "#e8d49a", 34: "#4fa8b8", 35: "#173f63", 36: "#6a6258" }; // BĐ6d: cát, rạn nông, biển sâu, đá ngầm
    // Màu riêng từng bản đồ, đè `colorOf` theo lớp: cùng gid mỗi bản đồ ánh xạ sang ô / vật khác (shared/assets/iso/tiles.json).
    const own = MINI_COLORS[this.mapId], groundOf = { ...colorOf, ...own?.ground }, objOf = { ...colorOf, ...own?.obj };
    const ground = map.getLayer("ground")!.data, trees = map.getLayer("trees")!.data;
    for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
      const t = trees[y][x].index, g = ground[y][x].index;
      b.fillStyle = t >= 17 && t <= 20 ? ["#24612a", "#1d5024", "#163a22", "#1f2240"][t - 17] : t > 0 ? objOf[t] ?? "#d8b678" : groundOf[g] ?? "#335f35";
      b.fillRect(x, y, 1, 1);
    }
    b.fillStyle = "#86e0b0";
    for (const r of this.portals) b.fillRect(Math.floor(r.x / TILE), Math.floor(r.y / TILE), Math.max(1, Math.round(r.w / TILE)), Math.max(1, Math.round(r.h / TILE)));
    b.fillStyle = "#8fe0ff"; // truyền tống trận (11.2)
    for (const w of this.waypoints) b.fillRect(Math.floor(w.x / TILE), Math.floor(w.y / TILE), Math.max(1, Math.round(w.w / TILE)), Math.max(1, Math.round(w.h / TILE)));
    radar().setBase(base, 1, this.mapId); fog().setMap(this.mapId, map.width, map.height); mapview().reset(); mapview().setMap(this.mapId, map.width, map.height); this.initFlag();
    // Nền ảnh R1 (shared/assets/mini); lỗi tải thì giữ nền vẽ từ ô ở trên. Chỉ nhận khi radar còn ở bản đồ này.
    const mapId = this.mapId, img = new Image();
    img.onload = () => { if (radar().baseKey === mapId) radar().setBase(img, MINI_BASE.px, mapId); };
    img.src = assetUrl(`/${MINI_BASE.dir}/${mapId}.png`);
  }

  /** Gom chấm cho radar tròn (client/src/radar.ts, vẽ RADAR.hz lần mỗi giây; chưa tới lượt thì thoát ngay). Thực thể ở xa theo tin `mini`, ở gần theo state (11.4). */
  drawMinimap() {
    const R = radar(), V = mapview(), now = performance.now(), dueR = R.due(now), dueV = V.due(now); if (!dueR && !dueV) return;
    const st = this.room.state, me = st.players.get(this.me); if (!me) return;
    const mx = me.x / TILE, my = me.y / TILE;
    const info = `${MAPS[this.mapId]?.name ?? this.mapId} · ${Math.floor(mx)}, ${Math.floor(my)}${st.channel ? ` · Kênh ${st.channel}` : ""}`;
    // Cùng một bộ chấm cho radar và bản đồ khu vực (mỗi nơi theo nhịp RADAR.hz riêng).
    if (dueR) { R.begin(mx, my, now); this.collectDots(R, me, mx, my); this.collectRally(R); this.collectFlag(R, true); this.collectAutoPath(R); R.end(info); }
    if (dueV) { V.begin(mx, my, now, this.mapLabels(), info); this.collectDots(V, me, mx, my); this.collectRally(V); this.collectFlag(V, false); V.end(); }
  }

  /** Gom chấm và khung vùng vào `R` (radar hoặc bản đồ khu vực): thực thể ở xa theo tin `mini`, ở gần theo state (11.4). */
  collectDots(R: DotSink, me: any, mx: number, my: number) {
    const st = this.room.state, near = SYNC_VIEW.r / TILE, far = this.far; // ngưỡng vào tầm state là SYNC_VIEW.r (interest.ts), không phải .out
    const isNear = (x: number, y: number) => Math.hypot(x - mx, y - my) < near; // trong vùng state đã có, khỏi vẽ trùng bản `mini` chậm 1 giây
    // Sương mù (R8): hồn thú thường, đồ rơi và người lạ ở chỗ chưa khám phá thì không hiện; tinh anh, boss, đồng đội, cổng, NPC, truyền tống, mục tiêu nhiệm vụ vẫn hiện.
    const seen = (x: number, y: number) => F.explored(x, y), F = fog();
    for (let i = 0; i + 2 < far.d.length; i += 3) if (!isNear(far.d[i], far.d[i + 1]) && seen(far.d[i], far.d[i + 1])) R.dot(far.d[i + 2] >= 3 ? "quest" : "beast", far.d[i] + 0.5, far.d[i + 1] + 0.5, "Đồ rơi", TIERS[far.d[i + 2]]?.glow ?? "#ffffff", "", "drop");
    for (let i = 0; i + 2 < far.b.length; i += 3) if (!isNear(far.b[i], far.b[i + 1]) && seen(far.b[i], far.b[i + 1])) R.dot("beast", far.b[i] + 0.5, far.b[i + 1] + 0.5, "Hồn thú nghìn năm", far.b[i + 2] === 4 ? "#ff3b3b" : "#8a6bff");
    st.drops.forEach((d: any) => seen(d.x / TILE, d.y / TILE) && R.dot(d.tier >= 3 ? "quest" : "beast", d.x / TILE, d.y / TILE, "Đồ rơi", TIERS[d.tier].glow, "", "drop"));
    st.beasts.forEach((b: any) => {
      const x = b.x / TILE, y = b.y / TILE;
      if (b.rank >= 2) R.dot("boss", x, y, beastName(b.rank, b.species), BOSSES[b.species]?.aura ?? "");
      else if (b.rank === 1) R.dot("elite", x, y, beastName(1, b.species), BOSSES[b.species]?.aura ?? "#ffffff");
      else if (seen(x, y)) R.dot("beast", x, y, BEASTS[b.species]?.name ?? "Hồn thú", TIERS[b.tier]?.glow ?? "#ffffff");
    });
    // Hang thú vương (BĐ5): khung đỏ sẫm.
    if (this.lair && F.explored((this.lair.x + this.lair.w / 2) / TILE, (this.lair.y + this.lair.h / 2) / TILE)) R.rect(this.lair.x / TILE, this.lair.y / TILE, this.lair.w / TILE, this.lair.h / TILE, "#a0303c");
    // NPC, cổng, truyền tống trận (11.2).
    for (const n of this.npcs) R.dot("poi", n.x / TILE, n.y / TILE, n.def?.name ?? n.id);
    for (const r of this.portals) R.dot("poi", (r.x + r.w / 2) / TILE, (r.y + r.h / 2) / TILE, `Cổng → ${MAPS[r.to]?.name ?? r.to}`, "#86e0b0");
    for (const w of this.waypoints) R.dot("poi", (w.x + w.w / 2) / TILE, (w.y + w.h / 2) / TILE, w.label || "Truyền tống trận", "#8fe0ff");
    // Mục tiêu nhiệm vụ (tân thủ, khảo hạch hằng ngày): khung vùng săn, cổng đi tiếp, NPC.
    const qt = this.questTargets(me.level ?? 1);
    for (const z of qt.zones) { R.rect(z.x / TILE, z.y / TILE, Math.max(1, z.w / TILE), Math.max(1, z.h / TILE), "#ffd84a"); R.dot("quest", (z.x + z.w / 2) / TILE, (z.y + z.h / 2) / TILE, "Vùng săn nhiệm vụ"); }
    for (const r of qt.portals) R.dot("quest", (r.x + r.w / 2) / TILE, (r.y + r.h / 2) / TILE, `Đi tiếp: ${MAPS[(r as { to?: string }).to ?? ""]?.name ?? "cổng"}`);
    for (const n of qt.npcs) R.dot("quest", n.x / TILE, n.y / TILE, "Mục tiêu nhiệm vụ");
    // Hồn sư: đồng đội tổ đội và cùng tông môn (mức 5), người khác (mức 2). Ở xa theo tin `mini`.
    const mates = new Map((this.party?.members ?? []).filter((m) => !m.me && m.sid).map((m) => [m.sid, m.name]));
    const tongCol = (me.tong ?? 0) > 0 ? RADAR.tongCol : "";
    st.players.forEach((p: any, id: string) => {
      if (id === this.me) return;
      const x = p.x / TILE, y = p.y / TILE, mate = mates.has(id), clan = (me.tong ?? 0) > 0 && p.tong === me.tong;
      if (mate || clan) R.dot("ally", x, y, p.name, "", clan ? tongCol : ""); else if (seen(x, y)) R.dot("player", x, y, p.name);
    });
    for (let i = 0; i + 2 < far.p.length; i += 3) {
      const id = String(far.p[i]); if (id === this.me || st.players.has(id)) continue;
      const x = Number(far.p[i + 1]) + 0.5, y = Number(far.p[i + 2]) + 0.5, mn = mates.get(id);
      if (mn !== undefined) R.dot("ally", x, y, mn); else if (seen(x, y)) R.dot("player", x, y, "Hồn sư");
    }
  }

  /**
   * Nhãn tĩnh của bản đồ khu vực (phím N), dựng từ object Tiled đã đọc ở `create`: vùng săn (kèm niên hạn và cấp), vùng an toàn, hang
   * thú vương, NPC, cổng ghi bản đồ đích, truyền tống trận (đã mở / chưa mở). Mảng dựng lại mỗi lượt gom của bản đồ đang mở (vài chục
   * phần tử), nên chỉ tính khi đang mở.
   */
  mapLabels(): MapLabel[] {
    const c = (r: Rect) => ({ x: (r.x + r.w / 2) / TILE, y: (r.y + r.h / 2) / TILE }), sz = (r: Rect) => ({ w: r.w / TILE, h: r.h / TILE });
    const out: MapLabel[] = [];
    for (const z of this.zones) out.push({ k: "zone", ...c(z), ...sz(z), text: z.name, sub: z.hint, brief: z.hint.split(" · ").filter((t) => t.startsWith("cấp")).join("") });
    for (const z of this.safes) out.push({ k: "safe", ...c(z), ...sz(z), text: z.name || "Vùng an toàn", sub: "" });
    if (this.lair) out.push({ k: "lair", ...c(this.lair), ...sz(this.lair), text: "Hang thú vương", sub: "" });
    for (const n of this.npcs) out.push({ k: "npc", x: n.x / TILE, y: n.y / TILE, text: n.def?.name ?? n.id, sub: n.def?.title ?? "" });
    for (const r of this.portals) out.push({ k: "gate", ...c(r), text: `Cổng → ${MAPS[r.to]?.name ?? r.to}`, sub: "" });
    for (const w of this.waypoints) { const open = this.wpOpen.has(w.key); out.push({ k: "wp", ...c(w), text: w.label || "Truyền tống trận", sub: open ? "đã mở" : "chưa mở", open }); }
    return out;
  }

  /**
   * Chỉ đường nhiệm vụ trên bản đồ nhỏ (mọi chuỗi cố định đang theo dõi, hud.questTracked: tân thủ, chương 2…, và khảo hạch hằng
   * ngày; #190): mục tiêu ở bản đồ này thì chấm NPC / khung vùng
   * săn; ở bản đồ khác thì tô cổng đi tới bản đồ kề theo `route` của tin "daily" (server tính đường ít lần đi cổng nhất). Bài chờ trả
   * hoặc chưa nhận chỉ về NPC giao bài; mục tiêu hạ hồn thú hợp cấp (`fit`) và nộp hồn hạch / hồn hoàn chỉ về vùng săn hợp cấp
   * (fitMaps, fitBeast theo cấp võ hồn ra trận). Mục tiêu tinh anh (`elite`) chấm các chỗ sinh tinh anh của bản đồ này, không có thì
   * về bản đồ săn hợp cấp; thú vương (`king`) / boss thế giới (`world`) khung hang của bản đồ này, không có thì về các bản đồ có thú
   * vương / bản đồ boss (ưu tiên hợp cấp); mục tiêu ghi `map` (chỉ tính ở bản đồ đó) thì ở bản đồ khác chỉ đường tới đúng bản đồ đó.
   * Tính lại khi tiến độ hoặc cấp đổi.
   */
  questTargets(level: number) {
    const fixed = hud.questTracked(), daily = hud.dailyList();
    const key = [...[...fixed, ...daily].map((q) => q.chain + q.step + q.status + q.prog.join()), level, this.daily?.route ? 1 : 0].join("|");
    if (this.qt.key === key) return this.qt;
    const npcs: Pt[] = [], zones = new Set<Zone>(), maps = new Set<string>(), route = this.daily?.route ?? {};
    const toNpc = (id: string, mapId: string) => {
      if (mapId !== this.mapId) { maps.add(mapId); return; }
      const n = this.npcs.find((x) => x.id === id); if (n) npcs.push({ x: n.x, y: n.y });
    };
    const hunt = (mapId?: string, zone?: string, fit = false) => {
      const at = mapId ? [mapId] : fitMaps(level);
      if (!at.includes(this.mapId)) { at.forEach((m) => maps.add(m)); return; }
      for (const z of this.zones) if ((!zone || z.name === zone) && (!fit || !z.years || fitBeast(level, z.years[1]))) zones.add(z);
    };
    const goal = (g: QuestGoal, home: string) => {
      if (g.near) return toNpc(g.near, home);
      if (g.k === "talk" && g.npc) return toNpc(g.npc, g.map ?? home);
      if (g.k === "kill") return hunt(g.map, g.zone, !!g.fit);
      if (g.k === "map" && g.map) return void (g.map !== this.mapId && maps.add(g.map));
      if (g.k === "give" && (g.item === CORE_ITEM || g.item === RING_ITEM)) return hunt(undefined, undefined, true);
      // Gia nhập tông (#286): chấm các sứ giả tông (TONG_MON.npc) ở bản đồ của họ; mục tiêu không ghi `map` vì sự kiện `tong` không có bản đồ.
      if (g.k === "tong") return TONG_MON.forEach((t) => toNpc(t.npc, TONG_DAILY.map));
      // Tinh anh / thú vương / boss thế giới: mục tiêu có `map` (chương 3: Hải Thần Đảo) chỉ tính ở đúng bản đồ đó (server lọc theo
      // bản đồ, #284), nên ở bản đồ khác thì chỉ đường tới đó; đứng đúng bản đồ (hoặc mục tiêu không ghi bản đồ) mới chấm chỗ sinh / khung hang.
      if (g.k === "elite" || g.k === "king" || g.k === "world") {
        if (g.map && g.map !== this.mapId) return void maps.add(g.map);
        if (g.k === "elite") {
          if (this.eliteSpots.length) return void npcs.push(...this.eliteSpots);
          if (!g.map) fitMaps(level).forEach((m) => maps.add(m));
          return;
        }
        const here = g.k === "king" ? !!MAPS[this.mapId]?.king : MAPS[this.mapId]?.kind === "boss";
        if (this.lair && here) return void zones.add({ ...this.lair, name: "", hint: "" });
        if (g.map) return;
        const all = Object.keys(MAPS).filter((m) => (g.k === "king" ? !!MAPS[m].king : MAPS[m].kind === "boss")), fit = all.filter((m) => fitMaps(level).includes(m));
        return void (fit.length ? fit : all).forEach((m) => m !== this.mapId && maps.add(m));
      }
    };
    const one = (q: QuestProgress & { status: QuestStatus }) => {
      const c = questChain(q.chain), s = c?.steps[q.step]; if (!c || !s || q.status === "done") return;
      if (q.status !== "active") return toNpc(c.giver, c.map);
      s.goals.forEach((g, i) => { if ((q.prog[i] ?? 0) < g.n) goal(g, c.map); });
    };
    fixed.forEach(one);
    daily.forEach(one);
    // Bản đồ khác: tô cổng đi tới bản đồ kề trên đường tới đó (một bản đồ đích có nhiều cổng thì tô cả).
    const next = new Set([...maps].map((m) => route[m]).filter(Boolean));
    this.qt = { key, npcs, zones: [...zones], portals: this.portals.filter((r) => next.has(r.to)) };
    return this.qt;
  }

  // ---------- Đồng bộ trạng thái mỗi khung hình ----------
  update(time: number, delta: number) {
    const dt = delta / 1000, st = this.room.state; if (!st?.players) return;
    fxGov.feed(delta, fxPrefs.level);
    this.endHitstop(performance.now()); this.fxp.update(this.hitstopEnd ? dt * 0.06 : dt); this.svis.sheets.update(this.hitstopEnd ? delta * 0.06 : delta);
    this.sendInput();
    this.crowd?.update(dt);
    this.lpc.step();
    const lerp = Math.min(1, dt * 14);
    const step = Math.floor(time / 125) % 2;

    // người chơi: nội suy / dự đoán trong tọa độ thế giới, rồi đặt hình ở hình chiếu (10.1); độ sâu = tung độ màn hình của chân.
    const seenP = new Set<string>();
    st.players.forEach((p: any, id: string) => {
      seenP.add(id);
      let v = this.players.get(id);
      if (!v) {
        // Gốc và hệ số phóng từng lớp đặt theo texture (fitHonsuLayer) mỗi khi đổi texture (thân LPC 64×64, phụ thể 96×96 hoặc 48×48 vẽ bằng code).
        const layer = () => this.make.sprite({ key: "hs_shadow" }, false);
        const vb = layer(), body = layer(), vf = layer();
        for (const s of [vb, body, vf]) this.light.entity(s);
        const ringsB = this.make.container({}, false), ringsF = this.make.container({}, false), at = W2S(p.x, p.y);
        const root = this.add.container(at.x, at.y, [this.make.image({ key: "hs_shadow" }, false), ringsB, vb, body, vf, ringsF]).setScale(SPR);
        const label = this.add.text(at.x, at.y - HEAD, p.name, {
          fontFamily: '"Be Vietnam Pro", system-ui, sans-serif', fontSize: "7px", fontStyle: "600",
          color: id === this.me ? "#ffe9a0" : "#ffffff", stroke: "#000", strokeThickness: 2, resolution: 8,
        }).setOrigin(0.5, 1).setDepth(99985);
        const title = this.add.text(at.x, at.y - HEAD - 8, "", {
          fontFamily: '"Be Vietnam Pro", system-ui, sans-serif', fontSize: "6px", fontStyle: "700",
          color: "#f2c84b", stroke: "#000", strokeThickness: 2, resolution: 8,
        }).setOrigin(0.5, 1).setDepth(99985);
        const tongT = this.add.text(at.x, at.y - HEAD, "", {
          fontFamily: '"Be Vietnam Pro", system-ui, sans-serif', fontSize: "5.5px", fontStyle: "700",
          color: "#ffffff", stroke: "#000", strokeThickness: 2, resolution: 8,
        }).setOrigin(0.5, 1).setDepth(99985);
        v = { root, wx: p.x, wy: p.y, face: "s", body, vb, vf, ringsB, ringsF, label, title, tongT, looks: "", vh: -1, rings: "", playing: "", lpcKey: "", lpcFace: { shown: null, pend: null },
          act: null, hurtT: -1e9, lit: null, halo: null, ringY: [], fly: null, lock: null };
        this.players.set(id, v);
        if (id === this.me) this.cameras.main.startFollow(root, true, 0.2, 0.2);
      }
      const { root, label, title, tongT } = v;
      const mine = id === this.me && this.pred;
      // Hướng nhìn 8 phía trên màn hình theo hướng đi (thế giới); thân LPC chỉ có 4 hướng nên hiện hướng gần nhất (lpcFace).
      // Chính mình khi dự đoán: theo phím ngay; người khác: theo hướng đang trượt tới vị trí server, đứng yên thì theo `dir` của server.
      // Mê hoặc (#116): server tự đi (spd đồng bộ 0 để không dự đoán theo phím) nên chính mình cũng đi / quay mặt theo vị trí server.
      // Đang tự săn (Auto 1): server lái hồn sư, không có phím đang giữ, nên cũng đi / quay mặt theo chuyển động như người khác.
      const charmed = (p.st & statusBit("charm")) !== 0, self = mine && !charmed && !p.auto;
      const walk = self ? this.pred!.walking(p, this.dir) : p.moving;
      let d8 = self ? (walk ? dir8(this.dir.x, this.dir.y) : null) : p.moving ? (Math.hypot(p.x - v.wx, p.y - v.wy) > 0.3 ? dir8(p.x - v.wx, p.y - v.wy) : null) : null;
      if (!d8 && !walk) { const f = DIR4_VEC[self ? this.pred!.look(p, this.dir) : p.dir] ?? DIR4_VEC[0]; d8 = dir8(f.x, f.y); }
      else if (self && walk) this.pred!.look(p, this.dir); // giữ hướng vừa đi trong bộ dự đoán (dùng khi vừa nhả phím)
      const locked = !!v.lock && time < v.lock.until;
      if (locked) v.face = v.lock!.face; // đang đánh: quay về phía đòn đánh
      else if (d8) { v.lock = null; v.face = d8; }
      if (v.lpcKey) this.lpcFace(v, locked || p.dead, time); // hướng hiện (4 hướng LPC, có trễ) riêng, `v.face` giữ hướng 8 thật cho hướng hiệu ứng
      if (mine) { const at = this.pred!.update(p, this.dir, dt, this.walk); v.wx = at.x; v.wy = at.y; }
      else if (Math.hypot(p.x - v.wx, p.y - v.wy) > 64) { v.wx = p.x; v.wy = p.y; }
      else { v.wx += (p.x - v.wx) * lerp; v.wy += (p.y - v.wy) * lerp; }
      const at = W2S(v.wx, v.wy);
      root.setPosition(at.x, at.y).setDepth(at.y);
      // Ngoại hình hồn sư (chuỗi `lpc`, áo / mũ trang bị đè lên) và võ hồn ra trận đồng bộ từ server, ai cũng thấy; thân là texture ghép
      // lúc chạy, áo và tóc đã nằm trong đó. Dữ liệu lạ (preset sót) được gearLpc đổi sang LPC (HL3 #572).
      const lpcStr = gearLpc(p);
      if (lpcStr !== v.looks) {
        v.looks = lpcStr; v.playing = "";
        if (v.lpcKey) { this.lpc.release(v.lpcKey); v.lpcKey = ""; }
        const lk = this.lpc.acquire(lpcStr);
        if (lk) { v.lpcKey = lk; v.lpcFace = { shown: null, pend: null }; fitHonsuLayer(v.body.setTexture(lk)); }
      }
      if (p.vh !== v.vh) { v.vh = p.vh; const [kb, kf] = vohonTextures(this, p.vh); fitHonsuLayer(v.vb.setTexture(kb), true); fitHonsuLayer(v.vf.setTexture(kf), true); }
      const rings = [...p.rings].join(",");
      if (rings !== v.rings) { v.rings = rings; buildRings(this, v, [...p.rings]); }
      // Nhịp animation đi theo vận tốc (11.1): chính mình theo tốc độ dự đoán của bước đang đi, người khác (và chính mình khi tự săn) theo
      // `spd` của server; đang Mê hoặc theo tốc độ đi bộ gốc × PLAYER_CHARM.spd × Làm chậm (server không gửi tốc độ lúc này).
      const spd = charmed ? PLAYER_SPEED * (VOHON[p.vh]?.spd ?? 1) * PLAYER_CHARM.spd * (1 - pSlow(p.st)) : self ? stepSpeed(p, this.walk) * Math.min(1, Math.hypot(this.dir.x, this.dir.y)) : p.spd;
      this.animatePlayer(id, v, p, time, walk, spd);
      if (!p.dead) this.stepSound(id, v.wx, v.wy, walk, self ? this.walk : false, time);
      // Tàng hình (Yêu Hồ, 2.5c): người khác thấy mờ hẳn, chính mình thấy nửa trong suốt.
      const hidden = (p.buff & buffBit("hide")) !== 0, a = hidden ? (id === this.me ? 0.5 : 0.22) : 1;
      if (v.root.alpha !== a) { v.root.setAlpha(a); label.setAlpha(a); title.setAlpha(a); tongT.setAlpha(a); }
      // Võ Hồn Chân Thân: hồn sư giữ nguyên cỡ, sau lưng hiện pháp tướng (PhapTuongSystem, #486); hào quang vẽ trong drawStatus.
      const vhId = VOHON[p.vh]?.id ?? "";
      this.pt.sync(id, { x: root.x, y: root.y, depth: root.depth, face: v.lpcFace.shown ?? v.face, alpha: a }, { ava: p.ava, dead: p.dead, rings: p.rings.length, vohonId: vhId }, id === this.me, time, dt);
      const up = 0;
      if (label.scale !== this.txtK) { label.setScale(this.txtK); title.setScale(this.txtK); tongT.setScale(this.txtK); }
      // Tên tông (#196) ngay trên đầu, tên và danh hiệu dịch lên một dòng khi có tông.
      const tg = tongByIndex(p.tong), tu = tg ? 7 * this.txtK : 0;
      tongT.setPosition(root.x, root.y - HEAD - (this.isArena ? 2 : 0) - up).setVisible(!!tg && !p.dead).setText(tg?.name ?? "");
      if (tg && tongT.style.color !== tg.col) tongT.setColor(tg.col);
      label.setPosition(root.x, root.y - HEAD - (this.isArena ? 2 : 0) - up - tu).setVisible(!p.dead).setText(`${p.name} (${p.level})`);
      // Đồng đội trong tổ đội (7.1): tên màu xanh lá.
      const col = id === this.me ? "#ffe9a0" : this.party?.members.some((m) => !m.me && m.sid === id) ? "#7dff8a" : "#ffffff";
      if (label.style.color !== col) label.setColor(col);
      // Danh hiệu theo cấp võ hồn đang ra trận (mục 5.1); đang tự săn (Auto 1) thì thêm chữ "Tự động", màu lục.
      title.setPosition(root.x, root.y - HEAD - 8 * this.txtK - up - tu).setVisible(!p.dead).setText(p.auto ? `${titleOf(p.level)} · ${id === this.me && autoJobText() || "Tự động"}` : titleOf(p.level));
      const tcol = p.auto ? "#86e0b0" : "#f2c84b"; if (title.style.color !== tcol) title.setColor(tcol);
    });
    if (this.stepT.size > st.players.size) for (const id of this.stepT.keys()) if (!st.players.has(id)) this.stepT.delete(id);
    for (const [id, v] of this.players) if (!seenP.has(id)) { this.pt.drop(id); if (v.lpcKey) this.lpc.release(v.lpcKey); v.root.destroy(); v.label.destroy(); v.title.destroy(); v.tongT.destroy(); this.players.delete(id); }
    const meS = this.ghost && st.players.get(this.me);
    if (meS) { const s = W2S(meS.x, meS.y); this.ghost!.clear().lineStyle(1, 0xff4040, 1).strokeRect(s.x - 6 * SPR, s.y - 22 * SPR, 12 * SPR, 24 * SPR); }

    // hồn thú: cũng nội suy trong tọa độ thế giới (bpos) rồi đặt ở hình chiếu.
    const seenB = new Set<string>();
    st.beasts.forEach((b: any, id: string) => {
      seenB.add(id);
      let s = this.beasts.get(id), w = this.bpos.get(id);
      if (!s || !w) {
        w = { x: b.x, y: b.y }; this.bpos.set(id, w);
        const at = W2S(b.x, b.y);
        s = this.light.entity(this.add.sprite(at.x, at.y, `b${b.tier}_0`).setOrigin(BEAST_ORIGIN.x, BEAST_ORIGIN.y)); this.beasts.set(id, s);
      }
      const ox = W2S(w.x, w.y).x, mv8 = b.moving && Math.hypot(b.x - w.x, b.y - w.y) > 0.3 ? dir8(b.x - w.x, b.y - w.y) : null;
      const face = mv8 ?? this.bface.get(id) ?? dir8(b.face || 1, 0) ?? "se";
      this.bface.set(id, face);
      // Du Thủy lặn ra giữa hồ / nổi lên (#118, cờ BeastState.dive đổi cùng bản vá với vị trí): đặt thẳng, không trượt qua cây và nước.
      if (!!b.dive !== (w.dive ?? !!b.dive)) { w.x = b.x; w.y = b.y; }
      w.dive = !!b.dive;
      w.x += (b.x - w.x) * lerp; w.y += (b.y - w.y) * lerp;
      const at = W2S(w.x, w.y); s.setPosition(at.x, at.y);
      // Loài đã có ảnh thật (M4) thì dùng sheet beast_{loài}; chưa có thì vẽ bằng code theo bậc.
      // Báo trước chiêu (3.5): sheet theo loài giữ khung đầu `attack`; sprite vẽ bằng code thì phồng lên co lại.
      // Tinh anh (BĐ4): sprite của loài gốc (BOSSES.species) phóng ELITE.scale. Mọi sprite cũ phóng thêm SPR (10.1); sheet isometric
      // (mục 5.11) đã ở cỡ màn hình nội bộ nên không phóng SPR. Hình tạm LPC không dùng cho thú vương / boss (beastSheetSpecies).
      // Bọc trứng (#162): kén vẽ bằng code, phập phồng nhanh dần khi sắp nở (đồng hồ nở vẽ ở lớp phủ bên dưới).
      const egg = b.egg > 0, spr = egg ? null : syncBeastSprite(s, beastSheetSpecies(b.rank, beastBase(b.rank, b.species)?.id), b.moving, b.aggro, b.cast, face), k = spr ? spriteRankScale(s, b.rank) : rankScale(b.rank);
      if (egg) {
        if (s.texture.key !== "spider_egg") s.setTexture("spider_egg");
        s.setScale(SPR * (1 + (b.egg < EGG_SOON ? 0.08 * Math.sin(time / 45) : 0.03 * Math.sin(time / 160))));
      } else if (!spr) {
        s.setTexture(`b${b.tier}_${b.moving ? step : 0}${b.aggro ? "a" : ""}`);
        s.setScale(k * SPR * (b.cast ? 1.08 + 0.06 * Math.sin(time / 60) : 1));
      } else if (spr === "static") {
        // Hồn thú lai (#386): ảnh tĩnh 3 hướng, thở / nhún / ngả rồi vồ / lắc khi trúng đòn vẽ bằng code (staticBeastPose). Phép biến đổi
        // quanh chân; vị trí dịch cộng thêm sau khi đã đặt độ sâu theo điểm chân nên không đổi thứ tự vẽ.
        const P = staticBeastPose(s, time, b.moving && !b.cast, b.cast, b.hp, face, beastFamily(beastBase(b.rank, b.species)?.id), b.rank ? 1 + 0.35 * Math.min(b.rank, 3) : 1);
        s.setScale(k * P.sx, k * P.sy).setRotation(P.rot).setPosition(at.x + P.dx, at.y + P.dy);
        if (P.flash) s.setTintFill(0xffffff);
      } else {
        const ks = k * (spr === "iso" ? 1 : SPR);
        if (s.scale !== ks) s.setScale(ks);
        // 11.1: đuổi nhanh hơn lang thang nhiều lần nên bước chân cũng nhanh theo (khung báo trước / ra đòn giữ nhịp vẽ).
        s.anims.timeScale = b.moving && !b.cast ? (b.aggro ? BEAST_ANIM_SCALE.chase : BEAST_ANIM_SCALE.wander) : 1;
      }
      // Cuồng nộ: nháy đỏ (đè màu hung hăng; sprite theo loài tự đặt lại màu hung hăng mỗi khung).
      if (b.buff & beastBuffBit("rage") && Math.floor(time / 160) % 2) { s.setTint(0xff7050); s.setData("rgTint", true); }
      else if (s.getData("rgTint")) { s.clearTint(); s.setData("rgTint", false); }
      if (b.rank && s.getData("bscale") !== k) s.setData("bscale", k);
      // Boss thế giới đang lặn (Du Thủy, BĐ6e): chỉ còn bóng mờ dưới nước.
      s.setAlpha(b.dive ? 0.2 : 1);
      // Sprite một hàng chỉ vẽ hướng phải: đang đi thì lật theo hướng trượt trên màn hình, đứng yên thì theo `face` của server
      // (sheet isometric tự chọn hướng và lật trong syncBeastSprite).
      const dsx = s.x - ox;
      if (spr !== "iso" && spr !== "static") s.setFlipX(b.moving && Math.abs(dsx) > 0.05 ? dsx < 0 : b.face < 0);
      // G1: đẩy lùi (chỉ hình, 110 ms) và nháy trắng 50 ms sau khi bị đánh; hết hạn thì trả màu cho nhánh tô màu của sprite.
      const tl = this.teles.get(id);
      if (tl && !fxPrefs.reduce) { // lấy đà: ngả ra sau (ngược hướng nhìn trên màn hình isometric) khi báo trước
        const a = Math.PI / 2 + DIRS8.indexOf(face) * Math.PI / 4, k = Math.min(1, (time - tl.t0) / tl.ms) * 3 * SPR;
        s.x -= Math.cos(a) * k; s.y -= Math.sin(a) * k * 0.5;
      }
      const kick = this.hitKick.get(id);
      if (kick) {
        const f = (time - kick.t0) / 110;
        if (f >= 1) this.hitKick.delete(id); else { const k = Math.sin(Math.PI * f) * kick.p * SPR; s.x += kick.dx * k; s.y += kick.dy * k * 0.5; }
      }
      const fl = this.hitFlash.get(id);
      if (fl !== undefined) { if (time < fl) s.setTintFill(0xffffff); else { this.hitFlash.delete(id); s.clearTint(); } }
      s.setDepth(spr === "static" ? at.y : s.y); // sprite tĩnh: độ sâu theo điểm chân
      if (b.rank || egg) {
        let lb = this.eliteLabels.get(id);
        if (!lb) {
          lb = this.add.text(s.x, s.y, "", { fontFamily: FONT, fontSize: b.rank >= 2 ? "9px" : "7px", fontStyle: "800",
            color: egg ? "#c8f5b4" : BOSSES[b.species]?.aura ?? "#ffffff", stroke: "#000", strokeThickness: 2, resolution: 8 }).setOrigin(0.5, 1);
          this.eliteLabels.set(id, lb);
        }
        // Boss thế giới (BĐ6e): điểm yếu hệ đang hiện ghi ngay dưới tên.
        const txt = egg ? `Bọc trứng · ${eggLeft(b)}` : beastName(b.rank, b.species) + (b.rank === 3 && b.weak ? `\nĐiểm yếu: ${HE[HE_IDS[b.weak - 1]].name}` : "");
        if (lb.text !== txt) lb.setText(txt);
        lb.setPosition(s.x, beastTop(s, b.tier) - (b.hp < b.maxHp ? 5 : 2)).setDepth(99984).setScale(this.txtK);
      }
    });
    for (const [id, s] of this.beasts) if (!seenB.has(id)) {
      // Hồn thú lai vừa bị đòn kết liễu (tin `dmg` có `kill` trong vòng KILL_GHOST_MS) thì để lại bóng ngã, chìm, mờ dần (STATIC_MOTION.die);
      // biến mất vì rời tầm đồng bộ / bị dọn thì không có hiệu ứng.
      const killedAt = this.beastKilled.get(id);
      if (killedAt !== undefined && this.time.now - killedAt < KILL_GHOST_MS && s.getData("sm") && this.cameras.main.worldView.contains(s.x, s.y)) this.fadeBeastGhost(s);
      this.beastKilled.delete(id);
      const h = this.lastHit.get(id); if (h && time - h.t < 900) if (h.lethal) { this.downAt.push({ x: s.x, y: s.y, t: time }); this.beastDown(s, h); } // vừa trúng đòn rồi biến mất: coi là hạ
      // Hồn thú biến mất ngay gần mình là chết (ra khỏi tầm đồng bộ thì ở xa hơn nhiều, 11.4): kêu một tiếng tại chỗ.
      const w = this.bpos.get(id), me = st.players.get(this.me);
      if (w && me && !w.dive && Math.hypot(w.x - me.x, w.y - me.y) < 260) this.audio.playBeast("die", { x: w.x, y: w.y });
      s.destroy(); this.beasts.delete(id); this.bpos.delete(id); this.bface.delete(id); this.lastHit.delete(id); this.hitFlash.delete(id); this.hitKick.delete(id);
    }
    this.downAt = this.downAt.filter(q => time - q.t < 2500);
    for (const [id, h] of this.lastHit) if (time - h.t > 5000) this.lastHit.delete(id);
    for (const [id, lb] of this.eliteLabels) if (!seenB.has(id)) { lb.destroy(); this.eliteLabels.delete(id); }

    // hồn hoàn rơi
    const seenD = new Set<string>();
    st.drops.forEach((d: any, id: string) => {
      seenD.add(id);
      let v = this.drops.get(id);
      const at = W2S(d.x, d.y);
      if (!v) {
        // Màu hồn hoàn theo số năm (bậc suy từ số năm), số năm ghi ngay dưới. Mảnh võ hồn (3.4): tinh thể màu võ hồn, tên ghi dưới.
        // Hồn cốt (4.1): biểu tượng vị trí màu theo số năm, ghi "Hồn cốt Tay phải".
        // Hồn hạch (5.1): viên hạch màu bộ (texture `core_<bộ>`), ghi "Hồn hạch Bộ N★".
        const bone = d.item === BONE_ITEM ? BONE_SLOTS[d.slot] : undefined, core = d.item === CORE_ITEM ? CORE_SETS[d.cset] : undefined;
        const eq = d.item === EQUIP_ITEM ? EQUIP_TEMPLATES[d.cset] : undefined; // E2: trang bị rơi: `cset` = chỉ số mẫu, màu theo bậc, ảnh tạm (E5/E6 thay)
        const it = d.item ? itemDef(d.item) : undefined, col = core ? core.col : eq ? EQUIP_TIERS[eq.tier].col : it && !bone ? it.col : hud.ringColor(d.tier);
        const img = this.add.image(at.x, at.y - 4 * SPR, core ? `core_${core.id}` : bone ? `bone_${bone.id}` : it ? "shard" : `ring${d.tier}`).setDepth(at.y - 1);
        if (it && !core) img.setTint(hex(col));
        // Biểu tượng hồn cốt 9×9 điểm ảnh phóng đôi cho dễ thấy giữa cỏ; mọi biểu tượng phóng thêm SPR (10.1).
        img.setScale(SPR * (bone ? 2 : core ? 1.3 : 1));
        const name = core ? coreName(core.id, d.stars) : eq ? equipName(eq.id) : bone ? `Hồn cốt ${bone.name}` : it ? `${d.qty > 1 ? `${d.qty} ` : ""}${it.name}` : d.item ? "Vật phẩm lạ" : formatYears(d.years);
        const txt = this.add.text(at.x, at.y + (core ? 18 : bone ? 12 : 4) * SPR, name, { // hồn cốt, hồn hạch: dưới nhãn số năm của hồn hoàn (và hồn cốt) nằm cạnh
          fontFamily: FONT, fontSize: "6px", fontStyle: "700", color: col, stroke: "#000", strokeThickness: 2, resolution: 8,
        }).setOrigin(0.5, 0).setDepth(at.y - 1).setScale(this.txtK);
        v = { img, txt }; this.drops.set(id, v);
        if (!it && !bone && !core && d.tier >= 1 && d.ttl >= DROP_TTL_SECS - 2 && this.downAt.some(q => time - q.t < 2500 && Math.hypot(q.x - at.x, q.y - at.y) < 140 * SPR)) this.dropGlint(at, hud.ringColor(d.tier)); // hồn hoàn mới rơi: vòng sáng màu niên hạn bay lên
        if (d.ttl >= DROP_TTL_SECS - 2) { // chỉ đồ vừa rơi (đồ nằm sẵn đi tới gần mới đồng bộ, 11.4, thì không kêu)
          this.audio.playGroup("ring-drop", { x: d.x, y: d.y }, { priority: 1.5 });
          if (!d.item && d.tier >= 2) this.audio.playRingGlow(d.tier, { x: d.x, y: d.y });
        }
      }
      v.img.y = at.y - (4 + (0.5 + 0.5 * Math.sin(time / 250)) * 2) * SPR;
      if (v.txt.scale !== this.txtK) v.txt.setScale(this.txtK); // đổi cỡ cửa sổ
      const a = d.ttl < 8 ? (Math.floor(time / 160) % 2 ? 0.4 : 1) : 1;
      v.img.setAlpha(a); v.txt.setAlpha(a);
    });
    st.drops.forEach((d: any, id: string) => this.dropTtl.set(id, { ttl: d.ttl, x: d.x, y: d.y }));
    const meNear = st.players.get(this.me);
    for (const [id, v] of this.drops) if (!seenD.has(id)) {
      // Biến mất khi còn thời gian và mình đứng cạnh: là nhặt (hết hạn thì ttl lần thấy trước đã gần 0).
      const last = this.dropTtl.get(id);
      if (meNear && last && last.ttl > 1.5 && Math.hypot(last.x - meNear.x, last.y - meNear.y) < PICKUP_RANGE + 24) this.audio.play("pickup");
      this.dropTtl.delete(id);
      v.img.destroy(); v.txt.destroy(); this.drops.delete(id);
    }


    // vẽ phủ: thanh máu, vòng uy áp, hiệu ứng hấp thụ
    const g = this.ov; g.clear();
    st.beasts.forEach((b: any, id: string) => {
      const s = this.beasts.get(id)!, t = TIERS[b.tier];
      if (b.egg) {
        // Đồng hồ nở (#162): cung trên mặt đất quanh bọc, ngắn dần theo thời gian còn lại; dưới 3 giây thì đỏ.
        const f = Math.min(1, b.egg / 10 / (EGG_SECS.get(BEASTS[b.species]?.id ?? "") ?? b.egg / 10)), n = Math.max(2, Math.ceil(f * 32)), pts: Pt[] = [];
        for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (f * 2 * Math.PI * i) / n; pts.push({ x: s.x + Math.cos(a) * RX * 14, y: s.y + Math.sin(a) * RY * 14 }); }
        g.lineStyle(1, 0x000000, 0.5).strokeEllipse(s.x, s.y, 2 * RX * 14, 2 * RY * 14);
        g.lineStyle(2, b.egg < EGG_SOON ? 0xff5a3a : 0x9be23a, 0.95).strokePoints(pts);
      }
      else if (b.tier >= 1) { g.lineStyle(1, hex(t.glow), 0.4 + 0.2 * Math.sin(time / 300)); g.strokeEllipse(s.x, s.y, (t.size + 6) * SPR, 6 * SPR); }
      if (b.hp < b.maxHp) {
        const w = Math.max(14, t.size + 4) * SPR;
        const y = beastTop(s, b.tier) - 2;
        g.fillStyle(0x000000, 0.6).fillRect(s.x - w / 2, y, w, 2);
        g.fillStyle(b.tier === 0 ? 0xe0525a : hex(t.glow), 1).fillRect(s.x - w / 2, y, w * Math.max(0, b.hp / b.maxHp), 2);
      }
    });
    // Sân đấu (7.2): thanh sinh lực võ hồn ra trận trên đầu cả hai hồn sư (mình xanh, đối thủ đỏ).
    if (this.isArena) st.players.forEach((p: any, id: string) => {
      const v = this.players.get(id); if (!v || p.dead) return;
      const w = 22 * SPR, x = v.root.x - w / 2, y = v.root.y - HEAD + 1;
      g.fillStyle(0x000000, 0.65).fillRect(x - 1, y - 1, w + 2, 4);
      g.fillStyle(id === this.me ? 0x5fd08a : 0xe0525a, 1).fillRect(x, y, w * Math.max(0, Math.min(1, p.hp / Math.max(1, p.maxHp))), 2);
    });
    st.players.forEach((p: any, id: string) => {
      if (p.absorb <= 0) return; const v = this.players.get(id)!, t = TIERS[p.absorbTier], k = p.absorb, { x, y } = v.root, q = SPR;
      g.lineStyle(3, hex(t.col), 0.9); g.strokeEllipse(x, y - (4 + k * 6) * q, (24 - k * 6) * q, 8 * q);
      for (let i = 0; i < 3; i++) { const a = time / 330 + i * 2.1; g.fillStyle(hex(t.glow), 1).fillRect(x + Math.cos(a) * (16 - k * 10) * q - q, y + (-8 + Math.sin(a) * (8 - k * 5)) * q - q, 2 * q, 2 * q); }
    });

    this.drawStatus(g, st, time);
        this.drawTeles(time);
    this.paintWaypoints(this.teleG, time); // truyền tống trận (11.2): trên mặt đất, dưới hồn sư
    this.paintWpCasts(g, time);
    // Bóng đổ elip dưới chân hồn thú (hồn sư có sẵn bóng trong container), nằm trên mặt đất cùng lớp vùng cảnh báo.
    for (const [id, s] of this.beasts) if (st.beasts.get(id) && !st.beasts.get(id).dive) {
      const w = Math.max(12 * SPR, beastBody(s).w * 0.6);
      this.teleG.fillStyle(0x1a1020, 0.35).fillEllipse(s.x, s.y, w, w / 2);
    }
    // Điểm đang đi tới (bấm để đi): vòng nhỏ nhấp nháy trên mặt đất.
    if (this.goal) { this.teleG.lineStyle(1, 0xfff2b0, 0.6 + 0.3 * Math.sin(time / 120)); strokeGround(this.teleG, this.goal.x, this.goal.y, 5); }
    // Cờ đã đặt ở bản đồ này (R4): vòng cam lớn hơn trên mặt đất, nhấp nháy khi đang tự đi.
    const fl = getFlag();
    if (fl && fl.map === this.mapId && fl.tx !== null && fl.ty !== null) { this.teleG.lineStyle(2, 0xff9a3c, fl.on ? 0.6 + 0.35 * Math.sin(time / 150) : 0.8); strokeGround(this.teleG, fl.tx * TILE, fl.ty * TILE, 9); strokeGround(this.teleG, fl.tx * TILE, fl.ty * TILE, 3); }
    // Dấu tập trung của đồng đội (R6): vòng sáng vàng ba lớp, nhấp nháy, trên mặt đất.
    for (const r of this.rallyHere()) { const k = 0.55 + 0.35 * Math.sin(time / 180); this.teleG.lineStyle(2, 0xffe14a, k); strokeGround(this.teleG, r.tx * TILE, r.ty * TILE, 14); strokeGround(this.teleG, r.tx * TILE, r.ty * TILE, 8); strokeGround(this.teleG, r.tx * TILE, r.ty * TILE, 3); }
    this.drawAuras(g, st, time);
    // Ô bản đồ trong tầm camera; khối cao đang che chính mình hoặc hồn thú trong tầm thì khoét lỗ, mờ đi (10.7: cả hồn thú).
    const mv = this.players.get(this.me), view = this.cameras.main.worldView, focus: Focus[] = mv ? [{ x: mv.root.x, y: mv.root.y }] : [];
    // Chỉ hồn thú gần (trong tầm giao chiến trên màn hình), tối đa 6 con: mỗi vật bị khoét lỗ tốn thêm lần vẽ mặt nạ.
    for (const [id, s] of this.beasts) if (view.contains(s.x, s.y) && mv && Math.hypot(s.x - mv.root.x, s.y - mv.root.y) < 260 && !st.beasts.get(id)?.dive && focus.length < 7)
      { const bb = beastBody(s); focus.push({ x: s.x, y: s.y, w: Math.max(28, bb.w + 12), h: Math.max(28, bb.h + 12) }); }
    this.isoMap.update(this.cameras.main, focus);

    // Ánh sáng (10.7): nguồn sáng hồn lực trong khung này, cộng vật phát sáng IsoMap báo; rồi thời tiết, hạt bay.
    const me = st.players.get(this.me), cam = this.cameras.main;
    const glows = this.isoMap.glows();
    this.light.update(time, cam, this.lightSources(st, time), glows);
    this.ambientSound(time, mv, glows);
    const zone = me ? this.zones.find((z) => inRect(z, me.x, me.y))?.name ?? "" : "";
    let boss = false;
    if (me) st.beasts.forEach((b: any) => { if (b.rank >= 2 && Math.hypot(b.x - me.x, b.y - me.y) < 320) boss = true; });
    this.weather.update(time, cam, zone, boss);
    // Che tầm nhìn (#175): chỉ màn hình của chính người trúng phủ mực, vòng hở quanh thân mình.
    this.ink.update(!!me && (me.st & statusBit("ink")) !== 0, mv ? { x: mv.root.x, y: mv.root.y - HEAD / 2 } : null, delta, cam);
    // Nhạc (#134): giao chiến boss thế giới / thú vương thì đổi bài; cấp võ hồn ra trận tăng thì khúc ngắn lên cấp.
    const bossLevel = me ? bossPhase(st.beasts, me) : 0;
    this.audio.music?.setBattle(bossLevel > 0);
    this.audio.music?.setBossPhase(bossLevel); // pha 2 (nổi giận): nhạc giao chiến boss lên một nấc
    this.audio.music?.tick();
    if (me) {
      if (me.vh === this.lvVh && me.level > this.lvSeen) { this.audio.play("level_up"); this.audio.music?.jingle("level_up"); toast("level", `Cấp ${me.level}`, VOHON[me.vh]?.name ?? "", "#ffe08a"); }
      this.lvVh = me.vh; this.lvSeen = me.level;
    }
    if (this.watching && (this.hudT -= dt) <= 0) { this.hudT = 0.08; this.arenaBar(st); } // người xem không có `me` nên hudT không dùng chỗ khác
    if (me) {
      this.hudT -= dt;
      if (this.hudT <= 0) { this.hudT = 0.08; this.updateHud(me); this.updateNpcs(me); }
    }
  }

  /**
   * Nguồn sáng hồn lực trong khung này (phong cách A, 10.7): vòng hồn hoàn của mỗi hồn sư (màu `glow` của vòng cao nhất, rộng theo số
   * vòng, Chân Thân rộng hơn), mắt hồn thú (màu niên hạn, ở đầu), hồn hoàn / hồn cốt rơi trên đất. Lighting chọn theo độ ưu tiên.
   */
  lightSources(st: any, time: number): LightSrc[] {
    const out: LightSrc[] = [];
    if (!this.light.on) return out;
    st.players.forEach((p: any, id: string) => {
      const v = this.players.get(id), n = p.rings?.length ?? 0;
      if (!v || p.dead || !n || ((p.buff & buffBit("hide")) && id !== this.me)) return;
      const top = Math.max(...p.rings), ct = p.ava > 0 ? 1.5 : 1;
      out.push({ x: v.root.x, y: v.root.y - 4, col: hex(TIERS[top].glow), r: (34 + 5 * n) * ct, i: (0.55 + 0.05 * n) * (0.92 + 0.08 * Math.sin(time / 500)),
        p: id === this.me ? PRIO.me : PRIO.player });
    });
    st.beasts.forEach((b: any, id: string) => {
      const s = this.beasts.get(id); if (!s || b.dive) return;
      const top = beastTop(s, b.tier), dir = s.flipX ? -1 : 1, k = spriteRankScale(s, b.rank);
      out.push({ x: s.x + dir * beastBody(s).w * 0.22, y: top + (s.y - top) * 0.3, col: hex(TIERS[b.tier].glow), r: (18 + 5 * b.tier) * Math.sqrt(k), i: 0.55 + 0.05 * b.tier, p: PRIO.beast });
    });
    // Truyền tống trận đã mở (11.2): ánh lam ngọc yếu, nhịp chậm, như vật phát sáng.
    for (const w of this.waypoints) if (this.wpOpen.has(w.key)) {
      const c = W2S(w.x + w.w / 2, w.y + w.h / 2);
      out.push({ x: c.x, y: c.y, col: 0x8fe0ff, r: 46, i: 0.5 + 0.1 * Math.sin(time / 420), p: PRIO.prop });
    }
    // Hỏa Đàn (#163): ánh lửa cam lay động như vật phát sáng.
    if (this.hoaDan) {
      const c = W2S(this.hoaDan.x, this.hoaDan.y);
      out.push({ x: c.x, y: c.y - 8 * SPR, col: 0xff9a3c, r: 90, i: 0.85 * (0.85 + 0.1 * Math.sin(time / 90) + 0.05 * Math.sin(time / 37)), p: PRIO.prop });
    }
    st.drops.forEach((d: any, id: string) => {
      const v = this.drops.get(id); if (!v || d.item) return;
      out.push({ x: v.img.x, y: v.img.y + 4, col: hex(TIERS[d.tier]?.glow ?? "#ffffff"), r: 30, i: 0.6, p: PRIO.drop });
    });
    return out;
  }

  /**
   * Hướng hiện của hồn sư chế độ Tự tạo: 8 hướng thu về 4 hàng LPC (s, n; se / e / ne là hàng Phải "e"; sw / w / nw lật "w"), và hướng
   * mới phải giữ `LPC_VIEW.dirHoldMs` mới đổi để đi chéo không nháy giữa hai hàng. `now`: đổi ngay (đang đánh, gục, lần đầu).
   * Thân, phụ thể và pháp tướng đọc hướng hiện này (`v.lpcFace.shown`) nên khung khớp nhau; `v.face` giữ hướng 8 thật cho hướng bay của hiệu ứng hồn kỹ.
   */
  lpcFace(v: PView, now: boolean, time: number): Dir8 {
    const f = v.lpcFace, d = v.face, want: Dir8 = d === "s" || d === "n" ? d : d === "se" || d === "e" || d === "ne" ? "e" : "w";
    if (now || f.shown === null || want === f.shown) { f.shown = want; f.pend = null; }
    else if (!f.pend || f.pend.d !== want) f.pend = { d: want, t0: time };
    else if (time - f.pend.t0 >= LPC_VIEW.dirHoldMs) { f.shown = want; f.pend = null; }
    return f.shown;
  }

  /**
   * Chọn animation lớp thân theo state (gục > hấp thụ > đánh / tung hồn kỹ / bị đánh > đi / đứng) và hướng nhìn `v.face`,
   * rồi đặt khung tương ứng cho phụ thể (bảng ánh xạ 5.11) và vị trí các vòng hồn hoàn.
   * `moving`: đang đi (chính mình khi dự đoán: theo phím, không chờ cờ `moving` của server); `spd`: tốc độ đi (pixel/giây) để chọn nhịp
   * animation `walk` (11.1; các animation khác giữ nhịp vẽ vì thời lượng đòn đánh / hồn kỹ tính theo honsuAnimMs).
   */
  animatePlayer(id: string, v: PView, p: any, time: number, moving: boolean, spd = WALK_ANIM_SPEED) {
    const sheet = v.lpcKey; if (!sheet) return;
    if (v.act && time >= v.act.t0 + honsuAnimMs(v.act.anim)) v.act = null;
    let anim: HsAnim = p.dead ? "die" : p.absorb > 0 ? "absorb" : v.act?.anim ?? (moving ? "walk" : "idle");
    // Hoạt ảnh LPC chưa ghép xong (lpcRig.step ghép dần): tạm đứng yên bằng idle, rồi tự chuyển khi xong.
    if (v.lpcKey && !this.lpc.ready(v.lpcKey, anim) && this.lpc.ready(v.lpcKey, "idle")) anim = "idle";
    const { key, flip } = honsuAnimKey(sheet, anim, v.lpcFace.shown ?? v.face);
    const tag = `${key}|${v.act?.anim === anim ? v.act.t0 : ""}`; // đánh liên tiếp thì phát lại từ đầu
    if (tag !== v.playing) { v.playing = tag; fitHonsuLayer(v.body.play(key)); }
    v.body.anims.timeScale = anim === "walk" ? Phaser.Math.Clamp(spd / WALK_ANIM_SPEED, WALK_ANIM_SCALE[0], WALK_ANIM_SCALE[1]) : 1;
    v.body.setFlipX(flip);
    syncLayers(v.body, [v.vb, v.vf]);
    // Bay (2.5b): nhấc mọi lớp trừ bóng lên tối đa 10 pixel theo nửa sóng sin.
    const fe = v.fly ? (time - v.fly.t0) / v.fly.ms : 1; if (fe >= 1) v.fly = null;
    const lift = fe < 1 ? -Math.round(Math.sin(Math.PI * Math.max(0, fe)) * 10) : 0;
    for (const s of [v.body, v.vb, v.vf, v.ringsB, v.ringsF]) s.y = lift; // quầng (v.halo) đặt y trong animateRings
    // Phụ thể của thân LPC (rộng hơn m1): lệch theo LPC_VIEW.vohon, dx đổi dấu khi lật ngang.
    const ox = v.lpcKey ? (flip ? -LPC_VIEW.vohon.dx : LPC_VIEW.vohon.dx) : 0, oy = v.lpcKey ? LPC_VIEW.vohon.dy : 0;
    v.vb.x = v.vf.x = ox; v.vb.y = v.vf.y = lift + oy;
    this.spiritMotion(id, v, p, time, anim, flip, ox, lift + oy);
    // Bị đánh: nháy trắng 2 lần.
    const e = time - v.hurtT, white = e < 70 || (e >= 140 && e < 210);
    for (const s of [v.body, v.vb, v.vf]) if (white) s.setTintFill(0xffffff); else s.clearTint();
    // Vòng hồn hoàn (mục 5.11 "Vòng hồn hoàn", soulRings.ts): dưới chân, bay lên ngang ngực khi tung hồn kỹ; Chân Thân thì thành quầng sau lưng. Ẩn khi gục.
    animateRings(this, v, p, time, { mine: id === this.me, formAge: this.pt.formAge(id, time), lift, delta: this.game.loop.delta });
  }

  private spPose = newSpiritPose(); private spShift = { x: 0, y: 0 };
  /**
   * Chuyển động phụ của phụ thể (H7 #490, spiritMotion.ts): xoay / co giãn / lệch hai lớp phụ thể theo họ của võ hồn và trạng thái đứng / đi /
   * đánh / thi triển, bằng biến đổi Phaser trên sprite có sẵn (không tạo object). Mức theo fxLevel (Thấp / Vừa / Cao, đã gồm trần FPS), Giảm
   * chuyển động tắt hẳn, người khác nhẹ hơn. Gục, hấp thụ, khung phụ thể ẩn thì trả về tư thế gốc.
   */
  spiritMotion(id: string, v: PView, p: any, time: number, anim: HsAnim, flip: boolean, ox: number, oy: number) {
    const fam = SPIRIT_FAMILY[VOHON[p.vh]?.id ?? ""], layers = [v.vb, v.vf];
    const k = fam && v.vb.visible && !p.dead && anim !== "absorb" ? spiritScale(fxLevel(), fxPrefs.reduce, id === this.me) : 0;
    const base = isIsoSheet(this, v.vb.texture.key) ? 1 / SPR : 1; // phụ thể 48×48 cũ vẽ bằng code phóng 1 (fitHonsuLayer)
    if (!fam || (k <= 0 && v.vb.rotation === 0 && v.vb.scaleX === base && v.vb.scaleY === base)) return;
    const st: SpiritState = anim === "attack" || anim === "cast" ? anim : anim === "walk" ? "walk" : "idle";
    v.spPhase ??= spiritPhase(id);
    const age = v.act ? time - v.act.t0 : 0, dur = v.act ? honsuAnimMs(v.act.anim) : 0;
    applySpiritPose(layers, spiritPose(this.spPose, fam, k > 0 ? st : "idle", time, age, dur, flip ? -1 : 1, time - v.hurtT, k, v.spPhase), this.spShift, ox, oy, base, 1 / SPR);
  }

  /** Xin lại chỉ số của võ hồn đang xem ở bảng nhân vật (server giới hạn nhịp, tin về qua "stats"). */
  askStats() { this.room.send("stats", { rowId: charViewRow() }); }
  /** NV3 (#457): gửi một lệnh gắn / tháo do kéo thả, bấm đúp hay thẻ thao tác dựng (charBagContract.ServerCommand: đúng các tin có sẵn); server quyết định. */
  sendCmd(cmd: ServerCommand) {
    if (cmd.msg !== "equipsalvage" && cmd.msg !== "lock") this.audio.playUi("equip");
    this.room.send(cmd.msg, cmd.data);
  }
  renderChar() {
    if (!this.owned || !isCharOpen()) return;
    renderChar(this.owned, this.bag?.items ?? [], this.charStats, {
      portrait: (vohon) => this.portrait(vohon), ask: (rowId) => this.room.send("stats", { rowId }),
      // NV2 (#456): gắn / tháo ngay trên bảng, cùng lệnh với bảng Đội hình; server kiểm tra ô, giao chiến, túi đầy
      equipBone: (itemId, vohonId, slot) => { this.audio.playUi("equip"); this.room.send("equip", { itemId, vohonId, slot }); },
      unequipBone: (itemId) => this.room.send("unequip", { itemId }),
      equipCore: (itemId, vohonId, slot) => { this.audio.playUi("equip"); this.room.send("equipcore", { itemId, vohonId, slot }); },
      unequipCore: (itemId) => this.room.send("unequipcore", { itemId }),
      switchTo: (slot) => this.room.send("switch", { slot }),
      combat: () => this.combat,
      send: (cmd) => this.sendCmd(cmd), gear: () => this.gear?.items ?? [],
    });
  }
  /**
   * Bảng đội hình kèm hồn cốt (bước 4.2), hồn hạch (bước 5.2) và mảnh võ hồn (bước 3.4): số mảnh, hồn cốt và hồn hạch (đang gắn /
   * trong túi) từ tin riêng "bag",
   * võ hồn từ tin riêng "vohons".
   */
  renderRoster() {
    if (isCharOpen()) { this.askStats(); this.renderChar(); } // vohons / bag / cộng minh đổi: chỉ số và ô trên bảng nhân vật cũng đổi
    if (!this.owned) return;
    const shards = new Map<string, number>();
    for (const it of this.bag?.items ?? []) {
      const vh = it.vohon === null ? itemDef(it.code)?.vohon : undefined;
      if (vh) shards.set(vh, (shards.get(vh) ?? 0) + it.qty);
    }
    hud.renderRoster(this.owned, {
      setTeam: (slots) => this.room.send("team", { slots }),
      unlock: (vohon) => this.room.send("unlock", { vohon }),
      starUp: (vohon) => this.room.send("starup", { vohon }),
      equip: (itemId, vohonId, slot) => { this.audio.playUi("equip"); this.room.send("equip", { itemId, vohonId, slot }); },
      unequip: (itemId) => this.room.send("unequip", { itemId }),
      equipCore: (itemId, vohonId, slot) => { this.audio.playUi("equip"); this.room.send("equipcore", { itemId, vohonId, slot }); },
      unequipCore: (itemId) => this.room.send("unequipcore", { itemId }),
      enhance: (targetId, materialIds) => this.room.send("enhance", { targetId, materialIds }),
      enhanceCore: (targetId, materialIds) => this.room.send("enhancecore", { targetId, materialIds }), // nâng cấp hồn hạch (5.3)
      portrait: (vohon) => this.portrait(vohon),
      combat: () => this.combat,
      loadout: (rowId, skills) => this.room.send("loadout", { rowId, skills }), // 4 ô hồn kỹ mang theo (8.1a)
    }, shards, this.bag?.items ?? []);
  }

  portraits = new Map<string, string>(); // ảnh võ hồn trong bảng hồn cốt theo mã võ hồn (data URL), của ngoại hình `portraitLooks`
  portraitLooks = "";
  /**
   * Ảnh 48×48 hồn sư của mình phóng thích võ hồn `vohon` (khung đứng yên hướng xuống: phụ thể sau, thân LPC, phụ thể trước),
   * ghép từ đúng các texture trên bản đồ, cho khung hồn cốt (4.2). Chưa có hồn sư trong state thì "".
   */
  portrait(vohon: string) {
    const me = this.room.state.players.get(this.me); if (!me) return "";
    const lk = this.players.get(this.me)?.lpcKey;
    if (!lk || !this.lpc.ready(lk, "idle")) return ""; // thân LPC chưa ghép xong: chưa có ảnh (không lưu đệm)
    const looks = `L${gearLpc(me)}`;
    if (looks !== this.portraitLooks) { this.portraits.clear(); this.portraitLooks = looks; } // đổi ngoại hình: ảnh cũ bỏ đi
    const hit = this.portraits.get(vohon);
    if (hit) return hit;
    const [kb, kf] = vohonTextures(this, Math.max(0, vohonIndex(vohon)));
    // Thân LPC isometric (10.4): ảnh 96×96 chân ở (48, 80), lớp 64×64 / 96×96 vẽ 1:1, phụ thể 48×48 của võ hồn chưa có ảnh 10.5 phóng ×2;
    // khung hồn cốt hiện ảnh ở 96 pixel nên hai cỡ trông như nhau. Phụ thể isometric lấy nửa sheet theo giới của thân (vohonHalf).
    const k = 2, cv = document.createElement("canvas"); cv.width = cv.height = 48 * k;
    const ctx = cv.getContext("2d")!; ctx.imageSmoothingEnabled = false;
    const draw = (key: string, vohon = false) => {
      if (!this.textures.exists(key)) return;
      const f = this.textures.getFrame(key, vohon ? vohonHalf(this, key, lk) : 0), iso = isIsoSheet(this, key), s = iso ? 1 : k;
      const o = iso ? (vohon ? ISO_VH_ORIGIN : ISO_HS_ORIGIN) : VH_ORIGIN;
      ctx.drawImage(f.source.image as CanvasImageSource, f.cutX, f.cutY, f.cutWidth, f.cutHeight,
        24 * k - f.cutWidth * s * o.x, 40 * k - f.cutHeight * s * o.y, f.cutWidth * s, f.cutHeight * s);
    };
    draw(kb, true); draw(lk); draw(kf, true);
    const url = cv.toDataURL();
    this.portraits.set(vohon, url);
    return url;
  }

  renderBag() {
    if (!this.bag) return;
    hud.renderBag(this.bag, {
      use: (id) => this.room.send("use", { id }),
      absorb: (id, vohonId) => this.room.send("absorb", { itemId: id, vohonId }),
      discard: (id) => this.room.send("discard", { id }),
      sort: () => this.room.send("sortbag"),
      lock: (id) => this.room.send("lock", { id }), // khoá / mở khoá ô (#216)
      autoSell: (cfg) => this.room.send("autosell", { cfg }), // bộ lọc tự bán (#216)
      open: (id) => this.room.send("open", { id }), // rương thú vương (BĐ5): server tung phần thưởng
      absorbOptions: (years) => this.absorbOptions(years),
      herb: (id, vohonId) => this.room.send("use", { id, vohonId }), // tiên thảo (BĐ6b): dùng cho võ hồn đã chọn
      herbOptions: (code) => (this.owned?.list ?? []).map((v) => {
        const def = VOHON[Math.max(0, vohonIndex(v.vohon))];
        return { rowId: v.rowId, name: def.name, col: def.col, level: v.level, active: v.rowId === this.owned?.active, n: v.herbs?.[code] ?? 0 };
      }),
      combat: () => this.combat,
      refresh: () => this.room.send("vohons"),
      enhance: (targetId, materialIds) => this.room.send("enhance", { targetId, materialIds }),
      enhanceCore: (targetId, materialIds) => this.room.send("enhancecore", { targetId, materialIds }), // nâng cấp hồn hạch (5.3)
      // UI-1: gắn nhanh cho võ hồn đang ra trận (cùng lệnh với bảng đội hình; server kiểm tra vị trí, giao chiến, túi đầy)
      active: () => this.owned?.active ?? null,
      equipBone: (itemId, slot) => { const vohonId = this.owned?.active; if (vohonId) { this.audio.playUi("equip"); this.room.send("equip", { itemId, vohonId, slot }); } },
      equipCore: (itemId, slot) => { const vohonId = this.owned?.active; if (vohonId) { this.audio.playUi("equip"); this.room.send("equipcore", { itemId, vohonId, slot }); } },
      equipGear: (id) => { this.audio.playUi("equip"); this.room.send("equipgear", { id }); }, // trang bị hồn sư (5.15)
      unequipGear: (slot) => { this.audio.playUi("equip"); this.room.send("unequipgear", { slot }); },
      gear: () => this.gear,
      viewRow: () => (isCharOpen() ? charViewRow() ?? this.owned?.active ?? null : this.owned?.active ?? null), send: (cmd) => this.sendCmd(cmd),
    });
  }

  /**
   * Các võ hồn sở hữu và rủi ro khi hấp thụ hồn hoàn `years` năm (mục 5.2; chỉ hiển thị, server kiểm tra lại). Võ hồn đang ra
   * trận lấy cấp / số hồn hoàn từ state (mới nhất), võ hồn khác từ tin riêng "vohons".
   */
  absorbOptions(years: number): hud.AbsorbOption[] {
    const me = this.room.state.players.get(this.me);
    return (this.owned?.list ?? []).map((v) => {
      const active = v.rowId === this.owned?.active, def = VOHON[Math.max(0, vohonIndex(v.vohon))];
      const level = active && me ? me.level : v.level, rings = active && me ? me.rings.length : v.rings.length, slot = rings + 1;
      const ch = absorbChance(years, slot);
      const reason = rings >= MAX_RINGS ? `Đã đủ ${MAX_RINGS} hồn hoàn`
        : !atBottleneck(level, rings) ? `Chưa tới bình cảnh (cần cấp ${slot * 10})`
        : ch.fail === null ? `Vượt giới hạn ${ch.over}%: không thể hấp thụ` : "";
      return { rowId: v.rowId, name: def.name, col: def.col, level, slot, limit: ch.limit, over: ch.over, fail: ch.fail, secs: absorbSecs(years), active, reason };
    });
  }

  /** Bản đồ đang đứng có boss thế giới (Lõi Tinh Đấu, BĐ6e). */
  worldBossHere() { return !!MAPS[this.room.state.mapId]?.world?.length; }

  private ambientAt = 0;
  /** Môi trường lớp chồng (G5, #396): mỗi ~250 ms báo bản đồ, mức đêm, khoảng cách tới vật cháy gần nhất; ambientLayers.ts tự hẹn giờ. */
  private ambientSound(time: number, mv: { root: { x: number; y: number } } | undefined, glows: ReadonlyArray<{ x: number; y: number; kind: string }>) {
    if (time < this.ambientAt) return;
    this.ambientAt = time + 250;
    let fireDist: number | null = null;
    if (mv) for (const g of glows) {
      if (!AMBIENT_FIRE_PROPS.has(g.kind)) continue;
      const d = Math.hypot(g.x - mv.root.x, g.y - mv.root.y);
      if (fireDist === null || d < fireDist) fireDist = d;
    }
    this.audio.updateAmbient(time, { mapId: this.room.state.mapId || this.mapId, night: this.light.nightness(), fireDist });
  }

  /**
   * Tin "boss" riêng của boss thế giới (BĐ6e): báo trước / bị hạ toàn server có chữ "Boss thế giới"; trong Lõi Tinh Đấu thêm các cơ chế
   * buộc đổi võ hồn (điểm yếu hệ, Bá Thể, tích lực phải ngắt, Du Thủy, độc toàn sàn, nổi giận). Trả true nếu đã xử lý xong tin này.
   */
  worldBossMsg(m: any, col: string) {
    if (m.k === "warn" && m.world) {
      hud.setBossCountdown({ name: m.name, mapName: m.mapName, here: m.here, secs: m.in, col });
      if (m.join) return true; // tin xin lại lúc vào phòng (#118): chỉ đặt đếm ngược, không lặp log / banner
      hud.log(`${m.name} sẽ xuất hiện ở ${m.mapName} sau ${Math.max(1, Math.round(m.in / 60))} phút!`, col, "Hệ thống");
      toast("boss", `${m.name} sắp xuất hiện`, `${m.mapName} · ${Math.max(1, Math.round(m.in / 60))} phút nữa`);
      return true;
    }
    const he = (id: string) => HE[id as keyof typeof HE]?.name ?? id;
    switch (m.k) {
      case "weak":
        hud.setBossWeak(m.secs);
        hud.banner(`Điểm yếu: ${he(m.he)}`, `Võ hồn ${he(m.he)} gây x${String(m.mult).replace(".", ",")}, hệ khác x${String(m.off).replace(".", ",")} trong ${m.secs} giây: đổi võ hồn (phím 1–4)!`);
        hud.log(`Boss lộ điểm yếu hệ ${he(m.he)} trong ${m.secs} giây.`, "#ffe08a");
        return true;
      case "weakEnd": return true;
      case "charge":
        hud.banner(`${m.name}: tích lực ${m.secs} giây!`, `Cần ${m.need} lần khống chế của võ hồn Khống chế để ngắt, không thì đứng vào vòng xanh ngọc`);
        hud.log(`Boss tích lực ${m.name}: cần ${m.need} lần khống chế (Choáng, Trói, Câm lặng…) của võ hồn Khống chế để ngắt.`, "#ff8a6a");
        return true;
      case "brk": hud.log(`${m.by} khống chế trúng: ngắt ${m.n}/${m.need}.`, "#9ad8ff"); return true;
      case "broken":
        hud.banner(`Đã ngắt ${m.name}!`, `${m.by} ngắt chiêu · boss Choáng ${m.secs} giây`);
        return true;
      case "chargeHit":
        hud.log(`${m.name} không bị ngắt: cả sàn (trừ người đứng trong vòng an toàn) trúng Vết thương sâu (Phá giáp nặng). Chỉ thanh tẩy của võ hồn phụ trợ giải được.`, "#ff6a5a");
        return true;
      case "floor":
        hud.banner(m.name, m.name === "Bạo Nộ" ? "Chiêu toàn sàn: đứng vào vòng xanh ngọc hoặc ra khỏi sàn!"
          : "Độc toàn sàn (Vết thương sâu): đứng vào vòng xanh ngọc, trúng thì nhờ võ hồn phụ trợ thanh tẩy");
        return true;
      case "armor":
        hud.banner(`${m.name}!`, `Khiên ${m.secs} giây: võ hồn ${he(m.he)} phá khiên nhanh gấp ${m.mult}`);
        hud.log(`Boss khoác ${m.name}: võ hồn ${he(m.he)} phá khiên nhanh gấp ${m.mult}; không phá kịp thì boss hồi máu.`, "#9ad8ff");
        return true;
      case "armorBreak": hud.log(`${m.by} phá vỡ ${m.name}!`, "#9ad8ff"); return true;
      case "armorEnd": if (m.heal > 0) hud.log(`${m.name} không bị phá: boss hồi ${Number(m.heal).toLocaleString("vi-VN")} máu.`, "#ff8a6a"); return true;
      case "dive":
        // #118: lặn ra giữa hồ, chỗ nổi lên báo trước bằng vòng sóng xanh.
        this.diveMark = { bid: m.bid, x: m.sx, y: m.sy, t0: this.time.now, ms: m.secs * 1000 };
        hud.banner(`${m.name}!`, `Boss lặn ra giữa hồ ${m.secs} giây, sẽ nổi lên ở vòng sóng xanh: mẫn công đứng chờ sẵn`); return true;
      case "surface": this.diveMark = null; return true;
      case "rage":
        hud.setBossLife(m.life); hud.setBossRage(0);
        hud.banner("NỔI GIẬN!", `Sát thương x${m.dmg}, chiêu toàn sàn mỗi ${m.every} giây`);
        hud.log(`${m.name} nổi giận: sát thương x${m.dmg}, đánh nhanh hơn, chiêu toàn sàn mỗi ${m.every} giây.`, col);
        return true;
    }
    return false;
  }

  /** Thanh trận đấu (hết trận thì bảng kết quả của người xem); người xem còn đặt camera theo người đang theo dõi (#280). */
  arenaBar(st: any) {
    if (!this.isArena || !st.sides) return;
    const watch = this.watching ? this.watchFollow(st) : undefined;
    hud.showArena({ phase: st.phase, time: st.time, me: this.me, friendly: !!st.friendly, watchers: st.watchers ?? 0, watch,
      sides: [...st.sides].map((s: any) => ({ sid: s.sid, name: s.name, elo: s.elo, pct: s.pct, alive: s.alive, total: s.total })) },
      () => this.watching ? this.room.send("arena", { op: "unwatch" }) : this.onBack());
    hud.updateArenaEnd();
    if (!this.show) {
      const au = this.audio;
      au.preloadPk();
      this.show = new ArenaShow(this, {
        drum: () => au.playPkOpen(), tick: (n) => au.playPkCountdown(n), finisher: () => au.playPkKill(),
        heart: () => au.playClip("pk-heartbeat-1", { channel: "sfx", gain: 0.9 }),
      }, k => this.setSlowmo(k));
    }
    this.show.update({ phase: st.phase, time: st.time, winner: st.winner,
      sides: [...st.sides].map((s: any) => ({ sid: s.sid, name: s.name, elo: s.elo, alive: s.alive, total: s.total, pct: s.pct })), players: st.players }, this.me, this.watching);
  }

  /**
   * Người xem: chọn người theo dõi (mặc định người đầu bên trái; người đang theo dõi rời sân thì về người đầu), đặt camera theo hồn sư đó.
   * `pick(i)`: bấm tên bên i = theo dõi người đầu của bên đó, bấm lại thì đổi sang đồng đội (2v2).
   */
  watchFollow(st: any) {
    const sides: string[][] = [...st.sides].map((s: any) => String(s.sid).split(",").filter((x) => this.players.has(x)));
    const all = sides.flat();
    if (!all.includes(this.followSid)) this.followSid = all[0] ?? "";
    const v = this.players.get(this.followSid) ?? null;
    if (v !== this.followV) { this.followV = v; if (v) this.cameras.main.startFollow(v.root, true, 0.2, 0.2); }
    const follow = sides.findIndex((m) => m.includes(this.followSid));
    return { follow, who: st.players.get(this.followSid)?.name ?? "", winner: st.winner ?? -1,
      pick: (i: number) => { const m = sides[i] ?? []; if (m.length) this.followSid = follow === i ? m[(m.indexOf(this.followSid) + 1) % m.length] : m[0]; } };
  }

  updateHud(me: any) {
    const st = this.room.state;
    // Câu gợi ý hấp thụ trong túi phụ thuộc cấp và số hồn hoàn: đổi thì vẽ lại túi.
    const bagKey = `${me.vh}|${me.level}|${me.rings.length}`;
    if (bagKey !== this.bagKey) { this.bagKey = bagKey; this.renderBag(); }
    // Số năm từng hồn hoàn (chú thích sức mạnh hồn kỹ) lấy từ tin riêng "vohons" khi đúng võ hồn đang ra trận.
    const own = this.owned?.list.find((v) => v.rowId === this.owned?.active), years = own && VOHON[me.vh]?.id === own.vohon ? own.rings : null;
    // Từ 8.1a: 4 ô hồn kỹ mang theo của võ hồn ra trận (tin riêng "vohons"; chưa có thì mặc định vòng 1–4).
    const loadout = own && VOHON[me.vh]?.id === own.vohon ? own.skills : DEFAULT_LOADOUT;
    // 9.5: sao võ hồn ra trận đổi sức mạnh / hồi chiêu hồn kỹ vòng 1–4 trong chú thích.
    const stars = own && VOHON[me.vh]?.id === own.vohon ? own.stars : 1;
    const skKey = `${me.vh}|${me.rings.length}|${years?.join(",") ?? ""}|${loadout.join(",")}|${stars}`;
    if (skKey !== this.skillsKey) { this.skillsKey = skKey; hud.buildSkills(me.vh, [...me.rings], years, loadout, (a) => this.act(a), stars, !this.isArena); }
    // Kỹ năng hồn cốt (4.3): hồn cốt đang gắn trên võ hồn ra trận, lấy từ tin riêng "bag" (trường `vohon`) khi đúng võ hồn ra trận.
    const worn: hud.WornBone[] = own && VOHON[me.vh]?.id === own.vohon ? (this.bag?.items ?? []).flatMap((it) => {
      const b = it.vohon === own.rowId && it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null;
      return b ? [{ beast: b.beast, slot: b.slot, years: it.years!, enhance: it.enhance }] : [];
    }) : [];
    const bKey = JSON.stringify(worn);
    if (bKey !== this.boneSkKey) { this.boneSkKey = bKey; hud.buildBoneSkills(worn, (a) => this.act(a)); }
    hud.updateStats(me);
    hud.updateFusion();
    hud.updateTeam(me);
    hud.updateBag();
    hud.updateParty();
    // Thú vương (BĐ5): thanh máu lớn đọc thẳng BeastState; bảng xếp hạng khi mình đang tham gia (có trong danh sách đóng góp).
    let kb: any = null; st.beasts.forEach((b: any) => { if (b.rank >= 2) kb = b; });
    // Boss thế giới (BĐ6e): thêm điểm yếu hệ, khiên, ngắt tích lực, lặn; so với hệ võ hồn mình đang ra trận.
    const wdef = kb?.rank === 3 ? BOSSES[kb.species]?.world : undefined, myHe = VOHON[me?.vh ?? 0]?.he ?? "cuong_cong";
    hud.showBoss(kb && { name: beastName(kb.rank, kb.species), hp: kb.hp, maxHp: kb.maxHp, parts: kb.parts, phase: kb.phase,
      title: BOSSES[kb.species]?.phase2?.name ?? "", col: BOSSES[kb.species]?.aura ?? "#ff5a5a",
      world: kb.rank === 3 ? { rage: kb.phase === 2, weak: kb.weak ? HE_IDS[kb.weak - 1] : null, myHe, shield: kb.shield, brk: kb.brk,
        need: wdef?.charge?.need ?? 0, charging: !!kb.chg, dive: kb.dive, armorHe: wdef?.armor?.he ?? null } : undefined });
    if (!kb && this.bossList) { this.bossList = null; hud.bossRank(null, this.me); }
    hud.updateBossCd();
    hud.updateArenaQueue(); hud.updateArenaLive();
    // Sân đấu (7.2): thanh trận đấu đọc thẳng ArenaState (pha, giây còn lại, hai bên).
    this.arenaBar(st);
    // Tên vùng: vùng an toàn > vùng săn > điểm hồi sinh > tên bản đồ. Vừa vào bản đồ thì hiện tên bản đồ.
    const area = this.safes.find((z) => inRect(z, me.x, me.y)) ?? this.zones.find((z) => inRect(z, me.x, me.y));
    const mapName = MAPS[this.mapId]?.name ?? this.mapId;
    const zname = area?.name ?? (this.campName && inRect(this.campRect, me.x, me.y) ? this.campName : mapName);
    document.getElementById("zoneName")!.textContent = zname;
    if (zname !== this.lastZone) {
      if (!this.lastZone) toast("info", st.channel ? `${mapName} · Kênh ${st.channel}` : mapName, area && area.name !== mapName ? area.name : "");
      else if (area && this.safes.includes(area)) toast("info", area.name, area.hint); // chỉ vùng an toàn; vùng săn đi qua liên tục thì không báo
      this.lastZone = zname;
    }
    document.getElementById("online")!.textContent = `${st.online || st.players.size} người ở ${mapName}`; // 11.4: players chỉ còn người ở gần
    hud.setChannel(st.channel ?? 0);

    let tb: any = null, td = 90;
    st.beasts.forEach((b: any) => { const d = Math.hypot(b.x - me.x, b.y - me.y); if (d < td) { td = d; tb = b; } });
    const sts = tb ? hud.statusText(tb) : "";
    // Cấp tương đương theo số năm (BĐ3) và mức kinh nghiệm còn nhận khi hồn thú thấp hơn võ hồn ra trận (mục 5.3).
    const tLv = tb ? beastLevel(tb.years) : 0, xpk = tb ? xpLevelScale(me.level, tLv) : 1;
    const xpNote = xpk < 1 ? ` <em class="xpcut">kinh nghiệm ${Math.round(xpk * 100)}%</em>` : "";
    // Bọc trứng (#162): không có kinh nghiệm nên không ghi cấp, chỉ thời gian còn lại trước khi nở.
    hud.showTarget(tb?.egg ? `<span class="dot" style="color:#c8f5b4"></span>Bọc trứng · nở sau ${eggLeft(tb)} giây – ${tb.hp}/${tb.maxHp}` + (sts ? `<small>${sts}</small>` : "")
      : tb ? hud.withBeastPortrait(hud.beastTargetHtml({ name: beastName(tb.rank, tb.species), years: tb.years, tier: tb.tier, level: tLv, hp: tb.hp, maxHp: tb.maxHp, status: sts, xpNote }),
        beastBase(tb.rank, tb.species)?.id, tb.rank ? BOSSES[tb.species]?.aura ?? "#ffffff" : hud.ringColor(tb.tier)) : null);

    // Hồn hoàn dưới đất trong tầm nhặt: nhấn E (hoặc nút "Nhặt") để cho vào túi; hấp thụ trong túi đồ.
    let dr: any = null, dd = PICKUP_RANGE;
    st.drops.forEach((d: any) => { const k = Math.hypot(d.x - me.x, d.y - me.y); if (k < dd) { dd = k; dr = d; } });
    if (dr && me.absorb <= 0) {
      // Từ 7.1 đồ rơi của tổ đội mình (DropState.party) cũng nhặt được ngay.
      const mine = !dr.owner || dr.owner === this.me || dr.ownerTtl <= 0 || (!!dr.party && dr.party === this.party?.id);
      const msg = mine ? "nhấn E để nhặt vào túi" : `<em>của ${dr.party ? "tổ đội " : ""}người hạ hồn thú, còn ${Math.ceil(dr.ownerTtl)} giây</em>`;
      const it = dr.item ? itemDef(dr.item) : undefined;
      if (dr.item === EQUIP_ITEM) hud.showPrompt(`<span class="dot" style="color:${EQUIP_TIERS[EQUIP_TEMPLATES[dr.cset]?.tier ?? 0].col}"></span>${equipName(EQUIP_TEMPLATES[dr.cset]?.id)}: ${msg}`);
      else if (dr.item === CORE_ITEM) hud.showPrompt(`<span class="dot" style="color:${CORE_SETS[dr.cset]?.col ?? "#d9b8ff"}"></span>${coreName(CORE_SETS[dr.cset]?.id ?? "", dr.stars)}: ${msg}`);
      else if (dr.item === BONE_ITEM) hud.showPrompt(`<span class="dot" style="color:${hud.ringColor(dr.tier)}"></span>Hồn cốt ${boneName(BEASTS[dr.species]?.id ?? "", BONE_SLOTS[dr.slot]?.id, dr.years)}: ${msg}`);
      else hud.showPrompt(dr.item ? `<span class="dot" style="color:${it?.col ?? "#9db3a2"}"></span>${dr.qty} ${it?.name ?? "vật phẩm lạ"}: ${msg}`
        : `<span class="dot" style="color:${hud.ringColor(dr.tier)}"></span>Hồn hoàn ${formatYears(dr.years)} (${TIERS[dr.tier].color}): ${msg}`);
    } else hud.showPrompt(null);
    this.drawMinimap();
  }
}
