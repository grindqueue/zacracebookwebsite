const express = require('express');
const productRouter = express.Router();
const { addCategory } = require('../controllers/product');

productRouter.post('/add-category', addCategory);

module.exports = productRouter;