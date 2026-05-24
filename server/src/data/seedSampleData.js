const mongoose = require("mongoose");
const env = require("../config/env");
const connectDb = require("../config/db");
const User = require("../models/User");

const run = async () => {
  await connectDb();

  const adminExists = await User.findOne({ email: "admin@smartresume.dev" });
  if (!adminExists) {
    await User.create({
      name: "Platform Admin",
      email: "admin@smartresume.dev",
      password: "Admin12345!",
      role: "admin",
    });
    // eslint-disable-next-line no-console
    console.log("Seeded admin user: admin@smartresume.dev / Admin12345!");
  }

  const adminExample = await User.findOne({ email: "admin@example.com" });
  if (!adminExample) {
    await User.create({
      name: "Admin Example",
      email: "admin@example.com",
      password: "Admin@123",
      role: "admin",
    });
    // eslint-disable-next-line no-console
    console.log("Seeded admin user: admin@example.com / Admin@123");
  }

  await mongoose.disconnect();
  // eslint-disable-next-line no-console
  console.log("Seeding complete");
};

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
