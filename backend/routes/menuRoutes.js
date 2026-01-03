// backend/routes/menuRoutes.js
import express from 'express';
const router = express.Router();
import {
  getMenuItemsByRestaurant,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menuController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

// Public: Get menu for a specific restaurant
router.route('/restaurant/:restaurantId').get(getMenuItemsByRestaurant);

// Private/Restaurant Management Routes
router.route('/')
    .post(protect, authorize('restaurant'), createMenuItem);

router.route('/:id')
    .put(protect, authorize('restaurant'), updateMenuItem)
    .delete(protect, authorize('restaurant'), deleteMenuItem);

export default router;