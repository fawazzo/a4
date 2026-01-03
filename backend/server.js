// backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import customerAuthRoutes from './routes/customerAuthRoutes.js';
import restaurantAuthRoutes from './routes/restaurantAuthRoutes.js';
import deliveryAuthRoutes from './routes/deliveryAuthRoutes.js'; // NEW IMPORT
import restaurantRoutes from './routes/restaurantRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

// Connect Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Allows parsing of JSON request body

// Define Routes
app.use('/api/auth/customer', customerAuthRoutes);
app.use('/api/auth/restaurant', restaurantAuthRoutes);
app.use('/api/auth/delivery', deliveryAuthRoutes); // NEW ROUTE
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

// Error Handling Middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);