// Ánh sáng theo vùng (bước 10.7, GAME_DESIGN.md mục 5.11 "Ánh sáng và chiều sâu", phong cách A và B):
// - Light2D của Phaser qua pipeline riêng `IsoLight`: ánh sáng trên mặt đất, vật đứng tắt dần theo elip 2:1 (đúng phép chiếu);
//   thực thể (hồn sư, hồn thú, NPC) dùng `IsoLightE`: tắt dần theo hình tròn (soi cả thân đứng) và màu môi trường nâng về trắng
//   ENTITY_LIFT, nên ban đêm hồn sư, hồn thú vẫn nổi trên nền.
// - Màu môi trường (ambient) ngày / đêm theo bảng REGIONS, chu kỳ theo giờ Việt Nam (chỉ ở client, không ảnh hưởng luật); thay lớp
//   vignette cũ.
// - Nguồn sáng: GameScene gom hồn hoàn, mắt hồn thú, hồn kỹ, hồn hoàn rơi; IsoMap báo vật phát sáng trong tầm (GLOW_PROPS, ánh cửa
//   nhà, mặt nước phát sáng). Mỗi khung chọn tối đa `maxLights` nguồn: hồn lực trước, rồi gần tâm camera.
// - Chỉ có Canvas (hoặc `?light=0`) thì tắt hẳn: không pipeline, không ambient, ảnh như chưa có ánh sáng.
// Số ở đây là hằng hiển thị của client, không phải số cân bằng.
import Phaser from "phaser";

const params = typeof location !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams();
/** `?light=0`: tắt ánh sáng (so khung hình, khắc phục máy yếu); `?light=1`: luôn bật (kể cả WebGL phần mềm, không tự tắt khi chậm). */
export const LIGHT_OFF = params.get("light") === "0", LIGHT_FORCE = params.get("light") === "1";
/**
 * Số đèn tối đa cùng lúc gần camera (Phaser `maxLights`, mục 5.11 "Ánh sáng và chiều sâu"): máy cảm ứng (điện thoại) 6 cho nhẹ; `?den=N` để thử.
 * Đặt vào cấu hình game (main.ts) vì shader dịch theo số này.
 */
export const MAX_LIGHTS = Math.max(1, Math.min(16, Number(params.get("den")) ||
  (typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches ? 6 : 10)));
/** `?gio=HH:MM`: đứng yên đồng hồ ngày / đêm ở giờ đó (chụp ảnh, kiểm thử). */
const CLOCK = (() => {
  const m = /^(\d{1,2})(?::(\d{2}))?$/.exec(params.get("gio") ?? "");
  return m ? (+m[1] % 24) + (+(m[2] ?? 0)) / 60 : null;
})();

/** Ánh sáng bật được: WebGL và không tắt bằng `?light=0`. */
export const lightingOn = (game: Phaser.Game) => game.renderer.type === Phaser.WEBGL && !LIGHT_OFF && (LIGHT_FORCE || !softwareGL(game));
/**
 * WebGL chạy bằng CPU (SwiftShader, llvmpipe… khi trình duyệt chặn GPU): Light2D chậm vài lần (đo ở 10.7: 11 → 2,5 khung / giây),
 * nên coi như chỉ có Canvas về mặt ánh sáng.
 */
let soft: boolean | null = null;
function softwareGL(game: Phaser.Game) {
  if (soft === null) {
    const gl = (game.renderer as Phaser.Renderer.WebGL.WebGLRenderer).gl, x = gl?.getExtension("WEBGL_debug_renderer_info");
    soft = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(x ? String(gl.getParameter(x.UNMASKED_RENDERER_WEBGL)) : "");
  }
  return soft;
}
/** Tự tắt ánh sáng khi khung hình trung bình dưới AUTO_OFF_FPS suốt AUTO_OFF_MS (sau AUTO_OFF_WARM đầu tiên của bản đồ). */
const AUTO_OFF_FPS = 24, AUTO_OFF_MS = 4000, AUTO_OFF_WARM = 5000;

/** Pipeline cho nền / vật đứng và cho thực thể. */
const WORLD = "IsoLight", ENTITY = "IsoLightE";
/** Thực thể nhận màu môi trường kéo về trắng chừng này (0 = như nền, 1 = luôn sáng đủ). */
const ENTITY_LIFT = 0.42;
/** Tổng ánh sáng (môi trường + đèn) tối đa: không nguồn nào làm mặt đất trắng xóa (mục 5.11 "Độ tương phản"). */
const LIGHT_CAP = 1.3;

