const express = require('express');
const userRouter = express.Router();
const isAuthenticated = require('../middlewares/isAuth');
const { getPurchasedBooks, getTransactionHistory, streamBookFile } = require('../admincontroller/adminForms.js')


userRouter.get('/transactions/:userId', isAuthenticated, getTransactionHistory)
userRouter.get('/stream-book/:productId', isAuthenticated, streamBookFile);
userRouter.get('/purchased-books/:userId', getPurchasedBooks);

module.exports = userRouter;