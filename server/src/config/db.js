const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const env = require("./env");

let memoryServer;

const connectWithUri = async (uri) => {
  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DB_NAME || "smart_resume_ai",
  });

  // eslint-disable-next-line no-console
  console.log(
    `Connected MongoDB (${mongoose.connection.name}) at ${mongoose.connection.host}`,
  );
  return mongoose.connection;
};

const connectDb = async () => {
  const localFallbackUri = `mongodb://127.0.0.1:27017/${process.env.MONGO_DB_NAME || "smart_resume_ai"}`;

  if (env.mongoUri) {
    try {
      return await connectWithUri(env.mongoUri);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        `Primary MongoDB connection failed, trying local fallback: ${error.message}`,
      );
      if (env.nodeEnv === "production") {
        throw error;
      }
    }
  }

  try {
    return await connectWithUri(localFallbackUri);
  } catch (error) {
    if (env.nodeEnv === "production") {
      throw error;
    }
    // eslint-disable-next-line no-console
    console.warn(
      `Local MongoDB connection failed, falling back to memory server: ${error.message}`,
    );
  }

  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create();
  }

  const memoryUri = memoryServer.getUri();
  return connectWithUri(memoryUri);
};

module.exports = connectDb;
