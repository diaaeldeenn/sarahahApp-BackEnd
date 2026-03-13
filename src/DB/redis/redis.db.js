import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.Redis_URL,
});

export const redisConnection = async () => {
  try {
    await redisClient.connect();
    console.log("Success To Connect Redis");
  } catch (error) {
    console.log("Error To Connect With Redis", error);
  }
};
