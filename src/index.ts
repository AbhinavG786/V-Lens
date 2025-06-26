import "./config";
import express from "express";
import http from "http";
import cors from "cors";
import connectDB from "./database/connection";
import router from "./routes/index"; // your main router

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// General app routes
app.use("/", router);

// Connect to MongoDB
connectDB();

// Start server on defined port
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log("✅ Server is running on port", PORT);
});
