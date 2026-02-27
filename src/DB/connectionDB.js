import mongoose from "mongoose";
const connectionDB = async () => {
  try {                                       //^DB Name
    await mongoose.connect("mongodb://127.0.0.1:27017/SarahahApp", {
      serverSelectionTimeoutMS: 3000,
    });
    console.log("Connected Succefully");
  } catch (error) {
    console.log("Connected Failed");
  }
};

export default connectionDB;