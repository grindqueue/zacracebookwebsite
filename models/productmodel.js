const mongoose = require("mongoose");

const formatSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["ebook", "audiobook"],
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  numberOfPages: {
    type: Number,
    required: function () {
      return this.type === "ebook";
    },
  },
  durationInMinutes: {
    type: Number,
    required: function () {
      return this.type === "audiobook";
    },
  },
  fileSizeMB: {
    type: Number,
  },
  price: {
    type: Number,
    required: true,
    min: [0, "Price must be a positive number"],
  },
}, { _id: false });

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minLength: [2, "Book title must be at least 2 characters"],
    maxLength: [200, "Book title must not exceed 200 characters"],
  },
  author: [
    {
      type: String,
      required: true,
      trim: true,
      minLength: [2, "Author name must be at least 2 characters"],
      maxLength: [100, "Author name must not exceed 100 characters"],
    },
  ],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  coverImageUrl: {
    type: String,
    required: true,
  },
  formats: {
    type: [formatSchema],
    validate: [arr => arr.length > 0, "At least one format (ebook or audiobook) is required"],
  },
  ratings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rating",
    },
  ],
  averageReview: {
    type: Number,
    default: 0,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  bookDescription: {
    type: String,
    required: true,
    trim: true,
    minLength: [10, "Book description must be at least 10 characters long"],
    maxLength: [1000, "Book description must not exceed 1000 characters"],
  },
  amountSold: {
    type: Number,
    default: 0,
  },
}, { 
    timestamps: true 
});

module.exports = mongoose.model("Product", productSchema);
