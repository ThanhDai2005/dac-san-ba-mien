import { requireAuth } from "../middlewares/auth.middleware.js";
import authRoute from "./auth.route.js";
import dashboardRoute from "./dashboard.route.js";
import userRoute from "./user.route.js";
import usersRoute from "./users.route.js";
import categoryRoute from "./category.route.js";
import productRoute from "./product.route.js";
import orderRoute from "./order.route.js";
import roleRoute from "./role.route.js";
import promotionRoute from "./promotion.route.js";
import blogRoute from "./blog.route.js";
import uploadRoute from "./upload.route.js";
import blogCategoryRoute from "./blogCategory.route.js";

export const adminV1Routes = (app) => {
  const version = "/api/v1/admin";

  app.use(version + "/auth", authRoute);

  app.use(version + "/dashboard", requireAuth, dashboardRoute);

  app.use(version + "/user", requireAuth, userRoute);

  app.use(version + "/category", requireAuth, categoryRoute);

  app.use(version + "/product", requireAuth, productRoute);

  app.use(version + "/users", requireAuth, usersRoute);

  app.use(version + "/order", requireAuth, orderRoute);

  app.use(version + "/role", requireAuth, roleRoute);

  app.use(version + "/promotion", requireAuth, promotionRoute);

  app.use(version + "/blog", requireAuth, blogRoute);

  app.use(version + "/upload", requireAuth, uploadRoute);

  app.use(version + "/blog-category", requireAuth, blogCategoryRoute);
};
