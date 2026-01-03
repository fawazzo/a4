// backend/controllers/restaurantController.js
import asyncHandler from 'express-async-handler';
import Restaurant from '../models/restaurantModel.js';

// Helper function to select fields excluding password
const selectFields = '-password'; 

// @desc    Get all active restaurants
// @route   GET /api/restaurants
// @access  Public
const getRestaurants = asyncHandler(async (req, res) => {
  // Returns new address fields: fullAddress, il, ilce
  const restaurants = await Restaurant.find({ isActive: true }).select(selectFields);
  res.json(restaurants);
});

// @desc    Get single restaurant by ID
// @route   GET /api/restaurants/:id
// @access  Public
const getRestaurantById = asyncHandler(async (req, res) => {
  // Returns new address fields: fullAddress, il, ilce
  const restaurant = await Restaurant.findById(req.params.id).select(selectFields);

  if (restaurant && restaurant.isActive) {
    res.json(restaurant);
  } else {
    res.status(404);
    throw new Error('Restoran bulunamadı veya etkin değil');
  }
});

// @desc    Update restaurant profile (Owner only)
// @route   PUT /api/restaurants/:id
// @access  Private/Restaurant
const updateRestaurantProfile = asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.findById(req.params.id);

    // Security Check: Ensure the logged-in user is the owner of this restaurant
    if (!restaurant || restaurant._id.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Bu restoranı güncellemeye yetkiniz yok');
    }

    if (restaurant) {
        restaurant.name = req.body.name || restaurant.name;
        restaurant.description = req.body.description || restaurant.description;
        restaurant.cuisineType = req.body.cuisineType || restaurant.cuisineType;
        
        // Update new address fields
        restaurant.fullAddress = req.body.fullAddress || restaurant.fullAddress;
        restaurant.il = req.body.il || restaurant.il;
        restaurant.ilce = req.body.ilce || restaurant.ilce;

        // Old address field (if present) is no longer used, we rely on the new ones
        // If old address was used, mapping it is required:
        // restaurant.address = req.body.address; // REMOVED

        restaurant.minOrderValue = req.body.minOrderValue ?? restaurant.minOrderValue;
        restaurant.isActive = req.body.isActive ?? restaurant.isActive; // Allow toggling activity

        const updatedRestaurant = await restaurant.save();
        res.json({
            _id: updatedRestaurant._id,
            name: updatedRestaurant.name,
            email: updatedRestaurant.email,
            cuisineType: updatedRestaurant.cuisineType,
            fullAddress: updatedRestaurant.fullAddress,
            il: updatedRestaurant.il,
            ilce: updatedRestaurant.ilce,
            isActive: updatedRestaurant.isActive,
        });
    } else {
        res.status(404);
        throw new Error('Restoran bulunamadı');
    }
});

export { getRestaurants, getRestaurantById, updateRestaurantProfile };