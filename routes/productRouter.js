const express = require('express');
const productRouter = express.Router();
const { addCategory, fetchCategories } = require('../controllers/product');
const { addProduct, getHomepageProducts, getProductFullDetails, editProduct, deleteProduct, searchProduct} = require('../admincontroller/shop');
const uploadMiddleware= require('../middlewares/multer.js')
const isAuthenticated= require('../middlewares/isAuth.js')
const { isAdmin } = require('../middlewares/isAdmin.js')
// category routes
productRouter.post('/add-category', addCategory);
productRouter.get('/category',isAuthenticated, isAdmin, fetchCategories)


productRouter.post('/add-product', isAuthenticated, isAdmin, uploadMiddleware, addProduct);
productRouter.put('/edit-product/:productId', isAuthenticated, isAdmin, uploadMiddleware, editProduct);
productRouter.delete('/delete-product', isAuthenticated, isAdmin, uploadMiddleware, deleteProduct);
productRouter.get('/search-product', isAuthenticated, isAdmin, searchProduct)
productRouter.get('/shop',getHomepageProducts);
productRouter.get('/:productId', getProductFullDetails);

module.exports = productRouter;