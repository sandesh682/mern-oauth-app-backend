const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(passport.initialize());

require("./config/passport");

const authRoutes = require("./routes/auth.routes");

app.use("/api/auth", authRoutes);

app.get("/test", (req, res) => {
  res.send("Server working ✅");
});

module.exports = app;
