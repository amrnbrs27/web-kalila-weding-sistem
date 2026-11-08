const path = require('path');
const dotenv = require('dotenv');

// Load environment variables dari file .env di folder backend
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('./config/db');
const app = require('./app');

// Hubungkan ke database MongoDB
connectDB();

// Port server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
});
