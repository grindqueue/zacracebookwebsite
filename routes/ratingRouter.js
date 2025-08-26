const express = require('express');
const reviewRouter = express.Router();
const { addReview, editReview, deleteReview, disLikeRating, likeRating } = require('../controllers/review');
const isAuthenticated = require('../middlewares/isAuth');

reviewRouter.post('/:productId/add-review', isAuthenticated, addReview);
reviewRouter.put('/:productId/edit-review', isAuthenticated, editReview);
reviewRouter.delete('/:productId/delete-review', isAuthenticated, deleteReview);
reviewRouter.post('/:productId/like-review', isAuthenticated, likeRating);
reviewRouter.post('/:productId/dislike-review', isAuthenticated, disLikeRating);

module.exports = reviewRouter;