import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../model/user.model.js";
import jwt from "jsonwebtoken";

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Always prefer googleId as unique identifier
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      // If user not found by googleId, try to find by email (maybe signed up before)
      const email = profile.emails[0].value;
      user = await User.findOne({ email });

      if (user) {
        // If user exists with same email but no googleId, link googleId to existing user
        user.googleId = profile.id;
        await user.save();
      }
    }

    if (!user) {
      // Create new user if none found by googleId or email
      user = new User({
        username: profile.displayName,
        email: profile.emails[0].value,
        googleId: profile.id,  // <-- Save googleId here!
        password: Math.random().toString(36).slice(-8), // dummy password for now
      });
      await user.save();
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Return user object plus token
    return done(null, { ...user.toObject(), token });

  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
