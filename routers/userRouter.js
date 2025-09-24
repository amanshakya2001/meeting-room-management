// nodejs import
const { Router } = require("express");
const userRouter = Router();

// controller import
const { login, signup, logout, getUser, updateRole } = require("../controllers/user");
const { checkPermission } = require("../middelwares/auth");
// routes
userRouter.get("/session", getUser);
userRouter.post("/login", login);
userRouter.post("/signup", signup);
userRouter.get("/logout", logout);
userRouter.put("/update-role", checkPermission(["admin"]), updateRole);
// export
module.exports = userRouter;