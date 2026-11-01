import type Phaser from "phaser";

/** Thí điểm Đại Sư: gật đầu một điểm ảnh từ pose đứng đã đủ tóc / áo / tay.
 * Không dùng khung đánh / niệm phép, không dịch thân hoặc chân, không đổi idle gốc. */
export class NpcReply {
  private active: { body: Phaser.GameObjects.Sprite; head: Phaser.GameObjects.Sprite; idle: string; at: number } | null = null;

  start(body: Phaser.GameObjects.Sprite, idle: string, now: number) {
    this.cancel();
    // Chỉ sheet đã kiểm bằng mắt; bộ ghép dự phòng / sheet thiếu vẫn đứng idle.
    if (body.texture.key !== "lpc_dai_su" || !body.parentContainer || !body.scene.anims.exists(idle)) return;
    const first = body.scene.anims.get(idle).frames[0]?.frame;
    if (!first || first.width !== 64 || first.height !== 64) return;
    body.stop().setFrame(first.name).setCrop(0, 29, 64, 35);
    const head = body.scene.make.sprite({ key: body.texture.key, frame: first.name }, false)
      .setOrigin(body.originX, body.originY).setScale(body.scaleX, body.scaleY)
      .setPosition(body.x, body.y).setFlip(body.flipX, body.flipY).setCrop(0, 0, 64, 29);
    head.setPipeline(body.pipeline.name);
    body.parentContainer.add(head);
    this.active = { body, head, idle, at: now };
  }

  step(now: number, reduce: boolean) {
    const a = this.active; if (!a) return;
    const elapsed = now - a.at;
    if (reduce || elapsed >= 480) { this.cancel(); return; }
    a.head.y = a.body.y + (elapsed >= 100 && elapsed < 320 ? a.body.scaleY : 0);
  }

  cancel() {
    const a = this.active; if (!a) return;
    this.active = null;
    a.head.destroy();
    if (a.body.scene && a.body.anims) a.body.setCrop().play(a.idle);
  }
}
