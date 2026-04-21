const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/user.model");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        let user = await User.findOne({ email });

        if (user) {
          // Link provider if not already linked
          const exists = user.providers.find((p) => p.type === "google");

          if (!exists) {
            user.providers.push({
              type: "google",
              providerId: profile.id,
            });
            await user.save();
          }
        } else {
          user = await User.create({
            email,
            name: profile.displayName,
            providers: [
              {
                type: "google",
                providerId: profile.id,
              },
            ],
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

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

        // GitHub may not return email directly
        if (profile.emails && profile.emails.length) {
          email = profile.emails[0].value;
        }

        if (!email) {
          return done(new Error("Email not found from GitHub"), null);
        }

        let user = await User.findOne({ email });

        if (user) {
          const exists = user.providers.find((p) => p.type === "github");

          if (!exists) {
            user.providers.push({
              type: "github",
              providerId: profile.id,
            });
            await user.save();
          }
        } else {
          user = await User.create({
            email,
            name: profile.displayName || profile.username,
            providers: [
              {
                type: "github",
                providerId: profile.id,
              },
            ],
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);
