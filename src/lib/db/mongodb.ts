import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = (global as any).mongoose || { conn: null, promise: null };

if (!cached.mongoose) {
  (global as any).mongoose = cached;
}

export async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not set - database operations will fail');
    // Return a dummy connection during build
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
