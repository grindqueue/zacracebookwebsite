const mongoose = require('mongoose')

const orderDetails = new mongoose.Schema({
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    order: {
        type: mongoose.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    quantity:{
        type: Number,
        required: true,
        default: 0
    },
    price:{
        type: Number,
        required: true,
    }
},{
    timestamps: true
})

module.exports = mongoose.model('OrderDetails', orderDetails)