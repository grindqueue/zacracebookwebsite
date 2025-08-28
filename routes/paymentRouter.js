const { verifyPayment, initiatePayment } = require('../admincontroller/paystack');
const express = require('express');
const paymentRouter = express.Router();

paymentRouter.post('/initiate-payment/:id', initiatePayment);
paymentRouter.get('/verify-payment', verifyPayment);

module.exports = paymentRouter;