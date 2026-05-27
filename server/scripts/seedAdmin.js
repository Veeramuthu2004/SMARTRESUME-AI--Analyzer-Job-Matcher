const mongoose = require("mongoose");
const env = require("../src/config/env");
const User = require("../src/models/User");

async function run() {
  const uri = process.env.MONGODB_URI || env.mongoUri || "";
  if (!uri) {
    console.error("MONGODB_URI is required to run this script.");
    process.exit(1);
  }
  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DB_NAME || "smart_resume_ai",
  });

  const email = "admin@example.com";
  const password = "Admin@123";

  let user = await User.findOne({ email });
  if (user) {
    console.log("Admin user already exists:", email);
    process.exit(0);
  }

  user = new User({ name: "Administrator", email, password, role: "admin" });
  await user.save();
  console.log("Created admin user:", email);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
