// server.js

const app = require("./app"); // Import the app from app.js
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables

const PORT = process.env.PORT || 8000;

// Start the server
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
