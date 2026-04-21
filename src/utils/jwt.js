const jwt = require("jsonwebtoken");

exports.generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, type: "access", tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
      issuer: "mern-oauth-app",
      audience: "mern-users",
    },
  );
};

exports.generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id, type: "refresh", tokenVersion: user.tokenVersion },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
      issuer: "mern-oauth-app",
      audience: "mern-users",
    },
  );
};
