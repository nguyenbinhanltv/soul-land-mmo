# Dựng tấm ghép chân dung võ hồn cho landing: shared/assets/ui/landing/vohon.webp (5x5 ô 64 px, theo thứ tự VOHON trong shared/data.ts).
# Dùng: node tools/landing-ids.mjs | python tools/landing-sheet.py   (đọc mã võ hồn mỗi dòng từ stdin)
import sys, os
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ids = [l.strip() for l in sys.stdin if l.strip()]
assert len(ids) <= 25, 'tấm ghép 5x5 chỉ chứa 25 võ hồn'
S = Image.new('RGBA', (5 * 64, 5 * 64))
for i, v in enumerate(ids):
    S.paste(Image.open(os.path.join(R, 'shared/assets/sprites/iso/portrait/%s.png' % v)).convert('RGBA'), ((i % 5) * 64, (i // 5) * 64))
S.save(os.path.join(R, 'shared/assets/ui/landing/vohon.webp'), 'WEBP', lossless=True, method=6)
