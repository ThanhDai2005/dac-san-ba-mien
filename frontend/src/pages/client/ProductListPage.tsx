import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProductStore } from "@/stores/useProductStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useCartStore } from "@/stores/useCartStore";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Product } from "@/types/product";
const ProductListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { accessToken } = useAuthStore();
  const { product, loading, getList } = useProductStore();
  const { category, getList: getCategoryList } = useCategoryStore();
  const { addToCart } = useCartStore();

  const keyword = searchParams.get("keyword") || "";
  const selectedCategory = searchParams.get("category") || "";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const sortKey = searchParams.get("sortKey") || "averageRating";
  const sortValue = searchParams.get("sortValue") || "-1";

  const [totalPages, setTotalPages] = useState(1);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [localSearchKeyword, setLocalSearchKeyword] = useState(keyword);

  useEffect(() => {
    setLocalSearchKeyword(keyword);
  }, [keyword]);

  useEffect(() => {
    getCategoryList();
  }, [getCategoryList]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getList(
          keyword,
          selectedCategory,
          currentPage,
          12,
          sortKey,
          sortValue,
        );
        if (response) {
          setTotalPages(response.totalPages || 1);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [keyword, selectedCategory, currentPage, sortKey, sortValue, getList]);

  const updateURL = (newParams: Record<string, string>) => {
    const params = Object.fromEntries(searchParams.entries());
    const mergedParams = { ...params, ...newParams };

    Object.keys(mergedParams).forEach((key) => {
      if (!mergedParams[key] || (key === "page" && mergedParams[key] === "1")) {
        delete mergedParams[key];
      }
    });
    setSearchParams(mergedParams);
  };

  // Tối ưu React: Hàm search giờ chỉ đọc thẳng từ State, không chọc vào DOM HTML nữa
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL({ keyword: localSearchKeyword, page: "1" });
  };

  const handleCategoryChange = (slug: string) => {
    updateURL({ category: slug, page: "1" });
    setIsMobileFilterOpen(false);
  };

  const handleSortChange = (key: string, value: string) => {
    updateURL({ sortKey: key, sortValue: value, page: "1" });
    setIsMobileFilterOpen(false);
  };

  const handleQuickAdd = async (e: React.MouseEvent, item: Product) => {
    e.stopPropagation();

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
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex flex-col md:flex-row gap-8">
      {/* ================= MOBILE CONTROLS (Search & Filter) ================= */}
      <div className="md:hidden w-full flex flex-col gap-3 mb-2">
        <form onSubmit={handleSearch} className="relative w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          {/* Chuyển thành Controlled Component */}
          <input
            value={localSearchKeyword}
            onChange={(e) => setLocalSearchKeyword(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#b51c00] focus:ring-2 focus:ring-[#b51c00]/20 shadow-sm text-sm transition-all"
            placeholder="Tìm kiếm món ăn..."
            type="text"
          />
        </form>

        <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
          <SheetTrigger asChild>
            <button className="flex items-center justify-center gap-2 h-12 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-sm">
              <span className="material-symbols-outlined text-[20px]">
                tune
              </span>
              Bộ lọc & Sắp xếp
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[80vh] rounded-t-3xl overflow-y-auto pb-8"
          >
            <SheetHeader className="mb-6 border-b border-gray-100 pb-4 text-left">
              <SheetTitle className="text-xl font-bold">
                Lọc sản phẩm
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Danh mục</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCategoryChange("")}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${
                      selectedCategory === ""
                        ? "bg-[#b51c00] text-white border-[#b51c00]"
                        : "bg-white text-gray-600 border-gray-200"
                    }`}
                  >
                    Tất cả
                  </button>
                  {category.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => handleCategoryChange(cat.slug)}
                      className={`px-4 py-2 rounded-full text-sm border transition-all ${
                        selectedCategory === cat.slug
                          ? "bg-[#b51c00] text-white border-[#b51c00]"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Sắp xếp</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSortChange("createdAt", "-1")}
                    className={`p-3 rounded-xl text-sm border text-center ${sortKey === "createdAt" && sortValue === "-1" ? "border-[#b51c00] bg-red-50 text-[#b51c00] font-bold" : "border-gray-200 text-gray-600"}`}
                  >
                    Mới nhất
                  </button>
                  <button
                    onClick={() => handleSortChange("price", "1")}
                    className={`p-3 rounded-xl text-sm border text-center ${sortKey === "price" && sortValue === "1" ? "border-[#b51c00] bg-red-50 text-[#b51c00] font-bold" : "border-gray-200 text-gray-600"}`}
                  >
                    Giá tăng dần
                  </button>
                  <button
                    onClick={() => handleSortChange("price", "-1")}
                    className={`p-3 rounded-xl text-sm border text-center ${sortKey === "price" && sortValue === "-1" ? "border-[#b51c00] bg-red-50 text-[#b51c00] font-bold" : "border-gray-200 text-gray-600"}`}
                  >
                    Giá giảm dần
                  </button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ================= SIDEBAR (Desktop Only) ================= */}
      <aside className="hidden md:block w-64 shrink-0">
        <div className="sticky top-24 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-extrabold text-gray-900 mb-4 pb-3 border-b border-gray-100">
            Danh mục
          </h2>
          <ul className="space-y-1.5 mb-8">
            <li>
              <button
                onClick={() => handleCategoryChange("")}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between group ${
                  selectedCategory === ""
                    ? "bg-[#b51c00] text-white font-bold shadow-md shadow-red-900/20"
                    : "text-gray-600 hover:bg-gray-50 hover:text-[#b51c00]"
                }`}
              >
                Tất cả món ăn
                {selectedCategory === "" && (
                  <span className="material-symbols-outlined text-[18px]">
                    check
                  </span>
                )}
              </button>
            </li>
            {category.map((cat) => (
              <li key={cat._id}>
                <button
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between group ${
                    selectedCategory === cat.slug
                      ? "bg-[#b51c00] text-white font-bold shadow-md shadow-red-900/20"
                      : "text-gray-600 hover:bg-gray-50 hover:text-[#b51c00]"
                  }`}
                >
                  {cat.name}
                  {selectedCategory === cat.slug && (
                    <span className="material-symbols-outlined text-[18px]">
                      check
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <h2 className="text-lg font-extrabold text-gray-900 mb-4 pb-3 border-b border-gray-100">
            Sắp xếp
          </h2>
          <ul className="space-y-1.5">
            {[
              { key: "createdAt", val: "-1", label: "Mới nhất" },
              { key: "price", val: "1", label: "Giá thấp đến cao" },
              { key: "price", val: "-1", label: "Giá cao xuống thấp" },
            ].map((sort) => (
              <li key={sort.label}>
                <button
                  onClick={() => handleSortChange(sort.key, sort.val)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 ${
                    sortKey === sort.key && sortValue === sort.val
                      ? "bg-red-50 text-[#b51c00] font-bold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-[#b51c00]"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${sortKey === sort.key && sortValue === sort.val ? "border-[#b51c00]" : "border-gray-300"}`}
                  >
                    {sortKey === sort.key && sortValue === sort.val && (
                      <div className="w-2 h-2 bg-[#b51c00] rounded-full"></div>
                    )}
                  </div>
                  {sort.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <section className="flex-1 flex flex-col gap-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <span className="text-sm text-gray-600">
            Tìm thấy{" "}
            <strong className="text-gray-900 font-extrabold">
              {product.length}
            </strong>{" "}
            món ăn
            {keyword && (
              <>
                {" "}
                cho từ khóa{" "}
                <strong className="text-[#b51c00]">"{keyword}"</strong>
              </>
            )}
          </span>

          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500">Sắp xếp:</span>
            <select
              className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-4 py-0 text-sm font-medium focus:outline-none focus:border-[#b51c00] focus:ring-2 focus:ring-[#b51c00]/20 text-gray-700 cursor-pointer transition-all"
              value={`${sortKey}|${sortValue}`}
              onChange={(e) => {
                const [k, v] = e.target.value.split("|");
                handleSortChange(k, v);
              }}
            >
              <option value="averageRating|-1">Phổ biến nhất</option>
              <option value="createdAt|-1">Mới nhất</option>
              <option value="price|1">Giá thấp đến cao</option>
              <option value="price|-1">Giá cao xuống thấp</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(12)].map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-3 shadow-sm flex flex-col animate-pulse border border-gray-100"
              >
                <div className="w-full aspect-square bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-5"></div>
                <div className="flex justify-between items-end mt-auto">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : product.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[48px] text-gray-300">
                search_off
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">
              Không tìm thấy món ăn
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              Rất tiếc, chúng tôi không tìm thấy món ăn nào phù hợp với bộ lọc
              của bạn. Hãy thử thay đổi danh mục hoặc từ khóa.
            </p>
            <button
              onClick={() =>
                updateURL({ keyword: "", category: "", page: "1" })
              }
              className="px-6 py-2.5 bg-[#b51c00] text-white rounded-xl font-bold hover:bg-[#8e1400] transition-colors shadow-md active:scale-95"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {product.map((item: Product) => (
              <article
                key={item._id}
                onClick={() => navigate(`/product/${item.slug}`)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col group border border-transparent hover:border-[#b51c00]/30 hover:shadow-md transition-all duration-300 cursor-pointer relative"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                  <img
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src={item.images[0] || "/placeholder.png"}
                  />
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
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-white text-gray-900 px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-widest shadow-lg">
                        Hết hàng
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-sm md:text-base font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#b51c00] transition-colors mb-2">
                    {item.name}
                  </h3>
                  <div className="mt-auto flex items-end justify-between">
                    <span className="text-base md:text-lg font-black text-[#b51c00]">
                      {item.price.toLocaleString("vi-VN")}đ
                    </span>
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
              </article>
            ))}
          </div>
        )}

        {/* Traditional Pagination - For Product List (Shop/Menu Page) */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {/* Previous Button */}
            <button
              onClick={() => updateURL({ page: (currentPage - 1).toString() })}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#b51c00] hover:text-[#b51c00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600"
              aria-label="Trang trước"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_left
              </span>
            </button>

            {/* Page Numbers with Standard Ellipsis Logic */}
            {(() => {
              const pages = [];

              // 1. Nếu tổng số trang ít (từ 6 trở xuống), hiển thị tất cả, không cần dấu ...
              if (totalPages <= 6) {
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i);
                }
              } else {
                // 2. Nếu nhiều trang thì bắt đầu tính toán hiển thị dấu ...
                if (currentPage <= 3) {
                  // Đang ở đoạn đầu: Hiện 1 2 3 4 ... Trang cuối
                  pages.push(1, 2, 3, 4, "...", totalPages);
                } else if (currentPage >= totalPages - 2) {
                  // Đang ở đoạn cuối: Hiện 1 ... (Cuối-3) (Cuối-2) (Cuối-1) Cuối
                  pages.push(
                    1,
                    "...",
                    totalPages - 3,
                    totalPages - 2,
                    totalPages - 1,
                    totalPages,
                  );
                } else {
                  // Đang ở giữa: Hiện 1 ... (Trước) (Hiện tại) (Sau) ... Cuối
                  pages.push(
                    1,
                    "...",
                    currentPage - 1,
                    currentPage,
                    currentPage + 1,
                    "...",
                    totalPages,
                  );
                }
              }

              return pages.map((page, index) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 font-medium tracking-widest"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => updateURL({ page: page.toString() })}
                    className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                      currentPage === page
                        ? "bg-[#b51c00] text-white shadow-md shadow-red-100"
                        : "border border-gray-300 text-gray-700 hover:border-[#b51c00] hover:text-[#b51c00]"
                    }`}
                  >
                    {page}
                  </button>
                ),
              );
            })()}

            {/* Next Button */}
            <button
              onClick={() => updateURL({ page: (currentPage + 1).toString() })}
              disabled={currentPage === totalPages}
              className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#b51c00] hover:text-[#b51c00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600"
              aria-label="Trang sau"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_right
              </span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default ProductListPage;
