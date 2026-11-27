import { useEffect, useState } from "react";
import { Package, Pin, X } from "lucide-react";
import type { ProductPromotion } from "@/types/promotion";

interface ProductPromotionDetailPanelProps {
  item: ProductPromotion;
  isPinned: boolean;
  onTogglePin: () => void;
  onClose: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });

const ProductPromotionDetailPanel = ({
  item,
  isPinned,
  onTogglePin,
  onClose,
}: ProductPromotionDetailPanelProps) => {
  const promotion = item.promotionId;
  const products = item.productIds ?? [];
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const availability =
    promotion.status !== "active"
      ? "Ngưng hoạt động"
      : now > new Date(promotion.endDate).getTime()
        ? "Đã hết hạn"
        : now < new Date(promotion.startDate).getTime()
          ? "Sắp diễn ra"
          : promotion.usageLimit != null &&
              promotion.usedCount >= promotion.usageLimit
            ? "Đã hết lượt dùng"
            : "Đang diễn ra";
  const isEstimatedPrice = availability !== "Đang diễn ra";

  const getDiscountedPrice = (price: number) => {
    let discount = promotion.discountValue;
    if (promotion.discountType === "percentage") {
      discount = (price * promotion.discountValue) / 100;
      if (
        promotion.maxDiscountAmount &&
        discount > promotion.maxDiscountAmount
      ) {
        discount = promotion.maxDiscountAmount;
      }
    }
    return Math.max(0, Math.round(price - discount));
  };

  return (
    <aside
      id="product-promotion-detail"
      aria-labelledby="product-promotion-detail-title"
      className="flex h-[calc(100dvh-6rem)] max-h-[calc(100dvh-6rem)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="min-w-0">
          <h2
            id="product-promotion-detail-title"
            className="text-base font-bold text-gray-900"
          >
            Chi tiết khuyến mãi
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            {isPinned
              ? "Đã ghim chương trình này"
              : "Bấm vào dòng để ghim chi tiết"}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onTogglePin}
            aria-label={isPinned ? "Bỏ ghim chi tiết" : "Ghim chi tiết"}
            aria-pressed={isPinned}
            className={`cursor-pointer rounded-lg p-2 transition-colors focus-visible:outline-2 focus-visible:outline-[#b51c00] ${isPinned ? "bg-red-50 text-[#b51c00]" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <Pin className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết khuyến mãi"
            className="cursor-pointer rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-[#b51c00]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 space-y-5 overflow-y-auto overscroll-contain p-5">
        <div>
          <h3 className="break-words text-lg font-bold text-gray-900">
            {promotion.title}
          </h3>
          <code className="mt-2 inline-block max-w-full break-all rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">
            {promotion.code}
          </code>
          <p
            className={`mt-2 text-xs font-semibold ${availability === "Đang diễn ra" ? "text-green-700" : "text-gray-600"}`}
          >
            {availability}
          </p>
        </div>

        <dl className="space-y-3 rounded-lg bg-gray-50 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Mức giảm</dt>
            <dd className="text-right font-bold text-[#b51c00]">
              {promotion.discountType === "percentage"
                ? `${promotion.discountValue}%`
                : formatCurrency(promotion.discountValue)}
            </dd>
          </div>
          {promotion.discountType === "percentage" &&
            promotion.maxDiscountAmount != null && (
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Giảm tối đa</dt>
                <dd className="text-right font-medium text-gray-900">
                  {formatCurrency(promotion.maxDiscountAmount)}
                </dd>
              </div>
            )}
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Đã sử dụng</dt>
            <dd className="text-right font-medium text-gray-900">
              {promotion.usedCount ?? 0} /{" "}
              {promotion.usageLimit ?? "Không giới hạn"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-gray-500">Bắt đầu</dt>
            <dd className="text-right font-medium text-gray-900">
              {formatDate(promotion.startDate)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-gray-500">Kết thúc</dt>
            <dd className="text-right font-medium text-gray-900">
              {formatDate(promotion.endDate)}
            </dd>
          </div>
        </dl>

        <section aria-labelledby="promotion-products-title">
          <h3
            id="promotion-products-title"
            className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900"
          >
            <Package className="h-4 w-4 text-[#b51c00]" />
            Sản phẩm áp dụng ({products.length})
          </h3>
          <p className="mb-3 text-xs text-gray-600">
            Giá khi áp dụng chương trình này
            {isEstimatedPrice && (
              <span className="ml-1 font-semibold text-amber-700">
                (Giá dự kiến)
              </span>
            )}
          </p>
          {products.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {products.map((product) => {
                const discountedPrice = getDiscountedPrice(product.price);
                return (
                  <li
                    key={product._id}
                    className="flex items-start gap-3 py-3 first:pt-0"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                      <Package
                        aria-hidden="true"
                        className="absolute inset-0 m-auto h-6 w-6 text-gray-300"
                      />
                      {product.images?.[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                          className="relative h-full w-full bg-gray-50 object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-gray-900">
                        {product.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="text-sm font-bold text-[#b51c00]">
                          <span className="sr-only">
                            {isEstimatedPrice
                              ? "Giá dự kiến: "
                              : "Giá sau giảm: "}
                          </span>
                          {formatCurrency(discountedPrice)}
                        </span>
                        {discountedPrice < product.price && (
                          <span className="text-xs text-gray-500">
                            <span className="sr-only">Giá gốc: </span>
                            <del>{formatCurrency(product.price)}</del>
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
              Không có sản phẩm áp dụng để hiển thị.
            </p>
          )}
          <p className="mt-3 text-xs text-gray-500">
            {isEstimatedPrice
              ? "Giá dự kiến theo giá gốc hiện tại và cấu hình chương trình; hiện chưa áp dụng."
              : "Giá tính theo chương trình đang xem. Giá phía khách hàng có thể khác nếu áp dụng chương trình khác."}
          </p>
        </section>
      </div>
    </aside>
  );
};

export default ProductPromotionDetailPanel;
