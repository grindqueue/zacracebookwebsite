const express = require('express');
const productRouter = express.Router();
const { addCategory, fetchCategories } = require('../controllers/product');
const { addProduct, getHomepageProducts, getProductFullDetails} = require('../admincontroller/shop');
// category routes
productRouter.post('/add-category', addCategory);
//productRouter.get( fetchCategories);

// product routes
productRouter.post('/add-product', addProduct);
productRouter.get('/shop',getHomepageProducts);
productRouter.get('/:productId', getProductFullDetails);

module.exports = productRouter;