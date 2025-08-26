const jwt = require('jsonwebtoken');
const User = require('../models/usermodels');
require('dotenv').config();

const isAuthenticated = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: "No token provided, authorization denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: "User not found, authorization denied" });
    }

    if (req.query.user && req.query.user !== decoded.id) {
      return res.status(403).json({ message: "User mismatch, forbidden" });
    }

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = isAuthenticated;
