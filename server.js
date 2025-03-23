const express = require("express");
const session = require("express-session");
const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const dotenv = require("dotenv");
const updateProfile = require("./updateProfile");

dotenv.config();
const app = express();

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

// Update Profile Route
app.get("/update-profile", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/auth/twitter");

  try {
    const result = await updateProfile(req.user);
    res.send(`✅ Profile updated! Your new name: ${result.name}`);
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    res.status(500).send("❌ Internal Server Error. Check logs.");
  }
});

// Homepage
app.get("/", (req, res) => {
  res.send("🔥 Alice's Pantheon is running! Visit /auth/twitter to start.");
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
