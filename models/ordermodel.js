const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    reference: {
        type: String,
        required: true,
        unique: true
    },
    price: {
        type: Number,
        required: true,
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
