import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensure emails are unique
  },
  password: {
    type: String,
    required: function () {
      // Password is required only if googleId is NOT present
      return !this.googleId;
    },
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // ✅ Only enforce uniqueness when value exists
  },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;
