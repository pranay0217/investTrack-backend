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
    unique: true,
    sparse: true, // << Important: make this sparse to allow multiple nulls
  },
}, { timestamps: true });

// This ensures Mongoose creates the index on startup
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

const User = mongoose.model("User", userSchema);

export default User;
