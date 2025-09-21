import "./config";
import express from "express";
import http from "http";
import cors from "cors";
import connectDB from "./database/connection";
import router from "./routes/index"; 
import cookieParser from "cookie-parser";
import { SocketServiceInit } from "./utils/socket-server";

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://lens-kart.vercel.app"
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});


app.use("/", router);

connectDB();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
SocketServiceInit(server);
server.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
