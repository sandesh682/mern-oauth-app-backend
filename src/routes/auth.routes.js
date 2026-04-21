const express = require("express");
const passport = require("passport");
const { googleCallback } = require("../controllers/auth.controller");

const { verifyJWT } = require("../middlewares/auth.middleware");
const { getMe } = require("../controllers/auth.controller");

const router = express.Router();

// Step 1: Redirect to Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

// Step 2: Callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  googleCallback,
);

// GitHub login
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] }),
);

// GitHub callback
router.get(
  "/github/callback",
  passport.authenticate("github", { session: false }),
  googleCallback, // reuse same controller
);

router.get("/me", verifyJWT, getMe);

module.exports = router;
