const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema({
  type: String, // google, github
  providerId: String,
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  providers: [providerSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
