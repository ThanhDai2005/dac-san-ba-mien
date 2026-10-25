import api from "@/lib/adminAxios";

export const adminCustomerService = {
  list: async (keyword = "", status = "", page = 1, limit = 10) => {
    const response = await api.get(
      `/admin/customer?keyword=${keyword}&status=${status}&page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  getDetail: async (customerId: string) => {
    const response = await api.get(`/admin/customer/${customerId}`);
    return response.data;
  },

  create: async (data: {
    displayName: string;
    email: string;
    phone: string;
    password: string;
    status?: string;
    address?: string;
  }) => {
    const response = await api.post("/admin/customer", data);
    return response.data;
  },

  update: async (
    customerId: string,
    data: {
      displayName?: string;
      email?: string;
      phone?: string;
      password?: string;
      status?: string;
      address?: string;
    },
  ) => {
    const response = await api.patch(
      `/admin/customer/update/${customerId}`,
      data,
    );
    return response.data;
  },

  changeStatus: async (customerId: string, status: string) => {
    const response = await api.patch(
      `/admin/customer/change-status/${customerId}`,
      { status },
    );
    return response.data;
  },

  changeMulti: async (ids: string[], type: "active" | "inactive" | "delete-all") => {
    const response = await api.patch("/admin/customer/change-multi", {
      ids,
      type,
    });
    return response.data;
  },

  deleteItem: async (customerId: string) => {
    const response = await api.patch(
      `/admin/customer/delete/${customerId}`,
    );
    return response.data;
  },
};
