import { create } from "zustand";
import { adminCustomerService } from "@/services/adminCustomerService";
import { toast } from "sonner";
import type { AdminCustomerStore } from "@/types/store";

export const useAdminCustomerStore = create<AdminCustomerStore>((set) => ({
  customers: [],
  currentCustomer: null,
  loading: false,
  totalPages: 1,

  fetchCustomers: async (keyword = "", status = "", page = 1, limit = 10) => {
    try {
      set({ loading: true });
      const response = await adminCustomerService.list(
        keyword,
        status,
        page,
        limit,
      );
      set({
        customers: response.data,
        totalPages: response.totalPages,
        loading: false,
      });
    } catch (error) {
      console.error("Lỗi khi tải danh sách khách hàng:", error);
      set({ loading: false });
      throw error;
    }
  },

  getDetail: async (customerId) => {
    try {
      set({ loading: true });
      const response = await adminCustomerService.getDetail(customerId);
      set({ currentCustomer: response.data, loading: false });
    } catch (error) {
      console.error("Lỗi khi tải chi tiết khách hàng:", error);
      set({ loading: false });
      toast.error("Không thể tải chi tiết khách hàng");
      throw error;
    }
  },

  createCustomer: async (data) => {
    try {
      set({ loading: true });
      await adminCustomerService.create(data);
      set({ loading: false });
      toast.success("Tạo khách hàng thành công");
    } catch (error) {
      console.error("Lỗi khi tạo khách hàng:", error);
      set({ loading: false });
      toast.error("Tạo khách hàng thất bại");
      throw error;
    }
  },

  updateCustomer: async (customerId, data) => {
    try {
      set({ loading: true });
      await adminCustomerService.update(customerId, data);
      set({ loading: false });
      toast.success("Cập nhật khách hàng thành công");
    } catch (error) {
      console.error("Lỗi khi cập nhật khách hàng:", error);
      set({ loading: false });
      toast.error("Cập nhật khách hàng thất bại");
      throw error;
    }
  },

  changeStatus: async (customerId, status) => {
    try {
      await adminCustomerService.changeStatus(customerId, status);
      const message =
        status === "active"
          ? "Kích hoạt khách hàng thành công"
          : "Khóa khách hàng thành công";
      toast.success(message);
    } catch (error) {
      console.error("Lỗi khi thay đổi trạng thái khách hàng:", error);
      toast.error("Thay đổi trạng thái thất bại");
      throw error;
    }
  },

  changeMulti: async (ids, type) => {
    try {
      const response = await adminCustomerService.changeMulti(ids, type);
      toast.success(response.message);
    } catch (error) {
      console.error("Lỗi khi thao tác hàng loạt khách hàng:", error);
      toast.error("Thao tác hàng loạt thất bại");
      throw error;
    }
  },

  deleteItem: async (customerId) => {
    try {
      await adminCustomerService.deleteItem(customerId);
      toast.success("Xóa khách hàng thành công");
    } catch (error) {
      console.error("Lỗi khi xóa khách hàng:", error);
      toast.error("Xóa khách hàng thất bại");
      throw error;
    }
  },
}));
