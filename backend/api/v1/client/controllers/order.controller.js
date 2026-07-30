import Order from "../../../../models/order.model.js";
import Product from "../../../../models/product.model.js";
import Promotion from "../../../../models/promotion.model.js";
import Cart from "../../../../models/cart.model.js";
import Review from "../../../../models/review.model.js";
import crypto from "crypto";
import { createMoMoPayment } from "../../../../helpers/momo.js";
import {
  createVNPAYPayment,
  verifyVNPAYCallback,
} from "../../../../helpers/vnpay.js";

// [POST] /api/v1/order
export const create = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, promotionId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Danh sách sản phẩm không hợp lệ",
      });
    }

    if (
      !shippingAddress ||
      !shippingAddress.recipient ||
      !shippingAddress.phone ||
      !shippingAddress.address
    ) {
      return res.status(400).json({
        message: "Thông tin địa chỉ giao hàng không hợp lệ",
      });
    }

    const normalizedItems = [];
    let subtotal = 0;

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return res.status(400).json({
          message: "Dữ liệu sản phẩm trong đơn hàng không hợp lệ",
        });
      }

      const product = await Product.findOne({
        _id: item.productId,
        status: "active",
        deleted: false,
      });

      if (!product) {
        return res.status(404).json({
          message: `Sản phẩm không tồn tại hoặc đã ngừng kinh doanh`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Sản phẩm ${product.name} không đủ tồn kho`,
        });
      }

      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;

      normalizedItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: Number(product.price || 0),
      });
    }

    const shippingFeeValue = 30000;

    let discountAmountValue = 0;
    let validatedPromotion = null;

    // Re-validate and update promotion if applied
    if (promotionId) {
      const now = new Date();
      const promotion = await Promotion.findOne({
        _id: promotionId,
        deleted: false,
        status: "active",
        startDate: { $lte: now },
        endDate: { $gte: now },
      });

      if (!promotion) {
        return res.status(400).json({
          message: "Mã khuyến mãi không còn hợp lệ",
        });
      }

      // Check if user already used this promotion
      if (
        promotion.usersUsed.some(
          (uid) => uid.toString() === req.user._id.toString(),
        )
      ) {
        return res.status(400).json({
          message: "Bạn đã sử dụng mã khuyến mãi này rồi",
        });
      }

      // Check usage limit
      if (
        promotion.usageLimit != null &&
        promotion.usedCount >= promotion.usageLimit
      ) {
        return res.status(400).json({
          message: "Mã khuyến mãi đã hết lượt sử dụng",
        });
      }

      // Check minimum order value
      if (subtotal < promotion.minOrderValue) {
        return res.status(400).json({
          message: `Đơn hàng tối thiểu ${promotion.minOrderValue.toLocaleString()} VND để áp dụng mã này`,
        });
      }

      // Calculate discount server-side based on promotion type
      if (promotion.discountType === "percentage") {
        discountAmountValue = (subtotal * promotion.discountValue) / 100;
        if (
          promotion.maxDiscountAmount &&
          discountAmountValue > promotion.maxDiscountAmount
        ) {
          discountAmountValue = promotion.maxDiscountAmount;
        }
      } else if (promotion.discountType === "fixed") {
        discountAmountValue = promotion.discountValue;
      }

      discountAmountValue = Math.round(discountAmountValue);

      validatedPromotion = promotion;
    }

    const totalAmount = subtotal + shippingFeeValue - discountAmountValue;

    // Atomic stock deduction - prevent race condition
    const stockUpdates = [];
    for (const item of normalizedItems) {
      const updateResult = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          stock: { $gte: item.quantity },
          deleted: false,
          status: "active",
        },
        { $inc: { stock: -item.quantity } },
        { new: true },
      );

      if (!updateResult) {
        // Rollback previous stock changes
        for (const rollbackItem of stockUpdates) {
          await Product.updateOne(
            { _id: rollbackItem.productId },
            { $inc: { stock: rollbackItem.quantity } },
          );
        }

        return res.status(409).json({
          message: `Sản phẩm không đủ tồn kho (có thể đã được mua bởi người khác)`,
        });
      }

      stockUpdates.push(item);
    }

    const createdOrder = await Order.create({
      userId: req.user._id,
      items: normalizedItems,
      shippingAddress: {
        recipient: shippingAddress.recipient,
        phone: shippingAddress.phone,
        address: shippingAddress.address,
      },
      paymentMethod: paymentMethod || "COD",
      paymentStatus: "Pending", // Mặc định chờ xử lý
      orderStatus: "Pending", // Mặc định chờ xử lý
      shippingFee: shippingFeeValue,
      promotionId: promotionId || null,
      discountAmount: discountAmountValue,
      totalAmount: totalAmount,
    });

    if (validatedPromotion) {
      await Promotion.updateOne(
        { _id: promotionId },
        {
          $inc: { usedCount: 1 },
          $addToSet: { usersUsed: req.user._id },
        },
      );
    }

    // Clear cart after successful order creation
    await Cart.updateOne({ userId: req.user._id }, { items: [] });

    const populatedOrder = await Order.findOne({ _id: createdOrder._id })
      .populate("userId", "displayName email")
      .populate("items.productId", "name images price");

    if (paymentMethod === "MOMO") {
      const momoResponse = await createMoMoPayment(createdOrder, totalAmount);

      if (momoResponse) {
        return res.status(201).json({
          message: "Tạo đơn hàng thành công, đang chuyển hướng sang MoMo...",
          data: populatedOrder,
          paymentUrl: momoResponse.payUrl,
        });
      }
    } else if (paymentMethod === "VNPAY") {
      const vnpayResponse = await createVNPAYPayment(createdOrder, totalAmount);

      if (vnpayResponse) {
        return res.status(201).json({
          message: "Tạo đơn hàng thành công, đang chuyển hướng sang VNPAY...",
          data: populatedOrder,
          paymentUrl: vnpayResponse,
        });
      }
    }

    res.status(201).json({
      message: "Tạo đơn hàng thành công",
      data: populatedOrder,
    });
  } catch (error) {
    console.log("Lỗi khi gọi create order", error);
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/order/momo-callback
export const momoCallback = async (req, res) => {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = req.body;

    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretkey = process.env.MOMO_SECRET_KEY;

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const calculatedSignature = crypto
      .createHmac("sha256", secretkey)
      .update(rawSignature)
      .digest("hex");

    if (calculatedSignature !== signature) {
      return res.status(400).json({ message: "Sai chữ ký bảo mật" });
    }

    const realOrderId = orderId.split("_")[0];

    const order = await Order.findById(realOrderId);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (order.paymentStatus !== "Pending") {
      return res
        .status(200)
        .json({ message: "Đơn hàng đã được xử lý từ trước" });
    }

    if (resultCode === 0) {
      await Order.updateOne(
        { _id: realOrderId },
        {
          paymentStatus: "Paid",
          orderStatus: "Processing",
        },
      );
      console.log(
        `MoMo IPN: Đơn hàng ${realOrderId} đã thanh toán THÀNH CÔNG.`,
      );
    } else {
      await Order.updateOne(
        { _id: realOrderId },
        {
          paymentStatus: "Failed",
        },
      );
      console.log(`MoMo IPN: Đơn hàng ${realOrderId} thanh toán THẤT BẠI`);
    }

    return res.status(200).json({ message: "Đã xác nhận IPN" });
  } catch (error) {
    console.error("Lỗi khi xử lý MoMo IPN Callback:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi xử lý IPN" });
  }
};

// [GET] /api/v1/order/vnpay-ipn
export const vnpayIpn = async (req, res) => {
  try {
    const { isValid, responseCode, txnRef, amount } = verifyVNPAYCallback(
      req.query,
    );

    if (!isValid) {
      return res
        .status(200)
        .json({ RspCode: "97", Message: "Invalid signature" });
    }

    const realOrderId = txnRef.split("_")[0];

    const order = await Order.findById(realOrderId);
    if (!order) {
      return res
        .status(200)
        .json({ RspCode: "01", Message: "Order not found" });
    }

    // So sánh amount với Math.round để tránh floating point
    if (Math.round(order.totalAmount) !== amount) {
      console.error(
        `Amount mismatch: order=${order.totalAmount}, vnpay=${amount}`,
      );
      return res.status(200).json({ RspCode: "04", Message: "Invalid amount" });
    }

    if (order.paymentStatus !== "Pending") {
      return res
        .status(200)
        .json({ RspCode: "02", Message: "Order already confirmed" });
    }

    if (responseCode === "00") {
      await Order.updateOne(
        { _id: realOrderId },
        { paymentStatus: "Paid", orderStatus: "Processing" },
      );
      console.log(`VNPAY: Đơn hàng ${realOrderId} đã thanh toán THÀNH CÔNG`);
    } else {
      await Order.updateOne({ _id: realOrderId }, { paymentStatus: "Failed" });
      console.log(`VNPAY: Đơn hàng ${realOrderId} thanh toán THẤT BẠI`);
    }

    return res.status(200).json({ RspCode: "00", Message: "Confirm success" });
  } catch (error) {
    console.error("Lỗi khi xử lý VNPAY callback:", error);
    return res.status(200).json({ RspCode: "99", Message: "Input error" });
  }
};

// [POST] /api/v1/order/:orderId/retry-payment
export const retryPayment = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.user._id;

    // Kiểm tra đơn hàng tồn tại và thuộc về user
    const order = await Order.findOne({
      _id: orderId,
      userId: userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Đơn hàng không tồn tại",
      });
    }

    // Chỉ cho phép retry payment với đơn hàng chưa thanh toán
    if (order.paymentStatus !== "Pending" && order.paymentStatus !== "Failed") {
      return res.status(400).json({
        message: "Đơn hàng đã được thanh toán hoặc không thể thanh toán",
      });
    }

    // Chỉ cho phép retry với đơn hàng chưa bị hủy
    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({
        message: "Đơn hàng đã bị hủy, không thể thanh toán",
      });
    }

    // Chỉ hỗ trợ MoMo và VNPAY payment retry
    if (order.paymentMethod !== "MOMO" && order.paymentMethod !== "VNPAY") {
      return res.status(400).json({
        message: "Phương thức thanh toán không hỗ trợ thanh toán lại",
      });
    }

    if (order.paymentMethod === "MOMO") {
      const momoResponse = await createMoMoPayment(order, order.totalAmount);

      if (momoResponse) {
        return res.status(200).json({
          message: "Tạo link thanh toán lại thành công",
          paymentUrl: momoResponse.payUrl,
        });
      } else {
        return res
          .status(500)
          .json({ message: "Không thể tạo link thanh toán MoMo" });
      }
    } else if (order.paymentMethod === "VNPAY") {
      const vnpayResponse = await createVNPAYPayment(order, order.totalAmount);

      if (vnpayResponse) {
        return res.status(200).json({
          message: "Tạo link thanh toán lại thành công",
          paymentUrl: vnpayResponse,
        });
      } else {
        return res
          .status(500)
          .json({ message: "Không thể tạo link thanh toán VNPAY" });
      }
    }
  } catch (error) {
    console.log("Lỗi khi gọi retryPayment", error);
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/order/my
export const myOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };

    if (req.query.orderStatus) {
      filter.orderStatus = req.query.orderStatus;
    }

    const [data, totalItems] = await Promise.all([
      Order.find(filter)
        .populate("items.productId", "name images price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Lấy danh sách đơn hàng thành công",
      data: data,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    console.log("Lỗi khi gọi myOrders", error);
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/order/detail/:orderId
export const detail = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findOne({
      _id: orderId,
      userId: req.user._id,
    }).populate("items.productId", "name images price");

    if (!order) {
      return res.status(404).json({
        message: "Đơn hàng không tồn tại",
      });
    }

    res.status(200).json({
      message: "Lấy chi tiết đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    console.log("Lỗi khi gọi detail order", error);
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/order/:orderId/reviews
export const getOrderReviews = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.user._id;

    // Kiểm tra đơn hàng tồn tại và thuộc về user
    const order = await Order.findOne({
      _id: orderId,
      userId: userId,
    }).populate("items.productId", "name images price");

    if (!order) {
      return res.status(404).json({
        message: "Đơn hàng không tồn tại",
      });
    }

    // Lấy danh sách productId trong đơn hàng
    const productIds = order.items.map((item) => item.productId._id);

    // Lấy tất cả reviews của user cho các sản phẩm trong đơn hàng
    const reviews = await Review.find({
      userId: userId,
      productId: { $in: productIds },
    }).populate("userId", "displayName avatarUrl");

    res.status(200).json({
      message: "Lấy danh sách đánh giá thành công",
      data: {
        order: order,
        reviews: reviews,
      },
    });
  } catch (error) {
    console.log("Lỗi khi gọi getOrderReviews", error);
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/order/cancel/:orderId
export const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.user._id;

    const order = await Order.findOne({
      _id: orderId,
      userId: userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Đơn hàng không tồn tại",
      });
    }

    // Client chỉ được hủy đơn khi orderStatus là Pending
    if (order.orderStatus !== "Pending") {
      return res.status(400).json({
        message: "Chỉ có thể hủy đơn hàng đang chờ xử lý",
      });
    }

    // Đơn đã thanh toán online không cho phép tự hủy
    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        message:
          "Đơn hàng đã thanh toán không thể tự hủy. Vui lòng liên hệ hỗ trợ",
      });
    }

    // Restore inventory
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity } },
      );
    }

    // Restore promotion usage
    if (order.promotionId) {
      await Promotion.updateOne(
        { _id: order.promotionId },
        {
          $inc: { usedCount: -1 },
          $pull: { usersUsed: userId },
        },
      );
    }

    const cancelledOrder = await Order.findOneAndUpdate(
      { _id: orderId },
      { orderStatus: "Cancelled" },
      { new: true },
    ).populate("items.productId", "name images price");

    res.status(200).json({
      message: "Hủy đơn hàng thành công",
      data: cancelledOrder,
    });
  } catch (error) {
    console.log("Lỗi khi gọi cancelOrder", error);
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
