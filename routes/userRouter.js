const express = require('express');
const userRouter = express.Router();
const isAuthenticated = require('../middlewares/isAuth');
const { getPurchasedBooks, getTransactionHistory, streamBookFile, streamBookFileWithPreview } = require('../admincontroller/adminForms.js')


userRouter.get('/transactions/:userId', isAuthenticated, getTransactionHistory)
userRouter.get('/stream-book/:productId', streamBookFile);
userRouter.get('/purchased-books/:userId', getPurchasedBooks);
userRouter.get('/stream-book-preview/:productId', streamBookFileWithPreview);

module.exports = userRouter;