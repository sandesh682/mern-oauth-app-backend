const User = require("../models/user.model");
const redis = require("../config/redis");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const jwt = require("jsonwebtoken");

exports.googleCallback = async (req, res) => {
  const user = req.user;

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token (array support)
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push(refreshToken);
  await user.save();

  const cookieOptions = {
    httpOnly: true,
    secure: false, // true in production
    sameSite: "lax",
  };

  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, cookieOptions);

  // res.json({ user: user });
  res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
};

exports.logout = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

      if (decoded.type !== "refresh") {
        return res.status(403).json({ message: "Invalid token type" });
      }

      const user = await User.findById(decoded.userId);

      if (user && user.refreshTokens.includes(token)) {
        // ✅ remove only this session
        user.refreshTokens = user.refreshTokens.filter((t) => t !== token);

        await user.save();
      }
    } catch (err) {
      console.log("Logout token error:", err.message);
    }
  }

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
  };

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  res.json({ message: "Logged out (current device)" });
};

exports.forceLogoutAll = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);

    // 🔥 increment version → invalidates all access tokens
    user.tokenVersion += 1;

    // 🔥 remove all refresh tokens
    user.refreshTokens = [];

    await user.save();

    // 🔥 update Redis
    const redisKey = `user:${userId}:tokenVersion`;
    await redis.set(redisKey, user.tokenVersion);

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.json({ message: "Logged out from all devices" });
  } catch (err) {
    res.status(500).json({ message: "Failed to logout all devices" });
  }
};

exports.refreshTokenHandler = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    // 1. Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // 2. Ensure it's actually a refresh token
    if (decoded.type !== "refresh") {
      return res.status(403).json({ message: "Invalid token type" });
    }

    // 3. Find user
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    // 4. Check token exists in DB (VERY IMPORTANT)
    if (!user.refreshTokens.includes(token)) {
      return res.status(403).json({ message: "Refresh token not recognized" });
    }

    // 🔁 5. ROTATION (remove old token)
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);

    // 6. Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // 7. Store new refresh token
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    // 8. Set cookies
    const cookieOptions = {
      httpOnly: true,
      secure: false, // true in production
      sameSite: "lax",
    };

    res.cookie("accessToken", newAccessToken, cookieOptions);
    res.cookie("refreshToken", newRefreshToken, cookieOptions);

    return res.json({ message: "Token refreshed" });
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token" });
  }
};

exports.getMe = async (req, res) => {
  res.json({
    user: req.user,
  });
};
