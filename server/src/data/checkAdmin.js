const mongoose = require("mongoose");
const env = require("../config/env");
const connectDb = require("../config/db");
const User = require("../models/User");

const run = async () => {
  await connectDb();
  const user = await User.findOne({ email: "admin@smartresume.dev" });
  console.log(
    "Admin user:",
    user
      ? JSON.stringify(
          { id: user._id, email: user.email, role: user.role },
          null,
          2,
        )
      : "NOT FOUND",
  );
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
