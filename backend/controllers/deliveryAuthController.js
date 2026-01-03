// backend/controllers/deliveryAuthController.js
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new delivery person
// @route   POST /api/auth/delivery/register
// @access  Public
const registerDelivery = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body; // Address is optional for delivery

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('Bu e-posta ile teslimatçı hesabı zaten mevcut');
  }

  // Create delivery user with minimal required fields (deliveryBalance defaults to 0)
  const user = await User.create({
    name,
    email,
    password,
    role: 'delivery',
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
      // --- ADDED BALANCE ---
      deliveryBalance: user.deliveryBalance, 
    });
  } else {
    res.status(400);
    throw new Error('Geçersiz teslimatçı verisi');
  }
});

// @desc    Auth delivery person & get token
// @route   POST /api/auth/delivery/login
// @access  Public
const authDelivery = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, role: 'delivery' });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
      // --- ADDED BALANCE ---
      deliveryBalance: user.deliveryBalance,
    });
  } else {
    res.status(401);
    throw new Error('Teslimatçı için geçersiz e-posta veya şifre');
  }
});

// @desc    Get delivery profile
// @route   GET /api/auth/delivery/me
// @access  Private (Delivery)
const getDeliveryProfile = asyncHandler(async (req, res) => {
    // req.user will now contain deliveryBalance because the model includes it
    res.json(req.user);
});


export { registerDelivery, authDelivery, getDeliveryProfile };