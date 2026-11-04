import type Phaser from "phaser";
import { MANIFEST_KEY } from "./sprites";

// Chỉ bật cho sheet đã soát tóc / cổ áo / tay ở đủ năm hàng hướng.
// Râu dài, tóc đuôi / bím dài, tóc xõa dài đi qua hàng 29 cần pose riêng (hai bộ thí điểm ở REPLY_POSES).
// dan_lao_nhan, dan_nho_sinh, dan_ban_rong, dan_nu_duoi_ngua, dan_thon_nu(_toc_tet), dan_tieu_thu, dan_khach, dau_hon_truong, linh_gac(_giao).
const REPLY_SHEETS = new Set([
  "lpc_dai_su", "lpc_thuong_nhan", "lpc_lo_ren", "lpc_thuong_nhan_thien_dau", "lpc_to_van_dao",
  // Đợt 2: ba NPC còn lại có tóc ngắn / búi gọn, tóc sau gáy chỉ thò xuống vài hàng dưới hàng 29.
  "lpc_phat_lan_duc", "lpc_su_gia_dau_hon", "lpc_thuong_nhan_luu_dong",
]);
const REPLY_POSES: Record<string, string> = {
  lpc_lao_kiet_khac: "npc_reply_lao_kiet_khac",
  lpc_lo_ren_thien_dau: "npc_reply_lo_ren_thien_dau",
};

/** Gật đầu một điểm ảnh theo mẫu Đại Sư đã duyệt, từ pose đứng đủ lớp.
 * Không dùng khung đánh / niệm phép, không dịch thân hoặc chân, không đổi idle gốc. */
export class NpcReply {
  private active: { body: Phaser.GameObjects.Sprite; head: Phaser.GameObjects.Sprite; idle: string; at: number; pose: boolean; visible: boolean } | null = null;

  start(body: Phaser.GameObjects.Sprite, idle: string, now: number, rig?: { id: string; lpc: string; ready: boolean }) {
    this.cancel();
    // Chỉ bộ nguồn đã soát; bộ ghép chưa duyệt/thiếu lớp hoặc sheet thiếu giữ idle.
    // Bộ ghép động phải khớp chuỗi LPC nguồn do importer ghi vào manifest.
    const rigKey = rig?.ready ? `npc_reply_${rig.id}` : undefined;
    const rigPose = rigKey && body.scene.cache.json.get(MANIFEST_KEY)?.sprites?.find((e: { key?: string; replyLpc?: string }) => e.key === rigKey);
    const poseKey = REPLY_POSES[body.texture.key] ?? (rig?.ready && rigPose?.replyLpc === rig.lpc && /^lpcc_[mf]_\d+$/.test(body.texture.key) ? rigKey : undefined);
    if ((!poseKey && !REPLY_SHEETS.has(body.texture.key)) || !body.parentContainer || !body.scene.anims.exists(idle)) return;
    const first = body.scene.anims.get(idle).frames[0]?.frame;
    if (!first || first.width !== 64 || first.height !== 64) return;
    const row = Math.floor(Number(first.name) / 24);
    // Pose riêng: năm khung s/se/e/ne/n, thiếu hoặc sai khung thì giữ idle, không cắt râu / tóc.
    if (poseKey) {
      if (!body.scene.textures.exists(poseKey)) return;
      const texture = body.scene.textures.get(poseKey);
      if (texture.source[0].width !== 320 || texture.source[0].height !== 64 || !texture.has(String(row))) return;
    }
    body.stop().setFrame(first.name);
    if (!poseKey) body.setCrop(0, 29, 64, 35);
    const head = body.scene.make.sprite({ key: poseKey ?? body.texture.key, frame: poseKey ? row : first.name }, false)
      .setOrigin(body.originX, body.originY).setScale(body.scaleX, body.scaleY)
      .setPosition(body.x, body.y).setFlip(body.flipX, body.flipY);
    if (poseKey) head.setVisible(false); else head.setCrop(0, 0, 64, 29);
    head.setPipeline(body.pipeline.name);
    body.parentContainer.add(head);
    this.active = { body, head, idle, at: now, pose: !!poseKey, visible: body.visible };
  }

  step(now: number, reduce: boolean) {
    const a = this.active; if (!a) return;
    const elapsed = now - a.at;
    if (reduce || elapsed >= 480) { this.cancel(); return; }
    const nod = elapsed >= 100 && elapsed < 320;
    if (a.pose) {
      a.head.setVisible(a.visible && nod);
      a.body.setVisible(a.visible && !nod);
    } else a.head.y = a.body.y + (nod ? a.body.scaleY : 0);
  }

  cancel() {
    const a = this.active; if (!a) return;
    this.active = null;
    a.head.destroy();
    if (a.body.scene && a.body.anims) a.body.setVisible(a.visible).setCrop().play(a.idle);
  }
}
