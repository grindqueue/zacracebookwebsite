const express = require('express');
const adminRouter = express.Router();

const { getAdminDetailsPage, getAdminDashboard, adminSignin } = require('../admincontroller/adminForms');
const { isAdmin } = require('../middlewares/isAdmin');
const isAuthenticated = require('../middlewares/isAuth');


adminRouter.get('/admin-details', isAuthenticated, isAdmin, getAdminDetailsPage);
adminRouter.post('/admin/sign-in', adminSignin)
adminRouter.get('/admin/statistics/dashboard',isAuthenticated, isAdmin, getAdminDashboard)

module.exports = adminRouter;