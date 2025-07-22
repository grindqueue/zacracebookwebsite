const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true,
        trim: true,
        minLength: [5, 'Name must be at least 5 characters long'],
        maxLength: [50, 'Name must be at most 50 characters long']
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
    },
    password: {
        required: function () {
            return this.provider === 'local';
        },
        type: String,
        minLength: [8, 'Password must be at least 8 characters long'],
        maxLength: [150, 'Password must be at most 50 characters long'],
        default: null
    },
    provider: {
        type: String,
        enum: ["local", "google"],
        default: "local",
        required: true,
    },
    providerId: {
        type: String,
        required: false,
        unique: true,
        sparse: true
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Rather not say"],
        required: function () {
            return this.provider === 'local';
        }
    },
    isVerified: {
        type: Boolean,
        default: false,
        required: false
    },
    OTP:{
        type: String,
        default: null,
        required: false
    },
    expiresIn: {
        type: Date,
        default: null,
        required: false
    }
},{
    timestamps : true
});
module.exports = mongoose.model('User', userSchema);