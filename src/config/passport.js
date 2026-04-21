const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const axios = require("axios");

const User = require("../models/user.model");

/**
 * Shared function: find or create user + link provider
 */
async function findOrCreateUser({ email, name, provider, providerId }) {
  email = email.toLowerCase().trim();

  let user = await User.findOne({ email });

  if (user) {
    const exists = user.providers.find((p) => p.type === provider);

    if (!exists) {
      user.providers.push({ type: provider, providerId });
      await user.save();
    }
  } else {
    user = await User.create({
      email,
      name: name || "User",
      providers: [{ type: provider, providerId }],
      refreshTokens: [],
    });
  }

  return user;
}

/**
 * GOOGLE STRATEGY
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        if (!profile.emails || !profile.emails.length) {
          return done(new Error("Email not provided by Google"), null);
        }

        const email = profile.emails[0].value;
        const name = profile.displayName;

        const user = await findOrCreateUser({
          email,
          name,
          provider: "google",
          providerId: profile.id,
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

/**
 * GITHUB STRATEGY
 */
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let email = null;

        // Try from profile first
        if (profile.emails && profile.emails.length) {
          email = profile.emails[0].value;
        }

        // If not available → fetch from GitHub API
        if (!email) {
          const response = await axios.get(
            "https://api.github.com/user/emails",
            {
              headers: {
                Authorization: `token ${accessToken}`,
              },
            },
          );

          const primaryEmail = response.data.find(
            (e) => e.primary && e.verified,
          );

          if (!primaryEmail) {
            return done(new Error("No verified email found"), null);
          }

          email = primaryEmail.email;
        }

        const name = profile.displayName || profile.username;

        const user = await findOrCreateUser({
          email,
          name,
          provider: "github",
          providerId: profile.id,
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);
