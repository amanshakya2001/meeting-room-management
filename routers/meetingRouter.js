const { Router } = require("express");
const { createMeeting, getAllMeetings, getMeeting, updateMeeting, deleteMeeting } = require("../controllers/meeting");
const { checkPermission } = require("../middelwares/auth");
const meetingRouter = Router();

meetingRouter.get("/",checkPermission(["admin","manager"]), getAllMeetings);
meetingRouter.get("/:id",checkPermission(["admin","manager"]), getMeeting);
meetingRouter.post("/",checkPermission(["admin","manager"]), createMeeting);
meetingRouter.put("/:id",checkPermission(["admin","manager"]), updateMeeting);
meetingRouter.delete("/:id",checkPermission(["admin","manager"]), deleteMeeting);

module.exports = meetingRouter;