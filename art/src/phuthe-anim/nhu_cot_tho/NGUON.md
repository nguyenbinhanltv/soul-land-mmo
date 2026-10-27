# Nhu C?t Th? ? ph? th? ho?t ?nh l? 3

Part of #1025. Ng?y 2026-10-28. **?? l?m b??c 1?6; CH?N m?t, kh?ng nh?p game**, gi? nh?nh c?. Ch? repo ch?nh r?p sau.

C?ng c? duy nh?t: builtin `image_gen.imagegen` c?a Codex; model/seed unknown. RAW nguy?n byte, kh?ng h?u k?. Prompt nguy?n kh?i text do `phuthe-sheet-prompt.mjs --concept-ref` sinh, kh?ng vi?t tay/addendum. N?m #00D0D0, v?ch #7A5CFF, n?n #FF00FF, khung 96. Hai ?nh tham chi?u m?i l??t theo th? t?: b?ng n?m t??ng ?ng trong `references/`, concept `art/src/vohon-v2/nhu_cot_tho/concept-attempt3.png`. Kh?ng d?ng ?nh c? ho?c l??t h?ng l?m tham chi?u. A3/B1/C2/D1/E1 ???c ch?n c?t ch?n ?o?n; kh?ng ch?ng nh?n ??t ??p.

| RAW | L??t | Ch?n / nh? ri?ng t? | SHA256 ?nh | SHA256 prompt |
|---|---:|---|---|---|
| `candidates/toA-attempt1.png` | 1 | 0 / 42 | `131ddd204a6d59aca3d40173ef0f5f342b9756b908e2e8297e2f55ef2cdf3d71` | `adb5f4eac7147120a7b3aa32239f6607278810ceb1eaa43f986fe6c4938b9842` |
| `candidates/toA-attempt2.png` | 2 | 0 / 37 | `c0d815ac1aaab656d76cbd678b9540c4b227b8759a72f163a04a772c18b75975` | `33d7b7becc9ff41d305b9b787193d467ce43e2fa005b9d7f164cdbfa7591cdfd` |
| `candidates/toC-attempt1.png` | 1 | 1 / 0 | `0837fb2befa7062a2da1b0746a7e61e741822431a6508cc0470056116ff61db4` | `f0aefde06e1bd702261c8011017d2310f30db5ef044ccf821a86fa00d8245b43` |
| `toA.png` | 3 | 0 / 37 | `7e23649fc0c71b56fdcfad5dac51a6df4a2170b8ef81da97043e2f575776d34d` | `f9901b73345f44a72946358ddf4a4c41a61c8e09b6dc77bf53916ab9e2816738` |
| `toB.png` | 1 | 0 / 37 | `e0a005454297a7da26b5cd2779c52ac60d153ea61f3e987c06781565db4d26ca` | `c20b2ef1a0f020d081faaebf126905d0c257be0914eca44555849833d3950401` |
| `toC.png` | 2 | 0 / 27 | `531035513e569cfd33769f4cc427f776fabd6df2b9a5b4e7ca57e19e00125700` | `eefc5b9b2101546ad4303af16c5721bb01cfe6f0ad70658bcb14c8fae9e7b5d7` |
| `toD.png` | 1 | 0 / 31 | `2ec296e3e9b7ca2c86bad4dbb09565dafef4c0503ea7d835ac3ac22e97bcde6f` | `46201cf1eee584b75264f5d10dbbad2071d9d1e8b67a1eb9fce9ad1a34f22a04` |
| `toE.png` | 1 | 0 / 26 | `c7ccd4013b31153000db9213cdcbba5467b8f6aa0a761bcdb038525eefabb77f` | `09ab8d7e9090b7916aa4ca8a351d3ec787e5ead92544358a46fae79e9172bc66` |

M?i source JSON ch?a SHA256 t?ng tham chi?u, k?t qu? ki?m ??y ?? v? nh?n x?t m?t. Ki?m chung n?m t? sau ch?n: A 0/37, B 0/38, C 0/28, D 0/32, E 0/27. C1 b? h?nh d?nh ? cast (2/4), c?c l??t lo?i gi? trong candidates. A ?? tr?n 3/3; B1, C2, D1, E1.

