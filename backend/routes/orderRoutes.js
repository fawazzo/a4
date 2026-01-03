// backend/routes/orderRoutes.js
import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  addOrderItems,
  getMyOrders,
  getRestaurantOrders,
  updateOrderStatus,
  getAvailableOrders, 
  getActiveDeliveries, 
  acceptDelivery, 
  getDeliveryHistory, // <--- NEW IMPORT
} from '../controllers/orderController.js';

// Customer: Place a new order
router.route('/').post(protect, authorize('customer'), addOrderItems);

// Customer: View their orders
router.route('/customer').get(protect, authorize('customer'), getMyOrders);

// Restaurant: View orders received by their restaurant
router.route('/restaurant').get(protect, authorize('restaurant'), getRestaurantOrders);

// Delivery: View available orders (Ready for Pickup)
router.route('/delivery/available').get(protect, authorize('delivery'), getAvailableOrders);

// Delivery: View active assigned orders (Delivering)
router.route('/delivery/active').get(protect, authorize('delivery'), getActiveDeliveries);

// --- NEW ROUTE: Delivery History ---
router.route('/delivery/history').get(protect, authorize('delivery'), getDeliveryHistory);

// Delivery: Accept an order (sets assignment and status to 'Delivering')
router.route('/:id/accept').put(protect, authorize('delivery'), acceptDelivery);

// Restaurant/Delivery: Update status of an order
router.route('/:id/status').put(protect, authorize(['restaurant', 'delivery']), updateOrderStatus); 

export default router;