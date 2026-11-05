// #1815 lô B nhóm 3: lớp vẽ sprite trạng thái pixelfx. Mỗi khung gọi `begin()`, `put()` cho từng thân, `end()`: pool Image dùng lại (không tạo mới mỗi khung),
// khung hình theo đồng hồ client (lặp), Giảm chuyển động: một khung giữa đứng yên. Người khác mờ hơn chính mình.
import Phaser from "phaser";
import { SPR } from "./iso.ts";
import { fxLevel, fxPrefs } from "./combatFx.ts";
import { pfxMetaOf } from "./pixelfx.ts";
import { STATUS_PFX_CAP, STATUS_PFX_STYLE, STATUS_PFX_DEPTH } from "./statusPfx.ts";

const snap = (v: number) => Math.round(v / SPR) * SPR;

export class StatusPfxLayer {
  private live = new Map<string, Phaser.GameObjects.Image>();
  private free: Phaser.GameObjects.Image[] = [];
  private seen = new Set<string>();
  constructor(private scene: Phaser.Scene, private depth = STATUS_PFX_DEPTH) {}
  get active() { return this.live.size; }
  get pooled() { return this.live.size + this.free.length; }

  begin() { this.seen.clear(); }

  /** Đặt sprite `key` của thân `owner` với chân ở (x, y). false khi chưa có texture / meta hoặc quá trần theo mức. */
  put(owner: string, key: string, x: number, y: number, time: number, mine: boolean): boolean {
    const id = `${owner}|${key}`, m = pfxMetaOf(key);
    if (!m || !this.scene.textures.exists(key)) return false;
    let img = this.live.get(id);
    if (!img) {
      if (this.live.size >= STATUS_PFX_CAP[fxLevel()]) return false;
      img = this.free.pop() ?? this.scene.add.image(0, 0, key).setBlendMode(Phaser.BlendModes.ADD);
      img.setTexture(key, 0).setDepth(this.depth).setScale(SPR).setActive(true).setVisible(true);
      this.live.set(id, img);
    }
    this.seen.add(id);
    const frames = Math.max(1, (this.scene.textures.get(key).frameTotal - 1)), n = Math.min(frames, m.frames ?? frames);
    const f = fxPrefs.reduce ? n >> 1 : Math.floor((time * m.fps) / 1000) % n;
    const st = STATUS_PFX_STYLE[key], k = st?.k ?? 1, a = st?.alpha;
    img.setFrame(f).setScale(SPR * k).setPosition(snap(x), snap(y - (m.pivot[1] - m.frame[1] / 2) * SPR * k)).setAlpha(a !== undefined ? (mine ? a : a * 0.75) : mine ? 0.9 : 0.65);
    return true;
  }

  /** Trả pool những thân không còn được đặt trong khung này (hết trạng thái, ra khỏi tầm). */
  end() {
    for (const [id, img] of this.live) if (!this.seen.has(id)) { img.setVisible(false).setActive(false); this.free.push(img); this.live.delete(id); }
  }
  destroy() { for (const i of this.live.values()) i.destroy(); for (const i of this.free) i.destroy(); this.live.clear(); this.free = []; }
}