## Khai m?t

```text
--eye "A?E=n?m/ph? th? ? to?n b? ? n?m nh?/d?i xu?ng; c?n ??u/th?n th? ph?a sau; ?i?m g?n cao, c? x?n m?p khi r?p; ch?n nh?p"
--eye "toD=h??ng ? ne ? g?n e/l? m?t; ch? khai, kh?ng sinh ri?ng s?a m?t"
--eye "toE=h??ng ? n walk/attack ? l? m?t/quay ngang; ch? khai, kh?ng sinh ri?ng s?a m?t"
```

## C?t, neo, preview

Artifact: `C:/Users/PC/.ao/data/artifacts/soul_land_game-707/nhu_cot_tho/preview/index.html`; c? GIF nam/n? 5 clip, n?m h??ng g?c v? ba h??ng l?t; `xoay-vong.html`. `lop.json` chia tai/ch?n tr??c, ?u?i sau; ne/n tr??c. C?t 110 khung, 32 m?u: 0 block / 117 warn, l??i gap c? n?m t?. Neo t? t?nh ? artifact `anchor.json`, scale 1; ch? ?o idle, kh?ng ch?ng nh?n ?i?m g?n m?i clip. Preview chu?n ch?a ?p neo; kh?ng ch?p manifest/neo v?o game. So?t idle nam/n?: tai cao v? x?n m?p, se/ne g?n e; ch?a ??t r?p.

L?nh t?i t?o (OUT = artifact tr?n):

```text
npm run phuthe:check -- nhu_cot_tho --out <temp>
node tools/assets/phuthe-sheet-cut.mjs --id nhu_cot_tho --sheet A=art/src/phuthe-anim/nhu_cot_tho/toA.png --sheet B=art/src/phuthe-anim/nhu_cot_tho/toB.png --sheet C=art/src/phuthe-anim/nhu_cot_tho/toC.png --sheet D=art/src/phuthe-anim/nhu_cot_tho/toD.png --sheet E=art/src/phuthe-anim/nhu_cot_tho/toE.png --out <OUT>
node tools/assets/phuthe-anchor.mjs --id nhu_cot_tho --source anim --dir <OUT> --out <OUT>/anchor.json
node tools/assets/phuthe-sheet-preview.mjs --id nhu_cot_tho --dir <OUT>
```

## Ghi c?ng

| File | Key | C?ng c? | M? t? / prompt | Ng?y | Ghi ch? |
|---|---|---|---|---|---|
| `to{A..E}.png`, `candidates/to*-attempt*.png` | - | builtin image_gen.imagegen (Codex) | Prompt direction t? sinh, h? s? SHA256 ?i k?m | 2026-10-28 | Ch? c?t ch?n ?o?n, kh?ng nh?p game |
| `references/*-nom-to*.png` | - | phuthe-sheet-dummy.mjs, LPC hi?n c? | B?ng n?m ??ng b??c th?n v? v?ch | 2026-10-28 | Ngu?n LPC theo h? s? s?n c? |

## So s?nh sau neo v? ki?m chung

Trang `C:/Users/PC/.ao/data/artifacts/soul_land_game-707/nhu_cot_tho/so-sanh-neo.html` so tr??c/sau, ?? nam/n?, 5 clip, 5 h??ng g?c. Sheet artifact `neo/` bi?n ??i nearest-neighbor t?ng khung quanh g?c ch?n (48,74), scale r?i dx/dy t? anchor.json; kh?ng s?a RAW. Sau neo v?n che th?n/x?n m?p, ?i?m g?n ch?a ??t; kh?ng nh?p game.

Ki?m chung l?: `npm run check` v? `npm run build` ??t; bot RAM `npm run bot:local -- --only view` ??t 91/91, RSS ??nh server 144 MB / bot 124 MB. Kh?ng ??i server/SQL n?n kh?ng ch?y PostgreSQL.
