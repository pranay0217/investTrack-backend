import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId; // Password required only if no googleId
    },
  },
  googleId: {
    type: String,
    // Do NOT put unique or sparse here to avoid duplicate index creation
  },
}, { timestamps: true });

// Create a unique sparse index on googleId to avoid duplicate null values
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

const User = mongoose.model("User", userSchema);

export default User;
