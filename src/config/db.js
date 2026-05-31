const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not defined in .env");
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  tls: true,
});

const connectDB = async () => {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB Connected ✅");
  } catch (error) {
    console.error("MongoDB Connection Failed ❌", error.message);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  client,
};