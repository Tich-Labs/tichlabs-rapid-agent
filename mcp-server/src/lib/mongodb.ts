import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongoClient(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  const dbName = process.env.MONGODB_DB_NAME || "tichlabs_cases";

  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    await client.connect();
    db = client.db(dbName);
    return db;
  } catch (error) {
    client = null;
    db = null;
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function getMongoCollection(collectionName: string) {
  if (!db) {
    throw new Error("MongoDB not connected. Call getMongoClient() first.");
  }
  return db.collection(collectionName);
}

export async function closeMongoClient(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

let _mongoAvailable: boolean | null = null;

export async function isMongoAvailable(): Promise<boolean> {
  if (_mongoAvailable !== null) return _mongoAvailable;

  try {
    await getMongoClient();
    _mongoAvailable = true;
  } catch {
    _mongoAvailable = false;
  }

  return _mongoAvailable;
}
