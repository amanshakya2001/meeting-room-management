const { Router } = require('express');
const roomRouter = Router();
const { createRoom, checkAvailability, getAllRooms, getRoom, updateRoom, deleteRoom } = require('../controllers/room');
const { checkPermission } = require('../middelwares/auth');

roomRouter.get("/",checkPermission(["admin"]), getAllRooms);
roomRouter.get("/:id",checkPermission(["admin"]), getRoom);
roomRouter.post("/", checkPermission(["admin"]), createRoom);
roomRouter.put("/:id", checkPermission(["admin"]), updateRoom);
roomRouter.delete("/:id", checkPermission(["admin"]), deleteRoom);
roomRouter.post("/available", checkPermission(["admin","manager"]), checkAvailability);

module.exports = roomRouter;