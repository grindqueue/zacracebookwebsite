const mongoose = require('mongoose')

const OrderDetails = new mongoose.Schema({
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    price: {
        type: Number,
        required: true,
    },
    order: {
        type: mongoose.Types.ObjectId,
        ref: 'Order',
        required: true
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('OrderDetails', OrderDetails)
