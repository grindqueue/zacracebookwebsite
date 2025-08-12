const express = require('express');
const database = require('./connectDB/database');
const cors = require('cors');
const router = require('./routes/authRouter');
const productRouter = require('./routes/product');  
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
app.use('/ebook/product', productRouter);