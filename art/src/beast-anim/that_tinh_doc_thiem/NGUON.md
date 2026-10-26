# Thất Tinh Độc Thiềm — RAW H4 đợt 4

Part of #770. Part of #766.

LỖI: toA — pose/hướng — R1/R5/R9 C5–6; R7/R11 C4–6; R9–12 E — hurt ngửa bụng và xoay mặt thay vì giật lùi giữ hướng; attack có khung quay gần chính diện; E còn gần góc chéo, death chưa giữ profile; giữ nguyên RAW, không redraw/retry.

LỖI: toB — sai kích thước, heading/hurt/death và nền — R1–4 NE / R5–8 N; R1/R5 C5–6; R7C3; R8 — actual1254×1254 thay1024×1024; hurt ngửa bụng, attack/death đổi heading, nền lệch FF00FF; giữ RAW FAIL, không retry.

A106A1 và B108B1 mỗi fresh worker đúng1call, không retry; tổng loài2call. Owner101 chỉ tích hợp, vẫn đúng1call Thanh Lân A lịch sử. A1024×1536; B1254×1254 thật, yêu cầu1024×1024, không waiver. RAW gốc/artifact/shipping khớp byte, SHA/header/bytes trong từng source JSON. Model ảnh/seed unknown, không suy từ agent. Không crop/resize/cutter/assembly/postprocess/runtime import.

A exact = roleprefix591byte + nguyên BASE4097byte ở cuối. B exact = roleprefix681byte + nguyên BASE3520byte + hai LF + câu matching second sheet/body size; BASE không nằm cuối prompt thực. Doc generator giữ nguyên hướng dẫn lịch sử, nhưng owner mới chỉ1call, nộp FAIL, không redraw/cutter. Xung đột tail sway cho cóc không đuôi, cell171×6, hướng N/NE trong A, eyes-shut/death-sideways được giữ và ghi thật, không redesign.

A chỉ attach static106 identity đã VIEW; B ordered static106 rồi A106A1 style/body-size candidate còn FAIL. Không dùng A làm chuẩn pose/hướng hoặc coi đã art accepted. Nguồn static/RAW/prompt/HANDOFF hash giữ đúng đường dẫn thật trong source JSON.

B quan sát44hình semantic, các vị trí blank nhìn bằng mắt không có thêm hình sinh vật; không suy sạch ô từ đếm nền. ExactFF00FF A9/1572864, B17/1572516; đây là số pixel màu, không số frame/occupied cells. B hurt ngửa bụng; N attack/death xoay, NE death lệch heading; không xác nhận rearALL/noeyes/no-face toàn khối, bảy đốm mỗi khung, samebody-size hoặc motion loop. Submitted≠merged≠artaccepted≠imported.
