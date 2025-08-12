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
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: false,
        minLength: [1, "comments must have at least one character"],
        maxLength: [500, "Comment must not exceed 500 chracters"]
    }
},{
    timestamps: true
})

module.exports = mongoose.model("Rating", ratingSchema)