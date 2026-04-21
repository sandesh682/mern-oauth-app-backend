const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["google", "github"],
    required: true,
  },
  providerId: {
    type: String,
    required: true,
  },
});

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: String,

    providers: [providerSchema],

    refreshTokens: [String], // supports multiple sessions

    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
