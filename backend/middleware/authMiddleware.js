// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Restaurant from '../models/restaurantModel.js';

// Protect routes: Check for token and attach user data
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Determine which model to search based on the role in the token
      if (decoded.role === 'customer' || decoded.role === 'delivery') { // MODIFIED: Added 'delivery'
        req.user = await User.findById(decoded.id).select('-password');
        req.userRole = decoded.role; // Use decoded role for precision
      } else if (decoded.role === 'restaurant') {
        req.user = await Restaurant.findById(decoded.id).select('-password');
        req.userRole = 'restaurant';
      }

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Authorize roles: Check if the user has the required role
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403);
      throw new Error(`User role ${req.userRole} is not authorized to access this route`);
    }
    next();
  };
};

export { protect, authorize };