const mongoose = require("mongoose");
const env = require("../src/config/env");
const User = require("../src/models/User");

async function run() {
  await mongoose.connect(env.mongoUri || "mongodb://127.0.0.1:27017/sra-dev");

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
