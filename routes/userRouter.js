const express = require('express');
const userRouter = express.Router();
const isAuthenticated = require('../middlewares/isAuth');
const { getPurchasedBooks } = require('../admincontroller/adminForms.js')


userRouter.get('/transactions/:userId', getPurchasedBooks);

module.exports = userRouter;