import "dotenv/config";
import app from "./app.controller.js";
import connectionDB from "./DB/connectionDB.js";
if (process.env.NODE_ENV !== "production") {
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
    connectionDB();
  });
}
export default app;
