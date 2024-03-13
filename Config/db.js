const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const connectionString = 'mongodb+srv://bahaeddine170:MS6A1pGqyi4WBCRb@pidev.idvzrbf.mongodb.net/PIDEV';

        await mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to the database');
    } catch (error) {
        console.error('Error connecting to the database:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
