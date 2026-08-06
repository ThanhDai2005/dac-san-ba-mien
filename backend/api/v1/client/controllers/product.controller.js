import Product from "../../../../models/product.model.js";
import Category from "../../../../models/category.model.js";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/product
export const list = async (req, res) => {
  try {
    const { keyword, categorySlug, sortKey, sortValue } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const filter = {
      status: "active",
      deleted: false,
    };

    if (categorySlug) {
      const category = await Category.findOne({
        slug: categorySlug,
        status: "active",
        deleted: false,
      });

      if (!category) {
        return res.status(404).json({
          message: "Category không tồn tại",
        });
      }

      filter.categoryId = category._id;
    }

    const slugify = (str = "") => {
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    };

    if (keyword) {
      const search = slugify(keyword);

      filter.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const sort = {};
    if (sortKey && sortValue) {
      sort[sortKey] = Number(sortValue);
    } else {
      sort.createdAt = -1;
    }

    const [data, totalItems] = await Promise.all([
      Product.find(filter)
        .populate("categoryId", "name slug")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Lấy danh sách product thành công",
      data: data,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi list product", error, {
      keyword: req.query.keyword,
      categorySlug: req.query.categorySlug,
      page: req.query.page,
      limit: req.query.limit,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/product/:slug
export const detail = async (req, res) => {
  try {
    const slug = req.params.slug;
    const data = await Product.findOne({
      slug: slug,
      status: "active",
      deleted: false,
    }).populate("categoryId", "name slug");

    if (!data) {
      return res.status(404).json({
        message: "Product không tồn tại",
      });
    }

    res.status(200).json({
      message: "Lấy chi tiết product thành công",
      data: data,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi detail product", error, {
      slug: req.params.slug,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
