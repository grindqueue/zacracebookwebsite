const Product = require('../models/productmodel')
const User = require('../models/usermodels')
const Order = require('../models/ordermodel')

const getPurchasedBooks = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId)
      .populate({
        path: "purchasedBooks.product",
        select: "title author coverImageUrl formats"
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.purchasedBooks.length === 0) {
      return res.status(404).json({ message: "No purchased books found" });
    }
    const purchases = user.purchasedBooks.map(p => {
      return {
        title: p.product?.title,
        author: p.product?.author,
        coverImageUrl: p.product?.coverImageUrl,
        format: p.formatType,
        price: p.product?.formats.find(f => f.type === p.formatType)?.price,
        purchasedAt: p.purchasedAt
      };
    });

    res.status(200).json({
      message: "Purchased books fetched successfully",
      purchases
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Something went wrong fetching purchases" });
  }
};
const getAdminDetailsPage = async (req, res) => {
  try {
    const userId = req.query.id;
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate("category", "name");

    const report = products.map(product => {
      const priceMap = {};
      product.formats.forEach(fmt => {
        priceMap[fmt.type] = fmt.price;
      });

      return {
        title: product.title,
        category: product.category?.name || "Uncategorized",
        amountSold: product.amountSold,
        price: priceMap
      };
    });

    res.json({ report });
  } catch (error) {
    console.log(error.message || "Something went wrong while getting admin report");
    res.status(500).json({
      message: "Something went wrong while getting admin report"
    });
  }
};

module.exports = {
    getPurchasedBooks,
    getAdminDetailsPage
};