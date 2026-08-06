import Promotion from "../../../../models/promotion.model.js";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/admin/promotion
export const list = async (req, res) => {
  try {
    const keyword = req.query.keyword;
    const status = req.query.status;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      deleted: false,
    };

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { code: { $regex: keyword, $options: "i" } },
      ];
    }

    if (status && ["active", "inactive"].includes(status)) {
      filter.status = status;
    }

    const [data, totalItems] = await Promise.all([
      Promotion.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Promotion.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Lấy danh sách khuyến mãi thành công",
      data: data,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi list promotion", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/admin/promotion
export const create = async (req, res) => {
  try {
    const {
      title,
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      usageLimit,
      startDate,
      endDate,
      status,
    } = req.body;

    if (
      !title ||
      !code ||
      !discountType ||
      !discountValue ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        message: "Thiếu dữ liệu bắt buộc",
      });
    }

    if (
      discountType == "percentage" &&
      (discountValue < 0 || discountValue > 100)
    ) {
      return res.status(400).json({
        message: "Giá trị giảm giá phần trăm phải từ 0 đến 100",
      });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      });
    }

    const existedCode = await Promotion.findOne({ code: code.toUpperCase() });
    if (existedCode) {
      return res.status(409).json({
        message: "Mã khuyến mãi đã tồn tại",
      });
    }

    const createdPromotion = await Promotion.create({
      title: title,
      code: code.toUpperCase(),
      description: description || "",
      discountType: discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue || 0),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: status || "active",
    });

    res.status(201).json({
      message: "Tạo khuyến mãi thành công",
      data: createdPromotion,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi create promotion", error, {
      adminId: req.user?._id,
      code: req.body?.code,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/promotion/update/:promotionId
export const update = async (req, res) => {
  try {
    const promotionId = req.params.promotionId;
    const {
      title,
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      usageLimit,
      startDate,
      endDate,
      status,
    } = req.body;

    if (
      !title &&
      !code &&
      !description &&
      !discountType &&
      !discountValue &&
      !minOrderValue &&
      !maxDiscountAmount &&
      !usageLimit &&
      !startDate &&
      !endDate &&
      !status
    ) {
      return res.status(400).json({
        message: "Không có dữ liệu để cập nhật",
      });
    }

    const existedPromotion = await Promotion.findOne({
      _id: promotionId,
      deleted: false,
    });

    if (!existedPromotion) {
      return res.status(404).json({
        message: "Khuyến mãi không tồn tại",
      });
    }

    if (code) {
      const duplicateCode = await Promotion.findOne({
        code: code.toUpperCase(),
        _id: { $ne: promotionId },
      });
      if (duplicateCode) {
        return res.status(409).json({
          message: "Mã khuyến mãi đã tồn tại",
        });
      }
    }

    if (
      discountType == "percentage" &&
      discountValue &&
      (discountValue < 0 || discountValue > 100)
    ) {
      return res.status(400).json({
        message: "Giá trị giảm giá phần trăm phải từ 0 đến 100",
      });
    }

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      });
    }

    const updatedPromotion = await Promotion.findOneAndUpdate(
      { _id: promotionId },
      {
        title: title,
        code: code ? code.toUpperCase() : existedPromotion.code,
        description: description,
        discountType: discountType,
        discountValue: discountValue
          ? Number(discountValue)
          : existedPromotion.discountValue,
        minOrderValue: minOrderValue
          ? Number(minOrderValue)
          : existedPromotion.minOrderValue,
        maxDiscountAmount: maxDiscountAmount
          ? Number(maxDiscountAmount)
          : existedPromotion.maxDiscountAmount,
        usageLimit: usageLimit
          ? Number(usageLimit)
          : existedPromotion.usageLimit,
        startDate: startDate ? new Date(startDate) : existedPromotion.startDate,
        endDate: endDate ? new Date(endDate) : existedPromotion.endDate,
        status: status,
      },
      { new: true },
    );

    res.status(200).json({
      message: "Cập nhật khuyến mãi thành công",
      data: updatedPromotion,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi update promotion", error, {
      adminId: req.user?._id,
      promotionId: req.params?.promotionId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/admin/promotion/:promotionId
export const getDetail = async (req, res) => {
  try {
    const promotionId = req.params.promotionId;

    const promotion = await Promotion.findOne({
      _id: promotionId,
      deleted: false,
    });

    if (!promotion) {
      return res.status(404).json({
        message: "Khuyến mãi không tồn tại",
      });
    }

    res.status(200).json({
      message: "Lấy chi tiết khuyến mãi thành công",
      data: promotion,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi getDetail promotion", error, {
      adminId: req.user?._id,
      promotionId: req.params?.promotionId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/promotion/change-status/:promotionId
export const changeStatus = async (req, res) => {
  try {
    const promotionId = req.params.promotionId;
    const { status } = req.body;

    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Trạng thái không hợp lệ",
      });
    }

    const existedPromotion = await Promotion.findOne({
      _id: promotionId,
      deleted: false,
    });

    if (!existedPromotion) {
      return res.status(404).json({
        message: "Khuyến mãi không tồn tại",
      });
    }

    await Promotion.updateOne({ _id: promotionId }, { status: status });

    res.status(200).json({
      message: "Thay đổi trạng thái khuyến mãi thành công",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi changeStatus promotion", error, {
      adminId: req.user?._id,
      promotionId: req.params?.promotionId,
      status: req.body?.status,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/promotion/change-multi
export const changeMulti = async (req, res) => {
  try {
    const { ids, type } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: "Thiếu danh sách ids hoặc danh sách rỗng",
      });
    }

    switch (type) {
      case "active":
        await Promotion.updateMany(
          { _id: { $in: ids }, deleted: false },
          { status: "active" },
        );

        res.status(200).json({
          message: `Cập nhật trạng thái thành công ${ids.length} mã giảm giá`,
        });
        break;

      case "inactive":
        await Promotion.updateMany(
          { _id: { $in: ids }, deleted: false },
          { status: "inactive" },
        );

        res.status(200).json({
          message: `Cập nhật trạng thái thành công ${ids.length} mã giảm giá`,
        });
        break;

      case "delete-all":
        if (!req.user.roleId.permissions.includes("promotions_delete")) {
          return res.status(403).json({
            message: "Bạn không có quyền xóa khuyến mãi",
          });
        }
        await Promotion.deleteMany({
          _id: { $in: ids },
          deleted: true,
        });
        res.status(200).json({
          message: `Đã xóa thành công ${ids.length} sản phẩm`,
        });
        break;

      default:
        res.status(400).json({
          message: "Type không hợp lệ",
        });
        break;
    }
  } catch (error) {
    logger.logError("Lỗi khi gọi changeMulti promotion", error, {
      adminId: req.user?._id,
      type: req.body?.type,
      idsCount: req.body?.ids?.length,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/promotion/delete/:promotionId
export const deleteItem = async (req, res) => {
  try {
    const promotionId = req.params.promotionId;

    const existedPromotion = await Promotion.findOne({
      _id: promotionId,
      deleted: false,
    });

    if (!existedPromotion) {
      return res.status(404).json({
        message: "Khuyến mãi không tồn tại",
      });
    }

    await Promotion.updateOne(
      { _id: promotionId },
      {
        deleted: true,
        deletedAt: new Date(),
      },
    );

    res.status(200).json({
      message: "Xóa khuyến mãi thành công",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi delete promotion", error, {
      adminId: req.user?._id,
      promotionId: req.params?.promotionId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
