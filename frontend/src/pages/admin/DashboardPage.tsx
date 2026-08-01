import { useState, useEffect } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Users,
  Utensils,
  LayoutList,
  DollarSign,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { useAdminDashboardStore } from "@/stores/useAdminDashboardStore";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

const DashboardPage = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pieFilter, setPieFilter] = useState("Cả năm");

  // Tách biệt trạng thái loading cục bộ cho biểu đồ tròn
  const [isPieLoading, setIsPieLoading] = useState(false);

  const { stats, loading, fetchStats, fetchOrderStatusByMonth } =
    useAdminDashboardStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleFilterRevenue = () => {
    if (startDate && endDate) {
      fetchStats(startDate, endDate);
    }
  };

  const handlePieFilterChange = async (value: string) => {
    setPieFilter(value);
    setIsPieLoading(true); // Bật loading riêng cho Pie Chart

    try {
      if (value === "Cả năm") {
        await fetchOrderStatusByMonth("all");
      } else {
        const monthNum = value.replace("Tháng ", "");
        await fetchOrderStatusByMonth(monthNum);
      }
    } finally {
      setIsPieLoading(false);
    }
  };

  const orderPieData = [
    {
      name: "Chờ xử lý",
      value: stats?.orderStatus?.pending || 0,
      color: "#F59E0B",
    },
    {
      name: "Đang xử lý",
      value: stats?.orderStatus?.processing || 0,
      color: "#06B6D4",
    },
    {
      name: "Đang giao",
      value: stats?.orderStatus?.shipped || 0,
      color: "#3B82F6",
    },
    {
      name: "Hoàn thành",
      value: stats?.orderStatus?.delivered || 0,
      color: "#10B981",
    },
    {
      name: "Đã hủy",
      value: stats?.orderStatus?.cancelled || 0,
      color: "#EF4444",
    },
  ];

  // Logic kiểm tra xem tháng được chọn có dữ liệu hay không
  const hasPieData = orderPieData.some((item) => item.value > 0);

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      {/* HEADER BREADCRUMB */}
      <header className="flex items-center h-16 gap-2 bg-white border-b border-gray-100 px-4 sticky top-0 z-10">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/admin/dashboard"
                className="font-medium text-gray-500"
              >
                Admin
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-bold text-[#b51c00]">
                Dashboard
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-col gap-8 p-6 md:p-8 max-w-[1600px] mx-auto">
        {/* TITLE */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            Đặc Sản Ba Miền Admin Dashboard
          </p>
        </div>

        {/* CẢI TIẾN: Chỉ hiện Loader toàn cục khi lần đầu tiên vào trang (chưa có data overview) */}
        {loading && !stats?.overview?.totalUsers ? (
          <div className="flex items-center justify-center h-[50vh]">
            <Loader2 className="w-10 h-10 animate-spin text-[#b51c00]" />
          </div>
        ) : (
          <>
            {/* 1. SECTION: 4 STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-[12px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center gap-4 hover:border-[#b51c00]/30 transition-colors">
                <div className="w-16 h-16 rounded-[12px] bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                  <Users size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">
                    Số lượng tài khoản
                  </p>
                  <h3 className="text-2xl font-black text-gray-900">
                    {stats?.overview?.totalUsers || 0}
                  </h3>
                </div>
              </div>

              <div className="bg-white rounded-[12px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center gap-4 hover:border-[#b51c00]/30 transition-colors">
                <div className="w-16 h-16 rounded-[12px] bg-[#22C55E] text-white flex items-center justify-center shrink-0 shadow-lg shadow-green-500/20">
                  <ShoppingCart size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">
                    Tổng đơn hàng
                  </p>
                  <h3 className="text-2xl font-black text-gray-900">
                    {stats?.overview?.totalOrders || 0}
                  </h3>
                </div>
              </div>

              <div className="bg-white rounded-[12px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center gap-4 hover:border-[#b51c00]/30 transition-colors">
                <div className="w-16 h-16 rounded-[12px] bg-[#06B6D4] text-white flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
                  <Utensils size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">
                    Số lượng món ăn
                  </p>
                  <h3 className="text-2xl font-black text-gray-900">
                    {stats?.overview?.totalProducts || 0}
                  </h3>
                </div>
              </div>

              <div className="bg-white rounded-[12px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center gap-4 hover:border-[#b51c00]/30 transition-colors">
                <div className="w-16 h-16 rounded-[12px] bg-[#F97316] text-white flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
                  <LayoutList size={28} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">
                    Số lượng danh mục
                  </p>
                  <h3 className="text-2xl font-black text-gray-900">
                    {stats?.overview?.totalCategories || 0}
                  </h3>
                </div>
              </div>
            </div>

            {/* 2. SECTION: THỐNG KÊ HÓA ĐƠN (PIE CHART) */}
            <div className="bg-white rounded-[12px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h2 className="text-xl font-bold text-gray-900">
                  Thống Kê Hóa Đơn
                </h2>
                <select
                  value={pieFilter}
                  onChange={(e) => handlePieFilterChange(e.target.value)}
                  disabled={isPieLoading}
                  className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#b51c00] focus:border-[#b51c00] block px-4 py-2.5 outline-none cursor-pointer font-semibold min-w-[150px] shadow-sm disabled:opacity-50"
                >
                  <option value="Cả năm">Cả năm</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={`Tháng ${i + 1}`}>
                      Tháng {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Box chứa biểu đồ có thuộc tính relative để overlay màn mờ khi load */}
              <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8 items-center h-[350px]">
                {/* Lớp mờ (Overlay) chỉ xuất hiện mỏng trên biểu đồ khi chuyển tháng */}
                {isPieLoading && (
                  <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl transition-all">
                    <Loader2 className="w-8 h-8 animate-spin text-[#b51c00]" />
                  </div>
                )}

                {/* Custom Legend (Bên trái) */}
                <div className="col-span-1 flex flex-col gap-3">
                  {orderPieData.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-md shrink-0 shadow-sm"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm font-medium text-gray-600">
                          {entry.name}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pie Chart (Bên phải) */}
                <div className="col-span-1 lg:col-span-2 h-full relative">
                  {/* Nếu không có dữ liệu -> Hiển thị Empty State */}
                  {!hasPieData && !isPieLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <div className="w-24 h-24 rounded-full border-4 border-dashed border-gray-200 flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-4xl text-gray-300">
                          pie_chart
                        </span>
                      </div>
                      <p className="font-semibold text-gray-500">
                        Chưa có đơn hàng nào
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderPieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          innerRadius={0}
                          dataKey="value"
                          animationDuration={800} // Cải thiện độ mượt của chuyển động
                          animationEasing="ease-out"
                          label={({ cx, cy, midAngle, outerRadius, value }) => {
                            if (value === 0) return null;
                            const RADIAN = Math.PI / 180;
                            const radius = outerRadius * 1.15;
                            const x =
                              cx + radius * Math.cos(-midAngle * RADIAN);
                            const y =
                              cy + radius * Math.sin(-midAngle * RADIAN);
                            return (
                              <text
                                x={x}
                                y={y}
                                fill="#374151"
                                textAnchor={x > cx ? "start" : "end"}
                                dominantBaseline="central"
                                fontSize="13"
                                fontWeight="700"
                              >
                                {value}
                              </text>
                            );
                          }}
                        >
                          {orderPieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke="white"
                              strokeWidth={3}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                          }}
                          itemStyle={{ fontWeight: "bold", color: "#111827" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* 3. SECTION: SO SÁNH DOANH THU (LINE CHART) */}
            <div className="bg-white rounded-[12px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
              <div className="mb-8">
                <span className="bg-pink-100 text-pink-800 text-[15px] font-bold px-3 py-1.5 rounded-md inline-block shadow-sm">
                  So Sánh Doanh Thu
                </span>
              </div>

              <div className="h-[400px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats?.monthlyRevenue || []}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                      tickFormatter={(value) =>
                        `${(value / 1000000).toFixed(0)}M`
                      }
                    />
                    <Tooltip
                      cursor={{
                        stroke: "#cbd5e1",
                        strokeWidth: 1,
                        strokeDasharray: "5 5",
                      }}
                      formatter={(value: number) => [
                        `${value.toLocaleString("vi-VN")}đ`,
                        "Doanh thu",
                      ]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        fontWeight: "600",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: "20px" }}
                      iconType="circle"
                    />
                    <Line
                      type="monotone"
                      name="Doanh thu"
                      dataKey="revenue"
                      stroke="#0EA5E9"
                      strokeWidth={4}
                      dot={{
                        r: 5,
                        fill: "#ffffff",
                        strokeWidth: 3,
                        stroke: "#0EA5E9",
                      }}
                      activeDot={{ r: 8, strokeWidth: 0, fill: "#0EA5E9" }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. SECTION: BỘ LỌC TÙY CHỈNH (THỐNG KÊ DOANH THU) */}
            <div className="bg-white rounded-[12px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Thống Kê Doanh Thu Cụ Thể
              </h2>

              <div className="flex flex-col md:flex-row gap-4 items-end mb-8 border-b border-gray-100 pb-8">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] outline-none text-gray-700 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>

                <div className="flex-1 w-full">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] outline-none text-gray-700 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>

                <button
                  onClick={handleFilterRevenue}
                  className="h-11 px-8 bg-[#3B82F6] hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-md shadow-blue-500/20 active:scale-95 whitespace-nowrap w-full md:w-auto"
                >
                  Thống Kê
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-5 p-4 rounded-2xl bg-green-50/50 border border-green-100">
                  <div className="w-16 h-16 rounded-[12px] bg-[#22C55E] text-white flex items-center justify-center shrink-0 shadow-lg shadow-green-500/20">
                    <DollarSign size={32} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-700 mb-1 uppercase tracking-wider">
                      Tổng Doanh Thu
                    </p>
                    <h3 className="text-3xl font-black text-gray-900">
                      {stats?.revenueByDateRange?.totalRevenue?.toLocaleString(
                        "vi-VN",
                      ) || 0}{" "}
                      đ
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-5 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <div className="w-16 h-16 rounded-[12px] bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                    <ShoppingCart size={32} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-700 mb-1 uppercase tracking-wider">
                      Số Lượng Đơn Hàng
                    </p>
                    <h3 className="text-3xl font-black text-gray-900">
                      {stats?.revenueByDateRange?.totalOrders || 0}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
