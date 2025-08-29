const Product = require('../models/productmodel');
const Category = require('../models/category');

const addProduct = async (req, res) => {
  try {
    const {category, title, author, coverImageUrl, formats, bookDescription } = req.body;

    if (!category) {
        return res.status(400).json({ message: "Category must be specified" });
    }

    const productCategory = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, "i") } });


    if (!productCategory) {
        return res.status(404).json({ message: "Specified category does not exist" });
    }
    if (!title) {
        return res.status(400).json({ message: "Book title must be included" });
    }
    if (!author || !Array.isArray(author) || author.length === 0) {    
        return res.status(400).json({ message: "At least one author is required" });
    }

    if (!coverImageUrl) {
        return res.status(400).json({ message: "Cover image URL is required" });
    }

    if (!formats || !Array.isArray(formats) || formats.length === 0) {
        return res.status(400).json({ message: "At least one format (ebook or audiobook) is required" });
    }

    for (let format of formats) {
        if (!format.type || !["ebook", "audiobook"].includes(format.type)) {
            return res.status(400).json({ message: "Format type must be either ebook or audiobook" });
        }
        if (!format.fileUrl) {
            return res.status(400).json({ message: "File URL is required for each format" });
        }
        if (format.type === "ebook" && (!format.numberOfPages || format.numberOfPages <= 0)) {
            return res.status(400).json({ message: "Number of pages is required for ebooks" });
        }
        if (format.type === "audiobook" && (!format.durationInMinutes || format.durationInMinutes <= 0)) {
            return res.status(400).json({ message: "Duration in minutes is required for audiobooks" });
        }
        if (!format.price || format.price <= 0) {
            return res.status(400).json({ message: "Price must be greater than 0" });
        }
    }

    if (!bookDescription) {
        return res.status(400).json({ message: "Book description must be added" });
    }
    const newProduct = new Product({
        category: productCategory._id,
        title,
        author,
        coverImageUrl,
        formats,
        bookDescription,
    });

    await newProduct.save();
    productCategory.products.push(newProduct._id);
    await productCategory.save();

    res.status(201).json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getHomepageProducts = async (req, res) => {
  try {
    const categories = await Category.find()
      .select("name products")
      .populate({
        path: "products",
        model: "Product",
        select: "title author coverImageUrl averageReview totalRatings formats",
      });

    const formattedCategories = categories.map(category => ({
      name: category.name,
      products: category.products.map(product => {
        const minPrice = Math.min(...product.formats.map(f => f.price));
        return {
          _id: product._id,
          title: product.title,
          author: product.author,
          coverImageUrl: product.coverImageUrl,
          averageReview: product.averageReview,
          totalRatings: product.totalRatings,
          price: minPrice
        };
      })
    }));

    res.status(200).json({
      message: "Landing page data fetched successfully",
      categories: formattedCategories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProductFullDetails = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId).select('-fileUrl')
      .populate('category', 'name')
      .populate({
        path: 'ratings',
        populate: [
          { path: 'user', select: 'name' },   
          { path: 'likes', select: 'name' },
          { path: 'dislikes', select: 'name' }
        ]
      });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);

  } catch (error) {
    console.error(error.message || 'Error fetching product details');
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = { 
    addProduct,
    getHomepageProducts,
    getProductFullDetails
 };
