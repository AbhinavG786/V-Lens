import "./config"
import express from "express";
import http from "http"
import cors from "cors";
import connectDB from "./database/connection";
import router from "./routes/index";

const app=express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", router);

connectDB();

const server = http.createServer(app);
app.listen(process.env.PORT, () => {
  console.log("Server is running on port", process.env.PORT);
});
