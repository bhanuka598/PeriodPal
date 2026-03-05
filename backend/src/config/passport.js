const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const config = require("./config");
const generateToken = require("../utils/generateToken");

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy(
  {
    clientID: config.google.clientID,
    clientSecret: config.google.clientSecret,
    callbackURL: config.google.callbackURL,
    passReqToCallback: true,
    scope: ["profile", "email"]
  },
  async (_req, _accessToken, _refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await User.findOne({ 
        $or: [
          { email: profile.emails[0].value },
          { googleId: profile.id }
        ] 
      });

      if (!user) {
        // Create new user if doesn't exist
        user = await User.create({
          username: profile.displayName || profile.emails[0].value.split('@')[0],
          email: profile.emails[0].value,
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value,
          isVerified: true
        });
      } else if (!user.googleId) {
        // Link Google account to existing email
        user.googleId = profile.id;
        user.isVerified = true;
        if (!user.avatar && profile.photos?.[0]?.value) {
          user.avatar = profile.photos[0].value;
        }
        await user.save();
      }

      // Generate JWT token
      const token = generateToken(user._id);
      user.token = token;

      return done(null, user);
    } catch (error) {
      console.error('Error in Google OAuth callback:', error);
      return done(error, null);
    }
  }
));

module.exports = passport;