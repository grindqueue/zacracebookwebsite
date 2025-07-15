const express = require('express');

const router = express.Router();

const { signUp, signIn, forgetPassword, resetPassword, verifyOtp, resendOtp } = require('../controllers/auth');

router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/forget-password', forgetPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

module.exports = router;