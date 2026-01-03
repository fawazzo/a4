// backend/controllers/orderController.js
import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import MenuItem from '../models/menuItemModel.js';
import Restaurant from '../models/restaurantModel.js';
import User from '../models/userModel.js'; 

// --- Customer Logic ---

// @desc    Create new order
// @route   POST /api/orders
// @access  Private/Customer
const addOrderItems = asyncHandler(async (req, res) => {
  const { restaurantId, orderItems, customerAddress } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('Sipariş öğesi bulunamadı');
  }

  // 1. Validate restaurant
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant || !restaurant.isActive) {
    res.status(404);
    throw new Error('Restoran bulunamadı veya şu anda kapalı');
  }

  // 2. Validate items and calculate total
  let totalAmount = 0;
  const validatedItems = [];

  for (const item of orderItems) {
    const dbItem = await MenuItem.findById(item.menuItemId);

    if (!dbItem || dbItem.restaurant.toString() !== restaurantId) {
      res.status(404);
      throw new Error(`${item.menuItemId} Bu restorana ait olmayan geçersiz ürün`);
    }

    // Build the snapshot item for the order
    validatedItems.push({
      menuItem: dbItem._id,
      name: dbItem.name,
      quantity: item.quantity,
      priceAtTimeOfOrder: dbItem.price,
    });
    totalAmount += dbItem.price * item.quantity;
  }
  
  // --- MODIFICATION: ADD FIXED DELIVERY FEE (50 TL) ---
  const deliveryFee = 50.00;
  totalAmount += deliveryFee;
  // ----------------------------------------------------

  // Determine the customer address snapshot for the order.
  // Priority: 1. Address sent in request body. 2. Constructed address from user profile.
  let finalCustomerAddress = customerAddress;
  
  if (!finalCustomerAddress) {
      // Construct address from new user fields (fullAddress, il, ilce)
      const { fullAddress, ilce, il } = req.user;
      
      if (fullAddress && ilce && il) {
          finalCustomerAddress = `${fullAddress}, ${ilce}/${il}`;
      } else if (ilce && il) {
          finalCustomerAddress = `${ilce}/${il}`;
      } else if (fullAddress) {
          finalCustomerAddress = fullAddress;
      } else {
          // Fallback if no sufficient address details are available
          res.status(400);
          throw new Error('Sipariş için müşteri adresi gereklidir.');
      }
  }


  // 3. Create the Order
  const order = new Order({
    customer: req.user._id,
    restaurant: restaurantId,
    items: validatedItems,
    totalAmount: totalAmount,
    deliveryFee: deliveryFee, // ADDED: Set the fee on the order
    customerAddress: finalCustomerAddress, 
    status: 'Pending',
  });

  const createdOrder = await order.save();
  res.status(201).json(createdOrder);
});

// @desc    Get all orders for the logged-in customer
// @route   GET /api/orders/customer
// @access  Private/Customer
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id })
    .populate('restaurant', 'name address')
    .sort({ createdAt: -1 });
  res.json(orders);
});


// --- Restaurant Logic ---

// @desc    Get all orders received by the logged-in restaurant
// @route   GET /api/orders/restaurant
// @access  Private/Restaurant
const getRestaurantOrders = asyncHandler(async (req, res) => {
  // Find orders belonging to the logged-in restaurant user
  const orders = await Order.find({ restaurant: req.user._id })
    .populate('customer', 'name email fullAddress il ilce') 
    .populate('deliveryPerson', 'name') // Added deliveryPerson population
    .sort({ createdAt: -1 });

  res.json(orders);
});

// --- Delivery Logic ---

// @desc    Get all orders ready for pickup (status 'Out for Delivery' and unassigned)
// @route   GET /api/orders/delivery/available
// @access  Private/Delivery
const getAvailableOrders = asyncHandler(async (req, res) => {
    // Orders that are ready to be picked up by *any* delivery person
    const orders = await Order.find({ 
        status: 'Out for Delivery', // CRITICAL: This is the status the Restaurant sets
        deliveryPerson: null // Only unassigned orders (null works better than $exists: false after the field is added)
    })
    .populate('restaurant', 'name fullAddress il ilce')
    .sort({ createdAt: 1 }); 

    res.json(orders);
});

// @desc    Get all orders assigned to the logged-in delivery person
// @route   GET /api/orders/delivery/active
// @access  Private/Delivery
const getActiveDeliveries = asyncHandler(async (req, res) => {
    // Orders that are assigned and are actively being delivered
    const orders = await Order.find({ 
        deliveryPerson: req.user._id,
        status: 'Delivering' 
    })
    .populate('customer', 'name email fullAddress il ilce') 
    .populate('restaurant', 'name fullAddress il ilce') 
    .sort({ createdAt: -1 });

    res.json(orders);
});

