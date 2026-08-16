import Blog from "../../../../models/blog.model.js";
import BlogCategory from "../../../../models/blogCategory.model.js";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/blog
export const list = async (req, res) => {
  try {
    const { keyword, blogCategorySlug } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 7;
    const skip = (page - 1) * limit;
    const filter = {
      status: "active",
      deleted: false,
    };

    if (blogCategorySlug) {
      const blogCategory = await BlogCategory.findOne({
        slug: blogCategorySlug,
        status: "active",
        deleted: false,
      });

      if (!blogCategory) {
        return res.status(404).json({
          message: "Blog category không tồn tại",
        });
      }

      filter.blogCategoryId = blogCategory._id;
    }

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { content: { $regex: keyword, $options: "i" } },
      ];
    }

    const [data, totalItems] = await Promise.all([
      Blog.find(filter)
        .populate("authorId", "displayName")
        .populate("blogCategoryId", "name slug")
        .populate("relatedProducts", "name slug price images")
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Lấy danh sách blog thành công",
      data: data,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi lấy danh sách blog", error, {
      keyword: req.query?.keyword,
      blogCategorySlug: req.query?.blogCategorySlug,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/blog/:slug
export const detail = async (req, res) => {
  try {
    const slug = req.params.slug;

    const blog = await Blog.findOne({
      slug: slug,
      status: "active",
      deleted: false,
    })
      .populate("authorId", "displayName avatarUrl")
      .populate("blogCategoryId", "name slug")
      .populate("relatedProducts")
      .lean();

    if (!blog) {
      return res.status(404).json({
        message: "Bài viết không tồn tại",
      });
    }

    res.status(200).json({
      message: "Lấy chi tiết blog thành công",
      data: blog,
    });
  } catch (error) {
    logger.logError("Lỗi khi lấy chi tiết blog", error, {
      slug: req.params?.slug,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
