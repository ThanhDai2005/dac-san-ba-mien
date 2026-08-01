import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
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
  Search,
  Plus,
  Trash2,
  Loader2,
  Pencil,
  RotateCcw,
  Image,
  EyeOff,
} from "lucide-react";
import { useAdminBlogStore } from "@/stores/useAdminBlogStore";
import { useAdminBlogCategoryStore } from "@/stores/useAdminBlogCategoryStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  confirmDelete,
  confirmRestore,
  confirmPermanentDelete,
} from "@/lib/sweetalert";
import { hasPermission } from "@/lib/permissions";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";

const BlogManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("keyword") || "";
  const categoryFilter = searchParams.get("category") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [localKeyword, setLocalKeyword] = useState(searchTerm);

  const { user } = useAdminAuthStore();
  const {
    blogs,
    totalPages,
    loading,
    fetchBlogs,
    changeStatus,
    changeMulti,
    deleteItem,
  } = useAdminBlogStore();

  const { blogCategories, fetchBlogCategories } = useAdminBlogCategoryStore();

  const showSkeleton = loading && blogs.length === 0;
  const showOverlay = loading && blogs.length > 0;

  const canView = hasPermission(user, "blogs_view");
  const canCreate = hasPermission(user, "blogs_create");
  const canEdit = hasPermission(user, "blogs_edit");
  const canDelete = hasPermission(user, "blogs_delete");

  const updateURL = (newParams: Record<string, string>) => {
    const params = Object.fromEntries(searchParams.entries());
    const mergedParams = { ...params, ...newParams };

    Object.keys(mergedParams).forEach((key) => {
      if (
        !mergedParams[key] ||
        (key === "page" && mergedParams[key] === "1") ||
        (key === "status" && mergedParams[key] === "all") ||
        (key === "category" && mergedParams[key] === "all") ||
        (key === "limit" && mergedParams[key] === "10") ||
        (key === "keyword" && mergedParams[key] === "")
      ) {
        delete mergedParams[key];
      }
    });
    setSearchParams(mergedParams);
  };

  useEffect(() => {
    setLocalKeyword(searchTerm);
  }, [searchTerm]);

  // Debounce: dừng gõ 300ms mới đẩy lên URL → useEffect cũ tự fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localKeyword !== searchTerm) {
        updateURL({ keyword: localKeyword, page: "1" });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localKeyword]);

  useEffect(() => {
    if (canView) {
      fetchBlogCategories("", "active", 1, 100);
    }
  }, [fetchBlogCategories, canView]);

  useEffect(() => {
    if (canView) {
      const categorySlug =
        categoryFilter !== "all"
          ? blogCategories.find((c) => c._id === categoryFilter)?.slug || ""
          : "";
      const status = statusFilter !== "all" ? statusFilter : "";
      fetchBlogs(searchTerm, categorySlug, status, currentPage, limit);
    }
  }, [
    currentPage,
    limit,
    searchTerm,
    categoryFilter,
    statusFilter,
    fetchBlogs,
    canView,
  ]);

  const refetchBlogs = async () => {
    const categorySlug =
      categoryFilter !== "all"
        ? blogCategories.find((c) => c._id === categoryFilter)?.slug || ""
        : "";
    const status = statusFilter !== "all" ? statusFilter : "";
    await fetchBlogs(searchTerm, categorySlug, status, currentPage, limit);
  };

  const handleChangeStatus = async (
    blogId: string,
    status: "active" | "inactive",
  ) => {
    if (!canEdit) {
      toast.error("Bạn không có quyền chỉnh sửa bài viết");
      return;
    }

    const result =
      status === "active"
        ? await confirmRestore(
            "Khôi phục bài viết?",
            "Bài viết sẽ được chuyển về trạng thái hoạt động",
          )
        : await confirmDelete(
            "Ẩn bài viết?",
            "Bài viết sẽ chuyển sang trạng thái ẩn và không hiển thị",
          );

    if (!result.isConfirmed) return;

    try {
      await changeStatus(blogId, status);
      await refetchBlogs();
      setSelectedItems(selectedItems.filter((id) => id !== blogId));
    } catch (error) {
      // Error already handled in store
    }
  };

  const handleDeleteItem = async (blogId: string) => {
    if (!canDelete) {
      toast.error("Bạn không có quyền xóa bài viết");
      return;
    }

    const result = await confirmPermanentDelete(
      "Xóa vĩnh viễn?",
      "Hành động này không thể hoàn tác! Bài viết sẽ bị xóa vĩnh viễn khỏi hệ thống.",
    );

    if (!result.isConfirmed) return;

    try {
      await deleteItem(blogId);
      await refetchBlogs();
      setSelectedItems(selectedItems.filter((id) => id !== blogId));
    } catch (error) {
      // Error already handled in store
    }
  };

  const handleBulkAction = async (
    type: "active" | "inactive" | "delete-all",
  ) => {
    if (selectedItems.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một bài viết");
      return;
    }

    if (type === "delete-all" && !canDelete) {
      toast.error("Bạn không có quyền xóa bài viết");
      return;
    }

    if ((type === "active" || type === "inactive") && !canEdit) {
      toast.error("Bạn không có quyền chỉnh sửa bài viết");
      return;
    }

    let result;
    if (type === "active") {
      result = await confirmRestore(
        "Khôi phục nhiều bài viết?",
        `Bạn đang khôi phục ${selectedItems.length} bài viết`,
      );
    } else if (type === "inactive") {
      result = await confirmDelete(
        "Ẩn nhiều bài viết?",
        `Bạn đang ẩn ${selectedItems.length} bài viết`,
      );
    } else {
      result = await confirmPermanentDelete(
        "Xóa vĩnh viễn nhiều bài viết?",
        `Bạn đang xóa vĩnh viễn ${selectedItems.length} bài viết. Hành động này không thể hoàn tác!`,
      );
    }

    if (!result.isConfirmed) return;

    try {
      await changeMulti(selectedItems, type);
      await refetchBlogs();
      setSelectedItems([]);
    } catch (error) {
      // Error already handled in store
    }
  };

  const selectedBlogs = blogs.filter((b) => selectedItems.includes(b._id));
  const hasActiveSelected = selectedBlogs.some((b) => b.status === "active");
  const hasInactiveSelected = selectedBlogs.some(
    (b) => b.status === "inactive",
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(blogs.map((item) => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  if (!canView) {
    return (
      <div className="bg-[#f7f9fb] min-h-screen pb-6 flex flex-col">
        <header className="flex items-center h-16 gap-2 bg-white border-b border-gray-100 px-4 sticky top-0 z-10 shrink-0">
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
                  Quản lý bài viết
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Không có quyền truy cập
            </h2>
            <p className="text-gray-600">
              Bạn không có quyền xem trang này. Vui lòng liên hệ quản trị viên.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
                Quản lý bài viết
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
        {/* TITLE & FILTERS */}
        <div>
          <h1 className="text-[24px] font-bold text-gray-900 mb-6 tracking-tight">
            Quản lý bài viết
          </h1>

          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            {/* Left: Filters */}
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tiêu đề bài viết..."
                  value={localKeyword}
                  onChange={(e) => setLocalKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] bg-white transition-shadow"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) =>
                  updateURL({ category: e.target.value, page: "1" })
                }
                className="w-full sm:w-48 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] bg-white cursor-pointer"
              >
                <option value="all">Tất cả danh mục</option>
                {blogCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) =>
                  updateURL({ status: e.target.value, page: "1" })
                }
                className="w-full sm:w-48 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] focus:border-[#b51c00] bg-white cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngưng hoạt động</option>
              </select>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              {canEdit && hasInactiveSelected && (
                <button
                  onClick={() => handleBulkAction("active")}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-[#ffc1cc] text-[#c2185b] rounded-[20px] font-semibold text-sm hover:bg-[#ffadc0] transition-colors active:scale-95 whitespace-nowrap"
                >
                  <RotateCcw className="w-4 h-4" />
                  Khôi phục đã chọn
                </button>
              )}

              {canEdit && hasActiveSelected && (
                <button
                  onClick={() => handleBulkAction("inactive")}
                  disabled={selectedItems.length === 0}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-[#ffdad6] text-[#ba1a1a] rounded-[20px] font-semibold text-sm hover:bg-[#ffb4a5] transition-colors active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <EyeOff className="w-4 h-4" />
                  Ẩn bài viết đã chọn
                </button>
              )}

              {canDelete && hasInactiveSelected && (
                <button
                  onClick={() => handleBulkAction("delete-all")}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-[#fee2e2] text-[#991b1b] rounded-[20px] font-semibold text-sm hover:bg-[#fecaca] transition-colors active:scale-95 whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa vĩnh viễn đã chọn
                </button>
              )}

              {canCreate && (
                <button
                  onClick={() => navigate("/admin/blog/create")}
                  className="flex items-center justify-center gap-2 px-5 py-2 bg-[#b51c00] text-white rounded-[20px] font-semibold text-sm hover:bg-[#8e1400] shadow-sm shadow-red-500/20 transition-all active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Thêm bài viết
                </button>
              )}
            </div>
          </div>
        </div>

        {/* DATA TABLE SECTION */}
        <div className="bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-[18px] font-bold text-gray-900">Danh sách</h2>
          </div>

          <div className="relative">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[12px] text-gray-500 bg-[#f1f5f9] uppercase font-bold border-b border-gray-200 tracking-wider">
                  <tr>
                    <th scope="col" className="p-4 w-12">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 bg-white border-gray-300 rounded focus:ring-blue-500 cursor-pointer accent-blue-600"
                          onChange={handleSelectAll}
                          checked={
                            selectedItems.length === blogs.length &&
                            blogs.length > 0
                          }
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-4">
                      STT
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
                      Hình ảnh
                    </th>
                    <th scope="col" className="px-6 py-4">
                      Tiêu đề
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
                      Danh mục
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
                      Tác giả
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
                      Trạng thái
                    </th>
                    <th scope="col" className="px-6 py-4 text-center">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {showSkeleton ? (
                    // Skeleton rows on first load
                    Array.from({ length: limit }).map((_, index) => (
                      <tr
                        key={index}
                        className="animate-pulse bg-white border-b border-gray-50"
                      >
                        <td className="p-4">
                          <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-8"></div>
                        </td>
                        <td className="px-6 py-4 flex justify-center">
                          <div className="w-16 h-12 bg-gray-200 rounded-md"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-48"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 bg-gray-200 rounded w-28 mx-auto"></div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="h-6 bg-gray-200 rounded-md w-24 mx-auto"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-center">
                            <div className="h-7 bg-gray-200 rounded w-16"></div>
                            <div className="h-7 bg-gray-200 rounded w-16"></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : blogs.length > 0 ? (
                    blogs.map((item, index) => (
                      <tr
                        key={item._id}
                        className="bg-white border-b border-gray-50 hover:bg-[#f8fafc] transition-colors group"
                      >
                        <td className="p-4">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 bg-white border-gray-300 rounded focus:ring-blue-500 cursor-pointer accent-blue-600"
                              checked={selectedItems.includes(item._id)}
                              onChange={() => handleSelectItem(item._id)}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {(currentPage - 1) * limit + index + 1}
                        </td>
                        <td className="px-6 py-4 flex justify-center">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-16 h-12 object-cover rounded-md border border-gray-200"
                            />
                          ) : (
                            <div className="w-16 h-12 bg-gray-50 border border-gray-100 border-dashed rounded-md flex items-center justify-center text-gray-300">
                              <Image className="size-5" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900 max-w-xs truncate">
                          {item.title}
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium text-center">
                          {item.blogCategoryId?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium text-center">
                          {item.authorId?.displayName || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.status === "active" ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#d1fae5] text-[#15803d]">
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold bg-[#fee2e2] text-[#b91c1c]">
                              Ngưng hoạt động
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {item.status === "active" ? (
                              <>
                                {canEdit && (
                                  <button
                                    onClick={() =>
                                      navigate(`/admin/blog/edit/${item._id}`)
                                    }
                                    className="px-3 py-1.5 border border-[#22c55e] text-[#16a34a] rounded-[6px] text-xs font-bold hover:bg-[#f0fdf4] transition-colors flex items-center gap-1"
                                  >
                                    <Pencil className="w-3 h-3" />
                                    Sửa
                                  </button>
                                )}
                                {canEdit && (
                                  <button
                                    onClick={() =>
                                      handleChangeStatus(item._id, "inactive")
                                    }
                                    className="px-3 py-1.5 border border-[#ef4444] text-[#dc2626] rounded-[6px] text-xs font-bold hover:bg-[#fef2f2] transition-colors flex items-center gap-1"
                                  >
                                    <EyeOff className="w-3 h-3" />
                                    Ẩn bài viết
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                {canEdit && (
                                  <button
                                    onClick={() =>
                                      handleChangeStatus(item._id, "active")
                                    }
                                    className="px-3 py-1.5 border border-[#ec4899] text-[#db2777] rounded-[6px] text-xs font-bold hover:bg-[#fdf2f8] transition-colors flex items-center gap-1"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    Khôi phục
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeleteItem(item._id)}
                                    className="px-3 py-1.5 border border-[#ef4444] text-[#dc2626] rounded-[6px] text-xs font-bold hover:bg-[#fef2f2] transition-colors flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Xóa vĩnh viễn
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        Không tìm thấy bài viết nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Overlay spinner for subsequent loads */}
            {showOverlay && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-7 h-7 animate-spin text-[#b51c00]" />
                  <span className="text-sm font-semibold text-gray-600">
                    Đang tải...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {blogs.length > 0 && (
            <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2 mb-4 md:mb-0">
                <span className="text-sm text-gray-500">Số lượng mục</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    updateURL({ limit: e.target.value, page: "1" });
                  }}
                  className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#b51c00] focus:border-[#b51c00] px-3 py-1.5 outline-none cursor-pointer"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                {/* Previous Button */}
                <button
                  onClick={() =>
                    updateURL({ page: (currentPage - 1).toString() })
                  }
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#b51c00] hover:border-[#b51c00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 disabled:hover:border-gray-200"
                >
                  &lt;
                </button>

                {/* Page Numbers with Ellipsis Logic */}
                {(() => {
                  const pages = [];

                  if (totalPages <= 6) {
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    if (currentPage <= 3) {
                      pages.push(1, 2, 3, 4, "...", totalPages);
                    } else if (currentPage >= totalPages - 2) {
                      pages.push(
                        1,
                        "...",
                        totalPages - 3,
                        totalPages - 2,
                        totalPages - 1,
                        totalPages,
                      );
                    } else {
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
                        className="w-8 h-8 flex items-center justify-center text-gray-400 font-medium tracking-widest"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => updateURL({ page: page.toString() })}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border font-bold text-sm transition-colors ${
                          currentPage === page
                            ? "border-[#b51c00] bg-[#b51c00] text-white shadow-sm"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#b51c00] hover:border-[#b51c00]"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  );
                })()}

                {/* Next Button */}
                <button
                  onClick={() =>
                    updateURL({ page: (currentPage + 1).toString() })
                  }
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#b51c00] hover:border-[#b51c00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 disabled:hover:border-gray-200"
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogManagement;
