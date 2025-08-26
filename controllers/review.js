const Rating = require("../models/ratingmodel");
const Product = require("../models/productmodel");
const User = require("../models/usermodels");

const addReview = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.query.userId;
    const { rating, comment } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User Id is required in query" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!rating) {
      return res.status(400).json({ message: "Rating cannot be empty" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // create new rating
    const newRating = new Rating({
      user: userId,
      product: productId,
      rating,
      comment,
    });

    await newRating.save();

    product.ratings.push(newRating._id);
    user.ratings.push(newRating._id);

    const allRatings = await Rating.find({ product: productId });
    const totalRatings = allRatings.length;
    const averageReview =
      totalRatings > 0
        ? Math.round(
            (allRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings) * 10
          ) / 10
        : 0;

    product.averageReview = averageReview;
    product.totalRatings = totalRatings;

    await product.save();
    await user.save();

    return res.status(201).json({
      message: "Review added successfully",
      averageReview,
      totalRatings,
      review: newRating,
    });
  } catch (error) {
    console.error(error.message || "Something went wrong");
    return res.status(500).json({ message: "Internal server error" });
  }
};
const deleteReview = async (req, res) => {
    try {
        const userId = req.query.userId;
        const reviewId = req.query.reviewId;
        const productId = req.params.productId;

        if (!userId) return res.status(400).json({ error: "User ID is required" });

        if (!reviewId) return res.status(400).json({ error: "Review ID is required" });

        if (!productId) return res.status(400).json({ error: "Product ID is required" });

        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ error: "User not found" });

        const product = await Product.findById(productId);

        if (!product) return res.status(404).json({ error: "Product not found" });

        const rating = await Rating.findById(reviewId);
        
        if (!rating) return res.status(404).json({ error: "Review not found" });

        if (rating.user.toString() !== userId) {
            return res.status(403).json({ error: "You can only delete your own reviews" });
        }
        await Rating.findByIdAndDelete(reviewId);
        // Remove from product and user
        product.ratings.pull(reviewId);
        user.ratings.pull(reviewId);
        await product.save();
        await user.save();
        // Recalculate product rating
        
        const ratings = await Rating.find({ _id: { $in: product.ratings } });
        product.totalRatings = ratings.length;
        product.averageRating = ratings.length === 0 ? 0 : (
            ratings.reduce((sum, r) => sum + r.rating, 0) / product.totalRatings
        ).toFixed(2);
        await product.save();
        res.status(200).json({
            message: "Review deleted successfully",
            averageRating: product.averageRating,
            totalRatings: product.totalRatings,
        });

        
    } catch (error) {
        console.error(error.message || error.error || "error with delete review");
        res.status(500).json({ error: "Something went wrong" });
    }
}
const editReview = async (req, res) => {
  try {
    const productId = req.params.productId; // product being reviewed
    const userId = req.query.userId;
    const reviewId = req.query.reviewId;

    const { rating, comment } = req.body;

    if (!userId) return res.status(401).json({ message: "User Id is not passed" });
    if (!productId) return res.status(400).json({ message: "Product not found" });
    if (!reviewId) return res.status(400).json({ message: "Review not found" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const review = await Rating.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.user.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to edit this review" });
    }

    if (!rating) return res.status(400).json({ message: "Rating cannot be empty" });

    // Update review
    review.rating = rating;
    review.comment = comment;
    await review.save();

    // Recalculate ratings for this product
    const reviews = await Rating.find({ product: productId });

    product.totalRatings = reviews.length;
    product.averageReview = reviews.length
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : 0;

    await product.save();

    return res.status(200).json({
      message: "Review updated successfully",
      averageReview: product.averageReview,
      totalRatings: product.totalRatings
    });

  } catch (error) {
    console.log(error.message || "Something went wrong");
    return res.status(500).json({
      message: "Something went wrong while editing this review"
    });
  }
};
const likeRating = async (req, res) => {
  try {
    const reviewId = req.query.reviewId;
    const userId = req.query.userId;
    const productId = req.params.productId;

    if (!userId || !reviewId || !productId)
      return res.status(400).json({ error: "Missing required fields" });

    const rating = await Rating.findById(reviewId);
    if (!rating) return res.status(404).json({ error: "Review not found" });
    if (rating.product.toString() !== productId)
      return res.status(400).json({ error: "Review does not belong to this product" });

    rating.dislikes = rating.dislikes.filter(u => u.toString() !== userId);

    if (!rating.likes.includes(userId)) {
      rating.likes.push(userId);
    }

    await rating.save();

    res.status(200).json({
      message: "Reaction updated",
      likes: rating.likes.length,
      dislikes: rating.dislikes.length
    });

  } catch (error) {
    console.error(error.error || error.message || "Something went with liking review");
    res.status(500).json({ error: "Something went wrong" });
  }
};
const disLikeRating = async (req, res) => {
  try {
    const reviewId = req.query.reviewId;
    const userId = req.query.userId;
    const productId = req.params.productId;

    if (!userId || !reviewId || !productId)
      return res.status(400).json({ error: "Missing required fields" });

    const rating = await Rating.findById(reviewId);
    if (!rating) return res.status(404).json({ error: "Review not found" });
    if (rating.product.toString() !== productId)
      return res.status(400).json({ error: "Review does not belong to this product" });

    rating.likes = rating.likes.filter(u => u.toString() !== userId);

    if (!rating.dislikes.includes(userId)) {
      rating.dislikes.push(userId);
    }

    await rating.save();

    res.status(200).json({
      message: "Reaction updated",
      likes: rating.likes.length,
      dislikes: rating.dislikes.length
    });

  } catch (error) {
    console.error(error.error || error.message || "Something went with disliking review");
    res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = {
  addReview,
  editReview,
  deleteReview,
  likeRating,
  disLikeRating
};