import type { Role, User } from "./user";
import type { Category } from "./category";
import type { Product } from "./product";
import type { Cart } from "./cart";
import type { CreateOrderData, Order } from "./order";
import type { ApplyPromotionResponse, Promotion } from "./promotion";
import type { Review } from "./review";
import type { BlogCategory } from "./blogCategory";
import type { Blog } from "./blog";
import type { Socket } from "socket.io-client";
import type { Conversation, Message } from "./chat";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;
  isAuthChecked: boolean;
  forgotPasswordLoading: boolean;

  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearState: () => void;
  signUp: (
    firstName: string,
    lastName: string,
    phone: string,
    email: string,
    password: string,
  ) => Promise<void>;
  signIn: (phone: string, password: string) => Promise<void>;
  googleSignIn: (credential: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  getDetail: () => Promise<void>;
  refresh: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resetPassword: (
    resetToken: string,
    newPassword: string,
    confirmPassword: string,
  ) => Promise<void>;
}

export interface UserState {
  loading: boolean;

  uploadAvatar: (formData: FormData) => Promise<void>;
  updateInfo: (
    displayName: string,
    email: string,
    phone: string,
    address: string,
  ) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string,
  ) => Promise<void>;
}

export interface CategoryState {
  category: Category[];
  loading: boolean;

  getList: () => Promise<void>;
}

export interface ProductState {
  product: Product[];
  currentProduct: Product | null;
  loading: boolean;

  getList: (
    keyword: string,
    categorySlug: string,
    page: number,
    limit: number,
    sortKey: string,
    sortValue: string,
  ) => Promise<void>;
  getDetail: (slug: string) => Promise<void>;
}

export interface BlogCategoryState {
  blogCategory: BlogCategory[];
  loading: boolean;

  fetchBlogCategories: () => Promise<void>;
}

export interface BlogState {
  blog: Blog[];
  currentBlog: Blog | null;
  loading: boolean;

  getList: (
    keyword?: string,
    blogCategorySlug?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getDetail: (slug: string) => Promise<void>;
}

export interface CartState {
  cart: Cart | null;
  loading: boolean;

  getCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => void;
}

export interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  orderReviews: {
    order: Order | null;
    reviews: Review[];
  } | null;
  loading: boolean;
  totalPages: number;

  createOrder: (
    data: CreateOrderData,
  ) => Promise<Order & { paymentUrl?: string }>;
  getMyOrders: (
    page?: number,
    limit?: number,
    orderStatus?: string,
  ) => Promise<void>;
  getOrderDetail: (orderId: string) => Promise<void>;
  getOrderReviews: (orderId: string) => Promise<void>;
  retryPayment: (orderId: string) => Promise<{ paymentUrl?: string }>;
  cancelOrder: (orderId: string) => Promise<{ message: string; data: Order }>;
  clearCurrentOrder: () => void;
}

export interface PromotionState {
  appliedPromotion: ApplyPromotionResponse | null;
  loading: boolean;
  applyPromotion: (
    code: string,
    orderValue: number,
  ) => Promise<ApplyPromotionResponse>;
  clearPromotion: () => void;
}

export interface ReviewState {
  reviews: Review[];
  loading: boolean;
  totalPages: number;
  currentPage: number;
  createReview: (
    productId: string,
    orderId: string,
    rating: number,
    comment: string,
    images?: File[],
  ) => Promise<void>;
  getReviewsByProduct: (
    productId: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  loadMoreReviews: (productId: string, limit?: number) => Promise<void>;
  resetReviews: () => void;
}

export interface ChatState {
  messages: Message[];
  conversationId: string | null;
  conversationStatus: string | null;
  isLoading: boolean;
  isTyping: boolean;
  typingUser: "bot" | "staff" | null;
  unreadCount: number;
  isWidgetOpen: boolean;

  loadHistory: () => void;
  sendMessage: (message: string) => void;
  requestHuman: () => void;
  addMessage: (message: Message) => void;
  setTyping: (isTyping: boolean, user: "bot" | "staff" | null) => void;
  setConversationStatus: (
    status: "bot" | "waiting_human" | "human_active" | "closed",
  ) => void;
  setUnreadCount: (count: number) => void;
  setWidgetOpen: (open: boolean) => void;
  clearMessages: () => void;
}

export interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connect: (
    token?: string,
    guestInfo?: { name: string; phone: string },
  ) => void;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, handler: (data: any) => void) => void;
  off: (event: string, handler?: (data: any) => void) => void;
}