/**
 * Light2D cho phép chiếu isometric: khoảng cách tới đèn tính bằng pixel nội bộ (chia hệ số phóng camera), trục dọc nhân `uShape.x`
 * (2: elip 2:1 trên mặt đất; 1: tròn cho thân đứng), suy giảm (1 − d²/r²)², normal map chỉ thêm sáng tối cục bộ (60% luôn sáng,
 * 40% theo góc), màu môi trường nâng về trắng `uShape.y`. Cùng tên uniform với LightPipeline của Phaser (onRender đặt sẵn).
 */
const FRAG = `
#define SHADER_NAME ISO_LIGHT_FS
precision mediump float;
struct Light { vec2 position; vec3 color; float intensity; float radius; };
const int kMaxLights = %LIGHT_COUNT%;
uniform vec4 uCamera;
uniform sampler2D uMainSampler;
uniform sampler2D uNormSampler;
uniform vec3 uAmbientLightColor;
uniform Light uLights[kMaxLights];
uniform mat3 uInverseRotationMatrix;
uniform int uLightCount;
uniform vec2 uShape;
varying vec2 outTexCoord;
varying float outTexId;
varying float outTintEffect;
varying vec4 outTint;
void main () {
  vec4 texel = vec4(outTint.bgr * outTint.a, outTint.a);
  vec4 texture = texture2D(uMainSampler, outTexCoord);
  vec4 color = texture * texel;
  if (outTintEffect == 1.0) color.rgb = mix(texture.rgb, outTint.bgr * outTint.a, texture.a);
  else if (outTintEffect == 2.0) color = texel;
  vec3 normal = normalize(uInverseRotationMatrix * (texture2D(uNormSampler, outTexCoord).rgb * 2.0 - 1.0));
  vec3 sum = mix(uAmbientLightColor, vec3(1.0), uShape.y);
  for (int i = 0; i < kMaxLights; ++i) {
    if (i >= uLightCount) break;
    Light L = uLights[i];
    vec2 d = (L.position - gl_FragCoord.xy) / uCamera.w;
    vec2 e = vec2(d.x, d.y * uShape.x);
    float q = clamp(1.0 - dot(e, e) / (L.radius * L.radius), 0.0, 1.0);
    if (q > 0.0) {
      float diff = 0.6 + 0.4 * max(dot(normal, normalize(vec3(d, 14.0))), 0.0);
      sum += L.color * (L.intensity * q * q * diff);
    }
  }
  gl_FragColor = vec4(color.rgb * min(sum, vec3(${LIGHT_CAP.toFixed(2)})), color.a);
}`;

class IsoLight extends Phaser.Renderer.WebGL.Pipelines.LightPipeline {
  constructor(game: Phaser.Game, private flatY: number, private lift: number) { super({ game, fragShader: FRAG }); }
  onRender(scene: Phaser.Scene, camera: Phaser.Cameras.Scene2D.Camera) {
    super.onRender(scene, camera);
    if (this.lightsActive) this.set2f("uShape", this.flatY, this.lift);
  }
}

/**
 * Bảng vùng (mục 5.11 phong cách B, bảng các vùng): màu môi trường ngày / đêm (`always`: vùng không đổi theo giờ), hệ số cường độ
 * đèn `dim` (tuyết, cát sáng sẵn nên đèn khoảng một nửa), ánh cửa nhà ban đêm `house` (ánh bếp, đèn lồng), mặt nước phát sáng `water`.
 * Màu nhấn lấy từ art/palettes/<mapId>.gpl.
 */
