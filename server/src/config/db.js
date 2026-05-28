const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const env = require("./env");

let memoryServer;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
  });

  // eslint-disable-next-line no-console
  console.log("MongoDB Connected");
  return mongoose.connection;
};

const connectDb = async () => {
  const uri = process.env.MONGODB_URI || "";

  if (!uri) {
    // No URI provided
    // eslint-disable-next-line no-console
    console.error("No MongoDB connection string provided (MONGODB_URI).");
    return null;
  }

  if (uri) {
    const attempts = env.nodeEnv === "production" ? 3 : 1;
    let lastError;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      // eslint-disable-next-line no-console
      console.info(
        `Attempting MongoDB connection (${attempt}/${attempts}) to: ${maskUri(uri)}`,
      );
      try {
        return await connectWithUri(uri);
      } catch (error) {
        lastError = error;
        // eslint-disable-next-line no-console
        console.error(
          `MongoDB connection attempt ${attempt} failed: ${error.message}`,
        );
        if (attempt < attempts) {
          await sleep(1000 * attempt * attempt);
        }
      }
    }

    // In production, keep the process alive so the backend can still serve
    // health checks and return a clear disconnected status instead of crash-looping.
    if (env.nodeEnv === "production") {
      // eslint-disable-next-line no-console
      console.error(
        `MongoDB unavailable after ${attempts} attempt(s): ${lastError?.message || "unknown error"}`,
      );
      return null;
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