export interface AdminAuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (accessToken: string) => void;
  clearState: () => void;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getDetail: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export interface AdminDashboardState {
  stats: {
    overview: {
      totalUsers: number;
      totalProducts: number;
      totalOrders: number;
      totalCategories: number;
    };
    orderStatus: {
      pending: number;
      processing: number;
      shipped: number;
      delivered: number;
      cancelled: number;
    };
    revenueByDateRange: {
      totalRevenue: number;
      totalOrders: number;
    };
    monthlyRevenue: Array<{
      month: string;
      revenue: number;
    }>;
  };
  loading: boolean;

  fetchStats: (startDate?: string, endDate?: string) => Promise<void>;
  fetchOrderStatusByMonth: (month?: string) => Promise<void>;
}

export interface AdminCategoryState {
  categories: Category[];
  totalPages: number;
  loading: boolean;

  fetchCategories: (
    keyword?: string,
    status?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getCategoryDetail: (categoryId: string) => Promise<Category>;
  createCategory: (data: { name: string; status?: string }) => Promise<void>;
  updateCategory: (
    categoryId: string,
    data: { name?: string; status?: string },
  ) => Promise<void>;
  changeStatus: (
    categoryId: string,
    status: "active" | "inactive",
  ) => Promise<void>;
  changeMulti: (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => Promise<void>;
  deleteItem: (categoryId: string) => Promise<void>;
}

export interface AdminProductState {
  products: Product[];
  totalPages: number;
  loading: boolean;

  fetchProducts: (
    keyword?: string,
    categorySlug?: string,
    status?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getProductDetail: (productId: string) => Promise<Product>;
  createProduct: (data: {
    name: string;
    description: string;
    ingredients: string;
    category: string;
    price: number;
    images?: string[];
    stock?: number;
    status?: string;
  }) => Promise<void>;
  updateProduct: (
    productId: string,
    data: {
      name?: string;
      description?: string;
      ingredients?: string;
      category?: string;
      price?: number;
      images?: string[];
      stock?: number;
      status?: string;
    },
  ) => Promise<void>;
  changeStatus: (
    productId: string,
    status: "active" | "inactive",
  ) => Promise<void>;
  changeMulti: (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => Promise<void>;
  deleteItem: (productId: string) => Promise<void>;
}

export interface AdminBlogCategoryState {
  blogCategories: BlogCategory[];
  totalPages: number;
  loading: boolean;

  fetchBlogCategories: (
    keyword?: string,
    status?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getBlogCategoryDetail: (blogCategoryId: string) => Promise<BlogCategory>;
  createBlogCategory: (data: {
    name: string;
    status?: string;
  }) => Promise<void>;
  updateBlogCategory: (
    blogCategoryId: string,
    data: { name?: string; status?: string },
  ) => Promise<void>;
  changeStatus: (
    blogCategoryId: string,
    status: "active" | "inactive",
  ) => Promise<void>;
  changeMulti: (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => Promise<void>;
  deleteItem: (blogCategoryId: string) => Promise<void>;
}

export interface AdminBlogState {
  blogs: Blog[];
  totalPages: number;
  loading: boolean;

  fetchBlogs: (
    keyword?: string,
    blogCategorySlug?: string,
    status?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getBlogDetail: (blogId: string) => Promise<Blog>;
  createBlog: (data: {
    title: string;
    content: string;
    imageUrl: string;
    blogCategory?: string;
    featured?: boolean;
    relatedProducts?: string[];
    status?: string;
  }) => Promise<void>;
  updateBlog: (
    blogId: string,
    data: {
      title?: string;
      content?: string;
      imageUrl?: string;
      blogCategory?: string;
      featured?: boolean;
      relatedProducts?: string[];
      status?: string;
    },
  ) => Promise<void>;
  changeStatus: (
    blogId: string,
    status: "active" | "inactive",
  ) => Promise<void>;
  changeMulti: (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => Promise<void>;
  deleteItem: (blogId: string) => Promise<void>;
}

export interface AdminPromotionStore {
  promotions: Promotion[];
  currentPromotion: Promotion | null;
  loading: boolean;
  totalPages: number;

  fetchPromotions: (
    keyword: string,
    status: string,
    page: number,
    limit: number,
  ) => Promise<void>;
  getDetail: (promotionId: string) => Promise<void>;
  createPromotion: (data: {
    title: string;
    code: string;
    description?: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    minOrderValue?: number;
    maxDiscountAmount?: number | null;
    usageLimit?: number | null;
    startDate: string;
    endDate: string;
    status?: "active" | "inactive";
  }) => Promise<void>;
  updatePromotion: (
    promotionId: string,
    data: {
      title: string;
      code: string;
      description?: string;
      discountType: "percentage" | "fixed";
      discountValue: number;
      minOrderValue?: number;
      maxDiscountAmount?: number | null;
      usageLimit?: number | null;
      startDate: string;
      endDate: string;
      status?: "active" | "inactive";
    },
  ) => Promise<void>;
  changeStatus: (
    promotionId: string,
    status: "active" | "inactive",
  ) => Promise<void>;
  changeMulti: (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => Promise<void>;
  deleteItem: (promotionId: string) => Promise<void>;
}

export interface AdminUserStore {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  totalPages: number;

  fetchUsers: (
    keyword?: string,
    roleId?: string,
    status?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getUserDetail: (userId: string) => Promise<User>;
  createUser: (data: {
    displayName: string;
    phone: string;
    password: string;
    email: string;
    roleId?: string;
    status?: string;
    address?: string;
  }) => Promise<void>;
  updateUser: (
    userId: string,
    data: {
      displayName?: string;
      phone?: string;
      email?: string;
      roleId?: string;
      status?: string;
      address?: string;
    },
  ) => Promise<void>;
  changeStatus: (
    userId: string,
    status: "active" | "inactive",
  ) => Promise<void>;
  changeMulti: (
    ids: string[],
    type: "active" | "inactive" | "delete-all",
  ) => Promise<void>;
  deleteItem: (userId: string) => Promise<void>;
}

export interface RoleStore {
  roles: Role[];
  loading: boolean;

  fetchRoles: () => Promise<void>;
}

export interface AdminOrderStore {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  totalPages: number;
  totalItems: number;

  fetchOrders: (
    page?: number,
    limit?: number,
    filters?: {
      orderStatus?: string;
      paymentStatus?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    },
  ) => Promise<void>;
  fetchOrderDetail: (orderId: string) => Promise<void>;
  updateOrderStatus: (
    orderId: string,
    data: {
      orderStatus?: string;
      paymentStatus?: string;
    },
  ) => Promise<Order>;
  clearCurrentOrder: () => void;
}

export interface AdminRoleStore {
  roles: Role[];
  currentRole: Role | null;
  permissions: Array<{ group: string; value: string; label: string }>;
  loading: boolean;
  totalPages: number;

  fetchRoles: (
    keyword?: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  getRoleDetail: (roleId: string) => Promise<void>;
  createRole: (data: { title: string; description?: string }) => Promise<void>;
  updateRole: (
    roleId: string,
    data: { title?: string; description?: string },
  ) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  fetchPermissions: () => Promise<void>;
  updatePermissions: (roleId: string, permissions: string[]) => Promise<void>;
  clearCurrentRole: () => void;
}

export interface AdminChatState {
  conversations: Conversation[];
  selectedConversationId: string | null;
  messages: Message[];
  conversationLoading: boolean;
  messageLoading: boolean;
  isTyping: boolean;
  typingUser: "client" | "bot" | null;

  loadConversations: () => void;
  selectConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, message: string) => void;
  closeConversation: (conversationId: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  addNewConversation: (conversation: Conversation) => void;
  updateConversationStatus: (
    conversationId: string,
    status: "bot" | "waiting_human" | "human_active" | "closed",
  ) => void;
  updateConversationPreview: (
    conversationId: string,
    lastMessage: {
      messageId?: string;
      content: string;
      senderType: "client" | "bot" | "staff";
      createdAt: string;
    } | null,
    status: "bot" | "waiting_human" | "human_active" | "closed",
    unreadByAdmin: number,
  ) => void;
  setTyping: (isTyping: boolean, user: "client" | "bot" | null) => void;
}

export interface AdminSocketState {
  socket: Socket | null;
  isConnected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, handler: (data: any) => void) => void;
  off: (event: string, handler?: (data: any) => void) => void;
}
