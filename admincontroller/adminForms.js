const Product = require('../models/productmodel')
const User = require('../models/usermodels')
const Order = require('../models/ordermodel') 
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const Category = require('../models/category')
const axios = require('axios');

require('dotenv').config()


const getPurchasedBooks = async (req, res) => {
  try {
    const userId = req.params.userId;
    const completedOrders = await Order.find({ 
        user: userId, 
        status: "completed" 
      })
      .populate({
        path: "product",
        select: "_id title author coverImageUrl formats"
      });

    if (!completedOrders || completedOrders.length === 0) {
      return res.status(404).json({ message: "No completed purchases found" });
    }

    const purchases = completedOrders.map(order => ({
      productId: order.product?._id, 
      title: order.product?.title,
      author: order.product?.author,
      coverImageUrl: order.product?.coverImageUrl,
      format: order.format,
      price: order.price, // pulled directly from Order
      purchasedAt: order.createdAt
    }));

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
    const userId = req.user._id;
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
const adminSignin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const foundUser = await User.findOne({ email });

        if (!foundUser) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        if(foundUser.provider !== 'local') {
            return res.status(403).json({ message: "Please sign in with Google" });
        }
        const passwordMatch = await bcrypt.compare(password, foundUser.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        if (foundUser.role !== "Admin") {
            return res.status(403).json({ message: "Access denied, not an admin" });
        }

        const token = jwt.sign(
            { id: foundUser._id, email: foundUser.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY }
        );

        return res.status(200).json({
            _id: foundUser._id,
            name: foundUser.name,
            email: foundUser.email,
            token,
            isVerified: foundUser.isVerified,
            isAdmin: foundUser.isAdmin,
            message: "Admin signed in successfully"
        });

    } catch (error) {
        console.error("Error during signin:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
const getAdminDashboard = async (req, res) => {
  try {
    // 1. Total Users
    const totalUsers = await User.countDocuments();

    // 2. Successful Orders (populate product with category)
    const completedOrders = await Order.find({ status: "completed" })
      .populate({
        path: "product",
        select: "category",
        populate: { path: "category", select: "name" }
      });

    // 3. Revenue + total format breakdown
    let totalRevenue = 0;
    let ebookSold = 0;
    let audiobookSold = 0;

    for (const order of completedOrders) {
      totalRevenue += order.price * order.quantity;
      if (order.format === "ebook") {
        ebookSold += order.quantity;
      } else if (order.format === "audiobook") {
        audiobookSold += order.quantity;
      }
    }

    // 4. Available Products (count formats)
    let availableEbook = 0;
    let availableAudiobook = 0;

    const availableProducts = await Product.find();
    for (const eachProduct of availableProducts) {
      for (const format of eachProduct.formats) {
        if (format.type === "ebook") {
          availableEbook += 1;
        } else if (format.type === "audiobook") {
          availableAudiobook += 1;
        }
      }
    }

    // 5. Category Sales
    const categories = await Category.find().select("_id name");

    // build stats object for quick lookup
    let categorySales = categories.map(cat => ({
      categoryId: cat._id,
      categoryName: cat.name,
      formats: { ebook: 0, audiobook: 0 }
    }));

    for (const order of completedOrders) {
      if (!order.product || !order.product.category) continue;

      const categoryStat = categorySales.find(
        cat => cat.categoryId.toString() === order.product.category._id.toString()
      );

      if (categoryStat) {
        if (order.format === "ebook") {
          categoryStat.formats.ebook += order.quantity;
        } else if (order.format === "audiobook") {
          categoryStat.formats.audiobook += order.quantity;
        }
      }
    }

    // 6. Response
    res.status(200).json({
      users: totalUsers,
      revenue: totalRevenue,
      ebook: {
        amountSold: ebookSold,
        available: availableEbook,
      },
      audiobook: {
        amountSold: audiobookSold,
        available: availableAudiobook,
      },
      amountSold: categorySales,
    });

  } catch (error) {
    console.error(error.message || "Something went wrong while getting admin dashboard");
    res.status(500).json({ message: "Internal server error" });
  }
};
const getTransactionHistory = async (req, res) => {
  try{
    const userId = req.params.userId;
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).json({ message: "User not found" });
    }
    const transactions = await Order.find({ user: userId })
    .populate('product', 'title author coverImageUrl')
    .sort({ createdAt: -1 });
    res.status(200).json({ transactions });
  }catch{
    console.log(error.message || "Something went wrong while getting transaction history");
    res.status(500).json({ message: "Internal server error" });
  }
}
const streamBookFile = async (req, res) => {
  try {
    const productId = req.params.productId;
    const formatType = req.query.format;
    const userId = req.query.user;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!formatType || !["ebook", "audiobook"].includes(formatType)) {
      return res.status(400).json({ message: "Invalid or missing format type" });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const hasPurchased = user.purchasedBooks.some(purchase => 
      purchase.product.toString() === productId && purchase.formatType === formatType
    );
    if (!hasPurchased) {
      return res.status(403).json({ message: "Access denied. You have not purchased this book in the requested format." });
    }
    const format = product.formats.find(f => f.type === formatType);
    if (!format || !format.fileUrl) {
      return res.status(404).json({ message: `File for format ${formatType} not found` });
    }

    const fileUrl = format.fileUrl.replace(/\+/g, '%20');
    const response = await axios.get(fileUrl, { responseType: "stream" });
    res.setHeader("Content-Type", response.headers["content-type"] || "application/octet-stream");

    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    response.data.pipe(res);
  }catch (error) {
    if (error.response) {
      console.error("Axios error:", {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data?.toString().slice(0, 200) // preview only
      });
    } else {
      console.error("General error:", error.message);
    }
    return res.status(500).json({ message: "Internal server error" });
  }
}
const streamBookFileWithPreview = async (req, res) => {
  try {
    const productId = req.params.productId;
    const formatType = req.query.format;
    const userId = req.query.user;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!formatType || !["ebook", "audiobook"].includes(formatType)) {
      return res.status(400).json({ message: "Invalid or missing format type" });
    }
    const product = await Product.findById(productId);  
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const hasPurchased = user.purchasedBooks.some(purchase => 
      purchase.product.toString() === productId && purchase.formatType === formatType
    );
    if (!hasPurchased) {
      return res.status(403).json({ message: "Access denied. You have not purchased this book in the requested format." });
    }
    const format = product.formats.find(f => f.type === formatType);
    if (!format || !format.fileUrl) {
      return res.status(404).json({ message: `File for format ${formatType} not found` });
    }
    const fileUrl = format.fileUrl.replace(/\+/g, '%20');
    return res.status(200).json({ previewUrl: fileUrl });
  } catch (error) {
    console.error("Error in streamBookFileWithPreview:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
module.exports = {
    getPurchasedBooks,
    getAdminDetailsPage,
    adminSignin,
    getAdminDashboard,
    getTransactionHistory,
    streamBookFile,
    streamBookFileWithPreview
};