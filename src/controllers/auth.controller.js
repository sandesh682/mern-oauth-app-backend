const { generateToken } = require("../utils/jwt");

exports.googleCallback = (req, res) => {
  const user = req.user;

  const token = generateToken(user);

  // Send token via cookie (recommended)
  res.cookie("token", token, {
    httpOnly: true,
    secure: false, // true in production (HTTPS)
    sameSite: "lax",
  });

  // res.json({
  //   message: "OAuth success",
  //   user: req.user,
  // });

  // Redirect to frontend
  res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
};

exports.getMe = async (req, res) => {
  res.json({
    user: req.user,
  });
};
