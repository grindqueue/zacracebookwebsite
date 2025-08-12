const express = require('express');
const productRouter = express.Router();
const { addCategory, fetchCategories } = require('../controllers/product');

productRouter.post('/add-category', addCategory);
productRouter.get('', fetchCategories);

module.exports = productRouter;