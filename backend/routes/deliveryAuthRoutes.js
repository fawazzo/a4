// backend/routes/deliveryAuthRoutes.js
import express from 'express';
const router = express.Router();
import {
  registerDelivery,
  authDelivery,
  getDeliveryProfile,
} from '../controllers/deliveryAuthController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

router.post('/register', registerDelivery);
router.post('/login', authDelivery);
router.route('/me').get(protect, authorize('delivery'), getDeliveryProfile);

export default router;