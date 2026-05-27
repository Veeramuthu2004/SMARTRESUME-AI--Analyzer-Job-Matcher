const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const env = require("./env");

let memoryServer;

const maskUri = (uri) => {
  if (!uri) return "";
  try {
    // remove credentials if present
    return uri.replace(/(mongodb(\+srv)?:\/\/)([^@]+)@/, "$1****:****@");
  } catch (err) {
    return "****";
  }
};

const connectWithUri = async (uri) => {
  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DB_NAME || "smart_resume_ai",
  });

  // eslint-disable-next-line no-console
  console.log("MongoDB Connected");
  return mongoose.connection;
};

const connectDb = async () => {
  const uri = process.env.MONGODB_URI || env.mongoUri || "";

  if (!uri) {
    // No URI provided
    // eslint-disable-next-line no-console
    console.error("No MongoDB connection string provided (MONGODB_URI).");
    if (env.nodeEnv === "production") {
      // In production we must fail fast
      process.exit(1);
    }
  }

  if (uri) {
    // eslint-disable-next-line no-console
    console.info(`Attempting MongoDB connection to: ${maskUri(uri)}`);
    try {
      return await connectWithUri(uri);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`MongoDB connection failed: ${error.message}`);
      if (env.nodeEnv === "production") {
        // Fail fast in production so Render marks the deploy as failed
        process.exit(1);
      }
      // continue to fallbacks in non-production
    }
  }

  // Non-production fallbacks: try local MongoDB, then in-memory server
  const localFallbackUri = `mongodb://127.0.0.1:27017/${process.env.MONGO_DB_NAME || "smart_resume_ai"}`;

  try {
    // eslint-disable-next-line no-console
    console.info(
      `Attempting local MongoDB connection to: ${maskUri(localFallbackUri)}`,
    );
    return await connectWithUri(localFallbackUri);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Local MongoDB connection failed: ${error.message}`);
  }

  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create();
  }

  const memoryUri = memoryServer.getUri();
  // eslint-disable-next-line no-console
  console.info(`Using in-memory MongoDB at ${maskUri(memoryUri)}`);
  return connectWithUri(memoryUri);
};

module.exports = connectDb;
