// backend/models/orderModel.js
import mongoose from 'mongoose';

const orderItemSchema = mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  priceAtTimeOfOrder: { type: Number, required: true },
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'MenuItem',
  },
});

const orderSchema = mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Restaurant',
    },
    deliveryPerson: { // ADDED FIELD
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // References the User model for the delivery person
      required: false,
    },
    items: [orderItemSchema], // Array of the embedded orderItemSchema
    totalAmount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    // --- NEW FIELD FOR DELIVERY FEE ---
    deliveryFee: { 
      type: Number,
      required: true,
      default: 50.00, // Fixed 50 TL fee
    },
    // ----------------------------------
    customerAddress: {
      type: String, // Snapshot of where the food is going
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: 'Pending',
      enum: ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivering', 'Delivered', 'Cancelled'], // MODIFIED: Added 'Delivering'
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;