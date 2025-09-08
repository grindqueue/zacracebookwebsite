const axios = require('axios');
const Order = require('../models/ordermodel');
const User = require('../models/usermodels');
const Product = require('../models/productmodel');
require('dotenv').config();

const initiatePayment = async (req, res) => {
  try {
    const { email, formatType } = req.body;
    const productId = req.params.id;
    
    const productDetails = await Product.findById(productId);
    if (!productDetails) return res.status(404).json({ error: 'Product not found' });

    const format = productDetails.formats.find(f => f.formatType === formatType);
    if (!format) {
      return res.status(400).json({ error: `Format ${formatType} not available for this product` });
    }
    const price = format.price;


    if (!productId || !email || !price || !formatType) {
      return res.status(400).json({ error: 'Product ID, email, price, and formatType are required' });
    }

    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ error: 'Price must be a positive number'});
    }

    if(!['ebook', 'audiobook'].includes(formatType)){
      return res.status(400).json({ error: 'Invalid formatType. Must be either "ebook" or "audiobook"' });
    }



    const user = await User.findOne({ email }).populate("purchasedBooks.product");
    if (!user) return res.status(404).json({ error: 'User not found' });

    const alreadyPurchased = user.purchasedBooks.some(purchase =>
      purchase.product._id.toString() === productId &&
      purchase.formatType === formatType
    );
    if (alreadyPurchased) {
      return res.status(400).json({ error: 'This format of the product has already been purchased' });
    }

    const amountInKobo = price * 100;

    const paystackResponse = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amountInKobo,
        callback_url: `https://zacracebookwebsite.onrender.com/verify-payment?productId=${productId}&formatType=${formatType}`
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (paystackResponse.data.status) {
      const { authorization_url, reference } = paystackResponse.data.data;

      const newOrder = new Order({
        user: user._id,
        product: productDetails._id,
        price: price,
        reference,
        status: "pending",
        quantity: 1,
        format: formatType
      });

      await newOrder.save();
      await User.findByIdAndUpdate(user._id, { $push: { orders: newOrder._id } });

      return res.status(200).json({ authorization_url });
    }

    res.status(400).json({ error: 'Failed to initiate payment' });

  } catch (error) {
    console.error('Error initiating payment:', error.response?.data || error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
const verifyPayment = async (req, res) => {
  try {
    const { reference, productId, formatType } = req.query;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}` } });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const paymentData = response.data.data;

    console.log("Full Payment Data:", paymentData);
    console.log("Payment Status:", paymentData.status);
    if (paymentData.status === "success") {
      console.log("order reference:", reference);
      const order = await Order.findOneAndUpdate(
        { reference: reference },
        { status: "completed" },
        { new: true }
      );

      if (!order) return res.status(404).json({ error: "Order not found" });

      await User.findByIdAndUpdate(order.user, {
        $push: {
          purchasedBooks: {
            product: productId,
            formatType,
            purchasedAt: new Date()
          }
        }
      });

      await Product.updateOne(
        { _id: product._id },
        { $inc: { amountSold: 1 } }
      );


      return res.status(200).json({ message: "Payment verified and product added" });
    }

    res.status(400).json({ error: "Payment not successful" });

  } catch (error) {
    console.error("Error verifying payment:", error.response?.data || error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
module.exports = {
  initiatePayment,
  verifyPayment
};