export interface Region { day: string; night: string; always?: "day" | "night"; dim?: number; house?: string; water?: { col: string; night?: boolean } }
export const REGIONS: Record<string, Region> = {
  thanh_hon_thon:     { day: "#fff2d8", night: "#8a7c94", house: "#ffb04a" },             // nắng ấm vàng; đêm cam ánh bếp
  nac_dinh_thanh:     { day: "#f4f0ea", night: "#7c7690", house: "#d8402a" },             // đêm đèn lồng đỏ
  tinh_dau_ngoai_vi:  { day: "#eef4dc", night: "#6e8098" },                               // nắng lốm đốm; đêm lam thẫm
  tinh_dau_noi_dia:   { day: "#d6e6de", night: "#7a8aa8" },                               // ngày như chiều; đêm lam đen (vẫn đọc được địa hình)
  thien_dau_thanh:    { day: "#fffaf0", night: "#7e809c", house: "#ffd27a" },             // đêm đèn vàng
  lac_nhat_sam_lam:   { day: "#ffd8b8", night: "#b48088" },                               // luôn hoàng hôn; "đêm" đỏ sẫm
  cuc_bac_chi_dia:    { day: "#eef4ff", night: "#6c7c9c", dim: 0.5 },                     // trắng lạnh; đêm lam đen + cực quang
  hai_than_dao:       { day: "#fff8e4", night: "#6a8a98", dim: 0.7, water: { col: "#4ac8c8", night: true } }, // đêm sóng phát quang
  loi_tinh_dau:       { day: "#8e8cb6", night: "#8e8cb6", always: "night", water: { col: "#6ab0f0" } },       // luôn đêm, hồ phát sáng
  dai_dau_hon_truong: { day: "#f4dcc0", night: "#f4dcc0", always: "day", dim: 0.6 },      // luôn sáng đuốc
};
const DEFAULT_REGION: Region = { day: "#ffffff", night: "#8088a0" };

/**
 * Vật phát sáng (tên vật trong shared/assets/iso/tiles.json): màu, bán kính (pixel nội bộ), cường độ, độ cao điểm sáng trên chân vật,
 * lập lòe (lửa). Yếu hơn và ít hơn nguồn hồn lực (phong cách A).
 */
export const GLOW_PROPS: Record<string, { col: string; r: number; i: number; h: number; flicker?: boolean }> = {
  lua_trai:      { col: "#ff9a3c", r: 64, i: 0.75, h: 8, flicker: true },
  lo_lua_dong:   { col: "#ffa040", r: 72, i: 0.75, h: 22, flicker: true },
  lo_ren_lang:   { col: "#ff8a3a", r: 56, i: 0.6, h: 14, flicker: true },
  cot_den_do:    { col: "#ffd27a", r: 56, i: 0.55, h: 34 },
  cot_den_hai_than: { col: "#8af0e8", r: 56, i: 0.55, h: 34 },
  hai_dang:      { col: "#ffe08a", r: 80, i: 0.6, h: 60 },
  bang_tinh:     { col: "#8ac8f0", r: 44, i: 0.4, h: 14 },
  cum_bang_tinh: { col: "#8ac8f0", r: 44, i: 0.4, h: 12 },
  cot_bang:      { col: "#8ac8f0", r: 40, i: 0.35, h: 18 },
  nam_khong_lo:  { col: "#5ae0d0", r: 56, i: 0.5, h: 24 },
  nam_xanh_cum:  { col: "#5ae0d0", r: 40, i: 0.4, h: 8 },
  co_thu_phat_quang: { col: "#b0fff0", r: 56, i: 0.45, h: 40 },
  duong_xi_sang: { col: "#b0fff0", r: 36, i: 0.35, h: 8 },
  bui_qua_sang:  { col: "#ffe08a", r: 36, i: 0.35, h: 8 },
  tinh_the_tim:  { col: "#c99bff", r: 44, i: 0.45, h: 14 },
};
/** Ánh cửa nhà ban đêm và mặt nước phát sáng: bán kính, cường độ. */
const HOUSE_LIGHT = { r: 72, i: 0.8 }, WATER_LIGHT = { r: 70, i: 0.45 };

/** Một nguồn sáng ứng viên trong khung này: tọa độ màn hình (không gian camera), màu, bán kính (pixel nội bộ), cường độ, độ ưu tiên. */
export interface LightSrc { x: number; y: number; col: number; r: number; i: number; p: number }
/** Độ ưu tiên: hồn kỹ, chính mình, hồn sư khác, hồn thú / hồn hoàn rơi, vật phát sáng. */
export const PRIO = { skill: 6, me: 5, player: 4, beast: 3, drop: 3, prop: 1 } as const;

const hexNum = (c: string) => parseInt(c.slice(1), 16);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerpCol = (a: number, b: number, t: number) => {
  const ch = (s: number) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};

/** Giờ Việt Nam (0–24, có phần lẻ), hoặc giờ đứng yên `?gio=`. */
export const vnHour = () => CLOCK ?? (((Date.now() / 3600000 + 7) % 24) + 24) % 24;
/** Mức ngày 0..1: ngày 06:00–18:00, chuyển dần nửa giờ trước và sau mỗi mốc. */
export function dayness(region: Region, h = vnHour()) {
  if (region.always) return region.always === "day" ? 1 : 0;
  const s = (a: number, b: number) => clamp01((h - a) / (b - a));
  return s(5.5, 6.5) * (1 - s(17.5, 18.5));
}

