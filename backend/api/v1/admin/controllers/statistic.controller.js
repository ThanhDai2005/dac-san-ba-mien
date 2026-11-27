import Order from "../../../../models/order.model.js";
import Product from "../../../../models/product.model.js";
import logger from "../../../../config/logger.js";
import {
  calculateRevenueByMonth,
  calculateRevenueByQuarter,
  calculateRevenueByYear,
  calculateRevenueByStaff,
  calculateRevenueByProductQuarter,
  calculateRevenueByCustomerYear,
  calculateRevenueByCustomerQuarter,
} from "../../../../helpers/dashboard.helper.js";

// [GET] /api/v1/admin/statistic
export const statistic = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // 1. Thống kê Thu/Chi/Lợi nhuận theo Tháng/Quý/Năm
    const revenueByMonth = await calculateRevenueByMonth(currentYear);
    const revenueByQuarter = await calculateRevenueByQuarter(currentYear);
    const revenueByYear = await calculateRevenueByYear();

    // 2. Doanh thu theo Nhân viên
    const revenueByStaff = await calculateRevenueByStaff();

    // 3. Doanh thu theo Sản phẩm theo Quý
    const revenueByProductQuarter =
      await calculateRevenueByProductQuarter(currentYear);

    // 4. Doanh thu theo Khách hàng (Year/Quarter)
    const revenueByCustomerYear = await calculateRevenueByCustomerYear();
    const customerQuarterYear = req.query.customerYear
      ? parseInt(req.query.customerYear)
      : currentYear;
    const revenueByCustomerQuarter =
      await calculateRevenueByCustomerQuarter(customerQuarterYear);

    res.status(200).json({
      message: "Lấy thống kê thành công",
      data: {
        revenueByMonth,
        revenueByQuarter,
        revenueByYear,
        revenueByStaff,
        revenueByProductQuarter,
        revenueByCustomerYear,
        revenueByCustomerQuarter,
      },
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi statistic", error, {
      adminId: req.user?._id,
      roleId: req.user?.roleId,
      query: req.query,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/admin/statistic/products
export const products = async (req, res) => {
  try {
    const mode = req.query.mode || "quarter";
    const year = parseInt(req.query.year) || new Date().getFullYear();

    if (!["month", "quarter", "year"].includes(mode)) {
      return res.status(400).json({ message: "Chế độ thống kê không hợp lệ" });
    }

    const startYear = mode === "year" ? year - 2 : year;
    const startDate = new Date(`${startYear}-01-01T00:00:00+07:00`);
    const endDate = new Date(`${year + 1}-01-01T00:00:00+07:00`);
    const month = {
      $month: { date: "$createdAt", timezone: "Asia/Ho_Chi_Minh" },
    };
    const period =
      mode === "month"
        ? month
        : mode === "quarter"
          ? { $ceil: { $divide: [month, 3] } }
          : { $year: { date: "$createdAt", timezone: "Asia/Ho_Chi_Minh" } };

    // Xếp hạng theo số lượng trong đúng khoảng thời gian đang xem.
    const sales = await Order.aggregate([
      {
        $match: {
          orderStatus: "Delivered",
          createdAt: { $gte: startDate, $lt: endDate },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: { productId: "$items.productId", period },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      {
        $group: {
          _id: "$_id.productId",
          totalQuantity: { $sum: "$quantity" },
          totalRevenue: { $sum: "$revenue" },
          periods: {
            $push: {
              period: "$_id.period",
              quantity: "$quantity",
              revenue: "$revenue",
            },
          },
        },
      },
      { $sort: { totalQuantity: -1, totalRevenue: -1, _id: 1 } },
      { $limit: 5 },
    ]);

    const productDetails = await Product.find({
      _id: { $in: sales.map((item) => item._id) },
      deleted: false,
    })
      .select("name")
      .lean();
    const firstOrder = await Order.findOne({ orderStatus: "Delivered" })
      .sort({ createdAt: 1 })
      .select("createdAt")
      .lean();
    const firstYear = firstOrder
      ? Number(
          new Intl.DateTimeFormat("en", {
            year: "numeric",
            timeZone: "Asia/Ho_Chi_Minh",
          }).format(firstOrder.createdAt),
        )
      : year;
    const lastYear = Math.max(new Date().getFullYear(), year);
    const availableYears = [];
    for (let value = lastYear; value >= Math.min(firstYear, year); value--) {
      availableYears.push(value);
    }

    const periods =
      mode === "month"
        ? Array.from({ length: 12 }, (_, index) => `T${index + 1}`)
        : mode === "quarter"
          ? ["Q1", "Q2", "Q3", "Q4"]
          : [String(year - 2), String(year - 1), String(year)];
    const data = sales.map((item) => {
      const product = productDetails.find(
        (product) => product._id.toString() === item._id.toString(),
      );
      const productPeriods = {};
      periods.forEach((label, index) => {
        const periodNumber = mode === "year" ? Number(label) : index + 1;
        const sale = item.periods.find((sale) => sale.period === periodNumber);
        productPeriods[label] = {
          quantity: sale?.quantity || 0,
          revenue: sale?.revenue || 0,
        };
      });
      return {
        productId: item._id.toString(),
        productName: product?.name || "Sản phẩm đã ngừng kinh doanh",
        periods: productPeriods,
        totalQuantity: item.totalQuantity,
        totalRevenue: item.totalRevenue,
      };
    });

    res.status(200).json({
      message: "Lấy thống kê sản phẩm thành công",
      data: { mode, year, periods, availableYears, products: data },
    });
  } catch (error) {
    console.log("Lỗi khi gọi products statistic", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
