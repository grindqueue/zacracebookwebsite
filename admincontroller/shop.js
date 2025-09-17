const Product = require('../models/productmodel');
const Category = require('../models/category');
const { uploadToDrive } = require("./fileUpload");

const addProduct = async (req, res) => {
  try {
    const { category, title, author, formats, bookDescription } = req.body;

    if (!category) return res.status(400).json({ message: "Category must be specified" });

    const productCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${category}$`, "i") }
    });
    if (!productCategory) return res.status(404).json({ message: "Specified category does not exist" });

    if (!title) return res.status(400).json({ message: "Book title must be included" });
    if (!author || !Array.isArray(author) || author.length === 0)
      return res.status(400).json({ message: "At least one author is required" });

    if (!req.file) return res.status(400).json({ message: "Cover image must be uploaded" });

    if (!formats || !Array.isArray(formats) || formats.length === 0)
      return res.status(400).json({ message: "At least one format (ebook or audiobook) is required" });

    if (!bookDescription) return res.status(400).json({ message: "Book description must be added" });

    const coverImageUrl = req.file.path;

    let uploadedFormats = [];
    if (req.files && req.files.formats) {
      for (let i = 0; i < req.files.formats.length; i++) {
        const format = formats[i];
        const file = req.files.formats[i];

        if (!format.type || !["ebook", "audiobook"].includes(format.type)) {
          return res.status(400).json({ message: "Format type must be either ebook or audiobook" });
        }
        if (!format.price || format.price <= 0) {
          return res.status(400).json({ message: "Price must be greater than 0" });
        }
        if (format.type === "ebook" && (!format.numberOfPages || format.numberOfPages <= 0)) {
          return res.status(400).json({ message: "Number of pages is required for ebooks" });
        }
        if (format.type === "audiobook" && (!format.durationInMinutes || format.durationInMinutes <= 0)) {
          return res.status(400).json({ message: "Duration in minutes is required for audiobooks" });
        }

        const fileId = await uploadToDrive(file);

        uploadedFormats.push({
          type: format.type,
          numberOfPages: format.numberOfPages,
          durationInMinutes: format.durationInMinutes,
          fileSizeMB: (file.size / (1024 * 1024)).toFixed(2),
          price: format.price,
          fileUrl: fileId,
        });
      }
    }
    const newProduct = new Product({
      category: productCategory._id,
      title,
      author,
      coverImageUrl, // Cloudinary
      formats: uploadedFormats, // Drive
      bookDescription,
    });

    await newProduct.save();
    productCategory.products.push(newProduct._id);
    await productCategory.save();

    res.status(201).json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    console.error("Error in addProduct:", error.message);
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
const editProduct = async (req, res) => {
  try {
    const { category, title, author, formats, bookDescription } = req.body;
    const productId = req.params.productId;

    if (!productId) {
      return res.status(403).json({ message: "Product id is not passed" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!category) return res.status(400).json({ message: "Category must be specified" });

    const productCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${category}$`, "i") }
    });
    if (!productCategory) return res.status(404).json({ message: "Specified category does not exist" });

    if (!title) return res.status(400).json({ message: "Book title must be included" });
    if (!author || !Array.isArray(author) || author.length === 0)
      return res.status(400).json({ message: "At least one author is required" });

    if (!formats || !Array.isArray(formats) || formats.length === 0)
      return res.status(400).json({ message: "At least one format (ebook or audiobook) is required" });

    if (!bookDescription) return res.status(400).json({ message: "Book description must be added" });

    let coverImageUrl = product.coverImageUrl;
    if (req.file) {
      const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
        folder: "products/covers"
      });
      coverImageUrl = uploadedImage.secure_url;
    }

    let uploadedFormats = [];
    if (req.files && req.files.formats) {
      for (let i = 0; i < req.files.formats.length; i++) {
        const format = formats[i];
        const file = req.files.formats[i];

        if (!format.type || !["ebook", "audiobook"].includes(format.type)) {
          return res.status(400).json({ message: "Format type must be either ebook or audiobook" });
        }
        if (!format.price || format.price <= 0) {
          return res.status(400).json({ message: "Price must be greater than 0" });
        }
        if (format.type === "ebook" && (!format.numberOfPages || format.numberOfPages <= 0)) {
          return res.status(400).json({ message: "Number of pages is required for ebooks" });
        }
        if (format.type === "audiobook" && (!format.durationInMinutes || format.durationInMinutes <= 0)) {
          return res.status(400).json({ message: "Duration in minutes is required for audiobooks" });
        }

        const fileId = await uploadToDrive(file);

        uploadedFormats.push({
          type: format.type,
          numberOfPages: format.numberOfPages,
          durationInMinutes: format.durationInMinutes,
          fileSizeMB: (file.size / (1024 * 1024)).toFixed(2),
          price: format.price,
          fileUrl: fileId,
        });
      }
    } else {
      uploadedFormats = product.formats;
    }

    product.category = productCategory._id;
    product.title = title;
    product.author = author;
    product.coverImageUrl = coverImageUrl;
    product.formats = uploadedFormats;
    product.bookDescription = bookDescription;

    await product.save();

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("Error in editProduct:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const deleteProduct = async(req, res) => {
  try {
    const productId = req.query.productId

    if(!productId){
      return res.status(403).json({
        message: "Product id not passed"
      })
    }
    const product = await Product.findByIdAndDelete(productId)
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }
    await Category.updateOne(
      { _id: product.category },
      { $pull: { products: productId } }
    );
    
  } catch (error) {
    console.log(error.error || error.message || "Something went wrong while deleting the product")
    return res.status(500).json({
      message: "Internal server error"
    })
  }
}
const searchProduct = async (req, res) => {
  try {
    const searchTerm = req.query.search;

    if (!searchTerm) {
      return res.status(400).json({ message: "Search term is required" });
    }
    const productFound = await Product.findOne({
      title: { $regex: searchTerm, $options: "i" },
    })
    .populate("category", "name")
    .select('-ratings')
    if (!productFound) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      result: productFound,
    });
  } catch (error) {
    console.error(error.message || "Something went wrong when searching for products");
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
module.exports = { 
    addProduct,
    getHomepageProducts,
    getProductFullDetails,
    editProduct,
    searchProduct,
    deleteProduct
};
