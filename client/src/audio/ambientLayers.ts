// Môi trường lớp chồng (G5, #396): gió, sóng, chim ngày, côn trùng đêm, lửa trại, chuông chùa phát ngẫu nhiên theo bản đồ và ngày đêm,
// chồng lên nhạc nền và tiếng nền vùng (ambient/*.ogg). Chỉ là bộ hẹn giờ thuần: AudioManager truyền hàm phát, GameScene truyền ngữ cảnh
// (bản đồ, mức đêm, khoảng cách tới lửa gần nhất). Bảng dưới là khoảng cách trung bình giữa hai lần phát (giây), không phải số cân bằng game.

export type AmbientKind = "wind" | "wave" | "bird" | "cricket" | "fire" | "bell";
export type AmbientProfile = Partial<Record<AmbientKind, number>>;

/** Trung bình bao nhiêu giây một lần; thiếu = bản đồ không có tiếng đó. Chim chỉ ban ngày, côn trùng chỉ ban đêm, lửa chỉ khi đứng gần vật cháy. */
export const AMBIENT_PROFILES: Readonly<Record<string, AmbientProfile>> = {
  thanh_hon_thon: { wind: 20, bird: 7, cricket: 6, bell: 55, fire: 4 },
  nac_dinh_thanh: { wind: 26, bird: 9, cricket: 8, bell: 45, fire: 4 },
  thien_dau_thanh: { wind: 24, bird: 9, cricket: 8, bell: 40, fire: 4 },
  tinh_dau_ngoai_vi: { wind: 14, bird: 6, cricket: 5, fire: 4 },
  tinh_dau_noi_dia: { wind: 13, bird: 9, cricket: 5, fire: 4 },
  lac_nhat_sam_lam: { wind: 20, bird: 12, cricket: 6, fire: 4 },
  cuc_bac_chi_dia: { wind: 7, fire: 4 },
  hai_than_dao: { wave: 6, wind: 15, bird: 10, cricket: 8, fire: 4 },
  loi_tinh_dau: { wind: 25, wave: 12, cricket: 10 },
  dai_dau_hon_truong: { wind: 30, fire: 4 },
  // Sảnh thí luyện: gió nhẹ CC0 đã duyệt, không chim / côn trùng / chuông hay thêm nền vòng lặp.
  luyen_hon_canh: { wind: 18 },
};

/**
 * Nền vòng lặp theo bản đồ (#622, ambientBed.ts): file `audio/ambient/amb_nen_<mapId>.{ogg,m4a}`, đã cân -16 LUFS (tools/audio/bed.mjs).
 * `gain` là độ to khi đưa vào bus Môi trường (chốt khi nghe thử: nhạc khu giữ nguyên, nền nằm dưới, lớp chồng ngẫu nhiên vẫn nghe rõ).
 */
export const AMBIENT_BEDS: Readonly<Record<string, { gain: number }>> = {
  hai_than_dao: { gain: 0.55 },
  loi_tinh_dau: { gain: 0.7 },
  dai_dau_hon_truong: { gain: 0.8 },
};
/** Mờ ra / mờ vào chéo nhau khi đổi bản đồ (giây). */
export const AMBIENT_BED_FADE_S = 2;
/** Tải nền lỗi thì thử lại sau chừng này giây (không dồn dập theo nhịp 250 ms). */
export const AMBIENT_BED_RETRY_S = 15;
export const ambientBedFile = (mapId: string, format: "ogg" | "m4a") => `audio/ambient/amb_nen_${mapId}.${format}`;

/** Tên vật (shared/assets/iso/tiles.json) là lửa: lửa trại, lò lửa, lò rèn. */
export const AMBIENT_FIRE_PROPS: ReadonlySet<string> = new Set(["lua_trai", "lo_lua_dong", "lo_ren_lang"]);
/** Đứng cách vật cháy trong tầm này (pixel iso) mới nghe lửa; càng gần càng to. */
export const AMBIENT_FIRE_RANGE = 240;
/** Mức đêm 0..1 từ ngưỡng này thì mới có côn trùng; mức ngày (1 − đêm) từ ngưỡng này mới có chim. */
export const AMBIENT_DAYNIGHT_MIN = 0.3;
/** Ngẫu nhiên hóa khoảng hẹn: nhân 0,6 – 1,4. */
const JITTER = [0.6, 1.4] as const;
/** Gặp lúc chưa hợp (ban ngày mà đến lượt côn trùng) thì hẹn lại sau chừng này giây. */
const RETRY_S = 2;

export interface AmbientInput {
  mapId: string;
  /** 0 = ngày, 1 = đêm (Lighting.nightness). */
  night: number;
  /** Khoảng cách tới vật cháy gần nhất, null = không có vật cháy trong khung. */
  fireDist: number | null;
}

/** Một lần phát: loại tiếng, độ to 0..1 theo ngữ cảnh (lửa theo khoảng cách), lệch trái / phải ngẫu nhiên. */
export type AmbientPlayer = (kind: AmbientKind, volume: number, pan: number) => void;

export class AmbientLayers {
  private readonly play: AmbientPlayer;
  private readonly random: () => number;
  private readonly due = new Map<AmbientKind, number>();
  private mapId = "";

  constructor(play: AmbientPlayer, random: () => number = Math.random) {
    this.play = play;
    this.random = random;
  }

  /** Gọi mỗi vài khung (cần `nowMs` tăng dần). Đổi bản đồ thì hẹn lại từ đầu, lần phát đầu rải ngẫu nhiên trong nửa khoảng. */
  update(nowMs: number, input: AmbientInput): void {
    const profile = AMBIENT_PROFILES[input.mapId];
    if (input.mapId !== this.mapId) {
      this.mapId = input.mapId;
      this.due.clear();
      for (const [kind, every] of Object.entries(profile ?? {}) as [AmbientKind, number][]) this.due.set(kind, nowMs + this.random() * every * 500);
    }
    if (!profile) return;
    for (const [kind, every] of Object.entries(profile) as [AmbientKind, number][]) {
      const due = this.due.get(kind);
      if (due === undefined || nowMs < due) continue;
      const volume = this.weight(kind, input);
      if (volume <= 0) { this.due.set(kind, nowMs + RETRY_S * 1000); continue; }
      this.play(kind, volume, (this.random() * 2 - 1) * 0.5);
      this.due.set(kind, nowMs + every * 1000 * (JITTER[0] + this.random() * (JITTER[1] - JITTER[0])));
    }
  }

  /** Độ to theo ngữ cảnh; 0 = bây giờ không hợp (ban ngày không có côn trùng, xa lửa không có tiếng lửa). */
  private weight(kind: AmbientKind, { night, fireDist }: AmbientInput): number {
    if (kind === "bird") return 1 - night >= AMBIENT_DAYNIGHT_MIN ? 1 - night : 0;
    if (kind === "cricket") return night >= AMBIENT_DAYNIGHT_MIN ? night : 0;
    if (kind === "fire") return fireDist !== null && fireDist < AMBIENT_FIRE_RANGE ? 1 - fireDist / AMBIENT_FIRE_RANGE : 0;
    return 1;
  }
}
