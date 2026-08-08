import User from "../../../../models/user.model.js";
import Role from "../../../../models/role.model.js";
import bcrypt from "bcrypt";
import logger from "../../../../config/logger.js";

// [GET] /api/v1/admin/users
export const list = async (req, res) => {
  try {
    const keyword = req.query.keyword;
    const roleId = req.query.roleId;
    const status = req.query.status;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      deleted: false,
    };

    if (keyword) {
      filter.$or = [
        { displayName: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
        { phone: { $regex: keyword, $options: "i" } },
      ];
    }

    if (roleId) {
      filter.roleId = roleId;
    }

    if (status) {
      filter.status = status;
    }

    const [data, totalItems] = await Promise.all([
      User.find(filter)
        .populate("roleId", "title")
        .select("-hashedPassword")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "Lấy danh sách tài khoản thành công",
      data: data,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi list user", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [GET] /api/v1/admin/users/:userId
export const getDetail = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findOne({
      _id: userId,
      deleted: false,
    })
      .populate("roleId", "title")
      .select("-hashedPassword");

    if (!user) {
      return res.status(404).json({
        message: "Tài khoản không tồn tại",
      });
    }

    res.status(200).json({
      message: "Lấy chi tiết tài khoản thành công",
      data: user,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi getDetail user", error, {
      adminId: req.user?._id,
      targetUserId: req.params.userId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [POST] /api/v1/admin/users
export const create = async (req, res) => {
  try {
    const { displayName, email, phone, password, roleId, status, address } =
      req.body;

    if (!displayName || !email || !password) {
      return res.status(400).json({
        message: "Thiếu dữ liệu bắt buộc",
      });
    }

    const existedEmail = await User.findOne({ email: email });
    if (existedEmail) {
      return res.status(409).json({
        message: "Email đã tồn tại",
      });
    }

    if (phone) {
      const existedPhone = await User.findOne({ phone: phone });
      if (existedPhone) {
        return res.status(409).json({
          message: "Số điện thoại đã tồn tại",
        });
      }
    }

    if (roleId) {
      const existedRole = await Role.findOne({
        _id: roleId,
        deleted: false,
      });
      if (!existedRole) {
        return res.status(404).json({
          message: "Vai trò không tồn tại",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await User.create({
      displayName: displayName,
      email: email,
      phone: phone || "",
      hashedPassword: hashedPassword,
      roleId: roleId || null,
      status: status || "active",
      address: address || "",
    });

    const userData = await User.findOne({ _id: createdUser._id })
      .populate("roleId", "title")
      .select("-hashedPassword");

    res.status(201).json({
      message: "Tạo tài khoản thành công",
      data: userData,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi create user", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/users/update/:userId
export const update = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { displayName, email, phone, password, roleId, status, address } =
      req.body;

    if (
      !displayName &&
      !email &&
      !phone &&
      !password &&
      !roleId &&
      !status &&
      !address
    ) {
      return res.status(400).json({
        message: "Không có dữ liệu để cập nhật",
      });
    }

    const existedUser = await User.findOne({
      _id: userId,
      deleted: false,
    });

    if (!existedUser) {
      return res.status(404).json({
        message: "Tài khoản không tồn tại",
      });
    }

    if (email) {
      const duplicateEmail = await User.findOne({
        email: email,
        _id: { $ne: userId },
      });
      if (duplicateEmail) {
        return res.status(409).json({
          message: "Email đã tồn tại",
        });
      }
    }

    if (phone) {
      const duplicatePhone = await User.findOne({
        phone: phone,
        _id: { $ne: userId },
      });
      if (duplicatePhone) {
        return res.status(409).json({
          message: "Số điện thoại đã tồn tại",
        });
      }
    }

    if (roleId) {
      const existedRole = await Role.findOne({
        _id: roleId,
        deleted: false,
      });
      if (!existedRole) {
        return res.status(404).json({
          message: "Vai trò không tồn tại",
        });
      }
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : existedUser.hashedPassword;

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      {
        displayName: displayName,
        email: email,
        phone: phone,
        hashedPassword: hashedPassword,
        roleId: roleId,
        status: status,
        address: address,
      },
      { new: true },
    )
      .populate("roleId", "title")
      .select("-hashedPassword");

    res.status(200).json({
      message: "Cập nhật tài khoản thành công",
      data: updatedUser,
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi update user", error, {
      adminId: req.user?._id,
      targetUserId: req.params.userId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/users/change-status/:userId
export const changeStatus = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { status } = req.body;

    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Trạng thái không hợp lệ",
      });
    }

    const existedUser = await User.findOne({
      _id: userId,
      deleted: false,
    }).populate("roleId");

    if (!existedUser) {
      return res.status(404).json({
        message: "Tài khoản không tồn tại",
      });
    }

    // Prevent operations on Super Admin accounts
    if (existedUser.roleId && existedUser.roleId.title === "Super Admin") {
      return res.status(403).json({
        message: "Không thể thay đổi trạng thái tài khoản Super Admin",
      });
    }

    // Prevent self-locking: check if user is trying to lock themselves
    if (req.user._id.toString() === userId && status === "inactive") {
      return res.status(403).json({
        message: "Không thể tự khóa tài khoản của chính mình",
      });
    }

    await User.updateOne({ _id: userId }, { status: status });

    res.status(200).json({
      message: "Thay đổi trạng thái tài khoản thành công",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi changeStatus user", error, {
      adminId: req.user?._id,
      targetUserId: req.params.userId,
      endpoint: req.originalUrl,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/users/change-multi
export const changeMulti = async (req, res) => {
  try {
    const { ids, type } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        message: "Danh sách ID không hợp lệ",
      });
    }

    if (!type || !["active", "inactive", "delete-all"].includes(type)) {
      return res.status(400).json({
        message: "Loại thao tác không hợp lệ",
      });
    }

    // Check if any of the users are Super Admin
    const usersToUpdate = await User.find({
      _id: { $in: ids },
    }).populate("roleId");

    const superAdminIds = usersToUpdate
      .filter((user) => user.roleId && user.roleId.title === "Super Admin")
      .map((user) => user._id.toString());

    if (superAdminIds.length > 0) {
      return res.status(403).json({
        message: "Không thể thực hiện thao tác trên tài khoản Super Admin",
      });
    }

    // Prevent self-locking for inactive type
    if (type === "inactive" && ids.includes(req.user._id.toString())) {
      return res.status(403).json({
        message: "Không thể tự khóa tài khoản của chính mình",
      });
    }

    switch (type) {
      case "active":
        await User.updateMany(
          { _id: { $in: ids }, deleted: false },
          { status: "active" },
        );
        break;
      case "inactive":
        await User.updateMany(
          { _id: { $in: ids }, deleted: false },
          { status: "inactive" },
        );
        break;
      case "delete-all":
        if (!req.user.roleId.permissions.includes("accounts_delete")) {
          return res.status(403).json({
            message: "Bạn không có quyền xóa tài khoản",
          });
        }
        await User.deleteMany({
          _id: { $in: ids },
          deleted: true,
        });
        break;
    }

    res.status(200).json({
      message: "Thao tác thành công",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi changeMulti user", error, {
      adminId: req.user?._id,
      endpoint: req.originalUrl,
      targetUserIds: req.body?.ids,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};

// [PATCH] /api/v1/admin/users/delete-item/:userId
export const deleteItem = async (req, res) => {
  try {
    const userId = req.params.userId;

    const existedUser = await User.findOne({
      _id: userId,
      deleted: true,
    }).populate("roleId");

    if (!existedUser) {
      return res.status(404).json({
        message: "Tài khoản không tồn tại hoặc chưa bị xóa mềm",
      });
    }

    // Prevent permanent deletion of Super Admin accounts
    if (existedUser.roleId && existedUser.roleId.title === "Super Admin") {
      return res.status(403).json({
        message: "Không thể xóa vĩnh viễn tài khoản Super Admin",
      });
    }

    await User.deleteOne({ _id: userId });

    res.status(200).json({
      message: "Xóa vĩnh viễn tài khoản thành công",
    });
  } catch (error) {
    logger.logError("Lỗi khi gọi deleteItem user", error, {
      adminId: req.user?._id,
      targetUserId: req.params.userId,
      endpoint: req.originalUrl,
      adminId: req.user?._id,
      targetUserId: req.params.userId,
    });
    res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