/**
 * Gắn normal map đã tải (texture `${key}_n`, tools/assets/normal.mjs) vào texture `to` (mặc định chính `key`; bản nhân màu /
 * hoán màu cùng cỡ dùng chung normal map của ảnh gốc). Không có normal map thì Light2D coi mặt phẳng.
 */
export function attachNormal(scene: Phaser.Scene, key: string, to = key) {
  if (!lightingOn(scene.game) || !scene.textures.exists(`${key}_n`) || !scene.textures.exists(to)) return;
  const t = scene.textures.get(to);
  if (!t.dataSource.length) t.setDataSource(scene.textures.get(`${key}_n`).getSourceImage() as HTMLImageElement);
}

export class Lighting {
  /** Đang dùng Light2D (WebGL, không `?light=0`). */
  on: boolean;
  readonly region: Region;
  private pool: Phaser.GameObjects.Light[] = [];
  /** Ánh sáng tạm của hồn kỹ (vòng lan, vùng chiêu): bùng lên rồi tắt trong `ms`. */
  private flashes: { x: number; y: number; col: number; r: number; i: number; t0: number; ms: number }[] = [];
  /** Lúc tắt hẳn của ánh chớp sét (nâng màu môi trường tạm thời, thời tiết Lôi Cốc). */
  private boltUntil = 0;
  private day: number; private night: number;
  /** Đo khung hình cho tự tắt: lúc bắt đầu bản đồ, lúc bắt đầu quãng đang chậm (0 = không chậm). */
  private t0 = -1; private slowSince = 0;
  /** Gọi khi ánh sáng tự tắt vì máy chậm (GameScene báo vào khung tin). */
  onAutoOff: () => void = () => {};

  constructor(private scene: Phaser.Scene, mapId: string) {
    this.region = REGIONS[mapId] ?? DEFAULT_REGION;
    this.day = hexNum(this.region.day); this.night = hexNum(this.region.night);
    this.on = lightingOn(scene.game);
    if (!this.on) return;
    const pipes = (scene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer).pipelines;
    if (!pipes.has(WORLD)) { pipes.add(WORLD, new IsoLight(scene.game, 2, 0)); pipes.add(ENTITY, new IsoLight(scene.game, 1, ENTITY_LIFT)); }
    scene.lights.enable();
    for (let k = 0; k < scene.lights.getMaxVisibleLights(); k++) this.pool.push(scene.lights.addLight(0, 0, 1, 0xffffff, 0).setVisible(false));
  }

  /**
   * Tắt hẳn ánh sáng giữa chừng (máy chậm): mọi ảnh đang dùng pipeline ánh sáng (kể cả lớp trong khung chứa hồn sư) về pipeline
   * mặc định, tắt Light2D; ảnh tạo sau không đặt pipeline nữa (world / entity xem `on`). Hạt bay vẫn chạy.
   */
  disable() {
    if (!this.on) return;
    this.on = false;
    const walk = (list: Phaser.GameObjects.GameObject[]) => {
      for (const o of list) {
        const p = o as unknown as Phaser.GameObjects.Components.Pipeline;
        if (p.pipeline && (p.pipeline.name === WORLD || p.pipeline.name === ENTITY)) p.resetPipeline();
        if (o instanceof Phaser.GameObjects.Container) walk(o.list);
      }
    };
    walk(this.scene.children.list);
    for (const l of this.pool) l.setVisible(false);
    this.scene.lights.disable();
    this.onAutoOff();
  }

  /** Nền, vật đứng, nhà: chịu ánh sáng elip trên mặt đất. */
  world<T extends Phaser.GameObjects.Components.Pipeline>(o: T): T { if (this.on) o.setPipeline(WORLD); return o; }
  /** Hồn sư, hồn thú, NPC: chịu ánh sáng tròn, màu môi trường nâng về trắng. */
  entity<T extends Phaser.GameObjects.Components.Pipeline>(o: T): T { if (this.on) o.setPipeline(ENTITY); return o; }

  /** Mức đêm 0..1 hiện tại (hạt bay ban đêm, ánh cửa nhà, cực quang). */
  nightness() { return 1 - dayness(this.region); }

