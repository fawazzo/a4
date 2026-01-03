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
// --- FIX: Removed 'next' and rely on the async function to return a Promise ---
userSchema.pre('save', async function () { 
  if (!this.isModified('password')) {
    return; // <-- Use 'return' instead of 'return next()'
  }
  
  // Use try/catch for robust error handling, or let the error bubble up.
  try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
      // Rejects the Mongoose save operation with an error
      throw new Error(`Password hashing failed: ${error.message}`); 
  }
  
  // Implicitly resolves the promise, allowing the save operation to continue.
});

const User = mongoose.model('User', userSchema);
export default User;
