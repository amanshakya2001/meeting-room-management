const { Router } = require("express");
const { userAlreadyLoggedIn, authenticate } = require("../middelwares/auth");
const { homePage, loginPage, signupPage, bookMeetingPage, updateRoomPage, updateMeetingPage } = require("../controllers/static");
const { createRoomPage } = require("../controllers/static");
const staticRouter = Router();

staticRouter.get("/", authenticate(), homePage);
staticRouter.get("/login", userAlreadyLoggedIn(), loginPage);
staticRouter.get("/signup", userAlreadyLoggedIn(), signupPage);
staticRouter.get("/room",authenticate(),createRoomPage);
staticRouter.get("/room/:id",authenticate(),updateRoomPage);
staticRouter.get("/meeting", authenticate(), bookMeetingPage);
staticRouter.get("/meeting/:id", authenticate(), updateMeetingPage);

module.exports = staticRouter;