// backend/routes/restaurantAuthRoutes.js
import express from 'express';
const router = express.Router();
import {
  registerRestaurant,
  authRestaurant,
  getRestaurantProfile,
} from '../controllers/restaurantAuthController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

router.post('/register', registerRestaurant);
router.post('/login', authRestaurant);
router.route('/me').get(protect, authorize('restaurant'), getRestaurantProfile);

export default router;