  /** Hồn kỹ soi mặt đất: ánh sáng màu `col` ở điểm màn hình (x, y), bán kính `r` pixel nội bộ, bùng lên rồi tắt trong `ms`. */
  flash(x: number, y: number, col: string | number, r: number, ms: number, i = 1) {
    if (!this.on) return;
    this.flashes.push({ x, y, col: typeof col === "number" ? col : hexNum(col), r: Math.max(24, Math.min(220, r)), i, t0: this.scene.time.now, ms });
    if (this.flashes.length > 8) this.flashes.shift();
  }
  /** Ánh chớp sét: màu môi trường sáng bừng `ms` mili giây. */
  bolt(ms: number) { this.boltUntil = Math.max(this.boltUntil, this.scene.time.now + ms); }

  /**
   * Mỗi khung: màu môi trường theo giờ, rồi gán các nguồn sáng ứng viên (`srcs`, cộng vật phát sáng `props` trong tầm và ánh hồn kỹ)
   * vào các đèn có sẵn, ưu tiên hồn lực rồi gần tâm camera.
   */
  update(time: number, cam: Phaser.Cameras.Scene2D.Camera, srcs: LightSrc[], props: Iterable<{ x: number; y: number; kind: string }>) {
    if (!this.on) return;
    if (!LIGHT_FORCE) {
      if (this.t0 < 0) this.t0 = time;
      const fps = this.scene.game.loop.actualFps;
      if (time - this.t0 > AUTO_OFF_WARM && fps < AUTO_OFF_FPS) { this.slowSince ||= time; if (time - this.slowSince > AUTO_OFF_MS) return this.disable(); }
      else this.slowSince = 0;
    }
    const day = dayness(this.region), night = 1 - day;
    let amb = lerpCol(this.night, this.day, day);
    if (time < this.boltUntil) amb = lerpCol(amb, 0xe0f0ff, 0.55);
    this.scene.lights.setAmbientColor(amb);
    // Ban ngày đèn khó thấy và dễ làm cháy sáng: giảm cường độ; tuyết, cát giảm thêm theo `dim`.
    const k = (1 - 0.5 * day) * (this.region.dim ?? 1);
    const all: LightSrc[] = [];
    for (const s of srcs) all.push({ ...s, i: s.i * k });
    this.flashes = this.flashes.filter((f) => time < f.t0 + f.ms);
    for (const f of this.flashes) {
      const e = (time - f.t0) / f.ms, up = Math.min(1, e * 6);
      all.push({ x: f.x, y: f.y, col: f.col, r: f.r * (0.6 + 0.4 * up), i: f.i * up * (1 - e) * (1 - 0.35 * day), p: PRIO.skill });
    }
    for (const g of props) {
      if (g.kind === "house") {
        if (this.region.house && night > 0.05) all.push({ x: g.x, y: g.y, col: hexNum(this.region.house), r: HOUSE_LIGHT.r, i: HOUSE_LIGHT.i * night * k, p: PRIO.prop });
      } else if (g.kind === "water") {
        const w = this.region.water, on = w && (w.night ? night : 1);
        if (w && on) all.push({ x: g.x, y: g.y, col: hexNum(w.col), r: WATER_LIGHT.r, i: WATER_LIGHT.i * (0.8 + 0.2 * Math.sin(time / 900 + g.x)) * on * k, p: PRIO.prop });
      } else {
        const d = GLOW_PROPS[g.kind]; if (!d) continue;
        const fl = d.flicker ? 0.85 + 0.1 * Math.sin(time / 90 + g.x) + 0.05 * Math.sin(time / 37 + g.y) : 1;
        all.push({ x: g.x, y: g.y - d.h, col: hexNum(d.col), r: d.r, i: d.i * fl * k, p: PRIO.prop });
      }
    }
    const v = cam.worldView, cx = v.centerX, cy = v.centerY;
    const pick = all.filter((s) => s.i > 0.01 && s.x + s.r > v.x && s.x - s.r < v.right && s.y + s.r > v.y && s.y - s.r < v.bottom)
      .sort((a, b) => b.p - a.p || Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy));
    this.pool.forEach((l, n) => {
      const s = pick[n];
      if (!s) { if (l.visible) l.setVisible(false); return; }
      l.setVisible(true).setPosition(s.x, s.y).setColor(s.col).setRadius(s.r).setIntensity(s.i);
    });
  }
}
