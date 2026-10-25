export type SfxId =
  | "ui_click" | "ui_panel_open" | "ui_panel_close" | "ui_confirm"
  | "combat_attack" | "combat_hit" | "combat_crit" | "combat_death" | "combat_heal" | "combat_shield" | "combat_status"
  | "skill_fire" | "skill_ice" | "skill_lightning" | "skill_poison" | "skill_light" | "skill_dark" | "skill_wood" | "skill_wind" | "skill_neutral"
  | "ring_absorb_start" | "ring_absorb_success" | "ring_absorb_fail" | "level_up" | "breakthrough" | "pickup" | "waypoint_cast"
  | "waypoint_go" | "teleport_unlock" | "boss_warn" | "boss_down" | "quest_accept" | "quest_ready" | "quest_reward" | "awaken";

export const SFX_IDS: readonly SfxId[] = [
  "ui_click", "ui_panel_open", "ui_panel_close", "ui_confirm",
  "combat_attack", "combat_hit", "combat_crit", "combat_death", "combat_heal", "combat_shield", "combat_status",
  "skill_fire", "skill_ice", "skill_lightning", "skill_poison", "skill_light", "skill_dark", "skill_wood", "skill_wind", "skill_neutral",
  "ring_absorb_start", "ring_absorb_success", "ring_absorb_fail", "level_up", "breakthrough", "pickup", "waypoint_cast",
  "waypoint_go", "teleport_unlock", "boss_warn", "boss_down", "quest_accept", "quest_ready", "quest_reward", "awaken",
];

export interface ZzFxParams {
  frequency: number;
  duration: number;
  attack: number;
  release: number;
  slide: number;
  noise: number;
  shape: OscillatorType;
  volume: number;
}

const p = (frequency: number, duration: number, shape: OscillatorType, volume = 0.22, slide = 0, noise = 0): ZzFxParams => ({
  frequency, duration, attack: 0.006, release: 0.06, slide, noise, shape, volume,
});

/** Tham số phát âm nhỏ, không phải số cân bằng gameplay. Mỗi hiệu ứng có thể đổi độc lập khi nghe demo. */
export const SFX_PARAMS: Readonly<Record<SfxId, ZzFxParams>> = {
  ui_click: p(560, 0.045, "square", 0.12, 100), ui_panel_open: p(300, 0.12, "sine", 0.16, 280), ui_panel_close: p(260, 0.1, "sine", 0.14, -180),
  ui_confirm: p(440, 0.12, "triangle", 0.16, 180),
  combat_attack: p(170, 0.09, "sawtooth", 0.19, 160, 0.08), combat_hit: p(100, 0.1, "square", 0.2, -20, 0.18), combat_crit: p(220, 0.16, "sawtooth", 0.25, 400, 0.12),
  combat_death: p(100, 0.34, "sawtooth", 0.22, -80, 0.12), combat_heal: p(520, 0.2, "sine", 0.18, 220), combat_shield: p(280, 0.2, "triangle", 0.18, 80), combat_status: p(190, 0.16, "square", 0.14, 80),
  skill_fire: p(180, 0.24, "sawtooth", 0.22, 480, 0.08), skill_ice: p(760, 0.26, "sine", 0.2, -180, 0.03), skill_lightning: p(920, 0.12, "square", 0.2, -300, 0.1), skill_poison: p(130, 0.32, "triangle", 0.18, 120, 0.08),
  skill_light: p(680, 0.24, "sine", 0.22, 260), skill_dark: p(90, 0.3, "sawtooth", 0.21, -40, 0.08), skill_wood: p(240, 0.25, "triangle", 0.18, 90, 0.04), skill_wind: p(540, 0.22, "sine", 0.18, 380, 0.06), skill_neutral: p(360, 0.18, "triangle", 0.17, 160, 0.04),
  ring_absorb_start: p(210, 0.28, "sine", 0.18, 160), ring_absorb_success: p(460, 0.34, "sine", 0.22, 420), ring_absorb_fail: p(150, 0.26, "sawtooth", 0.18, -120), level_up: p(420, 0.3, "triangle", 0.22, 360), breakthrough: p(300, 0.4, "sawtooth", 0.25, 700, 0.06),
  pickup: p(620, 0.08, "square", 0.13, 120), waypoint_cast: p(260, 0.4, "sine", 0.17, 180), waypoint_go: p(520, 0.34, "sine", 0.2, 500), teleport_unlock: p(700, 0.3, "triangle", 0.2, 360),
  boss_warn: p(95, 0.38, "sawtooth", 0.22, -20, 0.1), boss_down: p(180, 0.42, "sawtooth", 0.25, 500, 0.1), quest_accept: p(360, 0.13, "triangle", 0.14, 120), quest_ready: p(540, 0.16, "sine", 0.16, 200), quest_reward: p(660, 0.3, "sine", 0.2, 380), awaken: p(240, 0.45, "sine", 0.23, 600),
};
