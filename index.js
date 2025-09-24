// nodejs imports
const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

dotenv.config();

// app related imports
const { retrieveUser } = require("./middelwares/auth");
const staticRouter = require("./routers/staticRouter");
const userRouter = require("./routers/userRouter");
const dbConnect = require("./connection");
const roomRouter = require("./routers/roomRouter");
const meetingRouter = require("./routers/meetingRouter");

// db connection
dbConnect();

// app intialization
const app = express();

// settings
app.set("view engine", "ejs");
app.use(express.static("public"));

// middlewares
app.use(express.json());
app.use(cookieParser())
app.use(retrieveUser());

// routes
app.use("/", staticRouter);
app.use("/api/auth/", userRouter);
app.use("/api/room/", roomRouter);
app.use("/api/meeting/", meetingRouter);


// server
app.listen(8000, () => {
    console.log("Server started on port 8000");
});
