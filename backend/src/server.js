const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables dari .env
dotenv.config();

// Inisialisasi Express app
const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rute Pengujian (Health Check)
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API Booking Dekor & Catering Kalila siap digunakan! 🚀",
    });
});

// Port Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
});
