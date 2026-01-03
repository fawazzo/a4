// backend/models/userModel.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Replaced generic 'address' with granular fields:
    fullAddress: { type: String }, // Detailed street address
    il: { type: String },          // Province (Il)
    ilce: { type: String },         // District (Ilce)
    role: { type: String, default: 'customer', enum: ['customer', 'delivery'] },
    
    // --- NEW FIELD FOR DELIVERY BALANCE ---
    deliveryBalance: {
      type: Number,
      default: 0, // Starts at 0 TL
    },
    // -------------------------------------
  },
  { timestamps: true }
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next(); // CRITICAL FIX: Ensure 'next' is returned to exit the hook.
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next(); // CRITICAL: Call next() after hashing is complete.
});

const User = mongoose.model('User', userSchema);
export default User;