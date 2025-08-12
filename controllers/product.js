const Category = require('../models/category');

const addCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${req.body.name}$`, "i") }
        });
        if (existingCategory) {
            return res.status(400).json({ error: 'Category already exists' });
        }
        const newCategory = new Category({ name });
        await newCategory.save();
        res.status(201).json({ 
            message: 'Category added successfully', 
            category: newCategory });
    } catch (error) {
        console.error(error.error || error.message || 'Error adding category');
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    addCategory
}