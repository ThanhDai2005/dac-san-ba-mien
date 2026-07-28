import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useProductStore } from "@/stores/useProductStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useCartStore } from "@/stores/useCartStore"; // Import store giỏ hàng
import { toast } from "sonner"; // Dùng sonner cho đồng bộ
import type { Product } from "@/types/product";
import { useAuthStore } from "@/stores/useAuthStore";

// Hàm Helper ánh xạ icon theo slug danh mục chuẩn UX
const getCategoryIcon = (slug: string) => {
  switch (slug) {
    case "mon-lau":
      return "ramen_dining"; // Lẩu/Mì
    case "nuoc-uong":
      return "local_cafe"; // Nước uống
    case "mon-man":
      return "rice_bowl"; // Món mặn/Cơm
    case "hai-san":
      return "set_meal"; // Hải sản/Cá
    case "mon-an-vat":
      return "tapas"; // Ăn vặt
    case "mon-chay":
      return "eco"; // Món chay/Rau xanh
    case "mon-trang-mieng":
      return "icecream"; // Tráng miệng/Kem
    default:
      return "fastfood"; // Mặc định
  }
};

const ProductList = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const { product, loading, getList } = useProductStore();
  const { category, getList: getCategoryList } = useCategoryStore();
  const { addToCart } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);

  // Tối ưu: Chỉ gọi API danh mục 1 lần khi mount trang
  useEffect(() => {
    getCategoryList();
  }, []);

  // Gọi API lấy sản phẩm mỗi khi đổi danh mục
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        await getList("", selectedCategory, 1, 8, "averageRating", "-1");
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
      }
    };
    fetchProducts();
  }, [selectedCategory]);

  // Luồng Quick Add to Cart chuẩn Senior
  const handleQuickAdd = async (e: React.MouseEvent, item: Product) => {
    e.stopPropagation(); // Chặn sự kiện click lan ra thẻ cha (chống navigate)

    if (!accessToken) {
      toast.warning("Vui lòng đăng nhập để thêm vào giỏ hàng");
      navigate("/signin");
      return;
    }

    if (item.stock === 0) return;

    try {
      setAddingId(item._id);
      await addToCart(item._id, 1);
      toast.success(`Đã thêm ${item.name} vào giỏ hàng`);
    } catch (error) {
      toast.error(error.response?.data?.message);
      console.log(error);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full flex-grow mb-16">
      {/* ================= CATEGORIES ================= */}
      <section className="mt-8 px-4 md:px-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Danh mục
          </h2>
          <Link
            to="/products"
            className="text-sm font-semibold text-[#b51c00] hover:text-[#961700] transition-colors flex items-center gap-1"
          >
            Xem tất cả
            <span className="material-symbols-outlined text-[18px]">
              chevron_right
            </span>
          </Link>
        </div>

        {/* Vuốt ngang mượt mà ẩn scrollbar */}
        <div className="flex gap-4 overflow-x-auto pt-2 px-2 pb-4 -mt-2 -mx-2 snap-x scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Item "Tất cả" */}
          <div
            onClick={() => setSelectedCategory("")}
            className="flex-none w-[76px] md:w-[88px] flex flex-col items-center gap-2 snap-start cursor-pointer group"
          >
            <div
              className={`w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl shadow-sm flex items-center justify-center transition-all duration-300 group-hover:scale-105 active:scale-95 ${
                selectedCategory === ""
                  ? "bg-[#b51c00] text-white shadow-[#b51c00]/30"
                  : "bg-white border border-gray-100 text-gray-600 group-hover:border-[#b51c00]/50 group-hover:text-[#b51c00]"
              }`}
            >
              <span
                className="material-symbols-outlined text-[32px] md:text-[36px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                restaurant
              </span>
            </div>
            <span
              className={`text-xs md:text-sm text-center font-bold ${
                selectedCategory === ""
                  ? "text-[#b51c00]"
                  : "text-gray-600 group-hover:text-[#b51c00]"
              }`}
            >
              Tất cả
            </span>
          </div>

          {/* Render Categories từ API (Đã tích hợp hàm lấy Icon tự động) */}
          {category.map((cat) => (
            <div
              key={cat._id}
              onClick={() => setSelectedCategory(cat.slug)}
              className="flex-none w-[76px] md:w-[88px] flex flex-col items-center gap-2 snap-start cursor-pointer group"
            >
              <div
                className={`w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl shadow-sm flex items-center justify-center transition-all duration-300 group-hover:scale-105 active:scale-95 ${
                  selectedCategory === cat.slug
                    ? "bg-[#b51c00] text-white shadow-[#b51c00]/30"
                    : "bg-white border border-gray-100 text-gray-600 group-hover:border-[#b51c00]/50 group-hover:text-[#b51c00]"
                }`}
              >
                {/* Sử dụng hàm ánh xạ icon ở đây */}
                <span className="material-symbols-outlined text-[32px] md:text-[36px]">
                  {getCategoryIcon(cat.slug)}
                </span>
              </div>
              <span
                className={`text-xs md:text-sm text-center font-bold truncate w-full ${
                  selectedCategory === cat.slug
                    ? "text-[#b51c00]"
                    : "text-gray-600 group-hover:text-[#b51c00]"
                }`}
              >
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= POPULAR PRODUCTS ================= */}
      <section className="mt-10 px-4 md:px-6">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-6">
          Món ăn phổ biến
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col animate-pulse"
              >
                <div className="w-full aspect-[4/3] bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-5"></div>
                <div className="flex justify-between items-end mt-auto">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : product.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">
              search_off
            </span>
            <p className="text-gray-500 font-medium">
              Không tìm thấy món ăn nào trong danh mục này.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {product.map((item: Product) => (
              <div
                key={item._id}
                onClick={() => navigate(`/product/${item.slug}`)}
                className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col group cursor-pointer border border-gray-100 hover:shadow-md hover:border-[#b51c00]/30 transition-all duration-300 relative"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                  <img
                    src={item.images[0] || "/placeholder.png"}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Badge Đánh giá */}
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <span
                      className="material-symbols-outlined text-yellow-500 text-[14px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      {item.averageRating.toFixed(1)}
                    </span>
                  </div>

                  {item.stock === 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                      <span className="bg-white text-gray-900 px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-widest shadow-lg">
                        Hết hàng
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col grow">
                  <h3 className="text-base font-bold text-gray-900 line-clamp-2 mb-1.5 leading-snug group-hover:text-[#b51c00] transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1 mb-4 font-medium">
                    {item.categoryId?.name || "Món ngon mỗi ngày"}
                  </p>

                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-lg font-black text-[#b51c00]">
                      {item.price.toLocaleString("vi-VN")}đ
                    </span>

                    {/* Nút Quick Add */}
                    <button
                      onClick={(e) => handleQuickAdd(e, item)}
                      disabled={item.stock === 0 || addingId === item._id}
                      className="w-9 h-9 rounded-full bg-red-50 text-[#b51c00] flex items-center justify-center hover:bg-[#b51c00] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 active:scale-90"
                    >
                      {addingId === item._id ? (
                        <span className="material-symbols-outlined text-[20px] animate-spin">
                          progress_activity
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-[22px]">
                          add_shopping_cart
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-10">
          <Link
            to="/products"
            className="px-8 py-3 bg-white border-2 border-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:border-[#b51c00] hover:text-[#b51c00] transition-all duration-300 active:scale-95 shadow-sm"
          >
            Xem tất cả thực đơn
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ProductList;
