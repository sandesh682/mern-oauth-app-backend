const express = require("express");
const passport = require("passport");

const {
  googleCallback,
  getMe,
  refreshTokenHandler,
  logout,
  forceLogoutAll,
} = require("../controllers/auth.controller");

const { verifyJWT } = require("../middlewares/auth.middleware");

const router = express.Router();

// Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: true,
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
  }),
  googleCallback,
);

// GitHub
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
    state: true,
  }),
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
  }),
  googleCallback,
);

// Auth utilities
router.post("/refresh", refreshTokenHandler);
router.post("/logout", verifyJWT, logout);
router.post("/forceLogoutAll", verifyJWT, forceLogoutAll);

// Protected
router.get("/me", verifyJWT, getMe);

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = router;
