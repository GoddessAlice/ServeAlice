const express = require("express");
const session = require("express-session");
const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const Twit = require("twit");
require("dotenv").config();

const app = express(); // ✅ Define app first

// Session setup
app.use(session({ secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Twitter OAuth Setup
passport.use(new TwitterStrategy(
  {
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: process.env.CALLBACK_URL,
  },
  (token, tokenSecret, profile, done) => {
    profile.token = token;
    profile.tokenSecret = tokenSecret;
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Twitter login routes
app.get("/auth/twitter", passport.authenticate("twitter"));
app.get("/auth/twitter/callback",
  passport.authenticate("twitter", { failureRedirect: "/" }),
  (req, res) => res.redirect("/update-profile")
);

// Twitter API setup
const T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
});

// Function to generate a random 4-digit number
const generateRandomID = () => Math.floor(1000 + Math.random() * 9000);

// Update Profile Route
app.get("/update-profile", (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/auth/twitter");

  const uniqueID = generateRandomID(); // Generate a unique number
  const fixedSettings = {
    name: `Obedient Beta #${uniqueID}`,  // ✅ Add a unique ID at the end
    description: "I serve Goddess Alice. No escape. No resistance.",
    location: "At Her Mercy",
    banner: "path/to/banner.jpg", // Must be a local or base64-encoded file
    avatar: "path/to/avatar.jpg", // Must be a local or base64-encoded file
  };

  // Update nickname, bio, and location
  T.post("account/update_profile", {
    name: fixedSettings.name,
    description: fixedSettings.description,
    location: fixedSettings.location,
  }, (err, data, response) => {
    if (err) {
      console.error("Profile Update Error:", err);
      return res.send("Error updating profile.");
    } else {
      console.log(`Profile updated: ${fixedSettings.name}`);
      return res.send(`Profile updated! Your new name: ${fixedSettings.name}`);
    }
  });
});

// ✅ Homepage route
app.get("/", (req, res) => {
  res.send("🔥 Alice's Pantheon is running! Visit /auth/twitter to start.");
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