// @desc    Get all completed orders for the logged-in delivery person
// @route   GET /api/orders/delivery/history
// @access  Private/Delivery
const getDeliveryHistory = asyncHandler(async (req, res) => {
    // Orders that are assigned and are completed
    const orders = await Order.find({ 
        deliveryPerson: req.user._id,
        status: 'Delivered' 
    })
    .populate('customer', 'name email fullAddress il ilce') 
    .populate('restaurant', 'name fullAddress il ilce') 
    .sort({ createdAt: -1 });

    res.json(orders);
});


// @desc    Delivery person "accepts" an order for delivery
// @route   PUT /api/orders/:id/accept
// @access  Private/Delivery
const acceptDelivery = asyncHandler(async (req, res) => {
    // Check for race condition and update in one atomic operation
    const updatedOrder = await Order.findOneAndUpdate(
        { 
            _id: req.params.id, 
            status: 'Out for Delivery', 
            deliveryPerson: null 
        },
        {
            $set: {
                deliveryPerson: req.user._id,
                status: 'Delivering', // CRITICAL: New status for 'on the way'
            }
        },
        { new: true } // Return the updated document
    ).populate('customer', 'name email fullAddress il ilce'); // Populate for better response if needed

    if (!updatedOrder) {
        res.status(409); // Conflict
        throw new Error('Sipariş başka bir teslimatçı tarafından alındı veya durumu değişti.');
    }

    res.json(updatedOrder);
});


// --- Status Update Logic (Shared) ---

// @desc    Update order status (The critical flow logic)
// @route   PUT /api/orders/:id/status
// @access  Private/Restaurant OR Private/Delivery
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Sipariş bulunamadı');
  }

  const currentStatus = order.status;
  const userRole = req.userRole; 

  // --- Status Transition Logic (MODIFIED) ---
  const validTransitions = {
    // Roles: restaurant, delivery
    Pending: { roles: ['restaurant'], next: ['Confirmed', 'Cancelled'] },
    Confirmed: { roles: ['restaurant'], next: ['Preparing', 'Cancelled'] },
    Preparing: { roles: ['restaurant'], next: ['Out for Delivery'] },
    'Out for Delivery': { roles: ['restaurant'], next: ['Cancelled'] }, // Ready for Pickup (Restaurant can cancel)
    Delivering: { roles: ['delivery'], next: ['Delivered'] }, // On The Way (Delivery Person can set Delivered)
    Delivered: { roles: [], next: [] },
    Cancelled: { roles: [], next: [] },
  };

  const currentTransition = validTransitions[currentStatus];

  if (currentStatus === 'Delivered' || currentStatus === 'Cancelled') {
    res.status(400);
    throw new Error(`Order is already ${currentStatus} and cannot be updated.`);
  }

  // 1. Check if the requested status is a valid next step
  if (!currentTransition.next.includes(status)) {
    res.status(400);
    throw new Error(
      `Invalid status transition: cannot move from ${currentStatus} to ${status}`
    );
  }

  // 2. Check Authorization and Ownership 
  if (!currentTransition.roles.includes(userRole)) {
      res.status(403);
      throw new Error(`User role ${userRole} is not authorized to move from ${currentStatus} to ${status}.`);
  }
    
  if (userRole === 'restaurant' && order.restaurant.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Restoran bu siparişi düzenlemeye yetkili değil');
  }
  
  if (userRole === 'delivery') {
      // Must be the assigned delivery person for 'Delivered' transition
      if (!order.deliveryPerson || order.deliveryPerson.toString() !== req.user._id.toString()) {
          res.status(401);
          throw new Error('Teslimatçı bu siparişi düzenlemeye yetkili değil (atanmamış).');
      }
  }


  // 3. Perform the update
  order.status = status;
  
  // --- MODIFIED LOGIC: PAY DELIVERY PERSON UPON 'Delivered' STATUS ---
  if (status === 'Delivered' && order.deliveryPerson) {
      // Use findByIdAndUpdate to atomically update the balance, bypassing pre('save') hooks.
      const updatedDeliveryUser = await User.findByIdAndUpdate(
          order.deliveryPerson,
          { $inc: { deliveryBalance: order.deliveryFee } }, // Atomically increment by deliveryFee
          { new: true } // Return the updated document (optional for this controller)
      );

      if (updatedDeliveryUser) {
          console.log(`Delivery person ${updatedDeliveryUser.name} balance updated by ${order.deliveryFee} TL.`);
      } else {
          // Log an error if the user was not found, but allow the order status to update
          console.error(`ERROR: Delivery user ${order.deliveryPerson} not found for balance update.`);
      }
      
      // Clear the deliveryPerson field after delivery is complete
      order.deliveryPerson = null; 
  }
  // -------------------------------------------------------------
  
  // Clean up deliveryPerson field if cancelled before assignment
  if (status === 'Cancelled' && order.deliveryPerson) {
       order.deliveryPerson = null; 
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

export {
  addOrderItems,
  getMyOrders,
  getRestaurantOrders,
  updateOrderStatus,
  getAvailableOrders, 
  getActiveDeliveries, 
  acceptDelivery, 
  getDeliveryHistory, // <--- NEW EXPORT
};