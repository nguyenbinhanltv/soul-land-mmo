// Danh mục bài: nhạc nền theo bản đồ (`maps` là mã trong MAPS của shared/data.ts), nhạc giao chiến và khúc ngắn theo sự kiện.
import cucBacChiDia from "./cuc_bac_chi_dia.mjs";
import daiDauHonTruong from "./dai_dau_hon_truong.mjs";
import giaoChienBoss from "./giao_chien_boss.mjs";
import haiThanDao from "./hai_than_dao.mjs";
import jingles from "./jingles.mjs";
import lacNhatSamLam from "./lac_nhat_sam_lam.mjs";
import loiTinhDau from "./loi_tinh_dau.mjs";
import nacDinhThanh from "./nac_dinh_thanh.mjs";
import thanhHonThon from "./thanh_hon_thon.mjs";
import thienDauThanh from "./thien_dau_thanh.mjs";
import tinhDauNgoaiVi from "./tinh_dau_ngoai_vi.mjs";
import tinhDauNoiDia from "./tinh_dau_noi_dia.mjs";

export default [
  thanhHonThon, nacDinhThanh, thienDauThanh, tinhDauNgoaiVi, tinhDauNoiDia, lacNhatSamLam, cucBacChiDia, haiThanDao,
  loiTinhDau, daiDauHonTruong, giaoChienBoss, ...jingles,
];
