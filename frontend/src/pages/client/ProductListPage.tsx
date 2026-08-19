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
import ProductCard from "@/components/client/ProductCard";
import Pagination from "@/components/client/Pagination";
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

  const handleQuickAdd = async (item: Product) => {
    if (!accessToken) {
      toast.warning("Vui lòng đăng nhập để thêm vào giỏ hàng");
      navigate("/signin");
      return;
    }

    if (item.stock === 0) return;

    try {
      await addToCart(item._id, 1);
      toast.success(`Đã thêm ${item.name} vào giỏ hàng`);
    } catch (error) {
      toast.error(error.response?.data?.message);
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
              <ProductCard
                key={item._id}
                product={item}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => updateURL({ page: page.toString() })}
          />
        )}
      </section>
    </div>
  );
};

export default ProductListPage;
