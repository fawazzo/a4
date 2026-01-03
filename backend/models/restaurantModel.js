// backend/models/restaurantModel.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const restaurantSchema = mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true }, // Login email
    password: { type: String, required: true },
    description: { type: String },
    cuisineType: { type: String, required: true },
    
    // Updated Address Structure:
    fullAddress: { type: String, required: true }, // Detailed street address
    il: { type: String, required: true },          // Province (Il)
    ilce: { type: String, required: true },         // District (Ilce)

    minOrderValue: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    role: { type: String, default: 'restaurant', enum: ['restaurant'] },
  },
  { timestamps: true }
);

// Password matching and hashing (same as User model)
restaurantSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

restaurantSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
export default Restaurant;