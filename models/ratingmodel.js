const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4, 5]
    },
    comment: {
        type: String,
        required: false,
        minLength: [1, "comments must have at least one character"],
        maxLength: [500, "Comment must not exceed 500 chracters"]
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }],
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }]
},{
    timestamps: true
})

module.exports = mongoose.model("Rating", ratingSchema)