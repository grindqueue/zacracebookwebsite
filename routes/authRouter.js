const express = require('express');

const router = express.Router();

const { signUp, signIn, forgetPassword, resetPassword, verifyOtp, resendOtp } = require('../controllers/localAuth');
const { googleCallback, createGoogleLink } = require('../controllers/googleAuth');
router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/forget-password', forgetPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.get('/google', createGoogleLink);
router.get('/google/callback', googleCallback);


module.exports = router;