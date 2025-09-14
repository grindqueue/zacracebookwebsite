const express = require('express');
const userRouter = express.Router();
const isAuthenticated = require('../middlewares/isAuth');
const { getPurchasedBooks, getTransactionHistory, streamBookFile } = require('../admincontroller/adminForms.js')


userRouter.get('/transactions/:userId', getTransactionHistory)
userRouter.get('/stream-book/:productId', streamBookFile);

module.exports = userRouter;