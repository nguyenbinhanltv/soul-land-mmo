// Spec họ I mảnh võ hồn (#1305), tách riêng để CLI kiểm không tạo vòng import.
import { loadKit } from "./ui-kit-lib.mjs";

export const shardKind = {
  id: "I", title: "khung mảnh võ hồn", shapes: ["1:1"], layouts: [[3]],
  div: 4, group: "icon", stretch: false, text: false, mirror: false,
  pieces: [
    { name: "SR broken paper shard frame with one clipped corner" },
    { name: "SSR hexagonal broken paper shard frame" },
    { name: "UR crown shaped broken paper shard frame with three broad tips" },
  ],
};
export const shardKit = () => { const kit = loadKit(); return { ...kit, kinds: { ...kit.kinds, I: shardKind } }; };
