// backend/routes/restaurantRoutes.js
import express from 'express';
const router = express.Router();
import {
  getRestaurants,
  getRestaurantById,
  updateRestaurantProfile,
} from '../controllers/restaurantController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

router.route('/').get(getRestaurants); // Public: List all restaurants
router.route('/:id').get(getRestaurantById); // Public: View single restaurant

// Private: Update profile (Owner of the restaurant only)
router
  .route('/:id')
  .put(protect, authorize('restaurant'), updateRestaurantProfile);

export default router;