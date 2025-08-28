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
    provider: {
        type: String,
        enum: ["local", "google"],
        default: "local",
        required: true,
    },
    password: {
        required: function () {
            return this.provider === 'local';
        },
        validate: { 
            validator: function (v) {
                if (this.provider === 'local') {
                    return typeof v === 'string' && v.length >= 8 && v.length <= 150;
                }
                return true;
            }
        },
        type: String,
        message: 'Password must be between 8 and 150 characters long'
    },
    providerId: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v) {
                return this.provider === 'google' ? v != null : true;
            }
        },
    },
    
    gender: {
        type: String,
        enum: ["Male", "Female", "Rather not say"],
        required: function () {
            return this.provider === 'local';
        }
    },
    orders:[{
        type: mongoose.Types.ObjectId,
        ref: 'Order',
        required: false,
    }],
    purchasedBooks: [{
        product: {
            type: mongoose.Types.ObjectId,
            ref: "Product",
            required: true
        },
        formatType: {
            type: String,
            enum: ["ebook", "audiobook"],
            required: true
        },
        purchasedAt: {
            type: Date,
            default: Date.now
        }
    }],
    cart: {
        type: mongoose.Types.ObjectId,
        ref: 'Cart',
        required: false
    },
    ratings: [{
        type: mongoose.Types.ObjectId,
        ref: 'Rating',
        required: false
    }],
    role: {
        type: String,
        enum: ["Admin", "Buyer", "Seller"]
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