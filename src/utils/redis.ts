import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error(" REDIS_URL not set");

// console.log(" Connecting to Redis at:", redisUrl);

const redisClient = createClient({ url: redisUrl });

redisClient.on("error", (err) => {
  console.error(" Redis Client Error:", err.message);
});

redisClient.on("connect", () => {
  console.log(" Redis client connected");
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error(" Redis connection failed:", err);
  }
})();

export default redisClient;
