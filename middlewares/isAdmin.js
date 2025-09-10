const User = require('../models/usermodels');

const isAdmin = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.role !== 'Admin') {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        next();
    } catch (error) {
        console.log(error.error || error.message || "Something went wrong in isAdmin middleware");
        return res.status(500).json({ message: "Internal server error" }); 
    }
}
module.exports = {
    isAdmin
};