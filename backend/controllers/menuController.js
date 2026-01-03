// backend/controllers/menuController.js
import asyncHandler from 'express-async-handler';
import MenuItem from '../models/menuItemModel.js';

// @desc    Get all menu items for a specific restaurant
// @route   GET /api/menu/restaurant/:restaurantId
// @access  Public
const getMenuItemsByRestaurant = asyncHandler(async (req, res) => {
  const menuItems = await MenuItem.find({ restaurant: req.params.restaurantId });

  if (menuItems) {
    res.json(menuItems);
  } else {
    res.status(404);
    throw new Error('Bu restorana ait menü öğesi bulunamadı');
  }
});

// @desc    Create a new menu item
// @route   POST /api/menu
// @access  Private/Restaurant
const createMenuItem = asyncHandler(async (req, res) => {
  // The restaurant ID is pulled from the logged-in user (req.user)
  const { name, description, price, category, imageUrl } = req.body;

  const menuItem = new MenuItem({
    restaurant: req.user._id,
    name,
    description,
    price,
    category,
    imageUrl, // Including the requested image URL
    isAvailable: true,
  });

  const createdMenuItem = await menuItem.save();
  res.status(201).json(createdMenuItem);
});

// @desc    Update a menu item
// @route   PUT /api/menu/:id
// @access  Private/Restaurant
const updateMenuItem = asyncHandler(async (req, res) => {
  const { name, description, price, category, imageUrl, isAvailable } = req.body;

  const menuItem = await MenuItem.findById(req.params.id);

  if (menuItem) {
    // Security check: Ensure the item belongs to the logged-in restaurant
    if (menuItem.restaurant.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Bu menü öğesini güncellemeye yetkiniz yok');
    }

    menuItem.name = name || menuItem.name;
    menuItem.description = description || menuItem.description;
    menuItem.price = price ?? menuItem.price;
    menuItem.category = category || menuItem.category;
    menuItem.imageUrl = imageUrl || menuItem.imageUrl;
    menuItem.isAvailable = isAvailable ?? menuItem.isAvailable;

    const updatedItem = await menuItem.save();
    res.json(updatedItem);
  } else {
    res.status(404);
    throw new Error('Menü öğesi bulunamadı');
  }
});

// @desc    Delete a menu item
// @route   DELETE /api/menu/:id
// @access  Private/Restaurant
const deleteMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id);

  if (menuItem) {
    // Security check: Ensure the item belongs to the logged-in restaurant
    if (menuItem.restaurant.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Bu menü öğesini silmeye yetkiniz yok');
    }

    await MenuItem.deleteOne({ _id: menuItem._id });
    res.json({ message: 'Menu item removed' });
  } else {
    res.status(404);
    throw new Error('Menü öğesi bulunamadı');
  }
});

export {
  getMenuItemsByRestaurant,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};