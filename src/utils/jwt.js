const jwt = require("jsonwebtoken");

exports.generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
};
