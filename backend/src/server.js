import app from "./app.js";
import dotenv from "dotenv";
import db from "./db/db.js";

dotenv.config();
const PORT = process.env.PORT || 3000;

(async () => {
  await db.connect();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();
