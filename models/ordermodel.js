const mongoose = require('mongoose');
const orderDetails = require('./orderDetails');


const orderSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    orderDetails: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderDetails',
        required: false
    }],
    totalPrice: {
        type: Number,
        required: true,
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema)