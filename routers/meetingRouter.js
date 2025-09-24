const { Router } = require("express");
const { createMeeting, getAllMeetings, getMeeting, updateMeeting, deleteMeeting, approveMeeting } = require("../controllers/meeting");
const { checkPermission } = require("../middelwares/auth");
const meetingRouter = Router();

meetingRouter.get("/", checkPermission(["admin","manager"]), getAllMeetings);
meetingRouter.get("/:id", checkPermission(["admin","manager"]), getMeeting);
meetingRouter.post("/", createMeeting);
meetingRouter.put("/:id", updateMeeting);
meetingRouter.delete("/:id", deleteMeeting);
meetingRouter.put("/approve/:id", checkPermission(["admin","manager"]), approveMeeting);

module.exports = meetingRouter;