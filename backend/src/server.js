import "./config/env.js";
import app from "./app.js";
import db from "./config/db.js";

const PORT = process.env.PORT || 3000;

(async () => {
  await db.connect();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();
