const asyncHandler = require('../utils/asyncHandler');
const adminUserService = require('../services/adminUserService');

const getAdminUsers = asyncHandler(async (req, res) => {
  const result = await adminUserService.getAdminUsers(req.query);
  res.status(200).json({
    success: true,
    message: 'Daftar admin berhasil diambil',
    data: result.items,
    pagination: result.pagination,
  });
});

const getAdminUserById = asyncHandler(async (req, res) => {
  const result = await adminUserService.getAdminUserById(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Detail admin berhasil diambil',
    data: result,
  });
});

const createAdminUser = asyncHandler(async (req, res) => {
  const result = await adminUserService.createAdminUser(req.body, req.user._id);
  res.status(201).json({
    success: true,
    message: 'Admin baru berhasil dibuat',
    data: result,
  });
});

const updateAdminUser = asyncHandler(async (req, res) => {
  const result = await adminUserService.updateAdminUser(req.params.id, req.body);
  res.status(200).json({
    success: true,
    message: 'Profil admin berhasil diperbarui',
    data: result,
  });
});

const updateAdminStatus = asyncHandler(async (req, res) => {
  const result = await adminUserService.updateAdminStatus(
    req.params.id,
    req.body,
    req.user._id
  );
  res.status(200).json({
    success: true,
    message: `Status admin berhasil diubah menjadi ${result.isActive ? 'aktif' : 'nonaktif'}`,
    data: result,
  });
});

const changeOwnPassword = asyncHandler(async (req, res) => {
  const result = await adminUserService.changeOwnPassword(req.user._id, req.body);
  res.status(200).json({
    success: true,
    message: 'Password berhasil diubah',
    data: result,
  });
});

const resetOtherPassword = asyncHandler(async (req, res) => {
  const result = await adminUserService.resetOtherPassword(
    req.params.id,
    req.body,
    req.user._id
  );
  res.status(200).json({
    success: true,
    message: 'Password admin berhasil diatur ulang',
    data: result,
  });
});

module.exports = {
  getAdminUsers,
  getAdminUserById,
  createAdminUser,
  updateAdminUser,
  updateAdminStatus,
  changeOwnPassword,
  resetOtherPassword,
};

