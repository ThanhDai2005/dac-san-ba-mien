import Promotion from "../../../../models/promotion.model.js";
import logger from "../../../../config/logger.js";

// [POST] /api/v1/promotion/apply
export const apply = async (req, res) => {
  try {
    const { code, orderValue } = req.body;
    const userId = req.user._id;

    if (!code || !orderValue) {
      return res
        .status(400)
        .json({ message: "Thiếu mã khuyến mãi hoặc giá trị đơn hàng" });
    }

    const orderValueNum = Number(orderValue);
    if (isNaN(orderValueNum) || orderValueNum < 0) {
      return res.status(400).json({ message: "Gia tri don hang khong hop le" });
    }

    const now = new Date();

    const promotion = await Promotion.findOne({
      code: code.toUpperCase().trim(),
      deleted: false,
      status: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (!promotion) {
      return res.status(404).json({
        message: "Ma khuyen mai khong ton tai, da het han hoac chua kich hoat",
      });
    }

    // Chỉ kiểm tra usageLimit nếu nó KHÔNG phải null
    if (
      promotion.usageLimit != null &&
      promotion.usedCount >= promotion.usageLimit
    ) {
      return res
        .status(400)
        .json({ message: "Ma khuyen mai da het luot su dung" });
    }

    // Kiem tra gia tri don hang toi thieu
    if (orderValueNum < promotion.minOrderValue) {
      return res.status(400).json({
        message: `Don hang phai co gia tri toi thieu ${promotion.minOrderValue.toLocaleString("vi-VN")} VND de ap dung ma nay`,
      });
    }

    const alreadyUsed = promotion.usersUsed.some(
      (uid) => uid.toString() == userId.toString(),
    );
    if (alreadyUsed) {
      return res
        .status(400)
        .json({ message: "Ban da su dung ma khuyen mai nay roi" });
    }

    // Tinh so tien giam gia
    let discountAmount = 0;
    if (promotion.discountType == "percentage") {
      discountAmount = (orderValueNum * promotion.discountValue) / 100;
      // Ap dung gioi han giam toi da neu co
      if (
        promotion.maxDiscountAmount !== null &&
        discountAmount > promotion.maxDiscountAmount
      ) {
        discountAmount = promotion.maxDiscountAmount;
      }
    } else {
      // fixed
      discountAmount = promotion.discountValue;
    }

    // Dam bao so tien giam khong vuot qua gia tri don hang
    discountAmount = Math.min(discountAmount, orderValueNum);
    discountAmount = Math.round(discountAmount);

    const finalAmount = orderValueNum - discountAmount;

    res.status(200).json({
      message: "Ap dung ma khuyen mai thanh cong",
      data: {
        promotionId: promotion._id,
        code: promotion.code,
        title: promotion.title,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        discountAmount: discountAmount,
        finalAmount: finalAmount,
      },
    });
  } catch (error) {
    logger.logError("Loi khi ap dung promotion", error, {
      userId: req.user?._id,
      code: req.body?.code,
      orderValue: req.body?.orderValue,
      endpoint: req.originalUrl,
    });
    res.status(500).json({ message: "Loi he thong" });
  }
};
