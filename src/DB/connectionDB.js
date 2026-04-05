import mongoose from "mongoose";

let isConnected = false;

const connectionDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("Connected Successfully");
  } catch (error) {
    console.log("Connection Failed");
    console.log(error.message);
  }
};

export default connectionDB;
