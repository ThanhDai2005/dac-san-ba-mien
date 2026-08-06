import Cart from "../../../../models/cart.model.js";
import Product from "../../../../models/product.model.js";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOne({
      userId: userId,
    }).populate("items.productId");

    if (!cart) {
      cart = new Cart({
        userId: userId,
        items: [],
      });

      await cart.save();
    }

    res.status(200).json({
      cart: cart,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi cart", error, {
      userId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/cart/add
export const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({
        message: "Thiếu thông tin sản phẩm hoặc số lượng",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        message: "Số lượng phải lớn hơn 0",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      deleted: false,
      status: "active",
    });

    if (!product) {
      return res.status(404).json({
        message: "Sản phẩm không tồn tại",
      });
    }

    let cart = await Cart.findOne({ userId: userId });

    if (!cart) {
      cart = new Cart({
        userId: userId,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() == productId,
    );

    const newTotalQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    if (newTotalQuantity > product.stock) {
      return res.status(400).json({
        message: `Sản phẩm đã hết hàng`,
      });
    }

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId: productId,
        quantity: quantity,
        price: product.price,
      });
    }

    await cart.save();

    cart = await Cart.findOne({ _id: cart._id }).populate("items.productId");

    res.status(200).json({
      message: "Thêm vào giỏ hàng thành công",
      cart: cart,
    });
  } catch (error) {
    logger.logError("Lỗi khi thêm vào giỏ hàng", error, {
      userId: req.user?._id,
      productId: req.body?.productId,
      quantity: req.body?.quantity,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/cart/update/:productId
export const updateQuantity = async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.params.productId;
    const { quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({
        message: "Thiếu thông tin sản phẩm hoặc số lượng",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        message: "Số lượng phải lớn hơn 0",
      });
    }

    let cart = await Cart.findOne({ userId: userId });

    if (!cart) {
      return res.status(404).json({
        message: "Giỏ hàng không tồn tại",
      });
    }

    const item = cart.items.find(
      (item) => item.productId.toString() == productId,
    );

    if (!item) {
      return res.status(404).json({
        message: "Sản phẩm không có trong giỏ hàng",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      deleted: false,
      status: "active",
    });

    if (!product) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    if (quantity > product.stock) {
      return res
        .status(400)
        .json({ message: `Sản phẩm chỉ còn ${product.stock} sản phẩm` });
    }

    item.quantity = quantity;
    await cart.save();

    cart = await Cart.findOne({ _id: cart._id }).populate("items.productId");

    res.status(200).json({
      message: "Cập nhật số lượng thành công",
      cart: cart,
    });
  } catch (error) {
    logger.logError("Lỗi khi cập nhật số lượng", error, {
      userId: req.user?._id,
      productId: req.params?.productId,
      quantity: req.body?.quantity,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/cart/remove
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.params.productId;

    if (!productId) {
      return res.status(400).json({
        message: "Thiếu thông tin sản phẩm",
      });
    }

    let cart = await Cart.findOne({ userId: userId });

    if (!cart) {
      return res.status(404).json({
        message: "Giỏ hàng không tồn tại",
      });
    }

    cart = await Cart.findOneAndUpdate(
      { userId: userId },
      { $pull: { items: { productId: productId } } },
      { new: true },
    ).populate("items.productId");

    res.status(200).json({
      message: "Xóa sản phẩm khỏi giỏ hàng thành công",
      cart: cart,
    });
  } catch (error) {
    logger.logError("Lỗi khi xóa sản phẩm khỏi giỏ hàng", error, {
      userId: req.user?._id,
      productId: req.params?.productId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/cart/clear
export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOneAndUpdate(
      { userId: userId },
      { items: [] },
      { new: true },
    );

    if (!cart) {
      return res.status(404).json({
        message: "Giỏ hàng không tồn tại",
      });
    }

    res.status(200).json({
      message: "Đã xóa tất cả sản phẩm khỏi giỏ hàng",
      cart: cart,
    });
  } catch (error) {
    logger.logError("Lỗi khi xóa giỏ hàng", error, {
      userId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
