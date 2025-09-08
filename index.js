const express = require('express');
const database = require('./connectDB/database');
const cors = require('cors');

const router = require('./routes/authRouter');
const productRouter = require('./routes/productRouter');  
const reviewRouter = require('./routes/ratingRouter');
const paymentRouter = require('./routes/paymentRouter.js')
const adminRouter = require('./routes/adminRouter');
const userRouter = require('./routes/userRouter');


const isAuthenticated = require('./middlewares/isAuth');
const app = express();
const morgan = require('morgan');


app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "*"
}
));


app.listen(3001, () => {
    console.log('Server is running on port 3001');
    try {
        database();
        console.log('Database connection established successfully');
    } catch (error) {
        console.error('Error starting the server:', error);
    }
});


app.use('/ebook/auth', router);
app.use('/ebook/products', productRouter);
app.use('/review', reviewRouter);
app.use(paymentRouter);
app.use(adminRouter);
app.use('/user', userRouter);

app.get("/api/me", isAuthenticated, (req, res) => {
  res.json({ user: req.user });
});