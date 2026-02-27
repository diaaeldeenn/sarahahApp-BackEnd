import express from "express";
import connectionDB from "./DB/connectionDB.js";
import userRouter from "./modules/users/user.controller.js";
import cors from "cors";
const app = express();
const port = 3000;

const bootstrap = () => {
  app.use(cors(), express.json());
  app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome In My Api" });
  });
  connectionDB();
  app.use("/users", userRouter);
  app.use("{/*demo}", (req, res) => {
    throw new Error(`Url ${req.originalUrl} Not Found!`, { cause: 404 });
  });
  app.use((err, req, res, next) => {
    res
      .status(err.cause || 500)
      .json({ message: err.message, stack: err.stack });
  });

  app.listen(port, () => console.log(`Sever Work On Port ${port}!`));
};

export default bootstrap;
