const express = require('express');
const adminRouter = express.Router();

const { getAdminDetailsPage } = require('../admincontroller/adminForms');
const { isAdmin } = require('../middlewares/isAdmin');
const { isAuthenticated } = require('../middlewares/isAuth');

adminRouter.get('/admin-details', getAdminDetailsPage);

module.exports = adminRouter;