import express from "express";
const router = express.Router();

import * as controller from "../controllers/stockReceipt.controller.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

// [GET] /api/v1/admin/stock-receipt
router.get("/", requirePermission("stock_receipts_view"), controller.list);

// [GET] /api/v1/admin/stock-receipt/:receiptId
router.get(
  "/:receiptId",
  requirePermission("stock_receipts_view"),
  controller.detail,
);

// [POST]  /api/v1/admin/stock-receipt
router.post("/", requirePermission("stock_receipts_create"), controller.create);

// [PATCH] /api/v1/admin/stock-receipt/confirm/:receiptId
router.patch(
  "/confirm/:receiptId",
  requirePermission("stock_receipts_edit"),
  controller.confirm,
);

// [PATCH] /api/v1/admin/stock-receipt/cancel/:receiptId
router.patch(
  "/cancel/:receiptId",
  requirePermission("stock_receipts_edit"),
  controller.cancel,
);

export default router;
