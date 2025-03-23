const express = require("express");
const session = require("express-session");
const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const Twit = require("twit");
const axios = require("axios"); // ✅ Added for GitHub fetching
require("dotenv").config();

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

// Twitter API setup
const T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
});

// Function to generate a random 4-digit number
const generateRandomID = () => Math.floor(1000 + Math.random() * 9000);

// Fetch base64 image from GitHub
const fetchBase64FromGitHub = async (fileUrl) => {
  try {
    const response = await axios.get(fileUrl);
    return response.data.trim(); // ✅ Remove extra spaces/newlines
  } catch (error) {
    console.error(`Failed to fetch ${fileUrl}:`, error.message);
    return null;
  }
};

// Update Profile Route
app.get("/update-profile", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/auth/twitter");

  const uniqueID = generateRandomID();
  const fixedSettings = {
    name: `Obedient Beta #${uniqueID}`,
    description: "I serve Goddess Alice. No escape. No resistance.",
    location: "At Her Mercy",
  };

  // ✅ GitHub raw URLs (update with your GitHub username/repo)
  const avatarUrl = "https://raw.githubusercontent.com/GoddessAlice/ServeAlice/main/avatar.txt";
  const bannerUrl = "https://raw.githubusercontent.com/GoddessAlice/ServeAlice/main/banner.txt";

  try {
    // Fetch avatar & banner base64 data
    const avatarBase64 = await fetchBase64FromGitHub(avatarUrl);
    const bannerBase64 = await fetchBase64FromGitHub(bannerUrl);

    if (!avatarBase64 || !bannerBase64) {
      return res.send("❌ Failed to load images.");
    }

    // Update nickname, bio, and location
    await T.post("account/update_profile", fixedSettings);

    // Update avatar
    await T.post("account/update_profile_image", { image: avatarBase64 });

    // Update banner
    await T.post("account/update_profile_banner", { banner: bannerBase64 });

    console.log(`✅ Profile updated: ${fixedSettings.name}`);
    res.send(`🔥 Profile updated! Your new name: ${fixedSettings.name}`);

  } catch (error) {
    console.error("❌ Twitter API Error:", error);
    res.send("❌ Error updating profile.");
  }
});

// ✅ Homepage route
app.get("/", (req, res) => {
  res.send("🔥 Alice's Pantheon is running! Visit /auth/twitter to start.");
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
