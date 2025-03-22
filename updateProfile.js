const Twit = require("twit");
require("dotenv").config();

function updateTwitterProfile(user, updates) {
  const T = new Twit({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token: user.token,
    access_token_secret: user.tokenSecret,
  });

  // Update Bio & Location
  if (updates.bio || updates.location) {
    T.post("account/update_profile", {
      description: updates.bio || user.description,
      location: updates.location || user.location,
    }, (err, data, response) => {
      if (err) console.error("Profile Update Error:", err);
      else console.log("Profile updated!");
    });
  }

  // Update Avatar (Profile Image)
  if (updates.avatar) {
    T.post("account/update_profile_image", { image: updates.avatar }, (err, data, response) => {
      if (err) console.error("Avatar Update Error:", err);
      else console.log("Avatar updated!");
    });
  }

  // Update Banner
  if (updates.banner) {
    T.post("account/update_profile_banner", { banner: updates.banner }, (err, data, response) => {
      if (err) console.error("Banner Update Error:", err);
      else console.log("Banner updated!");
    });
  }
}

module.exports = updateTwitterProfile;

const fs = require("fs");

// Function to convert image to Base64
function encodeImage(filePath) {
  return fs.readFileSync(filePath, { encoding: "base64" });
}

// Update Profile Route
app.get("/update-profile", (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/auth/twitter");

  const fixedSettings = {
    name: "Alice's Beta",
    description: "I serve Goddess Alice. No escape. No resistance.",
    location: "At Her Mercy",
    avatar: "avatar.jpg",
    banner: "banner.jpg",
  };

  // Update name, bio, and location
  T.post("account/update_profile", {
    name: fixedSettings.name,
    description: fixedSettings.description,
    location: fixedSettings.location,
  });

  // Update avatar
  const avatarBase64 = encodeImage(fixedSettings.avatar);
  T.post("account/update_profile_image", { image: avatarBase64 }, (err) => {
    if (err) console.error("Avatar Update Error:", err);
    else console.log("Avatar updated!");
  });

  // Update banner
  const bannerBase64 = encodeImage(fixedSettings.banner);
  T.post("account/update_profile_banner", { banner: bannerBase64 }, (err) => {
    if (err) console.error("Banner Update Error:", err);
    else console.log("Banner updated!");
  });

  res.send("Profile updated! Refresh your Twitter.");
});
