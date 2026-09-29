import express from "express";
const router = express.Router();

import * as controller from "../controllers/users.controller.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

router.get("/", requirePermission("accounts_view"), controller.list);

router.get("/:userId", requirePermission("accounts_view"), controller.detail);

router.post("/", requirePermission("accounts_create"), controller.create);

router.patch(
  "/update/:userId",
  requirePermission("accounts_edit"),
  controller.update,
);

router.patch(
  "/change-status/:userId",
  requirePermission("accounts_edit"),
  controller.changeStatus,
);

router.patch(
  "/change-multi",
  requirePermission("accounts_edit"),
  controller.changeMulti,
);

router.patch(
  "/delete-item/:userId",
  requirePermission("accounts_delete"),
  controller.deleteItem,
);

export default router;
