require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");

if (!process.env.MONGO_URI || !process.env.PORT) {
  throw new Error("Missing required environment variables");
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    const server = app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });

    server.on("error", (err) => {
      console.error("Server error:", err.message);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed");
  process.exit(0);
});
