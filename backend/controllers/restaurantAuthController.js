// backend/controllers/restaurantAuthController.js
import asyncHandler from 'express-async-handler';
import Restaurant from '../models/restaurantModel.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new restaurant account
// @route   POST /api/auth/restaurant/register
// @access  Public
const registerRestaurant = asyncHandler(async (req, res) => {
    // Capture new fields: fullAddress, il, ilce. Old 'address' field in req.body is ignored.
    const { name, email, password, cuisineType, fullAddress, il, ilce, description } = req.body;

    const restaurantExists = await Restaurant.findOne({ email });

    if (restaurantExists) {
        res.status(400);
        throw new Error('Bu e-posta ile restoran hesabı zaten mevcut');
    }

    const restaurant = await Restaurant.create({
        name, 
        email, 
        password, 
        cuisineType, 
        fullAddress, // New field
        il,          // New field
        ilce,        // New field
        description, 
        role: 'restaurant'
    });

    if (restaurant) {
        res.status(201).json({
            _id: restaurant._id,
            name: restaurant.name,
            email: restaurant.email,
            cuisineType: restaurant.cuisineType,
            fullAddress: restaurant.fullAddress,
            il: restaurant.il,
            ilce: restaurant.ilce,
            role: restaurant.role,
            token: generateToken(restaurant._id, restaurant.role),
        });
    } else {
        res.status(400);
        throw new Error('Geçersiz restoran verisi');
    }
});

// @desc    Auth restaurant & get token
// @route   POST /api/auth/restaurant/login
// @access  Public
const authRestaurant = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const restaurant = await Restaurant.findOne({ email, role: 'restaurant' });

    if (restaurant && (await restaurant.matchPassword(password))) {
        res.json({
            _id: restaurant._id,
            name: restaurant.name,
            email: restaurant.email,
            cuisineType: restaurant.cuisineType,
            fullAddress: restaurant.fullAddress, // Added to response
            il: restaurant.il,                   // Added to response
            ilce: restaurant.ilce,               // Added to response
            role: restaurant.role,
            token: generateToken(restaurant._id, restaurant.role),
        });
    } else {
        res.status(401);
        throw new Error('Geçersiz e-posta veya şifre');
    }
});

// @desc    Get restaurant profile
// @route   GET /api/auth/restaurant/me
// @access  Private (Restaurant)
const getRestaurantProfile = asyncHandler(async (req, res) => {
    // req.user contains all fields including fullAddress, il, ilce
    res.json(req.user);
});


export { registerRestaurant, authRestaurant, getRestaurantProfile };