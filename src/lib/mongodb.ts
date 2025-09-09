import mongoose from "mongoose";

type MongooseConnectionCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseConnectionCache: MongooseConnectionCache | undefined;
}

const connectionCache: MongooseConnectionCache =
  global.mongooseConnectionCache || { conn: null, promise: null };

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (connectionCache.conn) return connectionCache.conn;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI est manquant dans les variables d'environnement");
  }

  if (!connectionCache.promise) {
    connectionCache.promise = mongoose.connect(mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
    });
  }

  connectionCache.conn = await connectionCache.promise;
  global.mongooseConnectionCache = connectionCache;
  return connectionCache.conn;
}


