const User = require('../models/usermodels');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')
require('dotenv').config();
const { sendMail, generateOtp } = require('./sendmail');
const mongoose = require('mongoose');

const signUp = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Please enter a valid email address" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "User already exists, please sign in." });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number." });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      provider: 'local',
    });

    await newUser.save({ session });

    const otp = generateOtp();
    const expiresIn = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await User.findByIdAndUpdate(
      newUser._id,
      { OTP: otp, expiresIn },
      { session }
    );

    sendMail(email, "Zacracebook OTP", `Your OTP is ${otp}. It will expire in 10 minutes.`);

    const token = jwt.sign(
      { email, id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "User created successfully. OTP sent to your email.",
      token,
      name: newUser.name,
      email: newUser.email,
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: "Internal server error. Please try again." });
  }
};
const signIn = async(req, res) =>{
    try {
        const {email, password} = req.body;
        if (!email || !password){
            return res.status(400).json({message : "All fields are required"})
        }
        const isUser = await User.findOne({email});
        if(!isUser){
            return res.status(404).json({message : "User not found, please sign up"})
        }
        if (isUser.provider !== "local") {
            return res.status(400).json({message : "Please sign in with Google"})
        }
        const passwordMatch = await bcrypt.compare(password, isUser.password);
        if(!passwordMatch){
            return res.status(401).json({message : "Invalid credentials, please try again"})
        }
        const token = jwt.sign(
            {email, id : isUser._id}, 
            process.env.JWT_SECRET, 
            {expiresIn: process.env.JWT_EXPIRY}
        );
        res.status(200).json({
            message: "User signed in successfully",
            user: {
                id: isUser._id,
                name: isUser.name,
                email: isUser.email,
                isVerified: isUser.isVerified
            },
            token: token
        })
    } catch (error) {
        console.log("Error signing in", error.error),
        res.status(500).json({message : "Internal server error, please try again"})
    }
}
const forgetPassword = async(req, res) => {
    try {
        const {email} = req.body;
        if(!email) {
            return res.status(400).json({message : "Email is required"})
        }
        const userExist = await User.findOne({email});
        if(!userExist) {
            return res.status(404).json({message : "User not found, please sign up"})
        }
        res.status(200).json({message: "password reset link sent to your mail"})
        const token = jwt.sign(
            {email, id: userExist._id},
            process.env.JWT_SECRET,
            {expiresIn: "10m"}
        )
        const resetlink = `http://localhost:3000/ebook/auth/reset-password/${token}`;
        sendMail(email, "Zacracebook Password Reset", `Click on the link to reset your password: ${resetlink}. It will expire in 10 minutes.`);
    } catch (error) {
        console.log("Error in forget password", error.error),
        res.status(500).json({message : "Internal server error, please try again"})  
    }
}
const resetPassword = async(req, res) => {
    try {
        const {token} = req.params;
        if (!token) {
            return res.status(400).json({message : "Token is required"})
        }
        const decoded = await jwt.verify(req.params.token, process.env.JWT_SECRET);
        const { newPassword, confirmPassword } = req.body;

        if (!newPassword ||!confirmPassword){
            return res.status(400).json({message : "All fields are required"})
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({message : "Passwords do not match"})
        }
        
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({message : "User not found, Invalid or expired token"})
        }
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await User.findByIdAndUpdate(
            {_id: user._id},
            {$set: {password: hashedPassword}},
        )
        res.status(200).json({message : "Password reset successfully"})
    } catch (error) {
        console.log("Error in reset password", error.error),
        res.status(500).json({message : "Internal server error, please try again"})    
    }
}
const verifyOtp = async(req, res) => {
    try {
        const {email, otp} = req.body;

        if (!email){
            return res.status(400).json({message : "Email is required"})
        }

        const user = await User.findOne({email}).select('isVerified');
        if (user.isVerified) {
            return res.status(400).json({message : "User already verified, please sign in"})
        }

        if (!otp){
            return res.status(400).json({message : "OTP is required"})
        }
        const generatedOtp = await User.findOne({email}).select('OTP');
        if (!user) {
            return res.status(404).json({message : "User not found, please sign up"})
        }
        if (generatedOtp.OTP !== otp) {
            return res.status(400).json({message : "Invalid OTP, please try again"})
        }
        const currentTime = new Date();
        if (currentTime > user.expiresIn) {
            await User.findByIdAndUpdate(
                {id: user._id},
                {$unset: {OTP: "", expiresIn: ""}}
            )
            return res.status(400).json({message : "OTP has expired, please request a new one"})
        }

        await User.findByIdAndUpdate(user._id,{
            $unset:  {OTP: "", expiresIn: ""},
            $set: {isVerified: true}
        })
        return res.status(200).json({message : "OTP verified successfully"})

    } catch (error) {
        console.log("Error verifying OTP", error.error),
        res.status(500).json({message : "Internal server error, please try again"})
    }
}
const resendOtp = async(req, res) => {
    try {
        const {email} = req.body;
        if (!email) {
            return res.status(400).json({message : "Email is required"})
        }
        const user = await User.findOne({email});
        if (!user) {
            return res.status(404).json({message : "User not found, please sign up"})
        }
        const isVerified = await User.findOne({email}).select('isVerified');
        if (isVerified.isVerified) {
            return res.status(400).json({message : "User already verified, please sign in"})
        }
        const otp = generateOtp();
        const expiresIn = new Date(Date.now() + 10 * 60 * 1000);
        const currentTime = new Date();
        await User.findByIdAndUpdate(user._id,
            {$set : {OTP: otp, expiresIn: expiresIn}}
        );
        await sendMail(email, "ZACRACEBOOK OTP", `Your new OTP is ${otp}. OTP will expires in 10 minutes.`);
        res.status(200).json({message : "OTP resent successfully, please check your email"});
    } catch (error) {
        console.log("Error resending OTP", error.error),
        res.status(500).json({message : "Internal server error, please try again"})       
    }
}
module.exports = {
    signUp,
    signIn,
    forgetPassword,
    resetPassword,
    verifyOtp,
    resendOtp
};