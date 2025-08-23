import mongoose, { Connection } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Prefer user-provided URI, fallback to local. Normalize localhost to IPv4 to avoid ::1 issues on Windows.
const rawMongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/inventory-management";
const MONGODB_URI = rawMongoUri.startsWith("mongodb://localhost")
	? rawMongoUri.replace("mongodb://localhost", "mongodb://127.0.0.1")
	: rawMongoUri;

// Safe mask: only mask credentials if present
const maskedUri = MONGODB_URI.includes("@") ? MONGODB_URI.replace(/\/\/.*@/, "//***@") : MONGODB_URI;
console.log("🔗 Mongo URI (masked):", maskedUri);

interface MongooseCache {
	conn: Connection | null;
	promise: Promise<typeof mongoose> | null;
}

declare global {
	// eslint-disable-next-line no-var
	var mongooseCache: MongooseCache | undefined;
}

let cached: any = global.mongooseCache;

if (!cached) {
	cached = global.mongooseCache = { conn: null, promise: null };
}

async function dbConnect(): Promise<Connection> {
	if (cached.conn) {
		return cached.conn;
	}

	if (!cached.promise) {
		const opts = {
			bufferCommands: false,
		};

		cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
			console.log("✅ MongoDB connected successfully");
			return mongoose;
		});
	}

	try {
		cached.conn = (await cached.promise).connection;
	} catch (e) {
		cached.promise = null;
		console.error("❌ MongoDB connection failed:", e);
		throw e;
	}

	return cached.conn;
}

export default dbConnect;
