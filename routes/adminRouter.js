const express = require('express');
const adminRouter = express.Router();

const { getAdminDetailsPage } = require('../admincontroller/adminForms');
const { isAdmin } = require('../middlewares/isAdmin');
const isAuthenticated = require('../middlewares/isAuth');
const { adminSignin } = require('../admincontroller/adminForms')

adminRouter.get('/admin-details', isAuthenticated, isAdmin, getAdminDetailsPage);
adminRouter.post('/admin/sign-in', adminSignin)

module.exports = adminRouter;