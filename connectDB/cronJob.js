const cron = require("node-cron");
const mongoose = require("mongoose");
const Product = require("../models/productmodel");
const Category = require("../models/category");
require('dotenv').config();

cron.schedule("0 2 * * *", async () => {
  console.log("Running cron job at:", new Date().toLocaleString());

  try {
    await mongoose.connect(process.env.DB_URI)
    const products = await Product.find().select("_id");
    const productIds = products.map(p => p._id.toString());

    // 2. Clean up categories
    const categories = await Category.find();
    for (const category of categories) {
      // Remove invalid product IDs
      category.products = category.products.filter(id => productIds.includes(id.toString()));

      // Add back missing product IDs
      const productsInCategory = await Product.find({ category: category._id }).select("_id");
      const productIdsInCategory = productsInCategory.map(p => p._id.toString());

      for (const pid of productIdsInCategory) {
        if (!category.products.map(p => p.toString()).includes(pid)) {
          category.products.push(pid);
        }
      }

      await category.save();
    }

    console.log("✅ Cron job completed");
  } catch (err) {
    console.error("❌ Cron job error:", err.message);
  }
});
