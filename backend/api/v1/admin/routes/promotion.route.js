import express from "express";
const router = express.Router();

import * as controller from "../controllers/promotion.controller.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

router.get("/", requirePermission("promotions_view"), controller.list);

router.get(
  "/:promotionId",
  requirePermission("promotions_view"),
  controller.detail,
);

router.post("/", requirePermission("promotions_create"), controller.create);

router.patch(
  "/update/:promotionId",
  requirePermission("promotions_edit"),
  controller.update,
);

router.patch(
  "/change-status/:promotionId",
  requirePermission("promotions_edit"),
  controller.changeStatus,
);

router.patch(
  "/change-multi",
  requirePermission("promotions_edit"),
  controller.changeMulti,
);

router.patch(
  "/delete/:promotionId",
  requirePermission("promotions_delete"),
  controller.deleteItem,
);

export default router;
