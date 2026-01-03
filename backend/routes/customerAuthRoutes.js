// backend/routes/customerAuthRoutes.js
import express from 'express';
const router = express.Router();
import {
  registerUser,
  authUser,
  getUserProfile,
} from '../controllers/customerAuthController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

// Public routes for registration and login
router.post('/register', registerUser);
router.post('/login', authUser);

// Private route for getting the customer's profile (requires authentication and customer role)
router.route('/me').get(protect, authorize('customer'), getUserProfile);

export default router;