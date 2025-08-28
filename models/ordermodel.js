const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    orderDetails: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderDetails',
    }],
    totalPrice: {
        type: Number,
        required: true,
    },
    reference: {
        type: String,
        required: true,
        unique: true
    },
    status: {  
        type: String,
        enum: ["completed", "failed", "pending"],
        default: "pending",
    },
    format: {
        type: String,
        enum: ["ebook", "audiobook"],
        required: true,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema)
