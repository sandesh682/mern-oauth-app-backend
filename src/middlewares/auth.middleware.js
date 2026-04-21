const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const redis = require("../config/redis");

exports.verifyJWT = async (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "access") {
      return res.status(403).json({ message: "Invalid token type" });
    }

    const redisKey = `user:${decoded.userId}:tokenVersion`;

    let tokenVersion = await redis.get(redisKey);

    // 🔥 CACHE MISS → fallback to DB
    if (tokenVersion === null) {
      const user = await User.findById(decoded.userId).select("tokenVersion");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      tokenVersion = user.tokenVersion;

      // 🔥 Warm Redis cache (optional TTL)
      await redis.set(redisKey, tokenVersion, "EX", 3600); // 1 hour
    }

    if (Number(tokenVersion) !== decoded.tokenVersion) {
      return res.status(401).json({ message: "Token invalidated" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token expired" });
    }
    return res.status(403).json({ message: "Invalid token" });
  }
};
