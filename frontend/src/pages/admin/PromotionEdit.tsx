import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminPromotionStore } from "@/stores/useAdminPromotionStore";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminPageHeading from "@/components/admin/AdminPageHeading";
import AdminFormActions from "@/components/admin/AdminFormActions";

const PromotionEdit = () => {
  const navigate = useNavigate();
  const { promotionId } = useParams<{ promotionId: string }>();
  const { currentPromotion, getDetail, updatePromotion, loading } =
    useAdminPromotionStore();

  const [formData, setFormData] = useState({
    title: "",
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minOrderValue: "",
    maxDiscountAmount: "",
    usageLimit: "",
    startDate: "",
    endDate: "",
    status: "active",
  });

  useEffect(() => {
    if (promotionId) {
      getDetail(promotionId);
    }
  }, [promotionId, getDetail]);

  useEffect(() => {
    if (currentPromotion) {
      setFormData({
        title: currentPromotion.title,
        code: currentPromotion.code,
        description: currentPromotion.description,
        discountType: currentPromotion.discountType,
        discountValue: currentPromotion.discountValue.toString(),
        minOrderValue: currentPromotion.minOrderValue.toString(),
        maxDiscountAmount: currentPromotion.maxDiscountAmount
          ? currentPromotion.maxDiscountAmount.toString()
          : "",
        usageLimit: currentPromotion.usageLimit
          ? currentPromotion.usageLimit.toString()
          : "",
        startDate: currentPromotion.startDate
          ? new Date(currentPromotion.startDate).toISOString().slice(0, 16)
          : "",
        endDate: currentPromotion.endDate
          ? new Date(currentPromotion.endDate).toISOString().slice(0, 16)
          : "",
        status: currentPromotion.status,
      });
    }
  }, [currentPromotion]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.code ||
      !formData.discountValue ||
      !formData.startDate ||
      !formData.endDate
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    const discountValue = parseFloat(formData.discountValue);
    if (isNaN(discountValue) || discountValue <= 0) {
      toast.error("Giá trị giảm giá không hợp lệ");
      return;
    }

    if (
      formData.discountType === "percentage" &&
      (discountValue < 0 || discountValue > 100)
    ) {
      toast.error("Giá trị giảm giá phần trăm phải từ 0 đến 100");
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }

    try {
      const payload = {
        title: formData.title,
        code: formData.code.toUpperCase(),
        description: formData.description,
        discountType: formData.discountType,
        discountValue: discountValue,
        minOrderValue: formData.minOrderValue
          ? parseFloat(formData.minOrderValue)
          : 0,
        maxDiscountAmount: formData.maxDiscountAmount
          ? parseFloat(formData.maxDiscountAmount)
          : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
      };

      await updatePromotion(promotionId!, payload);
      navigate("/admin/promotions");
    } catch (error) {
      // Error handled in store
    }
  };

  if (loading && !currentPromotion) {
    return (
      <div className="bg-[#f7f9fb] min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#b51c00]" />
      </div>
    );
  }

  return (
    <div className="bg-[#f7f9fb] min-h-screen pb-12">
      <AdminHeader
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quản lý khuyến mãi", href: "/admin/promotions" },
          { label: "Chỉnh sửa khuyến mãi", isCurrentPage: true },
        ]}
      />

      <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
        <AdminPageHeading
          title="Chỉnh sửa khuyến mãi"
          subtitle="Cập nhật thông tin mã giảm giá"
        />

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-[18px] font-bold text-gray-900">
              Thông tin khuyến mãi
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Row 1: Title & Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ví dụ: Giảm giá mùa hè"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent transition-shadow"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mã khuyến mãi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="Ví dụ: SUMMER2026"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent transition-shadow uppercase"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mã sẽ tự động chuyển thành chữ in hoa
                </p>
              </div>
            </div>

            {/* Row 2: Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mô tả
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Mô tả chi tiết về chương trình khuyến mãi..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent transition-shadow resize-none"
              />
            </div>

            {/* Row 3: Discount Type & Value */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Loại giảm giá <span className="text-red-500">*</span>
                </label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent transition-shadow cursor-pointer"
                >
                  <option value="percentage">Phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định (VND)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giá trị giảm <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleChange}
                  placeholder={
                    formData.discountType === "percentage"
                      ? "Ví dụ: 20"
                      : "Ví dụ: 50000"
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent transition-shadow"
                  min="0"
                  step={formData.discountType === "percentage" ? "1" : "1000"}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.discountType === "percentage"
                    ? "Nhập giá trị từ 0 đến 100"
                    : "Nhập số tiền giảm giá"}
                </p>
              </div>
            </div>

            {/* Row 4: Min Order & Max Discount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giá trị đơn hàng tối thiểu (VND)
                </label>
                <input
                  type="number"
                  name="minOrderValue"
                  value={formData.minOrderValue}
                  onChange={handleChange}
                  placeholder="Ví dụ: 100000"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent transition-shadow"
                  min="0"
                  step="1000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Để trống nếu không giới hạn
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giảm giá tối đa (VND)
                </label>
                <input
                  type="number"
                  name="maxDiscountAmount"
                  value={formData.maxDiscountAmount}
                  onChange={handleChange}
                  placeholder="Ví dụ: 200000"
                  className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent transition-shadow ${formData.discountType == "fixed" ? "bg-gray-100" : ""}`}
                  min="0"
                  step="1000"
                  disabled={formData.discountType === "fixed"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.discountType === "percentage"
                    ? "Chỉ áp dụng cho loại phần trăm"
                    : "Không áp dụng cho số tiền cố định"}
                </p>
              </div>
            </div>

            {/* Row 5: Usage Limit & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số lần sử dụng tối đa
                </label>
                <input
                  type="number"
                  name="usageLimit"
                  value={formData.usageLimit}
                  onChange={handleChange}
                  placeholder="Ví dụ: 100"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent transition-shadow"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Để trống nếu không giới hạn
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent transition-shadow cursor-pointer"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Tạm dừng</option>
                </select>
              </div>
            </div>

            {/* Row 6: Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent transition-shadow"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngày kết thúc <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b51c00] focus:border-transparent transition-shadow"
                  required
                />
              </div>
            </div>

            {/* Usage Stats */}
            {currentPromotion && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-blue-900 mb-2">
                  Thống kê sử dụng
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">
                      Đã sử dụng:
                    </span>{" "}
                    <span className="font-bold text-blue-900">
                      {currentPromotion.usedCount}
                    </span>
                    {currentPromotion.usageLimit && (
                      <span className="text-blue-600">
                        {" "}
                        / {currentPromotion.usageLimit}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">
                      Người dùng đã dùng:
                    </span>{" "}
                    <span className="font-bold text-blue-900">
                      {currentPromotion.usersUsed?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <AdminFormActions
            loading={loading}
            submitLabel="Cập nhật khuyến mãi"
          />
        </form>
      </div>
    </div>
  );
};

export default PromotionEdit;
